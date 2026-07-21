import type { N8nIntegration } from "@/domain/entities/n8n-integration.entity";
import type { IntegrationExecutionResult } from "@/domain/entities/integration-execution-log.entity";
import type {
  CreateIntegrationExecutionLogInput,
  IntegrationExecutionLogRepository,
} from "@/domain/repositories-interfaces/integration-execution-log-repository.interface";

export interface N8nExecutionContext {
  integration: N8nIntegration;
  /** Credencial descifrada, obtenida por el llamador mediante el repositorio; nunca transita por el dominio. */
  credentials: string | null;
  /** Nulo cuando se trata de una prueba de conexión sin ningún widget asociado todavía. */
  widgetId?: string | null;
  conversationId?: string | null;
  payload: Record<string, unknown>;
}

export interface N8nExecutionOutcome {
  success: boolean;
  content: string | null;
  statusCode: number | null;
  responseBody: unknown;
  errorMessage: string | null;
  attempts: number;
}

function getByPath(source: unknown, path: string): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function interpolate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) => {
    const value = getByPath(variables, key);
    return value === undefined || value === null ? match : String(value);
  });
}

function applyAuth(
  headers: Record<string, string>,
  authType: N8nIntegration["authType"],
  credentials: string | null,
): Record<string, string> {
  if (!credentials) return headers;
  switch (authType) {
    case "token":
      return { ...headers, Authorization: `Bearer ${credentials}` };
    case "cabecera_estatica":
      return { ...headers, "X-Webhook-Auth": credentials };
    case "básica":
      return {
        ...headers,
        Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
      };
    default:
      return headers;
  }
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractContent(body: unknown, contentField: string): string | null {
  if (!contentField) return typeof body === "string" ? body : null;
  const value = getByPath(body, contentField);
  if (value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Módulo técnico de integración con n8n (sección 6.6): construye la
 * solicitud HTTP interpolando variables dinámicas, la ejecuta aplicando
 * timeout y reintentos, registra cada ejecución (éxito, fallo, tiempo de
 * respuesta, código de estado) en integration_execution_logs, y normaliza
 * la respuesta o el error hacia el caso de uso que orquesta la conversación.
 * Único punto del sistema que se comunica con un Webhook de n8n.
 */
export class N8nIntegrationService {
  constructor(
    private readonly executionLogs: IntegrationExecutionLogRepository,
  ) {}

  async execute(context: N8nExecutionContext): Promise<N8nExecutionOutcome> {
    const { integration, credentials, widgetId, conversationId, payload } =
      context;

    const variables = { ...payload, ...integration.dynamicVariables };
    const url = interpolate(integration.webhookUrl, variables);

    let headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(integration.headers)) {
      headers[key] = interpolate(value, variables);
    }
    headers = applyAuth(headers, integration.authType, credentials);
    if (!headers["Content-Type"] && integration.httpMethod !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    const bodyText =
      integration.httpMethod === "GET" ? undefined : JSON.stringify(payload);

    const maxAttempts = Math.max(1, integration.retryCount + 1);
    let lastError: string | null = null;
    let lastStatusCode: number | null = null;
    let lastResponseBody: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeoutHandle = setTimeout(
        () => controller.abort(),
        integration.timeoutMs,
      );

      try {
        const response = await fetch(url, {
          method: integration.httpMethod,
          headers,
          body: bodyText,
          signal: controller.signal,
        });
        clearTimeout(timeoutHandle);

        const durationMs = Date.now() - startedAt;
        const responseText = await response.text();
        let responseBody: unknown = responseText;
        try {
          responseBody = responseText ? JSON.parse(responseText) : null;
        } catch {
          // La respuesta no es JSON válido; se conserva como texto plano.
        }

        const result: IntegrationExecutionResult = response.ok
          ? "éxito"
          : "error";
        await this.log({
          integrationId: integration.id,
          widgetId,
          conversationId,
          requestPayload: payload,
          responsePayload: isJsonRecord(responseBody)
            ? responseBody
            : { raw: String(responseBody) },
          statusCode: response.status,
          durationMs,
          attemptNumber: attempt,
          result,
        });

        if (response.ok) {
          const content = extractContent(
            responseBody,
            integration.expectedResponseFormat.contentField,
          );
          return {
            success: true,
            content,
            statusCode: response.status,
            responseBody,
            errorMessage: null,
            attempts: attempt,
          };
        }

        lastStatusCode = response.status;
        lastResponseBody = responseBody;
        lastError = `El Webhook respondió con estado ${response.status}.`;
      } catch (error) {
        clearTimeout(timeoutHandle);
        const durationMs = Date.now() - startedAt;
        const isAbort = error instanceof Error && error.name === "AbortError";
        const result: IntegrationExecutionResult = isAbort
          ? "tiempo_agotado"
          : "error";
        lastError = isAbort
          ? "El Webhook no respondió dentro del tiempo máximo configurado."
          : "No se pudo establecer conexión con el Webhook.";

        await this.log({
          integrationId: integration.id,
          widgetId,
          conversationId,
          requestPayload: payload,
          responsePayload: null,
          statusCode: null,
          durationMs,
          attemptNumber: attempt,
          result,
        });
      }

      if (attempt < maxAttempts) {
        await sleep(integration.retryBackoffMs);
      }
    }

    return {
      success: false,
      content: null,
      statusCode: lastStatusCode,
      responseBody: lastResponseBody,
      errorMessage: lastError,
      attempts: maxAttempts,
    };
  }

  // El resultado de la ejecución del Webhook debe devolverse al llamante
  // aunque el registro en integration_execution_logs falle (por ejemplo, si
  // el cliente de servicio no está configurado en este entorno); el
  // registro es un mecanismo de auditoría y no debe bloquear la prueba de
  // conexión ni el flujo conversacional.
  private async log(input: CreateIntegrationExecutionLogInput): Promise<void> {
    try {
      await this.executionLogs.create(input);
    } catch (error) {
      console.error("No se pudo registrar la ejecución de la integración:", error);
    }
  }
}

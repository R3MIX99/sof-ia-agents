import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseN8nIntegrationRepository } from "@/infrastructure/supabase/repositories/n8n-integration.repository";
import { SupabaseWidgetIntegrationRepository } from "@/infrastructure/supabase/repositories/widget-integration.repository";
import { SupabaseIntegrationExecutionLogRepository } from "@/infrastructure/supabase/repositories/integration-execution-log.repository";
import { SupabaseWidgetRepository } from "@/infrastructure/supabase/repositories/widget.repository";
import { N8nIntegrationService } from "@/providers/n8n/n8n-integration.service";
import type { N8nIntegration } from "@/domain/entities/n8n-integration.entity";
import type { WidgetIntegration } from "@/domain/entities/widget-integration.entity";
import type { IntegrationExecutionLog } from "@/domain/entities/integration-execution-log.entity";
import type {
  CreateN8nIntegrationInput,
  UpdateN8nIntegrationInput,
} from "@/domain/repositories-interfaces/n8n-integration-repository.interface";
import type {
  CreateWidgetIntegrationInput,
  UpdateWidgetIntegrationInput,
} from "@/domain/repositories-interfaces/widget-integration-repository.interface";
import { ApiError } from "@/lib/http/api-error";

export interface IntegrationTestResult {
  success: boolean;
  content: string | null;
  statusCode: number | null;
  errorMessage: string | null;
  attempts: number;
}

export class IntegrationService {
  private readonly integrations: SupabaseN8nIntegrationRepository;
  private readonly widgetIntegrations: SupabaseWidgetIntegrationRepository;
  private readonly executionLogs: SupabaseIntegrationExecutionLogRepository;
  private readonly widgets: SupabaseWidgetRepository;
  private readonly webhookClient: N8nIntegrationService;

  constructor(client: SupabaseClient<Database>) {
    this.integrations = new SupabaseN8nIntegrationRepository(client);
    this.widgetIntegrations = new SupabaseWidgetIntegrationRepository(client);
    this.executionLogs = new SupabaseIntegrationExecutionLogRepository(client);
    this.widgets = new SupabaseWidgetRepository(client);
    this.webhookClient = new N8nIntegrationService(this.executionLogs);
  }

  async listByOrganization(
    organizationId: string,
  ): Promise<N8nIntegration[]> {
    return this.integrations.findByOrganizationId(organizationId);
  }

  async getById(id: string): Promise<N8nIntegration | null> {
    return this.integrations.findById(id);
  }

  async create(input: CreateN8nIntegrationInput): Promise<N8nIntegration> {
    return this.integrations.create(input);
  }

  async update(
    id: string,
    input: UpdateN8nIntegrationInput,
  ): Promise<N8nIntegration> {
    return this.integrations.update(id, input);
  }

  async delete(id: string): Promise<void> {
    return this.integrations.delete(id);
  }

  async listExecutions(
    integrationId: string,
    limit?: number,
  ): Promise<IntegrationExecutionLog[]> {
    return this.executionLogs.findByIntegrationId(integrationId, limit);
  }

  /**
   * Panel de pruebas de conexión (sección 9.5): ejecuta el Webhook con un
   * payload normalizado de verificación (estructura de la sección 6.4), sin
   * requerir que la integración esté asociada a ningún widget todavía. El
   * disparo real desde una conversación en vivo llega en la Fase 6.
   */
  async testConnection(
    integrationId: string,
    widgetId?: string | null,
  ): Promise<IntegrationTestResult> {
    const integration = await this.integrations.findById(integrationId);
    if (!integration) {
      throw new ApiError(
        "not_found",
        "integration_not_found",
        "No se encontró la integración.",
        404,
      );
    }

    let widgetName = "Widget de prueba";
    if (widgetId) {
      const widget = await this.widgets.findById(widgetId);
      if (widget) widgetName = widget.name;
    }

    let credentials: string | null = null;
    if (integration.authType !== "ninguna") {
      try {
        credentials =
          await this.integrations.getDecryptedCredentials(integrationId);
      } catch {
        throw new ApiError(
          "internal",
          "admin_client_unavailable",
          "La prueba de conexión con autenticación no está configurada en este entorno.",
          501,
        );
      }
    }

    const payload = {
      visitor_id: "prueba-visitante",
      session_id: "prueba-sesion",
      conversation_id: null,
      history: [] as unknown[],
      message:
        "Este es un mensaje de prueba enviado desde el panel de Integraciones n8n.",
      variables: integration.dynamicVariables,
      metadata: {
        source: "prueba_de_conexion",
        user_agent: "Sof.ia Dashboard",
        language: "es-419",
      },
      domain: "panel-de-administración",
      widget_id: widgetId ?? null,
      widget_name: widgetName,
      organization_id: integration.organizationId,
      timestamp: new Date().toISOString(),
    };

    const outcome = await this.webhookClient.execute({
      integration,
      credentials,
      widgetId: widgetId ?? null,
      payload,
    });

    return {
      success: outcome.success,
      content: outcome.content,
      statusCode: outcome.statusCode,
      errorMessage: outcome.errorMessage,
      attempts: outcome.attempts,
    };
  }

  /**
   * Ejecuta una integración dentro del caso de uso de procesamiento
   * conversacional (secciones 6.3 a 6.5, Fase 6), con el payload normalizado
   * real de la conversación en curso.
   */
  async runForConversation(
    integrationId: string,
    context: {
      widgetId: string;
      conversationId: string | null;
      payload: Record<string, unknown>;
    },
  ): Promise<IntegrationTestResult> {
    const integration = await this.integrations.findById(integrationId);
    if (!integration) {
      throw new ApiError(
        "not_found",
        "integration_not_found",
        "No se encontró la integración.",
        404,
      );
    }

    let credentials: string | null = null;
    if (integration.authType !== "ninguna") {
      try {
        credentials =
          await this.integrations.getDecryptedCredentials(integrationId);
      } catch {
        credentials = null;
      }
    }

    const outcome = await this.webhookClient.execute({
      integration,
      credentials,
      widgetId: context.widgetId,
      conversationId: context.conversationId,
      payload: context.payload,
    });

    return {
      success: outcome.success,
      content: outcome.content,
      statusCode: outcome.statusCode,
      errorMessage: outcome.errorMessage,
      attempts: outcome.attempts,
    };
  }

  async listWidgetIntegrations(widgetId: string): Promise<WidgetIntegration[]> {
    return this.widgetIntegrations.findByWidgetId(widgetId);
  }

  async getWidgetIntegrationById(
    id: string,
  ): Promise<WidgetIntegration | null> {
    return this.widgetIntegrations.findById(id);
  }

  async associateWidget(
    input: CreateWidgetIntegrationInput,
  ): Promise<WidgetIntegration> {
    return this.widgetIntegrations.create(input);
  }

  async updateWidgetIntegration(
    id: string,
    input: UpdateWidgetIntegrationInput,
  ): Promise<WidgetIntegration> {
    return this.widgetIntegrations.update(id, input);
  }

  async disassociateWidget(id: string): Promise<void> {
    return this.widgetIntegrations.delete(id);
  }
}

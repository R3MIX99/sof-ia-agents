import type { SessionRepository } from "@/domain/repositories-interfaces/session-repository.interface";
import type { ConversationRepository } from "@/domain/repositories-interfaces/conversation-repository.interface";
import type { MessageRepository } from "@/domain/repositories-interfaces/message-repository.interface";
import type { WidgetIntegrationRepository } from "@/domain/repositories-interfaces/widget-integration-repository.interface";
import type { N8nIntegrationRepository } from "@/domain/repositories-interfaces/n8n-integration-repository.interface";
import type { IntegrationExecutionLogRepository } from "@/domain/repositories-interfaces/integration-execution-log-repository.interface";
import type { ProviderConfigRepository } from "@/domain/repositories-interfaces/provider-config-repository.interface";
import type { EventLogRepository } from "@/domain/repositories-interfaces/event-log-repository.interface";
import type { Widget } from "@/domain/entities/widget.entity";
import type { N8nIntegration } from "@/domain/entities/n8n-integration.entity";
import { AIProviderFactory } from "@/providers/ai/factory/ai-provider.factory";
import {
  AIProviderError,
  type AIMessage,
  type AIModelParameters,
  type AIProvider,
} from "@/providers/ai/interfaces/ai-provider.interface";
import {
  N8nIntegrationService,
  type N8nExecutionOutcome,
} from "@/providers/n8n/n8n-integration.service";
import { ApiError } from "@/lib/http/api-error";

export interface ProcessMessageInput {
  widget: Widget;
  sessionId: string;
  visitorMessage: string;
  domain: string;
  userAgent: string | null;
  /** Cuando se provee, el contenido del asistente se transmite progresivamente a través de este callback (sección 12.1, streaming). */
  onDelta?: (delta: string) => void;
}

export interface ProcessMessageResult {
  conversationId: string;
  assistantMessage: string;
  visitorNameCaptured: string | null;
}

export interface ProcessConversationalMessageDependencies {
  sessions: SessionRepository;
  conversations: ConversationRepository;
  messages: MessageRepository;
  widgetIntegrations: WidgetIntegrationRepository;
  n8nIntegrations: N8nIntegrationRepository;
  executionLogs: IntegrationExecutionLogRepository;
  providerConfigs: ProviderConfigRepository;
  eventLogs: EventLogRepository;
}

const GENERIC_ERROR_MESSAGE =
  "No fue posible procesar tu mensaje en este momento. Por favor, inténtalo de nuevo en unos instantes.";

/**
 * Caso de uso de procesamiento conversacional (secciones 12.4, 12.5 y 17,
 * pasos 14 a 21). Orquesta las integraciones de n8n asociadas al widget, el
 * proveedor de IA configurado a través de AIProviderFactory, la persistencia
 * inmediata de la conversación y sus mensajes, y la captura de la identidad
 * del visitante. No importa Next.js ni el SDK de Supabase: recibe todas sus
 * dependencias como interfaces de repositorio inyectadas por el llamador.
 */
export class ProcessConversationalMessageUseCase {
  constructor(private readonly deps: ProcessConversationalMessageDependencies) {}

  async execute(input: ProcessMessageInput): Promise<ProcessMessageResult> {
    const { widget } = input;

    const session = await this.deps.sessions.findById(input.sessionId);
    if (!session) {
      throw new ApiError(
        "not_found",
        "session_not_found",
        "No se encontró la sesión.",
        404,
      );
    }

    if (!widget.providerConfigId) {
      throw new ApiError(
        "validation",
        "provider_config_missing",
        "Este widget no tiene un proveedor de inteligencia artificial configurado.",
        400,
      );
    }

    const providerConfig = await this.deps.providerConfigs.findById(
      widget.providerConfigId,
    );
    if (!providerConfig) {
      throw new ApiError(
        "validation",
        "provider_config_missing",
        "Este widget no tiene un proveedor de inteligencia artificial configurado.",
        400,
      );
    }

    let conversation = await this.deps.conversations.findOpenBySessionId(
      session.id,
    );
    if (!conversation) {
      conversation = await this.deps.conversations.create({
        widgetId: widget.id,
        sessionId: session.id,
        visitorName: session.visitorName,
      });
    }

    let nextSequence =
      (await this.deps.messages.countByConversationId(conversation.id)) + 1;

    await this.deps.messages.create({
      conversationId: conversation.id,
      role: "usuario",
      content: input.visitorMessage,
      contentFormat: "texto simple",
      sequenceNumber: nextSequence++,
    });

    const history = await this.deps.messages.findByConversationId(
      conversation.id,
    );

    const credentials = await this.deps.providerConfigs.getDecryptedCredentials(
      providerConfig.id,
    );
    const aiProvider = AIProviderFactory.create(providerConfig.provider);
    const n8nService = new N8nIntegrationService(this.deps.executionLogs);

    const widgetIntegrations = (
      await this.deps.widgetIntegrations.findByWidgetId(widget.id)
    ).sort((a, b) => a.executionOrder - b.executionOrder);

    const basePayload: Record<string, unknown> = {
      visitor_id: session.visitorIdentifier,
      session_id: session.id,
      conversation_id: conversation.id,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      message: input.visitorMessage,
      variables: {},
      metadata: { user_agent: input.userAgent, language: widget.language },
      domain: input.domain,
      widget_id: widget.id,
      organization_id: widget.organizationId,
      timestamp: new Date().toISOString(),
    };

    // Integraciones de acción independiente (sección 6.3): no condicionan el
    // resto del flujo; su resultado, si produce contenido, se persiste como
    // un mensaje de rol "integración" antes de consultar al proveedor de IA.
    for (const wi of widgetIntegrations.filter(
      (w) => w.triggerPoint === "independiente",
    )) {
      const integration = await this.deps.n8nIntegrations.findById(
        wi.integrationId,
      );
      if (!integration || integration.status !== "activa") continue;
      const outcome = await this.runIntegration(
        n8nService,
        integration,
        widget.organizationId,
        widget.id,
        conversation.id,
        basePayload,
      );
      if (outcome.success && outcome.content) {
        nextSequence = await this.persistIntegrationMessage(
          conversation.id,
          outcome.content,
          nextSequence,
        );
      }
    }

    // Integraciones previas al proveedor de IA (sección 6.5): su resultado
    // se combina como contexto adicional del mensaje de sistema.
    let systemPromptAddendum = "";
    let interrupted = false;

    for (const wi of widgetIntegrations.filter(
      (w) => w.triggerPoint === "antes_ia",
    )) {
      const integration = await this.deps.n8nIntegrations.findById(
        wi.integrationId,
      );
      if (!integration || integration.status !== "activa") continue;
      const outcome = await this.runIntegration(
        n8nService,
        integration,
        widget.organizationId,
        widget.id,
        conversation.id,
        basePayload,
      );
      if (outcome.success && outcome.content) {
        systemPromptAddendum += `\n\nContexto adicional de "${integration.name}": ${outcome.content}`;
      } else if (!outcome.success && integration.errorHandlingStrategy === "interrumpir") {
        interrupted = true;
        break;
      }
    }

    let assistantContent: string;
    let inputTokens = 0;
    let outputTokens = 0;
    let latencyMs = 0;

    if (interrupted) {
      assistantContent = GENERIC_ERROR_MESSAGE;
    } else {
      const aiMessages: AIMessage[] = history.map((m) => ({
        role: toAiRole(m.role),
        content: m.content,
      }));
      aiMessages.push({ role: "user", content: input.visitorMessage });

      const params: AIModelParameters = {
        model: providerConfig.model,
        temperature: providerConfig.defaultTemperature ?? undefined,
        maxOutputTokens: providerConfig.defaultMaxTokens ?? undefined,
        systemPrompt:
          (widget.systemPrompt ?? providerConfig.defaultSystemPrompt ?? "") +
          systemPromptAddendum,
      };

      try {
        if (input.onDelta) {
          let full = "";
          for await (const chunk of aiProvider.streamMessage(
            aiMessages,
            params,
            credentials,
          )) {
            if (chunk.type === "content_delta") {
              full += chunk.delta;
              input.onDelta(chunk.delta);
            } else {
              inputTokens = chunk.usage.inputTokens;
              outputTokens = chunk.usage.outputTokens;
              latencyMs = chunk.latencyMs;
            }
          }
          assistantContent = full;
        } else {
          const result = await aiProvider.sendMessage(
            aiMessages,
            params,
            credentials,
          );
          assistantContent = result.content;
          inputTokens = result.usage.inputTokens;
          outputTokens = result.usage.outputTokens;
          latencyMs = result.latencyMs;
        }
      } catch (error) {
        if (error instanceof AIProviderError) {
          assistantContent = GENERIC_ERROR_MESSAGE;
          await this.deps.eventLogs.create({
            organizationId: widget.organizationId,
            widgetId: widget.id,
            eventType: "error de proveedor de IA",
            severity: "error",
            source: "proveedor",
            details: {
              conversationId: conversation.id,
              provider: providerConfig.provider,
              message: error.message,
            },
          });
        } else {
          throw error;
        }
      }
    }

    await this.deps.messages.create({
      conversationId: conversation.id,
      role: "asistente",
      content: assistantContent,
      contentFormat: "markdown",
      tokensInput: inputTokens,
      tokensOutput: outputTokens,
      latencyMs,
      sequenceNumber: nextSequence++,
    });

    // Integraciones posteriores al proveedor de IA.
    if (!interrupted) {
      for (const wi of widgetIntegrations.filter(
        (w) => w.triggerPoint === "después_ia",
      )) {
        const integration = await this.deps.n8nIntegrations.findById(
          wi.integrationId,
        );
        if (!integration || integration.status !== "activa") continue;
        const outcome = await this.runIntegration(
          n8nService,
          integration,
          widget.organizationId,
          widget.id,
          conversation.id,
          { ...basePayload, message: assistantContent },
        );
        if (outcome.success && outcome.content) {
          nextSequence = await this.persistIntegrationMessage(
            conversation.id,
            outcome.content,
            nextSequence,
          );
        } else if (!outcome.success && integration.errorHandlingStrategy === "interrumpir") {
          break;
        }
      }
    }

    // Captura de identidad del visitante (sección 12.5).
    let visitorNameCaptured: string | null = null;
    if (!session.visitorName) {
      const lastAssistantMessage =
        [...history].reverse().find((m) => m.role === "asistente")?.content ??
        null;
      if (lastAssistantMessage) {
        const extracted = await this.extractVisitorName(
          aiProvider,
          credentials,
          providerConfig.model,
          lastAssistantMessage,
          input.visitorMessage,
        );
        if (extracted) {
          await this.deps.sessions.updateVisitorName(session.id, extracted);
          await this.deps.conversations.updateVisitorName(
            conversation.id,
            extracted,
          );
          visitorNameCaptured = extracted;
        }
      }
    }

    await this.deps.sessions.touch(session.id);

    return {
      conversationId: conversation.id,
      assistantMessage: assistantContent,
      visitorNameCaptured,
    };
  }

  private async runIntegration(
    n8nService: N8nIntegrationService,
    integration: N8nIntegration,
    organizationId: string,
    widgetId: string,
    conversationId: string,
    payload: Record<string, unknown>,
  ): Promise<N8nExecutionOutcome> {
    let credentials: string | null = null;
    if (integration.authType !== "ninguna") {
      try {
        credentials = await this.deps.n8nIntegrations.getDecryptedCredentials(
          integration.id,
        );
      } catch {
        credentials = null;
      }
    }
    const outcome = await n8nService.execute({
      integration,
      credentials,
      widgetId,
      conversationId,
      payload,
    });

    if (!outcome.success) {
      await this.deps.eventLogs.create({
        organizationId,
        widgetId,
        eventType: "fallo de integración n8n",
        severity: "error",
        source: "integración n8n",
        details: {
          integrationId: integration.id,
          integrationName: integration.name,
          conversationId,
          error: outcome.errorMessage,
        },
      });
    }

    return outcome;
  }

  private async persistIntegrationMessage(
    conversationId: string,
    content: string,
    sequenceNumber: number,
  ): Promise<number> {
    await this.deps.messages.create({
      conversationId,
      role: "integración",
      content,
      contentFormat: "texto simple",
      sequenceNumber,
    });
    return sequenceNumber + 1;
  }

  /** Usa el mismo AIProvider configurado para el widget como mecanismo de extracción del nombre del visitante (sección 12.5), sin un servicio de reconocimiento de entidades independiente. */
  private async extractVisitorName(
    aiProvider: AIProvider,
    credentials: string,
    model: string,
    lastAssistantMessage: string,
    visitorMessage: string,
  ): Promise<string | null> {
    const extractionMessages: AIMessage[] = [
      {
        role: "user",
        content: `Mensaje anterior del asistente: "${lastAssistantMessage}"\nRespuesta del visitante: "${visitorMessage}"\n\nSi el visitante proporcionó su nombre propio en respuesta a una solicitud de nombre por parte del asistente, responde ÚNICAMENTE con ese nombre, sin texto adicional. Si no aplica o no hay un nombre identificable con confianza suficiente, responde ÚNICAMENTE con la palabra NINGUNO.`,
      },
    ];

    try {
      const result = await aiProvider.sendMessage(
        extractionMessages,
        {
          model,
          temperature: 0,
          maxOutputTokens: 20,
          systemPrompt:
            "Extraes nombres propios de conversaciones de forma extremadamente breve y precisa. Nunca infieres ni solicitas ningún otro dato personal.",
        },
        credentials,
      );
      const raw = result.content.trim();
      if (
        !raw ||
        /^NINGUNO$/i.test(raw) ||
        raw.length > 60 ||
        raw.split(/\s+/).length > 4
      ) {
        return null;
      }
      return raw;
    } catch {
      return null;
    }
  }
}

function toAiRole(role: string): AIMessage["role"] {
  if (role === "usuario") return "user";
  if (role === "sistema") return "system";
  // Los mensajes de asistente e integración se presentan al modelo como
  // contenido ya mostrado al visitante, manteniendo la coherencia del hilo.
  return "assistant";
}

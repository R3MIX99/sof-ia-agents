import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { IntegrationService } from "@/services/integrations/integration.service";
import { SupabaseProviderConfigRepository } from "@/infrastructure/supabase/repositories/provider-config.repository";
import { AIProviderFactory } from "@/providers/ai/factory/ai-provider.factory";
import {
  AIProviderError,
  type AIMessage,
  type AIModelParameters,
} from "@/providers/ai/interfaces/ai-provider.interface";
import type { Widget } from "@/domain/entities/widget.entity";
import type { WidgetIntegrationTriggerPoint } from "@/domain/entities/widget-integration.entity";
import { ApiError } from "@/lib/http/api-error";

export interface TestChatMessage {
  role: "usuario" | "asistente";
  content: string;
}

export interface TestChatIntegrationNote {
  position: WidgetIntegrationTriggerPoint;
  integrationName: string;
  success: boolean;
  content: string | null;
  errorMessage: string | null;
}

export interface TestChatResult {
  content: string;
  integrationNotes: TestChatIntegrationNote[];
}

const GENERIC_ERROR_MESSAGE =
  "No fue posible procesar tu mensaje en este momento. Por favor, inténtalo de nuevo en unos instantes.";

/**
 * Orquesta un turno del panel de prueba en vivo del dashboard (sección 11):
 * ejecuta integraciones n8n reales y llama al proveedor de IA real con las
 * mismas reglas de disparo que el flujo conversacional público, pero sin
 * persistir sesión, conversación, mensajes ni eventos — nada de esto debe
 * reflejarse en Analíticas, Logs ni Historial. Los fallos de integración se
 * devuelven visibles en vez de silenciarse, porque el propósito del panel es
 * depurar la configuración del widget.
 */
export class WidgetTestChatService {
  private readonly integrations: IntegrationService;
  private readonly providerConfigs: SupabaseProviderConfigRepository;

  constructor(client: SupabaseClient<Database>) {
    this.integrations = new IntegrationService(client);
    this.providerConfigs = new SupabaseProviderConfigRepository(client);
  }

  async sendMessage(
    widget: Widget,
    history: TestChatMessage[],
    message: string,
  ): Promise<TestChatResult> {
    if (!widget.providerConfigId) {
      throw new ApiError(
        "validation",
        "provider_config_missing",
        "Este widget no tiene un proveedor de inteligencia artificial configurado.",
        400,
      );
    }

    const providerConfig = await this.providerConfigs.findById(
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

    const widgetIntegrations = (
      await this.integrations.listWidgetIntegrations(widget.id)
    ).sort((a, b) => a.executionOrder - b.executionOrder);

    const basePayload: Record<string, unknown> = {
      visitor_id: "prueba-dashboard",
      session_id: "prueba-dashboard",
      conversation_id: null,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      message,
      variables: {},
      metadata: { source: "panel_de_prueba", language: widget.language },
      domain: "panel-de-administración",
      widget_id: widget.id,
      organization_id: widget.organizationId,
      timestamp: new Date().toISOString(),
    };

    const integrationNotes: TestChatIntegrationNote[] = [];

    for (const wi of widgetIntegrations.filter(
      (w) => w.triggerPoint === "independiente",
    )) {
      const integration = await this.integrations.getById(wi.integrationId);
      if (!integration || integration.status !== "activa") continue;
      const outcome = await this.integrations.runForConversation(
        wi.integrationId,
        { widgetId: widget.id, conversationId: null, payload: basePayload },
      );
      integrationNotes.push({
        position: "independiente",
        integrationName: integration.name,
        success: outcome.success,
        content: outcome.content,
        errorMessage: outcome.errorMessage,
      });
    }

    let systemPromptAddendum = "";
    let interrupted = false;

    for (const wi of widgetIntegrations.filter(
      (w) => w.triggerPoint === "antes_ia",
    )) {
      const integration = await this.integrations.getById(wi.integrationId);
      if (!integration || integration.status !== "activa") continue;
      const outcome = await this.integrations.runForConversation(
        wi.integrationId,
        { widgetId: widget.id, conversationId: null, payload: basePayload },
      );
      integrationNotes.push({
        position: "antes_ia",
        integrationName: integration.name,
        success: outcome.success,
        content: outcome.content,
        errorMessage: outcome.errorMessage,
      });
      if (outcome.success && outcome.content) {
        systemPromptAddendum += `\n\nContexto adicional de "${integration.name}": ${outcome.content}`;
      } else if (
        !outcome.success &&
        integration.errorHandlingStrategy === "interrumpir"
      ) {
        interrupted = true;
        break;
      }
    }

    let assistantContent: string;

    if (interrupted) {
      assistantContent = GENERIC_ERROR_MESSAGE;
    } else {
      const credentials = await this.providerConfigs.getDecryptedCredentials(
        providerConfig.id,
      );
      const aiProvider = AIProviderFactory.create(providerConfig.provider);

      const aiMessages: AIMessage[] = history.map((m) => ({
        role: m.role === "usuario" ? "user" : "assistant",
        content: m.content,
      }));
      aiMessages.push({ role: "user", content: message });

      const params: AIModelParameters = {
        model: providerConfig.model,
        temperature: providerConfig.defaultTemperature ?? undefined,
        maxOutputTokens: providerConfig.defaultMaxTokens ?? undefined,
        systemPrompt:
          (widget.systemPrompt ?? providerConfig.defaultSystemPrompt ?? "") +
          systemPromptAddendum,
      };

      try {
        const result = await aiProvider.sendMessage(
          aiMessages,
          params,
          credentials,
        );
        assistantContent = result.content;
      } catch (error) {
        if (error instanceof AIProviderError) {
          assistantContent = GENERIC_ERROR_MESSAGE;
        } else {
          throw error;
        }
      }
    }

    if (!interrupted) {
      for (const wi of widgetIntegrations.filter(
        (w) => w.triggerPoint === "después_ia",
      )) {
        const integration = await this.integrations.getById(wi.integrationId);
        if (!integration || integration.status !== "activa") continue;
        const outcome = await this.integrations.runForConversation(
          wi.integrationId,
          {
            widgetId: widget.id,
            conversationId: null,
            payload: { ...basePayload, message: assistantContent },
          },
        );
        integrationNotes.push({
          position: "después_ia",
          integrationName: integration.name,
          success: outcome.success,
          content: outcome.content,
          errorMessage: outcome.errorMessage,
        });
        if (
          !outcome.success &&
          integration.errorHandlingStrategy === "interrumpir"
        ) {
          break;
        }
      }
    }

    return { content: assistantContent, integrationNotes };
  }
}

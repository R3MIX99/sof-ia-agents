import type { NextRequest } from "next/server";
import { requireWithinRateLimit } from "@/middleware/rate-limit.middleware";
import { parseJsonBody, requireString, requireUuid } from "@/lib/validation/validate";
import { extractHostnameFromOrigin } from "@/lib/validation/domain-matcher";
import {
  buildCorsHeaders,
  corsJsonError,
  corsPreflightResponse,
} from "@/lib/http/cors";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin";
import { WidgetPublicAccessService } from "@/services/widgets/widget-public-access.service";
import { SupabaseSessionRepository } from "@/infrastructure/supabase/repositories/session.repository";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/repositories/conversation.repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/repositories/message.repository";
import { SupabaseWidgetIntegrationRepository } from "@/infrastructure/supabase/repositories/widget-integration.repository";
import { SupabaseN8nIntegrationRepository } from "@/infrastructure/supabase/repositories/n8n-integration.repository";
import { SupabaseIntegrationExecutionLogRepository } from "@/infrastructure/supabase/repositories/integration-execution-log.repository";
import { SupabaseProviderConfigRepository } from "@/infrastructure/supabase/repositories/provider-config.repository";
import { SupabaseEventLogRepository } from "@/infrastructure/supabase/repositories/event-log.repository";
import { ProcessConversationalMessageUseCase } from "@/domain/use-cases/process-conversational-message.use-case";
import type { Widget } from "@/domain/entities/widget.entity";
import type { Session } from "@/domain/entities/session.entity";
import { ApiError } from "@/lib/http/api-error";

export function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request.headers.get("origin") ?? "*");
}

/**
 * Endpoint público invocado por el widget embebido para enviar un mensaje
 * del visitante y recibir la respuesta procesada, con soporte de streaming
 * (sección 16.4). Transmite la respuesta como Server-Sent Events.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  const originHostname = extractHostnameFromOrigin(request.headers.get("origin"));

  let sessionId: string;
  let visitorMessage: string;
  try {
    requireWithinRateLimit(request, "messages:send", 30, 60_000);
    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    sessionId = requireUuid(body.sessionId, "sessionId");
    visitorMessage = requireString(body.message, "message");
  } catch (error) {
    return corsJsonError(error, origin);
  }

  const admin = createSupabaseAdminClient();
  const sessions = new SupabaseSessionRepository(admin);

  let session: Session;
  let widget: Widget;
  try {
    const found = await sessions.findById(sessionId);
    if (!found) {
      throw new ApiError(
        "not_found",
        "session_not_found",
        "No se encontró la sesión.",
        404,
      );
    }
    if (found.status !== "activa") {
      throw new ApiError(
        "validation",
        "session_closed",
        "La sesión ya no está activa.",
        410,
      );
    }
    session = found;

    const accessService = new WidgetPublicAccessService(admin);
    const access = await accessService.validateOrigin(
      session.widgetId,
      originHostname,
    );
    if (!access.availableNow) {
      throw new ApiError(
        "not_found",
        "widget_outside_schedule",
        "El widget no está disponible en este horario.",
        404,
      );
    }
    widget = access.widget;

    if (widget.maxMessagesPerSession !== null) {
      const conversations = new SupabaseConversationRepository(admin);
      const conversation = await conversations.findOpenBySessionId(session.id);
      if (conversation) {
        const messages = new SupabaseMessageRepository(admin);
        const count = await messages.countByConversationId(conversation.id);
        if (count >= widget.maxMessagesPerSession) {
          throw new ApiError(
            "validation",
            "max_messages_reached",
            "Se alcanzó el número máximo de mensajes permitidos para esta sesión.",
            400,
          );
        }
      }
    }
  } catch (error) {
    return corsJsonError(error, origin);
  }

  const useCase = new ProcessConversationalMessageUseCase({
    sessions,
    conversations: new SupabaseConversationRepository(admin),
    messages: new SupabaseMessageRepository(admin),
    widgetIntegrations: new SupabaseWidgetIntegrationRepository(admin),
    n8nIntegrations: new SupabaseN8nIntegrationRepository(admin),
    executionLogs: new SupabaseIntegrationExecutionLogRepository(admin),
    providerConfigs: new SupabaseProviderConfigRepository(admin),
    eventLogs: new SupabaseEventLogRepository(admin),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(payload: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      }

      try {
        const result = await useCase.execute({
          widget,
          sessionId: session.id,
          visitorMessage,
          domain: originHostname ?? session.domain,
          userAgent: request.headers.get("user-agent"),
          onDelta: (delta) => send({ type: "delta", text: delta }),
        });
        send({
          type: "done",
          conversationId: result.conversationId,
          visitorNameCaptured: result.visitorNameCaptured,
        });
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Ocurrió un error interno inesperado.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...buildCorsHeaders(origin),
    },
  });
}

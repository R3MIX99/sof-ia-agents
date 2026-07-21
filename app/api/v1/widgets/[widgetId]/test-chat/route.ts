import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { parseJsonBody, requireEnum, requireString, requireUuid } from "@/lib/validation/validate";
import {
  WidgetTestChatService,
  type TestChatMessage,
} from "@/services/widgets/widget-test-chat.service";
import { ApiError } from "@/lib/http/api-error";
import { loadWidgetAndAuthorize } from "../../_shared";

const ROLES = ["usuario", "asistente"] as const;

interface RouteContext {
  params: Promise<{ widgetId: string }>;
}

function parseHistory(value: unknown): TestChatMessage[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new ApiError(
      "validation",
      "invalid_field",
      'El campo "history" debe ser una lista de mensajes.',
      400,
      { field: "history" },
    );
  }
  return value.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      role: requireEnum(record.role, "history[].role", ROLES),
      content: requireString(record.content, "history[].content"),
    };
  });
}

/**
 * Panel de prueba en vivo del widget dentro del dashboard (sección 11):
 * ejecuta el modelo de IA y las integraciones n8n reales del widget, sin
 * persistir sesión, conversación, mensajes ni eventos.
 */
export const POST = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  const widget = await loadWidgetAndAuthorize(auth, widgetId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const message = requireString(body.message, "message");
  const history = parseHistory(body.history);

  const service = new WidgetTestChatService(auth.supabase);
  const result = await service.sendMessage(widget, history, message);

  return apiSuccess({ reply: result });
});

import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { ConversationService } from "@/services/conversations/conversation.service";
import { WidgetService } from "@/services/widgets/widget.service";
import { ApiError } from "@/lib/http/api-error";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

/** Detalle completo de una conversación con su hilo de mensajes, para el visor del Historial (sección 9.12). */
export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { conversationId } = await context.params;
  requireUuid(conversationId, "conversationId");

  const auth = await requireAuthenticatedUser();
  const conversationService = new ConversationService(auth.supabase);
  const conversation = await conversationService.getById(conversationId);
  if (!conversation) {
    throw new ApiError(
      "not_found",
      "conversation_not_found",
      "No se encontró la conversación solicitada.",
      404,
    );
  }

  const widgetService = new WidgetService(auth.supabase);
  const widget = await widgetService.getById(conversation.widgetId);
  if (!widget) {
    throw new ApiError(
      "not_found",
      "widget_not_found",
      "No se encontró el widget asociado a la conversación.",
      404,
    );
  }
  await requireOrganizationMembership(auth, widget.organizationId);

  const messages = await conversationService.getMessages(conversationId);

  return apiSuccess({ conversation, widgetName: widget.name, messages });
});

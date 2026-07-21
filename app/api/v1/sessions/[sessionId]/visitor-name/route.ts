import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationAdmin } from "@/middleware/authorization.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { SessionService } from "@/services/sessions/session.service";
import { WidgetService } from "@/services/widgets/widget.service";
import { ApiError } from "@/lib/http/api-error";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

/**
 * Elimina el nombre almacenado del visitante de una sesión sin eliminar sus
 * mensajes (sección 12.5). Disponible únicamente para administradores de la
 * organización propietaria del widget.
 */
export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { sessionId } = await context.params;
  requireUuid(sessionId, "sessionId");

  const auth = await requireAuthenticatedUser();
  const sessionService = new SessionService(auth.supabase);
  const session = await sessionService.getById(sessionId);
  if (!session) {
    throw new ApiError(
      "not_found",
      "session_not_found",
      "No se encontró la sesión.",
      404,
    );
  }

  const widgetService = new WidgetService(auth.supabase);
  const widget = await widgetService.getById(session.widgetId);
  if (!widget) {
    throw new ApiError(
      "not_found",
      "widget_not_found",
      "No se encontró el widget asociado a la sesión.",
      404,
    );
  }
  await requireOrganizationAdmin(auth, widget.organizationId);

  const updated = await sessionService.clearVisitorName(sessionId);
  return apiSuccess({ session: updated });
});

import type { AuthenticatedContext } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { WidgetService } from "@/services/widgets/widget.service";
import type { Widget } from "@/domain/entities/widget.entity";
import { ApiError } from "@/lib/http/api-error";

/** Carga un widget y verifica que el usuario autenticado pertenezca a su organización. Uso interno de las rutas de /api/v1/widgets. */
export async function loadWidgetAndAuthorize(
  auth: AuthenticatedContext,
  widgetId: string,
): Promise<Widget> {
  const service = new WidgetService(auth.supabase);
  const widget = await service.getById(widgetId);
  if (!widget) {
    throw new ApiError(
      "not_found",
      "widget_not_found",
      "No se encontró el widget solicitado.",
      404,
    );
  }
  await requireOrganizationMembership(auth, widget.organizationId);
  return widget;
}

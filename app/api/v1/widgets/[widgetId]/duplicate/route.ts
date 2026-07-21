import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { WidgetService } from "@/services/widgets/widget.service";
import { loadWidgetAndAuthorize } from "../../_shared";

interface RouteContext {
  params: Promise<{ widgetId: string }>;
}

export const POST = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new WidgetService(auth.supabase);
  const widget = await service.duplicateWidget(widgetId, auth.authUser.id);

  return apiSuccess({ widget }, { status: 201 });
});

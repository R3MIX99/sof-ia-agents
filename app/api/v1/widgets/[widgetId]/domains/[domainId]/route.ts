import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { WidgetDomainScheduleService } from "@/services/widgets/widget-domain-schedule.service";
import { loadWidgetAndAuthorize } from "../../../_shared";

interface RouteContext {
  params: Promise<{ widgetId: string; domainId: string }>;
}

export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId, domainId } = await context.params;
  requireUuid(widgetId, "widgetId");
  requireUuid(domainId, "domainId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new WidgetDomainScheduleService(auth.supabase);
  await service.removeDomain(domainId);

  return apiSuccess({ success: true });
});

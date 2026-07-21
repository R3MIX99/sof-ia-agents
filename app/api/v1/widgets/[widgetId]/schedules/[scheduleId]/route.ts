import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { WidgetDomainScheduleService } from "@/services/widgets/widget-domain-schedule.service";
import { loadWidgetAndAuthorize } from "../../../_shared";

interface RouteContext {
  params: Promise<{ widgetId: string; scheduleId: string }>;
}

export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId, scheduleId } = await context.params;
  requireUuid(widgetId, "widgetId");
  requireUuid(scheduleId, "scheduleId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new WidgetDomainScheduleService(auth.supabase);
  await service.removeSchedule(scheduleId);

  return apiSuccess({ success: true });
});

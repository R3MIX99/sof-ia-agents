import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { parseJsonBody, requireString, requireUuid } from "@/lib/validation/validate";
import { WidgetDomainScheduleService } from "@/services/widgets/widget-domain-schedule.service";
import { loadWidgetAndAuthorize } from "../../_shared";

interface RouteContext {
  params: Promise<{ widgetId: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new WidgetDomainScheduleService(auth.supabase);
  const domains = await service.listDomains(widgetId);

  return apiSuccess({ domains });
});

export const POST = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const domain = requireString(body.domain, "domain");
  const isWildcard = body.isWildcard === true;

  const service = new WidgetDomainScheduleService(auth.supabase);
  const created = await service.addDomain(widgetId, domain, isWildcard);

  return apiSuccess({ domain: created }, { status: 201 });
});

import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { parseJsonBody, requireUuid } from "@/lib/validation/validate";
import { WidgetAppearanceService } from "@/services/widgets/widget-appearance.service";
import type { UpdateWidgetAppearanceInput } from "@/infrastructure/supabase/repositories/widget-appearance.repository";
import { loadWidgetAndAuthorize } from "../../_shared";

interface RouteContext {
  params: Promise<{ widgetId: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new WidgetAppearanceService(auth.supabase);
  const appearance = await service.getByWidgetId(widgetId);

  return apiSuccess({ appearance });
});

export const PATCH = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const patch = (await parseJsonBody(request)) as UpdateWidgetAppearanceInput;

  const service = new WidgetAppearanceService(auth.supabase);
  const appearance = await service.update(widgetId, patch);

  return apiSuccess({ appearance });
});

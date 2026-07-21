import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { parseJsonBody, requireEnum, requireUuid } from "@/lib/validation/validate";
import { IntegrationService } from "@/services/integrations/integration.service";
import { loadWidgetAndAuthorize } from "../../../_shared";

const TRIGGER_POINTS = ["antes_ia", "después_ia", "independiente"] as const;

interface RouteContext {
  params: Promise<{ widgetId: string; widgetIntegrationId: string }>;
}

export const PATCH = withErrorHandling<RouteContext>(
  async (request: NextRequest, context) => {
    const { widgetId, widgetIntegrationId } = await context.params;
    requireUuid(widgetId, "widgetId");
    requireUuid(widgetIntegrationId, "widgetIntegrationId");

    const auth = await requireAuthenticatedUser();
    await loadWidgetAndAuthorize(auth, widgetId);

    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    const triggerPoint =
      body.triggerPoint !== undefined
        ? requireEnum(body.triggerPoint, "triggerPoint", TRIGGER_POINTS)
        : undefined;
    const executionOrder =
      typeof body.executionOrder === "number" ? body.executionOrder : undefined;

    const service = new IntegrationService(auth.supabase);
    const association = await service.updateWidgetIntegration(
      widgetIntegrationId,
      { triggerPoint, executionOrder },
    );

    return apiSuccess({ widgetIntegration: association });
  },
);

export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId, widgetIntegrationId } = await context.params;
  requireUuid(widgetId, "widgetId");
  requireUuid(widgetIntegrationId, "widgetIntegrationId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new IntegrationService(auth.supabase);
  await service.disassociateWidget(widgetIntegrationId);

  return apiSuccess({ success: true });
});

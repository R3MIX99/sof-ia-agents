import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import {
  parseJsonBody,
  requireEnum,
  requireUuid,
} from "@/lib/validation/validate";
import { IntegrationService } from "@/services/integrations/integration.service";
import { loadWidgetAndAuthorize } from "../../_shared";

const TRIGGER_POINTS = ["antes_ia", "después_ia", "independiente"] as const;

interface RouteContext {
  params: Promise<{ widgetId: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new IntegrationService(auth.supabase);
  const associations = await service.listWidgetIntegrations(widgetId);
  const integrations = await Promise.all(
    associations.map(async (association) => ({
      ...association,
      integration: await service.getById(association.integrationId),
    })),
  );

  return apiSuccess({ widgetIntegrations: integrations });
});

export const POST = withErrorHandling<RouteContext>(
  async (request: NextRequest, context) => {
    const { widgetId } = await context.params;
    requireUuid(widgetId, "widgetId");

    const auth = await requireAuthenticatedUser();
    await loadWidgetAndAuthorize(auth, widgetId);

    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    const integrationId = requireUuid(body.integrationId, "integrationId");
    const triggerPoint = requireEnum(
      body.triggerPoint ?? "después_ia",
      "triggerPoint",
      TRIGGER_POINTS,
    );
    const executionOrder =
      typeof body.executionOrder === "number" ? body.executionOrder : undefined;

    const service = new IntegrationService(auth.supabase);
    const association = await service.associateWidget({
      widgetId,
      integrationId,
      triggerPoint,
      executionOrder,
    });

    return apiSuccess({ widgetIntegration: association }, { status: 201 });
  },
);

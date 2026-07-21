import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { IntegrationService } from "@/services/integrations/integration.service";
import { loadIntegrationAndAuthorize } from "../../_shared";

interface RouteContext {
  params: Promise<{ integrationId: string }>;
}

/** Registro de ejecuciones recientes (sección 9.5). */
export const GET = withErrorHandling<RouteContext>(async (request, context) => {
  const { integrationId } = await context.params;
  requireUuid(integrationId, "integrationId");

  const auth = await requireAuthenticatedUser();
  await loadIntegrationAndAuthorize(auth, integrationId);

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const service = new IntegrationService(auth.supabase);
  const executions = await service.listExecutions(
    integrationId,
    Number.isFinite(limit) ? limit : undefined,
  );

  return apiSuccess({ executions });
});

import type { AuthenticatedContext } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { IntegrationService } from "@/services/integrations/integration.service";
import type { N8nIntegration } from "@/domain/entities/n8n-integration.entity";
import { ApiError } from "@/lib/http/api-error";

/** Carga una integración y verifica que el usuario autenticado pertenezca a su organización. Uso interno de las rutas de /api/v1/integrations. */
export async function loadIntegrationAndAuthorize(
  auth: AuthenticatedContext,
  integrationId: string,
): Promise<N8nIntegration> {
  const service = new IntegrationService(auth.supabase);
  const integration = await service.getById(integrationId);
  if (!integration) {
    throw new ApiError(
      "not_found",
      "integration_not_found",
      "No se encontró la integración.",
      404,
    );
  }
  await requireOrganizationMembership(auth, integration.organizationId);
  return integration;
}

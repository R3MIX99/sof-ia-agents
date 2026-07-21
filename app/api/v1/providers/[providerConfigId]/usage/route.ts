import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { ProviderService } from "@/services/providers/provider.service";
import { ApiError } from "@/lib/http/api-error";

interface RouteContext {
  params: Promise<{ providerConfigId: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { providerConfigId } = await context.params;
  requireUuid(providerConfigId, "providerConfigId");

  const auth = await requireAuthenticatedUser();
  const service = new ProviderService(auth.supabase);
  const existing = await service.getById(providerConfigId);
  if (!existing) {
    throw new ApiError(
      "not_found",
      "provider_config_not_found",
      "No se encontró la configuración del proveedor.",
      404,
    );
  }
  await requireOrganizationMembership(auth, existing.organizationId);

  const usageLogs = await service.listUsageLogs(providerConfigId);

  return apiSuccess({ usageLogs });
});

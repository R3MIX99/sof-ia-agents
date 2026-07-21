import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import {
  requireOrganizationAdmin,
  requireOrganizationMembership,
} from "@/middleware/authorization.middleware";
import { optionalString, parseJsonBody, requireUuid } from "@/lib/validation/validate";
import { ProviderService } from "@/services/providers/provider.service";
import { ApiError } from "@/lib/http/api-error";

interface RouteContext {
  params: Promise<{ providerConfigId: string }>;
}

async function loadConfigOrThrow(
  service: ProviderService,
  providerConfigId: string,
) {
  const config = await service.getById(providerConfigId);
  if (!config) {
    throw new ApiError(
      "not_found",
      "provider_config_not_found",
      "No se encontró la configuración del proveedor.",
      404,
    );
  }
  return config;
}

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { providerConfigId } = await context.params;
  requireUuid(providerConfigId, "providerConfigId");

  const auth = await requireAuthenticatedUser();
  const service = new ProviderService(auth.supabase);
  const providerConfig = await loadConfigOrThrow(service, providerConfigId);
  await requireOrganizationMembership(auth, providerConfig.organizationId);

  return apiSuccess({ providerConfig });
});

export const PATCH = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { providerConfigId } = await context.params;
  requireUuid(providerConfigId, "providerConfigId");

  const auth = await requireAuthenticatedUser();
  const service = new ProviderService(auth.supabase);
  const existing = await loadConfigOrThrow(service, providerConfigId);
  await requireOrganizationAdmin(auth, existing.organizationId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const model = optionalString(body.model, "model");
  const defaultSystemPrompt = optionalString(
    body.defaultSystemPrompt,
    "defaultSystemPrompt",
  );
  const credentialsPlainText = optionalString(body.credentials, "credentials");

  const providerConfig = await service.updateConfig(providerConfigId, {
    model,
    defaultSystemPrompt,
    credentialsPlainText,
    defaultTemperature:
      typeof body.defaultTemperature === "number"
        ? body.defaultTemperature
        : undefined,
    defaultMaxTokens:
      typeof body.defaultMaxTokens === "number"
        ? body.defaultMaxTokens
        : undefined,
  });

  return apiSuccess({ providerConfig });
});

export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { providerConfigId } = await context.params;
  requireUuid(providerConfigId, "providerConfigId");

  const auth = await requireAuthenticatedUser();
  const service = new ProviderService(auth.supabase);
  const existing = await loadConfigOrThrow(service, providerConfigId);
  await requireOrganizationAdmin(auth, existing.organizationId);

  await service.deleteConfig(providerConfigId);

  return apiSuccess({ success: true });
});

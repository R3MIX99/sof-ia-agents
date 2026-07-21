import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import {
  requireOrganizationAdmin,
  requireOrganizationMembership,
} from "@/middleware/authorization.middleware";
import {
  optionalString,
  parseJsonBody,
  requireEnum,
  requireString,
  requireUuid,
} from "@/lib/validation/validate";
import { ProviderService } from "@/services/providers/provider.service";
import { ApiError } from "@/lib/http/api-error";

const PROVIDER_NAMES = ["openai", "anthropic"] as const;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    throw new ApiError(
      "validation",
      "missing_query_param",
      'El parámetro "organizationId" es obligatorio.',
      400,
    );
  }
  requireUuid(organizationId, "organizationId");

  const auth = await requireAuthenticatedUser();
  await requireOrganizationMembership(auth, organizationId);

  const service = new ProviderService(auth.supabase);
  const providers = await service.listByOrganization(organizationId);

  return apiSuccess({ providers });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuthenticatedUser();

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const organizationId = requireUuid(body.organizationId, "organizationId");
  const provider = requireEnum(body.provider, "provider", PROVIDER_NAMES);
  const credentialsPlainText = requireString(body.credentials, "credentials");
  const model = requireString(body.model, "model");
  const defaultSystemPrompt = optionalString(
    body.defaultSystemPrompt,
    "defaultSystemPrompt",
  );

  await requireOrganizationAdmin(auth, organizationId);

  const service = new ProviderService(auth.supabase);
  const providerConfig = await service.createConfig({
    organizationId,
    provider,
    credentialsPlainText,
    model,
    defaultTemperature:
      typeof body.defaultTemperature === "number"
        ? body.defaultTemperature
        : undefined,
    defaultMaxTokens:
      typeof body.defaultMaxTokens === "number"
        ? body.defaultMaxTokens
        : undefined,
    defaultSystemPrompt,
  });

  return apiSuccess({ providerConfig }, { status: 201 });
});

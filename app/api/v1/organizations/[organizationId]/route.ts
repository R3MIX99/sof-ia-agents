import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import {
  requireOrganizationAdmin,
  requireOrganizationMembership,
} from "@/middleware/authorization.middleware";
import { parseJsonBody, optionalString, requireUuid } from "@/lib/validation/validate";
import { OrganizationService } from "@/services/organizations/organization.service";
import { ApiError } from "@/lib/http/api-error";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { organizationId } = await context.params;
  requireUuid(organizationId, "organizationId");

  const auth = await requireAuthenticatedUser();
  await requireOrganizationMembership(auth, organizationId);

  const service = new OrganizationService(auth.supabase);
  const organization = await service.getById(organizationId);

  if (!organization) {
    throw new ApiError(
      "not_found",
      "organization_not_found",
      "No se encontró la organización solicitada.",
      404,
    );
  }

  return apiSuccess({ organization });
});

export const PATCH = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { organizationId } = await context.params;
  requireUuid(organizationId, "organizationId");

  const auth = await requireAuthenticatedUser();
  await requireOrganizationAdmin(auth, organizationId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const name = optionalString(body.name, "name");
  const timezone = optionalString(body.timezone, "timezone");
  const defaultLanguage = optionalString(body.defaultLanguage, "defaultLanguage");

  const service = new OrganizationService(auth.supabase);
  const organization = await service.updateOrganization(organizationId, {
    name,
    timezone,
    defaultLanguage,
  });

  return apiSuccess({ organization });
});

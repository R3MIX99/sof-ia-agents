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
  requireString,
  requireUuid,
} from "@/lib/validation/validate";
import { TeamService } from "@/services/teams/team.service";
import { ApiError } from "@/lib/http/api-error";

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

  const service = new TeamService(auth.supabase);
  const teams = await service.listByOrganization(organizationId);

  return apiSuccess({ teams });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuthenticatedUser();

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const organizationId = requireUuid(body.organizationId, "organizationId");
  const name = requireString(body.name, "name");
  const description = optionalString(body.description, "description");

  await requireOrganizationAdmin(auth, organizationId);

  const service = new TeamService(auth.supabase);
  const team = await service.createTeam(organizationId, name, description);

  return apiSuccess({ team }, { status: 201 });
});

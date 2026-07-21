import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationAdmin } from "@/middleware/authorization.middleware";
import { optionalString, parseJsonBody, requireUuid } from "@/lib/validation/validate";
import { TeamService } from "@/services/teams/team.service";
import { SupabaseTeamRepository } from "@/infrastructure/supabase/repositories/team.repository";
import { ApiError } from "@/lib/http/api-error";
import type { AuthenticatedContext } from "@/middleware/auth.middleware";

interface RouteContext {
  params: Promise<{ teamId: string }>;
}

async function loadTeamOrganizationId(
  auth: AuthenticatedContext,
  teamId: string,
): Promise<string> {
  const repository = new SupabaseTeamRepository(auth.supabase);
  const team = await repository.findById(teamId);
  if (!team) {
    throw new ApiError(
      "not_found",
      "team_not_found",
      "No se encontró el equipo solicitado.",
      404,
    );
  }
  return team.organizationId;
}

export const PATCH = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { teamId } = await context.params;
  requireUuid(teamId, "teamId");

  const auth = await requireAuthenticatedUser();
  const organizationId = await loadTeamOrganizationId(auth, teamId);
  await requireOrganizationAdmin(auth, organizationId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const name = optionalString(body.name, "name");
  const description = optionalString(body.description, "description");

  const service = new TeamService(auth.supabase);
  const team = await service.updateTeam(teamId, { name, description });

  return apiSuccess({ team });
});

export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { teamId } = await context.params;
  requireUuid(teamId, "teamId");

  const auth = await requireAuthenticatedUser();
  const organizationId = await loadTeamOrganizationId(auth, teamId);
  await requireOrganizationAdmin(auth, organizationId);

  const service = new TeamService(auth.supabase);
  await service.deleteTeam(teamId);

  return apiSuccess({ success: true });
});

import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationAdmin } from "@/middleware/authorization.middleware";
import { parseJsonBody, requireUuid } from "@/lib/validation/validate";
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

export const POST = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { teamId } = await context.params;
  requireUuid(teamId, "teamId");

  const auth = await requireAuthenticatedUser();
  const organizationId = await loadTeamOrganizationId(auth, teamId);
  await requireOrganizationAdmin(auth, organizationId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const memberId = requireUuid(body.memberId, "memberId");

  const service = new TeamService(auth.supabase);
  await service.assignMemberToTeam(memberId, teamId);

  return apiSuccess({ success: true });
});

export const DELETE = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { teamId } = await context.params;
  requireUuid(teamId, "teamId");

  const memberId = request.nextUrl.searchParams.get("memberId");
  if (!memberId) {
    throw new ApiError(
      "validation",
      "missing_query_param",
      'El parámetro "memberId" es obligatorio.',
      400,
    );
  }
  requireUuid(memberId, "memberId");

  const auth = await requireAuthenticatedUser();
  const organizationId = await loadTeamOrganizationId(auth, teamId);
  await requireOrganizationAdmin(auth, organizationId);

  const service = new TeamService(auth.supabase);
  await service.assignMemberToTeam(memberId, null);

  return apiSuccess({ success: true });
});

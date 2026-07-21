import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationAdmin } from "@/middleware/authorization.middleware";
import { parseJsonBody, requireString, requireUuid } from "@/lib/validation/validate";
import { UserService } from "@/services/users/user.service";
import { SupabaseOrganizationMemberRepository } from "@/infrastructure/supabase/repositories/organization-member.repository";
import { ApiError } from "@/lib/http/api-error";
import type { AuthenticatedContext } from "@/middleware/auth.middleware";

interface RouteContext {
  params: Promise<{ memberId: string }>;
}

async function loadMemberOrganizationId(
  auth: AuthenticatedContext,
  memberId: string,
): Promise<string> {
  const repository = new SupabaseOrganizationMemberRepository(auth.supabase);
  const member = await repository.findById(memberId);
  if (!member) {
    throw new ApiError(
      "not_found",
      "member_not_found",
      "No se encontró la membresía solicitada.",
      404,
    );
  }
  return member.organizationId;
}

export const PATCH = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { memberId } = await context.params;
  requireUuid(memberId, "memberId");

  const auth = await requireAuthenticatedUser();
  const organizationId = await loadMemberOrganizationId(auth, memberId);
  await requireOrganizationAdmin(auth, organizationId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const roleId = requireString(body.roleId, "roleId");

  const service = new UserService(auth.supabase);
  const member = await service.updateMemberRole(memberId, roleId);

  return apiSuccess({ member });
});

export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { memberId } = await context.params;
  requireUuid(memberId, "memberId");

  const auth = await requireAuthenticatedUser();
  const organizationId = await loadMemberOrganizationId(auth, memberId);
  await requireOrganizationAdmin(auth, organizationId);

  const service = new UserService(auth.supabase);
  const member = await service.revokeMember(memberId);

  return apiSuccess({ member });
});

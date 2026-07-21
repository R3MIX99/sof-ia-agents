import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationAdmin } from "@/middleware/authorization.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { UserService } from "@/services/users/user.service";
import { SupabaseOrganizationMemberRepository } from "@/infrastructure/supabase/repositories/organization-member.repository";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/user.repository";
import { ApiError } from "@/lib/http/api-error";

interface RouteContext {
  params: Promise<{ memberId: string }>;
}

export const POST = withErrorHandling<RouteContext>(async (_request, context) => {
  const { memberId } = await context.params;
  requireUuid(memberId, "memberId");

  const auth = await requireAuthenticatedUser();
  const memberRepository = new SupabaseOrganizationMemberRepository(auth.supabase);
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new ApiError(
      "not_found",
      "member_not_found",
      "No se encontró la membresía solicitada.",
      404,
    );
  }

  await requireOrganizationAdmin(auth, member.organizationId);

  const userRepository = new SupabaseUserRepository(auth.supabase);
  const user = await userRepository.findById(member.userId);
  if (!user) {
    throw new ApiError(
      "not_found",
      "user_not_found",
      "No se encontró el usuario asociado a la invitación.",
      404,
    );
  }

  const service = new UserService(auth.supabase);
  await service.resendInvitation(user.email);

  return apiSuccess({ success: true });
});

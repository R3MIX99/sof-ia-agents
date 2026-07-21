import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { UserService } from "@/services/users/user.service";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { organizationId } = await context.params;
  requireUuid(organizationId, "organizationId");

  const auth = await requireAuthenticatedUser();
  await requireOrganizationMembership(auth, organizationId);

  const service = new UserService(auth.supabase);
  const members = await service.listOrganizationMembers(organizationId);

  return apiSuccess({ members });
});

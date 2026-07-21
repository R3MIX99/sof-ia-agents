import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { SupabaseRoleRepository } from "@/infrastructure/supabase/repositories/role.repository";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

// No existe un grupo de endpoints "/roles" dedicado en la sección 16.4; los
// roles se exponen como subrecurso de la organización porque el selector de
// rol de la pantalla Usuarios (9.6) los necesita para asignar membresías.
export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { organizationId } = await context.params;
  requireUuid(organizationId, "organizationId");

  const auth = await requireAuthenticatedUser();
  await requireOrganizationMembership(auth, organizationId);

  const repository = new SupabaseRoleRepository(auth.supabase);
  const [systemRoles, organizationRoles] = await Promise.all([
    repository.findSystemRoles(),
    repository.findByOrganizationId(organizationId),
  ]);

  return apiSuccess({ roles: [...systemRoles, ...organizationRoles] });
});

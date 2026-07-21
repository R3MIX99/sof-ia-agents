import type { AuthenticatedContext } from "./auth.middleware";
import { ApiError } from "@/lib/http/api-error";

/** Middleware de autorización por rol (sección 16.3): pertenencia a la organización. */
export async function requireOrganizationMembership(
  context: AuthenticatedContext,
  organizationId: string,
): Promise<void> {
  const { data, error } = await context.supabase.rpc(
    "is_organization_member",
    { p_organization_id: organizationId },
  );
  if (error) throw error;
  if (!data) {
    throw new ApiError(
      "authorization",
      "not_organization_member",
      "No perteneces a esta organización.",
      403,
    );
  }
}

/** Middleware de autorización por rol (sección 16.3): exige un rol administrativo. */
export async function requireOrganizationAdmin(
  context: AuthenticatedContext,
  organizationId: string,
): Promise<void> {
  const { data, error } = await context.supabase.rpc("is_organization_admin", {
    p_organization_id: organizationId,
  });
  if (error) throw error;
  if (!data) {
    throw new ApiError(
      "authorization",
      "not_organization_admin",
      "Necesitas permisos administrativos para realizar esta acción.",
      403,
    );
  }
}

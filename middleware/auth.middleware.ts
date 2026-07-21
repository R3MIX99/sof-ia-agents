import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server";
import { ApiError } from "@/lib/http/api-error";

export interface AuthenticatedContext {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  authUser: SupabaseAuthUser;
}

/** Middleware de autenticación (sección 16.3): resuelve la sesión para rutas administrativas. */
export async function requireAuthenticatedUser(): Promise<AuthenticatedContext> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new ApiError(
      "authentication",
      "unauthenticated",
      "Debes iniciar sesión para realizar esta acción.",
      401,
    );
  }

  return { supabase, authUser: data.user };
}

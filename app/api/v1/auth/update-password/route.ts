import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { parseJsonBody, requireString } from "@/lib/validation/validate";
import { ApiError } from "@/lib/http/api-error";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const password = requireString(body.password, "password");

  const supabase = await createSupabaseServerClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) {
    throw new ApiError(
      "authentication",
      "unauthenticated",
      "Debes iniciar sesión para actualizar tu contraseña.",
      401,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new ApiError(
      "validation",
      "update_password_failed",
      "No se pudo actualizar la contraseña.",
      400,
    );
  }

  return apiSuccess({ success: true });
});

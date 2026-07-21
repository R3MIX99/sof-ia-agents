import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireWithinRateLimit } from "@/middleware/rate-limit.middleware";
import { parseJsonBody, requireString } from "@/lib/validation/validate";
import { ApiError } from "@/lib/http/api-error";

export const POST = withErrorHandling(async (request: NextRequest) => {
  requireWithinRateLimit(request, "auth:login", 20, 60_000);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const email = requireString(body.email, "email");
  const password = requireString(body.password, "password");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new ApiError(
      "authentication",
      "invalid_credentials",
      "El correo o la contraseña son incorrectos.",
      401,
    );
  }

  return apiSuccess({ userId: data.user.id });
});

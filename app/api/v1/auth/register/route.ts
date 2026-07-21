import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireWithinRateLimit } from "@/middleware/rate-limit.middleware";
import { parseJsonBody, requireString } from "@/lib/validation/validate";
import { ApiError } from "@/lib/http/api-error";

export const POST = withErrorHandling(async (request: NextRequest) => {
  requireWithinRateLimit(request, "auth:register", 10, 60_000);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const email = requireString(body.email, "email");
  const password = requireString(body.password, "password");
  const fullName = requireString(body.fullName, "fullName");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, locale: "es-419" } },
  });

  if (error) {
    throw new ApiError("authentication", "sign_up_failed", error.message, 400);
  }

  return apiSuccess(
    { userId: data.user?.id ?? null, requiresEmailConfirmation: !data.session },
    { status: 201 },
  );
});

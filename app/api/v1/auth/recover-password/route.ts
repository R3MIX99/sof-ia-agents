import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireWithinRateLimit } from "@/middleware/rate-limit.middleware";
import { parseJsonBody, requireString } from "@/lib/validation/validate";

export const POST = withErrorHandling(async (request: NextRequest) => {
  requireWithinRateLimit(request, "auth:recover-password", 5, 60_000);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const email = requireString(body.email, "email");

  const supabase = await createSupabaseServerClient();
  const origin = request.headers.get("origin") ?? "";

  // No se propaga el error del proveedor al llamante: evita filtrar si un
  // correo existe o no en el sistema.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/recuperar-password/actualizar`,
  });

  return apiSuccess({ success: true });
});

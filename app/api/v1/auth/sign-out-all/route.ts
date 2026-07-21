import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";

export const POST = withErrorHandling(async () => {
  const { supabase } = await requireAuthenticatedUser();
  await supabase.auth.signOut({ scope: "global" });
  return apiSuccess({ success: true });
});

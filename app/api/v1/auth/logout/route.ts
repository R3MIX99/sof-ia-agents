import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const POST = withErrorHandling(async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return apiSuccess({ success: true });
});

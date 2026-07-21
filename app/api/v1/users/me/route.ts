import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { optionalString, parseJsonBody } from "@/lib/validation/validate";
import { UserService } from "@/services/users/user.service";
import { ApiError } from "@/lib/http/api-error";

export const GET = withErrorHandling(async () => {
  const { supabase, authUser } = await requireAuthenticatedUser();
  const service = new UserService(supabase);
  const profile = await service.getProfile(authUser.id);

  if (!profile) {
    throw new ApiError(
      "not_found",
      "profile_not_found",
      "No se encontró el perfil del usuario.",
      404,
    );
  }

  return apiSuccess({ profile });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireAuthenticatedUser();

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const fullName = optionalString(body.fullName, "fullName");
  const avatarUrl = optionalString(body.avatarUrl, "avatarUrl");
  const locale = optionalString(body.locale, "locale");

  const service = new UserService(supabase);
  const profile = await service.updateProfile(authUser.id, {
    fullName,
    avatarUrl,
    locale,
  });

  return apiSuccess({ profile });
});

import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireEnum } from "@/lib/validation/validate";
import { ProviderService } from "@/services/providers/provider.service";

const PROVIDER_NAMES = ["openai", "anthropic"] as const;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuthenticatedUser();

  const provider = requireEnum(
    request.nextUrl.searchParams.get("provider"),
    "provider",
    PROVIDER_NAMES,
  );

  const service = new ProviderService(auth.supabase);
  const models = service.listAvailableModels(provider);

  return apiSuccess({ models });
});

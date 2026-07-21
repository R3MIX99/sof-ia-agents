import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/http/api-error";
import { checkRateLimit } from "@/lib/rate-limiting/rate-limiter";

/** Middleware de límite de solicitudes (sección 16.3), aplicable a rutas administrativas y públicas. */
export function requireWithinRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): void {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const result = checkRateLimit(`${scope}:${ip}`, limit, windowMs);

  if (!result.allowed) {
    throw new ApiError(
      "rate_limit",
      "rate_limit_exceeded",
      "Se alcanzó el límite de solicitudes. Inténtalo de nuevo más tarde.",
      429,
    );
  }
}

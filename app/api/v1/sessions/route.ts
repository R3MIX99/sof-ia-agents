import type { NextRequest } from "next/server";
import { requireWithinRateLimit } from "@/middleware/rate-limit.middleware";
import {
  optionalString,
  parseJsonBody,
  requireString,
  requireUuid,
} from "@/lib/validation/validate";
import { extractHostnameFromOrigin } from "@/lib/validation/domain-matcher";
import {
  corsJsonError,
  corsJsonSuccess,
  corsPreflightResponse,
} from "@/lib/http/cors";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin";
import { WidgetPublicAccessService } from "@/services/widgets/widget-public-access.service";
import { SessionService } from "@/services/sessions/session.service";
import { ApiError } from "@/lib/http/api-error";

export function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request.headers.get("origin") ?? "*");
}

/** Inicialización de sesión desde el cargador embebido (sección 13.6). */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  try {
    requireWithinRateLimit(request, "sessions:init", 60, 60_000);

    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    const publicKey = requireString(body.publicKey, "publicKey");
    const visitorIdentifier = requireString(
      body.visitorIdentifier,
      "visitorIdentifier",
    );
    const visitorName = optionalString(body.visitorName, "visitorName") ?? null;
    const userAgent =
      optionalString(body.userAgent, "userAgent") ??
      request.headers.get("user-agent");

    const originHostname = extractHostnameFromOrigin(
      request.headers.get("origin"),
    );
    const admin = createSupabaseAdminClient();
    const accessService = new WidgetPublicAccessService(admin);
    const access = await accessService.resolveByPublicKey(
      publicKey,
      originHostname,
    );

    const sessionService = new SessionService(admin);
    const session = await sessionService.initialize(access.widget, {
      visitorIdentifier,
      visitorName,
      domain: originHostname ?? "desconocido",
      userAgent: userAgent ?? null,
    });

    return corsJsonSuccess(
      {
        sessionId: session.id,
        visitorName: session.visitorName,
        status: session.status,
        availableNow: access.availableNow,
        outOfScheduleBehavior: access.outOfScheduleBehavior,
      },
      origin,
      201,
    );
  } catch (error) {
    return corsJsonError(error, origin);
  }
}

/** Renovación de sesión (latido de actividad). */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  try {
    requireWithinRateLimit(request, "sessions:renew", 120, 60_000);

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      throw new ApiError(
        "validation",
        "missing_query_param",
        'Se requiere el parámetro "sessionId".',
        400,
      );
    }
    requireUuid(sessionId, "sessionId");

    const admin = createSupabaseAdminClient();
    const sessionService = new SessionService(admin);
    const session = await sessionService.getById(sessionId);
    if (!session) {
      throw new ApiError(
        "not_found",
        "session_not_found",
        "No se encontró la sesión.",
        404,
      );
    }

    const originHostname = extractHostnameFromOrigin(
      request.headers.get("origin"),
    );
    const accessService = new WidgetPublicAccessService(admin);
    await accessService.validateOrigin(session.widgetId, originHostname);

    const renewed = await sessionService.renew(sessionId);
    return corsJsonSuccess(
      {
        sessionId: renewed.id,
        visitorName: renewed.visitorName,
        status: renewed.status,
      },
      origin,
    );
  } catch (error) {
    return corsJsonError(error, origin);
  }
}

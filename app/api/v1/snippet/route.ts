import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import {
  requireOrganizationAdmin,
  requireOrganizationMembership,
} from "@/middleware/authorization.middleware";
import { requireWithinRateLimit } from "@/middleware/rate-limit.middleware";
import { parseJsonBody, requireUuid } from "@/lib/validation/validate";
import { extractHostnameFromOrigin } from "@/lib/validation/domain-matcher";
import {
  corsJsonError,
  corsJsonSuccess,
  corsPreflightResponse,
} from "@/lib/http/cors";
import { SnippetService } from "@/services/snippets/snippet.service";
import { WidgetService } from "@/services/widgets/widget.service";
import { WidgetPublicAccessService } from "@/services/widgets/widget-public-access.service";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin";
import { ApiError } from "@/lib/http/api-error";

export function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request.headers.get("origin") ?? "*");
}

/**
 * Sección 16.4: GET admite dos usos según el parámetro recibido.
 * - `publicKey`: endpoint público de configuración (sección 13.3), consumido
 *   por el cargador embebido, sin autenticación, con CORS habilitado.
 * - `widgetId`: consulta autenticada del snippet existente de un widget,
 *   usada por el panel Snippet Generator del dashboard.
 */
export async function GET(request: NextRequest) {
  const publicKey = request.nextUrl.searchParams.get("publicKey");
  const origin = request.headers.get("origin") ?? "*";

  if (publicKey) {
    try {
      requireWithinRateLimit(request, "snippet:config", 120, 60_000);
      const originHostname = extractHostnameFromOrigin(
        request.headers.get("origin"),
      );
      const admin = createSupabaseAdminClient();
      const service = new WidgetPublicAccessService(admin);
      const config = await service.getPublicConfig(publicKey, originHostname);
      return corsJsonSuccess({ config }, origin);
    } catch (error) {
      return corsJsonError(error, origin);
    }
  }

  return withErrorHandling(async (req: NextRequest) => {
    const widgetId = req.nextUrl.searchParams.get("widgetId");
    if (!widgetId) {
      throw new ApiError(
        "validation",
        "missing_query_param",
        'Se requiere el parámetro "publicKey" o "widgetId".',
        400,
      );
    }
    requireUuid(widgetId, "widgetId");

    const auth = await requireAuthenticatedUser();
    const widgetService = new WidgetService(auth.supabase);
    const widget = await widgetService.getById(widgetId);
    if (!widget) {
      throw new ApiError(
        "not_found",
        "widget_not_found",
        "No se encontró el widget solicitado.",
        404,
      );
    }
    await requireOrganizationMembership(auth, widget.organizationId);

    const service = new SnippetService(auth.supabase);
    const snippet = await service.getByWidgetId(widgetId);
    return apiSuccess({ snippet });
  })(request, undefined);
}

/** Generación y regeneración del identificador público de snippet para un widget (sección 13.1). */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuthenticatedUser();
  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const widgetId = requireUuid(body.widgetId, "widgetId");

  const widgetService = new WidgetService(auth.supabase);
  const widget = await widgetService.getById(widgetId);
  if (!widget) {
    throw new ApiError(
      "not_found",
      "widget_not_found",
      "No se encontró el widget solicitado.",
      404,
    );
  }
  await requireOrganizationAdmin(auth, widget.organizationId);

  const service = new SnippetService(auth.supabase);
  const snippet = await service.generate(widgetId);
  return apiSuccess({ snippet }, { status: 201 });
});

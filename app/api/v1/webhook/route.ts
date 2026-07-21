import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { parseJsonBody, requireUuid } from "@/lib/validation/validate";
import { IntegrationService } from "@/services/integrations/integration.service";
import { loadIntegrationAndAuthorize } from "@/app/api/v1/integrations/_shared";

/**
 * Endpoint interno de disparo de pruebas de conexión hacia integraciones de
 * n8n desde el dashboard (sección 16.4). No requiere que la integración
 * tenga ningún widget asociado.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuthenticatedUser();

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const integrationId = requireUuid(body.integrationId, "integrationId");
  const widgetId =
    typeof body.widgetId === "string" && body.widgetId.length > 0
      ? body.widgetId
      : null;

  await loadIntegrationAndAuthorize(auth, integrationId);

  const service = new IntegrationService(auth.supabase);
  const result = await service.testConnection(integrationId, widgetId);

  return apiSuccess({ result });
});

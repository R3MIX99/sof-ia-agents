import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { requireEnum, requireUuid } from "@/lib/validation/validate";
import { EventLogService } from "@/services/logs/event-log.service";
import type {
  EventSeverity,
  EventSource,
} from "@/domain/entities/system-event.entity";
import { ApiError } from "@/lib/http/api-error";

const SEVERITIES: readonly EventSeverity[] = [
  "información",
  "advertencia",
  "error",
  "crítico",
];
const SOURCES: readonly EventSource[] = [
  "widget",
  "proveedor",
  "integración n8n",
  "sistema",
];

/** Registro general de eventos del sistema, con filtros de severidad, tipo y widget (sección 15.20). */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const organizationId = params.get("organizationId");
  if (!organizationId) {
    throw new ApiError(
      "validation",
      "missing_query_param",
      'El parámetro "organizationId" es obligatorio.',
      400,
    );
  }
  requireUuid(organizationId, "organizationId");

  const widgetId = params.get("widgetId") ?? undefined;
  if (widgetId) requireUuid(widgetId, "widgetId");

  const severityParam = params.get("severity");
  const severity = severityParam
    ? requireEnum(severityParam, "severity", SEVERITIES)
    : undefined;

  const sourceParam = params.get("source");
  const source = sourceParam
    ? requireEnum(sourceParam, "source", SOURCES)
    : undefined;

  const limitParam = params.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const auth = await requireAuthenticatedUser();
  await requireOrganizationMembership(auth, organizationId);

  const service = new EventLogService(auth.supabase);
  const events = await service.list(
    organizationId,
    { widgetId, severity, source },
    Number.isFinite(limit) ? limit : undefined,
  );

  return apiSuccess({ events });
});

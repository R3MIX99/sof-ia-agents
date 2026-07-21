import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { requireUuid } from "@/lib/validation/validate";
import { WidgetService } from "@/services/widgets/widget.service";
import { AnalyticsService } from "@/services/analytics/analytics.service";
import { ApiError } from "@/lib/http/api-error";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: string | null, field: string): string {
  if (!value || !DATE_PATTERN.test(value)) {
    throw new ApiError(
      "validation",
      "invalid_field",
      `El parámetro "${field}" debe tener el formato AAAA-MM-DD.`,
      400,
      { field },
    );
  }
  return value;
}

/** Métricas agregadas por widget y rango de fechas (sección 18, Fase 7). */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const widgetId = requireUuid(params.get("widgetId"), "widgetId");
  const startDate = requireDate(params.get("startDate"), "startDate");
  const endDate = requireDate(params.get("endDate"), "endDate");

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

  const analyticsService = new AnalyticsService(auth.supabase);
  const [summary, metrics, ratings] = await Promise.all([
    analyticsService.getSummary(widgetId, startDate, endDate),
    analyticsService.getMetricsForRange(widgetId, startDate, endDate),
    analyticsService.getRatingsAndFeedback(widgetId, startDate, endDate),
  ]);

  return apiSuccess({ summary, metrics, ratings });
});

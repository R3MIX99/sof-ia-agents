import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import {
  parseJsonBody,
  requireEnum,
  requireString,
  requireUuid,
} from "@/lib/validation/validate";
import { WidgetDomainScheduleService } from "@/services/widgets/widget-domain-schedule.service";
import { loadWidgetAndAuthorize } from "../../_shared";
import { ApiError } from "@/lib/http/api-error";

interface RouteContext {
  params: Promise<{ widgetId: string }>;
}

const OUT_OF_SCHEDULE_BEHAVIORS = [
  "ocultar widget",
  "mostrar mensaje de no disponibilidad",
] as const;

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new WidgetDomainScheduleService(auth.supabase);
  const schedules = await service.listSchedules(widgetId);

  return apiSuccess({ schedules });
});

export const POST = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const dayOfWeek = body.dayOfWeek;
  if (
    typeof dayOfWeek !== "number" ||
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6
  ) {
    throw new ApiError(
      "validation",
      "invalid_field",
      'El campo "dayOfWeek" debe ser un entero entre 0 y 6.',
      400,
      { field: "dayOfWeek" },
    );
  }
  const startTime = requireString(body.startTime, "startTime");
  const endTime = requireString(body.endTime, "endTime");
  const timezone = requireString(body.timezone, "timezone");
  const outOfScheduleBehavior = requireEnum(
    body.outOfScheduleBehavior,
    "outOfScheduleBehavior",
    OUT_OF_SCHEDULE_BEHAVIORS,
  );

  const service = new WidgetDomainScheduleService(auth.supabase);
  const schedule = await service.addSchedule({
    widgetId,
    dayOfWeek,
    startTime,
    endTime,
    timezone,
    outOfScheduleBehavior,
  });

  return apiSuccess({ schedule }, { status: 201 });
});

import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import {
  parseJsonBody,
  optionalString,
  requireEnum,
  requireUuid,
} from "@/lib/validation/validate";
import { WidgetService } from "@/services/widgets/widget.service";
import type { WidgetStatus } from "@/domain/entities/widget.entity";
import { loadWidgetAndAuthorize } from "../_shared";

const INACTIVITY_BEHAVIORS = [
  "sin acción",
  "cerrar sesión automáticamente",
  "mostrar mensaje de inactividad",
] as const;

interface RouteContext {
  params: Promise<{ widgetId: string }>;
}

const STATUS_ACTIONS: Record<
  Exclude<WidgetStatus, "borrador">,
  keyof Pick<WidgetService, "publish" | "pause" | "archive">
> = {
  publicado: "publish",
  pausado: "pause",
  archivado: "archive",
};

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  const widget = await loadWidgetAndAuthorize(auth, widgetId);

  return apiSuccess({ widget });
});

export const PATCH = withErrorHandling<RouteContext>(async (request: NextRequest, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const service = new WidgetService(auth.supabase);

  if (typeof body.status === "string" && body.status !== "borrador") {
    const action = STATUS_ACTIONS[body.status as Exclude<WidgetStatus, "borrador">];
    if (action) {
      const widget = await service[action](widgetId);
      return apiSuccess({ widget });
    }
  }
  if (body.status === "borrador") {
    const widget = await service.unpublish(widgetId);
    return apiSuccess({ widget });
  }

  const name = optionalString(body.name, "name");
  const description = optionalString(body.description, "description");
  const language = optionalString(body.language, "language");
  const providerConfigId = optionalString(body.providerConfigId, "providerConfigId");
  const logoUrl = optionalString(body.logoUrl, "logoUrl");
  const avatarUrl = optionalString(body.avatarUrl, "avatarUrl");
  const persistConversationAcrossSessions =
    typeof body.persistConversationAcrossSessions === "boolean"
      ? body.persistConversationAcrossSessions
      : undefined;
  const maxMessagesPerSession =
    body.maxMessagesPerSession === null
      ? null
      : typeof body.maxMessagesPerSession === "number"
        ? body.maxMessagesPerSession
        : undefined;
  const inactivityBehavior =
    body.inactivityBehavior !== undefined
      ? requireEnum(
          body.inactivityBehavior,
          "inactivityBehavior",
          INACTIVITY_BEHAVIORS,
        )
      : undefined;
  const systemPrompt =
    body.systemPrompt === null
      ? null
      : typeof body.systemPrompt === "string"
        ? body.systemPrompt
        : undefined;

  const widget = await service.updateWidget(widgetId, {
    name,
    description,
    language,
    providerConfigId,
    logoUrl,
    avatarUrl,
    persistConversationAcrossSessions,
    maxMessagesPerSession,
    inactivityBehavior,
    systemPrompt,
  });

  return apiSuccess({ widget });
});

export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { widgetId } = await context.params;
  requireUuid(widgetId, "widgetId");

  const auth = await requireAuthenticatedUser();
  await loadWidgetAndAuthorize(auth, widgetId);

  const service = new WidgetService(auth.supabase);
  await service.deleteWidget(widgetId);

  return apiSuccess({ success: true });
});

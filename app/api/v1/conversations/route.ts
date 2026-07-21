import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import { requireEnum, requireUuid } from "@/lib/validation/validate";
import { ConversationService } from "@/services/conversations/conversation.service";
import type { ConversationOutcome } from "@/domain/entities/conversation.entity";
import { ApiError } from "@/lib/http/api-error";

const OUTCOMES: readonly ConversationOutcome[] = [
  "completada",
  "abandonada",
  "con error",
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Historial de conversaciones de la organización, con filtros y paginación (sección 9.12). */
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

  const outcomeParam = params.get("outcome");
  const outcome = outcomeParam
    ? requireEnum(outcomeParam, "outcome", OUTCOMES)
    : undefined;

  const visitorName = params.get("visitorName") ?? undefined;
  const dateFrom = params.get("dateFrom") ?? undefined;
  const dateTo = params.get("dateTo") ?? undefined;

  const pageParam = Number(params.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const pageSizeParam = Number(params.get("pageSize"));
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  const auth = await requireAuthenticatedUser();
  await requireOrganizationMembership(auth, organizationId);

  const service = new ConversationService(auth.supabase);
  const result = await service.listByOrganization(
    organizationId,
    { widgetId, outcome, visitorName, dateFrom, dateTo },
    { page, pageSize },
  );

  return apiSuccess({
    conversations: result.items,
    total: result.total,
    page,
    pageSize,
  });
});

import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationMembership } from "@/middleware/authorization.middleware";
import {
  optionalString,
  parseJsonBody,
  requireString,
  requireUuid,
} from "@/lib/validation/validate";
import { WidgetService } from "@/services/widgets/widget.service";
import { ApiError } from "@/lib/http/api-error";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    throw new ApiError(
      "validation",
      "missing_query_param",
      'El parámetro "organizationId" es obligatorio.',
      400,
    );
  }
  requireUuid(organizationId, "organizationId");

  const auth = await requireAuthenticatedUser();
  await requireOrganizationMembership(auth, organizationId);

  const service = new WidgetService(auth.supabase);
  const widgets = await service.listByOrganization(organizationId);

  return apiSuccess({ widgets });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuthenticatedUser();

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const organizationId = requireUuid(body.organizationId, "organizationId");
  const name = requireString(body.name, "name");
  const description = optionalString(body.description, "description");
  const language = optionalString(body.language, "language");

  await requireOrganizationMembership(auth, organizationId);

  const service = new WidgetService(auth.supabase);
  const widget = await service.createWidget({
    organizationId,
    name,
    description,
    language,
    createdBy: auth.authUser.id,
  });

  return apiSuccess({ widget }, { status: 201 });
});

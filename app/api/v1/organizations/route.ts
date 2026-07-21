import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { parseJsonBody, requireString, optionalString } from "@/lib/validation/validate";
import { OrganizationService } from "@/services/organizations/organization.service";

export const GET = withErrorHandling(async () => {
  const { supabase, authUser } = await requireAuthenticatedUser();
  const service = new OrganizationService(supabase);
  const organizations = await service.listOrganizationsForUser(authUser.id);
  return apiSuccess({ organizations });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireAuthenticatedUser();

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const name = requireString(body.name, "name");
  const slug = requireString(body.slug, "slug");
  const timezone = optionalString(body.timezone, "timezone");
  const defaultLanguage = optionalString(body.defaultLanguage, "defaultLanguage");

  const service = new OrganizationService(supabase);
  const organization = await service.createOrganization({
    name,
    slug,
    ownerId: authUser.id,
    timezone,
    defaultLanguage,
  });

  return apiSuccess({ organization }, { status: 201 });
});

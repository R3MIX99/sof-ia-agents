import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import {
  requireOrganizationAdmin,
  requireOrganizationMembership,
} from "@/middleware/authorization.middleware";
import {
  optionalString,
  parseJsonBody,
  requireEnum,
  requireString,
  requireUuid,
} from "@/lib/validation/validate";
import { IntegrationService } from "@/services/integrations/integration.service";
import { ApiError } from "@/lib/http/api-error";

const HTTP_METHODS = ["POST", "GET", "PUT", "PATCH"] as const;
const AUTH_TYPES = ["ninguna", "cabecera_estatica", "token", "básica"] as const;
const ERROR_STRATEGIES = ["continuar", "interrumpir"] as const;
const STATUSES = ["activa", "deshabilitada"] as const;

function parseHeaders(value: unknown, field: string): Record<string, string> {
  if (value === undefined) return {};
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new ApiError(
      "validation",
      "invalid_field",
      `El campo "${field}" debe ser un objeto de clave-valor.`,
      400,
      { field },
    );
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const result: Record<string, string> = {};
  for (const [key, val] of entries) {
    result[key] = String(val);
  }
  return result;
}

function parseExpectedResponseFormat(
  value: unknown,
): { contentField: string } {
  if (value === undefined || value === null) return { contentField: "" };
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(
      "validation",
      "invalid_field",
      'El campo "expectedResponseFormat" debe ser un objeto.',
      400,
      { field: "expectedResponseFormat" },
    );
  }
  const contentField = (value as Record<string, unknown>).contentField;
  return { contentField: typeof contentField === "string" ? contentField : "" };
}

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

  const service = new IntegrationService(auth.supabase);
  const integrations = await service.listByOrganization(organizationId);

  return apiSuccess({ integrations });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAuthenticatedUser();

  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const organizationId = requireUuid(body.organizationId, "organizationId");
  await requireOrganizationAdmin(auth, organizationId);

  const name = requireString(body.name, "name");
  const webhookUrl = requireString(body.webhookUrl, "webhookUrl");
  const httpMethod = requireEnum(
    body.httpMethod ?? "POST",
    "httpMethod",
    HTTP_METHODS,
  );
  const authType = requireEnum(
    body.authType ?? "ninguna",
    "authType",
    AUTH_TYPES,
  );
  const authCredentialsPlainText = optionalString(
    body.authCredentials,
    "authCredentials",
  );
  const errorHandlingStrategy = requireEnum(
    body.errorHandlingStrategy ?? "continuar",
    "errorHandlingStrategy",
    ERROR_STRATEGIES,
  );
  const status = requireEnum(body.status ?? "activa", "status", STATUSES);
  const headers = parseHeaders(body.headers, "headers");
  const dynamicVariables = parseHeaders(
    body.dynamicVariables,
    "dynamicVariables",
  );
  const expectedResponseFormat = parseExpectedResponseFormat(
    body.expectedResponseFormat,
  );

  const service = new IntegrationService(auth.supabase);
  const integration = await service.create({
    organizationId,
    name,
    webhookUrl,
    httpMethod,
    headers,
    authType,
    authCredentialsPlainText,
    dynamicVariables,
    timeoutMs:
      typeof body.timeoutMs === "number" ? body.timeoutMs : undefined,
    retryCount:
      typeof body.retryCount === "number" ? body.retryCount : undefined,
    retryBackoffMs:
      typeof body.retryBackoffMs === "number"
        ? body.retryBackoffMs
        : undefined,
    errorHandlingStrategy,
    expectedResponseFormat,
    status,
  });

  return apiSuccess({ integration }, { status: 201 });
});

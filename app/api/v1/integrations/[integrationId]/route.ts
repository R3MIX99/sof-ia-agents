import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireAuthenticatedUser } from "@/middleware/auth.middleware";
import { requireOrganizationAdmin } from "@/middleware/authorization.middleware";
import {
  optionalString,
  parseJsonBody,
  requireEnum,
  requireUuid,
} from "@/lib/validation/validate";
import { IntegrationService } from "@/services/integrations/integration.service";
import { ApiError } from "@/lib/http/api-error";
import { loadIntegrationAndAuthorize } from "../_shared";

const HTTP_METHODS = ["POST", "GET", "PUT", "PATCH"] as const;
const AUTH_TYPES = ["ninguna", "cabecera_estatica", "token", "básica"] as const;
const ERROR_STRATEGIES = ["continuar", "interrumpir"] as const;
const STATUSES = ["activa", "deshabilitada"] as const;

function parseHeaders(value: unknown, field: string): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(
      "validation",
      "invalid_field",
      `El campo "${field}" debe ser un objeto de clave-valor.`,
      400,
      { field },
    );
  }
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = String(val);
  }
  return result;
}

function parseExpectedResponseFormat(
  value: unknown,
): { contentField: string } | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
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

interface RouteContext {
  params: Promise<{ integrationId: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (_request, context) => {
  const { integrationId } = await context.params;
  requireUuid(integrationId, "integrationId");

  const auth = await requireAuthenticatedUser();
  const integration = await loadIntegrationAndAuthorize(auth, integrationId);

  return apiSuccess({ integration });
});

export const PATCH = withErrorHandling<RouteContext>(
  async (request: NextRequest, context) => {
    const { integrationId } = await context.params;
    requireUuid(integrationId, "integrationId");

    const auth = await requireAuthenticatedUser();
    const existing = await loadIntegrationAndAuthorize(auth, integrationId);
    await requireOrganizationAdmin(auth, existing.organizationId);

    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    const name = optionalString(body.name, "name");
    const webhookUrl = optionalString(body.webhookUrl, "webhookUrl");
    const httpMethod =
      body.httpMethod !== undefined
        ? requireEnum(body.httpMethod, "httpMethod", HTTP_METHODS)
        : undefined;
    const authType =
      body.authType !== undefined
        ? requireEnum(body.authType, "authType", AUTH_TYPES)
        : undefined;
    const authCredentialsPlainText = optionalString(
      body.authCredentials,
      "authCredentials",
    );
    const errorHandlingStrategy =
      body.errorHandlingStrategy !== undefined
        ? requireEnum(
            body.errorHandlingStrategy,
            "errorHandlingStrategy",
            ERROR_STRATEGIES,
          )
        : undefined;
    const status =
      body.status !== undefined
        ? requireEnum(body.status, "status", STATUSES)
        : undefined;

    const service = new IntegrationService(auth.supabase);
    const integration = await service.update(integrationId, {
      name,
      webhookUrl,
      httpMethod,
      headers: parseHeaders(body.headers, "headers"),
      authType,
      authCredentialsPlainText,
      dynamicVariables: parseHeaders(body.dynamicVariables, "dynamicVariables"),
      timeoutMs:
        typeof body.timeoutMs === "number" ? body.timeoutMs : undefined,
      retryCount:
        typeof body.retryCount === "number" ? body.retryCount : undefined,
      retryBackoffMs:
        typeof body.retryBackoffMs === "number"
          ? body.retryBackoffMs
          : undefined,
      errorHandlingStrategy,
      expectedResponseFormat: parseExpectedResponseFormat(
        body.expectedResponseFormat,
      ),
      status,
    });

    return apiSuccess({ integration });
  },
);

export const DELETE = withErrorHandling<RouteContext>(async (_request, context) => {
  const { integrationId } = await context.params;
  requireUuid(integrationId, "integrationId");

  const auth = await requireAuthenticatedUser();
  const existing = await loadIntegrationAndAuthorize(auth, integrationId);
  await requireOrganizationAdmin(auth, existing.organizationId);

  const service = new IntegrationService(auth.supabase);
  await service.delete(integrationId);

  return apiSuccess({ success: true });
});

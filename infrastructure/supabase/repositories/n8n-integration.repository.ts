import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type {
  N8nExpectedResponseFormat,
  N8nIntegration,
} from "@/domain/entities/n8n-integration.entity";
import type {
  CreateN8nIntegrationInput,
  N8nIntegrationRepository,
  UpdateN8nIntegrationInput,
} from "@/domain/repositories-interfaces/n8n-integration-repository.interface";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin";
import {
  decryptCredential,
  encryptCredential,
} from "@/lib/encryption/credential-cipher";

// Nunca incluye `auth_credentials_encrypted`: esa columna no es
// seleccionable por el rol `authenticated` (ver migración de la sección
// 15.13).
const SAFE_COLUMNS =
  "id, organization_id, name, webhook_url, http_method, headers, auth_type, dynamic_variables, timeout_ms, retry_count, retry_backoff_ms, error_handling_strategy, expected_response_format, status, created_at, updated_at";

interface N8nIntegrationSafeRow {
  id: string;
  organization_id: string;
  name: string;
  webhook_url: string;
  http_method: string;
  headers: Record<string, string>;
  auth_type: string;
  dynamic_variables: Record<string, string>;
  timeout_ms: number;
  retry_count: number;
  retry_backoff_ms: number;
  error_handling_strategy: string;
  expected_response_format: N8nExpectedResponseFormat;
  status: string;
  created_at: string;
  updated_at: string;
}

function toEntity(row: N8nIntegrationSafeRow): N8nIntegration {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    webhookUrl: row.webhook_url,
    httpMethod: row.http_method as N8nIntegration["httpMethod"],
    headers: row.headers ?? {},
    authType: row.auth_type as N8nIntegration["authType"],
    dynamicVariables: row.dynamic_variables ?? {},
    timeoutMs: row.timeout_ms,
    retryCount: row.retry_count,
    retryBackoffMs: row.retry_backoff_ms,
    errorHandlingStrategy:
      row.error_handling_strategy as N8nIntegration["errorHandlingStrategy"],
    expectedResponseFormat: row.expected_response_format ?? {
      contentField: "",
    },
    status: row.status as N8nIntegration["status"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseN8nIntegrationRepository
  implements N8nIntegrationRepository
{
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<N8nIntegration | null> {
    const { data, error } = await this.client
      .from("n8n_integrations")
      .select(SAFE_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data as unknown as N8nIntegrationSafeRow) : null;
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<N8nIntegration[]> {
    const { data, error } = await this.client
      .from("n8n_integrations")
      .select(SAFE_COLUMNS)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as N8nIntegrationSafeRow[]).map(toEntity);
  }

  async create(input: CreateN8nIntegrationInput): Promise<N8nIntegration> {
    const { data, error } = await this.client
      .from("n8n_integrations")
      .insert({
        organization_id: input.organizationId,
        name: input.name,
        webhook_url: input.webhookUrl,
        http_method: input.httpMethod,
        headers: input.headers ?? {},
        auth_type: input.authType,
        auth_credentials_encrypted: input.authCredentialsPlainText
          ? encryptCredential(input.authCredentialsPlainText)
          : null,
        dynamic_variables: input.dynamicVariables ?? {},
        timeout_ms: input.timeoutMs,
        retry_count: input.retryCount,
        retry_backoff_ms: input.retryBackoffMs,
        error_handling_strategy: input.errorHandlingStrategy,
        expected_response_format: (input.expectedResponseFormat ?? {
          contentField: "",
        }) as unknown as Json,
        status: input.status,
      })
      .select(SAFE_COLUMNS)
      .single();
    if (error) throw error;
    return toEntity(data as unknown as N8nIntegrationSafeRow);
  }

  async update(
    id: string,
    input: UpdateN8nIntegrationInput,
  ): Promise<N8nIntegration> {
    const patch: Database["public"]["Tables"]["n8n_integrations"]["Update"] =
      {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.webhookUrl !== undefined) patch.webhook_url = input.webhookUrl;
    if (input.httpMethod !== undefined) patch.http_method = input.httpMethod;
    if (input.headers !== undefined) patch.headers = input.headers;
    if (input.authType !== undefined) patch.auth_type = input.authType;
    if (input.authCredentialsPlainText !== undefined) {
      patch.auth_credentials_encrypted = input.authCredentialsPlainText
        ? encryptCredential(input.authCredentialsPlainText)
        : null;
    }
    if (input.dynamicVariables !== undefined)
      patch.dynamic_variables = input.dynamicVariables;
    if (input.timeoutMs !== undefined) patch.timeout_ms = input.timeoutMs;
    if (input.retryCount !== undefined) patch.retry_count = input.retryCount;
    if (input.retryBackoffMs !== undefined)
      patch.retry_backoff_ms = input.retryBackoffMs;
    if (input.errorHandlingStrategy !== undefined)
      patch.error_handling_strategy = input.errorHandlingStrategy;
    if (input.expectedResponseFormat !== undefined)
      patch.expected_response_format =
        input.expectedResponseFormat as unknown as Json;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await this.client
      .from("n8n_integrations")
      .update(patch)
      .eq("id", id)
      .select(SAFE_COLUMNS)
      .single();
    if (error) throw error;
    return toEntity(data as unknown as N8nIntegrationSafeRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("n8n_integrations")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async getDecryptedCredentials(id: string): Promise<string | null> {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("n8n_integrations")
      .select("auth_credentials_encrypted")
      .eq("id", id)
      .single();
    if (error || !data) {
      throw new Error("No se encontró la integración de n8n.");
    }
    return data.auth_credentials_encrypted
      ? decryptCredential(data.auth_credentials_encrypted)
      : null;
  }
}

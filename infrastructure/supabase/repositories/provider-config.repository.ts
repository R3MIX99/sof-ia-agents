import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ProviderConfig } from "@/domain/entities/provider-config.entity";
import type {
  CreateProviderConfigInput,
  ProviderConfigRepository,
  UpdateProviderConfigInput,
} from "@/domain/repositories-interfaces/provider-config-repository.interface";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin";
import {
  decryptCredential,
  encryptCredential,
} from "@/lib/encryption/credential-cipher";

// Nunca incluye `credentials_encrypted`: esa columna no es seleccionable
// por el rol `authenticated` (ver migración de la sección 15.11).
const SAFE_COLUMNS =
  "id, organization_id, provider, model, default_temperature, default_max_tokens, default_system_prompt, validation_status, last_validated_at, created_at, updated_at";

interface ProviderConfigSafeRow {
  id: string;
  organization_id: string;
  provider: string;
  model: string;
  default_temperature: number | null;
  default_max_tokens: number | null;
  default_system_prompt: string | null;
  validation_status: string;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

function toEntity(row: ProviderConfigSafeRow): ProviderConfig {
  return {
    id: row.id,
    organizationId: row.organization_id,
    provider: row.provider as ProviderConfig["provider"],
    model: row.model,
    defaultTemperature: row.default_temperature,
    defaultMaxTokens: row.default_max_tokens,
    defaultSystemPrompt: row.default_system_prompt,
    validationStatus: row.validation_status as ProviderConfig["validationStatus"],
    lastValidatedAt: row.last_validated_at ? new Date(row.last_validated_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseProviderConfigRepository implements ProviderConfigRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<ProviderConfig | null> {
    const { data, error } = await this.client
      .from("provider_configs")
      .select(SAFE_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data as unknown as ProviderConfigSafeRow) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<ProviderConfig[]> {
    const { data, error } = await this.client
      .from("provider_configs")
      .select(SAFE_COLUMNS)
      .eq("organization_id", organizationId);
    if (error) throw error;
    return ((data ?? []) as unknown as ProviderConfigSafeRow[]).map(toEntity);
  }

  async create(input: CreateProviderConfigInput): Promise<ProviderConfig> {
    const { data, error } = await this.client
      .from("provider_configs")
      .insert({
        organization_id: input.organizationId,
        provider: input.provider,
        credentials_encrypted: encryptCredential(input.credentialsPlainText),
        model: input.model,
        default_temperature: input.defaultTemperature ?? null,
        default_max_tokens: input.defaultMaxTokens ?? null,
        default_system_prompt: input.defaultSystemPrompt ?? null,
      })
      .select(SAFE_COLUMNS)
      .single();
    if (error) throw error;
    return toEntity(data as unknown as ProviderConfigSafeRow);
  }

  async update(
    id: string,
    input: UpdateProviderConfigInput,
  ): Promise<ProviderConfig> {
    const patch: Database["public"]["Tables"]["provider_configs"]["Update"] =
      {};
    if (input.credentialsPlainText !== undefined) {
      patch.credentials_encrypted = encryptCredential(input.credentialsPlainText);
      // Rotar la credencial invalida el último estado de validación conocido.
      patch.validation_status = "pendiente";
      patch.last_validated_at = null;
    }
    if (input.model !== undefined) patch.model = input.model;
    if (input.defaultTemperature !== undefined)
      patch.default_temperature = input.defaultTemperature;
    if (input.defaultMaxTokens !== undefined)
      patch.default_max_tokens = input.defaultMaxTokens;
    if (input.defaultSystemPrompt !== undefined)
      patch.default_system_prompt = input.defaultSystemPrompt;
    if (input.validationStatus !== undefined)
      patch.validation_status = input.validationStatus;
    if (input.lastValidatedAt !== undefined) {
      patch.last_validated_at = input.lastValidatedAt
        ? input.lastValidatedAt.toISOString()
        : null;
    }

    const { data, error } = await this.client
      .from("provider_configs")
      .update(patch)
      .eq("id", id)
      .select(SAFE_COLUMNS)
      .single();
    if (error) throw error;
    return toEntity(data as unknown as ProviderConfigSafeRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("provider_configs")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async getDecryptedCredentials(id: string): Promise<string> {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("provider_configs")
      .select("credentials_encrypted")
      .eq("id", id)
      .single();
    if (error || !data) {
      throw new Error("No se encontró la configuración del proveedor.");
    }
    return decryptCredential(data.credentials_encrypted);
  }
}

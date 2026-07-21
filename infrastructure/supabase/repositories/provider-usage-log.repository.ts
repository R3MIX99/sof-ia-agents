import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ProviderUsageLog } from "@/domain/entities/provider-usage-log.entity";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin";

type ProviderUsageLogRow =
  Database["public"]["Tables"]["provider_usage_logs"]["Row"];

export interface LogProviderUsageInput {
  providerConfigId: string;
  widgetId: string;
  conversationId?: string | null;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: ProviderUsageLog["status"];
  errorType?: ProviderUsageLog["errorType"];
}

function toEntity(row: ProviderUsageLogRow): ProviderUsageLog {
  return {
    id: row.id,
    providerConfigId: row.provider_config_id,
    widgetId: row.widget_id,
    conversationId: row.conversation_id,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    latencyMs: row.latency_ms,
    status: row.status as ProviderUsageLog["status"],
    errorType: row.error_type as ProviderUsageLog["errorType"],
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseProviderUsageLogRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByProviderConfigId(
    providerConfigId: string,
  ): Promise<ProviderUsageLog[]> {
    const { data, error } = await this.client
      .from("provider_usage_logs")
      .select("*")
      .eq("provider_config_id", providerConfigId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  /** Escritura exclusiva mediante el rol de servicio (sección 15.12). */
  async log(input: LogProviderUsageInput): Promise<void> {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("provider_usage_logs").insert({
      provider_config_id: input.providerConfigId,
      widget_id: input.widgetId,
      conversation_id: input.conversationId ?? null,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      latency_ms: input.latencyMs,
      status: input.status,
      error_type: input.errorType ?? null,
    });
    if (error) throw error;
  }
}

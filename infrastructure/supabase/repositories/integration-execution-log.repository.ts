import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { IntegrationExecutionLog } from "@/domain/entities/integration-execution-log.entity";
import type {
  CreateIntegrationExecutionLogInput,
  IntegrationExecutionLogRepository,
} from "@/domain/repositories-interfaces/integration-execution-log-repository.interface";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin";

type IntegrationExecutionLogRow =
  Database["public"]["Tables"]["integration_execution_logs"]["Row"];

function toEntity(row: IntegrationExecutionLogRow): IntegrationExecutionLog {
  return {
    id: row.id,
    integrationId: row.integration_id,
    widgetId: row.widget_id,
    conversationId: row.conversation_id,
    requestPayload: row.request_payload as Record<string, unknown>,
    responsePayload: row.response_payload as Record<string, unknown> | null,
    statusCode: row.status_code,
    durationMs: row.duration_ms,
    attemptNumber: row.attempt_number,
    result: row.result as IntegrationExecutionLog["result"],
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseIntegrationExecutionLogRepository
  implements IntegrationExecutionLogRepository
{
  constructor(private readonly client: SupabaseClient<Database>) {}

  /** Escritura exclusiva mediante el cliente de servicio (sección 15.15: RLS solo concede select a `authenticated`). */
  async create(
    input: CreateIntegrationExecutionLogInput,
  ): Promise<IntegrationExecutionLog> {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("integration_execution_logs")
      .insert({
        integration_id: input.integrationId,
        widget_id: input.widgetId ?? null,
        conversation_id: input.conversationId ?? null,
        request_payload: input.requestPayload as Json,
        response_payload: (input.responsePayload ?? null) as Json | null,
        status_code: input.statusCode ?? null,
        duration_ms: input.durationMs,
        attempt_number: input.attemptNumber,
        result: input.result,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async findByIntegrationId(
    integrationId: string,
    limit = 20,
  ): Promise<IntegrationExecutionLog[]> {
    const { data, error } = await this.client
      .from("integration_execution_logs")
      .select("*")
      .eq("integration_id", integrationId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async findByWidgetId(
    widgetId: string,
    limit = 20,
  ): Promise<IntegrationExecutionLog[]> {
    const { data, error } = await this.client
      .from("integration_execution_logs")
      .select("*")
      .eq("widget_id", widgetId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }
}

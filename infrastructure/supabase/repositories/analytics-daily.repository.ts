import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { AnalyticsDailyMetric } from "@/domain/entities/analytics-daily.entity";
import type {
  AnalyticsDailyRepository,
  UpsertAnalyticsDailyInput,
} from "@/domain/repositories-interfaces/analytics-daily-repository.interface";

type AnalyticsDailyRow = Database["public"]["Tables"]["analytics_daily"]["Row"];

function toEntity(row: AnalyticsDailyRow): AnalyticsDailyMetric {
  return {
    id: row.id,
    widgetId: row.widget_id,
    date: row.date,
    uniqueUsers: row.unique_users,
    conversationsCount: row.conversations_count,
    messagesSent: row.messages_sent,
    messagesReceived: row.messages_received,
    avgResponseTimeMs: row.avg_response_time_ms,
    errorsCount: row.errors_count,
    tokensInputTotal: row.tokens_input_total,
    tokensOutputTotal: row.tokens_output_total,
  };
}

export class SupabaseAnalyticsDailyRepository
  implements AnalyticsDailyRepository
{
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByWidgetAndDateRange(
    widgetId: string,
    startDate: string,
    endDate: string,
  ): Promise<AnalyticsDailyMetric[]> {
    const { data, error } = await this.client
      .from("analytics_daily")
      .select("*")
      .eq("widget_id", widgetId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async findByWidgetAndDate(
    widgetId: string,
    date: string,
  ): Promise<AnalyticsDailyMetric | null> {
    const { data, error } = await this.client
      .from("analytics_daily")
      .select("*")
      .eq("widget_id", widgetId)
      .eq("date", date)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async upsert(
    input: UpsertAnalyticsDailyInput,
  ): Promise<AnalyticsDailyMetric> {
    const { data, error } = await this.client
      .from("analytics_daily")
      .upsert(
        {
          widget_id: input.widgetId,
          date: input.date,
          unique_users: input.uniqueUsers,
          conversations_count: input.conversationsCount,
          messages_sent: input.messagesSent,
          messages_received: input.messagesReceived,
          avg_response_time_ms: input.avgResponseTimeMs,
          errors_count: input.errorsCount,
          tokens_input_total: input.tokensInputTotal,
          tokens_output_total: input.tokensOutputTotal,
        },
        { onConflict: "widget_id,date" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }
}

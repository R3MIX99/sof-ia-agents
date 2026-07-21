import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseAnalyticsDailyRepository } from "@/infrastructure/supabase/repositories/analytics-daily.repository";
import type { AnalyticsDailyMetric } from "@/domain/entities/analytics-daily.entity";

export interface AnalyticsSummary {
  totalUniqueUsers: number;
  totalConversations: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  avgResponseTimeMs: number;
  totalErrors: number;
  totalTokensInput: number;
  totalTokensOutput: number;
}

export interface RatingFeedbackItem {
  conversationId: string;
  visitorName: string | null;
  startedAt: Date;
  rating: number | null;
  feedbackText: string | null;
}

function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** Servicio de agregación de analíticas (sección 14): calcula y cachea las métricas diarias por widget en analytics_daily. */
export class AnalyticsService {
  private readonly analyticsDaily: SupabaseAnalyticsDailyRepository;

  constructor(private readonly client: SupabaseClient<Database>) {
    this.analyticsDaily = new SupabaseAnalyticsDailyRepository(client);
  }

  async getMetricsForRange(
    widgetId: string,
    startDate: string,
    endDate: string,
  ): Promise<AnalyticsDailyMetric[]> {
    const today = new Date().toISOString().slice(0, 10);
    const cached = await this.analyticsDaily.findByWidgetAndDateRange(
      widgetId,
      startDate,
      endDate,
    );
    const cachedByDate = new Map(cached.map((m) => [m.date, m]));

    const results = await Promise.all(
      enumerateDates(startDate, endDate).map(async (date) => {
        // El día en curso aún puede recibir conversaciones nuevas; nunca se
        // sirve desde caché para evitar quedar desactualizado.
        if (date === today) return this.computeAndStore(widgetId, date);
        return cachedByDate.get(date) ?? this.computeAndStore(widgetId, date);
      }),
    );

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  private async computeAndStore(
    widgetId: string,
    date: string,
  ): Promise<AnalyticsDailyMetric> {
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    const { data: conversations, error: convError } = await this.client
      .from("conversations")
      .select("id, session_id")
      .eq("widget_id", widgetId)
      .gte("started_at", dayStart)
      .lte("started_at", dayEnd);
    if (convError) throw convError;

    const conversationIds = (conversations ?? []).map((c) => c.id);
    const uniqueSessions = new Set((conversations ?? []).map((c) => c.session_id));

    let messagesSent = 0;
    let messagesReceived = 0;
    let latencySum = 0;
    let latencyCount = 0;
    let tokensInputTotal = 0;
    let tokensOutputTotal = 0;

    if (conversationIds.length > 0) {
      const { data: messages, error: msgError } = await this.client
        .from("messages")
        .select("role, latency_ms, tokens_input, tokens_output")
        .in("conversation_id", conversationIds);
      if (msgError) throw msgError;

      for (const message of messages ?? []) {
        if (message.role === "usuario") {
          messagesSent += 1;
        } else if (message.role === "asistente") {
          messagesReceived += 1;
          if (message.latency_ms != null) {
            latencySum += message.latency_ms;
            latencyCount += 1;
          }
          tokensInputTotal += message.tokens_input ?? 0;
          tokensOutputTotal += message.tokens_output ?? 0;
        }
      }
    }

    const { count: errorsCount, error: eventsError } = await this.client
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("widget_id", widgetId)
      .in("severity", ["error", "crítico"])
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd);
    if (eventsError) throw eventsError;

    return this.analyticsDaily.upsert({
      widgetId,
      date,
      uniqueUsers: uniqueSessions.size,
      conversationsCount: conversationIds.length,
      messagesSent,
      messagesReceived,
      avgResponseTimeMs: latencyCount
        ? Math.round(latencySum / latencyCount)
        : 0,
      errorsCount: errorsCount ?? 0,
      tokensInputTotal,
      tokensOutputTotal,
    });
  }

  async getSummary(
    widgetId: string,
    startDate: string,
    endDate: string,
  ): Promise<AnalyticsSummary> {
    const metrics = await this.getMetricsForRange(widgetId, startDate, endDate);
    const totalMessagesReceived = metrics.reduce(
      (sum, m) => sum + m.messagesReceived,
      0,
    );
    const weightedLatency = metrics.reduce(
      (sum, m) => sum + m.avgResponseTimeMs * m.messagesReceived,
      0,
    );

    return {
      totalUniqueUsers: metrics.reduce((sum, m) => sum + m.uniqueUsers, 0),
      totalConversations: metrics.reduce(
        (sum, m) => sum + m.conversationsCount,
        0,
      ),
      totalMessagesSent: metrics.reduce((sum, m) => sum + m.messagesSent, 0),
      totalMessagesReceived,
      avgResponseTimeMs: totalMessagesReceived
        ? Math.round(weightedLatency / totalMessagesReceived)
        : 0,
      totalErrors: metrics.reduce((sum, m) => sum + m.errorsCount, 0),
      totalTokensInput: metrics.reduce(
        (sum, m) => sum + m.tokensInputTotal,
        0,
      ),
      totalTokensOutput: metrics.reduce(
        (sum, m) => sum + m.tokensOutputTotal,
        0,
      ),
    };
  }

  /** Tabla de calificaciones y retroalimentación (sección 9.3). */
  async getRatingsAndFeedback(
    widgetId: string,
    startDate: string,
    endDate: string,
  ): Promise<RatingFeedbackItem[]> {
    const { data, error } = await this.client
      .from("conversations")
      .select("id, visitor_name, started_at, rating, feedback_text")
      .eq("widget_id", widgetId)
      .gte("started_at", `${startDate}T00:00:00.000Z`)
      .lte("started_at", `${endDate}T23:59:59.999Z`)
      .not("rating", "is", null)
      .order("started_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      conversationId: row.id,
      visitorName: row.visitor_name,
      startedAt: new Date(row.started_at),
      rating: row.rating,
      feedbackText: row.feedback_text,
    }));
  }
}

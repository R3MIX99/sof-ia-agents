import type { AnalyticsDailyMetric } from "@/domain/entities/analytics-daily.entity";

export interface UpsertAnalyticsDailyInput {
  widgetId: string;
  date: string;
  uniqueUsers: number;
  conversationsCount: number;
  messagesSent: number;
  messagesReceived: number;
  avgResponseTimeMs: number;
  errorsCount: number;
  tokensInputTotal: number;
  tokensOutputTotal: number;
}

export interface AnalyticsDailyRepository {
  findByWidgetAndDateRange(
    widgetId: string,
    startDate: string,
    endDate: string,
  ): Promise<AnalyticsDailyMetric[]>;
  findByWidgetAndDate(
    widgetId: string,
    date: string,
  ): Promise<AnalyticsDailyMetric | null>;
  upsert(input: UpsertAnalyticsDailyInput): Promise<AnalyticsDailyMetric>;
}

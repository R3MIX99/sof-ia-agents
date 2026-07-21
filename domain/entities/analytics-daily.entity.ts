/** Tabla de agregación diaria precalculada (sección 15.19), consultada por la pantalla Analíticas. */
export interface AnalyticsDailyMetric {
  id: string;
  widgetId: string;
  /** Fecha en formato ISO (YYYY-MM-DD). */
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

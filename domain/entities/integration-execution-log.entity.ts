export type IntegrationExecutionResult = "éxito" | "error" | "tiempo_agotado";

export interface IntegrationExecutionLog {
  id: string;
  integrationId: string;
  /** Nulo cuando la ejecución corresponde a una prueba de conexión previa a cualquier asociación con un widget (sección 9.5). */
  widgetId: string | null;
  conversationId: string | null;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown> | null;
  statusCode: number | null;
  durationMs: number;
  attemptNumber: number;
  result: IntegrationExecutionResult;
  createdAt: Date;
}

import type {
  IntegrationExecutionLog,
  IntegrationExecutionResult,
} from "@/domain/entities/integration-execution-log.entity";

export interface CreateIntegrationExecutionLogInput {
  integrationId: string;
  widgetId?: string | null;
  conversationId?: string | null;
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown> | null;
  statusCode?: number | null;
  durationMs: number;
  attemptNumber: number;
  result: IntegrationExecutionResult;
}

export interface IntegrationExecutionLogRepository {
  /** Escritura exclusiva mediante el cliente de servicio (sección 15.15). */
  create(
    input: CreateIntegrationExecutionLogInput,
  ): Promise<IntegrationExecutionLog>;
  findByIntegrationId(
    integrationId: string,
    limit?: number,
  ): Promise<IntegrationExecutionLog[]>;
  findByWidgetId(
    widgetId: string,
    limit?: number,
  ): Promise<IntegrationExecutionLog[]>;
}

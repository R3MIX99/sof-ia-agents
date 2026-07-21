import type {
  WidgetIntegration,
  WidgetIntegrationTriggerPoint,
} from "@/domain/entities/widget-integration.entity";

export interface CreateWidgetIntegrationInput {
  widgetId: string;
  integrationId: string;
  triggerPoint: WidgetIntegrationTriggerPoint;
  executionOrder?: number;
}

export interface UpdateWidgetIntegrationInput {
  triggerPoint?: WidgetIntegrationTriggerPoint;
  executionOrder?: number;
}

export interface WidgetIntegrationRepository {
  findById(id: string): Promise<WidgetIntegration | null>;
  findByWidgetId(widgetId: string): Promise<WidgetIntegration[]>;
  create(input: CreateWidgetIntegrationInput): Promise<WidgetIntegration>;
  update(
    id: string,
    input: UpdateWidgetIntegrationInput,
  ): Promise<WidgetIntegration>;
  delete(id: string): Promise<void>;
}

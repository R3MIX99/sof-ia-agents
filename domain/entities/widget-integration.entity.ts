export type WidgetIntegrationTriggerPoint =
  | "antes_ia"
  | "después_ia"
  | "independiente";

export interface WidgetIntegration {
  id: string;
  widgetId: string;
  integrationId: string;
  triggerPoint: WidgetIntegrationTriggerPoint;
  executionOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

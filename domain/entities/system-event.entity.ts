export type EventSeverity = "información" | "advertencia" | "error" | "crítico";
export type EventSource = "widget" | "proveedor" | "integración n8n" | "sistema";

/** Registro general de eventos del sistema (sección 15.20), utilizado por la pantalla Logs. */
export interface SystemEvent {
  id: string;
  organizationId: string;
  widgetId: string | null;
  eventType: string;
  severity: EventSeverity;
  source: EventSource;
  details: Record<string, unknown>;
  createdAt: Date;
}

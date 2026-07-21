import type {
  EventSeverity,
  EventSource,
  SystemEvent,
} from "@/domain/entities/system-event.entity";

export interface CreateSystemEventInput {
  organizationId: string;
  widgetId?: string | null;
  eventType: string;
  severity: EventSeverity;
  source: EventSource;
  details?: Record<string, unknown>;
}

export interface EventLogFilters {
  widgetId?: string;
  severity?: EventSeverity;
  source?: EventSource;
}

export interface EventLogRepository {
  create(input: CreateSystemEventInput): Promise<SystemEvent>;
  listByOrganization(
    organizationId: string,
    filters?: EventLogFilters,
    limit?: number,
  ): Promise<SystemEvent[]>;
}

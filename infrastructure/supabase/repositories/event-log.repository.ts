import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type {
  EventSeverity,
  EventSource,
  SystemEvent,
} from "@/domain/entities/system-event.entity";
import type {
  CreateSystemEventInput,
  EventLogFilters,
  EventLogRepository,
} from "@/domain/repositories-interfaces/event-log-repository.interface";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

function toEntity(row: EventRow): SystemEvent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    widgetId: row.widget_id,
    eventType: row.event_type,
    severity: row.severity as EventSeverity,
    source: row.source as EventSource,
    details: (row.details as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseEventLogRepository implements EventLogRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateSystemEventInput): Promise<SystemEvent> {
    const { data, error } = await this.client
      .from("events")
      .insert({
        organization_id: input.organizationId,
        widget_id: input.widgetId ?? null,
        event_type: input.eventType,
        severity: input.severity,
        source: input.source,
        details: (input.details ?? {}) as Json,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async listByOrganization(
    organizationId: string,
    filters: EventLogFilters = {},
    limit = 100,
  ): Promise<SystemEvent[]> {
    let query = this.client
      .from("events")
      .select("*")
      .eq("organization_id", organizationId);

    if (filters.widgetId) query = query.eq("widget_id", filters.widgetId);
    if (filters.severity) query = query.eq("severity", filters.severity);
    if (filters.source) query = query.eq("source", filters.source);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }
}

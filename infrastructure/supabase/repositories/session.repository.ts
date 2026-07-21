import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Session, SessionStatus } from "@/domain/entities/session.entity";
import type {
  CreateSessionInput,
  SessionRepository,
} from "@/domain/repositories-interfaces/session-repository.interface";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

function toEntity(row: SessionRow): Session {
  return {
    id: row.id,
    widgetId: row.widget_id,
    visitorIdentifier: row.visitor_identifier,
    visitorName: row.visitor_name,
    domain: row.domain,
    userAgent: row.user_agent,
    startedAt: new Date(row.started_at),
    lastActivityAt: new Date(row.last_activity_at),
    status: row.status as SessionStatus,
  };
}

export class SupabaseSessionRepository implements SessionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Session | null> {
    const { data, error } = await this.client
      .from("sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findActiveByWidgetAndVisitor(
    widgetId: string,
    visitorIdentifier: string,
  ): Promise<Session | null> {
    const { data, error } = await this.client
      .from("sessions")
      .select("*")
      .eq("widget_id", widgetId)
      .eq("visitor_identifier", visitorIdentifier)
      .eq("status", "activa")
      .order("last_activity_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const { data, error } = await this.client
      .from("sessions")
      .insert({
        widget_id: input.widgetId,
        visitor_identifier: input.visitorIdentifier,
        visitor_name: input.visitorName ?? null,
        domain: input.domain,
        user_agent: input.userAgent ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async touch(id: string): Promise<Session> {
    const { data, error } = await this.client
      .from("sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async updateVisitorName(
    id: string,
    visitorName: string | null,
  ): Promise<Session> {
    const { data, error } = await this.client
      .from("sessions")
      .update({ visitor_name: visitorName })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async close(id: string, status: SessionStatus): Promise<Session> {
    const { data, error } = await this.client
      .from("sessions")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }
}

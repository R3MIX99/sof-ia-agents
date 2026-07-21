import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  Conversation,
  ConversationOutcome,
} from "@/domain/entities/conversation.entity";
import type {
  ConversationListFilters,
  ConversationListPage,
  ConversationRepository,
  CreateConversationInput,
} from "@/domain/repositories-interfaces/conversation-repository.interface";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];

interface ConversationWithWidgetRow extends ConversationRow {
  widgets: { name: string } | null;
}

function toEntity(row: ConversationRow): Conversation {
  return {
    id: row.id,
    widgetId: row.widget_id,
    sessionId: row.session_id,
    visitorName: row.visitor_name,
    startedAt: new Date(row.started_at),
    endedAt: row.ended_at ? new Date(row.ended_at) : null,
    outcome: row.outcome as ConversationOutcome,
    rating: row.rating,
    feedbackText: row.feedback_text,
  };
}

export class SupabaseConversationRepository implements ConversationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Conversation | null> {
    const { data, error } = await this.client
      .from("conversations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findOpenBySessionId(sessionId: string): Promise<Conversation | null> {
    const { data, error } = await this.client
      .from("conversations")
      .select("*")
      .eq("session_id", sessionId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async create(input: CreateConversationInput): Promise<Conversation> {
    const { data, error } = await this.client
      .from("conversations")
      .insert({
        widget_id: input.widgetId,
        session_id: input.sessionId,
        visitor_name: input.visitorName ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async updateVisitorName(
    id: string,
    visitorName: string | null,
  ): Promise<Conversation> {
    const { data, error } = await this.client
      .from("conversations")
      .update({ visitor_name: visitorName })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async close(
    id: string,
    outcome: ConversationOutcome,
  ): Promise<Conversation> {
    const { data, error } = await this.client
      .from("conversations")
      .update({ outcome, ended_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  /** Historial de conversaciones de toda la organización, con filtros y paginación (sección 9.12). */
  async listByOrganization(
    organizationId: string,
    filters: ConversationListFilters,
    pagination: { page: number; pageSize: number },
  ): Promise<ConversationListPage> {
    let query = this.client
      .from("conversations")
      .select("*, widgets!inner(name, organization_id)", { count: "exact" })
      .eq("widgets.organization_id", organizationId);

    if (filters.widgetId) query = query.eq("widget_id", filters.widgetId);
    if (filters.outcome) query = query.eq("outcome", filters.outcome);
    if (filters.visitorName)
      query = query.ilike("visitor_name", `%${filters.visitorName}%`);
    if (filters.dateFrom) query = query.gte("started_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("started_at", filters.dateTo);

    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;

    const { data, error, count } = await query
      .order("started_at", { ascending: false })
      .range(from, to);
    if (error) throw error;

    const rows = (data ?? []) as unknown as ConversationWithWidgetRow[];
    const items = await Promise.all(
      rows.map(async (row) => {
        const { count: messageCount } = await this.client
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", row.id);
        return {
          ...toEntity(row),
          widgetName: row.widgets?.name ?? "Widget eliminado",
          messageCount: messageCount ?? 0,
        };
      }),
    );

    return { items, total: count ?? 0 };
  }
}

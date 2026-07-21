import type {
  Conversation,
  ConversationOutcome,
} from "@/domain/entities/conversation.entity";

export interface CreateConversationInput {
  widgetId: string;
  sessionId: string;
  visitorName?: string | null;
}

export interface ConversationListFilters {
  widgetId?: string;
  outcome?: ConversationOutcome;
  /** Búsqueda parcial, insensible a mayúsculas, sobre visitor_name (sección 9.12). */
  visitorName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ConversationListItem extends Conversation {
  widgetName: string;
  messageCount: number;
}

export interface ConversationListPage {
  items: ConversationListItem[];
  total: number;
}

/** Escritura exclusiva mediante funciones de servidor invocadas desde la API pública del widget (sección 15.17). */
export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  /** Conversación abierta (ended_at nulo) más reciente de una sesión, si existe. */
  findOpenBySessionId(sessionId: string): Promise<Conversation | null>;
  create(input: CreateConversationInput): Promise<Conversation>;
  updateVisitorName(
    id: string,
    visitorName: string | null,
  ): Promise<Conversation>;
  close(id: string, outcome: ConversationOutcome): Promise<Conversation>;
  /** Historial de conversaciones de toda la organización, con filtros y paginación (sección 9.12). */
  listByOrganization(
    organizationId: string,
    filters: ConversationListFilters,
    pagination: { page: number; pageSize: number },
  ): Promise<ConversationListPage>;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/repositories/conversation.repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/repositories/message.repository";
import type { Conversation } from "@/domain/entities/conversation.entity";
import type { Message } from "@/domain/entities/message.entity";
import type {
  ConversationListFilters,
  ConversationListPage,
} from "@/domain/repositories-interfaces/conversation-repository.interface";
import { ApiError } from "@/lib/http/api-error";

/** Servicio de conversaciones, incluyendo el listado y la búsqueda para el Historial del dashboard (sección 9.12). */
export class ConversationService {
  private readonly conversations: SupabaseConversationRepository;
  private readonly messages: SupabaseMessageRepository;

  constructor(client: SupabaseClient<Database>) {
    this.conversations = new SupabaseConversationRepository(client);
    this.messages = new SupabaseMessageRepository(client);
  }

  async getById(id: string): Promise<Conversation | null> {
    return this.conversations.findById(id);
  }

  /** Elimina el nombre almacenado del visitante sin afectar sus mensajes (sección 12.5). */
  async clearVisitorName(id: string): Promise<Conversation> {
    return this.conversations.updateVisitorName(id, null);
  }

  async listByOrganization(
    organizationId: string,
    filters: ConversationListFilters,
    pagination: { page: number; pageSize: number },
  ): Promise<ConversationListPage> {
    return this.conversations.listByOrganization(
      organizationId,
      filters,
      pagination,
    );
  }

  /** Hilo completo de mensajes de una conversación, para el visor del Historial (sección 9.12). */
  async getMessages(conversationId: string): Promise<Message[]> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      throw new ApiError(
        "not_found",
        "conversation_not_found",
        "No se encontró la conversación solicitada.",
        404,
      );
    }
    return this.messages.findByConversationId(conversationId);
  }
}

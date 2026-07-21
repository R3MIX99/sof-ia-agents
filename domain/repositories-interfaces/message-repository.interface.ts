import type {
  Message,
  MessageContentFormat,
  MessageRole,
} from "@/domain/entities/message.entity";

export interface CreateMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  contentFormat: MessageContentFormat;
  tokensInput?: number | null;
  tokensOutput?: number | null;
  latencyMs?: number | null;
  sequenceNumber: number;
}

/** Escritura exclusiva mediante funciones de servidor invocadas desde la API pública del widget (sección 15.18). */
export interface MessageRepository {
  create(input: CreateMessageInput): Promise<Message>;
  findByConversationId(conversationId: string): Promise<Message[]>;
  countByConversationId(conversationId: string): Promise<number>;
}

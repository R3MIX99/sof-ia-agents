import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  Message,
  MessageContentFormat,
  MessageRole,
} from "@/domain/entities/message.entity";
import type {
  CreateMessageInput,
  MessageRepository,
} from "@/domain/repositories-interfaces/message-repository.interface";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

function toEntity(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as MessageRole,
    content: row.content,
    contentFormat: row.content_format as MessageContentFormat,
    tokensInput: row.tokens_input,
    tokensOutput: row.tokens_output,
    latencyMs: row.latency_ms,
    sequenceNumber: row.sequence_number,
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseMessageRepository implements MessageRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateMessageInput): Promise<Message> {
    const { data, error } = await this.client
      .from("messages")
      .insert({
        conversation_id: input.conversationId,
        role: input.role,
        content: input.content,
        content_format: input.contentFormat,
        tokens_input: input.tokensInput ?? null,
        tokens_output: input.tokensOutput ?? null,
        latency_ms: input.latencyMs ?? null,
        sequence_number: input.sequenceNumber,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.client
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("sequence_number", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async countByConversationId(conversationId: string): Promise<number> {
    const { count, error } = await this.client
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId);
    if (error) throw error;
    return count ?? 0;
  }
}

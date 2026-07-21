export type MessageRole = "usuario" | "asistente" | "sistema" | "integración";
export type MessageContentFormat = "texto simple" | "markdown";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  contentFormat: MessageContentFormat;
  tokensInput: number | null;
  tokensOutput: number | null;
  latencyMs: number | null;
  sequenceNumber: number;
  createdAt: Date;
}

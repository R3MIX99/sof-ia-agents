export type ConversationOutcome = "completada" | "abandonada" | "con error";

export interface Conversation {
  id: string;
  widgetId: string;
  sessionId: string;
  visitorName: string | null;
  startedAt: Date;
  endedAt: Date | null;
  outcome: ConversationOutcome;
  rating: number | null;
  feedbackText: string | null;
}

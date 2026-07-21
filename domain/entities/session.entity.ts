export type SessionStatus = "activa" | "expirada" | "cerrada";

export interface Session {
  id: string;
  widgetId: string;
  visitorIdentifier: string;
  visitorName: string | null;
  domain: string;
  userAgent: string | null;
  startedAt: Date;
  lastActivityAt: Date;
  status: SessionStatus;
}

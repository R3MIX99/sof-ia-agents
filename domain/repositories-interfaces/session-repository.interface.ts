import type { Session, SessionStatus } from "@/domain/entities/session.entity";

export interface CreateSessionInput {
  widgetId: string;
  visitorIdentifier: string;
  visitorName?: string | null;
  domain: string;
  userAgent?: string | null;
}

/** Escritura exclusiva mediante funciones de servidor invocadas desde la API pública del widget (sección 15.16). */
export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  findActiveByWidgetAndVisitor(
    widgetId: string,
    visitorIdentifier: string,
  ): Promise<Session | null>;
  create(input: CreateSessionInput): Promise<Session>;
  touch(id: string): Promise<Session>;
  updateVisitorName(id: string, visitorName: string | null): Promise<Session>;
  close(id: string, status: SessionStatus): Promise<Session>;
}

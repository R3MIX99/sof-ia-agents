import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseSessionRepository } from "@/infrastructure/supabase/repositories/session.repository";
import type { Session } from "@/domain/entities/session.entity";
import type { Widget } from "@/domain/entities/widget.entity";
import { ApiError } from "@/lib/http/api-error";

export interface InitializeSessionInput {
  visitorIdentifier: string;
  visitorName?: string | null;
  domain: string;
  userAgent?: string | null;
}

/** Servicio de sesiones (sección 13.6): inicialización y renovación desde la API pública del widget. */
export class SessionService {
  private readonly sessions: SupabaseSessionRepository;

  constructor(client: SupabaseClient<Database>) {
    this.sessions = new SupabaseSessionRepository(client);
  }

  /** Honra la configuración de persistencia de sesión del widget (sección 10): si está habilitada, reutiliza la sesión activa del mismo visitante; si no, crea siempre una sesión nueva. */
  async initialize(widget: Widget, input: InitializeSessionInput): Promise<Session> {
    if (widget.persistConversationAcrossSessions) {
      const existing = await this.sessions.findActiveByWidgetAndVisitor(
        widget.id,
        input.visitorIdentifier,
      );
      if (existing) {
        const touched = await this.sessions.touch(existing.id);
        if (input.visitorName && !touched.visitorName) {
          return this.sessions.updateVisitorName(existing.id, input.visitorName);
        }
        return touched;
      }
    }

    return this.sessions.create({
      widgetId: widget.id,
      visitorIdentifier: input.visitorIdentifier,
      visitorName: input.visitorName ?? null,
      domain: input.domain,
      userAgent: input.userAgent ?? null,
    });
  }

  async getById(sessionId: string): Promise<Session | null> {
    return this.sessions.findById(sessionId);
  }

  async renew(sessionId: string): Promise<Session> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new ApiError(
        "not_found",
        "session_not_found",
        "No se encontró la sesión.",
        404,
      );
    }
    if (session.status !== "activa") {
      throw new ApiError(
        "validation",
        "session_closed",
        "La sesión ya no está activa.",
        410,
      );
    }
    return this.sessions.touch(sessionId);
  }

  /** Elimina el nombre almacenado del visitante sin afectar sus mensajes (sección 12.5). */
  async clearVisitorName(sessionId: string): Promise<Session> {
    return this.sessions.updateVisitorName(sessionId, null);
  }
}

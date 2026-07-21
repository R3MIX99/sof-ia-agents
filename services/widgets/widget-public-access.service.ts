import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseWidgetRepository } from "@/infrastructure/supabase/repositories/widget.repository";
import { SupabaseWidgetAppearanceRepository } from "@/infrastructure/supabase/repositories/widget-appearance.repository";
import { SupabaseWidgetDomainRepository } from "@/infrastructure/supabase/repositories/widget-domain.repository";
import { SupabaseWidgetScheduleRepository } from "@/infrastructure/supabase/repositories/widget-schedule.repository";
import { SupabaseSnippetRepository } from "@/infrastructure/supabase/repositories/snippet.repository";
import type { Widget } from "@/domain/entities/widget.entity";
import type { WidgetAppearance } from "@/domain/entities/widget-appearance.entity";
import type { WidgetSchedule } from "@/domain/entities/widget-schedule.entity";
import { matchesAllowedDomain } from "@/lib/validation/domain-matcher";
import { isWidgetWithinSchedule } from "@/lib/validation/schedule-matcher";
import { ApiError } from "@/lib/http/api-error";

export interface PublicWidgetAccess {
  widget: Widget;
  appearance: WidgetAppearance | null;
  availableNow: boolean;
  outOfScheduleBehavior: WidgetSchedule["outOfScheduleBehavior"];
}

export type PublicWidgetAppearance = Omit<
  WidgetAppearance,
  "id" | "widgetId" | "createdAt" | "updatedAt"
>;

/** Configuración pública del widget (sección 12.2, paso 6): excluye cualquier credencial o dato sensible de la organización. */
export interface PublicWidgetConfig {
  widgetId: string;
  name: string;
  language: string;
  availableNow: boolean;
  outOfScheduleBehavior: WidgetSchedule["outOfScheduleBehavior"];
  persistConversationAcrossSessions: boolean;
  maxMessagesPerSession: number | null;
  inactivityBehavior: Widget["inactivityBehavior"];
  appearance: PublicWidgetAppearance | null;
}

/**
 * Resuelve y valida el acceso público a un widget (secciones 12.2 y 13.3 a
 * 13.5): contrasta el dominio de origen contra widget_domains, confirma que
 * el widget está publicado, y evalúa su horario de disponibilidad. Es el
 * único punto de entrada que deben usar los endpoints públicos del widget
 * (snippet, sessions, messages) antes de devolver o aceptar cualquier dato,
 * conforme a la sección 15.23. Debe construirse siempre con el cliente de
 * servicio (service_role), nunca con el cliente de sesión de un visitante
 * anónimo.
 */
export class WidgetPublicAccessService {
  private readonly widgets: SupabaseWidgetRepository;
  private readonly appearance: SupabaseWidgetAppearanceRepository;
  private readonly domains: SupabaseWidgetDomainRepository;
  private readonly schedules: SupabaseWidgetScheduleRepository;
  private readonly snippets: SupabaseSnippetRepository;

  constructor(client: SupabaseClient<Database>) {
    this.widgets = new SupabaseWidgetRepository(client);
    this.appearance = new SupabaseWidgetAppearanceRepository(client);
    this.domains = new SupabaseWidgetDomainRepository(client);
    this.schedules = new SupabaseWidgetScheduleRepository(client);
    this.snippets = new SupabaseSnippetRepository(client);
  }

  async resolveByPublicKey(
    publicKey: string,
    originHostname: string | null,
  ): Promise<PublicWidgetAccess & { appearance: WidgetAppearance | null }> {
    const snippet = await this.snippets.findByPublicKey(publicKey);
    if (!snippet || snippet.revoked) {
      throw new ApiError(
        "not_found",
        "snippet_not_found",
        "El identificador del widget no es válido.",
        404,
      );
    }
    const access = await this.validateOrigin(snippet.widgetId, originHostname);
    const appearance = await this.appearance.findByWidgetId(access.widget.id);
    return { ...access, appearance };
  }

  async getPublicConfig(
    publicKey: string,
    originHostname: string | null,
  ): Promise<PublicWidgetConfig> {
    const access = await this.resolveByPublicKey(publicKey, originHostname);
    return {
      widgetId: access.widget.id,
      name: access.widget.name,
      language: access.widget.language,
      availableNow: access.availableNow,
      outOfScheduleBehavior: access.outOfScheduleBehavior,
      persistConversationAcrossSessions:
        access.widget.persistConversationAcrossSessions,
      maxMessagesPerSession: access.widget.maxMessagesPerSession,
      inactivityBehavior: access.widget.inactivityBehavior,
      appearance: access.appearance
        ? toPublicAppearance(access.appearance)
        : null,
    };
  }

  /** Revalida el dominio, el estado y el horario de un widget ya identificado (usado en la inicialización de sesión y en cada envío de mensaje). */
  async validateOrigin(
    widgetId: string,
    originHostname: string | null,
  ): Promise<PublicWidgetAccess> {
    const widget = await this.widgets.findById(widgetId);
    if (!widget || widget.status !== "publicado") {
      throw new ApiError(
        "not_found",
        "widget_unavailable",
        "El widget solicitado no está disponible.",
        404,
      );
    }

    const domains = await this.domains.findByWidgetId(widget.id);
    if (domains.length > 0) {
      if (!originHostname) {
        throw new ApiError(
          "authorization",
          "origin_required",
          "No se pudo determinar el dominio de origen de la solicitud.",
          403,
        );
      }
      if (!matchesAllowedDomain(originHostname, domains)) {
        throw new ApiError(
          "authorization",
          "domain_not_allowed",
          "Este dominio no está autorizado para cargar el widget.",
          403,
        );
      }
    }

    const schedules = await this.schedules.findByWidgetId(widget.id);
    const availableNow = isWidgetWithinSchedule(schedules);
    const outOfScheduleBehavior = schedules[0]?.outOfScheduleBehavior ?? "ocultar widget";

    return { widget, appearance: null, availableNow, outOfScheduleBehavior };
  }
}

function toPublicAppearance(
  appearance: WidgetAppearance,
): PublicWidgetAppearance {
  const { id, widgetId, createdAt, updatedAt, ...publicFields } = appearance;
  void id;
  void widgetId;
  void createdAt;
  void updatedAt;
  return publicFields;
}

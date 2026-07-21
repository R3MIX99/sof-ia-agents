import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseWidgetDomainRepository } from "@/infrastructure/supabase/repositories/widget-domain.repository";
import {
  SupabaseWidgetScheduleRepository,
  type CreateWidgetScheduleInput,
} from "@/infrastructure/supabase/repositories/widget-schedule.repository";
import type { WidgetDomain } from "@/domain/entities/widget-domain.entity";
import type { WidgetSchedule } from "@/domain/entities/widget-schedule.entity";

/** Servicio de gestión de dominios y horarios (Fase 4, sección 15.9-15.10). */
export class WidgetDomainScheduleService {
  private readonly domains: SupabaseWidgetDomainRepository;
  private readonly schedules: SupabaseWidgetScheduleRepository;

  constructor(client: SupabaseClient<Database>) {
    this.domains = new SupabaseWidgetDomainRepository(client);
    this.schedules = new SupabaseWidgetScheduleRepository(client);
  }

  async listDomains(widgetId: string): Promise<WidgetDomain[]> {
    return this.domains.findByWidgetId(widgetId);
  }

  async addDomain(
    widgetId: string,
    domain: string,
    isWildcard: boolean,
  ): Promise<WidgetDomain> {
    return this.domains.create(widgetId, domain, isWildcard);
  }

  async removeDomain(id: string): Promise<void> {
    return this.domains.delete(id);
  }

  async listSchedules(widgetId: string): Promise<WidgetSchedule[]> {
    return this.schedules.findByWidgetId(widgetId);
  }

  async addSchedule(
    input: CreateWidgetScheduleInput,
  ): Promise<WidgetSchedule> {
    return this.schedules.create(input);
  }

  async removeSchedule(id: string): Promise<void> {
    return this.schedules.delete(id);
  }
}

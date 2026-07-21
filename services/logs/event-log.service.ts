import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseEventLogRepository } from "@/infrastructure/supabase/repositories/event-log.repository";
import type { SystemEvent } from "@/domain/entities/system-event.entity";
import type {
  CreateSystemEventInput,
  EventLogFilters,
} from "@/domain/repositories-interfaces/event-log-repository.interface";

/** Envoltura de servicio sobre el repositorio de eventos, usada por la pantalla Logs (sección 15.20). */
export class EventLogService {
  private readonly events: SupabaseEventLogRepository;

  constructor(client: SupabaseClient<Database>) {
    this.events = new SupabaseEventLogRepository(client);
  }

  async log(input: CreateSystemEventInput): Promise<SystemEvent> {
    return this.events.create(input);
  }

  async list(
    organizationId: string,
    filters?: EventLogFilters,
    limit?: number,
  ): Promise<SystemEvent[]> {
    return this.events.listByOrganization(organizationId, filters, limit);
  }
}

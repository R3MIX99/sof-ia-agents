import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  SupabaseWidgetAppearanceRepository,
  type UpdateWidgetAppearanceInput,
} from "@/infrastructure/supabase/repositories/widget-appearance.repository";
import type { WidgetAppearance } from "@/domain/entities/widget-appearance.entity";

export class WidgetAppearanceService {
  private readonly appearance: SupabaseWidgetAppearanceRepository;

  constructor(client: SupabaseClient<Database>) {
    this.appearance = new SupabaseWidgetAppearanceRepository(client);
  }

  async getByWidgetId(widgetId: string): Promise<WidgetAppearance | null> {
    return this.appearance.findByWidgetId(widgetId);
  }

  async update(
    widgetId: string,
    input: UpdateWidgetAppearanceInput,
  ): Promise<WidgetAppearance> {
    return this.appearance.update(widgetId, input);
  }
}

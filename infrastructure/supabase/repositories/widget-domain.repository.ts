import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { WidgetDomain } from "@/domain/entities/widget-domain.entity";

type WidgetDomainRow = Database["public"]["Tables"]["widget_domains"]["Row"];

function toEntity(row: WidgetDomainRow): WidgetDomain {
  return {
    id: row.id,
    widgetId: row.widget_id,
    domain: row.domain,
    isWildcard: row.is_wildcard,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseWidgetDomainRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByWidgetId(widgetId: string): Promise<WidgetDomain[]> {
    const { data, error } = await this.client
      .from("widget_domains")
      .select("*")
      .eq("widget_id", widgetId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async create(widgetId: string, domain: string, isWildcard: boolean): Promise<WidgetDomain> {
    const { data, error } = await this.client
      .from("widget_domains")
      .insert({ widget_id: widgetId, domain, is_wildcard: isWildcard })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("widget_domains")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

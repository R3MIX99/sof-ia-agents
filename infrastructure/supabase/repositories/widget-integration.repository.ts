import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { WidgetIntegration } from "@/domain/entities/widget-integration.entity";
import type {
  CreateWidgetIntegrationInput,
  UpdateWidgetIntegrationInput,
  WidgetIntegrationRepository,
} from "@/domain/repositories-interfaces/widget-integration-repository.interface";

type WidgetIntegrationRow =
  Database["public"]["Tables"]["widget_integrations"]["Row"];

function toEntity(row: WidgetIntegrationRow): WidgetIntegration {
  return {
    id: row.id,
    widgetId: row.widget_id,
    integrationId: row.integration_id,
    triggerPoint: row.trigger_point as WidgetIntegration["triggerPoint"],
    executionOrder: row.execution_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseWidgetIntegrationRepository
  implements WidgetIntegrationRepository
{
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<WidgetIntegration | null> {
    const { data, error } = await this.client
      .from("widget_integrations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findByWidgetId(widgetId: string): Promise<WidgetIntegration[]> {
    const { data, error } = await this.client
      .from("widget_integrations")
      .select("*")
      .eq("widget_id", widgetId)
      .order("execution_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async create(
    input: CreateWidgetIntegrationInput,
  ): Promise<WidgetIntegration> {
    const { data, error } = await this.client
      .from("widget_integrations")
      .insert({
        widget_id: input.widgetId,
        integration_id: input.integrationId,
        trigger_point: input.triggerPoint,
        execution_order: input.executionOrder ?? 0,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async update(
    id: string,
    input: UpdateWidgetIntegrationInput,
  ): Promise<WidgetIntegration> {
    const patch: Database["public"]["Tables"]["widget_integrations"]["Update"] =
      {};
    if (input.triggerPoint !== undefined)
      patch.trigger_point = input.triggerPoint;
    if (input.executionOrder !== undefined)
      patch.execution_order = input.executionOrder;

    const { data, error } = await this.client
      .from("widget_integrations")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("widget_integrations")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { WidgetSchedule } from "@/domain/entities/widget-schedule.entity";

type WidgetScheduleRow =
  Database["public"]["Tables"]["widget_schedules"]["Row"];

export interface CreateWidgetScheduleInput {
  widgetId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  outOfScheduleBehavior: WidgetSchedule["outOfScheduleBehavior"];
}

function toEntity(row: WidgetScheduleRow): WidgetSchedule {
  return {
    id: row.id,
    widgetId: row.widget_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone,
    outOfScheduleBehavior:
      row.out_of_schedule_behavior as WidgetSchedule["outOfScheduleBehavior"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseWidgetScheduleRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByWidgetId(widgetId: string): Promise<WidgetSchedule[]> {
    const { data, error } = await this.client
      .from("widget_schedules")
      .select("*")
      .eq("widget_id", widgetId)
      .order("day_of_week", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async create(input: CreateWidgetScheduleInput): Promise<WidgetSchedule> {
    const { data, error } = await this.client
      .from("widget_schedules")
      .insert({
        widget_id: input.widgetId,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
        timezone: input.timezone,
        out_of_schedule_behavior: input.outOfScheduleBehavior,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("widget_schedules")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

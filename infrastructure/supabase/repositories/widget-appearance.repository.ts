import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { WidgetAppearance } from "@/domain/entities/widget-appearance.entity";

type WidgetAppearanceRow =
  Database["public"]["Tables"]["widget_appearance"]["Row"];

export type UpdateWidgetAppearanceInput = Partial<
  Omit<WidgetAppearance, "id" | "widgetId" | "createdAt" | "updatedAt">
>;

function toEntity(row: WidgetAppearanceRow): WidgetAppearance {
  return {
    id: row.id,
    widgetId: row.widget_id,
    themeMode: row.theme_mode as WidgetAppearance["themeMode"],
    primaryColor: row.primary_color,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    userBubbleColor: row.user_bubble_color,
    assistantBubbleColor: row.assistant_bubble_color,
    fontFamily: row.font_family,
    headerTitle: row.header_title,
    headerSubtitle: row.header_subtitle,
    companyName: row.company_name,
    companyTagline: row.company_tagline,
    initialMessage: row.initial_message,
    suggestedMessages: (row.suggested_messages ?? []) as string[],
    suggestedMessageColor: row.suggested_message_color,
    position: row.position as WidgetAppearance["position"],
    windowWidth: row.window_width,
    windowHeight: row.window_height,
    borderRadius: row.border_radius,
    shadowStyle: row.shadow_style,
    spacingScale: row.spacing_scale,
    animationsEnabled: row.animations_enabled,
    launcherIcon: row.launcher_icon,
    launcherColor: row.launcher_color,
    launcherShape: row.launcher_shape as WidgetAppearance["launcherShape"],
    footerLinkUrl: row.footer_link_url,
    footerLinkLabel: row.footer_link_label,
    footerLinkColor: row.footer_link_color,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseWidgetAppearanceRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByWidgetId(widgetId: string): Promise<WidgetAppearance | null> {
    const { data, error } = await this.client
      .from("widget_appearance")
      .select("*")
      .eq("widget_id", widgetId)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  /** Crea la fila de apariencia por defecto para un widget recién creado. */
  async createDefault(widgetId: string): Promise<WidgetAppearance> {
    const { data, error } = await this.client
      .from("widget_appearance")
      .insert({ widget_id: widgetId })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async update(
    widgetId: string,
    input: UpdateWidgetAppearanceInput,
  ): Promise<WidgetAppearance> {
    const patch: Database["public"]["Tables"]["widget_appearance"]["Update"] =
      {};
    if (input.themeMode !== undefined) patch.theme_mode = input.themeMode;
    if (input.primaryColor !== undefined) patch.primary_color = input.primaryColor;
    if (input.backgroundColor !== undefined)
      patch.background_color = input.backgroundColor;
    if (input.textColor !== undefined) patch.text_color = input.textColor;
    if (input.userBubbleColor !== undefined)
      patch.user_bubble_color = input.userBubbleColor;
    if (input.assistantBubbleColor !== undefined)
      patch.assistant_bubble_color = input.assistantBubbleColor;
    if (input.fontFamily !== undefined) patch.font_family = input.fontFamily;
    if (input.headerTitle !== undefined) patch.header_title = input.headerTitle;
    if (input.headerSubtitle !== undefined)
      patch.header_subtitle = input.headerSubtitle;
    if (input.companyName !== undefined) patch.company_name = input.companyName;
    if (input.companyTagline !== undefined)
      patch.company_tagline = input.companyTagline;
    if (input.initialMessage !== undefined)
      patch.initial_message = input.initialMessage;
    if (input.suggestedMessages !== undefined)
      patch.suggested_messages = input.suggestedMessages as Json;
    if (input.suggestedMessageColor !== undefined)
      patch.suggested_message_color = input.suggestedMessageColor;
    if (input.position !== undefined) patch.position = input.position;
    if (input.windowWidth !== undefined) patch.window_width = input.windowWidth;
    if (input.windowHeight !== undefined)
      patch.window_height = input.windowHeight;
    if (input.borderRadius !== undefined)
      patch.border_radius = input.borderRadius;
    if (input.shadowStyle !== undefined) patch.shadow_style = input.shadowStyle;
    if (input.spacingScale !== undefined)
      patch.spacing_scale = input.spacingScale;
    if (input.animationsEnabled !== undefined)
      patch.animations_enabled = input.animationsEnabled;
    if (input.launcherIcon !== undefined)
      patch.launcher_icon = input.launcherIcon;
    if (input.launcherColor !== undefined)
      patch.launcher_color = input.launcherColor;
    if (input.launcherShape !== undefined)
      patch.launcher_shape = input.launcherShape;
    if (input.footerLinkUrl !== undefined)
      patch.footer_link_url = input.footerLinkUrl;
    if (input.footerLinkLabel !== undefined)
      patch.footer_link_label = input.footerLinkLabel;
    if (input.footerLinkColor !== undefined)
      patch.footer_link_color = input.footerLinkColor;

    const { data, error } = await this.client
      .from("widget_appearance")
      .update(patch)
      .eq("widget_id", widgetId)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }
}

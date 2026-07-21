import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseWidgetRepository } from "@/infrastructure/supabase/repositories/widget.repository";
import { SupabaseWidgetAppearanceRepository } from "@/infrastructure/supabase/repositories/widget-appearance.repository";
import { SupabaseProviderConfigRepository } from "@/infrastructure/supabase/repositories/provider-config.repository";
import { SupabaseEventLogRepository } from "@/infrastructure/supabase/repositories/event-log.repository";
import type { Widget } from "@/domain/entities/widget.entity";
import type {
  CreateWidgetInput,
  UpdateWidgetInput,
} from "@/domain/repositories-interfaces/widget-repository.interface";
import { ApiError } from "@/lib/http/api-error";

export class WidgetService {
  private readonly widgets: SupabaseWidgetRepository;
  private readonly appearance: SupabaseWidgetAppearanceRepository;
  private readonly providerConfigs: SupabaseProviderConfigRepository;
  private readonly events: SupabaseEventLogRepository;

  constructor(client: SupabaseClient<Database>) {
    this.widgets = new SupabaseWidgetRepository(client);
    this.appearance = new SupabaseWidgetAppearanceRepository(client);
    this.providerConfigs = new SupabaseProviderConfigRepository(client);
    this.events = new SupabaseEventLogRepository(client);
  }

  async listByOrganization(organizationId: string): Promise<Widget[]> {
    return this.widgets.findByOrganizationId(organizationId);
  }

  async getById(id: string): Promise<Widget | null> {
    return this.widgets.findById(id);
  }

  async createWidget(input: CreateWidgetInput): Promise<Widget> {
    const widget = await this.widgets.create(input);
    try {
      await this.appearance.createDefault(widget.id);
    } catch (error) {
      await this.widgets.delete(widget.id);
      throw error;
    }
    return widget;
  }

  async updateWidget(id: string, input: UpdateWidgetInput): Promise<Widget> {
    return this.widgets.update(id, input);
  }

  async deleteWidget(id: string): Promise<void> {
    return this.widgets.delete(id);
  }

  async duplicateWidget(id: string, duplicatedBy: string): Promise<Widget> {
    const original = await this.widgets.findById(id);
    if (!original) {
      throw new ApiError(
        "not_found",
        "widget_not_found",
        "No se encontró el widget solicitado.",
        404,
      );
    }

    const copy = await this.createWidget({
      organizationId: original.organizationId,
      name: `${original.name} (copia)`,
      description: original.description,
      providerConfigId: original.providerConfigId,
      language: original.language,
      createdBy: duplicatedBy,
    });

    const originalAppearance = await this.appearance.findByWidgetId(id);
    if (originalAppearance) {
      await this.appearance.update(copy.id, {
        themeMode: originalAppearance.themeMode,
        primaryColor: originalAppearance.primaryColor,
        backgroundColor: originalAppearance.backgroundColor,
        textColor: originalAppearance.textColor,
        fontFamily: originalAppearance.fontFamily,
        headerTitle: originalAppearance.headerTitle,
        headerSubtitle: originalAppearance.headerSubtitle,
        initialMessages: originalAppearance.initialMessages,
        suggestedMessages: originalAppearance.suggestedMessages,
        position: originalAppearance.position,
        windowWidth: originalAppearance.windowWidth,
        windowHeight: originalAppearance.windowHeight,
        borderRadius: originalAppearance.borderRadius,
        shadowStyle: originalAppearance.shadowStyle,
        spacingScale: originalAppearance.spacingScale,
        animationsEnabled: originalAppearance.animationsEnabled,
        launcherIcon: originalAppearance.launcherIcon,
        launcherColor: originalAppearance.launcherColor,
        launcherShape: originalAppearance.launcherShape,
        launcherType: originalAppearance.launcherType,
        launcherLabel: originalAppearance.launcherLabel,
        userBubbleColor: originalAppearance.userBubbleColor,
        assistantBubbleColor: originalAppearance.assistantBubbleColor,
        assistantTextColor: originalAppearance.assistantTextColor,
        footerLinkUrl: originalAppearance.footerLinkUrl,
        footerLinkLabel: originalAppearance.footerLinkLabel,
      });
    }

    return copy;
  }

  /** Publicar exige un provider_config_id asociado y con credenciales válidas (sección 15.7). */
  async publish(id: string): Promise<Widget> {
    const widget = await this.widgets.findById(id);
    if (!widget) {
      throw new ApiError(
        "not_found",
        "widget_not_found",
        "No se encontró el widget solicitado.",
        404,
      );
    }
    if (!widget.providerConfigId) {
      throw new ApiError(
        "validation",
        "provider_config_required",
        "El widget necesita un proveedor de IA configurado antes de publicarse.",
        400,
      );
    }

    const providerConfig = await this.providerConfigs.findById(
      widget.providerConfigId,
    );
    if (!providerConfig || providerConfig.validationStatus !== "válida") {
      throw new ApiError(
        "validation",
        "provider_config_invalid",
        "El proveedor de IA asociado no tiene credenciales validadas.",
        400,
      );
    }

    const published = await this.widgets.update(id, { status: "publicado" });

    await this.events.create({
      organizationId: published.organizationId,
      widgetId: published.id,
      eventType: "publicación de widget",
      severity: "información",
      source: "widget",
      details: { widgetName: published.name },
    });

    return published;
  }

  async unpublish(id: string): Promise<Widget> {
    return this.widgets.update(id, { status: "borrador" });
  }

  async pause(id: string): Promise<Widget> {
    return this.widgets.update(id, { status: "pausado" });
  }

  async archive(id: string): Promise<Widget> {
    return this.widgets.update(id, { status: "archivado" });
  }
}

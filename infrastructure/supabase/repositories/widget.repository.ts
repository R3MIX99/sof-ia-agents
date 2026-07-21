import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Widget } from "@/domain/entities/widget.entity";
import type {
  CreateWidgetInput,
  UpdateWidgetInput,
  WidgetRepository,
} from "@/domain/repositories-interfaces/widget-repository.interface";

type WidgetRow = Database["public"]["Tables"]["widgets"]["Row"];

function toEntity(row: WidgetRow): Widget {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    status: row.status as Widget["status"],
    providerConfigId: row.provider_config_id,
    logoUrl: row.logo_url,
    avatarUrl: row.avatar_url,
    language: row.language,
    createdBy: row.created_by,
    systemPrompt: row.system_prompt,
    persistConversationAcrossSessions: row.persist_conversation_across_sessions,
    maxMessagesPerSession: row.max_messages_per_session,
    inactivityBehavior: row.inactivity_behavior as Widget["inactivityBehavior"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseWidgetRepository implements WidgetRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Widget | null> {
    const { data, error } = await this.client
      .from("widgets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Widget[]> {
    const { data, error } = await this.client
      .from("widgets")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async create(input: CreateWidgetInput): Promise<Widget> {
    const { data, error } = await this.client
      .from("widgets")
      .insert({
        organization_id: input.organizationId,
        name: input.name,
        description: input.description ?? null,
        provider_config_id: input.providerConfigId ?? null,
        language: input.language ?? "es-419",
        created_by: input.createdBy,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async update(id: string, input: UpdateWidgetInput): Promise<Widget> {
    const patch: Database["public"]["Tables"]["widgets"]["Update"] = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.providerConfigId !== undefined)
      patch.provider_config_id = input.providerConfigId;
    if (input.language !== undefined) patch.language = input.language;
    if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.status !== undefined) patch.status = input.status;
    if (input.persistConversationAcrossSessions !== undefined)
      patch.persist_conversation_across_sessions =
        input.persistConversationAcrossSessions;
    if (input.maxMessagesPerSession !== undefined)
      patch.max_messages_per_session = input.maxMessagesPerSession;
    if (input.inactivityBehavior !== undefined)
      patch.inactivity_behavior = input.inactivityBehavior;
    if (input.systemPrompt !== undefined)
      patch.system_prompt = input.systemPrompt;

    const { data, error } = await this.client
      .from("widgets")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("widgets").delete().eq("id", id);
    if (error) throw error;
  }
}

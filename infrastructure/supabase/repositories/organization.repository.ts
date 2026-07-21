import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Organization } from "@/domain/entities/organization.entity";
import type {
  CreateOrganizationInput,
  OrganizationRepository,
  UpdateOrganizationInput,
} from "@/domain/repositories-interfaces/organization-repository.interface";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

function toEntity(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.owner_id,
    timezone: row.timezone,
    defaultLanguage: row.default_language,
    status: row.status as Organization["status"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseOrganizationRepository implements OrganizationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Organization | null> {
    const { data, error } = await this.client
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const { data, error } = await this.client
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Organization[]> {
    const { data, error } = await this.client
      .from("organizations")
      .select("*")
      .eq("owner_id", ownerId);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const { data, error } = await this.client
      .from("organizations")
      .insert({
        name: input.name,
        slug: input.slug,
        owner_id: input.ownerId,
        timezone: input.timezone,
        default_language: input.defaultLanguage,
        status: input.status,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    const patch: Database["public"]["Tables"]["organizations"]["Update"] = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.timezone !== undefined) patch.timezone = input.timezone;
    if (input.defaultLanguage !== undefined) patch.default_language = input.defaultLanguage;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await this.client
      .from("organizations")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("organizations").delete().eq("id", id);
    if (error) throw error;
  }
}

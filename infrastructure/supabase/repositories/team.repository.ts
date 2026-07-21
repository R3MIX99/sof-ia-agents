import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Team } from "@/domain/entities/team.entity";
import type {
  CreateTeamInput,
  TeamRepository,
  UpdateTeamInput,
} from "@/domain/repositories-interfaces/team-repository.interface";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

function toEntity(row: TeamRow): Team {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseTeamRepository implements TeamRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Team | null> {
    const { data, error } = await this.client
      .from("teams")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Team[]> {
    const { data, error } = await this.client
      .from("teams")
      .select("*")
      .eq("organization_id", organizationId);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async create(input: CreateTeamInput): Promise<Team> {
    const { data, error } = await this.client
      .from("teams")
      .insert({
        organization_id: input.organizationId,
        name: input.name,
        description: input.description,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async update(id: string, input: UpdateTeamInput): Promise<Team> {
    const patch: Database["public"]["Tables"]["teams"]["Update"] = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;

    const { data, error } = await this.client
      .from("teams")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("teams").delete().eq("id", id);
    if (error) throw error;
  }
}

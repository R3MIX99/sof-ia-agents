import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { OrganizationMember } from "@/domain/entities/organization-member.entity";
import type {
  CreateOrganizationMemberInput,
  OrganizationMemberRepository,
  UpdateOrganizationMemberInput,
} from "@/domain/repositories-interfaces/organization-member-repository.interface";

type OrganizationMemberRow =
  Database["public"]["Tables"]["organization_members"]["Row"];

function toEntity(row: OrganizationMemberRow): OrganizationMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    roleId: row.role_id,
    teamId: row.team_id,
    invitedBy: row.invited_by,
    status: row.status as OrganizationMember["status"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseOrganizationMemberRepository
  implements OrganizationMemberRepository
{
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<OrganizationMember | null> {
    const { data, error } = await this.client
      .from("organization_members")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationMember[]> {
    const { data, error } = await this.client
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async findByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    const { data, error } = await this.client
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findByUserId(userId: string): Promise<OrganizationMember[]> {
    const { data, error } = await this.client
      .from("organization_members")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async create(
    input: CreateOrganizationMemberInput,
  ): Promise<OrganizationMember> {
    const { data, error } = await this.client
      .from("organization_members")
      .insert({
        organization_id: input.organizationId,
        user_id: input.userId,
        role_id: input.roleId,
        team_id: input.teamId,
        invited_by: input.invitedBy,
        status: input.status,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async update(
    id: string,
    input: UpdateOrganizationMemberInput,
  ): Promise<OrganizationMember> {
    const patch: Database["public"]["Tables"]["organization_members"]["Update"] =
      {};
    if (input.roleId !== undefined) patch.role_id = input.roleId;
    if (input.teamId !== undefined) patch.team_id = input.teamId;
    if (input.invitedBy !== undefined) patch.invited_by = input.invitedBy;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await this.client
      .from("organization_members")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("organization_members")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

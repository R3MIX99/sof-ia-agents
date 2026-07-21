import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { Role, RolePermissions } from "@/domain/entities/role.entity";
import type {
  CreateRoleInput,
  RoleRepository,
  UpdateRoleInput,
} from "@/domain/repositories-interfaces/role-repository.interface";

type RoleRow = Database["public"]["Tables"]["roles"]["Row"];

function toEntity(row: RoleRow): Role {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    permissions: (row.permissions ?? {}) as RolePermissions,
    isSystemRole: row.is_system_role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseRoleRepository implements RoleRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Role | null> {
    const { data, error } = await this.client
      .from("roles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findSystemRoles(): Promise<Role[]> {
    const { data, error } = await this.client
      .from("roles")
      .select("*")
      .eq("is_system_role", true);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async findByOrganizationId(organizationId: string): Promise<Role[]> {
    const { data, error } = await this.client
      .from("roles")
      .select("*")
      .eq("organization_id", organizationId);
    if (error) throw error;
    return (data ?? []).map(toEntity);
  }

  async create(input: CreateRoleInput): Promise<Role> {
    const { data, error } = await this.client
      .from("roles")
      .insert({
        organization_id: input.organizationId,
        name: input.name,
        permissions: input.permissions as Json,
        is_system_role: input.isSystemRole,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role> {
    const patch: Database["public"]["Tables"]["roles"]["Update"] = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.permissions !== undefined)
      patch.permissions = input.permissions as Json;

    const { data, error } = await this.client
      .from("roles")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("roles").delete().eq("id", id);
    if (error) throw error;
  }
}

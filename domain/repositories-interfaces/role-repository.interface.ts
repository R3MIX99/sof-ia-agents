import type { Role } from "@/domain/entities/role.entity";

export type CreateRoleInput = Omit<Role, "id" | "createdAt" | "updatedAt">;

export type UpdateRoleInput = Partial<
  Omit<Role, "id" | "organizationId" | "isSystemRole" | "createdAt" | "updatedAt">
>;

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findSystemRoles(): Promise<Role[]>;
  findByOrganizationId(organizationId: string): Promise<Role[]>;
  create(input: CreateRoleInput): Promise<Role>;
  update(id: string, input: UpdateRoleInput): Promise<Role>;
  delete(id: string): Promise<void>;
}

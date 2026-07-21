import type { Team } from "@/domain/entities/team.entity";

export type CreateTeamInput = Omit<Team, "id" | "createdAt" | "updatedAt">;

export type UpdateTeamInput = Partial<
  Omit<Team, "id" | "organizationId" | "createdAt" | "updatedAt">
>;

export interface TeamRepository {
  findById(id: string): Promise<Team | null>;
  findByOrganizationId(organizationId: string): Promise<Team[]>;
  create(input: CreateTeamInput): Promise<Team>;
  update(id: string, input: UpdateTeamInput): Promise<Team>;
  delete(id: string): Promise<void>;
}

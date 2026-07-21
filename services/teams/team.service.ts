import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseTeamRepository } from "@/infrastructure/supabase/repositories/team.repository";
import { SupabaseOrganizationMemberRepository } from "@/infrastructure/supabase/repositories/organization-member.repository";
import type { Team } from "@/domain/entities/team.entity";

export class TeamService {
  private readonly teams: SupabaseTeamRepository;
  private readonly members: SupabaseOrganizationMemberRepository;

  constructor(client: SupabaseClient<Database>) {
    this.teams = new SupabaseTeamRepository(client);
    this.members = new SupabaseOrganizationMemberRepository(client);
  }

  async listByOrganization(organizationId: string): Promise<Team[]> {
    return this.teams.findByOrganizationId(organizationId);
  }

  async createTeam(
    organizationId: string,
    name: string,
    description?: string | null,
  ): Promise<Team> {
    return this.teams.create({
      organizationId,
      name,
      description: description ?? null,
    });
  }

  async updateTeam(
    teamId: string,
    patch: { name?: string; description?: string | null },
  ): Promise<Team> {
    return this.teams.update(teamId, patch);
  }

  async deleteTeam(teamId: string): Promise<void> {
    return this.teams.delete(teamId);
  }

  async assignMemberToTeam(
    memberId: string,
    teamId: string | null,
  ): Promise<void> {
    await this.members.update(memberId, { teamId });
  }
}

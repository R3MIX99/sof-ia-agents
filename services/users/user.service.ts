import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseOrganizationMemberRepository } from "@/infrastructure/supabase/repositories/organization-member.repository";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/user.repository";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin";
import type { OrganizationMember } from "@/domain/entities/organization-member.entity";
import type { User } from "@/domain/entities/user.entity";
import type { UpdateUserInput } from "@/domain/repositories-interfaces/user-repository.interface";
import { ApiError } from "@/lib/http/api-error";

export interface OrganizationMemberWithProfile extends OrganizationMember {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface InviteUserParams {
  organizationId: string;
  email: string;
  roleId: string | null;
  invitedBy: string;
}

export class UserService {
  private readonly members: SupabaseOrganizationMemberRepository;
  private readonly users: SupabaseUserRepository;

  constructor(private readonly client: SupabaseClient<Database>) {
    this.members = new SupabaseOrganizationMemberRepository(client);
    this.users = new SupabaseUserRepository(client);
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.users.findById(userId);
  }

  async updateProfile(userId: string, patch: UpdateUserInput): Promise<User> {
    return this.users.update(userId, patch);
  }

  async listOrganizationMembers(
    organizationId: string,
  ): Promise<OrganizationMemberWithProfile[]> {
    const memberships = await this.members.findByOrganizationId(organizationId);

    const { data: profiles, error } = await this.client.rpc(
      "get_organization_member_profiles",
      { p_organization_id: organizationId },
    );
    if (error) throw error;

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    return memberships.map((member) => {
      const profile = profileById.get(member.userId);
      return {
        ...member,
        fullName: profile?.full_name ?? null,
        email: profile?.email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      };
    });
  }

  async inviteUser(params: InviteUserParams): Promise<OrganizationMember> {
    const admin = this.getAdminClientOrThrow();

    const { data: invited, error } =
      await admin.auth.admin.inviteUserByEmail(params.email);
    if (error || !invited.user) {
      throw new ApiError(
        "external_dependency",
        "invite_failed",
        "No se pudo enviar la invitación por correo.",
        502,
      );
    }

    // El disparador on_auth_user_created crea el perfil en public.users automáticamente.
    return this.members.create({
      organizationId: params.organizationId,
      userId: invited.user.id,
      roleId: params.roleId,
      teamId: null,
      invitedBy: params.invitedBy,
      status: "invitado",
    });
  }

  async resendInvitation(email: string): Promise<void> {
    const admin = this.getAdminClientOrThrow();
    const { error } = await admin.auth.admin.inviteUserByEmail(email);
    if (error) {
      throw new ApiError(
        "external_dependency",
        "invite_failed",
        "No se pudo reenviar la invitación.",
        502,
      );
    }
  }

  async updateMemberRole(
    memberId: string,
    roleId: string,
  ): Promise<OrganizationMember> {
    return this.members.update(memberId, { roleId });
  }

  async revokeMember(memberId: string): Promise<OrganizationMember> {
    return this.members.update(memberId, { status: "suspendido" });
  }

  private getAdminClientOrThrow() {
    try {
      return createSupabaseAdminClient();
    } catch {
      throw new ApiError(
        "internal",
        "admin_client_unavailable",
        "La invitación por correo no está configurada en este entorno.",
        501,
      );
    }
  }
}

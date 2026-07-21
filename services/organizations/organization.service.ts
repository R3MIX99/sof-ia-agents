import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseOrganizationRepository } from "@/infrastructure/supabase/repositories/organization.repository";
import { SupabaseOrganizationMemberRepository } from "@/infrastructure/supabase/repositories/organization-member.repository";
import { SupabaseRoleRepository } from "@/infrastructure/supabase/repositories/role.repository";
import type { Organization } from "@/domain/entities/organization.entity";
import type { UpdateOrganizationInput } from "@/domain/repositories-interfaces/organization-repository.interface";
import { ApiError } from "@/lib/http/api-error";

export interface CreateOrganizationParams {
  name: string;
  slug: string;
  ownerId: string;
  timezone?: string;
  defaultLanguage?: string;
}

export class OrganizationService {
  private readonly organizations: SupabaseOrganizationRepository;
  private readonly members: SupabaseOrganizationMemberRepository;
  private readonly roles: SupabaseRoleRepository;

  constructor(client: SupabaseClient<Database>) {
    this.organizations = new SupabaseOrganizationRepository(client);
    this.members = new SupabaseOrganizationMemberRepository(client);
    this.roles = new SupabaseRoleRepository(client);
  }

  async createOrganization(
    params: CreateOrganizationParams,
  ): Promise<Organization> {
    const existing = await this.organizations.findBySlug(params.slug);
    if (existing) {
      throw new ApiError(
        "validation",
        "slug_taken",
        "Ya existe una organización con ese identificador.",
        409,
        { field: "slug" },
      );
    }

    const organization = await this.organizations.create({
      name: params.name,
      slug: params.slug,
      ownerId: params.ownerId,
      timezone: params.timezone ?? "America/Mexico_City",
      defaultLanguage: params.defaultLanguage ?? "es-419",
      status: "activa",
    });

    try {
      const systemRoles = await this.roles.findSystemRoles();
      const adminRole = systemRoles.find((role) => role.name === "admin");

      await this.members.create({
        organizationId: organization.id,
        userId: params.ownerId,
        roleId: adminRole?.id ?? null,
        teamId: null,
        invitedBy: null,
        status: "activo",
      });
    } catch (error) {
      // Compensación: si no se pudo inscribir al propietario como primer
      // miembro administrador, no debe quedar una organización huérfana.
      await this.organizations.delete(organization.id);
      throw error;
    }

    return organization;
  }

  async getById(id: string): Promise<Organization | null> {
    return this.organizations.findById(id);
  }

  async updateOrganization(
    id: string,
    patch: UpdateOrganizationInput,
  ): Promise<Organization> {
    return this.organizations.update(id, patch);
  }

  async listOrganizationsForUser(userId: string): Promise<Organization[]> {
    const memberships = await this.members.findByUserId(userId);
    const organizations = await Promise.all(
      memberships.map((membership) =>
        this.organizations.findById(membership.organizationId),
      ),
    );
    return organizations.filter(
      (organization): organization is Organization => organization !== null,
    );
  }
}

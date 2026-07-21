import type { OrganizationMember } from "@/domain/entities/organization-member.entity";

export type CreateOrganizationMemberInput = Omit<
  OrganizationMember,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateOrganizationMemberInput = Partial<
  Omit<
    OrganizationMember,
    "id" | "organizationId" | "userId" | "createdAt" | "updatedAt"
  >
>;

export interface OrganizationMemberRepository {
  findById(id: string): Promise<OrganizationMember | null>;
  findByOrganizationId(organizationId: string): Promise<OrganizationMember[]>;
  findByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null>;
  findByUserId(userId: string): Promise<OrganizationMember[]>;
  create(input: CreateOrganizationMemberInput): Promise<OrganizationMember>;
  update(
    id: string,
    input: UpdateOrganizationMemberInput,
  ): Promise<OrganizationMember>;
  delete(id: string): Promise<void>;
}

import type { Organization } from "@/domain/entities/organization.entity";

export type CreateOrganizationInput = Omit<
  Organization,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateOrganizationInput = Partial<
  Omit<Organization, "id" | "ownerId" | "createdAt" | "updatedAt">
>;

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findByOwnerId(ownerId: string): Promise<Organization[]>;
  create(input: CreateOrganizationInput): Promise<Organization>;
  update(id: string, input: UpdateOrganizationInput): Promise<Organization>;
  delete(id: string): Promise<void>;
}

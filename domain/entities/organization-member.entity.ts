export type OrganizationMemberStatus = "invitado" | "activo" | "suspendido";

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string | null;
  teamId: string | null;
  invitedBy: string | null;
  status: OrganizationMemberStatus;
  createdAt: Date;
  updatedAt: Date;
}

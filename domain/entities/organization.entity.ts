export type OrganizationStatus = "activa" | "suspendida" | "eliminada";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  timezone: string;
  defaultLanguage: string;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
}

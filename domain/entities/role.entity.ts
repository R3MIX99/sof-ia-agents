export interface RolePermissions {
  [permissionKey: string]: boolean;
}

export interface Role {
  id: string;
  /** `null` para los roles de sistema predefinidos, no asociados a ninguna organización. */
  organizationId: string | null;
  name: string;
  permissions: RolePermissions;
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

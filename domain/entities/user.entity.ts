export type UserStatus = "activo" | "suspendido";

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  locale: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

import type { User } from "@/domain/entities/user.entity";

export type CreateUserInput = Omit<User, "createdAt" | "updatedAt">;

export type UpdateUserInput = Partial<
  Omit<User, "id" | "email" | "createdAt" | "updatedAt">
>;

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
}

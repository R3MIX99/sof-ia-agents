import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { User } from "@/domain/entities/user.entity";
import type {
  CreateUserInput,
  UserRepository,
  UpdateUserInput,
} from "@/domain/repositories-interfaces/user-repository.interface";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

function toEntity(row: UserRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    locale: row.locale,
    status: row.status as User["status"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .insert({
        id: input.id,
        full_name: input.fullName,
        email: input.email,
        avatar_url: input.avatarUrl,
        locale: input.locale,
        status: input.status,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const patch: Database["public"]["Tables"]["users"]["Update"] = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.locale !== undefined) patch.locale = input.locale;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await this.client
      .from("users")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("users").delete().eq("id", id);
    if (error) throw error;
  }
}

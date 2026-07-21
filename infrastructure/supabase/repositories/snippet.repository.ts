import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Snippet } from "@/domain/entities/snippet.entity";
import type { SnippetRepository } from "@/domain/repositories-interfaces/snippet-repository.interface";

type SnippetRow = Database["public"]["Tables"]["snippets"]["Row"];

function toEntity(row: SnippetRow): Snippet {
  return {
    id: row.id,
    widgetId: row.widget_id,
    publicKey: row.public_key,
    generatedAt: new Date(row.generated_at),
    revoked: row.revoked,
  };
}

export class SupabaseSnippetRepository implements SnippetRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByWidgetId(widgetId: string): Promise<Snippet | null> {
    const { data, error } = await this.client
      .from("snippets")
      .select("*")
      .eq("widget_id", widgetId)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  async findByPublicKey(publicKey: string): Promise<Snippet | null> {
    const { data, error } = await this.client
      .from("snippets")
      .select("*")
      .eq("public_key", publicKey)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data) : null;
  }

  /** Genera (o regenera, invalidando el anterior) el identificador público del snippet (sección 13.1). */
  async generate(widgetId: string): Promise<Snippet> {
    const publicKey = `wgt_${randomUUID().replace(/-/g, "")}`;
    const { data, error } = await this.client
      .from("snippets")
      .upsert(
        {
          widget_id: widgetId,
          public_key: publicKey,
          generated_at: new Date().toISOString(),
          revoked: false,
        },
        { onConflict: "widget_id" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return toEntity(data);
  }

  async revoke(widgetId: string): Promise<void> {
    const { error } = await this.client
      .from("snippets")
      .update({ revoked: true })
      .eq("widget_id", widgetId);
    if (error) throw error;
  }
}

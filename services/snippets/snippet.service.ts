import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseSnippetRepository } from "@/infrastructure/supabase/repositories/snippet.repository";
import type { Snippet } from "@/domain/entities/snippet.entity";

/** Servicio de generación de snippet (sección 13.1), consumido desde el dashboard autenticado. */
export class SnippetService {
  private readonly snippets: SupabaseSnippetRepository;

  constructor(client: SupabaseClient<Database>) {
    this.snippets = new SupabaseSnippetRepository(client);
  }

  async getByWidgetId(widgetId: string): Promise<Snippet | null> {
    return this.snippets.findByWidgetId(widgetId);
  }

  async generate(widgetId: string): Promise<Snippet> {
    return this.snippets.generate(widgetId);
  }

  async revoke(widgetId: string): Promise<void> {
    return this.snippets.revoke(widgetId);
  }
}

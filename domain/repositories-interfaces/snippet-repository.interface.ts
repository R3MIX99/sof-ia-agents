import type { Snippet } from "@/domain/entities/snippet.entity";

export interface SnippetRepository {
  findByWidgetId(widgetId: string): Promise<Snippet | null>;
  findByPublicKey(publicKey: string): Promise<Snippet | null>;
  /** Genera (o regenera, si ya existía) el snippet asociado al widget (sección 13.1). */
  generate(widgetId: string): Promise<Snippet>;
  revoke(widgetId: string): Promise<void>;
}

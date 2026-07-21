export type WidgetStatus = "borrador" | "publicado" | "pausado" | "archivado";

export type WidgetInactivityBehavior =
  | "sin acción"
  | "cerrar sesión automáticamente"
  | "mostrar mensaje de inactividad";

export interface Widget {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: WidgetStatus;
  providerConfigId: string | null;
  logoUrl: string | null;
  avatarUrl: string | null;
  language: string;
  createdBy: string | null;
  /** Instrucciones de comportamiento propias de este widget (sección 11), con prioridad sobre defaultSystemPrompt de la configuración de proveedor. */
  systemPrompt: string | null;
  // Configuración avanzada (sección 10): no forma parte del esquema base de
  // 15.7, pero es exigida explícitamente por el comportamiento del widget.
  persistConversationAcrossSessions: boolean;
  maxMessagesPerSession: number | null;
  inactivityBehavior: WidgetInactivityBehavior;
  createdAt: Date;
  updatedAt: Date;
}

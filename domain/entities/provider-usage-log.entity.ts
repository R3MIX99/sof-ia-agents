export type ProviderUsageStatus = "éxito" | "error";
export type ProviderUsageErrorType =
  | "autenticación"
  | "límite de uso"
  | "contenido"
  | "disponibilidad"
  | "desconocido";

export interface ProviderUsageLog {
  id: string;
  providerConfigId: string;
  widgetId: string;
  conversationId: string | null;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: ProviderUsageStatus;
  errorType: ProviderUsageErrorType | null;
  createdAt: Date;
}

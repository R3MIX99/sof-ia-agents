export type AIProviderKind = "openai" | "anthropic";
export type ProviderValidationStatus = "pendiente" | "válida" | "inválida";

// Nunca incluye la credencial: el dominio no debe transportar el secreto.
// Solo la capa de infraestructura, con el cliente de servicio, accede a
// `credentials_encrypted` (sección 15.11).
export interface ProviderConfig {
  id: string;
  organizationId: string;
  provider: AIProviderKind;
  model: string;
  defaultTemperature: number | null;
  defaultMaxTokens: number | null;
  defaultSystemPrompt: string | null;
  validationStatus: ProviderValidationStatus;
  lastValidatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

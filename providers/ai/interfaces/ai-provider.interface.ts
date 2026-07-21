// Interfaz de dominio (sección 5.1): único contrato reconocido por el resto
// del sistema para interactuar con cualquier proveedor de inteligencia
// artificial. No debe importar ningún SDK de OpenAI, Anthropic ni de
// ningún otro proveedor.

export type AIProviderName = "openai" | "anthropic";

export type AIMessageRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AIModelParameters {
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  tools?: AIToolDefinition[];
}

export interface AITokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export type AIFinishReason =
  | "stop"
  | "length"
  | "tool_call"
  | "content_filter"
  | "unknown";

export interface AICompletionResult {
  content: string;
  finishReason: AIFinishReason;
  usage: AITokenUsage;
  latencyMs: number;
}

export type AIStreamChunk =
  | { type: "content_delta"; delta: string }
  | {
      type: "done";
      usage: AITokenUsage;
      finishReason: AIFinishReason;
      latencyMs: number;
    };

/** Conjunto de errores internos de la plataforma (sección 5.1) a los que se normaliza cualquier error del proveedor. */
export type AIProviderErrorType =
  | "authentication"
  | "rate_limit"
  | "availability"
  | "content"
  | "unknown";

export class AIProviderError extends Error {
  constructor(
    public readonly type: AIProviderErrorType,
    message: string,
    public readonly providerName: AIProviderName,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export interface AICredentialValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Contrato único para interactuar con un proveedor de IA. Cualquier caso de
 * uso que consuma esta interfaz debe funcionar de forma idéntica sin
 * importar qué adaptador concreto reciba de AIProviderFactory (sección 2.2,
 * sustitución de Liskov).
 */
export interface AIProvider {
  readonly name: AIProviderName;

  validateCredentials(
    credentials: string,
  ): Promise<AICredentialValidationResult>;

  sendMessage(
    messages: AIMessage[],
    params: AIModelParameters,
    credentials: string,
  ): Promise<AICompletionResult>;

  streamMessage(
    messages: AIMessage[],
    params: AIModelParameters,
    credentials: string,
  ): AsyncIterable<AIStreamChunk>;

  listAvailableModels(): string[];
}

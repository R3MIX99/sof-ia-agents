import Anthropic from "@anthropic-ai/sdk";
import type {
  AICompletionResult,
  AICredentialValidationResult,
  AIFinishReason,
  AIMessage,
  AIModelParameters,
  AIProvider,
  AIProviderName,
  AIStreamChunk,
} from "@/providers/ai/interfaces/ai-provider.interface";
import { AIProviderError } from "@/providers/ai/interfaces/ai-provider.interface";

const PROVIDER_NAME: AIProviderName = "anthropic";
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

const STOP_REASON_MAP: Record<string, AIFinishReason> = {
  end_turn: "stop",
  stop_sequence: "stop",
  max_tokens: "length",
  tool_use: "tool_call",
  refusal: "content_filter",
};

function mapStopReason(reason: string | null | undefined): AIFinishReason {
  if (!reason) return "unknown";
  return STOP_REASON_MAP[reason] ?? "unknown";
}

function normalizeError(error: unknown): AIProviderError {
  if (error instanceof Anthropic.AuthenticationError) {
    return new AIProviderError(
      "authentication",
      "Las credenciales del proveedor no son válidas.",
      PROVIDER_NAME,
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AIProviderError(
      "rate_limit",
      "Se alcanzó el límite de uso del proveedor.",
      PROVIDER_NAME,
    );
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return new AIProviderError(
      "content",
      "El contenido fue rechazado por el proveedor.",
      PROVIDER_NAME,
    );
  }
  if (
    error instanceof Anthropic.APIConnectionError ||
    error instanceof Anthropic.InternalServerError
  ) {
    return new AIProviderError(
      "availability",
      "El proveedor no está disponible en este momento.",
      PROVIDER_NAME,
    );
  }
  return new AIProviderError(
    "unknown",
    "Ocurrió un error inesperado con el proveedor.",
    PROVIDER_NAME,
  );
}

function toAnthropicMessages(messages: AIMessage[]): Anthropic.MessageParam[] {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/**
 * Único punto del sistema que conoce el SDK de Anthropic (sección 5.2).
 * Implementa AIProvider sin exponer ningún detalle del SDK a quien lo consume.
 */
export class AnthropicProviderAdapter implements AIProvider {
  readonly name = PROVIDER_NAME;

  async validateCredentials(
    credentials: string,
  ): Promise<AICredentialValidationResult> {
    const client = new Anthropic({ apiKey: credentials });
    try {
      await client.models.list({ limit: 1 });
      return { valid: true };
    } catch (error) {
      const normalized = normalizeError(error);
      return { valid: false, error: normalized.message };
    }
  }

  async sendMessage(
    messages: AIMessage[],
    params: AIModelParameters,
    credentials: string,
  ): Promise<AICompletionResult> {
    const client = new Anthropic({ apiKey: credentials });
    const startedAt = Date.now();

    try {
      const response = await client.messages.create({
        model: params.model,
        system: params.systemPrompt,
        messages: toAnthropicMessages(messages),
        temperature: params.temperature,
        max_tokens: params.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      });

      return {
        content: extractText(response.content),
        finishReason: mapStopReason(response.stop_reason),
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async *streamMessage(
    messages: AIMessage[],
    params: AIModelParameters,
    credentials: string,
  ): AsyncIterable<AIStreamChunk> {
    const client = new Anthropic({ apiKey: credentials });
    const startedAt = Date.now();

    let stream: AsyncIterable<Anthropic.RawMessageStreamEvent>;

    try {
      stream = await client.messages.create({
        model: params.model,
        system: params.systemPrompt,
        messages: toAnthropicMessages(messages),
        temperature: params.temperature,
        max_tokens: params.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        stream: true,
      });
    } catch (error) {
      throw normalizeError(error);
    }

    let finishReason: AIFinishReason = "unknown";
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      for await (const event of stream) {
        if (event.type === "message_start") {
          inputTokens = event.message.usage.input_tokens;
          outputTokens = event.message.usage.output_tokens;
        } else if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield { type: "content_delta", delta: event.delta.text };
        } else if (event.type === "message_delta") {
          finishReason = mapStopReason(event.delta.stop_reason);
          outputTokens = event.usage.output_tokens;
        }
      }
    } catch (error) {
      throw normalizeError(error);
    }

    yield {
      type: "done",
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      finishReason,
      latencyMs: Date.now() - startedAt,
    };
  }

  listAvailableModels(): string[] {
    return ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5-20251001"];
  }
}

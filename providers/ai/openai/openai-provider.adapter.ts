import OpenAI from "openai";
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

const PROVIDER_NAME: AIProviderName = "openai";

const FINISH_REASON_MAP: Record<string, AIFinishReason> = {
  stop: "stop",
  length: "length",
  tool_calls: "tool_call",
  function_call: "tool_call",
  content_filter: "content_filter",
};

function mapFinishReason(reason: string | null | undefined): AIFinishReason {
  if (!reason) return "unknown";
  return FINISH_REASON_MAP[reason] ?? "unknown";
}

function normalizeError(error: unknown): AIProviderError {
  if (error instanceof OpenAI.AuthenticationError) {
    return new AIProviderError(
      "authentication",
      "Las credenciales del proveedor no son válidas.",
      PROVIDER_NAME,
    );
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new AIProviderError(
      "rate_limit",
      "Se alcanzó el límite de uso del proveedor.",
      PROVIDER_NAME,
    );
  }
  if (error instanceof OpenAI.PermissionDeniedError) {
    return new AIProviderError(
      "content",
      "El contenido fue rechazado por el proveedor.",
      PROVIDER_NAME,
    );
  }
  if (
    error instanceof OpenAI.APIConnectionError ||
    error instanceof OpenAI.InternalServerError
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

function toOpenAiMessages(
  messages: AIMessage[],
  systemPrompt?: string,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const result: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    result.push({ role: "system", content: systemPrompt });
  }
  for (const message of messages) {
    result.push({ role: message.role, content: message.content });
  }
  return result;
}

/**
 * Único punto del sistema que conoce el SDK de OpenAI (sección 5.2).
 * Implementa AIProvider sin exponer ningún detalle del SDK a quien lo consume.
 */
export class OpenAIProviderAdapter implements AIProvider {
  readonly name = PROVIDER_NAME;

  async validateCredentials(
    credentials: string,
  ): Promise<AICredentialValidationResult> {
    const client = new OpenAI({ apiKey: credentials });
    try {
      await client.models.list();
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
    const client = new OpenAI({ apiKey: credentials });
    const startedAt = Date.now();

    try {
      const completion = await client.chat.completions.create({
        model: params.model,
        messages: toOpenAiMessages(messages, params.systemPrompt),
        temperature: params.temperature,
        max_completion_tokens: params.maxOutputTokens,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
      });

      const choice = completion.choices[0];
      return {
        content: choice?.message.content ?? "",
        finishReason: mapFinishReason(choice?.finish_reason),
        usage: {
          inputTokens: completion.usage?.prompt_tokens ?? 0,
          outputTokens: completion.usage?.completion_tokens ?? 0,
          totalTokens: completion.usage?.total_tokens ?? 0,
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
    const client = new OpenAI({ apiKey: credentials });
    const startedAt = Date.now();

    let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

    try {
      stream = await client.chat.completions.create({
        model: params.model,
        messages: toOpenAiMessages(messages, params.systemPrompt),
        temperature: params.temperature,
        max_completion_tokens: params.maxOutputTokens,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        stream: true,
        stream_options: { include_usage: true },
      });
    } catch (error) {
      throw normalizeError(error);
    }

    let finishReason: AIFinishReason = "unknown";
    let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    try {
      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        const delta = choice?.delta.content;
        if (delta) {
          yield { type: "content_delta", delta };
        }
        if (choice?.finish_reason) {
          finishReason = mapFinishReason(choice.finish_reason);
        }
        if (chunk.usage) {
          usage = {
            inputTokens: chunk.usage.prompt_tokens,
            outputTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          };
        }
      }
    } catch (error) {
      throw normalizeError(error);
    }

    yield {
      type: "done",
      usage,
      finishReason,
      latencyMs: Date.now() - startedAt,
    };
  }

  listAvailableModels(): string[] {
    // Lista conservadora de familias de modelos estables; la pantalla
    // Proveedores IA también permite introducir un identificador de modelo
    // personalizado para no depender exclusivamente de esta lista.
    return ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3", "o3-mini"];
  }
}

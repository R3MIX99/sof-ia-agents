import type {
  AIProvider,
  AIProviderName,
} from "@/providers/ai/interfaces/ai-provider.interface";
import { OpenAIProviderAdapter } from "@/providers/ai/openai/openai-provider.adapter";
import { AnthropicProviderAdapter } from "@/providers/ai/anthropic/anthropic-provider.adapter";

/**
 * Único punto de instanciación de adaptadores de IA (sección 5.3). Ningún
 * caso de uso debe instanciar un adaptador directamente; siempre debe
 * solicitarlo a esta fábrica.
 *
 * Sección 5.4 (extensibilidad): agregar un proveedor futuro requiere
 * únicamente crear su adaptador e incorporarlo al registro de abajo.
 */
const ADAPTER_REGISTRY: Record<AIProviderName, () => AIProvider> = {
  openai: () => new OpenAIProviderAdapter(),
  anthropic: () => new AnthropicProviderAdapter(),
};

export class AIProviderFactory {
  static create(providerName: AIProviderName): AIProvider {
    const build = ADAPTER_REGISTRY[providerName];
    if (!build) {
      throw new Error(`Proveedor de IA no soportado: ${providerName}`);
    }
    return build();
  }

  static supportedProviders(): AIProviderName[] {
    return Object.keys(ADAPTER_REGISTRY) as AIProviderName[];
  }
}

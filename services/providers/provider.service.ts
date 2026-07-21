import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SupabaseProviderConfigRepository } from "@/infrastructure/supabase/repositories/provider-config.repository";
import { SupabaseProviderUsageLogRepository } from "@/infrastructure/supabase/repositories/provider-usage-log.repository";
import { AIProviderFactory } from "@/providers/ai/factory/ai-provider.factory";
import type { AIProviderName } from "@/providers/ai/interfaces/ai-provider.interface";
import type { ProviderConfig } from "@/domain/entities/provider-config.entity";
import type {
  CreateProviderConfigInput,
  UpdateProviderConfigInput,
} from "@/domain/repositories-interfaces/provider-config-repository.interface";
import { ApiError } from "@/lib/http/api-error";

export interface ProviderConsumptionSummary {
  providerConfigId: string;
  provider: AIProviderName;
  model: string;
  requestCount: number;
  errorCount: number;
  inputTokens: number;
  outputTokens: number;
  avgLatencyMs: number;
}

export class ProviderService {
  private readonly configs: SupabaseProviderConfigRepository;
  private readonly usageLogs: SupabaseProviderUsageLogRepository;

  constructor(client: SupabaseClient<Database>) {
    this.configs = new SupabaseProviderConfigRepository(client);
    this.usageLogs = new SupabaseProviderUsageLogRepository(client);
  }

  async listByOrganization(organizationId: string): Promise<ProviderConfig[]> {
    return this.configs.findByOrganizationId(organizationId);
  }

  async getById(id: string): Promise<ProviderConfig | null> {
    return this.configs.findById(id);
  }

  async createConfig(input: CreateProviderConfigInput): Promise<ProviderConfig> {
    return this.configs.create(input);
  }

  async updateConfig(
    id: string,
    input: UpdateProviderConfigInput,
  ): Promise<ProviderConfig> {
    return this.configs.update(id, input);
  }

  async deleteConfig(id: string): Promise<void> {
    return this.configs.delete(id);
  }

  /** Servicio de validación de credenciales (Fase 3): valida contra el proveedor real y persiste el resultado. */
  async validateCredentials(id: string): Promise<ProviderConfig> {
    const config = await this.configs.findById(id);
    if (!config) {
      throw new ApiError(
        "not_found",
        "provider_config_not_found",
        "No se encontró la configuración del proveedor.",
        404,
      );
    }

    let credentials: string;
    try {
      credentials = await this.configs.getDecryptedCredentials(id);
    } catch {
      throw new ApiError(
        "internal",
        "admin_client_unavailable",
        "La validación de credenciales no está configurada en este entorno.",
        501,
      );
    }

    const adapter = AIProviderFactory.create(config.provider);
    const result = await adapter.validateCredentials(credentials);

    return this.configs.update(id, {
      validationStatus: result.valid ? "válida" : "inválida",
      lastValidatedAt: new Date(),
    });
  }

  listAvailableModels(provider: AIProviderName): string[] {
    return AIProviderFactory.create(provider).listAvailableModels();
  }

  async listUsageLogs(providerConfigId: string) {
    return this.usageLogs.findByProviderConfigId(providerConfigId);
  }

  /** Servicio de registro de consumo (Fase 3): agrega los logs de uso por configuración de proveedor. */
  async getConsumptionSummary(
    organizationId: string,
  ): Promise<ProviderConsumptionSummary[]> {
    const configs = await this.configs.findByOrganizationId(organizationId);

    return Promise.all(
      configs.map(async (config) => {
        const logs = await this.usageLogs.findByProviderConfigId(config.id);
        const requestCount = logs.length;
        const errorCount = logs.filter((log) => log.status === "error").length;
        const inputTokens = logs.reduce((sum, log) => sum + log.inputTokens, 0);
        const outputTokens = logs.reduce(
          (sum, log) => sum + log.outputTokens,
          0,
        );
        const avgLatencyMs = requestCount
          ? Math.round(
              logs.reduce((sum, log) => sum + log.latencyMs, 0) / requestCount,
            )
          : 0;

        return {
          providerConfigId: config.id,
          provider: config.provider,
          model: config.model,
          requestCount,
          errorCount,
          inputTokens,
          outputTokens,
          avgLatencyMs,
        };
      }),
    );
  }
}

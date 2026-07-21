import type { ProviderConfig } from "@/domain/entities/provider-config.entity";

export interface CreateProviderConfigInput {
  organizationId: string;
  provider: ProviderConfig["provider"];
  credentialsPlainText: string;
  model: string;
  defaultTemperature?: number | null;
  defaultMaxTokens?: number | null;
  defaultSystemPrompt?: string | null;
}

export type UpdateProviderConfigInput = Partial<
  Omit<CreateProviderConfigInput, "organizationId" | "provider">
> & {
  validationStatus?: ProviderConfig["validationStatus"];
  lastValidatedAt?: Date | null;
};

export interface ProviderConfigRepository {
  findById(id: string): Promise<ProviderConfig | null>;
  findByOrganizationId(organizationId: string): Promise<ProviderConfig[]>;
  create(input: CreateProviderConfigInput): Promise<ProviderConfig>;
  update(id: string, input: UpdateProviderConfigInput): Promise<ProviderConfig>;
  delete(id: string): Promise<void>;
  /** Solo debe invocarse desde el servidor, con el cliente de servicio, para llamar al proveedor. */
  getDecryptedCredentials(id: string): Promise<string>;
}

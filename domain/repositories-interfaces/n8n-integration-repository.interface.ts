import type {
  N8nAuthType,
  N8nErrorHandlingStrategy,
  N8nExpectedResponseFormat,
  N8nHttpMethod,
  N8nIntegration,
  N8nIntegrationStatus,
} from "@/domain/entities/n8n-integration.entity";

export interface CreateN8nIntegrationInput {
  organizationId: string;
  name: string;
  webhookUrl: string;
  httpMethod: N8nHttpMethod;
  headers?: Record<string, string>;
  authType: N8nAuthType;
  /** Texto plano de la credencial (token, cabecera estática o "usuario:contraseña"); se cifra en la capa de infraestructura. */
  authCredentialsPlainText?: string | null;
  dynamicVariables?: Record<string, string>;
  timeoutMs?: number;
  retryCount?: number;
  retryBackoffMs?: number;
  errorHandlingStrategy?: N8nErrorHandlingStrategy;
  expectedResponseFormat?: N8nExpectedResponseFormat;
  status?: N8nIntegrationStatus;
}

export type UpdateN8nIntegrationInput = Partial<
  Omit<CreateN8nIntegrationInput, "organizationId">
>;

export interface N8nIntegrationRepository {
  findById(id: string): Promise<N8nIntegration | null>;
  findByOrganizationId(organizationId: string): Promise<N8nIntegration[]>;
  create(input: CreateN8nIntegrationInput): Promise<N8nIntegration>;
  update(id: string, input: UpdateN8nIntegrationInput): Promise<N8nIntegration>;
  delete(id: string): Promise<void>;
  /** Solo debe invocarse desde el servidor, con el cliente de servicio, para ejecutar el Webhook. Devuelve null si auth_type es "ninguna". */
  getDecryptedCredentials(id: string): Promise<string | null>;
}

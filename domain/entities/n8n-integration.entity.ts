export type N8nHttpMethod = "POST" | "GET" | "PUT" | "PATCH";
export type N8nAuthType = "ninguna" | "cabecera_estatica" | "token" | "básica";
export type N8nErrorHandlingStrategy = "continuar" | "interrumpir";
export type N8nIntegrationStatus = "activa" | "deshabilitada";

export interface N8nExpectedResponseFormat {
  /** Ruta del campo (notación con puntos) en la respuesta JSON del Webhook que contiene el contenido a mostrar al usuario final. */
  contentField: string;
}

// Nunca incluye la credencial: el dominio no debe transportar el secreto.
// Solo la capa de infraestructura, con el cliente de servicio, accede a
// `auth_credentials_encrypted` (sección 15.13).
export interface N8nIntegration {
  id: string;
  organizationId: string;
  name: string;
  webhookUrl: string;
  httpMethod: N8nHttpMethod;
  headers: Record<string, string>;
  authType: N8nAuthType;
  dynamicVariables: Record<string, string>;
  timeoutMs: number;
  retryCount: number;
  retryBackoffMs: number;
  errorHandlingStrategy: N8nErrorHandlingStrategy;
  expectedResponseFormat: N8nExpectedResponseFormat;
  status: N8nIntegrationStatus;
  createdAt: Date;
  updatedAt: Date;
}

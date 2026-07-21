export type ApiErrorCategory =
  | "validation"
  | "authentication"
  | "authorization"
  | "not_found"
  | "rate_limit"
  | "external_dependency"
  | "internal";

/**
 * Estructura de error uniforme de la API (sección 16.5). Los errores
 * originados en dependencias externas (proveedores de IA, n8n) deben
 * traducirse a esta forma antes de propagarse, sin exponer detalles
 * internos del servicio externo.
 */
export class ApiError extends Error {
  constructor(
    public readonly category: ApiErrorCategory,
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

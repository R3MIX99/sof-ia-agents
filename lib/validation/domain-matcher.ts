import type { WidgetDomain } from "@/domain/entities/widget-domain.entity";

/**
 * Normaliza un dominio ingresado por el usuario a un hostname desnudo,
 * tolerando errores comunes de captura (pegar la URL completa con esquema,
 * ruta o barra final) para que la comparación de origen nunca falle por un
 * formato de almacenamiento inconsistente.
 */
export function normalizeHostname(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .split(/[/?#]/)[0]
    .split(":")[0]
    .replace(/^www\./, "");
}

/** Verifica que el origen de una solicitud pública del widget coincida con alguno de los dominios permitidos configurados (sección 13.4). */
export function matchesAllowedDomain(
  originHostname: string,
  domains: WidgetDomain[],
): boolean {
  const hostname = normalizeHostname(originHostname);
  return domains.some((entry) => {
    const configured = normalizeHostname(entry.domain);
    if (hostname === configured) return true;
    if (entry.isWildcard) {
      return hostname.endsWith(`.${configured}`);
    }
    return false;
  });
}

/** Extrae el hostname de un encabezado Origin (por ejemplo "https://ejemplo.com:3000"). Devuelve null si el valor no es una URL válida. */
export function extractHostnameFromOrigin(
  origin: string | null,
): string | null {
  if (!origin) return null;
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

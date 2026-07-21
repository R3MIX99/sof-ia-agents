import { ApiError } from "@/lib/http/api-error";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(
      "validation",
      "invalid_field",
      `El campo "${field}" es obligatorio y debe ser un texto no vacío.`,
      400,
      { field },
    );
  }
  return value;
}

export function optionalString(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ApiError(
      "validation",
      "invalid_field",
      `El campo "${field}" debe ser un texto.`,
      400,
      { field },
    );
  }
  return value;
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiError(
      "validation",
      "invalid_field",
      `El campo "${field}" debe ser uno de: ${allowed.join(", ")}.`,
      400,
      { field },
    );
  }
  return value as T;
}

export function requireUuid(value: unknown, field: string): string {
  const str = requireString(value, field);
  if (!UUID_PATTERN.test(str)) {
    throw new ApiError(
      "validation",
      "invalid_field",
      `El campo "${field}" debe ser un identificador válido.`,
      400,
      { field },
    );
  }
  return str;
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(
      "validation",
      "invalid_body",
      "El cuerpo de la solicitud debe ser JSON válido.",
      400,
    );
  }
}

export interface ApiErrorPayload {
  category: string;
  code: string;
  message: string;
  details: Record<string, unknown> | null;
}

export class ApiClientError extends Error {
  constructor(
    public readonly payload: ApiErrorPayload,
    public readonly status: number,
  ) {
    super(payload.message);
  }
}

/** Cliente ligero para consumir /api/v1/* desde componentes de cliente, con manejo uniforme de errores. */
export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new ApiClientError(payload.error, response.status);
  }

  return payload.data as T;
}

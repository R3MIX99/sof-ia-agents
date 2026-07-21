import { ApiError } from "@/lib/http/api-error";

/**
 * Encabezados CORS para los endpoints públicos del widget embebible, que se
 * invocan por fetch desde el navegador de terceros en dominios validados
 * contra widget_domains (sección 13.4). El origen se refleja únicamente
 * cuando ya fue validado por el llamador; nunca se usa "*" sin validar.
 */
export function buildCorsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function corsPreflightResponse(origin: string): Response {
  return new Response(null, { status: 204, headers: buildCorsHeaders(origin) });
}

/** Respuesta JSON exitosa con encabezados CORS, para los endpoints públicos del widget. */
export function corsJsonSuccess(
  data: unknown,
  origin: string,
  status = 200,
): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...buildCorsHeaders(origin),
    },
  });
}

/** Respuesta de error uniforme (sección 16.5) con encabezados CORS, para los endpoints públicos del widget. */
export function corsJsonError(error: unknown, origin: string): Response {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: {
          category: error.category,
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      }),
      {
        status: error.status,
        headers: {
          "Content-Type": "application/json",
          ...buildCorsHeaders(origin),
        },
      },
    );
  }

  console.error(error);
  return new Response(
    JSON.stringify({
      error: {
        category: "internal",
        code: "internal_error",
        message: "Ocurrió un error interno inesperado.",
        details: null,
      },
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...buildCorsHeaders(origin),
      },
    },
  );
}

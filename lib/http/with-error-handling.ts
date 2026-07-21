import type { NextRequest } from "next/server";
import { apiErrorResponse } from "./api-response";

type RouteHandler<Context> = (
  request: NextRequest,
  context: Context,
) => Promise<Response>;

/** Envuelve un Route Handler para traducir cualquier error lanzado a la estructura uniforme de la sección 16.5. */
export function withErrorHandling<Context = unknown>(
  handler: RouteHandler<Context>,
): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}

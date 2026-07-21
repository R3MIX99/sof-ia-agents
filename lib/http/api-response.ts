import { NextResponse } from "next/server";
import { ApiError } from "./api-error";

export function apiSuccess<T>(data: T, init?: { status?: number }) {
  return NextResponse.json({ data }, { status: init?.status ?? 200 });
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          category: error.category,
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: {
        category: "internal" satisfies ApiError["category"],
        code: "internal_error",
        message: "Ocurrió un error interno inesperado.",
        details: null,
      },
    },
    { status: 500 },
  );
}

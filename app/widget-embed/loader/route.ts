import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const RUNTIME_PATH = path.join(
  process.cwd(),
  "widget-client",
  "core",
  "runtime.js",
);

/**
 * Script del cargador del widget embebible (sección 13.5), alojado
 * públicamente y referenciado por el snippet. Sirve el código fuente de
 * /widget-client/core/runtime.js, completamente aislado del código del
 * dashboard.
 */
export async function GET() {
  const source = await readFile(RUNTIME_PATH, "utf8");
  return new NextResponse(source, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

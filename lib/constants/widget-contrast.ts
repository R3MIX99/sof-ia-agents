import type { WidgetThemeMode } from "@/domain/entities/widget-appearance.entity";

const DARK_TEXT = "#111827";
const LIGHT_TEXT = "#ffffff";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Color de texto legible (oscuro o blanco) para elementos del widget que no tienen su
 * propio selector de color (título/subtítulo del encabezado, input de mensaje, pantalla
 * de bienvenida). En modo "claro"/"oscuro" el resultado es fijo; en "automático" se calcula
 * por luminancia relativa contra el color de fondo real que tenga ese elemento.
 */
export function getReadableTextColor(
  backgroundHex: string,
  themeMode: WidgetThemeMode,
): string {
  if (themeMode === "claro") return DARK_TEXT;
  if (themeMode === "oscuro") return LIGHT_TEXT;
  const rgb = hexToRgb(backgroundHex);
  if (!rgb) return LIGHT_TEXT;
  return relativeLuminance(rgb) > 0.5 ? DARK_TEXT : LIGHT_TEXT;
}

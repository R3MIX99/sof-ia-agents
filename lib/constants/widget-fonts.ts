export const DEFAULT_FONT_FAMILY = "Inter";

/** Pila de fuentes usada al renderizar: la fuente elegida, con Inter como respaldo garantizado (cargado siempre vía Google Fonts) antes de las fuentes del sistema. */
export function toFontFamilyStack(fontFamily: string): string {
  const family = fontFamily.trim() || DEFAULT_FONT_FAMILY;
  const fallback = family === DEFAULT_FONT_FAMILY ? "" : `"${DEFAULT_FONT_FAMILY}", `;
  return `"${family}", ${fallback}system-ui, sans-serif`;
}

function googleFontsFamilyParam(fontFamily: string): string {
  return `family=${encodeURIComponent(fontFamily).replace(/%20/g, "+")}:wght@400;500;600;700`;
}

/** Inyecta (una sola vez por combinación) un <link> de Google Fonts para la fuente elegida más Inter como respaldo. Si la fuente no existe en Google Fonts, el navegador simplemente ignora esa familia y usa el respaldo, sin generar errores. */
export function loadGoogleFont(fontFamily: string): void {
  if (typeof document === "undefined") return;
  const family = fontFamily.trim() || DEFAULT_FONT_FAMILY;
  const families = family === DEFAULT_FONT_FAMILY ? [family] : [family, DEFAULT_FONT_FAMILY];
  const id =
    "sofia-google-font-" + families.join("-").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  if (document.getElementById(id)) return;
  const href =
    "https://fonts.googleapis.com/css2?" +
    families.map(googleFontsFamilyParam).join("&") +
    "&display=swap";
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/** Verifica (mejor esfuerzo, solo para retroalimentación en el editor) si una familia tipográfica existe en Google Fonts. */
export async function checkGoogleFont(fontFamily: string): Promise<boolean> {
  const family = fontFamily.trim();
  if (!family) return false;
  if (family.toLowerCase() === DEFAULT_FONT_FAMILY.toLowerCase()) return true;
  try {
    const href = `https://fonts.googleapis.com/css2?${googleFontsFamilyParam(family)}&display=swap`;
    const response = await fetch(href);
    if (!response.ok) return false;
    const body = await response.text();
    return body.includes("@font-face");
  } catch {
    return false;
  }
}

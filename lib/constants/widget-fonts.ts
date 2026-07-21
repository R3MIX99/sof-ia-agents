export interface FontOption {
  value: string;
  label: string;
}

/** Familias tipográficas disponibles para el widget. El valor guardado es solo el nombre; la pila de respaldo se aplica al momento de renderizar. */
export const FONT_FAMILY_OPTIONS: FontOption[] = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "system-ui", label: "Fuente del sistema" },
];

export function toFontFamilyStack(fontFamily: string): string {
  return `"${fontFamily}", system-ui, sans-serif`;
}

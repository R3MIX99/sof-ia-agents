export type WidgetThemeMode = "claro" | "oscuro" | "automático";
export type WidgetPosition =
  | "inferior-derecha"
  | "inferior-izquierda"
  | "superior-derecha"
  | "superior-izquierda";
export type WidgetLauncherShape = "circular" | "cuadrado";
export type WidgetLauncherType = "icono" | "texto" | "icono_texto";

export interface WidgetAppearance {
  id: string;
  widgetId: string;
  themeMode: WidgetThemeMode;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  // Colores de las burbujas de mensaje del usuario y del asistente.
  userBubbleColor: string;
  assistantBubbleColor: string;
  // Color del texto dentro de la burbuja del asistente, independiente del color de texto general.
  assistantTextColor: string;
  fontFamily: string;
  headerTitle: string;
  headerSubtitle: string | null;
  // Pantalla de bienvenida centrada (logo + nombre + frase) mostrada antes del primer mensaje.
  companyName: string | null;
  companyTagline: string | null;
  initialMessage: string;
  suggestedMessages: string[];
  suggestedMessageColor: string;
  position: WidgetPosition;
  windowWidth: number;
  windowHeight: number;
  borderRadius: number;
  shadowStyle: string;
  spacingScale: string;
  animationsEnabled: boolean;
  launcherIcon: string;
  launcherColor: string;
  launcherShape: WidgetLauncherShape;
  launcherType: WidgetLauncherType;
  // Texto mostrado cuando launcherType es "texto" o "icono_texto"; si está vacío, se usa el nombre del widget.
  launcherLabel: string | null;
  // Pie del widget: un único enlace centrado (etiqueta + URL).
  footerLinkUrl: string | null;
  footerLinkLabel: string | null;
  footerLinkColor: string;
  createdAt: Date;
  updatedAt: Date;
}

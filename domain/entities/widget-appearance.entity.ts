export type WidgetThemeMode = "claro" | "oscuro" | "automático";
export type WidgetPosition =
  | "inferior-derecha"
  | "inferior-izquierda"
  | "superior-derecha"
  | "superior-izquierda";
export type WidgetLauncherShape = "circular" | "cuadrado";

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
  fontFamily: string;
  headerTitle: string;
  headerSubtitle: string | null;
  // Pantalla de bienvenida centrada (logo + nombre + frase) mostrada antes del primer mensaje.
  companyName: string | null;
  companyTagline: string | null;
  initialMessage: string;
  suggestedMessages: string[];
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
  // Pie del widget: un único enlace centrado (etiqueta + URL).
  footerLinkUrl: string | null;
  footerLinkLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

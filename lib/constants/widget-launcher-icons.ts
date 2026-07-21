import {
  Bot,
  Headphones,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  Send,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface LauncherIconOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

/** Iconos disponibles para el botón flotante del widget (solo Lucide Icons, sección 4). */
export const LAUNCHER_ICON_OPTIONS: LauncherIconOption[] = [
  { value: "message-circle", label: "Burbuja de mensaje", icon: MessageCircle },
  { value: "message-square", label: "Mensaje", icon: MessageSquare },
  { value: "bot", label: "Robot", icon: Bot },
  { value: "sparkles", label: "Destellos", icon: Sparkles },
  { value: "help-circle", label: "Ayuda", icon: HelpCircle },
  { value: "send", label: "Enviar", icon: Send },
  { value: "headphones", label: "Soporte", icon: Headphones },
  { value: "zap", label: "Rayo", icon: Zap },
];

export const LAUNCHER_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  LAUNCHER_ICON_OPTIONS.map((option) => [option.value, option.icon]),
);

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  CreditCard,
  History,
  Home,
  ScrollText,
  Settings,
  Users,
  UsersRound,
  Webhook,
  LayoutGrid,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Navegación principal del dashboard (sección 9): incluye secciones aún sin contenido funcional como rutas placeholder. */
export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/inicio", icon: Home },
  { label: "Widgets", href: "/widgets", icon: LayoutGrid },
  { label: "Analíticas", href: "/analiticas", icon: BarChart3 },
  { label: "Proveedores IA", href: "/proveedores-ia", icon: Bot },
  { label: "Integraciones n8n", href: "/integraciones-n8n", icon: Webhook },
  { label: "Usuarios", href: "/usuarios", icon: Users },
  { label: "Equipos", href: "/equipos", icon: UsersRound },
  { label: "Historial", href: "/historial", icon: History },
  { label: "Logs", href: "/logs", icon: ScrollText },
  { label: "Facturación", href: "/facturacion", icon: CreditCard },
  { label: "Configuración", href: "/configuracion", icon: Settings },
];

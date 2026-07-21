"use client";

import type { WidgetAppearance } from "@/domain/entities/widget-appearance.entity";
import { ColorPicker } from "@/components/shared/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FONT_FAMILY_OPTIONS } from "@/lib/constants/widget-fonts";
import { LAUNCHER_ICON_OPTIONS } from "@/lib/constants/widget-launcher-icons";

export type WidgetAppearancePatch = Partial<
  Omit<WidgetAppearance, "id" | "widgetId" | "createdAt" | "updatedAt">
>;

export interface ThemeEditorProps {
  appearance: WidgetAppearance;
  onChange: (patch: WidgetAppearancePatch) => void;
}

const POSITIONS: { value: WidgetAppearance["position"]; label: string }[] = [
  { value: "inferior-derecha", label: "Inferior derecha" },
  { value: "inferior-izquierda", label: "Inferior izquierda" },
  { value: "superior-derecha", label: "Superior derecha" },
  { value: "superior-izquierda", label: "Superior izquierda" },
];

/** Theme Editor (sección 8): tipografía, colores, espaciados, bordes y sombras para la personalización visual completa. */
export function ThemeEditor({ appearance, onChange }: ThemeEditorProps) {
  function updateSuggestedMessages(value: string) {
    const messages = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    onChange({ suggestedMessages: messages });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Tema y colores</h3>
        <div className="space-y-1.5">
          <Label>Modo de tema</Label>
          <Select
            value={appearance.themeMode}
            onValueChange={(value) =>
              onChange({ themeMode: value as WidgetAppearance["themeMode"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automático">Automático</SelectItem>
              <SelectItem value="claro">Claro</SelectItem>
              <SelectItem value="oscuro">Oscuro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ColorPicker
            label="Color primario"
            value={appearance.primaryColor}
            onChange={(value) => onChange({ primaryColor: value })}
          />
          <ColorPicker
            label="Color de fondo"
            value={appearance.backgroundColor}
            onChange={(value) => onChange({ backgroundColor: value })}
          />
          <ColorPicker
            label="Color de texto"
            value={appearance.textColor}
            onChange={(value) => onChange({ textColor: value })}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Burbujas de mensaje
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            label="Mensaje del usuario"
            value={appearance.userBubbleColor}
            onChange={(value) => onChange({ userBubbleColor: value })}
          />
          <ColorPicker
            label="Mensaje del asistente"
            value={appearance.assistantBubbleColor}
            onChange={(value) => onChange({ assistantBubbleColor: value })}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Tipografía</h3>
        <div className="space-y-1.5">
          <Label>Familia tipográfica</Label>
          <Select
            value={appearance.fontFamily}
            onValueChange={(value) => onChange({ fontFamily: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Encabezado</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="header-title">Título del encabezado</Label>
            <Input
              id="header-title"
              value={appearance.headerTitle}
              onChange={(event) => onChange({ headerTitle: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="header-subtitle">Subtítulo del encabezado</Label>
            <Input
              id="header-subtitle"
              value={appearance.headerSubtitle ?? ""}
              onChange={(event) =>
                onChange({ headerSubtitle: event.target.value || null })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Enlace inferior</h3>
        <p className="text-xs text-muted-foreground">
          Se muestra centrado en la parte inferior del widget. Déjalo en
          blanco para no mostrar ningún enlace.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="footer-link-label">Etiqueta</Label>
            <Input
              id="footer-link-label"
              value={appearance.footerLinkLabel ?? ""}
              onChange={(event) =>
                onChange({ footerLinkLabel: event.target.value || null })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="footer-link-url">URL</Label>
            <Input
              id="footer-link-url"
              value={appearance.footerLinkUrl ?? ""}
              onChange={(event) =>
                onChange({ footerLinkUrl: event.target.value || null })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Conversación</h3>
        <div className="space-y-1.5">
          <Label htmlFor="initial-message">Mensaje inicial</Label>
          <Textarea
            id="initial-message"
            value={appearance.initialMessage}
            onChange={(event) => onChange({ initialMessage: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="suggested-messages">
            Mensajes sugeridos (uno por línea)
          </Label>
          <Textarea
            id="suggested-messages"
            value={appearance.suggestedMessages.join("\n")}
            onChange={(event) => updateSuggestedMessages(event.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Botón flotante
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Ícono</Label>
            <Select
              value={appearance.launcherIcon}
              onValueChange={(value) => onChange({ launcherIcon: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAUNCHER_ICON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Forma</Label>
            <Select
              value={appearance.launcherShape}
              onValueChange={(value) =>
                onChange({
                  launcherShape: value as WidgetAppearance["launcherShape"],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circular">Circular</SelectItem>
                <SelectItem value="cuadrado">Cuadrado redondeado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <ColorPicker
          label="Color del botón flotante"
          value={appearance.launcherColor}
          onChange={(value) => onChange({ launcherColor: value })}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Posición y tamaño
        </h3>
        <div className="space-y-1.5">
          <Label>Posición</Label>
          <Select
            value={appearance.position}
            onValueChange={(value) =>
              onChange({ position: value as WidgetAppearance["position"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="window-width">Ancho de ventana (px)</Label>
            <Input
              id="window-width"
              type="number"
              value={appearance.windowWidth}
              onChange={(event) =>
                onChange({ windowWidth: Number(event.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="window-height">Alto de ventana (px)</Label>
            <Input
              id="window-height"
              type="number"
              value={appearance.windowHeight}
              onChange={(event) =>
                onChange({ windowHeight: Number(event.target.value) })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Bordes, sombras y animación
        </h3>
        <div className="space-y-1.5">
          <Label htmlFor="border-radius">Radio de bordes (px)</Label>
          <Input
            id="border-radius"
            type="number"
            value={appearance.borderRadius}
            onChange={(event) =>
              onChange({ borderRadius: Number(event.target.value) })
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Estilo de sombra</Label>
            <Select
              value={appearance.shadowStyle}
              onValueChange={(value) => onChange({ shadowStyle: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Ninguna</SelectItem>
                <SelectItem value="suave">Suave</SelectItem>
                <SelectItem value="pronunciada">Pronunciada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Escala de espaciados</Label>
            <Select
              value={appearance.spacingScale}
              onValueChange={(value) => onChange({ spacingScale: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compacto">Compacto</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="amplio">Amplio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Animaciones habilitadas</p>
            <p className="text-xs text-muted-foreground">
              Anima la apertura, cierre y aparición de mensajes.
            </p>
          </div>
          <Switch
            checked={appearance.animationsEnabled}
            onCheckedChange={(checked) =>
              onChange({ animationsEnabled: checked })
            }
          />
        </div>
      </section>
    </div>
  );
}

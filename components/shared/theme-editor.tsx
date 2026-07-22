"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { WidgetAppearance } from "@/domain/entities/widget-appearance.entity";
import { ColorPicker } from "@/components/shared/color-picker";
import { Button } from "@/components/ui/button";
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
import { checkGoogleFont, DEFAULT_FONT_FAMILY } from "@/lib/constants/widget-fonts";
import {
  LAUNCHER_ICON_MAP,
  LAUNCHER_ICON_OPTIONS,
} from "@/lib/constants/widget-launcher-icons";
import { cn } from "@/lib/utils";

type FontCheckStatus = "idle" | "checking" | "found" | "not_found";

/** Campo de tipografía de texto libre: cualquier familia de Google Fonts, verificada con un pequeño retraso mientras el usuario escribe. Si no se encuentra, el widget usa Inter como respaldo automáticamente (ver toFontFamilyStack). */
function FontFamilyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [status, setStatus] = useState<FontCheckStatus>("idle");

  useEffect(() => {
    const family = value.trim();
    if (!family) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    let cancelled = false;
    const timeout = setTimeout(() => {
      checkGoogleFont(family).then((found) => {
        if (!cancelled) setStatus(found ? "found" : "not_found");
      });
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="font-family">Familia tipográfica</Label>
      <Input
        id="font-family"
        placeholder={DEFAULT_FONT_FAMILY}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        {status === "checking" && "Verificando en Google Fonts…"}
        {status === "found" && "✓ Disponible en Google Fonts."}
        {status === "not_found" &&
          `No se encontró "${value}" en Google Fonts. Se usará ${DEFAULT_FONT_FAMILY} como respaldo.`}
        {status === "idle" &&
          `Escribe cualquier fuente de Google Fonts. Si no se encuentra, se usa ${DEFAULT_FONT_FAMILY}.`}
      </p>
    </div>
  );
}

export type WidgetAppearancePatch = Partial<
  Omit<WidgetAppearance, "id" | "widgetId" | "createdAt" | "updatedAt">
>;

export interface ThemeEditorProps {
  appearance: WidgetAppearance;
  onChange: (patch: WidgetAppearancePatch) => void;
}

const LAUNCHER_TYPES: {
  value: WidgetAppearance["launcherType"];
  label: string;
}[] = [
  { value: "icono", label: "Solo ícono" },
  { value: "texto", label: "Solo texto" },
  { value: "icono_texto", label: "Ícono y texto" },
];

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

  function addInitialMessage() {
    onChange({ initialMessages: [...appearance.initialMessages, ""] });
  }

  function updateInitialMessage(index: number, value: string) {
    const messages = appearance.initialMessages.map((message, i) =>
      i === index ? value : message,
    );
    onChange({ initialMessages: messages });
  }

  function removeInitialMessage(index: number) {
    onChange({
      initialMessages: appearance.initialMessages.filter((_, i) => i !== index),
    });
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
          <ColorPicker
            label="Texto del asistente"
            value={appearance.assistantTextColor}
            onChange={(value) => onChange({ assistantTextColor: value })}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Tipografía</h3>
        <FontFamilyField
          value={appearance.fontFamily}
          onChange={(value) => onChange({ fontFamily: value })}
        />
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
        <h3 className="text-sm font-medium text-foreground">
          Pantalla de bienvenida
        </h3>
        <p className="text-xs text-muted-foreground">
          Se muestra centrada, con el logo del widget, antes del primer
          mensaje. Déjala en blanco para no mostrarla.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="company-name">Nombre de la empresa</Label>
            <Input
              id="company-name"
              value={appearance.companyName ?? ""}
              onChange={(event) =>
                onChange({ companyName: event.target.value || null })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-tagline">Frase</Label>
            <Input
              id="company-tagline"
              value={appearance.companyTagline ?? ""}
              onChange={(event) =>
                onChange({ companyTagline: event.target.value || null })
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
        <ColorPicker
          label="Color del enlace"
          value={appearance.footerLinkColor}
          onChange={(value) => onChange({ footerLinkColor: value })}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Conversación</h3>
        <div className="space-y-1.5">
          <Label>Mensajes iniciales</Label>
          <p className="text-xs text-muted-foreground">
            Cada bloque se envía como un mensaje independiente del asistente,
            en orden y en su propia burbuja, antes de que el visitante
            escriba algo. Usa varias líneas dentro de un mismo bloque (por
            ejemplo, para una lista) sin que se separe en mensajes distintos.
          </p>
          <div className="space-y-2">
            {appearance.initialMessages.map((message, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(event) =>
                    updateInitialMessage(index, event.target.value)
                  }
                  className="min-h-16"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Quitar mensaje"
                  onClick={() => removeInitialMessage(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addInitialMessage}
          >
            <Plus className="size-4" /> Agregar mensaje
          </Button>
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
        <ColorPicker
          label="Color de los mensajes sugeridos"
          value={appearance.suggestedMessageColor}
          onChange={(value) => onChange({ suggestedMessageColor: value })}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Botón flotante
        </h3>
        <div className="space-y-1.5">
          <Label>Tipo de botón</Label>
          <div className="grid grid-cols-3 gap-3">
            {LAUNCHER_TYPES.map((option) => {
              const LauncherIcon =
                LAUNCHER_ICON_MAP[appearance.launcherIcon] ??
                LAUNCHER_ICON_MAP["message-circle"];
              const label = appearance.launcherLabel || "Sof.ia";
              const selected = appearance.launcherType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ launcherType: option.value })}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-3 rounded-lg border p-4",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-2 left-2 size-3.5 rounded-full border",
                      selected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40",
                    )}
                  />
                  {option.value === "icono" && (
                    <span
                      className="flex size-10 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: appearance.launcherColor }}
                    >
                      <LauncherIcon className="size-5" />
                    </span>
                  )}
                  {option.value === "texto" && (
                    <span
                      className="rounded-full px-4 py-2 text-xs font-medium text-white"
                      style={{ backgroundColor: appearance.launcherColor }}
                    >
                      {label}
                    </span>
                  )}
                  {option.value === "icono_texto" && (
                    <span
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white"
                      style={{ backgroundColor: appearance.launcherColor }}
                    >
                      <LauncherIcon className="size-4" />
                      {label}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {appearance.launcherType !== "icono" && (
          <div className="space-y-1.5">
            <Label htmlFor="launcher-label">Texto del botón</Label>
            <Input
              id="launcher-label"
              placeholder="Sof.ia"
              value={appearance.launcherLabel ?? ""}
              onChange={(event) =>
                onChange({ launcherLabel: event.target.value || null })
              }
            />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {appearance.launcherType !== "texto" && (
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
          )}
          {appearance.launcherType === "icono" && (
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
          )}
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

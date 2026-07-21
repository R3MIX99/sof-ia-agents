"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { WidgetAppearance } from "@/domain/entities/widget-appearance.entity";
import { LAUNCHER_ICON_MAP } from "@/lib/constants/widget-launcher-icons";
import { loadGoogleFont, toFontFamilyStack } from "@/lib/constants/widget-fonts";
import { getHeaderTextColor, getReadableTextColor } from "@/lib/constants/widget-contrast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WidgetPreviewProps {
  appearance: WidgetAppearance;
  widgetName: string;
}

const SHADOW_STYLES: Record<string, string> = {
  ninguna: "none",
  suave: "0 4px 16px rgba(0,0,0,0.12)",
  pronunciada: "0 20px 40px rgba(0,0,0,0.32)",
};

const SPACING_SCALES: Record<string, { padding: string; gap: string }> = {
  compacto: { padding: "0.5rem", gap: "0.375rem" },
  normal: { padding: "1rem", gap: "0.625rem" },
  amplio: { padding: "1.5rem", gap: "1rem" },
};

/** Widget Preview (sección 8): previsualización en vivo, incluyendo burbujas de mensaje y el botón flotante, sin necesidad de publicar el widget. */
export function WidgetPreview({ appearance, widgetName }: WidgetPreviewProps) {
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    loadGoogleFont(appearance.fontFamily);
  }, [appearance.fontFamily]);

  const LauncherIcon =
    LAUNCHER_ICON_MAP[appearance.launcherIcon] ??
    LAUNCHER_ICON_MAP["message-circle"];
  const spacing = SPACING_SCALES[appearance.spacingScale] ?? SPACING_SCALES.normal;
  const shadow = SHADOW_STYLES[appearance.shadowStyle] ?? SHADOW_STYLES.suave;
  const fontFamily = toFontFamilyStack(appearance.fontFamily);
  const entranceClass = appearance.animationsEnabled
    ? "animate-in fade-in slide-in-from-bottom-2 duration-300"
    : "";
  const bodyTextColor = getReadableTextColor(appearance.backgroundColor, appearance.themeMode);
  const headerTextColor = getHeaderTextColor(appearance.textColor, appearance.themeMode);

  return (
    <div className="space-y-3">
      <div
        className="flex flex-col items-center gap-6 rounded-xl border border-dashed border-border bg-muted/30 p-8"
        style={{ fontFamily }}
      >
        <div
          key={`window-${replayKey}`}
          className="flex w-80 flex-col overflow-hidden"
          style={{
            borderRadius: `${appearance.borderRadius}px`,
            backgroundColor: appearance.backgroundColor,
            color: bodyTextColor,
            boxShadow: shadow,
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ backgroundColor: appearance.primaryColor, color: headerTextColor }}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-medium">
              {widgetName.slice(0, 1).toUpperCase() || "W"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {appearance.headerTitle || widgetName}
              </p>
              {appearance.headerSubtitle && (
                <p className="truncate text-xs opacity-80">
                  {appearance.headerSubtitle}
                </p>
              )}
            </div>
          </div>

          <div
            className="flex flex-1 flex-col"
            style={{ padding: spacing.padding, gap: spacing.gap }}
          >
            {(appearance.initialMessages.length > 0
              ? appearance.initialMessages
              : ["¡Hola! ¿En qué puedo ayudarte hoy?"]
            ).map((message, index) => (
              <div
                key={index}
                className={cn(
                  "max-w-[85%] self-start rounded-lg px-3 py-2 text-sm",
                  entranceClass,
                )}
                style={{
                  backgroundColor: appearance.assistantBubbleColor,
                  color: appearance.assistantTextColor,
                }}
              >
                {message}
              </div>
            ))}
            <div
              className={cn(
                "max-w-[85%] self-end rounded-lg px-3 py-2 text-sm text-white",
                entranceClass,
              )}
              style={{ backgroundColor: appearance.userBubbleColor }}
            >
              Hola, tengo una pregunta.
            </div>
            {appearance.suggestedMessages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {appearance.suggestedMessages.slice(0, 3).map((message, index) => (
                  <span
                    key={index}
                    className="rounded-full border px-2.5 py-1 text-xs"
                    style={{
                      borderColor: appearance.suggestedMessageColor,
                      color: appearance.suggestedMessageColor,
                    }}
                  >
                    {message}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(appearance.footerLinkLabel || appearance.footerLinkUrl) && (
            <div className="border-t border-black/5 px-4 py-2 text-center text-[11px]">
              {appearance.footerLinkUrl ? (
                <a
                  href={appearance.footerLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-85 hover:underline"
                  style={{ color: appearance.footerLinkColor }}
                >
                  {appearance.footerLinkLabel || appearance.footerLinkUrl}
                </a>
              ) : (
                <span className="opacity-85" style={{ color: appearance.footerLinkColor }}>
                  {appearance.footerLinkLabel}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          {appearance.launcherType === "icono" && (
            <div
              key={`launcher-${replayKey}`}
              className={cn(
                "flex size-14 items-center justify-center text-white",
                appearance.launcherShape === "circular"
                  ? "rounded-full"
                  : "rounded-2xl",
                entranceClass,
              )}
              style={{ backgroundColor: appearance.launcherColor, boxShadow: shadow }}
            >
              <LauncherIcon className="size-6" />
            </div>
          )}
          {appearance.launcherType === "texto" && (
            <div
              key={`launcher-${replayKey}`}
              className={cn(
                "flex h-10 items-center rounded-full px-4 text-sm font-medium text-white",
                entranceClass,
              )}
              style={{ backgroundColor: appearance.launcherColor, boxShadow: shadow }}
            >
              {appearance.launcherLabel || widgetName}
            </div>
          )}
          {appearance.launcherType === "icono_texto" && (
            <div
              key={`launcher-${replayKey}`}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white",
                entranceClass,
              )}
              style={{ backgroundColor: appearance.launcherColor, boxShadow: shadow }}
            >
              <LauncherIcon className="size-4" />
              {appearance.launcherLabel || widgetName}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Botón flotante (widget cerrado)
          </p>
        </div>
      </div>

      {appearance.animationsEnabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setReplayKey((key) => key + 1)}
        >
          <RotateCcw className="size-4" /> Reproducir animación
        </Button>
      )}
    </div>
  );
}

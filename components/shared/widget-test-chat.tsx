"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, Send, X } from "lucide-react";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { TestChatResult } from "@/services/widgets/widget-test-chat.service";
import { LAUNCHER_ICON_MAP } from "@/lib/constants/widget-launcher-icons";
import { toFontFamilyStack } from "@/lib/constants/widget-fonts";
import { getReadableTextColor } from "@/lib/constants/widget-contrast";
import { cn } from "@/lib/utils";

interface TestMessage {
  role: "usuario" | "asistente" | "integración";
  content: string;
  failed?: boolean;
}

const SHADOW_STYLES: Record<string, string> = {
  ninguna: "none",
  suave: "0 4px 16px rgba(0,0,0,0.16)",
  pronunciada: "0 20px 40px rgba(0,0,0,0.36)",
};

const SPACING_SCALES: Record<string, { padding: string; gap: string }> = {
  compacto: { padding: "0.5rem", gap: "0.375rem" },
  normal: { padding: "1rem", gap: "0.625rem" },
  amplio: { padding: "1.5rem", gap: "1rem" },
};

const CLOSE_ANIMATION_MS = 200;

/** Revela un texto progresivamente, simulando que se escribe en vivo; se monta una vez por burbuja nueva. */
function TypewriterText({ text }: { text: string }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    let revealed = 0;
    const step = Math.max(1, Math.round(text.length / 60));
    const id = setInterval(() => {
      revealed += step;
      setVisibleCount(Math.min(revealed, text.length));
      if (revealed >= text.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [text]);

  return <>{text.slice(0, visibleCount)}</>;
}

function TypingBubble({ backgroundColor }: { backgroundColor: string }) {
  return (
    <div
      className="flex items-center gap-1 self-start rounded-lg px-3.5 py-3"
      style={{ backgroundColor }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-current opacity-60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

/** Panel de prueba en vivo del widget (sección 11): IA real e integraciones n8n reales, sin persistir nada en sesiones/conversaciones/mensajes/eventos. Se monta una sola vez en el layout del detalle del widget, visible en todas sus pestañas. */
export function WidgetTestChat() {
  const { widget, appearance } = useWidgetDetail();
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!widget) return null;

  const LauncherIcon = appearance
    ? (LAUNCHER_ICON_MAP[appearance.launcherIcon] ?? LAUNCHER_ICON_MAP["message-circle"])
    : LAUNCHER_ICON_MAP["message-circle"];
  const shadow = appearance
    ? (SHADOW_STYLES[appearance.shadowStyle] ?? SHADOW_STYLES.suave)
    : SHADOW_STYLES.suave;
  const spacing = appearance
    ? (SPACING_SCALES[appearance.spacingScale] ?? SPACING_SCALES.normal)
    : SPACING_SCALES.normal;
  const fontFamily = appearance ? toFontFamilyStack(appearance.fontFamily) : undefined;
  const launcherColor = appearance?.launcherColor ?? "#111827";
  const launcherShapeClass =
    appearance?.launcherShape === "cuadrado" ? "rounded-2xl" : "rounded-full";
  const primaryColor = appearance?.primaryColor ?? "#111827";
  const userBubbleColor = appearance?.userBubbleColor ?? "#111827";
  const assistantBubbleColor = appearance?.assistantBubbleColor ?? "#f3f4f6";
  const themeMode = appearance?.themeMode ?? "automático";
  const backgroundColor = appearance?.backgroundColor ?? "#ffffff";
  const bodyTextColor = getReadableTextColor(backgroundColor, themeMode);
  const headerTextColor = getReadableTextColor(primaryColor, themeMode);
  const hasFooter = Boolean(appearance?.footerLinkLabel || appearance?.footerLinkUrl);
  const animationsEnabled = appearance?.animationsEnabled ?? true;
  const entranceClass = animationsEnabled
    ? "animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 fill-mode-backwards"
    : "";
  const exitClass = animationsEnabled
    ? "animate-out fade-out slide-out-to-bottom-2 duration-200"
    : "";

  function openPanel() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsRendered(true);
    setIsOpen(true);
  }

  function closePanel() {
    setIsOpen(false);
    if (animationsEnabled) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsRendered(false);
        closeTimeoutRef.current = null;
      }, CLOSE_ANIMATION_MS);
    } else {
      setIsRendered(false);
    }
  }

  function resetChat() {
    setMessages([]);
    setInput("");
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending || !widget) return;

    const history = messages
      .filter((m) => m.role === "usuario" || m.role === "asistente")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "usuario", content: trimmed }]);
    setInput("");
    setIsSending(true);

    try {
      const { reply } = await apiFetch<{ reply: TestChatResult }>(
        `/api/v1/widgets/${widget.id}/test-chat`,
        {
          method: "POST",
          body: JSON.stringify({ message: trimmed, history }),
        },
      );

      setMessages((prev) => [
        ...prev,
        ...reply.integrationNotes.map((note) => ({
          role: "integración" as const,
          content: note.success
            ? `${note.integrationName}: ${note.content ?? "ejecutada correctamente."}`
            : `${note.integrationName} falló: ${note.errorMessage ?? "error desconocido."}`,
          failed: !note.success,
        })),
        { role: "asistente" as const, content: reply.content },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "asistente",
          content:
            error instanceof ApiClientError
              ? error.message
              : "No se pudo obtener respuesta del asistente.",
          failed: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {isRendered && (
        <div
          key="test-chat-window"
          className={cn(
            "fixed right-6 bottom-24 z-50 flex flex-col overflow-hidden",
            isOpen ? entranceClass : exitClass,
          )}
          style={{
            width: 400,
            height: 600,
            borderRadius: appearance?.borderRadius ?? 16,
            backgroundColor,
            color: bodyTextColor,
            boxShadow: shadow,
            fontFamily,
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ backgroundColor: primaryColor, color: headerTextColor }}
          >
            {widget.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={widget.logoUrl}
                alt=""
                className="size-8 shrink-0 rounded-full bg-white/15 object-cover"
              />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-medium">
                {widget.name.slice(0, 1).toUpperCase() || "W"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium">
                {appearance?.headerTitle || widget.name}
              </p>
              {appearance?.headerSubtitle ? (
                <p className="truncate text-xs opacity-80">
                  {appearance.headerSubtitle}
                </p>
              ) : (
                <p className="truncate text-xs opacity-80">Modo de prueba</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Iniciar chat nuevo"
              onClick={resetChat}
              className="shrink-0 opacity-85 hover:opacity-100"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Cerrar prueba"
              onClick={closePanel}
              className="shrink-0 opacity-85 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="border-b border-black/5 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Estos mensajes no se guardan ni aparecen en Analíticas, Logs o
            Historial.
          </p>

          {!widget.providerConfigId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
              <p>Este widget aún no tiene un proveedor de IA configurado.</p>
              <Link
                href={`/widgets/${widget.id}/proveedor`}
                className="font-medium underline"
              >
                Configúralo en la pestaña Proveedor
              </Link>
            </div>
          ) : (
            <>
              <div
                className="flex flex-1 flex-col overflow-y-auto"
                style={{ padding: spacing.padding, gap: spacing.gap }}
              >
                {messages.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 px-2 text-center">
                    {appearance?.companyName && (
                      <>
                        {widget.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={widget.logoUrl}
                            alt=""
                            className="mb-1 size-16 rounded-full object-cover"
                          />
                        )}
                        <p className="text-[17px] font-bold">
                          {appearance.companyName}
                        </p>
                        {appearance.companyTagline && (
                          <p className="text-sm text-muted-foreground">
                            {appearance.companyTagline}
                          </p>
                        )}
                      </>
                    )}
                    {appearance?.initialMessage && (
                      <div
                        className="mt-3 max-w-[85%] rounded-lg px-3 py-2 text-left text-base leading-normal"
                        style={{ backgroundColor: assistantBubbleColor }}
                      >
                        <TypewriterText text={appearance.initialMessage} />
                      </div>
                    )}
                    {!appearance?.companyName && !appearance?.initialMessage && (
                      <p className="text-sm text-muted-foreground">
                        Envía un mensaje para probar cómo responde este
                        asistente.
                      </p>
                    )}
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-base leading-normal",
                      message.role === "usuario" && "self-end text-white",
                      message.role === "asistente" && "self-start",
                      message.role === "integración" &&
                        "self-start border border-dashed px-2.5 py-1.5 text-xs opacity-85",
                      message.failed &&
                        message.role !== "integración" &&
                        "border border-destructive/50 text-destructive",
                    )}
                    style={
                      message.role === "usuario"
                        ? { backgroundColor: userBubbleColor }
                        : message.role === "asistente" && !message.failed
                          ? { backgroundColor: assistantBubbleColor }
                          : undefined
                    }
                  >
                    {message.role === "asistente" && !message.failed ? (
                      <TypewriterText text={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                ))}
                {isSending && (
                  <TypingBubble backgroundColor={assistantBubbleColor} />
                )}
              </div>

              <form
                className="p-2.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <div className="flex items-end gap-1 rounded-full border border-input py-1 pr-1 pl-4">
                  <textarea
                    rows={1}
                    className="max-h-24 flex-1 resize-none bg-transparent py-1.5 text-base outline-none"
                    placeholder="Escribe un mensaje de prueba..."
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    aria-label="Enviar"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </form>

              {hasFooter && (
                <div
                  className="px-4 pt-2 pb-4 text-center text-[11px]"
                  style={{ color: appearance?.footerLinkColor }}
                >
                  {appearance?.footerLinkUrl ? (
                    <a
                      href={appearance.footerLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-85 hover:underline"
                    >
                      {appearance.footerLinkLabel || appearance.footerLinkUrl}
                    </a>
                  ) : (
                    <span className="opacity-85">{appearance?.footerLinkLabel}</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => (isOpen ? closePanel() : openPanel())}
        aria-label={isOpen ? "Cerrar panel de prueba" : "Probar widget"}
        className={cn(
          "fixed right-6 bottom-6 z-50 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:brightness-110",
          isOpen || !appearance || appearance.launcherType === "icono"
            ? cn("size-12", launcherShapeClass)
            : "h-12 gap-2 rounded-full px-5 text-sm font-medium",
        )}
        style={{ backgroundColor: launcherColor, boxShadow: shadow }}
      >
        {isOpen ? (
          <X className="size-5" />
        ) : appearance?.launcherType === "texto" ? (
          appearance.launcherLabel || widget.name
        ) : appearance?.launcherType === "icono_texto" ? (
          <>
            <LauncherIcon className="size-5" />
            {appearance.launcherLabel || widget.name}
          </>
        ) : (
          <LauncherIcon className="size-5" />
        )}
      </button>
    </>
  );
}

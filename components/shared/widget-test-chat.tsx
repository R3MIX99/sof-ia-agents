"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Send, X } from "lucide-react";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { TestChatResult } from "@/services/widgets/widget-test-chat.service";
import { LAUNCHER_ICON_MAP } from "@/lib/constants/widget-launcher-icons";
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

/** Panel de prueba en vivo del widget (sección 11): IA real e integraciones n8n reales, sin persistir nada en sesiones/conversaciones/mensajes/eventos. Se monta una sola vez en el layout del detalle del widget, visible en todas sus pestañas. */
export function WidgetTestChat() {
  const { widget, appearance } = useWidgetDetail();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!widget) return null;

  const LauncherIcon = appearance
    ? (LAUNCHER_ICON_MAP[appearance.launcherIcon] ?? LAUNCHER_ICON_MAP["message-circle"])
    : LAUNCHER_ICON_MAP["message-circle"];
  const shadow = appearance
    ? (SHADOW_STYLES[appearance.shadowStyle] ?? SHADOW_STYLES.suave)
    : SHADOW_STYLES.suave;
  const launcherColor = appearance?.launcherColor ?? "#111827";
  const launcherShapeClass =
    appearance?.launcherShape === "cuadrado" ? "rounded-2xl" : "rounded-full";
  const primaryColor = appearance?.primaryColor ?? "#111827";
  const userBubbleColor = appearance?.userBubbleColor ?? "#111827";
  const assistantBubbleColor = appearance?.assistantBubbleColor ?? "#f3f4f6";

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
      {isOpen && (
        <div
          className="fixed right-6 bottom-24 z-50 flex w-80 flex-col overflow-hidden"
          style={{
            height: 480,
            borderRadius: appearance?.borderRadius ?? 16,
            backgroundColor: appearance?.backgroundColor ?? "#ffffff",
            color: appearance?.textColor ?? "#111827",
            boxShadow: shadow,
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ backgroundColor: primaryColor, color: "#ffffff" }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Modo de prueba</p>
              <p className="truncate text-xs opacity-80">{widget.name}</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar prueba"
              onClick={() => setIsOpen(false)}
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
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Envía un mensaje para probar cómo responde este asistente.
                  </p>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
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
                    {message.content}
                  </div>
                ))}
                {isSending && (
                  <div className="flex items-center gap-1 self-start px-1 text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                  </div>
                )}
              </div>

              <form
                className="flex items-end gap-2 border-t border-black/5 p-2.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <textarea
                  rows={1}
                  className="max-h-24 flex-1 resize-none rounded-md border border-input bg-transparent px-2.5 py-2 text-sm outline-none"
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
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-white disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="size-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Cerrar panel de prueba" : "Probar widget"}
        className={cn(
          "fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center text-white",
          launcherShapeClass,
        )}
        style={{ backgroundColor: launcherColor, boxShadow: shadow }}
      >
        {isOpen ? <X className="size-6" /> : <LauncherIcon className="size-6" />}
      </button>
    </>
  );
}

import type { Conversation } from "@/domain/entities/conversation.entity";
import type { Message, MessageRole } from "@/domain/entities/message.entity";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ConversationViewerProps {
  conversation: Conversation;
  widgetName: string;
  messages: Message[];
}

const OUTCOME_LABEL: Record<Conversation["outcome"], string> = {
  completada: "Completada",
  abandonada: "Abandonada",
  "con error": "Con error",
};

const OUTCOME_VARIANT: Record<
  Conversation["outcome"],
  "default" | "secondary" | "destructive"
> = {
  completada: "default",
  abandonada: "secondary",
  "con error": "destructive",
};

const ROLE_LABEL: Record<MessageRole, string> = {
  usuario: "Visitante",
  asistente: "Asistente",
  sistema: "Sistema",
  integración: "Integración",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-419", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Visor del hilo completo de una conversación, para la pantalla Historial (sección 9.12). */
export function ConversationViewer({
  conversation,
  widgetName,
  messages,
}: ConversationViewerProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={OUTCOME_VARIANT[conversation.outcome]}>
          {OUTCOME_LABEL[conversation.outcome]}
        </Badge>
        <span className="text-sm text-muted-foreground">{widgetName}</span>
        <span className="text-sm text-muted-foreground">
          {conversation.visitorName ?? "Visitante anónimo"}
        </span>
        {conversation.rating !== null && (
          <Badge variant="outline">Calificación: {conversation.rating}/5</Badge>
        )}
      </div>

      {conversation.feedbackText && (
        <p className="rounded-md border border-border bg-muted/30 p-3 text-sm italic">
          &ldquo;{conversation.feedbackText}&rdquo;
        </p>
      )}

      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[85%] rounded-lg border border-border px-3 py-2 text-sm",
              message.role === "usuario"
                ? "ml-auto bg-primary/10"
                : "bg-muted/40",
              message.role === "sistema" &&
                "border-dashed text-muted-foreground",
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{ROLE_LABEL[message.role]}</span>
              <span>
                {DATE_TIME_FORMATTER.format(new Date(message.createdAt))}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.latencyMs !== null && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {message.latencyMs} ms · {message.tokensInput ?? 0} +{" "}
                {message.tokensOutput ?? 0} tokens
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { History, Search } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Widget } from "@/domain/entities/widget.entity";
import type { Conversation, ConversationOutcome } from "@/domain/entities/conversation.entity";
import type { Message } from "@/domain/entities/message.entity";
import type { ConversationListItem } from "@/domain/repositories-interfaces/conversation-repository.interface";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Drawer } from "@/components/shared/drawer";
import { ConversationViewer } from "@/components/shared/conversation-viewer";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

const OUTCOME_LABEL: Record<ConversationOutcome, string> = {
  completada: "Completada",
  abandonada: "Abandonada",
  "con error": "Con error",
};

const OUTCOME_VARIANT: Record<
  ConversationOutcome,
  "default" | "secondary" | "destructive"
> = {
  completada: "default",
  abandonada: "secondary",
  "con error": "destructive",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-419", {
  dateStyle: "medium",
  timeStyle: "short",
});

const PAGE_SIZE = 20;

interface ConversationDetail {
  conversation: Conversation;
  widgetName: string;
  messages: Message[];
}

export default function HistorialPage() {
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [widgetFilter, setWidgetFilter] = useState<string>("todos");
  const [outcomeFilter, setOutcomeFilter] = useState<ConversationOutcome | "todos">(
    "todos",
  );
  const [visitorNameInput, setVisitorNameInput] = useState("");
  const [visitorNameFilter, setVisitorNameFilter] = useState("");
  const [page, setPage] = useState(1);

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (!activeOrganization) return;
    apiFetch<{ widgets: Widget[] }>(
      `/api/v1/widgets?organizationId=${activeOrganization.id}`,
    ).then(({ widgets: loaded }) => setWidgets(loaded));
  }, [activeOrganization]);

  useEffect(() => {
    if (!activeOrganization) return;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      organizationId: activeOrganization.id,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (widgetFilter !== "todos") params.set("widgetId", widgetFilter);
    if (outcomeFilter !== "todos") params.set("outcome", outcomeFilter);
    if (visitorNameFilter) params.set("visitorName", visitorNameFilter);

    apiFetch<{
      conversations: ConversationListItem[];
      total: number;
    }>(`/api/v1/conversations?${params.toString()}`)
      .then(({ conversations: loaded, total: loadedTotal }) => {
        setConversations(loaded);
        setTotal(loadedTotal);
      })
      .catch((err) => {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "No se pudo cargar el historial de conversaciones.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [activeOrganization, widgetFilter, outcomeFilter, visitorNameFilter, page]);

  useEffect(() => {
    if (!selectedConversationId) {
      setDetail(null);
      return;
    }
    setIsLoadingDetail(true);
    apiFetch<ConversationDetail>(
      `/api/v1/conversations/${selectedConversationId}`,
    )
      .then(setDetail)
      .finally(() => setIsLoadingDetail(false));
  }, [selectedConversationId]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setVisitorNameFilter(visitorNameInput.trim());
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Historial"
        description="Crea o selecciona una organización para ver su historial de conversaciones."
        icon={History}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Historial</h1>
        <p className="text-sm text-muted-foreground">
          Consulta el historial completo de conversaciones de tus widgets.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearchSubmit} className="space-y-1.5">
          <Label htmlFor="historial-search">Nombre del visitante</Label>
          <div className="relative w-56">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="historial-search"
              placeholder="Buscar por nombre..."
              className="pl-8"
              value={visitorNameInput}
              onChange={(event) => setVisitorNameInput(event.target.value)}
            />
          </div>
        </form>
        <div className="space-y-1.5">
          <Label>Widget</Label>
          <Select
            value={widgetFilter}
            onValueChange={(value) => {
              setPage(1);
              setWidgetFilter(value);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los widgets</SelectItem>
              {widgets.map((widget) => (
                <SelectItem key={widget.id} value={widget.id}>
                  {widget.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Resultado</Label>
          <Select
            value={outcomeFilter}
            onValueChange={(value) => {
              setPage(1);
              setOutcomeFilter(value as ConversationOutcome | "todos");
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.entries(OUTCOME_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Cargando conversaciones...</p>
      )}

      {!isLoading && conversations.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No se encontraron conversaciones con esos filtros.
        </p>
      )}

      {!isLoading && conversations.length > 0 && (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitante</TableHead>
                    <TableHead>Widget</TableHead>
                    <TableHead>Iniciada</TableHead>
                    <TableHead>Mensajes</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow
                      key={conversation.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedConversationId(conversation.id)}
                    >
                      <TableCell>
                        {conversation.visitorName ?? "Visitante anónimo"}
                      </TableCell>
                      <TableCell>{conversation.widgetName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {DATE_TIME_FORMATTER.format(
                          new Date(conversation.startedAt),
                        )}
                      </TableCell>
                      <TableCell>{conversation.messageCount}</TableCell>
                      <TableCell>
                        <Badge variant={OUTCOME_VARIANT[conversation.outcome]}>
                          {OUTCOME_LABEL[conversation.outcome]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages} · {total} conversaciones
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}

      <Drawer
        open={selectedConversationId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedConversationId(null);
        }}
        title="Conversación"
        description="Hilo completo de mensajes de la conversación."
      >
        {isLoadingDetail && (
          <p className="text-sm text-muted-foreground">Cargando conversación...</p>
        )}
        {!isLoadingDetail && detail && (
          <ConversationViewer
            conversation={detail.conversation}
            widgetName={detail.widgetName}
            messages={detail.messages}
          />
        )}
      </Drawer>
    </div>
  );
}

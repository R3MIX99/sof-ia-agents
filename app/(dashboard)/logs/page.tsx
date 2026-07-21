"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Widget } from "@/domain/entities/widget.entity";
import type {
  EventSeverity,
  EventSource,
  SystemEvent,
} from "@/domain/entities/system-event.entity";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

const SEVERITY_LABEL: Record<EventSeverity, string> = {
  información: "Información",
  advertencia: "Advertencia",
  error: "Error",
  crítico: "Crítico",
};

const SEVERITY_VARIANT: Record<
  EventSeverity,
  "outline" | "secondary" | "destructive"
> = {
  información: "secondary",
  advertencia: "outline",
  error: "destructive",
  crítico: "destructive",
};

const SOURCE_LABEL: Record<EventSource, string> = {
  widget: "Widget",
  proveedor: "Proveedor de IA",
  "integración n8n": "Integración n8n",
  sistema: "Sistema",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-419", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function LogsPage() {
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [widgetFilter, setWidgetFilter] = useState<string>("todos");
  const [severityFilter, setSeverityFilter] = useState<EventSeverity | "todas">(
    "todas",
  );
  const [sourceFilter, setSourceFilter] = useState<EventSource | "todas">(
    "todas",
  );

  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    });
    if (widgetFilter !== "todos") params.set("widgetId", widgetFilter);
    if (severityFilter !== "todas") params.set("severity", severityFilter);
    if (sourceFilter !== "todas") params.set("source", sourceFilter);

    apiFetch<{ events: SystemEvent[] }>(`/api/v1/logs?${params.toString()}`)
      .then(({ events: loaded }) => setEvents(loaded))
      .catch((err) => {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "No se pudieron cargar los eventos.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [activeOrganization, widgetFilter, severityFilter, sourceFilter]);

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Logs"
        description="Crea o selecciona una organización para ver su registro de eventos."
        icon={ScrollText}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Registro técnico de eventos del sistema: publicaciones de widgets,
          fallos de integraciones y errores de proveedores de IA.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Widget</Label>
          <Select value={widgetFilter} onValueChange={setWidgetFilter}>
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
          <Label>Severidad</Label>
          <Select
            value={severityFilter}
            onValueChange={(value) =>
              setSeverityFilter(value as EventSeverity | "todas")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {Object.entries(SEVERITY_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Origen</Label>
          <Select
            value={sourceFilter}
            onValueChange={(value) =>
              setSourceFilter(value as EventSource | "todas")
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos</SelectItem>
              {Object.entries(SOURCE_LABEL).map(([value, label]) => (
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
        <p className="text-sm text-muted-foreground">Cargando eventos...</p>
      )}

      {!isLoading && events.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay eventos registrados con esos filtros.
        </p>
      )}

      {!isLoading && events.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Widget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap">
                      {DATE_TIME_FORMATTER.format(new Date(event.createdAt))}
                    </TableCell>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>
                      <Badge variant={SEVERITY_VARIANT[event.severity]}>
                        {SEVERITY_LABEL[event.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell>{SOURCE_LABEL[event.source]}</TableCell>
                    <TableCell>
                      {widgets.find((w) => w.id === event.widgetId)?.name ??
                        "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type {
  N8nIntegration,
} from "@/domain/entities/n8n-integration.entity";
import type {
  WidgetIntegration,
  WidgetIntegrationTriggerPoint,
} from "@/domain/entities/widget-integration.entity";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

interface AssociatedIntegration extends WidgetIntegration {
  integration: N8nIntegration | null;
}

const TRIGGER_POINT_OPTIONS: {
  value: WidgetIntegrationTriggerPoint;
  label: string;
}[] = [
  { value: "antes_ia", label: "Antes del proveedor de IA" },
  { value: "después_ia", label: "Después del proveedor de IA" },
  { value: "independiente", label: "Acción independiente" },
];

export default function WidgetIntegracionesPage() {
  const { widget } = useWidgetDetail();

  const [available, setAvailable] = useState<N8nIntegration[]>([]);
  const [associated, setAssociated] = useState<AssociatedIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssociating, setIsAssociating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadData(organizationId: string, widgetId: string) {
    setIsLoading(true);
    try {
      const [{ integrations }, { widgetIntegrations }] = await Promise.all([
        apiFetch<{ integrations: N8nIntegration[] }>(
          `/api/v1/integrations?organizationId=${organizationId}`,
        ),
        apiFetch<{ widgetIntegrations: AssociatedIntegration[] }>(
          `/api/v1/widgets/${widgetId}/integrations`,
        ),
      ]);
      setAvailable(integrations);
      setAssociated(widgetIntegrations);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (widget) void loadData(widget.organizationId, widget.id);
  }, [widget]);

  async function handleAssociate(integrationId: string) {
    if (!widget) return;
    setIsAssociating(true);
    try {
      await apiFetch(`/api/v1/widgets/${widget.id}/integrations`, {
        method: "POST",
        body: JSON.stringify({
          integrationId,
          triggerPoint: "después_ia",
          executionOrder: associated.length,
        }),
      });
      await loadData(widget.organizationId, widget.id);
      toast.success("Integración asociada.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo asociar la integración.",
      );
    } finally {
      setIsAssociating(false);
    }
  }

  async function handleUpdate(
    widgetIntegrationId: string,
    patch: Partial<{
      triggerPoint: WidgetIntegrationTriggerPoint;
      executionOrder: number;
    }>,
  ) {
    if (!widget) return;
    setSavingId(widgetIntegrationId);
    try {
      await apiFetch(
        `/api/v1/widgets/${widget.id}/integrations/${widgetIntegrationId}`,
        { method: "PATCH", body: JSON.stringify(patch) },
      );
      await loadData(widget.organizationId, widget.id);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo actualizar la asociación.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemove(widgetIntegrationId: string) {
    if (!widget) return;
    setSavingId(widgetIntegrationId);
    try {
      await apiFetch(
        `/api/v1/widgets/${widget.id}/integrations/${widgetIntegrationId}`,
        { method: "DELETE" },
      );
      await loadData(widget.organizationId, widget.id);
      toast.success("Integración desasociada.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo desasociar la integración.",
      );
    } finally {
      setSavingId(null);
    }
  }

  if (!widget || isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando integraciones...</p>
    );
  }

  const associatedIds = new Set(associated.map((item) => item.integrationId));
  const unassociated = available.filter((i) => !associatedIds.has(i.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Integraciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Asocia integraciones de n8n a este widget y define en qué punto del
          flujo conversacional se ejecutan.
        </p>
      </div>

      {associated.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este widget no tiene integraciones asociadas todavía.
        </p>
      ) : (
        <div className="space-y-3">
          {associated.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="min-w-0">
                  <CardTitle className="truncate">
                    {item.integration?.name ?? "Integración eliminada"}
                  </CardTitle>
                  {item.integration && (
                    <CardDescription className="truncate font-mono text-xs">
                      {item.integration.webhookUrl}
                    </CardDescription>
                  )}
                </div>
                {item.integration && (
                  <Badge
                    variant={
                      item.integration.status === "activa"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {item.integration.status === "activa"
                      ? "Activa"
                      : "Deshabilitada"}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label>Punto de disparo</Label>
                  <Select
                    value={item.triggerPoint}
                    onValueChange={(value) =>
                      handleUpdate(item.id, {
                        triggerPoint: value as WidgetIntegrationTriggerPoint,
                      })
                    }
                    disabled={savingId === item.id}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_POINT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`order-${item.id}`}>
                    Orden de ejecución
                  </Label>
                  <Input
                    id={`order-${item.id}`}
                    type="number"
                    className="w-24"
                    value={item.executionOrder}
                    disabled={savingId === item.id}
                    onChange={(event) =>
                      handleUpdate(item.id, {
                        executionOrder: Number(event.target.value),
                      })
                    }
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(item.id)}
                  disabled={savingId === item.id}
                >
                  {savingId === item.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Quitar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">
          Integraciones disponibles
        </h2>
        {available.length === 0 ? (
          <PlaceholderScreen
            title="No hay integraciones configuradas"
            description="Crea una integración en la sección Integraciones n8n para poder asociarla a este widget."
            icon={Plus}
          />
        ) : unassociated.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todas las integraciones disponibles ya están asociadas a este
            widget.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {unassociated.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="truncate">
                      {integration.name}
                    </CardTitle>
                    <CardDescription className="truncate font-mono text-xs">
                      {integration.webhookUrl}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssociate(integration.id)}
                    disabled={isAssociating}
                  >
                    <Plus className="size-4" /> Asociar
                  </Button>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

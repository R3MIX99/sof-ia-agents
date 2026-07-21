"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { WidgetDomain } from "@/domain/entities/widget-domain.entity";
import type { WidgetSchedule } from "@/domain/entities/widget-schedule.entity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function WidgetDominiosPage() {
  const { widget, domains, schedules, refresh } = useWidgetDetail();

  const [domain, setDomain] = useState("");
  const [isWildcard, setIsWildcard] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [outOfScheduleBehavior, setOutOfScheduleBehavior] = useState<
    WidgetSchedule["outOfScheduleBehavior"]
  >("ocultar widget");
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  async function handleAddDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!widget) return;
    setIsAddingDomain(true);
    try {
      await apiFetch<{ domain: WidgetDomain }>(
        `/api/v1/widgets/${widget.id}/domains`,
        {
          method: "POST",
          body: JSON.stringify({ domain, isWildcard }),
        },
      );
      setDomain("");
      setIsWildcard(false);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo agregar el dominio.",
      );
    } finally {
      setIsAddingDomain(false);
    }
  }

  async function handleRemoveDomain(id: string) {
    if (!widget) return;
    try {
      await apiFetch(`/api/v1/widgets/${widget.id}/domains/${id}`, {
        method: "DELETE",
      });
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo eliminar el dominio.",
      );
    }
  }

  async function handleAddSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!widget) return;
    setIsAddingSchedule(true);
    try {
      await apiFetch<{ schedule: WidgetSchedule }>(
        `/api/v1/widgets/${widget.id}/schedules`,
        {
          method: "POST",
          body: JSON.stringify({
            dayOfWeek: Number(dayOfWeek),
            startTime,
            endTime,
            timezone,
            outOfScheduleBehavior,
          }),
        },
      );
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo agregar el horario.",
      );
    } finally {
      setIsAddingSchedule(false);
    }
  }

  async function handleRemoveSchedule(id: string) {
    if (!widget) return;
    try {
      await apiFetch(`/api/v1/widgets/${widget.id}/schedules/${id}`, {
        method: "DELETE",
      });
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo eliminar el horario.",
      );
    }
  }

  if (!widget) {
    return (
      <p className="text-sm text-muted-foreground">Cargando widget...</p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dominios permitidos</CardTitle>
          <CardDescription>
            El widget solo se cargará en los dominios listados aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {domains.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin restricción configurada todavía.
              </p>
            )}
            {domains.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.domain}</span>
                  {item.isWildcard && (
                    <Badge variant="outline">Incluye subdominios</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveDomain(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddDomain} className="space-y-3 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="domain">Dominio</Label>
              <Input
                id="domain"
                required
                placeholder="ejemplo.com"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="wildcard" className="text-sm font-normal">
                Incluir subdominios
              </Label>
              <Switch
                id="wildcard"
                checked={isWildcard}
                onCheckedChange={setIsWildcard}
              />
            </div>
            <Button type="submit" size="sm" disabled={isAddingDomain}>
              {isAddingDomain && <Loader2 className="size-4 animate-spin" />}
              Agregar dominio
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horarios de disponibilidad</CardTitle>
          <CardDescription>
            Define cuándo estará activo el widget. Sin horarios configurados,
            el widget está disponible en todo momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {schedules.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin horarios configurados todavía.
              </p>
            )}
            {schedules.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    {DAY_LABELS[item.dayOfWeek]} — {item.startTime.slice(0, 5)} a{" "}
                    {item.endTime.slice(0, 5)} ({item.timezone})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fuera de horario: {item.outOfScheduleBehavior}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveSchedule(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <form
            onSubmit={handleAddSchedule}
            className="space-y-3 border-t border-border pt-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Día</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((label, index) => (
                      <SelectItem key={label} value={String(index)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zona horaria</Label>
                <Input
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start-time">Hora de inicio</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time">Hora de fin</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Comportamiento fuera de horario</Label>
              <Select
                value={outOfScheduleBehavior}
                onValueChange={(value) =>
                  setOutOfScheduleBehavior(
                    value as WidgetSchedule["outOfScheduleBehavior"],
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ocultar widget">
                    Ocultar widget
                  </SelectItem>
                  <SelectItem value="mostrar mensaje de no disponibilidad">
                    Mostrar mensaje de no disponibilidad
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="sm" disabled={isAddingSchedule}>
              {isAddingSchedule && <Loader2 className="size-4 animate-spin" />}
              Agregar horario
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

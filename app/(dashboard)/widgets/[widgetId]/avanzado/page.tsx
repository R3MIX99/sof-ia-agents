"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type {
  Widget,
  WidgetInactivityBehavior,
} from "@/domain/entities/widget.entity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

export default function WidgetAvanzadoPage() {
  const { widget, refresh } = useWidgetDetail();
  const [persistConversation, setPersistConversation] = useState(true);
  const [maxMessages, setMaxMessages] = useState("");
  const [inactivityBehavior, setInactivityBehavior] =
    useState<WidgetInactivityBehavior>("sin acción");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (widget) {
      setPersistConversation(widget.persistConversationAcrossSessions);
      setMaxMessages(
        widget.maxMessagesPerSession != null
          ? String(widget.maxMessagesPerSession)
          : "",
      );
      setInactivityBehavior(widget.inactivityBehavior);
      setIsDirty(false);
    }
  }, [widget]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!widget) return;
    setIsSaving(true);
    try {
      await apiFetch<{ widget: Widget }>(`/api/v1/widgets/${widget.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          persistConversationAcrossSessions: persistConversation,
          maxMessagesPerSession: maxMessages ? Number(maxMessages) : null,
          inactivityBehavior,
        }),
      });
      setIsDirty(false);
      await refresh();
      toast.success("Configuración avanzada guardada.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo guardar la configuración.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!widget) {
    return (
      <p className="text-sm text-muted-foreground">Cargando widget...</p>
    );
  }

  return (
    <Card className="max-w-xl">
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader>
          <CardTitle>Configuración avanzada</CardTitle>
          <CardDescription>
            Parámetros de comportamiento no cubiertos por las demás
            secciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">
                Persistir conversación entre sesiones
              </p>
              <p className="text-xs text-muted-foreground">
                El visitante conserva su conversación al volver al sitio.
              </p>
            </div>
            <Switch
              checked={persistConversation}
              onCheckedChange={(checked) => {
                setPersistConversation(checked);
                setIsDirty(true);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-messages">
              Límite de mensajes por sesión
            </Label>
            <Input
              id="max-messages"
              type="number"
              min={0}
              placeholder="Sin límite"
              value={maxMessages}
              onChange={(event) => {
                setMaxMessages(event.target.value);
                setIsDirty(true);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Comportamiento ante inactividad prolongada</Label>
            <Select
              value={inactivityBehavior}
              onValueChange={(value) => {
                setInactivityBehavior(value as WidgetInactivityBehavior);
                setIsDirty(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sin acción">Sin acción</SelectItem>
                <SelectItem value="cerrar sesión automáticamente">
                  Cerrar sesión automáticamente
                </SelectItem>
                <SelectItem value="mostrar mensaje de inactividad">
                  Mostrar mensaje de inactividad
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!isDirty || isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Widget, WidgetStatus } from "@/domain/entities/widget.entity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<WidgetStatus, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  pausado: "Pausado",
  archivado: "Archivado",
};

const STATUS_VARIANT: Record<
  WidgetStatus,
  "outline" | "secondary" | "destructive"
> = {
  borrador: "outline",
  publicado: "secondary",
  pausado: "outline",
  archivado: "destructive",
};

export function WidgetDetailHeader() {
  const router = useRouter();
  const { widget, refresh } = useWidgetDetail();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!widget) return null;

  async function changeStatus(status: WidgetStatus) {
    if (!widget) return;
    setIsTransitioning(true);
    try {
      await apiFetch<{ widget: Widget }>(`/api/v1/widgets/${widget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo cambiar el estado del widget.",
      );
    } finally {
      setIsTransitioning(false);
    }
  }

  async function handleDuplicate() {
    if (!widget) return;
    setIsDuplicating(true);
    try {
      const { widget: copy } = await apiFetch<{ widget: Widget }>(
        `/api/v1/widgets/${widget.id}/duplicate`,
        { method: "POST" },
      );
      toast.success("Widget duplicado.");
      router.push(`/widgets/${copy.id}/general`);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo duplicar el widget.",
      );
    } finally {
      setIsDuplicating(false);
    }
  }

  async function handleDelete() {
    if (!widget) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/v1/widgets/${widget.id}`, { method: "DELETE" });
      router.push("/widgets");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo eliminar el widget.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/widgets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a Widgets
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">
            {widget.name}
          </h1>
          <Badge variant={STATUS_VARIANT[widget.status]}>
            {STATUS_LABEL[widget.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {widget.status !== "publicado" && widget.status !== "archivado" && (
            <Button
              size="sm"
              disabled={isTransitioning}
              onClick={() => changeStatus("publicado")}
            >
              {isTransitioning && <Loader2 className="size-4 animate-spin" />}
              Publicar
            </Button>
          )}
          {widget.status === "publicado" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isTransitioning}
              onClick={() => changeStatus("pausado")}
            >
              Pausar
            </Button>
          )}
          {widget.status !== "borrador" && widget.status !== "archivado" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isTransitioning}
              onClick={() => changeStatus("borrador")}
            >
              Despublicar
            </Button>
          )}
          {widget.status !== "archivado" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isTransitioning}
              onClick={() => changeStatus("archivado")}
            >
              Archivar
            </Button>
          )}
          {widget.status === "archivado" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isTransitioning}
              onClick={() => changeStatus("borrador")}
            >
              Restaurar a borrador
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={isDuplicating}
            onClick={handleDuplicate}
          >
            <Copy className="size-4" /> Duplicar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" /> Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

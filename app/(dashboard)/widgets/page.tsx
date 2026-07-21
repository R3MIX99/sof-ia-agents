"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutGrid, Loader2, MoreHorizontal, Plus, Search } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Widget, WidgetStatus } from "@/domain/entities/widget.entity";
import type { ProviderConfig } from "@/domain/entities/provider-config.entity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal } from "@/components/shared/modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

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

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

export default function WidgetsPage() {
  const router = useRouter();
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WidgetStatus | "todos">(
    "todos",
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadData(organizationId: string) {
    setIsLoading(true);
    try {
      const [widgetsData, providersData] = await Promise.all([
        apiFetch<{ widgets: Widget[] }>(
          `/api/v1/widgets?organizationId=${organizationId}`,
        ),
        apiFetch<{ providers: ProviderConfig[] }>(
          `/api/v1/providers?organizationId=${organizationId}`,
        ),
      ]);
      setWidgets(widgetsData.widgets);
      setProviderConfigs(providersData.providers);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) void loadData(activeOrganization.id);
  }, [activeOrganization]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization) return;
    setCreateError(null);
    setIsCreating(true);
    try {
      const { widget } = await apiFetch<{ widget: Widget }>(
        "/api/v1/widgets",
        {
          method: "POST",
          body: JSON.stringify({
            organizationId: activeOrganization.id,
            name: newName,
            description: newDescription || undefined,
          }),
        },
      );
      setIsCreateOpen(false);
      setNewName("");
      setNewDescription("");
      router.push(`/widgets/${widget.id}/general`);
    } catch (error) {
      setCreateError(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo crear el widget.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDuplicate(widgetId: string) {
    if (!activeOrganization) return;
    try {
      await apiFetch(`/api/v1/widgets/${widgetId}/duplicate`, {
        method: "POST",
      });
      toast.success("Widget duplicado.");
      await loadData(activeOrganization.id);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo duplicar el widget.",
      );
    }
  }

  async function handleArchive(widgetId: string) {
    if (!activeOrganization) return;
    try {
      await apiFetch(`/api/v1/widgets/${widgetId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archivado" }),
      });
      await loadData(activeOrganization.id);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo archivar el widget.",
      );
    }
  }

  async function handleDelete(widgetId: string) {
    if (!activeOrganization) return;
    try {
      await apiFetch(`/api/v1/widgets/${widgetId}`, { method: "DELETE" });
      await loadData(activeOrganization.id);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo eliminar el widget.",
      );
    }
  }

  const filteredWidgets = useMemo(() => {
    return widgets.filter((widget) => {
      const matchesSearch = widget.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "todos" || widget.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [widgets, search, statusFilter]);

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Widgets"
        description="Crea o selecciona una organización para administrar sus widgets."
        icon={LayoutGrid}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Widgets</h1>
          <p className="text-sm text-muted-foreground">
            Administra el ciclo de vida completo de los widgets de tu
            organización.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" /> Crear widget
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar widgets..."
            className="pl-8"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as WidgetStatus | "todos")
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="publicado">Publicado</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="archivado">Archivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Cargando widgets...</p>
      )}

      {!isLoading && widgets.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no hay widgets creados.
        </p>
      )}

      {!isLoading && widgets.length > 0 && filteredWidgets.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No se encontraron widgets con esos filtros.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWidgets.map((widget) => {
          const providerConfig = providerConfigs.find(
            (config) => config.id === widget.providerConfigId,
          );
          return (
            <Card
              key={widget.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/widgets/${widget.id}/general`)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  router.push(`/widgets/${widget.id}/general`);
                }
              }}
              className="cursor-pointer transition-colors hover:bg-accent/40"
            >
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="min-w-0">
                  <CardTitle className="truncate">{widget.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DropdownMenuItem asChild>
                      <Link href={`/widgets/${widget.id}/general`}>
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleDuplicate(widget.id)}>
                      Duplicar
                    </DropdownMenuItem>
                    {widget.status !== "archivado" && (
                      <DropdownMenuItem onSelect={() => handleArchive(widget.id)}>
                        Archivar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => handleDelete(widget.id)}
                    >
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={STATUS_VARIANT[widget.status]}>
                    {STATUS_LABEL[widget.status]}
                  </Badge>
                  {providerConfig && (
                    <Badge variant="outline">
                      {PROVIDER_LABELS[providerConfig.provider] ??
                        providerConfig.provider}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Actualizado el{" "}
                  {new Intl.DateTimeFormat("es-419", {
                    dateStyle: "medium",
                  }).format(new Date(widget.updatedAt))}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Crear widget"
        description="Podrás personalizarlo completamente después de crearlo."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="widget-create-name">Nombre</Label>
            <Input
              id="widget-create-name"
              required
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="widget-create-description">
              Descripción (opcional)
            </Label>
            <Input
              id="widget-create-description"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
            />
          </div>
          {createError && (
            <p className="text-sm text-destructive">{createError}</p>
          )}
          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating && <Loader2 className="size-4 animate-spin" />}
            Crear widget
          </Button>
        </form>
      </Modal>
    </div>
  );
}

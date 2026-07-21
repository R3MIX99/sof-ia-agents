"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Widget } from "@/domain/entities/widget.entity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SnippetGenerator } from "@/components/shared/snippet-generator";

export default function WidgetGeneralPage() {
  const { widget, refresh } = useWidgetDetail();
  const { isAdmin } = useRolePermissions(widget?.organizationId ?? null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (widget) {
      setName(widget.name);
      setDescription(widget.description ?? "");
      setLanguage(widget.language);
      setLogoUrl(widget.logoUrl ?? "");
      setAvatarUrl(widget.avatarUrl ?? "");
      setIsDirty(false);
    }
  }, [widget]);

  function markDirty() {
    setIsDirty(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!widget) return;
    setIsSaving(true);
    try {
      await apiFetch<{ widget: Widget }>(`/api/v1/widgets/${widget.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          description,
          language,
          logoUrl: logoUrl || null,
          avatarUrl: avatarUrl || null,
        }),
      });
      setIsDirty(false);
      await refresh();
      toast.success("Cambios guardados.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo guardar el widget.",
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
    <div className="max-w-2xl space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="contents">
          <CardHeader>
            <CardTitle>Identificación y estado</CardTitle>
            <CardDescription>
              Datos básicos que identifican a este widget dentro de la
              organización.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="widget-name">Nombre</Label>
              <Input
                id="widget-name"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  markDirty();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="widget-description">Descripción</Label>
              <Textarea
                id="widget-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  markDirty();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="widget-language">Idioma de la interfaz</Label>
              <Input
                id="widget-language"
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  markDirty();
                }}
                placeholder="es-419"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="widget-logo">URL del logo</Label>
                <Input
                  id="widget-logo"
                  value={logoUrl}
                  onChange={(event) => {
                    setLogoUrl(event.target.value);
                    markDirty();
                  }}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="widget-avatar">
                  URL del avatar del asistente
                </Label>
                <Input
                  id="widget-avatar"
                  value={avatarUrl}
                  onChange={(event) => {
                    setAvatarUrl(event.target.value);
                    markDirty();
                  }}
                  placeholder="https://…"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={!isDirty || isSaving}>
              Guardar cambios
            </Button>
          </CardFooter>
        </form>
      </Card>

      <SnippetGenerator
        widgetId={widget.id}
        widgetPublished={widget.status === "publicado"}
        canManage={isAdmin}
      />
    </div>
  );
}

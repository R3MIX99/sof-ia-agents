"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Organization } from "@/domain/entities/organization.entity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default function ConfiguracionPage() {
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();
  const { isAdmin } = useRolePermissions(activeOrganization?.id ?? null);

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      setName(activeOrganization.name);
      setTimezone(activeOrganization.timezone);
      setDefaultLanguage(activeOrganization.defaultLanguage);
      setIsDirty(false);
    }
  }, [activeOrganization]);

  function handleNameChange(value: string) {
    setName(value);
    setIsDirty(true);
    setSaved(false);
  }

  function handleTimezoneChange(value: string) {
    setTimezone(value);
    setIsDirty(true);
    setSaved(false);
  }

  function handleLanguageChange(value: string) {
    setDefaultLanguage(value);
    setIsDirty(true);
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization) return;
    setError(null);
    setIsSaving(true);

    try {
      await apiFetch<{ organization: Organization }>(
        `/api/v1/organizations/${activeOrganization.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name, timezone, defaultLanguage }),
        },
      );
      setIsDirty(false);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Configuración"
        description="Crea o selecciona una organización para administrar su configuración."
        icon={Settings}
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Administra los parámetros generales de la organización.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="contents">
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
            <CardDescription>
              Estos datos aplican a toda la organización y a los widgets que
              crees en ella.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Nombre de la organización</Label>
              <Input
                id="org-name"
                required
                disabled={!isAdmin}
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-timezone">Zona horaria</Label>
              <Input
                id="org-timezone"
                required
                disabled={!isAdmin}
                value={timezone}
                onChange={(event) => handleTimezoneChange(event.target.value)}
                placeholder="America/Mexico_City"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-language">Idioma por defecto</Label>
              <Input
                id="org-language"
                required
                disabled={!isAdmin}
                value={defaultLanguage}
                onChange={(event) => handleLanguageChange(event.target.value)}
                placeholder="es-419"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          {isAdmin && (
            <CardFooter className="justify-between">
              <span className="text-sm text-muted-foreground">
                {saved
                  ? "Cambios guardados."
                  : isDirty
                    ? "Tienes cambios sin guardar."
                    : ""}
              </span>
              <Button type="submit" disabled={!isDirty || isSaving}>
                Guardar cambios
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Notificaciones administrativas</CardTitle>
            <CardDescription>
              Preferencias de notificación para eventos relevantes de la
              organización.
            </CardDescription>
          </div>
          <Badge variant="outline">Próximamente</Badge>
        </CardHeader>
      </Card>
    </div>
  );
}

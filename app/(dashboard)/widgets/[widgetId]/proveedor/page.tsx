"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Widget } from "@/domain/entities/widget.entity";
import type { ProviderConfig } from "@/domain/entities/provider-config.entity";
import type { AIProviderName } from "@/providers/ai/interfaces/ai-provider.interface";
import { ProviderSelector } from "@/components/shared/provider-selector";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function WidgetProveedorPage() {
  const { widget, refresh } = useWidgetDetail();
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    if (!widget) return;
    setIsLoading(true);
    apiFetch<{ providers: ProviderConfig[] }>(
      `/api/v1/providers?organizationId=${widget.organizationId}`,
    )
      .then((data) => {
        setConfigs(data.providers);
        setSelectedId(
          widget.providerConfigId ?? data.providers[0]?.id ?? "",
        );
      })
      .finally(() => setIsLoading(false));
  }, [widget]);

  useEffect(() => {
    setSystemPrompt(widget?.systemPrompt ?? "");
  }, [widget]);

  async function handleSaveSystemPrompt() {
    if (!widget) return;
    setIsSavingPrompt(true);
    try {
      await apiFetch<{ widget: Widget }>(`/api/v1/widgets/${widget.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          systemPrompt: systemPrompt.trim() === "" ? null : systemPrompt,
        }),
      });
      await refresh();
      toast.success("Instrucciones del asistente guardadas.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudieron guardar las instrucciones.",
      );
    } finally {
      setIsSavingPrompt(false);
    }
  }

  const selectedConfig = configs.find((config) => config.id === selectedId);
  const availableProviders = useMemo(
    () =>
      Array.from(new Set(configs.map((config) => config.provider))) as AIProviderName[],
    [configs],
  );
  const modelsForProvider = useMemo(
    () =>
      configs
        .filter((config) => config.provider === selectedConfig?.provider)
        .map((config) => config.model),
    [configs, selectedConfig],
  );

  function handleProviderChange(provider: AIProviderName) {
    const firstMatch = configs.find((config) => config.provider === provider);
    setSelectedId(firstMatch?.id ?? "");
  }

  function handleModelChange(model: string) {
    const match = configs.find(
      (config) =>
        config.provider === selectedConfig?.provider && config.model === model,
    );
    if (match) setSelectedId(match.id);
  }

  async function handleSave() {
    if (!widget) return;
    setIsSaving(true);
    try {
      await apiFetch<{ widget: Widget }>(`/api/v1/widgets/${widget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ providerConfigId: selectedId || null }),
      });
      await refresh();
      toast.success("Proveedor asociado al widget.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo asociar el proveedor.",
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
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proveedor de inteligencia artificial</CardTitle>
          <CardDescription>
            Selecciona la configuración de proveedor que utilizará este
            widget. Se requiere una configuración con credenciales válidas
            para poder publicarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Cargando proveedores...
            </p>
          ) : configs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay proveedores configurados en esta organización.{" "}
              <Link href="/proveedores-ia" className="font-medium underline">
                Configura uno en Proveedores IA
              </Link>
              .
            </p>
          ) : (
            <ProviderSelector
              provider={selectedConfig?.provider ?? availableProviders[0]}
              onProviderChange={handleProviderChange}
              availableProviders={availableProviders}
              model={selectedConfig?.model ?? ""}
              onModelChange={handleModelChange}
              availableModels={modelsForProvider}
              validationStatus={selectedConfig?.validationStatus}
            />
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones del asistente (system prompt)</CardTitle>
          <CardDescription>
            Define cómo debe comportarse la inteligencia artificial de este
            widget: su tono, su rol y las reglas que debe seguir. Estas
            instrucciones son exclusivas de este widget; otros widgets que
            usen el mismo proveedor no las comparten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="widget-system-prompt">Instrucciones</Label>
            <Textarea
              id="widget-system-prompt"
              rows={8}
              placeholder="Eres el asistente virtual de... Tu tono debe ser... Nunca debes..."
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSaveSystemPrompt} disabled={isSavingPrompt}>
            {isSavingPrompt && <Loader2 className="size-4 animate-spin" />}
            Guardar instrucciones
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

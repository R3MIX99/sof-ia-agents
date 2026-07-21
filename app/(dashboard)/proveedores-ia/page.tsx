"use client";

import { useEffect, useState } from "react";
import { Bot, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/shared/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

const PROVIDERS: AIProviderName[] = ["openai", "anthropic"];
const PROVIDER_LABELS: Record<AIProviderName, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

interface ConsumptionByConfig {
  providerConfigId: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
}

export default function ProveedoresIaPage() {
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();
  const { isAdmin } = useRolePermissions(activeOrganization?.id ?? null);

  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [consumption, setConsumption] = useState<ConsumptionByConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalProvider, setModalProvider] = useState<AIProviderName | null>(
    null,
  );
  const [editingConfig, setEditingConfig] = useState<ProviderConfig | null>(
    null,
  );
  const [modalModel, setModalModel] = useState("");
  const [modalModels, setModalModels] = useState<string[]>([]);
  const [modalCredentials, setModalCredentials] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [justValidatedId, setJustValidatedId] = useState<string | null>(null);

  async function loadData(organizationId: string, options?: { silent?: boolean }) {
    if (!options?.silent) setIsLoading(true);
    try {
      const [configsData, consumptionData] = await Promise.all([
        apiFetch<{ providers: ProviderConfig[] }>(
          `/api/v1/providers?organizationId=${organizationId}`,
        ),
        apiFetch<{ consumption: ConsumptionByConfig[] }>(
          `/api/v1/providers/consumption?organizationId=${organizationId}`,
        ),
      ]);
      setConfigs(configsData.providers);
      setConsumption(consumptionData.consumption);
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) void loadData(activeOrganization.id);
  }, [activeOrganization]);

  async function openConfigureModal(
    provider: AIProviderName,
    existing?: ProviderConfig,
  ) {
    setModalProvider(provider);
    setEditingConfig(existing ?? null);
    setModalModel(existing?.model ?? "");
    setModalCredentials("");
    setModalError(null);
    const { models } = await apiFetch<{ models: string[] }>(
      `/api/v1/providers/models?provider=${provider}`,
    );
    setModalModels(models);
  }

  function closeModal() {
    setModalProvider(null);
    setEditingConfig(null);
  }

  async function handleSave() {
    if (!activeOrganization || !modalProvider) return;
    setModalError(null);
    setIsSaving(true);

    try {
      if (editingConfig) {
        await apiFetch(`/api/v1/providers/${editingConfig.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            model: modalModel,
            ...(modalCredentials ? { credentials: modalCredentials } : {}),
          }),
        });
      } else {
        await apiFetch("/api/v1/providers", {
          method: "POST",
          body: JSON.stringify({
            organizationId: activeOrganization.id,
            provider: modalProvider,
            model: modalModel,
            credentials: modalCredentials,
          }),
        });
      }
      closeModal();
      await loadData(activeOrganization.id, { silent: true });
    } catch (error) {
      setModalError(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo guardar la configuración.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleValidate(configId: string) {
    if (!activeOrganization) return;
    setValidatingId(configId);
    try {
      await apiFetch(`/api/v1/providers/${configId}/validate`, {
        method: "POST",
      });
      await loadData(activeOrganization.id, { silent: true });
      setJustValidatedId(configId);
      setTimeout(() => {
        setJustValidatedId((current) => (current === configId ? null : current));
      }, 1800);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo validar las credenciales.",
      );
    } finally {
      setValidatingId(null);
    }
  }

  async function handleDelete(configId: string) {
    if (!activeOrganization) return;
    try {
      await apiFetch(`/api/v1/providers/${configId}`, { method: "DELETE" });
      await loadData(activeOrganization.id, { silent: true });
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo eliminar el proveedor.",
      );
    }
  }

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Proveedores IA"
        description="Crea o selecciona una organización para configurar proveedores de inteligencia artificial."
        icon={Bot}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Proveedores IA
        </h1>
        <p className="text-sm text-muted-foreground">
          Configura las credenciales de los proveedores de inteligencia
          artificial disponibles para tu organización.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Cargando proveedores...
        </p>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          {PROVIDERS.map((provider) => {
            const config = configs.find((c) => c.provider === provider);
            const usage = config
              ? consumption.find((c) => c.providerConfigId === config.id)
              : undefined;

            return (
              <Card key={provider}>
                <CardHeader>
                  <CardTitle>{PROVIDER_LABELS[provider]}</CardTitle>
                  <CardDescription>
                    {config ? `Modelo: ${config.model}` : "No configurado"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {config ? (
                    <>
                      <Badge
                        variant={
                          config.validationStatus === "válida"
                            ? "secondary"
                            : config.validationStatus === "inválida"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {config.validationStatus === "válida"
                          ? "Credenciales válidas"
                          : config.validationStatus === "inválida"
                            ? "Credenciales inválidas o expiradas"
                            : "Credenciales pendientes de validación"}
                      </Badge>
                      {usage && (
                        <p className="text-xs text-muted-foreground">
                          {usage.requestCount} solicitudes ·{" "}
                          {usage.inputTokens + usage.outputTokens} tokens
                          consumidos
                        </p>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline">Proveedor no configurado</Badge>
                  )}
                </CardContent>
                <CardFooter className="justify-between">
                  {config ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidate(config.id)}
                        disabled={validatingId === config.id}
                        className={
                          justValidatedId === config.id
                            ? "border-emerald-500/60 text-emerald-600 dark:text-emerald-400"
                            : undefined
                        }
                      >
                        {validatingId === config.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : justValidatedId === config.id ? (
                          <Check className="size-4" />
                        ) : null}
                        {justValidatedId === config.id ? "Validado" : "Validar"}
                      </Button>
                      <div className="flex gap-2">
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfigureModal(provider, config)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(config.id)}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    isAdmin && (
                      <Button size="sm" onClick={() => openConfigureModal(provider)}>
                        Configurar
                      </Button>
                    )
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalProvider !== null}
        onOpenChange={(open) => !open && closeModal()}
        title={editingConfig ? "Editar proveedor" : "Configurar proveedor"}
        description={modalProvider ? PROVIDER_LABELS[modalProvider] : undefined}
      >
        {modalProvider && (
          <div className="space-y-4">
            <ProviderSelector
              provider={modalProvider}
              model={modalModel}
              onModelChange={setModalModel}
              availableModels={modalModels}
            />
            <div className="space-y-1.5">
              <Label htmlFor="provider-credentials">
                {editingConfig
                  ? "Nueva credencial (opcional)"
                  : "Credencial (API key)"}
              </Label>
              <Input
                id="provider-credentials"
                type="password"
                autoComplete="off"
                value={modalCredentials}
                onChange={(event) => setModalCredentials(event.target.value)}
                placeholder={
                  editingConfig ? "Dejar en blanco para conservar la actual" : ""
                }
              />
            </div>
            {modalError && (
              <p className="text-sm text-destructive">{modalError}</p>
            )}
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isSaving || !modalModel}
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

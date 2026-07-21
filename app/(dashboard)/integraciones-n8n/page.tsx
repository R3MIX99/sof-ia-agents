"use client";

import { useEffect, useState } from "react";
import { Webhook, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { N8nIntegration } from "@/domain/entities/n8n-integration.entity";
import type { IntegrationExecutionLog } from "@/domain/entities/integration-execution-log.entity";
import {
  WebhookConfigForm,
  type WebhookConfigDraft,
} from "@/components/shared/webhook-config-form";
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
import { Drawer } from "@/components/shared/drawer";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

type TestState = "sin_probar" | "prueba_exitosa" | "prueba_fallida";

const DEFAULT_DRAFT: WebhookConfigDraft = {
  name: "",
  webhookUrl: "",
  httpMethod: "POST",
  headers: {},
  authType: "ninguna",
  authCredentials: "",
  dynamicVariables: {},
  timeoutMs: 10000,
  retryCount: 0,
  retryBackoffMs: 1000,
  errorHandlingStrategy: "continuar",
  expectedResponseContentField: "",
  status: "activa",
};

function toDraft(integration: N8nIntegration): WebhookConfigDraft {
  return {
    name: integration.name,
    webhookUrl: integration.webhookUrl,
    httpMethod: integration.httpMethod,
    headers: integration.headers,
    authType: integration.authType,
    authCredentials: "",
    dynamicVariables: integration.dynamicVariables,
    timeoutMs: integration.timeoutMs,
    retryCount: integration.retryCount,
    retryBackoffMs: integration.retryBackoffMs,
    errorHandlingStrategy: integration.errorHandlingStrategy,
    expectedResponseContentField:
      integration.expectedResponseFormat.contentField,
    status: integration.status,
  };
}

export default function IntegracionesN8nPage() {
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();
  const { isAdmin } = useRolePermissions(activeOrganization?.id ?? null);

  const [integrations, setIntegrations] = useState<N8nIntegration[]>([]);
  const [testStates, setTestStates] = useState<Record<string, TestState>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] =
    useState<N8nIntegration | null>(null);
  const [draft, setDraft] = useState<WebhookConfigDraft>(DEFAULT_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [historyIntegration, setHistoryIntegration] =
    useState<N8nIntegration | null>(null);
  const [executions, setExecutions] = useState<IntegrationExecutionLog[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  async function loadData(organizationId: string) {
    setIsLoading(true);
    try {
      const { integrations: list } = await apiFetch<{
        integrations: N8nIntegration[];
      }>(`/api/v1/integrations?organizationId=${organizationId}`);
      setIntegrations(list);

      const states = await Promise.all(
        list.map(async (integration) => {
          const { executions: recent } = await apiFetch<{
            executions: IntegrationExecutionLog[];
          }>(`/api/v1/integrations/${integration.id}/executions?limit=1`);
          const last = recent[0];
          const state: TestState = !last
            ? "sin_probar"
            : last.result === "éxito"
              ? "prueba_exitosa"
              : "prueba_fallida";
          return [integration.id, state] as const;
        }),
      );
      setTestStates(Object.fromEntries(states));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) void loadData(activeOrganization.id);
  }, [activeOrganization]);

  function openCreateModal() {
    setEditingIntegration(null);
    setDraft(DEFAULT_DRAFT);
    setModalError(null);
    setIsModalOpen(true);
  }

  function openEditModal(integration: N8nIntegration) {
    setEditingIntegration(integration);
    setDraft(toDraft(integration));
    setModalError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingIntegration(null);
  }

  async function handleSave() {
    if (!activeOrganization) return;
    setModalError(null);
    setIsSaving(true);

    const payload = {
      name: draft.name,
      webhookUrl: draft.webhookUrl,
      httpMethod: draft.httpMethod,
      headers: draft.headers,
      authType: draft.authType,
      ...(draft.authCredentials
        ? { authCredentials: draft.authCredentials }
        : {}),
      dynamicVariables: draft.dynamicVariables,
      timeoutMs: draft.timeoutMs,
      retryCount: draft.retryCount,
      retryBackoffMs: draft.retryBackoffMs,
      errorHandlingStrategy: draft.errorHandlingStrategy,
      expectedResponseFormat: {
        contentField: draft.expectedResponseContentField,
      },
      status: draft.status,
    };

    try {
      if (editingIntegration) {
        await apiFetch(`/api/v1/integrations/${editingIntegration.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/v1/integrations", {
          method: "POST",
          body: JSON.stringify({
            organizationId: activeOrganization.id,
            ...payload,
          }),
        });
      }
      closeModal();
      await loadData(activeOrganization.id);
      toast.success("Integración guardada.");
    } catch (error) {
      setModalError(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo guardar la integración.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestConnection(integrationId: string) {
    setTestingId(integrationId);
    try {
      const { result } = await apiFetch<{
        result: {
          success: boolean;
          content: string | null;
          statusCode: number | null;
          errorMessage: string | null;
        };
      }>("/api/v1/webhook", {
        method: "POST",
        body: JSON.stringify({ integrationId }),
      });

      setTestStates((current) => ({
        ...current,
        [integrationId]: result.success ? "prueba_exitosa" : "prueba_fallida",
      }));

      if (result.success) {
        toast.success("Prueba de conexión exitosa.");
      } else {
        toast.error(
          result.errorMessage ?? "La prueba de conexión no fue exitosa.",
        );
      }
    } catch (error) {
      setTestStates((current) => ({
        ...current,
        [integrationId]: "prueba_fallida",
      }));
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo ejecutar la prueba de conexión.",
      );
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(integrationId: string) {
    if (!activeOrganization) return;
    try {
      await apiFetch(`/api/v1/integrations/${integrationId}`, {
        method: "DELETE",
      });
      await loadData(activeOrganization.id);
      toast.success("Integración eliminada.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo eliminar la integración.",
      );
    }
  }

  async function openHistory(integration: N8nIntegration) {
    setHistoryIntegration(integration);
    setIsHistoryLoading(true);
    try {
      const { executions: list } = await apiFetch<{
        executions: IntegrationExecutionLog[];
      }>(`/api/v1/integrations/${integration.id}/executions?limit=20`);
      setExecutions(list);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Integraciones n8n"
        description="Crea o selecciona una organización para configurar integraciones de automatización."
        icon={Webhook}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Integraciones n8n
          </h1>
          <p className="text-sm text-muted-foreground">
            Configura Webhooks de n8n para disparar automatizaciones desde
            tus widgets.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal}>Nueva integración</Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Cargando integraciones...
        </p>
      ) : integrations.length === 0 ? (
        <PlaceholderScreen
          title="Sin integraciones configuradas"
          description="Crea tu primera integración de n8n para automatizar acciones desde tus widgets."
          icon={Webhook}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.map((integration) => {
            const testState = testStates[integration.id] ?? "sin_probar";
            return (
              <Card key={integration.id}>
                <CardHeader>
                  <CardTitle className="truncate">
                    {integration.name}
                  </CardTitle>
                  <CardDescription className="truncate font-mono text-xs">
                    {integration.httpMethod} {integration.webhookUrl}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        integration.status === "activa"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {integration.status === "activa"
                        ? "Activa"
                        : "Deshabilitada"}
                    </Badge>
                    <Badge
                      variant={
                        testState === "prueba_exitosa"
                          ? "secondary"
                          : testState === "prueba_fallida"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {testState === "prueba_exitosa"
                        ? "Prueba exitosa"
                        : testState === "prueba_fallida"
                          ? "Prueba fallida"
                          : "Sin probar"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex-wrap justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(integration.id)}
                      disabled={testingId === integration.id}
                    >
                      {testingId === integration.id && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Probar conexión
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openHistory(integration)}
                    >
                      <History className="size-4" /> Historial
                    </Button>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(integration)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(integration.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onOpenChange={(open) => !open && closeModal()}
        title={
          editingIntegration ? "Editar integración" : "Nueva integración"
        }
        description="Configura el Webhook de n8n que se ejecutará desde tus widgets."
        footer={
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isSaving || !draft.name || !draft.webhookUrl}
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        }
      >
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <WebhookConfigForm
            draft={draft}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, ...patch }))
            }
            isEditing={!!editingIntegration}
          />
          {modalError && (
            <p className="text-sm text-destructive">{modalError}</p>
          )}
        </div>
      </Modal>

      <Drawer
        open={historyIntegration !== null}
        onOpenChange={(open) => !open && setHistoryIntegration(null)}
        title="Ejecuciones recientes"
        description={historyIntegration?.name}
      >
        {isHistoryLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : executions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay ejecuciones registradas para esta integración.
          </p>
        ) : (
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="rounded-md border border-border p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      execution.result === "éxito"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {execution.result === "éxito"
                      ? "Éxito"
                      : execution.result === "tiempo_agotado"
                        ? "Tiempo agotado"
                        : "Error"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(execution.createdAt).toLocaleString("es-419")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Intento {execution.attemptNumber} · {execution.durationMs}{" "}
                  ms
                  {execution.statusCode !== null &&
                    ` · Estado HTTP ${execution.statusCode}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}

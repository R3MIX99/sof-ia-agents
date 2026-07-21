"use client";

import type {
  N8nAuthType,
  N8nErrorHandlingStrategy,
  N8nHttpMethod,
  N8nIntegrationStatus,
} from "@/domain/entities/n8n-integration.entity";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyValueEditor } from "@/components/shared/key-value-editor";

export interface WebhookConfigDraft {
  name: string;
  webhookUrl: string;
  httpMethod: N8nHttpMethod;
  headers: Record<string, string>;
  authType: N8nAuthType;
  authCredentials: string;
  dynamicVariables: Record<string, string>;
  timeoutMs: number;
  retryCount: number;
  retryBackoffMs: number;
  errorHandlingStrategy: N8nErrorHandlingStrategy;
  expectedResponseContentField: string;
  status: N8nIntegrationStatus;
}

const HTTP_METHODS: N8nHttpMethod[] = ["POST", "GET", "PUT", "PATCH"];
const AUTH_TYPE_OPTIONS: { value: N8nAuthType; label: string }[] = [
  { value: "ninguna", label: "Sin autenticación" },
  { value: "cabecera_estatica", label: "Cabecera de autenticación estática" },
  { value: "token", label: "Token en cabecera (Bearer)" },
  { value: "básica", label: "Autenticación básica" },
];
const ERROR_STRATEGY_OPTIONS: {
  value: N8nErrorHandlingStrategy;
  label: string;
}[] = [
  {
    value: "continuar",
    label: "Continuar la conversación con un mensaje controlado",
  },
  { value: "interrumpir", label: "Interrumpir el flujo" },
];

export interface WebhookConfigFormProps {
  draft: WebhookConfigDraft;
  onChange: (patch: Partial<WebhookConfigDraft>) => void;
  isEditing: boolean;
}

/** Formulario completo de configuración de Webhook (sección 6.2 / 9.5). */
export function WebhookConfigForm({
  draft,
  onChange,
  isEditing,
}: WebhookConfigFormProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="integration-name">Nombre</Label>
          <Input
            id="integration-name"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div className="space-y-1.5">
            <Label htmlFor="integration-url">URL del Webhook</Label>
            <Input
              id="integration-url"
              value={draft.webhookUrl}
              onChange={(event) =>
                onChange({ webhookUrl: event.target.value })
              }
              placeholder="https://mi-instancia-n8n.com/webhook/..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Método</Label>
            <Select
              value={draft.httpMethod}
              onValueChange={(value) =>
                onChange({ httpMethod: value as N8nHttpMethod })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Integración activa</p>
            <p className="text-xs text-muted-foreground">
              Las integraciones deshabilitadas no pueden asociarse a widgets.
            </p>
          </div>
          <Switch
            checked={draft.status === "activa"}
            onCheckedChange={(checked) =>
              onChange({ status: checked ? "activa" : "deshabilitada" })
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Autenticación</h3>
        <div className="space-y-1.5">
          <Label>Mecanismo</Label>
          <Select
            value={draft.authType}
            onValueChange={(value) =>
              onChange({ authType: value as N8nAuthType })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTH_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {draft.authType !== "ninguna" && (
          <div className="space-y-1.5">
            <Label htmlFor="integration-credential">
              {isEditing
                ? "Nueva credencial (opcional)"
                : "Credencial"}
            </Label>
            <Input
              id="integration-credential"
              type="password"
              autoComplete="off"
              value={draft.authCredentials}
              onChange={(event) =>
                onChange({ authCredentials: event.target.value })
              }
              placeholder={
                isEditing
                  ? "Dejar en blanco para conservar la actual"
                  : draft.authType === "básica"
                    ? "usuario:contraseña"
                    : ""
              }
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <KeyValueEditor
          label="Encabezados personalizados"
          helperText="Puedes usar {{variable}} para insertar variables dinámicas."
          value={draft.headers}
          onChange={(headers) => onChange({ headers })}
          keyPlaceholder="X-Encabezado"
        />
      </section>

      <section className="space-y-4">
        <KeyValueEditor
          label="Variables dinámicas"
          helperText="Se resuelven en tiempo de ejecución a partir del contexto de la conversación; usa {{nombre}} en la URL, encabezados o cuerpo."
          value={draft.dynamicVariables}
          onChange={(dynamicVariables) => onChange({ dynamicVariables })}
          keyPlaceholder="nombre"
          valuePlaceholder="Valor de prueba"
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Tiempo de espera y reintentos
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="integration-timeout">Timeout (ms)</Label>
            <Input
              id="integration-timeout"
              type="number"
              value={draft.timeoutMs}
              onChange={(event) =>
                onChange({ timeoutMs: Number(event.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="integration-retry-count">
              Máximo de reintentos
            </Label>
            <Input
              id="integration-retry-count"
              type="number"
              value={draft.retryCount}
              onChange={(event) =>
                onChange({ retryCount: Number(event.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="integration-retry-backoff">
              Espera entre intentos (ms)
            </Label>
            <Input
              id="integration-retry-backoff"
              type="number"
              value={draft.retryBackoffMs}
              onChange={(event) =>
                onChange({ retryBackoffMs: Number(event.target.value) })
              }
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Manejo de errores</Label>
          <Select
            value={draft.errorHandlingStrategy}
            onValueChange={(value) =>
              onChange({
                errorHandlingStrategy: value as N8nErrorHandlingStrategy,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ERROR_STRATEGY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Formato de respuesta esperado
        </h3>
        <div className="space-y-1.5">
          <Label htmlFor="integration-content-field">
            Campo con el contenido a mostrar
          </Label>
          <Input
            id="integration-content-field"
            value={draft.expectedResponseContentField}
            onChange={(event) =>
              onChange({ expectedResponseContentField: event.target.value })
            }
            placeholder="output o data.message"
          />
          <p className="text-xs text-muted-foreground">
            Ruta del campo en la respuesta JSON del Webhook (notación con
            puntos) que contiene el texto a mostrar al usuario final.
          </p>
        </div>
      </section>
    </div>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AIProviderName } from "@/providers/ai/interfaces/ai-provider.interface";

export type ProviderValidationStatus = "pendiente" | "válida" | "inválida";

const PROVIDER_LABELS: Record<AIProviderName, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const STATUS_LABELS: Record<ProviderValidationStatus, string> = {
  pendiente: "Pendiente de validación",
  válida: "Credenciales válidas",
  inválida: "Credenciales inválidas",
};

const STATUS_VARIANTS: Record<
  ProviderValidationStatus,
  "outline" | "secondary" | "destructive"
> = {
  pendiente: "outline",
  válida: "secondary",
  inválida: "destructive",
};

export interface ProviderSelectorProps {
  provider: AIProviderName;
  onProviderChange?: (provider: AIProviderName) => void;
  availableProviders?: AIProviderName[];
  model: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  validationStatus?: ProviderValidationStatus | null;
  onValidate?: () => void;
  isValidating?: boolean;
  disabled?: boolean;
}

/**
 * Provider Selector (sección 8): selección del proveedor de IA y del modelo
 * asociado, con validación de credenciales integrada. Reutilizado en la
 * pantalla Proveedores IA (Fase 3) y en la sección Proveedor de cada widget
 * (Fase 4).
 */
export function ProviderSelector({
  provider,
  onProviderChange,
  availableProviders = ["openai", "anthropic"],
  model,
  onModelChange,
  availableModels,
  validationStatus,
  onValidate,
  isValidating = false,
  disabled = false,
}: ProviderSelectorProps) {
  return (
    <div className="space-y-4">
      {onProviderChange && (
        <div className="space-y-1.5">
          <Label>Proveedor</Label>
          <Select
            value={provider}
            onValueChange={(value) => onProviderChange(value as AIProviderName)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((name) => (
                <SelectItem key={name} value={name}>
                  {PROVIDER_LABELS[name]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Modelo</Label>
        <Select value={model} onValueChange={onModelChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un modelo" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((modelId) => (
              <SelectItem key={modelId} value={modelId}>
                {modelId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(validationStatus || onValidate) && (
        <div className="flex items-center justify-between gap-2">
          {validationStatus && (
            <Badge variant={STATUS_VARIANTS[validationStatus]}>
              {STATUS_LABELS[validationStatus]}
            </Badge>
          )}
          {onValidate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onValidate}
              disabled={isValidating || disabled}
            >
              {isValidating && <Loader2 className="size-4 animate-spin" />}
              Probar credenciales
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

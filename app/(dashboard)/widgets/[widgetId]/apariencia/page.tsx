"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useWidgetDetail } from "@/context/widget-detail-context";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { WidgetAppearance } from "@/domain/entities/widget-appearance.entity";
import {
  ThemeEditor,
  type WidgetAppearancePatch,
} from "@/components/shared/theme-editor";
import { WidgetPreview } from "@/components/widget-preview/widget-preview";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function WidgetApariciaPage() {
  const { widget, appearance, refresh, setUnsavedGuard } = useWidgetDetail();
  const [draft, setDraft] = useState<WidgetAppearance | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (appearance) {
      setDraft(appearance);
      setIsDirty(false);
    }
  }, [appearance]);

  function handleChange(patch: WidgetAppearancePatch) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setIsDirty(true);
  }

  const handleSave = useCallback(async () => {
    if (!widget || !draft) return;
    setIsSaving(true);
    try {
      await apiFetch<{ appearance: WidgetAppearance }>(
        `/api/v1/widgets/${widget.id}/appearance`,
        {
          method: "PATCH",
          body: JSON.stringify(draft),
        },
      );
      setIsDirty(false);
      await refresh();
      toast.success("Apariencia guardada.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo guardar la apariencia.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [widget, draft, refresh]);

  useEffect(() => {
    setUnsavedGuard({ isDirty, onSave: handleSave });
    return () => setUnsavedGuard(null);
  }, [isDirty, handleSave, setUnsavedGuard]);

  if (!widget || !draft) {
    return (
      <p className="text-sm text-muted-foreground">Cargando apariencia...</p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <ThemeEditor appearance={draft} onChange={handleChange} />
      </div>
      <div className="lg:sticky lg:top-6 lg:self-start lg:pb-12">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Previsualización en vivo
        </p>
        <WidgetPreview appearance={draft} widgetName={widget.name} />
        <div className="mt-4 flex justify-end pb-6">
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Guardar apariencia
          </Button>
        </div>
      </div>
    </div>
  );
}

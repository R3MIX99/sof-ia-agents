"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Snippet } from "@/domain/entities/snippet.entity";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface SnippetGeneratorProps {
  widgetId: string;
  widgetPublished: boolean;
  canManage: boolean;
}

/** Snippet Generator (sección 8): genera el fragmento de código embebible del widget y permite copiarlo. */
export function SnippetGenerator({
  widgetId,
  widgetPublished,
  canManage,
}: SnippetGeneratorProps) {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const { snippet: existing } = await apiFetch<{ snippet: Snippet | null }>(
        `/api/v1/snippet?widgetId=${widgetId}`,
      );
      setSnippet(existing);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId]);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const { snippet: generated } = await apiFetch<{ snippet: Snippet }>(
        "/api/v1/snippet",
        { method: "POST", body: JSON.stringify({ widgetId }) },
      );
      setSnippet(generated);
      toast.success(
        snippet
          ? "Snippet regenerado. El fragmento anterior dejó de funcionar."
          : "Snippet generado.",
      );
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo generar el snippet.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function buildSnippetCode(publicKey: string): string {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `<script src="${origin}/widget-embed/loader" data-widget-id="${publicKey}" async></script>`;
  }

  async function handleCopy() {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(buildSnippetCode(snippet.publicKey));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el snippet.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snippet de instalación</CardTitle>
        <CardDescription>
          Inserta este fragmento en el HTML de tu sitio para mostrar el
          widget a tus visitantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : snippet ? (
          <>
            {!widgetPublished && (
              <Badge variant="outline">
                El widget aún no está publicado; el snippet no funcionará
                hasta que lo publiques.
              </Badge>
            )}
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
              <code>{buildSnippetCode(snippet.publicKey)}</code>
            </pre>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no se ha generado un snippet para este widget.
          </p>
        )}
      </CardContent>
      {canManage && (
        <CardFooter className="justify-end gap-2">
          {snippet && (
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              Copiar
            </Button>
          )}
          <Button
            variant={snippet ? "outline" : "default"}
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : snippet ? (
              <RotateCw className="size-4" />
            ) : null}
            {snippet ? "Regenerar" : "Generar snippet"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

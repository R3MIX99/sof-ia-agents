"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface KeyValueEditorProps {
  label: string;
  helperText?: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

/** Editor de pares clave-valor reutilizado para encabezados y variables dinámicas de una integración n8n (sección 6.2). */
export function KeyValueEditor({
  label,
  helperText,
  value,
  onChange,
  keyPlaceholder = "Clave",
  valuePlaceholder = "Valor",
}: KeyValueEditorProps) {
  const entries = Object.entries(value);

  function updateEntry(index: number, nextKey: string, nextValue: string) {
    const updated = [...entries];
    updated[index] = [nextKey, nextValue];
    onChange(Object.fromEntries(updated));
  }

  function removeEntry(index: number) {
    const updated = entries.filter((_, i) => i !== index);
    onChange(Object.fromEntries(updated));
  }

  function addEntry() {
    onChange({ ...value, "": "" });
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      <div className="space-y-2">
        {entries.map(([key, val], index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={key}
              placeholder={keyPlaceholder}
              onChange={(event) =>
                updateEntry(index, event.target.value, val)
              }
              className="font-mono text-xs"
            />
            <Input
              value={val}
              placeholder={valuePlaceholder}
              onChange={(event) =>
                updateEntry(index, key, event.target.value)
              }
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeEntry(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addEntry}>
        <Plus className="size-4" /> Agregar
      </Button>
    </div>
  );
}

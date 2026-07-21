"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  label?: string;
}

const DEFAULT_PRESETS = [
  "#0f172a",
  "#1e293b",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#ffffff",
];

/** Color Picker (sección 8): selector de color con soporte hexadecimal y paletas predefinidas. */
export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  label,
}: ColorPickerProps) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-8 cursor-pointer rounded-md border border-border bg-transparent p-0"
          aria-label={label ?? "Selector de color"}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-28 font-mono text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              "size-6 rounded-full border-2 transition-transform hover:scale-110",
              value.toLowerCase() === preset.toLowerCase()
                ? "border-foreground"
                : "border-transparent",
            )}
            style={{ backgroundColor: preset }}
            aria-label={`Usar color ${preset}`}
          />
        ))}
      </div>
    </div>
  );
}

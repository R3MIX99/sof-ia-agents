import type { LucideIcon } from "lucide-react";

export interface PlaceholderScreenProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Pantalla marcadora de posición para secciones que se implementan en fases posteriores. */
export function PlaceholderScreen({
  title,
  description,
  icon: Icon,
}: PlaceholderScreenProps) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

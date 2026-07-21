"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWidgetDetail } from "@/context/widget-detail-context";

const SECTIONS = [
  { value: "general", label: "General" },
  { value: "apariencia", label: "Apariencia" },
  { value: "proveedor", label: "Proveedor" },
  { value: "integraciones", label: "Integraciones" },
  { value: "dominios", label: "Dominios" },
  { value: "avanzado", label: "Avanzado" },
];

export function WidgetDetailTabs({ widgetId }: { widgetId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { guardNavigation } = useWidgetDetail();
  const activeSection =
    SECTIONS.find((section) => pathname.endsWith(`/${section.value}`))
      ?.value ?? "general";

  return (
    <Tabs
      value={activeSection}
      onValueChange={(value) =>
        guardNavigation(() => router.push(`/widgets/${widgetId}/${value}`))
      }
    >
      <TabsList variant="line">
        {SECTIONS.map((section) => (
          <TabsTrigger key={section.value} value={section.value}>
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

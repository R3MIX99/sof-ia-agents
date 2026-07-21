"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/http/api-client";
import type { Widget } from "@/domain/entities/widget.entity";
import type { WidgetAppearance } from "@/domain/entities/widget-appearance.entity";
import type { WidgetDomain } from "@/domain/entities/widget-domain.entity";
import type { WidgetSchedule } from "@/domain/entities/widget-schedule.entity";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface UnsavedChangesGuard {
  isDirty: boolean;
  onSave: () => Promise<void>;
}

export interface WidgetDetailState {
  widgetId: string;
  widget: Widget | null;
  appearance: WidgetAppearance | null;
  domains: WidgetDomain[];
  schedules: WidgetSchedule[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  setUnsavedGuard: (guard: UnsavedChangesGuard | null) => void;
  guardNavigation: (navigate: () => void) => void;
}

const WidgetDetailContext = createContext<WidgetDetailState | null>(null);

export function WidgetDetailProvider({
  widgetId,
  children,
}: {
  widgetId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [appearance, setAppearance] = useState<WidgetAppearance | null>(null);
  const [domains, setDomains] = useState<WidgetDomain[]>([]);
  const [schedules, setSchedules] = useState<WidgetSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const guardRef = useRef<UnsavedChangesGuard | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);

  const setUnsavedGuard = useCallback((guard: UnsavedChangesGuard | null) => {
    guardRef.current = guard;
  }, []);

  const guardNavigation = useCallback((navigate: () => void) => {
    if (guardRef.current?.isDirty) {
      pendingNavigationRef.current = navigate;
      setIsConfirmOpen(true);
    } else {
      navigate();
    }
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!guardRef.current?.isDirty) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as HTMLElement)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank") return;
      if (anchor.origin !== window.location.origin) return;

      const destination = anchor.pathname + anchor.search + anchor.hash;
      const current =
        window.location.pathname + window.location.search + window.location.hash;
      if (destination === current) return;

      event.preventDefault();
      guardNavigation(() => router.push(destination));
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [guardNavigation, router]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (guardRef.current?.isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function closeConfirmDialog() {
    setIsConfirmOpen(false);
    pendingNavigationRef.current = null;
  }

  function handleLeaveWithoutSaving() {
    const navigate = pendingNavigationRef.current;
    setIsConfirmOpen(false);
    pendingNavigationRef.current = null;
    navigate?.();
  }

  async function handleSaveAndLeave() {
    const guard = guardRef.current;
    const navigate = pendingNavigationRef.current;
    if (!guard || !navigate) {
      closeConfirmDialog();
      return;
    }
    setIsSavingBeforeLeave(true);
    try {
      await guard.onSave();
      setIsConfirmOpen(false);
      pendingNavigationRef.current = null;
      navigate();
    } finally {
      setIsSavingBeforeLeave(false);
    }
  }

  const load = useCallback(async () => {
    setIsLoading(true);
    const [widgetData, appearanceData, domainsData, schedulesData] =
      await Promise.all([
        apiFetch<{ widget: Widget }>(`/api/v1/widgets/${widgetId}`),
        apiFetch<{ appearance: WidgetAppearance | null }>(
          `/api/v1/widgets/${widgetId}/appearance`,
        ),
        apiFetch<{ domains: WidgetDomain[] }>(
          `/api/v1/widgets/${widgetId}/domains`,
        ),
        apiFetch<{ schedules: WidgetSchedule[] }>(
          `/api/v1/widgets/${widgetId}/schedules`,
        ),
      ]);
    setWidget(widgetData.widget);
    setAppearance(appearanceData.appearance);
    setDomains(domainsData.domains);
    setSchedules(schedulesData.schedules);
    setIsLoading(false);
  }, [widgetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<WidgetDetailState>(
    () => ({
      widgetId,
      widget,
      appearance,
      domains,
      schedules,
      isLoading,
      refresh: load,
      setUnsavedGuard,
      guardNavigation,
    }),
    [
      widgetId,
      widget,
      appearance,
      domains,
      schedules,
      isLoading,
      load,
      setUnsavedGuard,
      guardNavigation,
    ],
  );

  return (
    <WidgetDetailContext.Provider value={value}>
      {children}
      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!open) closeConfirmDialog();
        }}
      >
        {isConfirmOpen && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambios sin guardar</DialogTitle>
              <DialogDescription>
                Tienes cambios en la apariencia del widget que no se han
                guardado. ¿Qué deseas hacer antes de salir?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={isSavingBeforeLeave}
                onClick={closeConfirmDialog}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={isSavingBeforeLeave}
                onClick={handleLeaveWithoutSaving}
              >
                Salir sin guardar
              </Button>
              <Button
                disabled={isSavingBeforeLeave}
                onClick={handleSaveAndLeave}
              >
                {isSavingBeforeLeave && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Guardar y salir
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </WidgetDetailContext.Provider>
  );
}

export function useWidgetDetail(): WidgetDetailState {
  const context = useContext(WidgetDetailContext);
  if (!context) {
    throw new Error(
      "useWidgetDetail debe usarse dentro de <WidgetDetailProvider>.",
    );
  }
  return context;
}

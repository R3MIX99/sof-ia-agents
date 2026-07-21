"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client/browser";
import { OrganizationService } from "@/services/organizations/organization.service";
import type { Organization } from "@/domain/entities/organization.entity";
import { useSessionContext } from "./session-context";

const STORAGE_KEY = "sofia:active-organization-id";

export interface ActiveOrganizationState {
  organizations: Organization[];
  activeOrganization: Organization | null;
  setActiveOrganization: (organizationId: string) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const ActiveOrganizationContext =
  createContext<ActiveOrganizationState | null>(null);

/** Proveedor de organización activa (Fase 2): única fuente de verdad compartida por todo el dashboard. */
export function ActiveOrganizationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { authUserId, isLoading: isSessionLoading } = useSessionContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (userId: string) => {
    const supabase = createSupabaseBrowserClient();
    const organizationService = new OrganizationService(supabase);

    const orgs = await organizationService.listOrganizationsForUser(userId);
    setOrganizations(orgs);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    setActiveOrganizationId((current) => {
      if (current && orgs.some((org) => org.id === current)) return current;
      return orgs.find((org) => org.id === stored)?.id ?? orgs[0]?.id ?? null;
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isSessionLoading) return;

    if (!authUserId) {
      setOrganizations([]);
      setActiveOrganizationId(null);
      setIsLoading(false);
      return;
    }

    void load(authUserId);
  }, [authUserId, isSessionLoading, load]);

  const setActiveOrganization = useCallback((organizationId: string) => {
    setActiveOrganizationId(organizationId);
    window.localStorage.setItem(STORAGE_KEY, organizationId);
  }, []);

  const refresh = useCallback(async () => {
    if (authUserId) await load(authUserId);
  }, [authUserId, load]);

  const activeOrganization = useMemo(
    () =>
      organizations.find((org) => org.id === activeOrganizationId) ?? null,
    [organizations, activeOrganizationId],
  );

  const value = useMemo<ActiveOrganizationState>(
    () => ({
      organizations,
      activeOrganization,
      setActiveOrganization,
      isLoading,
      refresh,
    }),
    [organizations, activeOrganization, setActiveOrganization, isLoading, refresh],
  );

  return (
    <ActiveOrganizationContext.Provider value={value}>
      {children}
    </ActiveOrganizationContext.Provider>
  );
}

export function useActiveOrganizationContext(): ActiveOrganizationState {
  const context = useContext(ActiveOrganizationContext);
  if (!context) {
    throw new Error(
      "useActiveOrganizationContext debe usarse dentro de <ActiveOrganizationProvider>.",
    );
  }
  return context;
}

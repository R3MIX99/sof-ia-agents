"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client/browser";
import { UserService } from "@/services/users/user.service";
import type { User } from "@/domain/entities/user.entity";

export interface SessionState {
  authUserId: string | null;
  profile: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionState | null>(null);

/** Proveedor de sesión autenticada (Fase 2): única fuente de verdad compartida por todo el dashboard. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    authUserId: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const userService = new UserService(supabase);
    let isMounted = true;

    async function loadProfile(authUserId: string | null) {
      if (!authUserId) {
        if (isMounted) {
          setState({ authUserId: null, profile: null, isLoading: false });
        }
        return;
      }
      const profile = await userService.getProfile(authUserId);
      if (isMounted) setState({ authUserId, profile, isLoading: false });
    }

    supabase.auth.getUser().then(({ data }) => {
      void loadProfile(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user.id ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}

export function useSessionContext(): SessionState {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error(
      "useSessionContext debe usarse dentro de <SessionProvider>.",
    );
  }
  return context;
}

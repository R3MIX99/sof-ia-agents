"use client";

import { useSessionContext, type SessionState } from "@/context/session-context";

export type { SessionState };

/** Hook de sesión autenticada (Fase 2): expone el perfil de dominio del usuario actual, compartido vía contexto. */
export function useSession(): SessionState {
  return useSessionContext();
}

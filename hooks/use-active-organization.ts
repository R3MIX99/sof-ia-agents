"use client";

import {
  useActiveOrganizationContext,
  type ActiveOrganizationState,
} from "@/context/active-organization-context";

export type { ActiveOrganizationState };

/** Hook de organización activa (Fase 2): resuelve y persiste la organización seleccionada, compartido vía contexto. */
export function useActiveOrganization(): ActiveOrganizationState {
  return useActiveOrganizationContext();
}

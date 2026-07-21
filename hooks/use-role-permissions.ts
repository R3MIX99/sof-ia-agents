"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client/browser";

export interface RolePermissionsState {
  isAdmin: boolean;
  isLoading: boolean;
}

/** Hook de permisos por rol (Fase 2): indica si el usuario actual administra la organización activa. */
export function useRolePermissions(
  organizationId: string | null,
): RolePermissionsState {
  const [state, setState] = useState<RolePermissionsState>({
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!organizationId) {
      setState({ isAdmin: false, isLoading: false });
      return;
    }

    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase
      .rpc("is_organization_admin", { p_organization_id: organizationId })
      .then(({ data, error }) => {
        if (!isMounted) return;
        setState({ isAdmin: Boolean(data) && !error, isLoading: false });
      });

    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  return state;
}

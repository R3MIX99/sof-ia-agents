"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { Modal } from "@/components/shared/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAV_ITEMS } from "@/lib/constants/navigation";
import { useSession } from "@/hooks/use-session";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client/browser";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Organization } from "@/domain/entities/organization.entity";

const COMBINING_DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_PATTERN, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { profile } = useSession();
  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    refresh,
  } = useActiveOrganization();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/iniciar-sesion");
    router.refresh();
  }

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const { organization } = await apiFetch<{ organization: Organization }>(
        "/api/v1/organizations",
        {
          method: "POST",
          body: JSON.stringify({ name: orgName, slug: slugify(orgName) }),
        },
      );
      await refresh();
      setActiveOrganization(organization.id);
      setIsCreateOpen(false);
      setOrgName("");
    } catch (error) {
      setCreateError(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo crear la organización.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar items={DASHBOARD_NAV_ITEMS} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          organizations={organizations}
          activeOrganization={activeOrganization}
          onOrganizationChange={setActiveOrganization}
          onCreateOrganization={() => setIsCreateOpen(true)}
          userFullName={profile?.fullName || "Usuario"}
          userEmail={profile?.email ?? ""}
          avatarUrl={profile?.avatarUrl}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Nueva organización"
        description="Crea una organización para empezar a configurar tus widgets."
      >
        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-create-name">Nombre</Label>
            <Input
              id="org-create-name"
              required
              value={orgName}
              onChange={(event) => setOrgName(event.target.value)}
            />
          </div>
          {createError && (
            <p className="text-sm text-destructive">{createError}</p>
          )}
          <Button type="submit" className="w-full" disabled={isCreating}>
            Crear organización
          </Button>
        </form>
      </Modal>
    </div>
  );
}

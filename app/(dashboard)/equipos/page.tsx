"use client";

import { type FormEvent, useEffect, useState } from "react";
import { MoreHorizontal, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Team } from "@/domain/entities/team.entity";
import type { OrganizationMemberWithProfile } from "@/services/users/user.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/shared/modal";
import { Drawer } from "@/components/shared/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default function EquiposPage() {
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();
  const { isAdmin } = useRolePermissions(activeOrganization?.id ?? null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<OrganizationMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [detailTeam, setDetailTeam] = useState<Team | null>(null);

  async function loadData(organizationId: string) {
    setIsLoading(true);
    try {
      const [teamsData, membersData] = await Promise.all([
        apiFetch<{ teams: Team[] }>(
          `/api/v1/teams?organizationId=${organizationId}`,
        ),
        apiFetch<{ members: OrganizationMemberWithProfile[] }>(
          `/api/v1/organizations/${organizationId}/members`,
        ),
      ]);
      setTeams(teamsData.teams);
      setMembers(membersData.members);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      void loadData(activeOrganization.id);
    }
  }, [activeOrganization]);

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization) return;
    setCreateError(null);
    setIsCreating(true);

    try {
      await apiFetch("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({
          organizationId: activeOrganization.id,
          name: teamName,
          description: teamDescription || undefined,
        }),
      });
      setIsCreateOpen(false);
      setTeamName("");
      setTeamDescription("");
      await loadData(activeOrganization.id);
    } catch (error) {
      setCreateError(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo crear el equipo.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    if (!activeOrganization) return;
    try {
      await apiFetch(`/api/v1/teams/${teamId}`, { method: "DELETE" });
      setDetailTeam(null);
      await loadData(activeOrganization.id);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo eliminar el equipo.",
      );
    }
  }

  async function handleToggleMember(
    teamId: string,
    memberId: string,
    assign: boolean,
  ) {
    if (!activeOrganization) return;
    try {
      if (assign) {
        await apiFetch(`/api/v1/teams/${teamId}/members`, {
          method: "POST",
          body: JSON.stringify({ memberId }),
        });
      } else {
        await apiFetch(`/api/v1/teams/${teamId}/members?memberId=${memberId}`, {
          method: "DELETE",
        });
      }
      await loadData(activeOrganization.id);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo actualizar la membresía del equipo.",
      );
    }
  }

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Equipos"
        description="Crea o selecciona una organización para administrar sus equipos."
        icon={UsersRound}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Equipos</h1>
          <p className="text-sm text-muted-foreground">
            Agrupa usuarios en equipos con permisos diferenciados sobre los
            widgets.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" /> Crear equipo
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Cargando equipos...</p>
      )}

      {!isLoading && teams.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no hay equipos creados.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const memberCount = members.filter(
            (member) => member.teamId === team.id,
          ).length;
          return (
            <Card
              key={team.id}
              className="cursor-pointer"
              onClick={() => setDetailTeam(team)}
            >
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle>{team.name}</CardTitle>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => handleDeleteTeam(team.id)}
                      >
                        Eliminar equipo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {team.description && (
                  <p className="text-sm text-muted-foreground">
                    {team.description}
                  </p>
                )}
                <Badge variant="outline">
                  {memberCount} miembro{memberCount === 1 ? "" : "s"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Crear equipo">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Nombre</Label>
            <Input
              id="team-name"
              required
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team-description">Descripción</Label>
            <Textarea
              id="team-description"
              value={teamDescription}
              onChange={(event) => setTeamDescription(event.target.value)}
            />
          </div>
          {createError && (
            <p className="text-sm text-destructive">{createError}</p>
          )}
          <Button type="submit" className="w-full" disabled={isCreating}>
            Crear equipo
          </Button>
        </form>
      </Modal>

      <Drawer
        open={detailTeam !== null}
        onOpenChange={(open) => !open && setDetailTeam(null)}
        title={detailTeam?.name ?? ""}
        description="Administra los miembros de este equipo."
      >
        {detailTeam && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {members.map((member) => {
                const isMember = member.teamId === detailTeam.id;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {member.fullName ?? "Sin nombre"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant={isMember ? "destructive" : "outline"}
                        size="sm"
                        onClick={() =>
                          handleToggleMember(detailTeam.id, member.id, !isMember)
                        }
                      >
                        {isMember ? "Quitar" : "Agregar"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
              La asignación de widgets visibles por equipo estará disponible
              una vez implementados los widgets, en la Fase 4.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

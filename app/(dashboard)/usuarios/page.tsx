"use client";

import { type FormEvent, useEffect, useState } from "react";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { OrganizationMemberWithProfile } from "@/services/users/user.service";
import type { Role } from "@/domain/entities/role.entity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/shared/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

const STATUS_LABEL: Record<string, string> = {
  invitado: "Invitación pendiente",
  activo: "Activo",
  suspendido: "Suspendido",
};

const STATUS_VARIANT: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  invitado: "outline",
  activo: "secondary",
  suspendido: "destructive",
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

export default function UsuariosPage() {
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();
  const { isAdmin } = useRolePermissions(activeOrganization?.id ?? null);

  const [members, setMembers] = useState<OrganizationMemberWithProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  async function loadData(organizationId: string) {
    setIsLoading(true);
    try {
      const [membersData, rolesData] = await Promise.all([
        apiFetch<{ members: OrganizationMemberWithProfile[] }>(
          `/api/v1/organizations/${organizationId}/members`,
        ),
        apiFetch<{ roles: Role[] }>(
          `/api/v1/organizations/${organizationId}/roles`,
        ),
      ]);
      setMembers(membersData.members);
      setRoles(rolesData.roles);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      void loadData(activeOrganization.id);
    }
  }, [activeOrganization]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization) return;
    setInviteError(null);
    setIsInviting(true);

    try {
      await apiFetch("/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          organizationId: activeOrganization.id,
          email: inviteEmail,
          roleId: inviteRoleId || undefined,
        }),
      });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRoleId("");
      await loadData(activeOrganization.id);
    } catch (error) {
      setInviteError(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo enviar la invitación.",
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, roleId: string) {
    if (!activeOrganization) return;
    try {
      await apiFetch(`/api/v1/users/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ roleId }),
      });
      await loadData(activeOrganization.id);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo actualizar el rol.",
      );
    }
  }

  async function handleRevoke(memberId: string) {
    if (!activeOrganization) return;
    try {
      await apiFetch(`/api/v1/users/${memberId}`, { method: "DELETE" });
      await loadData(activeOrganization.id);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo revocar el acceso.",
      );
    }
  }

  async function handleResend(memberId: string) {
    try {
      await apiFetch(`/api/v1/users/${memberId}/resend-invitation`, {
        method: "POST",
      });
      toast.success("Invitación reenviada.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo reenviar la invitación.",
      );
    }
  }

  function roleName(roleId: string | null): string {
    return roles.find((role) => role.id === roleId)?.name ?? "Sin rol";
  }

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Usuarios"
        description="Crea o selecciona una organización para administrar sus usuarios."
        icon={Users}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra quién tiene acceso a esta organización.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsInviteOpen(true)}>
            <Plus className="size-4" /> Invitar usuario
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              {isAdmin && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && members.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay usuarios en esta organización.
                </TableCell>
              </TableRow>
            )}
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage
                        src={member.avatarUrl ?? undefined}
                        alt={member.fullName ?? ""}
                      />
                      <AvatarFallback>
                        {initialsFrom(member.fullName ?? "Usuario")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {member.fullName ?? "Sin nombre"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.email ?? "—"}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Select
                      value={member.roleId ?? ""}
                      onValueChange={(value) =>
                        handleRoleChange(member.id, value)
                      }
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Sin rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm">{roleName(member.roleId)}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[member.status]}>
                    {STATUS_LABEL[member.status]}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.status === "invitado" && (
                          <DropdownMenuItem
                            onSelect={() => handleResend(member.id)}
                          >
                            Reenviar invitación
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => handleRevoke(member.id)}
                        >
                          Revocar acceso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        title="Invitar usuario"
        description="Se enviará una invitación por correo electrónico."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Correo electrónico</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Rol</Label>
            <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {inviteError && (
            <p className="text-sm text-destructive">{inviteError}</p>
          )}
          <Button type="submit" className="w-full" disabled={isInviting}>
            Enviar invitación
          </Button>
        </form>
      </Modal>
    </div>
  );
}

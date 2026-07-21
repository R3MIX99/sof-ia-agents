"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Plus, Settings, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Organization } from "@/domain/entities/organization.entity";

export interface NavbarProps {
  organizations: Organization[];
  activeOrganization: Organization | null;
  onOrganizationChange: (organizationId: string) => void;
  onCreateOrganization: () => void;
  userFullName: string;
  userEmail: string;
  avatarUrl?: string | null;
  onSignOut: () => void;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "U";
}

export function Navbar({
  organizations,
  activeOrganization,
  onOrganizationChange,
  onCreateOrganization,
  userFullName,
  userEmail,
  avatarUrl,
  onSignOut,
}: NavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent">
          <span className="max-w-48 truncate">
            {activeOrganization?.name ?? "Selecciona una organización"}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No perteneces a ninguna organización todavía.
            </div>
          )}
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => onOrganizationChange(org.id)}
            >
              {org.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onCreateOrganization}>
            <Plus className="size-4" /> Nueva organización
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
          <Avatar>
            <AvatarImage src={avatarUrl ?? undefined} alt={userFullName} />
            <AvatarFallback>{initialsFrom(userFullName)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">
              {userFullName}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {userEmail}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/perfil" className="flex items-center gap-2">
              <UserRound className="size-4" /> Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/configuracion" className="flex items-center gap-2">
              <Settings className="size-4" /> Configuración
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
            <LogOut className="size-4" /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

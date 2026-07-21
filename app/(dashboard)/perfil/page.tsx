"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Moon, Sun } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client/browser";
import type { User } from "@/domain/entities/user.entity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PerfilPage() {
  const router = useRouter();
  const { profile, isLoading: isProfileLoading } = useSession();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setIsDirty(false);
    }
  }, [profile]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setIsSaving(true);

    try {
      await apiFetch<{ profile: User }>("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName }),
      });
      setIsDirty(false);
      setProfileSaved(true);
    } catch (error) {
      setProfileError(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo guardar el perfil.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setIsChangingPassword(true);

    try {
      await apiFetch("/api/v1/auth/update-password", {
        method: "POST",
        body: JSON.stringify({ password: newPassword }),
      });
      setNewPassword("");
      setPasswordSaved(true);
    } catch (error) {
      setPasswordError(
        error instanceof ApiClientError
          ? error.message
          : "No se pudo actualizar la contraseña.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleSignOutAllDevices() {
    setIsSigningOutAll(true);
    try {
      await apiFetch("/api/v1/auth/sign-out-all", { method: "POST" });
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/iniciar-sesion");
      router.refresh();
    } finally {
      setIsSigningOutAll(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Administra tu información personal y tus credenciales de acceso.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSaveProfile} className="contents">
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nombre completo</Label>
              <Input
                id="profile-name"
                required
                disabled={isProfileLoading}
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setIsDirty(true);
                  setProfileSaved(false);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Correo electrónico</Label>
              <Input
                id="profile-email"
                disabled
                value={profile?.email ?? ""}
              />
            </div>
            {profileError && (
              <p className="text-sm text-destructive">{profileError}</p>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-sm text-muted-foreground">
              {profileSaved
                ? "Cambios guardados."
                : isDirty
                  ? "Tienes cambios sin guardar."
                  : ""}
            </span>
            <Button type="submit" disabled={!isDirty || isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Guardar cambios
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleChangePassword} className="contents">
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>
              Elige una nueva contraseña de acceso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setPasswordSaved(false);
                }}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {passwordSaved && (
              <p className="text-sm text-muted-foreground">
                Contraseña actualizada.
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              type="submit"
              disabled={isChangingPassword || newPassword.length === 0}
            >
              {isChangingPassword && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Actualizar contraseña
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias de interfaz</CardTitle>
          <CardDescription>
            Elige el tema del panel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => setTheme("dark")}
          >
            <Moon className="size-4" /> Oscuro
          </Button>
          <Button
            type="button"
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => setTheme("light")}
          >
            <Sun className="size-4" /> Claro
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sesiones activas</CardTitle>
          <CardDescription>
            Cierra la sesión en todos los dispositivos donde hayas iniciado
            sesión.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          <Button
            variant="destructive"
            onClick={handleSignOutAllDevices}
            disabled={isSigningOutAll}
          >
            {isSigningOutAll && <Loader2 className="size-4 animate-spin" />}
            Cerrar sesión en todos los dispositivos
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

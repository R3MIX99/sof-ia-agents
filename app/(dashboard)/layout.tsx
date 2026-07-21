import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionProvider } from "@/context/session-context";
import { ActiveOrganizationProvider } from "@/context/active-organization-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/iniciar-sesion");
  }

  return (
    <SessionProvider>
      <ActiveOrganizationProvider>
        <DashboardShell>{children}</DashboardShell>
      </ActiveOrganizationProvider>
    </SessionProvider>
  );
}

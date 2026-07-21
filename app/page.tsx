import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  redirect(data.user ? "/inicio" : "/iniciar-sesion");
}

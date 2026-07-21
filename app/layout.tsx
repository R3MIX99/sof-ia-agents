import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { THEME_COOKIE_NAME } from "@/lib/constants/theme";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sof.ia — AI Widgets",
  description: "Plataforma SaaS de widgets de inteligencia artificial embebibles.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  // Modo oscuro habilitado por defecto (sección 4); el usuario puede
  // preferir modo claro desde Perfil (9.9), persistido en esta cookie.
  const theme = cookieStore.get(THEME_COOKIE_NAME)?.value === "light" ? "light" : "dark";

  return (
    <html
      lang="es"
      className={`${theme === "dark" ? "dark" : ""} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

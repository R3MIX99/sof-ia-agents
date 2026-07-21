"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_COOKIE_NAME, type Theme } from "@/lib/constants/theme";

function readThemeCookie(): Theme {
  if (typeof document === "undefined") return "dark";
  const match = document.cookie.match(
    new RegExp(`${THEME_COOKIE_NAME}=(dark|light)`),
  );
  return (match?.[1] as Theme | undefined) ?? "dark";
}

/** Hook de preferencia de interfaz (sección 9.9): persiste el tema en una cookie de un año. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(readThemeCookie());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.cookie = `${THEME_COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  return { theme, setTheme };
}

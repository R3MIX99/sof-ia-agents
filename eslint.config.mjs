import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // El stack del blueprint (sección 3) no incluye una librería de
      // obtención de datos (SWR, React Query, etc.), así que "cargar datos
      // en un efecto y sincronizar el estado local" es el patrón elegido
      // para toda la aplicación. Esta regla, orientada a flujos con React
      // Compiler, marcaría como error ese patrón en cada pantalla.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

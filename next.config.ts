import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El loader del widget embebible lee widget-client/core/runtime.js en
  // tiempo de solicitud (sección 13.5); se incluye explícitamente en el
  // rastreo de archivos para que esté disponible en despliegues serverless.
  outputFileTracingIncludes: {
    "/widget-embed/loader": ["./widget-client/core/**"],
  },
};

export default nextConfig;

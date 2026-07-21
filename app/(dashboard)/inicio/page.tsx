import { Home } from "lucide-react";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default function InicioPage() {
  return (
    <PlaceholderScreen
      title="Inicio"
      description="El resumen de la cuenta y los accesos rápidos estarán disponibles en una fase posterior del desarrollo."
      icon={Home}
    />
  );
}

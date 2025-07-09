"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";

interface ZustandProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que garante hidratação correta do Zustand
 * Evita problemas de SSR/hydration mismatch
 */
export default function ZustandProvider({ children }: ZustandProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Aguarda a hidratação completa do store
    const unsubscribe = useCartStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Se já foi hidratado (caso seja chamado após hidratação)
    if (useCartStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  // Durante a hidratação, renderiza loading ou placeholder
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-4xl text-pink-500 animate-pulse">
          Loading LAOS...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

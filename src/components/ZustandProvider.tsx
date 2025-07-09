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
  const [hasTimeout, setHasTimeout] = useState(false);

  useEffect(() => {
    // Timeout fallback para evitar loading infinito
    const timeoutId = setTimeout(() => {
      console.warn("[ZustandProvider] Hydration timeout, proceeding anyway");
      setHasTimeout(true);
      setIsHydrated(true);
    }, 3000); // 3 segundos de timeout

    try {
      // Aguarda a hidratação completa do store
      const unsubscribe = useCartStore.persist.onFinishHydration(() => {
        clearTimeout(timeoutId);
        setIsHydrated(true);
      });

      // Se já foi hidratado (caso seja chamado após hidratação)
      if (useCartStore.persist.hasHydrated()) {
        clearTimeout(timeoutId);
        setIsHydrated(true);
      }

      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error) {
      console.error("[ZustandProvider] Hydration error:", error);
      clearTimeout(timeoutId);
      setIsHydrated(true); // Proceed anyway to prevent infinite loading
    }
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

  // Log warning se foi devido ao timeout
  if (hasTimeout) {
    console.warn("[ZustandProvider] Proceeded due to timeout - cart state may not be fully hydrated");
  }

  return <>{children}</>;
}

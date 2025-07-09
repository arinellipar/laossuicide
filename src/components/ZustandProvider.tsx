"use client";

import React, { useEffect, useState } from "react";
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
    /**
     * Nem todas as versões do middleware "persist" expõem os helpers
     * `onFinishHydration` e `hasHydrated`. Caso eles não existam,
     * consideramos a hidratação concluída logo após o first mount
     * para evitar que a aplicação fique presa eternamente na tela de loading.
     */

    // Tipagem opcional para os helpers retornados por `persist`
    type PersistHelpers = {
      onFinishHydration?: (cb: () => void) => () => void;
      hasHydrated?: () => boolean;
    };

    const persistHelpers: PersistHelpers | undefined = (useCartStore as unknown as {
      persist?: PersistHelpers;
    }).persist;

    // Caso existam helpers de hidratação, utiliza-os.
    if (persistHelpers?.onFinishHydration) {
      const unsubscribe = persistHelpers.onFinishHydration(() => {
        setIsHydrated(true);
      });

      // Hidratação já concluída antes do mount
      if (persistHelpers.hasHydrated?.()) {
        setIsHydrated(true);
      }

      // Cleanup function
      return unsubscribe;
    }

    // Fallback: marca como hidratado imediatamente
    setIsHydrated(true);

    // Nenhum cleanup necessário no fallback
    return undefined;
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

"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="relative mb-8">
          <AlertTriangle className="w-24 h-24 text-red-500 mx-auto" />
          <div className="absolute inset-0 w-24 h-24 bg-red-500 blur-xl opacity-30 mx-auto animate-pulse" />
        </div>

        <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
          Erro no Sistema
        </h1>

        <p className="text-gray-400 mb-8">
          Algo deu errado ao carregar esta página. Nossos cyberpunks já foram
          notificados.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          Tentar Novamente
        </motion.button>
      </motion.div>
    </div>
  );
}

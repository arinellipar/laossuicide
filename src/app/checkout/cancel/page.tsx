"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  XCircle,
  ShoppingCart,
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CheckoutCancelPage() {
  const { itemCount } = useCart();

  // Log cancellation event (analytics)
  useEffect(() => {
    console.log("[Analytics] Checkout cancelled");
    // TODO: Send to analytics service
  }, []);

  const reasons = [
    {
      icon: ShoppingCart,
      title: "Carrinho Salvo",
      description: "Seus itens continuam no carrinho para quando você voltar",
    },
    {
      icon: RotateCcw,
      title: "Tente Novamente",
      description: "Você pode finalizar sua compra a qualquer momento",
    },
    {
      icon: HelpCircle,
      title: "Precisa de Ajuda?",
      description: "Entre em contato conosco se tiver alguma dúvida",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-[200px]" />
        </div>
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
              className="relative"
            >
              <XCircle className="w-32 h-32 text-orange-500" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl"
              />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              Checkout Cancelado
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-400 mb-2"
          >
            Sua compra não foi finalizada
          </motion.p>

          {itemCount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500"
            >
              Você ainda tem {itemCount} {itemCount === 1 ? "item" : "itens"} no
              carrinho
            </motion.p>
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-3 gap-4 mb-12"
        >
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 text-center"
            >
              <reason.icon className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{reason.title}</h3>
              <p className="text-sm text-gray-400">{reason.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/user/merch"
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar à Loja
          </Link>

          {itemCount > 0 && (
            <Link
              href="/checkout"
              className="px-6 py-3 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 rounded-xl font-semibold hover:bg-purple-500/30 transition-colors inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Tentar Novamente
            </Link>
          )}
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500 mb-4">
            Teve algum problema durante o checkout?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Fale Conosco
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

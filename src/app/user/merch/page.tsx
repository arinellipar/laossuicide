"use client";

import { motion } from "framer-motion";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useState } from "react";
import Cart from "@/components/Cart";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import type { ProductCategory } from "@prisma/client";

export default function UserMerchPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | "all">("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { itemCount } = useCart();

  const categories = [
    { id: "all", label: "Todos" },
    { id: "CLOTHING", label: "Vestuário" },
    { id: "ACCESSORIES", label: "Acessórios" },
    { id: "VINYL", label: "Vinil" },
    { id: "DIGITAL", label: "Digital" },
  ];

  const { products, isLoading } = useProducts({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    inStock: true,
  });

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            LOJA OFICIAL
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Vista-se com o estilo cyberpunk do LAOS
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-4 mb-12"
      >
        {categories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedCategory === category.id
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                : "bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-purple-500/30"
            }`}
          >
            {category.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {/* Purchase History */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-20"
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-pink-400" />
          Suas Compras Recentes
        </h2>

        <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
          <div className="space-y-4">
            {[
              {
                item: "Camiseta Cyber Rebellion",
                date: "20/06/2025",
                status: "Enviado",
                tracking: "BR123456789",
              },
              {
                item: "Pin Set Cyberpunk",
                date: "15/06/2025",
                status: "Entregue",
                tracking: "BR987654321",
              },
            ].map((purchase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-purple-500/5 border border-purple-500/20"
              >
                <div>
                  <p className="font-semibold">{purchase.item}</p>
                  <p className="text-sm text-gray-400">
                    Comprado em {purchase.date}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      purchase.status === "Entregue"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {purchase.status}
                  </span>
                  {purchase.status === "Enviado" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Rastreio: {purchase.tracking}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      {/* Floating cart button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg hover:shadow-pink-500/50 focus:outline-none"
      >
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full px-1">
            {itemCount}
          </span>
        )}
      </button>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

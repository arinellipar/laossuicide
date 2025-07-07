"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function UserMerchPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "Todos" },
    { id: "clothing", label: "Vestuário" },
    { id: "accessories", label: "Acessórios" },
    { id: "vinyl", label: "Vinil" },
  ];

  const products = [
    {
      id: 1,
      name: "Camiseta Cyber Rebellion",
      category: "clothing",
      price: 89.9,
      image:
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
      description: "Edição limitada com arte holográfica",
      inStock: true,
      featured: true,
    },
    {
      id: 2,
      name: "Hoodie Neon Dreams",
      category: "clothing",
      price: 189.9,
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
      description: "Com detalhes em LED reativo ao som",
      inStock: true,
      featured: false,
    },
    {
      id: 3,
      name: "Vinil - Cyber Rebellion",
      category: "vinyl",
      price: 149.9,
      image:
        "https://images.unsplash.com/photo-1598743400863-0201c7e1445b?w=400&h=400&fit=crop",
      description: "Vinil colorido transparente edição especial",
      inStock: true,
      featured: true,
    },
    {
      id: 4,
      name: "Pin Set Cyberpunk",
      category: "accessories",
      price: 39.9,
      image:
        "https://images.unsplash.com/photo-1608889335681-3b7aa58c5443?w=400&h=400&fit=crop",
      description: "5 pins exclusivos da banda",
      inStock: true,
      featured: false,
    },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

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
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="group relative"
          >
            {/* Featured badge */}
            {product.featured && (
              <div className="absolute -top-3 -right-3 z-10">
                <div className="relative">
                  <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                  <div className="absolute inset-0 blur-xl bg-yellow-400/50" />
                </div>
              </div>
            )}

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30 h-full">
              {/* Product image */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Quick actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/20"
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Out of stock overlay */}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <p className="text-2xl font-bold text-gray-500">ESGOTADO</p>
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                <p className="text-gray-400 mb-4">{product.description}</p>

                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-pink-400">
                    R$ {product.price.toFixed(2)}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={!product.inStock}
                    className={`p-3 rounded-full ${
                      product.inStock
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:shadow-lg hover:shadow-pink-500/50"
                        : "bg-gray-700 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
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
    </div>
  );
}

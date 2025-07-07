"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingCart, Star, Package } from "lucide-react";
import { useState } from "react";

export default function MerchPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "Todos" },
    { id: "clothing", label: "Vestuário" },
    { id: "accessories", label: "Acessórios" },
    { id: "vinyl", label: "Vinil" },
    { id: "digital", label: "Digital" },
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
    {
      id: 5,
      name: "Digital Album Bundle",
      category: "digital",
      price: 29.9,
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      description: "Todos os álbuns + conteúdo exclusivo",
      inStock: true,
      featured: false,
    },
    {
      id: 6,
      name: "Poster Holográfico",
      category: "accessories",
      price: 59.9,
      image:
        "https://images.unsplash.com/photo-1620987278429-ab178d6c28c1?w=400&h=400&fit=crop",
      description: "60x90cm com efeito 3D",
      inStock: false,
      featured: false,
    },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              MERCH OFICIAL
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Vista-se com a revolução cyberpunk
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
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

                  {/* Out of stock overlay */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <p className="text-2xl font-bold text-gray-500">
                        ESGOTADO
                      </p>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    {product.name}
                  </h3>
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

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Shipping Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-8 backdrop-blur-xl border border-purple-500/30"
        >
          <div className="flex items-center gap-4 mb-6">
            <Package className="w-8 h-8 text-pink-400" />
            <h2 className="text-3xl font-bold">Informações de Envio</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-purple-400 mb-2">
                Frete Grátis
              </h3>
              <p className="text-gray-400">Para compras acima de R$ 200,00</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-400 mb-2">
                Entrega Expressa
              </h3>
              <p className="text-gray-400">1-3 dias úteis para capitais</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-400 mb-2">
                Garantia
              </h3>
              <p className="text-gray-400">30 dias de satisfação garantida</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

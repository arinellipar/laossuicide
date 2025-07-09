"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingBag, Package, TrendingUp, Star } from "lucide-react";

export default function MerchPage() {
  const products = [
    {
      id: 1,
      name: "Camiseta Cyber Rebellion",
      price: "R$ 89,90",
      image:
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
      stock: 45,
      sold: 128,
      rating: 4.8,
    },
    {
      id: 2,
      name: "Moletom Neon Dreams",
      price: "R$ 179,90",
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
      stock: 23,
      sold: 87,
      rating: 4.9,
    },
    {
      id: 3,
      name: "Boné Holográfico LAOS",
      price: "R$ 69,90",
      image:
        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop",
      stock: 67,
      sold: 203,
      rating: 4.7,
    },
    {
      id: 4,
      name: "Poster Digital Void",
      price: "R$ 39,90",
      image:
        "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=400&fit=crop",
      stock: 15,
      sold: 342,
      rating: 5.0,
    },
  ];

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            MERCH STORE
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Gerencie os produtos cyberpunk da loja
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          {
            label: "Total Vendido",
            value: "R$ 12.4K",
            icon: TrendingUp,
            change: "+23%",
          },
          {
            label: "Produtos Ativos",
            value: "24",
            icon: Package,
            change: "+4",
          },
          {
            label: "Pedidos Hoje",
            value: "18",
            icon: ShoppingBag,
            change: "+12%",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-pink-400" />
                <span className="text-green-400 text-sm font-bold">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Product Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mb-8 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold flex items-center gap-2"
        style={{
          boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
        }}
      >
        <Package className="w-5 h-5" />
        Adicionar Produto
      </motion.button>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30">
              {/* Product Image */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                {/* Stock Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-xl rounded-full border border-purple-500/30">
                  <span className="text-sm font-semibold">
                    {product.stock} em estoque
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-pink-400">
                    {product.price}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-400">
                      {product.rating}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{product.sold} vendidos</span>
                  <button className="text-purple-400 hover:text-pink-400 font-semibold transition-colors">
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

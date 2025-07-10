"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Trash2, ArrowLeft, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const {
    items,
    summary,
    isLoading,
    isEmpty,
    formattedTotal,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-black px-4 md:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/products"
                className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar aos produtos
              </Link>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                CARRINHO
              </span>
            </h1>
          </motion.div>

          {/* Empty Cart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">
              Seu carrinho está vazio
            </h3>
            <p className="text-gray-400 mb-8">
              Adicione alguns produtos para começar suas compras
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/25 transition-all"
            >
              <Package className="w-5 h-5" />
              Ver Produtos
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/products"
              className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Continuar comprando
            </Link>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              CARRINHO
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            {summary.totalItems} {summary.totalItems === 1 ? "item" : "itens"} no carrinho
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
                >
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{item.product.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{item.product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-pink-400">
                          R$ {Number(item.product.price).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                              className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Cart Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 sticky top-8">
              <h3 className="text-2xl font-bold mb-6">Resumo do Pedido</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>R$ {summary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Impostos</span>
                  <span>R$ {summary.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Frete</span>
                  <span className={summary.shipping === 0 ? "text-green-400" : ""}>
                    {summary.shipping === 0 ? "Grátis" : `R$ ${summary.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-purple-500/30 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-pink-400">{formattedTotal}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                  Finalizar Compra
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-all"
                >
                  Limpar Carrinho
                </button>
              </div>

              {summary.shipping > 0 && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    Adicione mais R$ {(200 - summary.subtotal).toFixed(2)} para frete grátis!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
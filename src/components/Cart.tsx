/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module Cart
 * @description Componente de carrinho de compras com design cyberpunk LAOS
 *
 * Features:
 * - Slide-over panel com backdrop blur
 * - Animações com Framer Motion
 * - Optimistic UI updates
 * - Skeleton loading states
 * - Empty state ilustrado
 * - Resumo de valores em tempo real
 * - Botões de quantidade com debounce
 * - Swipe to delete em mobile
 *
 * Design System:
 * - Cores: Pink (#ec4899) e Purple (#a855f7)
 * - Glassmorphism effects
 * - Neon glows e gradients
 * - Tipografia futurista
 */

"use client";

import { Fragment, useState, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import Image from "next/image";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import React from "react";

// ============= INTERFACES =============
interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: string | number;
      image: string;
      category: string;
      stockQuantity: number;
    };
    subtotal: number;
  };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  isUpdating: boolean;
}

// ============= HELPER FUNCTIONS =============
const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    CLOTHING: "from-pink-500 to-rose-500",
    ACCESSORIES: "from-purple-500 to-indigo-500",
    VINYL: "from-cyan-500 to-blue-500",
    DIGITAL: "from-green-500 to-emerald-500",
  };
  return colors[category] || "from-gray-500 to-gray-600";
};

// ============= CART ITEM COMPONENT =============
const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [isRemoving, setIsRemoving] = useState(false);

  // Debounce quantity updates
  const debouncedQuantity = useDebounce(localQuantity, 500);

  // Sync with server after debounce
  React.useEffect(() => {
    if (debouncedQuantity !== item.quantity && debouncedQuantity > 0) {
      onUpdateQuantity(item.productId, debouncedQuantity);
    }
  }, [debouncedQuantity, item.quantity, item.productId, onUpdateQuantity]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(0, Math.min(10, localQuantity + delta));
    if (newQuantity === 0) {
      handleRemove();
    } else {
      setLocalQuantity(newQuantity);
    }
  };

  const handleRemove = () => {
    setIsRemoving(true);
    onRemove(item.productId);
  };

  // Swipe to delete handler
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      handleRemove();
    }
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="relative group"
    >
      {/* Swipe indicator */}
      <div className="absolute inset-y-0 -right-2 w-20 bg-gradient-to-l from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-4 pointer-events-none">
        <Trash2 className="w-4 h-4 text-red-400" />
      </div>

      <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/20 hover:border-pink-500/30 transition-all duration-300">
        {/* Loading overlay */}
        {(isUpdating || isRemoving) && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="flex gap-4">
          {/* Product image */}
          <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={item.product.image}
              alt={item.product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(
                item.product.category
              )} opacity-20`}
            />
          </div>

          {/* Product details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate pr-8">
              {item.product.name}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {formatCurrency(item.product.price)}
            </p>

            {/* Quantity controls */}
            <div className="flex items-center gap-3 mt-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleQuantityChange(-1)}
                disabled={isUpdating}
                className="w-8 h-8 rounded-lg bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center hover:bg-purple-500/30 transition-colors disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </motion.button>

              <span className="w-12 text-center font-semibold">
                {localQuantity}
              </span>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleQuantityChange(1)}
                disabled={isUpdating || localQuantity >= 10}
                className="w-8 h-8 rounded-lg bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center hover:bg-purple-500/30 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </motion.button>

              {/* Stock warning */}
              {localQuantity >= item.product.stockQuantity && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Limite
                </span>
              )}
            </div>
          </div>

          {/* Remove button - desktop only */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRemove}
            className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 backdrop-blur-xl border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </motion.button>
        </div>

        {/* Subtotal */}
        <div className="mt-3 pt-3 border-t border-purple-500/20 flex justify-between items-center">
          <span className="text-sm text-gray-400">Subtotal</span>
          <span className="font-semibold text-pink-400">
            {formatCurrency(Number(item.product.price) * localQuantity)}
          </span>
        </div>
      </div>
    </motion.li>
  );
};

// ============= EMPTY STATE COMPONENT =============
const EmptyState: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 px-8"
  >
    <div className="relative mb-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-3xl opacity-20"
      />
      <ShoppingBag className="w-32 h-32 text-purple-500 relative z-10" />
    </div>

    <h3 className="text-2xl font-bold mb-2">Carrinho Vazio</h3>
    <p className="text-gray-400 text-center mb-8">
      Adicione produtos cyberpunk ao seu carrinho
    </p>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClose}
      className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-semibold flex items-center gap-2"
    >
      <Zap className="w-5 h-5" />
      Continuar Comprando
    </motion.button>
  </motion.div>
);

// ============= SKELETON LOADER =============
const SkeletonLoader: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/20"
      >
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-xl bg-purple-500/20 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-purple-500/20 rounded-lg animate-pulse" />
            <div className="h-4 bg-purple-500/20 rounded-lg w-1/3 animate-pulse" />
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg animate-pulse" />
              <div className="w-12 h-8 bg-purple-500/20 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ============= MAIN CART COMPONENT =============
export default function Cart({ isOpen, onClose }: CartProps) {
  const router = useRouter();
  const {
    items,
    summary,
    isLoading,
    isError,
    isEmpty,
    updateQuantity,
    removeItem,
    formattedTotal,
  } = useCart();

  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleUpdateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      setIsUpdating(productId);
      try {
        await updateQuantity(productId, quantity);
      } finally {
        setIsUpdating(null);
      }
    },
    [updateQuantity]
  );

  const handleRemoveItem = useCallback(
    async (productId: string) => {
      setIsUpdating(productId);
      try {
        await removeItem(productId);
      } finally {
        setIsUpdating(null);
      }
    },
    [removeItem]
  );

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  // Calcular informações de frete
  const freeShippingThreshold = 200;
  const remainingForFreeShipping = Math.max(
    0,
    freeShippingThreshold - summary.subtotal
  );
  const freeShippingProgress = Math.min(
    100,
    (summary.subtotal / freeShippingThreshold) * 100
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        {/* Slide-over panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-black/90 backdrop-blur-2xl shadow-xl border-l border-purple-500/30">
                    {/* Header */}
                    <div className="flex items-start justify-between px-6 py-6 border-b border-purple-500/20">
                      <Dialog.Title className="text-2xl font-bold">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                          Carrinho
                        </span>
                      </Dialog.Title>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 rounded-xl bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>

                    {/* Free shipping progress */}
                    {!isEmpty && remainingForFreeShipping > 0 && (
                      <div className="px-6 py-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-pink-400" />
                          <p className="text-sm">
                            Faltam{" "}
                            <span className="font-semibold text-pink-400">
                              {formatCurrency(remainingForFreeShipping)}
                            </span>{" "}
                            para frete grátis!
                          </p>
                        </div>
                        <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${freeShippingProgress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      {isLoading ? (
                        <SkeletonLoader />
                      ) : isError ? (
                        <div className="text-center py-8">
                          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                          <p className="text-red-400">
                            Erro ao carregar carrinho
                          </p>
                        </div>
                      ) : isEmpty ? (
                        <EmptyState onClose={onClose} />
                      ) : (
                        <ul className="space-y-4">
                          <AnimatePresence mode="popLayout">
                            {items.map((item) => (
                              <CartItem
                                key={item.id}
                                item={{
                                  ...item,
                                  subtotal: item.subtotal ?? (Number(item.product.price) * item.quantity),
                                  product: {
                                    ...item.product,
                                    price:
                                      typeof item.product.price === "object" &&
                                      "toNumber" in item.product.price
                                        ? item.product.price.toNumber()
                                        : item.product.price,
                                  },
                                }}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveItem}
                                isUpdating={isUpdating === item.productId}
                              />
                            ))}
                          </AnimatePresence>
                        </ul>
                      )}
                    </div>

                    {/* Summary and checkout */}
                    {!isEmpty && !isLoading && (
                      <div className="border-t border-purple-500/20 px-6 py-6">
                        {/* Summary details */}
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Subtotal</span>
                            <span>{formatCurrency(summary.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Impostos</span>
                            <span>{formatCurrency(summary.tax)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Truck className="w-4 h-4" />
                              Frete
                            </span>
                            <span
                              className={
                                summary.shipping === 0 ? "text-green-400" : ""
                              }
                            >
                              {summary.shipping === 0
                                ? "Grátis"
                                : formatCurrency(summary.shipping)}
                            </span>
                          </div>
                          <div className="border-t border-purple-500/20 pt-3">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                                {formattedTotal}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCheckout}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
                          >
                            <CreditCard className="w-5 h-5" />
                            Finalizar Compra
                            <ArrowRight className="w-5 h-5" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="w-full py-3 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 rounded-xl font-semibold hover:bg-purple-500/30 transition-colors"
                          >
                            Continuar Comprando
                          </motion.button>
                        </div>

                        {/* Security badges */}
                        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Entrega Garantida
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Checkout Seguro
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

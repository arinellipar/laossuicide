/**
 * @module ProductCard
 * @description Componente de card de produto otimizado para performance e UX
 *
 * Features:
 * - Lazy loading de imagens com placeholder
 * - Animações fluidas com Framer Motion
 * - Estados de loading e erro
 * - Botões de ação com feedback visual
 * - Indicadores de estoque e promoção
 * - Acessibilidade ARIA completa
 * - Design cyberpunk LAOS
 */

"use client";

import React, { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Heart,
  Star,
  Eye,
  Package,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { Product } from "@/hooks/useProducts";
import { toast } from "react-hot-toast";
import Decimal from "decimal.js";

// ============= TYPE DEFINITIONS =============
interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact" | "featured";
  showQuickView?: boolean;
  showFavorite?: boolean;
  className?: string;
  onQuickView?: (product: Product) => void;
  priority?: boolean; // For Image component
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

const getStockStatus = (stockQuantity: number, inStock: boolean) => {
  if (!inStock || stockQuantity === 0) {
    return { status: "out", color: "text-red-400", text: "Esgotado" };
  }
  if (stockQuantity < 5) {
    return {
      status: "low",
      color: "text-yellow-400",
      text: "Últimas unidades",
    };
  }
  return { status: "available", color: "text-green-400", text: "Disponível" };
};

// ============= LOADING SKELETON =============
const ProductCardSkeleton = memo(() => (
  <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/30 animate-pulse">
    <div className="aspect-square rounded-xl bg-purple-500/20 mb-4" />
    <div className="space-y-3">
      <div className="h-6 bg-purple-500/20 rounded-lg" />
      <div className="h-4 bg-purple-500/20 rounded-lg w-3/4" />
      <div className="h-8 bg-purple-500/20 rounded-lg w-1/2" />
    </div>
  </div>
));

ProductCardSkeleton.displayName = "ProductCardSkeleton";

// ============= MAIN COMPONENT =============
const ProductCard: React.FC<ProductCardProps> = memo(
  ({
    product,
    variant = "default",
    showQuickView = true,
    showFavorite = true,
    className = "",
    onQuickView,
    priority = false,
  }) => {
    // ===== HOOKS =====
    const { addItem, getItemQuantity, isItemInCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();

    // ===== LOCAL STATE =====
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [isImageError, setIsImageError] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    // ===== COMPUTED VALUES =====
    const itemQuantity = getItemQuantity(product.id);
    const isInCart = isItemInCart(product.id);
    const stockStatus = getStockStatus(product.stockQuantity, product.inStock);
    const categoryGradient = getCategoryColor(product.category);

    // ===== HANDLERS =====
    const handleAddToCart = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.inStock || product.stockQuantity <= 0) {
          toast.error("Produto fora de estoque");
          return;
        }

        setIsAddingToCart(true);
        try {
          await addItem(
            {
              ...product,
              price:
                typeof product.price === "string" ||
                typeof product.price === "number"
                  ? new Decimal(product.price)
                  : product.price,
              metadata: product.metadata ?? {},
              stripeProductId: product.stripeProductId ?? null,
              stripePriceId: product.stripePriceId ?? null,
              createdAt: product.createdAt
                ? new Date(product.createdAt)
                : new Date(),
              updatedAt: product.updatedAt
                ? new Date(product.updatedAt)
                : new Date(),
            },
            1
          );

          // Success feedback
          toast.success("Adicionado ao carrinho!", {
            style: {
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid rgba(236, 72, 153, 0.3)",
            },
          });
        } catch (error) {
          console.error("Error adding to cart:", error);
          toast.error("Erro ao adicionar ao carrinho");
        } finally {
          setIsAddingToCart(false);
        }
      },
      [product, addItem]
    );

    const handleToggleFavorite = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsTogglingFavorite(true);
        try {
          await toggleFavorite(product.id);
        } catch (error) {
          console.error("Error toggling favorite:", error);
        } finally {
          setIsTogglingFavorite(false);
        }
      },
      [product.id, toggleFavorite]
    );

    const handleQuickView = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onQuickView?.(product);
      },
      [product, onQuickView]
    );

    const handleImageLoad = useCallback(() => {
      setIsImageLoading(false);
    }, []);

    const handleImageError = useCallback(() => {
      setIsImageLoading(false);
      setIsImageError(true);
    }, []);

    // ===== VARIANTS CONFIGURATION =====
    const variantConfig = {
      default: {
        container:
          "group relative bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30 hover:border-pink-500/50 transition-all duration-300",
        image: "aspect-square",
        content: "p-6",
      },
      compact: {
        container:
          "group relative bg-black/40 backdrop-blur-xl rounded-xl overflow-hidden border border-purple-500/20 hover:border-pink-500/30 transition-all duration-300",
        image: "aspect-[4/3]",
        content: "p-4",
      },
      featured: {
        container:
          "group relative bg-black/60 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-gradient-to-r from-pink-500/50 to-purple-500/50 hover:border-pink-500/70 transition-all duration-500",
        image: "aspect-[3/2]",
        content: "p-8",
      },
    };

    const config = variantConfig[variant];

    // ===== RENDER =====
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
        className={`${config.container} ${className}`}
      >
        {/* Background gradient effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

        {/* Product badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {product.featured && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold">
              <Star className="w-3 h-3 fill-current" />
              <span>Destaque</span>
            </div>
          )}

          {stockStatus.status === "low" && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-full text-xs font-medium text-yellow-400">
              <TrendingUp className="w-3 h-3" />
              <span>Últimas unidades</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {showFavorite && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              className={`p-2 rounded-full backdrop-blur-xl border transition-all ${
                isFavorite(product.id)
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                  : "bg-black/50 border-white/20 text-white hover:text-pink-400"
              }`}
              aria-label={
                isFavorite(product.id)
                  ? "Remover dos favoritos"
                  : "Adicionar aos favoritos"
              }
            >
              {isTogglingFavorite ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite(product.id) ? "fill-current" : ""
                  }`}
                />
              )}
            </motion.button>
          )}

          {showQuickView && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleQuickView}
              className="p-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 text-white hover:text-purple-400 transition-colors"
              aria-label="Visualização rápida"
            >
              <Eye className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Product link wrapper */}
        <Link href={`/products/${product.id}`} className="block">
          {/* Product image */}
          <div
            className={`relative ${config.image} overflow-hidden bg-gradient-to-br ${categoryGradient} opacity-20`}
          >
            <AnimatePresence>
              {isImageLoading && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50"
                >
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {!isImageError ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                onLoad={handleImageLoad}
                onError={handleImageError}
                priority={priority}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Package className="w-12 h-12 text-purple-400" />
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Stock status overlay */}
            {stockStatus.status === "out" && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 font-bold">Esgotado</p>
                </div>
              </div>
            )}
          </div>

          {/* Product content */}
          <div className={config.content}>
            {/* Category badge */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`px-2 py-1 rounded-full bg-gradient-to-r ${categoryGradient} text-xs font-medium`}
              >
                {product.category}
              </div>
              {isInCart && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full text-xs text-green-400">
                  <Package className="w-3 h-3" />
                  <span>No carrinho ({itemQuantity})</span>
                </div>
              )}
            </div>

            {/* Product name */}
            <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-pink-400 transition-colors">
              {product.name}
            </h3>

            {/* Product description */}
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
              {product.description}
            </p>

            {/* Price and stock info */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                  {formatCurrency(product.price)}
                </p>
                <p className={`text-xs ${stockStatus.color}`}>
                  {stockStatus.text}
                </p>
              </div>

              {variant === "featured" && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Premium</span>
                </div>
              )}
            </div>

            {/* Action button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              disabled={
                !product.inStock || product.stockQuantity <= 0 || isAddingToCart
              }
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                !product.inStock || product.stockQuantity <= 0
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : isInCart
                  ? "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                  : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg hover:shadow-pink-500/25"
              }`}
            >
              {isAddingToCart ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : !product.inStock || product.stockQuantity <= 0 ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Indisponível
                </>
              ) : isInCart ? (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Adicionado
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Adicionar ao Carrinho
                </>
              )}
            </motion.button>
          </div>
        </Link>

        {/* Hover effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
      </motion.div>
    );
  }
);

ProductCard.displayName = "ProductCard";

// ============= EXPORTS =============
export default ProductCard;
export { ProductCardSkeleton };

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Grid, List, ShoppingCart } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { useCart } from "@/hooks/useCart";

// Define ProductCategory type locally
type ProductCategory = "CLOTHING" | "ACCESSORIES" | "VINYL" | "DIGITAL";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [showFeatured, setShowFeatured] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get cart data for UI feedback
  const { itemCount } = useCart();

  // Build filters
  const filters = useMemo(() => ({
    category: selectedCategory,
    featured: showFeatured,
    inStock: showInStock,
    search: searchQuery,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  }), [selectedCategory, showFeatured, showInStock, searchQuery]);

  // Fetch products
  const { products, pagination, isLoading, isError, error } = useProducts(filters, {
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Categories for filter
  const categories: Array<{ value: ProductCategory | "all"; label: string }> = [
    { value: "all", label: "Todos" },
    { value: "CLOTHING", label: "Roupas" },
    { value: "ACCESSORIES", label: "Acessórios" },
    { value: "VINYL", label: "Vinil" },
    { value: "DIGITAL", label: "Digital" },
  ];

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Erro ao carregar produtos</h2>
          <p className="text-gray-400">{error?.message || "Tente novamente mais tarde"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 md:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-black mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                PRODUTOS
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              Descubra nossa coleção cyberpunk
            </p>
          </div>
          
          {/* Cart indicator */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30">
              <ShoppingCart className="w-5 h-5 text-pink-400" />
              <span className="text-white font-semibold">{itemCount}</span>
            </div>
            {itemCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">{itemCount}</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30 text-white placeholder-gray-400 focus:border-pink-500/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | "all")}
              className="w-full pl-12 pr-4 py-3 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30 text-white focus:border-pink-500/50 focus:outline-none transition-colors appearance-none"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-xl border transition-all ${
                viewMode === "grid"
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                  : "bg-black/50 border-purple-500/30 text-gray-400 hover:text-white"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-xl border transition-all ${
                viewMode === "list"
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                  : "bg-black/50 border-purple-500/30 text-gray-400 hover:text-white"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFeatured}
              onChange={(e) => setShowFeatured(e.target.checked)}
              className="w-4 h-4 text-pink-500 bg-black border-purple-500/30 rounded focus:ring-pink-500/50"
            />
            <span className="text-gray-300">Apenas destaque</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInStock}
              onChange={(e) => setShowInStock(e.target.checked)}
              className="w-4 h-4 text-pink-500 bg-black border-purple-500/30 rounded focus:ring-pink-500/50"
            />
            <span className="text-gray-300">Apenas em estoque</span>
          </label>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <p className="text-gray-400">
          {isLoading ? "Carregando..." : `${pagination?.total || 0} produtos encontrados`}
        </p>
      </motion.div>

      {/* Products Grid */}
      {isLoading ? (
        <div className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        }`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-300 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-400">
            Tente ajustar os filtros ou buscar por outro termo
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          }`}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard
                product={product}
                variant={viewMode === "list" ? "compact" : "default"}
                showQuickView={true}
                showFavorite={true}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Load More Button */}
      {pagination?.hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-12"
        >
          <button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/25 transition-all">
            Carregar mais produtos
          </button>
        </motion.div>
      )}
    </div>
  );
}
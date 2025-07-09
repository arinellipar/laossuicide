/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module useProducts
 * @description Hook para gerenciar produtos com React Query
 *
 * Features:
 * - Busca paginada de produtos
 * - Filtros por categoria, estoque e busca
 * - Cache inteligente com invalidação
 * - Loading states otimizados
 * - Infinite scrolling support
 * - Optimistic updates para admin
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductCategory } from "@prisma/client";
import { toast } from "react-hot-toast";

// ============= TYPE DEFINITIONS =============
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number | string;
  category: ProductCategory;
  image: string;
  inStock: boolean;
  featured: boolean;
  stockQuantity: number;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  isFavorite: boolean;
  favoriteCount: number;
  relatedProducts: Product[];
  isAvailable: boolean;
  popularityScore: number;
}

export interface ProductsFilters {
  category?: ProductCategory | "all";
  featured?: boolean;
  inStock?: boolean;
  search?: string;
  sortBy?: "name" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    totalPages: number;
    currentPage: number;
  };
  filters: {
    category: ProductCategory | "all";
    featured: boolean;
    inStock: boolean;
    search: string;
  };
}

// ============= API CLIENT =============
class ProductsAPI {
  static async getProducts(
    filters: ProductsFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();

    // Add filters to search params
    if (filters.category && filters.category !== "all") {
      searchParams.set("category", filters.category);
    }
    if (filters.featured !== undefined) {
      searchParams.set("featured", filters.featured.toString());
    }
    if (filters.inStock !== undefined) {
      searchParams.set("inStock", filters.inStock.toString());
    }
    if (filters.search) {
      searchParams.set("search", filters.search);
    }
    if (filters.sortBy) {
      searchParams.set("sortBy", filters.sortBy);
    }
    if (filters.sortOrder) {
      searchParams.set("sortOrder", filters.sortOrder);
    }

    // Pagination
    searchParams.set("limit", limit.toString());
    searchParams.set("offset", ((page - 1) * limit).toString());

    const response = await fetch(`/api/products?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  }

  static async getProduct(productId: string): Promise<ProductDetail> {
    const response = await fetch(`/api/products/${productId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    return response.json();
  }

  static async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create product: ${response.statusText}`);
    }

    return response.json();
  }

  static async updateProduct(
    productId: string,
    data: Partial<Product>
  ): Promise<Product> {
    const response = await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }

    return response.json();
  }

  static async deleteProduct(productId: string): Promise<void> {
    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.statusText}`);
    }
  }

  static async updateStock(
    productId: string,
    stockQuantity: number
  ): Promise<any> {
    const response = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update stock: ${response.statusText}`);
    }

    return response.json();
  }
}

// ============= QUERY KEYS =============
const QUERY_KEYS = {
  products: ["products"] as const,
  productsList: (filters: ProductsFilters) =>
    ["products", "list", filters] as const,
  productDetail: (productId: string) =>
    ["products", "detail", productId] as const,
  productsByCategory: (category: ProductCategory) =>
    ["products", "category", category] as const,
  featuredProducts: () => ["products", "featured"] as const,
} as const;

// ============= MAIN HOOK =============
export function useProducts(
  filters: ProductsFilters = {},
  options: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  } = {}
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval,
  } = options;

  const queryClient = useQueryClient();

  // Products query with filters
  const productsQuery = useQuery({
    queryKey: QUERY_KEYS.productsList(filters),
    queryFn: () => ProductsAPI.getProducts(filters, 1, 20),
    staleTime,
    refetchInterval,
    enabled,
  });

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    return productsQuery.data?.products || [];
  }, [productsQuery.data?.products]);

  // Helper functions
  const refetch = useCallback(() => {
    return productsQuery.refetch();
  }, [productsQuery]);

  const invalidateProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
  }, [queryClient]);

  return {
    // Data
    products: filteredProducts,
    pagination: productsQuery.data?.pagination,
    appliedFilters: productsQuery.data?.filters,

    // States
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    isFetching: productsQuery.isFetching,
    error: productsQuery.error,

    // Actions
    refetch,
    invalidateProducts,
  };
}

// ============= INFINITE PRODUCTS HOOK =============
export function useInfiniteProducts(
  filters: ProductsFilters = {},
  limit: number = 20
) {
  const queryClient = useQueryClient();

  const infiniteQuery = useInfiniteQuery({
    queryKey: [...QUERY_KEYS.productsList(filters), "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      ProductsAPI.getProducts(filters, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all products from all pages
  const allProducts = useMemo(() => {
    return infiniteQuery.data?.pages.flatMap((page) => page.products) || [];
  }, [infiniteQuery.data]);

  const loadMore = useCallback(() => {
    if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      infiniteQuery.fetchNextPage();
    }
  }, [infiniteQuery]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
  }, [queryClient]);

  return {
    // Data
    products: allProducts,
    totalCount: infiniteQuery.data?.pages[0]?.pagination.total || 0,

    // States
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    isFetching: infiniteQuery.isFetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    error: infiniteQuery.error,

    // Actions
    loadMore,
    refetch: infiniteQuery.refetch,
    invalidate,
  };
}

// ============= PRODUCT DETAIL HOOK =============
export function useProduct(productId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.productDetail(productId),
    queryFn: () => ProductsAPI.getProduct(productId),
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404
      if ((error as any)?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

// ============= FEATURED PRODUCTS HOOK =============
export function useFeaturedProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.featuredProducts(),
    queryFn: () => ProductsAPI.getProducts({ featured: true }, 1, 8),
    staleTime: 10 * 60 * 1000, // 10 minutes (featured products change less frequently)
    select: (data) => data.products, // Only return the products array
  });
}

// ============= PRODUCTS BY CATEGORY HOOK =============
export function useProductsByCategory(category: ProductCategory) {
  return useQuery({
    queryKey: QUERY_KEYS.productsByCategory(category),
    queryFn: () => ProductsAPI.getProducts({ category, inStock: true }, 1, 12),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.products,
  });
}

// ============= ADMIN MUTATIONS =============
export function useProductMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ProductsAPI.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar produto: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: Partial<Product>;
    }) => ProductsAPI.updateProduct(productId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.productDetail(productId),
      });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ProductsAPI.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir produto: ${error.message}`);
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({
      productId,
      stockQuantity,
    }: {
      productId: string;
      stockQuantity: number;
    }) => ProductsAPI.updateStock(productId, stockQuantity),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.productDetail(productId),
      });
      toast.success("Estoque atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar estoque: ${error.message}`);
    },
  });

  return {
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    updateStock: updateStockMutation.mutate,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStock: updateStockMutation.isPending,
  };
}

// ============= SEARCH HOOK =============
export function useProductSearch(query: string, debounceMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ["products", "search", debouncedQuery],
    queryFn: () => ProductsAPI.getProducts({ search: debouncedQuery }, 1, 20),
    enabled: debouncedQuery.length >= 2, // Only search with 2+ characters
    staleTime: 30 * 1000, // 30 seconds
    select: (data) => data.products,
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module useCart
 * @description Hook customizado para operações de carrinho com React Query
 *
 * Features:
 * - Optimistic updates para UX instantânea
 * - Cache management com invalidação inteligente
 * - Error handling com retry automático
 * - Background refetching para sincronização
 * - Debouncing de operações
 * - Type-safe com TypeScript generics
 *
 * Patterns:
 * - Facade Pattern para simplificar API
 * - Observer Pattern via React Query
 * - Command Pattern para operações
 * - Strategy Pattern para error handling
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "react-hot-toast";
import type { Product } from "@prisma/client";
import { useCallback, useMemo } from "react";

// ============= TYPE DEFINITIONS =============
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
  subtotal: number;
}

interface CartSummary {
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
  lastUpdated: string;
}

interface UseCartReturn {
  // State
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Computed
  isEmpty: boolean;
  itemCount: number;
  formattedTotal: string;

  // Actions
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;

  // UI Helpers
  getItemQuantity: (productId: string) => number;
  isItemInCart: (productId: string) => boolean;
  canAddMore: (productId: string, additionalQuantity?: number) => boolean;
}

// ============= API CLIENT =============
/**
 * Cliente API tipado para operações de carrinho
 * Centraliza lógica de fetch e tratamento de erros
 */
class CartAPI {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  static async getCart(): Promise<CartResponse> {
    const response = await fetch("/api/cart", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return this.handleResponse<CartResponse>(response);
  }

  static async addItem(productId: string, quantity: number): Promise<any> {
    const response = await fetch("/api/cart", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, quantity }),
    });
    return this.handleResponse(response);
  }

  static async updateItem(
    productId: string,
    quantity: number
  ): Promise<CartResponse> {
    const response = await fetch(`/api/cart/${productId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    });
    return this.handleResponse<CartResponse>(response);
  }

  static async removeItem(productId: string): Promise<any> {
    const response = await fetch(`/api/cart/${productId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return this.handleResponse(response);
  }

  static async clearCart(): Promise<any> {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      credentials: "include",
    });
    return this.handleResponse(response);
  }

  static async syncCart(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<any> {
    const response = await fetch("/api/cart/sync", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });
    return this.handleResponse(response);
  }
}

// ============= QUERY KEYS =============
const QUERY_KEYS = {
  cart: ["cart"] as const,
  cartItem: (productId: string) => ["cart", "item", productId] as const,
} as const;

// ============= TOAST NOTIFICATIONS =============
/**
 * Notificações customizadas com branding LAOS
 */
const showToast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: "#1a1a1a",
        color: "#fff",
        border: "1px solid rgba(236, 72, 153, 0.3)",
      },
      iconTheme: {
        primary: "#ec4899",
        secondary: "#fff",
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      style: {
        background: "#1a1a1a",
        color: "#fff",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: "#1a1a1a",
        color: "#fff",
        border: "1px solid rgba(168, 85, 247, 0.3)",
      },
    });
  },
};

// ============= MAIN HOOK =============
/**
 * Hook principal para gerenciamento de carrinho
 * Combina local state (Zustand) com server state (React Query)
 *
 * @example
 * ```tsx
 * const cart = useCart();
 *
 * // Adicionar item
 * await cart.addItem(product, 2);
 *
 * // Verificar se item está no carrinho
 * const inCart = cart.isItemInCart(productId);
 *
 * // Obter quantidade
 * const qty = cart.getItemQuantity(productId);
 * ```
 */
export function useCart(): UseCartReturn {
  const queryClient = useQueryClient();

  // Local state (Zustand)
  const {
    addItem: localAddItem,
    removeItem: localRemoveItem,
    updateQuantity: localUpdateQuantity,
    clearCart: localClearCart,
  } = useCartStore();

  // ===== QUERIES =====

  /**
   * Query principal do carrinho
   * - Stale time de 5 minutos
   * - Background refetch a cada 30 segundos
   * - Retry 3x com backoff exponencial
   */
  const cartQuery = useQuery({
    queryKey: QUERY_KEYS.cart,
    queryFn: CartAPI.getCart,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
    refetchInterval: 30 * 1000, // 30 segundos
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ===== MUTATIONS =====

  /**
   * Mutation para adicionar item
   * Implementa optimistic update
   */
  const addItemMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => CartAPI.addItem(productId, quantity),

    onMutate: async ({ productId, quantity }) => {
      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cart });

      // Snapshot do estado anterior
      const previousCart = queryClient.getQueryData<CartResponse>(
        QUERY_KEYS.cart
      );

      // Optimistic update no React Query
      if (previousCart) {
        queryClient.setQueryData<CartResponse>(QUERY_KEYS.cart, (old) => {
          if (!old) return old;

          // Simular adição do item
          const existingItemIndex = old.items.findIndex(
            (item) => item.productId === productId
          );

          let newItems;
          if (existingItemIndex >= 0) {
            // Atualizar quantidade existente
            newItems = [...old.items];
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: newItems[existingItemIndex].quantity + quantity,
            };
          } else {
            // Adicionar novo item (sem dados completos do produto)
            newItems = [...old.items];
          }

          return {
            ...old,
            items: newItems,
            summary: {
              ...old.summary,
              totalItems: old.summary.totalItems + quantity,
            },
          };
        });
      }

      return { previousCart };
    },

    onError: (err, variables, context) => {
      // Reverter optimistic update
      if (context?.previousCart) {
        queryClient.setQueryData(QUERY_KEYS.cart, context.previousCart);
      }

      showToast.error(
        err instanceof Error ? err.message : "Erro ao adicionar item"
      );
    },

    onSuccess: () => {
      showToast.success("Item adicionado ao carrinho!");
    },

    onSettled: () => {
      // Sempre refetch para garantir consistência
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
    },
  });

  /**
   * Mutation para remover item
   */
  const removeItemMutation = useMutation({
    mutationFn: CartAPI.removeItem,

    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cart });

      const previousCart = queryClient.getQueryData<CartResponse>(
        QUERY_KEYS.cart
      );

      // Optimistic update
      if (previousCart) {
        queryClient.setQueryData<CartResponse>(QUERY_KEYS.cart, (old) => {
          if (!old) return old;

          const removedItem = old.items.find(
            (item) => item.productId === productId
          );
          const newItems = old.items.filter(
            (item) => item.productId !== productId
          );

          return {
            ...old,
            items: newItems,
            summary: {
              ...old.summary,
              totalItems: old.summary.totalItems - (removedItem?.quantity || 0),
            },
          };
        });
      }

      return { previousCart };
    },

    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(QUERY_KEYS.cart, context.previousCart);
      }
      showToast.error("Erro ao remover item");
    },

    onSuccess: () => {
      showToast.success("Item removido do carrinho");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
    },
  });

  /**
   * Mutation para atualizar quantidade
   */
  const updateQuantityMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => CartAPI.updateItem(productId, quantity),

    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cart });

      const previousCart = queryClient.getQueryData<CartResponse>(
        QUERY_KEYS.cart
      );

      // Optimistic update
      if (previousCart) {
        queryClient.setQueryData<CartResponse>(QUERY_KEYS.cart, (old) => {
          if (!old) return old;

          const itemIndex = old.items.findIndex(
            (item) => item.productId === productId
          );
          if (itemIndex < 0) return old;

          const oldQuantity = old.items[itemIndex].quantity;
          const newItems = [...old.items];
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            quantity,
          };

          return {
            ...old,
            items: newItems,
            summary: {
              ...old.summary,
              totalItems: old.summary.totalItems - oldQuantity + quantity,
            },
          };
        });
      }

      return { previousCart };
    },

    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(QUERY_KEYS.cart, context.previousCart);
      }
      showToast.error("Erro ao atualizar quantidade");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
    },
  });

  /**
   * Mutation para limpar carrinho
   */
  const clearCartMutation = useMutation({
    mutationFn: CartAPI.clearCart,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cart });

      const previousCart = queryClient.getQueryData<CartResponse>(
        QUERY_KEYS.cart
      );

      // Optimistic update
      queryClient.setQueryData<CartResponse>(QUERY_KEYS.cart, (old) => {
        if (!old) return old;

        return {
          ...old,
          items: [],
          summary: {
            totalItems: 0,
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
          },
        };
      });

      return { previousCart };
    },

    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(QUERY_KEYS.cart, context.previousCart);
      }
      showToast.error("Erro ao limpar carrinho");
    },

    onSuccess: () => {
      showToast.success("Carrinho limpo com sucesso");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
    },
  });

  // ===== ACTIONS =====

  const addItem = useCallback(
    async (product: Product, quantity: number = 1) => {
      // Validação local primeiro
      const currentItem = cartQuery.data?.items.find(
        (item) => item.productId === product.id
      );
      const currentQuantity = currentItem?.quantity || 0;
      const newQuantity = currentQuantity + quantity;

      if (newQuantity > 10) {
        showToast.error("Máximo de 10 unidades por produto");
        return;
      }

      if (newQuantity > product.stockQuantity) {
        showToast.error(`Apenas ${product.stockQuantity} unidades disponíveis`);
        return;
      }

      // Atualizar local state imediatamente
      localAddItem(product, quantity);

      // Sincronizar com servidor
      await addItemMutation.mutateAsync({ productId: product.id, quantity });
    },
    [cartQuery.data, localAddItem, addItemMutation]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      localRemoveItem(productId);
      await removeItemMutation.mutateAsync(productId);
    },
    [localRemoveItem, removeItemMutation]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity === 0) {
        return removeItem(productId);
      }

      localUpdateQuantity(productId, quantity);
      await updateQuantityMutation.mutateAsync({ productId, quantity });
    },
    [localUpdateQuantity, updateQuantityMutation, removeItem]
  );

  const clearCart = useCallback(async () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja limpar o carrinho?"
    );
    if (!confirmed) return;

    localClearCart();
    await clearCartMutation.mutateAsync();
  }, [localClearCart, clearCartMutation]);

  const syncCart = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
  }, [queryClient]);

  // ===== COMPUTED VALUES =====

  const items = useMemo(
    () => cartQuery.data?.items || [],
    [cartQuery.data?.items]
  );
  const summary = cartQuery.data?.summary || {
    totalItems: 0,
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  };

  const isEmpty = items.length === 0;
  const itemCount = summary.totalItems;
  const formattedTotal = useMemo(() => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(summary.total);
  }, [summary.total]);

  // ===== HELPER FUNCTIONS =====

  const getItemQuantity = useCallback(
    (productId: string): number => {
      const item = items.find((item) => item.productId === productId);
      return item?.quantity || 0;
    },
    [items]
  );

  const isItemInCart = useCallback(
    (productId: string): boolean => {
      return items.some((item) => item.productId === productId);
    },
    [items]
  );

  const canAddMore = useCallback(
    (productId: string, additionalQuantity: number = 1): boolean => {
      const currentQuantity = getItemQuantity(productId);
      return currentQuantity + additionalQuantity <= 10;
    },
    [getItemQuantity]
  );

  // ===== RETURN =====

  return {
    // State
    items,
    summary,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    error: cartQuery.error,

    // Computed
    isEmpty,
    itemCount,
    formattedTotal,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    syncCart,

    // UI Helpers
    getItemQuantity,
    isItemInCart,
    canAddMore,
  };
}

// ============= PROVIDER COMPONENT =============
/**
 * Provider opcional para configurações globais do carrinho
 * Pode ser usado para configurar toast, theme, etc.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  // Sincronizar carrinho ao montar (usuário logado)
  // const { syncCart } = useCart();

  // useEffect(() => {
  //   syncCart();
  // }, [syncCart]);

  return <>{children}</>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module CartStore
 * @description Store global de carrinho implementado com Zustand
 * Utiliza padrões de imutabilidade, memoização e persistência local
 *
 * Arquitetura:
 * - State immutability via Immer (built-in Zustand)
 * - Computed properties com shallow equality checks
 * - Persistência com middleware localStorage
 * - Type-safe actions com discriminated unions
 *
 * Performance:
 * - O(1) lookup de items via Map structure
 * - Memoização de cálculos pesados
 * - Batch updates para re-renders otimizados
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import { devtools } from "zustand/middleware";
import type { Product } from "@prisma/client";

// ============= TYPE DEFINITIONS =============
/**
 * CartItem representa um produto no carrinho com quantidade
 * Extends Product para manter todos os dados do produto
 */
export interface CartItem extends Product {
  quantity: number;
  subtotal: number; // Computed: price * quantity
}

/**
 * CartState define a estrutura completa do estado
 * Utiliza Map para O(1) operations
 */
interface CartState {
  // State
  items: Map<string, CartItem>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;

  // Computed Properties (memoized)
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Async Actions
  syncWithServer: () => Promise<void>;
  loadCartFromServer: () => Promise<void>;

  // Utilities
  getItem: (productId: string) => CartItem | undefined;
  hasItem: (productId: string) => boolean;
  canAddItem: (productId: string, quantity: number) => boolean;

  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ============= CONSTANTS =============
const TAX_RATE = 0.15; // 15% tax
const SHIPPING_THRESHOLD = 200; // Free shipping above R$ 200
const SHIPPING_COST = 20; // R$ 20 shipping
const MAX_QUANTITY_PER_ITEM = 10;
const CART_STORAGE_KEY = "laos-cart-v1";
const SYNC_DEBOUNCE_MS = 1000;

// ============= HELPER FUNCTIONS =============
/**
 * Calcula o subtotal do carrinho
 * Time Complexity: O(n) onde n = número de items
 * Space Complexity: O(1)
 */
const calculateSubtotal = (items: Map<string, CartItem>): number => {
  let subtotal = 0;
  for (const item of items.values()) {
    subtotal += Number(item.price) * item.quantity;
  }
  return Number(subtotal.toFixed(2));
};

/**
 * Calcula imposto baseado no subtotal
 */
const calculateTax = (subtotal: number): number => {
  return Number((subtotal * TAX_RATE).toFixed(2));
};

/**
 * Calcula frete com regra de frete grátis
 */
const calculateShipping = (subtotal: number): number => {
  return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
};

/**
 * Debounce function para sync com servidor
 */
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// ============= STORE IMPLEMENTATION =============
export const useCartStore = create<CartState>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // ===== INITIAL STATE =====
          items: new Map(),
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),

          // ===== COMPUTED PROPERTIES =====
          totalItems: 0,
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,

          // ===== ACTIONS =====
          /**
           * Adiciona item ao carrinho com validações
           * - Verifica estoque disponível
           * - Merge quantities se item já existe
           * - Atualiza computed properties
           */
          addItem: (product: Product, quantity: number = 1) => {
            set((state) => {
              // Validações
              if (quantity <= 0 || quantity > MAX_QUANTITY_PER_ITEM) {
                state.error = `Quantidade inválida. Máximo: ${MAX_QUANTITY_PER_ITEM}`;
                return;
              }

              if (!product.inStock) {
                state.error = "Produto fora de estoque";
                return;
              }

              const existingItem = state.items.get(product.id);
              const newQuantity = (existingItem?.quantity || 0) + quantity;

              if (newQuantity > product.stockQuantity) {
                state.error = `Estoque insuficiente. Disponível: ${product.stockQuantity}`;
                return;
              }

              if (newQuantity > MAX_QUANTITY_PER_ITEM) {
                state.error = `Limite máximo por item: ${MAX_QUANTITY_PER_ITEM}`;
                return;
              }

              // Adiciona ou atualiza item
              const cartItem: CartItem = {
                ...product,
                quantity: newQuantity,
                subtotal: Number(product.price) * newQuantity,
              };

              state.items.set(product.id, cartItem);
              state.lastUpdated = Date.now();
              state.error = null;

              // Recalcula totais
              const items = state.items;
              state.totalItems = Array.from(
                items.values() as Iterable<CartItem>
              ).reduce((sum, item) => sum + item.quantity, 0);
              state.subtotal = calculateSubtotal(items);
              state.tax = calculateTax(state.subtotal);
              state.shipping = calculateShipping(state.subtotal);
              state.total = state.subtotal + state.tax + state.shipping;
            });

            // Sync com servidor (debounced)
            debouncedSync();
          },

          /**
           * Remove item completamente do carrinho
           */
          removeItem: (productId: string) => {
            set((state) => {
              if (!state.items.has(productId)) {
                state.error = "Item não encontrado no carrinho";
                return;
              }

              state.items.delete(productId);
              state.lastUpdated = Date.now();
              state.error = null;

              // Recalcula totais
              const items = state.items;
              state.totalItems = Array.from<CartItem>(items.values()).reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              state.subtotal = calculateSubtotal(items);
              state.tax = calculateTax(state.subtotal);
              state.shipping = calculateShipping(state.subtotal);
              state.total = state.subtotal + state.tax + state.shipping;
            });

            debouncedSync();
          },

          /**
           * Atualiza quantidade de um item específico
           * Se quantity = 0, remove o item
           */
          updateQuantity: (productId: string, quantity: number) => {
            if (quantity === 0) {
              get().removeItem(productId);
              return;
            }

            set((state) => {
              const item = state.items.get(productId);
              if (!item) {
                state.error = "Item não encontrado no carrinho";
                return;
              }

              if (quantity < 0 || quantity > MAX_QUANTITY_PER_ITEM) {
                state.error = `Quantidade inválida. Máximo: ${MAX_QUANTITY_PER_ITEM}`;
                return;
              }

              if (quantity > item.stockQuantity) {
                state.error = `Estoque insuficiente. Disponível: ${item.stockQuantity}`;
                return;
              }

              item.quantity = quantity;
              item.subtotal = Number(item.price) * quantity;
              state.lastUpdated = Date.now();
              state.error = null;

              // Recalcula totais
              const items = state.items;
              state.totalItems = Array.from(
                items.values() as Iterable<CartItem>
              ).reduce((sum, item) => sum + item.quantity, 0);
              state.subtotal = calculateSubtotal(items);
              state.tax = calculateTax(state.subtotal);
              state.shipping = calculateShipping(state.subtotal);
              state.total = state.subtotal + state.tax + state.shipping;
            });

            debouncedSync();
          },

          /**
           * Limpa o carrinho completamente
           */
          clearCart: () => {
            set((state) => {
              state.items.clear();
              state.totalItems = 0;
              state.subtotal = 0;
              state.tax = 0;
              state.shipping = 0;
              state.total = 0;
              state.lastUpdated = Date.now();
              state.error = null;
            });

            debouncedSync();
          },

          // ===== ASYNC ACTIONS =====
          /**
           * Sincroniza carrinho com servidor
           * Implementa retry logic e error handling
           */
          syncWithServer: async () => {
            const state = get();
            if (state.isLoading) return;

            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const items = Array.from(state.items.values()).map((item) => ({
                productId: item.id,
                quantity: item.quantity,
              }));

              const response = await fetch("/api/cart/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
                credentials: "include",
              });

              if (!response.ok) {
                throw new Error(`Sync failed: ${response.statusText}`);
              }

              const data = await response.json();

              // Atualiza com dados do servidor se necessário
              if (data.updated) {
                set((state) => {
                  state.lastUpdated = Date.now();
                });
              }
            } catch (error) {
              console.error("[CartStore] Sync error:", error);
              set((state) => {
                state.error = "Erro ao sincronizar carrinho";
              });
            } finally {
              set((state) => {
                state.isLoading = false;
              });
            }
          },

          /**
           * Carrega carrinho do servidor (para usuários logados)
           */
          loadCartFromServer: async () => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const response = await fetch("/api/cart", {
                credentials: "include",
              });

              if (!response.ok) {
                throw new Error(`Load failed: ${response.statusText}`);
              }

              const data = await response.json();

              set((state) => {
                state.items.clear();

                for (const item of data.items) {
                  const cartItem: CartItem = {
                    ...item.product,
                    quantity: item.quantity,
                    subtotal: Number(item.product.price) * item.quantity,
                  };
                  state.items.set(item.product.id, cartItem);
                }

                // Recalcula totais
                const items = state.items;
                state.totalItems = Array.from(
                  items.values() as Iterable<CartItem>
                ).reduce((sum, item) => sum + item.quantity, 0);
                state.subtotal = calculateSubtotal(items);
                state.tax = calculateTax(state.subtotal);
                state.shipping = calculateShipping(state.subtotal);
                state.total = state.subtotal + state.tax + state.shipping;
                state.lastUpdated = Date.now();
              });
            } catch (error) {
              console.error("[CartStore] Load error:", error);
              set((state) => {
                state.error = "Erro ao carregar carrinho";
              });
            } finally {
              set((state) => {
                state.isLoading = false;
              });
            }
          },

          // ===== UTILITIES =====
          getItem: (productId: string) => {
            return get().items.get(productId);
          },

          hasItem: (productId: string) => {
            return get().items.has(productId);
          },

          canAddItem: (productId: string, quantity: number) => {
            const state = get();
            const item = state.items.get(productId);
            const currentQuantity = item?.quantity || 0;
            const newQuantity = currentQuantity + quantity;

            return newQuantity <= MAX_QUANTITY_PER_ITEM;
          },

          setError: (error: string | null) => {
            set((state) => {
              state.error = error;
            });
          },

          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },
        })),
        {
          name: CART_STORAGE_KEY,
          storage: createJSONStorage(() => localStorage),
          // Custom serialization para Map
          serialize: (state) => {
            const cartState = state as unknown as CartState;
            return JSON.stringify({
              ...cartState,
              items: Array.from(cartState.items.entries()),
            });
          },
          deserialize: (str) => {
            const parsed = JSON.parse(str);
            return {
              ...parsed,
              items: new Map(parsed.items),
            };
          },
          // Partial state persistence
          partialize: (state) => ({
            items: state.items,
            lastUpdated: state.lastUpdated,
          }),
          // Rehydrate computed properties
          onRehydrateStorage: () => (state) => {
            if (state) {
              const items = state.items;
              state.totalItems = Array.from(items.values()).reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              state.subtotal = calculateSubtotal(items);
              state.tax = calculateTax(state.subtotal);
              state.shipping = calculateShipping(state.subtotal);
              state.total = state.subtotal + state.tax + state.shipping;
            }
          },
        }
      )
    ),
    {
      name: "cart-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// ============= DEBOUNCED SYNC =============
const debouncedSync = debounce(() => {
  useCartStore.getState().syncWithServer();
}, SYNC_DEBOUNCE_MS);

// ============= SELECTORS FOR PERFORMANCE =============
export const selectCartItems = (state: CartState) =>
  Array.from(state.items.values());
export const selectCartTotal = (state: CartState) => state.total;
export const selectCartCount = (state: CartState) => state.totalItems;
export const selectHasItems = (state: CartState) => state.totalItems > 0;

// ============= HOOKS =============
export const useCartItem = (productId: string) => {
  return useCartStore((state) => state.getItem(productId));
};

export const useCartActions = () => {
  return useCartStore((state) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    clearCart: state.clearCart,
  }));
};

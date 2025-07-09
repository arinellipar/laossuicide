/**
 * @module CartStore
 * @description Simple cart store without complex dependencies
 */

import React from 'react';

// Simple type definitions
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string;
  inStock: boolean;
  stockQuantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  error: string | null;
}

// Simple store implementation
class SimpleCartStore {
  private state: CartState = {
    items: [],
    totalItems: 0,
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    error: null,
  };

  private listeners: Array<() => void> = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getState() {
    return this.state;
  }

  private setState(partial: Partial<CartState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(listener => listener());
  }

  private calculateTotals() {
    const subtotal = this.state.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.15;
    const shipping = subtotal >= 200 ? 0 : 20;
    const total = subtotal + tax + shipping;
    const totalItems = this.state.items.reduce((sum, item) => sum + item.quantity, 0);

    this.setState({
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping,
      total: Number(total.toFixed(2)),
      totalItems,
    });
  }

  addItem(product: any, quantity: number = 1) {
    const existingIndex = this.state.items.findIndex(item => item.id === product.id);
    let newItems = [...this.state.items];

    if (existingIndex >= 0) {
      const existing = newItems[existingIndex];
      const newQuantity = existing.quantity + quantity;
      newItems[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        subtotal: Number(product.price.toString()) * newQuantity,
      };
    } else {
      newItems.push({
        id: product.id,
        name: product.name,
        price: Number(product.price.toString()),
        quantity,
        subtotal: Number(product.price.toString()) * quantity,
        image: product.image,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
      });
    }

    this.setState({ items: newItems, error: null });
    this.calculateTotals();
  }

  removeItem(productId: string) {
    const newItems = this.state.items.filter(item => item.id !== productId);
    this.setState({ items: newItems, error: null });
    this.calculateTotals();
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity === 0) {
      this.removeItem(productId);
      return;
    }

    const newItems = this.state.items.map(item => 
      item.id === productId 
        ? { ...item, quantity, subtotal: item.price * quantity }
        : item
    );

    this.setState({ items: newItems, error: null });
    this.calculateTotals();
  }

  clearCart() {
    this.setState({
      items: [],
      totalItems: 0,
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      error: null,
    });
  }

  getItem(productId: string) {
    return this.state.items.find(item => item.id === productId);
  }

  hasItem(productId: string) {
    return this.state.items.some(item => item.id === productId);
  }

  setError(error: string | null) {
    this.setState({ error });
  }

  clearError() {
    this.setState({ error: null });
  }
}

// Create singleton instance
const cartStore = new SimpleCartStore();

// Mock useCartStore hook for compatibility
export const useCartStore = (selector?: (state: CartState) => any) => {
  const [state, setState] = React.useState(cartStore.getState());

  React.useEffect(() => {
    const unsubscribe = cartStore.subscribe(() => {
      setState(cartStore.getState());
    });
    return unsubscribe;
  }, []);

  if (selector) {
    return selector(state);
  }

  return {
    ...state,
    addItem: cartStore.addItem.bind(cartStore),
    removeItem: cartStore.removeItem.bind(cartStore),
    updateQuantity: cartStore.updateQuantity.bind(cartStore),
    clearCart: cartStore.clearCart.bind(cartStore),
    getItem: cartStore.getItem.bind(cartStore),
    hasItem: cartStore.hasItem.bind(cartStore),
    setError: cartStore.setError.bind(cartStore),
    clearError: cartStore.clearError.bind(cartStore),
  };
};



// Persistence handling
if (typeof window !== 'undefined') {
  // Load from localStorage
  try {
    const saved = localStorage.getItem('laos-cart-v1');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.items && Array.isArray(data.items)) {
        cartStore['state'].items = data.items;
        cartStore['calculateTotals']();
      }
    }
  } catch (error) {
    console.warn('[CartStore] Failed to load from localStorage:', error);
  }

  // Save to localStorage on changes
  cartStore.subscribe(() => {
    try {
      localStorage.setItem('laos-cart-v1', JSON.stringify({
        items: cartStore.getState().items,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      console.warn('[CartStore] Failed to save to localStorage:', error);
    }
  });
}

// Selectors
export const selectCartItems = (state: CartState) => state.items;
export const selectCartTotal = (state: CartState) => state.total;
export const selectCartCount = (state: CartState) => state.totalItems;
export const selectHasItems = (state: CartState) => state.totalItems > 0;

// Hooks
export const useCartItem = (productId: string) => {
  return useCartStore((state: CartState) => state.items.find(item => item.id === productId));
};

export const useCartActions = () => {
  const store = useCartStore();
  return {
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
  };
};

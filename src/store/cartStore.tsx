"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CartItem, ProductWithCategory } from "@/types";

type CartContextValue = {
  items: CartItem[];
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  addItem: (product: ProductWithCategory) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
  taxRate: number;
};

export function CartProvider({ children, taxRate }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: ProductWithCategory) => {
    if (product.trackStock && product.stock <= 0) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const currentQty = existing?.quantity ?? 0;
      if (product.trackStock && currentQty >= product.stock) return prev;

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          emoji: product.emoji,
          quantity: 1,
          trackStock: product.trackStock,
          stock: product.stock,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const maxQty = item.trackStock ? item.stock : quantity;
        return { ...item, quantity: Math.min(quantity, maxQty) };
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const tax = useMemo(() => Math.round(subtotal * taxRate), [subtotal, taxRate]);
  const total = subtotal + tax;
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      taxRate,
      subtotal,
      tax,
      total,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      taxRate,
      subtotal,
      tax,
      total,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart harus digunakan di dalam CartProvider");
  }
  return context;
}

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import type { Product } from '@/lib/client/api';
import { useGetMe } from '@/lib/client/api';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_GUEST_KEY = 'rute-cart:guest';
const getUserCartKey = (userId: string) => `rute-cart:user:${userId}`;

const loadCart = (key: string): CartItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse cart from localStorage:', error);
    return [];
  }
};

const mergeCarts = (base: CartItem[], incoming: CartItem[]) => {
  const map = new Map<string, CartItem>();
  base.forEach((item) => map.set(item.id, { ...item }));
  incoming.forEach((item) => {
    const existing = map.get(item.id);
    if (existing) {
      map.set(item.id, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      map.set(item.id, { ...item });
    }
  });
  return Array.from(map.values());
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetMe();
  const userId = user?.id || null;
  const prevUserIdRef = useRef<string | null>(null);

  const [storageKey, setStorageKey] = useState<string>(() => {
    return CART_STORAGE_GUEST_KEY;
  });

  const [items, setItems] = useState<CartItem[]>(() =>
    loadCart(CART_STORAGE_GUEST_KEY),
  );

  useEffect(() => {
    const nextKey = userId ? getUserCartKey(userId) : CART_STORAGE_GUEST_KEY;
    setStorageKey(nextKey);

    const prevUserId = prevUserIdRef.current;

    if (!prevUserId && userId) {
      // User just logged in: merge guest cart into user cart
      const guestItems = loadCart(CART_STORAGE_GUEST_KEY);
      const userItems = loadCart(nextKey);
      const merged = mergeCarts(userItems, guestItems);
      setItems(merged);
      localStorage.setItem(nextKey, JSON.stringify(merged));
      localStorage.removeItem(CART_STORAGE_GUEST_KEY);
    } else if (prevUserId && !userId) {
      // User logged out: switch to guest cart
      setItems(loadCart(CART_STORAGE_GUEST_KEY));
    } else {
      // User stayed same: load cart for current key
      setItems(loadCart(nextKey));
    }

    prevUserIdRef.current = userId;
  }, [userId]);

  // Persist cart to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);

      if (existingIndex >= 0) {
        // Update existing item quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, { ...product, quantity }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    const price = item.sale_price || item.price;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

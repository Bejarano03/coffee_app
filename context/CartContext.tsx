import { CartAPI, CartApiItem, normalizeMenuItem } from '@/api/client';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MenuItem } from '@/types/menu';
import { useAuth } from './AuthContext';

type CartLine = {
  item: MenuItem;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  itemsById: Record<number, CartLine>;
  subtotal: number;
  totalQuantity: number;
  isSyncing: boolean;
  refreshCart: () => Promise<void>;
  addItem: (item: MenuItem, quantityDelta?: number) => Promise<void>;
  decrementItem: (itemId: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: PropsWithChildren) => {
  const { session, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const applyResponse = useCallback((items: CartApiItem[]) => {
    setCart(
      items.reduce<Record<number, CartLine>>((acc, line) => {
        acc[line.menuItemId] = {
          item: normalizeMenuItem(line.menuItem),
          quantity: line.quantity,
        };
        return acc;
      }, {})
    );
  }, []);

  const refreshCart = useCallback(async () => {
    if (!session) {
      setCart({});
      return;
    }

    setIsSyncing(true);
    try {
      const data = await CartAPI.fetchCart();
      applyResponse(data);
    } catch (error) {
      console.error('Failed to load cart', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [session, applyResponse]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (session) {
      refreshCart().catch((error) => console.error('Unable to refresh cart', error));
    } else {
      setCart({});
    }
  }, [authLoading, refreshCart, session]);

  const ensureAuthenticated = useCallback(() => {
    if (!session) {
      throw new Error('User is not authenticated');
    }
  }, [session]);

  const addItem = useCallback(
    async (item: MenuItem, quantityDelta = 1) => {
      ensureAuthenticated();
      try {
        const data = await CartAPI.addItem(item.id, quantityDelta);
        applyResponse(data);
      } catch (error) {
        console.error('Failed to add item to cart', error);
        throw error;
      }
    },
    [applyResponse, ensureAuthenticated]
  );

  const decrementItem = useCallback(
    async (itemId: number) => {
      const existing = cart[itemId];
      if (!existing) {
        return;
      }

      ensureAuthenticated();
      try {
        const data =
          existing.quantity <= 1
            ? await CartAPI.removeItem(itemId)
            : await CartAPI.updateItem(itemId, existing.quantity - 1);
        applyResponse(data);
      } catch (error) {
        console.error('Failed to decrement cart item', error);
        throw error;
      }
    },
    [applyResponse, cart, ensureAuthenticated]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      ensureAuthenticated();
      try {
        const data = await CartAPI.removeItem(itemId);
        applyResponse(data);
      } catch (error) {
        console.error('Failed to remove cart item', error);
        throw error;
      }
    },
    [applyResponse, ensureAuthenticated]
  );

  const clearCart = useCallback(async () => {
    ensureAuthenticated();
    try {
      const data = await CartAPI.clearCart();
      applyResponse(data);
    } catch (error) {
      console.error('Failed to clear cart', error);
      throw error;
    }
  }, [applyResponse, ensureAuthenticated]);

  const items = useMemo(() => Object.values(cart), [cart]);

  const { subtotal, totalQuantity } = useMemo(() => {
    return items.reduce(
      (totals, line) => {
        totals.subtotal += line.item.price * line.quantity;
        totals.totalQuantity += line.quantity;
        return totals;
      },
      { subtotal: 0, totalQuantity: 0 }
    );
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      itemsById: cart,
      subtotal,
      totalQuantity,
      isSyncing,
      refreshCart,
      addItem,
      decrementItem,
      removeItem,
      clearCart,
    }),
    [items, cart, subtotal, totalQuantity, isSyncing, refreshCart, addItem, decrementItem, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

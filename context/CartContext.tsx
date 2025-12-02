import { CartAPI, CartApiItem, CartCustomizationPayload, MilkOption, normalizeMenuItem } from '@/api/client';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MenuItem } from '@/types/menu';
import { useAuth } from './AuthContext';

type CartLine = {
  id: number;
  item: MenuItem;
  quantity: number;
  milkOption: MilkOption;
  espressoShots: number;
  flavorName?: string | null;
  flavorPumps?: number | null;
};

type CartContextValue = {
  items: CartLine[];
  itemsById: Record<number, CartLine>;
  quantityByMenuItem: Record<number, number>;
  subtotal: number;
  totalQuantity: number;
  isSyncing: boolean;
  refreshCart: () => Promise<void>;
  addItem: (item: MenuItem, payload?: { quantity?: number; customizations?: CartCustomizationPayload }) => Promise<void>;
  decrementItem: (cartItemId: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
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
        acc[line.id] = {
          id: line.id,
          item: normalizeMenuItem(line.menuItem),
          quantity: line.quantity,
          milkOption: line.milkOption,
          espressoShots: line.espressoShots,
          flavorName: line.flavorName,
          flavorPumps: line.flavorPumps,
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
    async (item: MenuItem, payload?: { quantity?: number; customizations?: CartCustomizationPayload }) => {
      ensureAuthenticated();
      try {
        const data = await CartAPI.addItem(item.id, payload?.quantity, payload?.customizations);
        applyResponse(data);
      } catch (error) {
        console.error('Failed to add item to cart', error);
        throw error;
      }
    },
    [applyResponse, ensureAuthenticated]
  );

  const decrementItem = useCallback(
    async (cartItemId: number) => {
      const existing = cart[cartItemId];
      if (!existing) {
        return;
      }

      ensureAuthenticated();
      try {
        const data =
          existing.quantity <= 1
            ? await CartAPI.removeItem(cartItemId)
            : await CartAPI.updateItem(cartItemId, existing.quantity - 1);
        applyResponse(data);
      } catch (error) {
        console.error('Failed to decrement cart item', error);
        throw error;
      }
    },
    [applyResponse, cart, ensureAuthenticated]
  );

  const removeItem = useCallback(
    async (cartItemId: number) => {
      ensureAuthenticated();
      try {
        const data = await CartAPI.removeItem(cartItemId);
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

  const quantityByMenuItem = useMemo(() => {
    return items.reduce<Record<number, number>>((acc, line) => {
      acc[line.item.id] = (acc[line.item.id] ?? 0) + line.quantity;
      return acc;
    }, {});
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      itemsById: cart,
      quantityByMenuItem,
      subtotal,
      totalQuantity,
      isSyncing,
      refreshCart,
      addItem,
      decrementItem,
      removeItem,
      clearCart,
    }),
    [items, cart, quantityByMenuItem, subtotal, totalQuantity, isSyncing, refreshCart, addItem, decrementItem, removeItem, clearCart]
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

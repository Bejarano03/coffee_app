import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { MenuItem } from '@/types/menu';

type CartLine = {
  item: MenuItem;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  itemsById: Record<string, CartLine>;
  subtotal: number;
  totalQuantity: number;
  addItem: (item: MenuItem, quantityDelta?: number) => void;
  decrementItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: PropsWithChildren) => {
  const [cart, setCart] = useState<Record<string, CartLine>>({});

  const addItem = useCallback((item: MenuItem, quantityDelta = 1) => {
    setCart((current) => {
      const existing = current[item.id];
      const nextQuantity = (existing?.quantity ?? 0) + quantityDelta;

      return {
        ...current,
        [item.id]: { item, quantity: nextQuantity },
      };
    });
  }, []);

  const decrementItem = useCallback((itemId: string) => {
    setCart((current) => {
      const existing = current[itemId];
      if (!existing) {
        return current;
      }

      if (existing.quantity <= 1) {
        const { [itemId]: _, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart((current) => {
      if (!(itemId in current)) {
        return current;
      }
      const { [itemId]: _, ...rest } = current;
      return rest;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

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
      addItem,
      decrementItem,
      removeItem,
      clearCart,
    }),
    [items, cart, subtotal, totalQuantity, addItem, decrementItem, removeItem, clearCart]
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

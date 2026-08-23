import { createContext, useContext, type ReactNode } from 'react';

type CartCtx = {
  items: never[];
  count: number;
  total: number;
  currency: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  drawerTab: 'cart' | 'saved';
  setDrawerTab: (tab: 'cart' | 'saved') => void;
  wishlist: never[];
  wishlistCount: number;
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (item: { id: string; name: string; price?: number; img?: string }) => void;
  removeWishlist: (id: string) => void;
  refresh: () => Promise<void>;
  addItem: (item: Record<string, unknown>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQty: (id: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  providers: string[];
  paymentMode: string;
  paystackHint: string;
};

const stub: CartCtx = {
  items: [],
  count: 0,
  total: 0,
  currency: 'NGN',
  open: false,
  setOpen() {},
  drawerTab: 'cart',
  setDrawerTab() {},
  wishlist: [],
  wishlistCount: 0,
  isWishlisted() { return false; },
  toggleWishlist() {},
  removeWishlist() {},
  async refresh() {},
  async addItem() {},
  async removeItem() {},
  async updateQty() {},
  async clearCart() {},
  providers: [],
  paymentMode: 'demo',
  paystackHint: '',
};

const CartContext = createContext<CartCtx>(stub);

export function CartProvider({ children }: { children: ReactNode }) {
  return <CartContext.Provider value={stub}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}

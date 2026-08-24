import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cartApi } from '@/services/apiClient';
import { SITE_TOKEN } from '@/config/site';

type CartItem = {
  id?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  img?: string;
  image?: string;
  currency?: string;
};

type WishlistItem = {
  id: string;
  name: string;
  price: number;
  img?: string;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  currency: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  drawerTab: 'cart' | 'saved';
  setDrawerTab: (tab: 'cart' | 'saved') => void;
  wishlist: WishlistItem[];
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

const CartContext = createContext<CartCtx | null>(null);

function wishlistStorageKey() {
  try {
    const tok = String(SITE_TOKEN || '').trim() || 'local';
    return `dwene_wishlist_${tok}`;
  } catch {
    return 'dwene_wishlist_local';
  }
}

function loadWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(wishlistStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((it: any) => it && it.id && it.name)
      .map((it: any) => ({
        id: String(it.id),
        name: String(it.name),
        price: Number(it.price) || 0,
        img: String(it.img || it.image || ''),
      }));
  } catch {
    return [];
  }
}

function persistWishlist(items: WishlistItem[]) {
  try {
    localStorage.setItem(wishlistStorageKey(), JSON.stringify(items));
  } catch {
    /* ignore quota / private mode */
  }
}

function lineQty(item: CartItem) {
  return Math.max(0, Number(item.qty ?? item.quantity ?? 1) || 0);
}

function linePrice(item: CartItem) {
  return Math.max(0, Number(item.price) || 0);
}

function normalizeItems(raw: any[]): CartItem[] {
  return (Array.isArray(raw) ? raw : []).map((it: any) => ({
    ...it,
    id: it?.id != null ? String(it.id) : undefined,
    quantity: Number(it?.qty ?? it?.quantity ?? 1) || 1,
    qty: Number(it?.qty ?? it?.quantity ?? 1) || 1,
    price: Number(it?.price) || 0,
    img: it?.img || it?.image || '',
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => loadWishlist());
  const [open, setOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'cart' | 'saved'>('cart');
  const [currency, setCurrency] = useState('NGN');
  const [providers, setProviders] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState('demo');
  const [paystackHint, setPaystackHint] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await cartApi.get();
      const raw = data.items || data.cart?.items || [];
      setItems(normalizeItems(raw));
      setProviders(Array.isArray(data.payment_providers) ? data.payment_providers : []);
      setPaymentMode(String(data.payment_mode || 'demo'));
      setPaystackHint(String(data.paystack_keys_hint || ''));
      const cur = String(data.currency || data.paystack_currency || 'NGN').toUpperCase();
      setCurrency(cur || 'NGN');
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    persistWishlist(wishlist);
  }, [wishlist]);

  const value = useMemo<CartCtx>(() => ({
    items,
    count: items.reduce((n, item) => n + lineQty(item), 0),
    total: items.reduce((n, item) => n + linePrice(item) * lineQty(item), 0),
    currency,
    open,
    setOpen,
    drawerTab,
    setDrawerTab,
    wishlist,
    wishlistCount: wishlist.length,
    isWishlisted(id) {
      const sid = String(id || '');
      return !!sid && wishlist.some((it) => it.id === sid);
    },
    toggleWishlist(item) {
      const sid = String(item?.id || '');
      if (!sid) return;
      setWishlist((prev) => {
        if (prev.some((it) => it.id === sid)) {
          return prev.filter((it) => it.id !== sid);
        }
        return [
          {
            id: sid,
            name: String(item.name || 'Item'),
            price: Number(item.price) || 0,
            img: String(item.img || ''),
          },
          ...prev.filter((it) => it.id !== sid),
        ];
      });
    },
    removeWishlist(id) {
      const sid = String(id || '');
      if (!sid) return;
      setWishlist((prev) => prev.filter((it) => it.id !== sid));
    },
    refresh,
    providers,
    paymentMode,
    paystackHint,
    async addItem(item) {
      const qty = Number(item.qty ?? item.quantity ?? 1) || 1;
      await cartApi.addItem({ ...item, qty, quantity: qty });
      await refresh();
      setDrawerTab('cart');
      setOpen(true);
    },
    async removeItem(id) {
      const sid = String(id || '');
      if (!sid) return;
      setItems((prev) => prev.filter((it) => String(it.id) !== sid));
      try {
        await cartApi.removeItem(sid);
      } catch {
        /* fall through to refresh */
      }
      await refresh();
    },
    async updateQty(id, qty) {
      const sid = String(id || '');
      if (!sid) return;
      const next = Math.max(0, Math.floor(Number(qty) || 0));
      if (next <= 0) {
        setItems((prev) => prev.filter((it) => String(it.id) !== sid));
        try {
          await cartApi.removeItem(sid);
        } catch {
          /* fall through to refresh */
        }
        await refresh();
        return;
      }
      setItems((prev) => prev.map((it) => (
        String(it.id) === sid ? { ...it, qty: next, quantity: next } : it
      )));
      try {
        await cartApi.updateItem(sid, { qty: next, quantity: next });
      } catch {
        /* fall through to refresh */
      }
      await refresh();
    },
    async clearCart() {
      setItems([]);
      try {
        await cartApi.clear();
      } catch {
        /* ignore */
      }
      await refresh();
    },
  }), [items, wishlist, open, drawerTab, currency, providers, paymentMode, paystackHint, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart requires CartProvider');
  return ctx;
}

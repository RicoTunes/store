import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { INTENT, STORE_CURRENCY, SITE_BRAND } from '@/config/site';
import { useCart } from '@/contexts/CartContext';
import { productsApi } from '@/services/apiClient';
import { Link } from 'react-router-dom';

type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  detail?: string;
  images?: string[];
  image?: string;
  sizes?: string[];
  colors?: string[];
  currency?: string;
  brand?: string;
  compareAtPrice?: number;
  compare_at_price?: number;
  originalPrice?: number;
  listPrice?: number;
  onSale?: boolean;
};

function money(amount: number, currency = 'NGN') {
  const n = Number(amount) || 0;
  const code = String(currency || STORE_CURRENCY || 'NGN').toUpperCase() || 'NGN';
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `₦${n.toFixed(2)}`;
  }
}

function comparePrice(p: Product) {
  const candidates = [p.compareAtPrice, p.compare_at_price, p.originalPrice, p.listPrice]
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);
  const price = Number(p.price) || 0;
  const cmp = candidates.find((v) => v > price);
  return cmp || 0;
}

export function ProductGrid({
  id,
  title,
  body,
  products: productsProp,
  gridClass,
}: {
  id?: string;
  title: string;
  body: string;
  products?: Product[];
  gridClass?: string;
}) {
  const { addItem, setOpen, setDrawerTab, currency: cartCurrency, isWishlisted, toggleWishlist } = useCart();
  const currency = String(cartCurrency || STORE_CURRENCY || 'NGN').toUpperCase() || 'NGN';
  const brandLabel = String(SITE_BRAND || '').trim() || 'Shop';
  const seeded = Array.isArray(productsProp) ? productsProp.filter((p) => p && p.id && p.name) : [];
  const [live, setLive] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await productsApi.list();
        const rows = Array.isArray(data?.products) ? data.products : [];
        if (!cancelled) setLive(rows.filter((p: Product) => p && p.id && p.name));
      } catch {
        if (!cancelled) setLive([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const products = (live && live.length) ? live : seeded;
  const pd = ((INTENT as any).productDesign && typeof (INTENT as any).productDesign === 'object')
    ? ((INTENT as any).productDesign as Record<string, string>)
    : {};
  const pdGrid = String(pd.product_grid || '');
  const gridFromDna =
    pdGrid === '2-col' ? 'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-2'
    : pdGrid === '3-col' ? 'grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3'
    : pdGrid === '4-col' ? 'grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 xl:grid-cols-4'
    : pdGrid === 'dense' ? 'grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5'
    : pdGrid === 'editorial' ? 'grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2'
    : '';
  const grid = gridClass || gridFromDna || 'grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4';
  const gridMods = pdGrid ? `pd-product-grid pd-product-grid--${pdGrid}` : 'pd-product-grid';

  async function quickAdd(p: Product, img: string) {
    if (!INTENT.cart) return;
    setAddingId(p.id);
    try {
      await addItem({ id: p.id, name: p.name, price: p.price, qty: 1, img });
      setDrawerTab('cart');
      setOpen(true);
    } finally {
      setAddingId('');
    }
  }

  return (
    <section id={id || 'catalog'} className="border-b border-black/5 bg-background py-14 md:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold uppercase tracking-[0.08em] text-ink md:text-3xl">{title}</h2>
            {body ? <p className="mt-2 text-sm text-muted md:text-base">{body}</p> : null}
          </div>
          {INTENT.cart ? (
            <Link
              to="/shop"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-ink underline-offset-4 transition hover:underline"
            >
              Shop all
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className={`mt-10 ${grid} ${gridMods}`} aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="aspect-[3/4] animate-pulse bg-neutral-100" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-black/10" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-black/10" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-black/10" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-10 border border-black/10 bg-surface px-8 py-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Shop</p>
            <h3 className="mt-3 text-2xl font-semibold uppercase tracking-wide text-ink">No products yet</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              This shop stays empty until the website owner publishes inventory from Dwene
              (website card → Admin). Store accounts here are for customers only.
            </p>
          </div>
        ) : (
          <div className={`mt-10 ${grid} ${gridMods}`}>
            {products.map((p) => {
              const img = (p.images && p.images[0]) || p.image || '';
              const saved = INTENT.cart ? isWishlisted(p.id) : false;
              const was = comparePrice(p);
              const onSale = Boolean(p.onSale) || was > (Number(p.price) || 0);
              const label = String(p.brand || brandLabel).trim() || brandLabel;
              return (
                <article key={p.id} className="group flex flex-col">
                  <div className="relative overflow-hidden bg-neutral-100">
                    <Link to={`/product/${p.id}`} className="relative block">
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div
                        className="aspect-[3/4] w-full bg-gradient-to-br from-neutral-200 to-neutral-100"
                        style={img ? { display: 'none' } : undefined}
                        aria-hidden={img ? true : undefined}
                      />
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-ink px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-background transition duration-300 group-hover:translate-y-0">
                        Quick view
                      </span>
                    </Link>
                    {onSale ? (
                      <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-[10px] font-bold uppercase tracking-wide text-background">
                        Sale
                      </span>
                    ) : null}
                    {INTENT.cart ? (
                      <button
                        type="button"
                        aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
                        aria-pressed={saved}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist({ id: p.id, name: p.name, price: p.price, img });
                        }}
                        className={`absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-ink shadow-sm ring-1 ring-black/10 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${saved ? 'text-ink' : 'text-ink/70'}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                          <path
                            d="M12 21s-6.7-4.35-9.33-8.1C.8 10.2 1.2 6.9 3.7 5.2c2-1.35 4.55-.95 6.05.85L12 8.4l2.25-2.35c1.5-1.8 4.05-2.2 6.05-.85 2.5 1.7 2.9 5 1.03 7.7C18.7 16.65 12 21 12 21z"
                            fill={saved ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-1 flex-col gap-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{label}</p>
                    <h3 className="text-sm font-semibold uppercase leading-snug tracking-wide text-ink">
                      <Link to={`/product/${p.id}`} className="transition hover:opacity-70">
                        {p.name}
                      </Link>
                    </h3>
                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                      {onSale && was ? (
                        <span className="tabular-nums text-muted line-through">{money(was, currency)}</span>
                      ) : null}
                      <span className="font-semibold tabular-nums text-ink">{money(p.price, currency)}</span>
                    </div>
                    {INTENT.cart ? (
                      <button
                        type="button"
                        disabled={addingId === p.id}
                        onClick={() => void quickAdd(p, img)}
                        className="mt-2 self-start text-[11px] font-semibold uppercase tracking-[0.16em] text-ink underline-offset-4 transition hover:underline disabled:opacity-50"
                      >
                        {addingId === p.id ? 'Adding…' : 'Add to bag'}
                      </button>
                    ) : (
                      <Link
                        to={`/product/${p.id}`}
                        className="mt-2 self-start text-[11px] font-semibold uppercase tracking-[0.16em] text-ink underline-offset-4 hover:underline"
                      >
                        View details
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}

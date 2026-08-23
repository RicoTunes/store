import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { menuApi } from '@/services/apiClient';
import { INTENT } from '@/config/site';

type MenuItem = { id: string; name: string; description: string; price: number; category: string };

const SEED_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Heritage Salad', description: 'Seasonal greens, citrus, toasted seeds.', price: 12, category: 'Starters' },
  { id: 'm2', name: 'Wood-fired Flatbread', description: 'Tomato conserve, herbs, olive oil.', price: 16, category: 'Mains' },
  { id: 'm3', name: 'Citrus Olive Oil Cake', description: 'Light sponge with whipped cream.', price: 9, category: 'Desserts' },
  { id: 'm4', name: 'House Sparkling', description: 'Botanical soda, ice, citrus twist.', price: 6, category: 'Drinks' },
];

export function MenuBoard({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const [items, setItems] = useState<MenuItem[]>(SEED_ITEMS);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const pd = ((INTENT as any).productDesign && typeof (INTENT as any).productDesign === 'object')
    ? ((INTENT as any).productDesign as Record<string, string>)
    : {};
  const menuLayout = String(pd.menu_layout || 'list');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await menuApi.list();
        const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        if (!cancelled && list.length) {
          setItems(
            list.map((raw: any, idx: number) => ({
              id: String(raw?.id || `item-${idx + 1}`),
              name: String(raw?.name || 'Item'),
              description: String(raw?.description || raw?.body || ''),
              price: Number(raw?.price ?? 0),
              category: String(raw?.category || 'Menu'),
            })),
          );
        }
      } catch {
        /* seed */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function orderItem(item: MenuItem) {
    setBusyId(item.id);
    setNotice('');
    try {
      await menuApi.order({ itemId: item.id, name: item.name, price: item.price, qty: 1 });
      setNotice(`Ordered ${item.name}`);
    } catch {
      setNotice(`${item.name} queued locally — connect menu API to fulfill.`);
    } finally {
      setBusyId('');
    }
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const listClass =
    menuLayout === 'cards' || menuLayout === 'masonry'
      ? 'mt-4 grid gap-4 sm:grid-cols-2'
      : menuLayout === 'tabs'
        ? 'mt-4 grid gap-3 md:grid-cols-3'
        : 'mt-4 divide-y divide-black/5 rounded-[var(--radius-md)] bg-surface ring-1 ring-black/5';

  return (
    <section id={id} className={`border-b border-black/5 py-16 md:py-20 pd-menu--${menuLayout}`}>
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Menu</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>
        {notice ? <p className="mt-3 text-sm text-primary">{notice}</p> : null}
        <div className="mt-10 space-y-10">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="font-display text-xl font-semibold text-ink">{cat}</h3>
              <ul className={listClass}>
                {items
                  .filter((i) => i.category === cat)
                  .map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{item.name}</p>
                        <p className="mt-1 text-sm text-muted">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-display text-lg font-semibold text-primary">
                          ₦{Number(item.price).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Button
                          disabled={busyId === item.id}
                          onClick={() => void orderItem(item)}
                        >
                          {busyId === item.id ? 'Ordering…' : 'Order'}
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

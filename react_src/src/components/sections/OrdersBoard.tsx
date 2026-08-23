import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { ordersApi } from '@/services/apiClient';

type Order = { id: string; label: string; status: string; total: number; when: string };

const SEED_ORDERS: Order[] = [
  { id: 'o1', label: 'Heritage Salad + Flatbread', status: 'Preparing', total: 28, when: '2m ago' },
  { id: 'o2', label: 'Citrus Olive Oil Cake', status: 'Ready', total: 9, when: '18m ago' },
  { id: 'o3', label: 'House Sparkling ×2', status: 'Delivered', total: 12, when: '1h ago' },
];

export function OrdersBoard({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await ordersApi.list();
        const list = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
        if (!cancelled && list.length) {
          setOrders(
            list.map((raw: any, idx: number) => ({
              id: String(raw?.id || `o${idx + 1}`),
              label: String(raw?.label || raw?.items_summary || raw?.title || 'Order'),
              status: String(raw?.status || 'Open'),
              total: Number(raw?.total ?? raw?.amount ?? 0),
              when: String(raw?.when || raw?.created_at || ''),
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

  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Orders</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>
        <ul className="mt-10 divide-y divide-black/5 rounded-[var(--radius-md)] bg-surface ring-1 ring-black/5">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold text-ink">{order.label}</p>
                <p className="mt-1 text-xs text-muted">{order.when}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {order.status}
                </span>
                <p className="font-display text-lg font-semibold text-ink">
                  ₦{Number(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { notificationsApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

export function NotifsShell({ id, title, body }: { id?: string; title: string; body: string }) {
  const { user } = useAuth() as any;
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const notifsLayout = String(design.notifs_layout || 'notifs-list');
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.id) return;
    void notificationsApi.list().then((d) => setItems(d?.notifications || [])).catch(() => setItems([]));
  }, [user?.id]);
  if (!user?.id) {
    return <section id={id} className="px-4 py-16 text-center"><p className="text-muted">Sign in to see notifications.</p></section>;
  }
  const grouped = notifsLayout === 'notifs-grouped'
    ? Object.entries(items.reduce((acc: Record<string, any[]>, n) => {
        const k = String(n.kind || 'other');
        (acc[k] = acc[k] || []).push(n);
        return acc;
      }, {}))
    : null;

  return (
    <section id={id} className={`mx-auto max-w-xl px-4 py-6 social-notifs--${notifsLayout}`}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">{title || 'Notifications'}</h1>
        <button type="button" className="text-xs font-semibold text-primary" onClick={async () => {
          await notificationsApi.markRead();
          setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        }}>Mark all read</button>
      </div>
      <p className="mt-1 text-sm text-muted">{body}</p>
      {grouped ? (
        <div className="mt-4 space-y-4">
          {grouped.map(([kind, rows]) => (
            <div key={kind}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{kind}</p>
              <ul className="mt-2 space-y-2">
                {rows.map((n: any) => (
                  <li key={n.id} className={`rounded-xl bg-surface p-3 text-sm ring-1 ring-black/5 ${n.read ? '' : 'bg-primary/5'}`}>
                    <p className="font-medium">{n.text || n.kind}</p>
                    <p className="text-xs text-muted">{n.time || n.actor_name}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
      {!grouped ? (
      <ul className={notifsLayout === 'notifs-cards' ? 'mt-4 grid gap-3' : 'mt-4 space-y-2'}>
        {items.map((n) => (
          <li key={n.id} className={`rounded-xl bg-surface p-3 text-sm ring-1 ring-black/5 ${notifsLayout === 'notifs-cards' ? 'shadow-sm' : ''} ${n.read ? '' : 'bg-primary/5'}`}>
            <p className="font-medium">{n.text || n.kind}</p>
            <p className="text-xs text-muted">{n.time || n.actor_name}</p>
          </li>
        ))}
        {!items.length ? <li className="text-sm text-muted">No notifications yet.</li> : null}
      </ul>
      ) : null}
    </section>
  );
}

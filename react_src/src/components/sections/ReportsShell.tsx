import { useEffect, useState } from 'react';
import { moderationApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export function ReportsShell({ id, title, body }: { id?: string; title: string; body: string }) {
  const { user } = useAuth() as any;
  const [rows, setRows] = useState<any[]>([]);
  const isAdmin = String(user?.role || '') === 'admin';
  useEffect(() => {
    if (!isAdmin) return;
    void moderationApi.listReports('open').then((d) => setRows(d?.reports || [])).catch(() => setRows([]));
  }, [isAdmin]);
  if (!isAdmin) {
    return <section id={id} className="px-4 py-16 text-center"><p className="text-muted">Admin only.</p></section>;
  }
  return (
    <section id={id} className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold">{title || 'Reports'}</h1>
      <p className="mt-1 text-sm text-muted">{body}</p>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl bg-surface p-3 text-sm ring-1 ring-black/5">
            <div>
              <p className="font-semibold">{r.target_type} · {r.target_id}</p>
              <p className="text-muted">{r.reason || 'No reason'}</p>
            </div>
            <button type="button" className="text-xs font-semibold text-primary" onClick={async () => {
              await moderationApi.resolveReport(r.id);
              setRows((prev) => prev.filter((x) => x.id !== r.id));
            }}>Resolve</button>
          </li>
        ))}
        {!rows.length ? <li className="text-sm text-muted">Inbox is clear.</li> : null}
      </ul>
    </section>
  );
}

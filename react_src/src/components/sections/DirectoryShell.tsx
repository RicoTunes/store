import { useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { directoryApi } from '@/services/apiClient';

type DirectoryRow = { id: string; name: string; meta: string };

export function DirectoryShell({
  id,
  title,
  body,
  directoryKind = 'people',
}: {
  id?: string;
  title: string;
  body: string;
  directoryKind?: string;
}) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [name, setName] = useState('');
  const [meta, setMeta] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    void directoryApi.list(directoryKind).then((data) => {
      if (cancelled) return;
      const records = Array.isArray(data?.records) ? data.records : [];
      setRows(records.map((r: any) => ({
        id: String(r.id),
        name: String(r.name || ''),
        meta: String(r.meta || ''),
      })));
    }).catch(() => setRows([]));
    return () => { cancelled = true; };
  }, [directoryKind]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => `${r.name} ${r.meta}`.toLowerCase().includes(needle));
  }, [rows, q]);

  async function addRecord() {
    const n = name.trim();
    if (!n) return;
    try {
      const res = await directoryApi.upsert(directoryKind, { name: n, meta: meta.trim() });
      if (res?.record) {
        setRows((prev) => [...prev, { id: res.record.id, name: res.record.name, meta: res.record.meta || '' }]);
        setName('');
        setMeta('');
        setStatus('Saved to Dwene Cloud');
      }
    } catch (err: any) {
      setStatus(err?.message || 'Could not save');
    }
  }

  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{directoryKind}</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search records" className="mt-6 w-full max-w-md rounded-md border border-black/10 bg-background px-3 py-2 text-sm" />
        <div className="mt-4 flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New record name" className="rounded-md border border-black/10 bg-background px-3 py-2 text-sm" />
          <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Meta" className="rounded-md border border-black/10 bg-background px-3 py-2 text-sm" />
          <Button type="button" onClick={() => void addRecord()}>Add</Button>
        </div>
        {status ? <p className="mt-2 text-sm text-muted">{status}</p> : null}
        <ul className="mt-6 divide-y divide-black/5 rounded-[var(--radius-md)] bg-surface ring-1 ring-black/5">
          {filtered.length === 0 ? (
            <li className="px-5 py-4 text-sm text-muted">No records yet — add one above. Data persists on this site token.</li>
          ) : filtered.map((r) => (
            <li key={r.id} className="px-5 py-4">
              <p className="font-semibold text-ink">{r.name}</p>
              <p className="text-sm text-muted">{r.meta}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

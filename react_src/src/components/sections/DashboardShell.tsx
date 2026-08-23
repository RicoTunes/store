import { Container } from '@/components/ui/Container';
import { INTENT } from '@/config/site';

const KPIS = [
  { label: 'Active users', value: '1,284', delta: '+6.2%' },
  { label: 'Revenue', value: '$48.2k', delta: '+3.1%' },
  { label: 'Conversion', value: '4.8%', delta: '+0.4%' },
  { label: 'Open tasks', value: '17', delta: '-2' },
];

const ACTIVITY = [
  { id: 'a1', text: 'New order #4821 marked ready', when: '4m ago' },
  { id: 'a2', text: 'Booking confirmed for Friday 10:30', when: '22m ago' },
  { id: 'a3', text: 'Agent run completed: weekly summary', when: '1h ago' },
  { id: 'a4', text: 'Staff directory updated', when: '3h ago' },
];

export function DashboardShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const pd = ((INTENT as any).productDesign && typeof (INTENT as any).productDesign === 'object')
    ? ((INTENT as any).productDesign as Record<string, string>)
    : {};
  const dash = String(pd.dashboard || 'kpi-grid');
  const kpiClass =
    dash === 'table-first' ? 'mt-10 grid gap-3'
    : dash === 'kanban' ? 'mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
    : dash === 'timeline' ? 'mt-10 grid gap-4 md:grid-cols-2'
    : dash === 'cards' ? 'mt-10 grid gap-4 sm:grid-cols-2'
    : 'mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4';
  const showActivityFirst = dash === 'timeline' || dash === 'table-first';
  return (
    <section id={id} className={`border-b border-black/5 py-16 md:py-20 pd-dashboard--${dash}`}>
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Dashboard</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>

        {showActivityFirst ? (
          <div className="mt-10 rounded-[var(--radius-md)] bg-surface p-6 ring-1 ring-black/5">
            <h3 className="font-display text-xl font-semibold text-ink">Recent activity</h3>
            <ul className="mt-4 divide-y divide-black/5">
              {ACTIVITY.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-ink">{row.text}</span>
                  <span className="shrink-0 text-xs text-muted">{row.when}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={kpiClass}>
          {KPIS.map((kpi) => (
            <article key={kpi.label} className="rounded-[var(--radius-md)] bg-surface p-5 ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{kpi.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{kpi.value}</p>
              <p className="mt-1 text-sm text-primary">{kpi.delta}</p>
            </article>
          ))}
        </div>

        {!showActivityFirst ? (
          <div className="mt-10 rounded-[var(--radius-md)] bg-surface p-6 ring-1 ring-black/5">
            <h3 className="font-display text-xl font-semibold text-ink">Recent activity</h3>
            <ul className="mt-4 divide-y divide-black/5">
              {ACTIVITY.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-ink">{row.text}</span>
                  <span className="shrink-0 text-xs text-muted">{row.when}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

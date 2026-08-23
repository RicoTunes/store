import { Container } from '@/components/ui/Container';
import { Reveal, TextReveal } from '@/motion/primitives';

function rowsFromBody(body: string) {
  const parts = (body || '')
    .split(/[.;|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .slice(0, 6);
  if (parts.length === 0) {
    return [
      { feature: 'Clarity', us: 'Transparent from day one', them: 'Hidden fees and fine print' },
      { feature: 'Speed', us: 'Fast, reliable turnaround', them: 'Slow, inconsistent delivery' },
      { feature: 'Support', us: 'Real people who follow up', them: 'Automated replies only' },
    ];
  }
  return parts.map((raw) => {
    const vs = raw.match(/^(.+?)\s+(?:vs\.?|versus|→|->)\s+(.+)$/i);
    if (vs) return { feature: vs[1].trim(), us: vs[1].trim(), them: vs[2].trim() };
    const labeled = raw.match(/^([^:—-]{2,24})\s*[:—-]\s*(.+)$/);
    if (labeled) return { feature: labeled[1].trim(), us: labeled[2].trim(), them: 'Typical alternative' };
    return { feature: raw.split(/\s+/).slice(0, 2).join(' '), us: raw, them: '—' };
  });
}

export function Comparison({ id, title, body, kicker }: { id?: string; title: string; body: string; kicker?: string; chrome?: string }) {
  const rows = rowsFromBody(body);
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker || 'Compare'}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        </Reveal>
        <div className="mt-10 grid gap-0 overflow-hidden rounded-[var(--radius-md)] ring-1 ring-black/5 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="hidden bg-surface/50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted lg:block" aria-hidden />
          <div className="border-b border-black/5 bg-primary/5 px-5 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-primary lg:border-b-0">
            With us
          </div>
          <div className="border-b border-black/5 bg-surface px-5 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted lg:border-b-0">
            Without
          </div>
          {rows.map((row, idx) => (
            <div key={row.feature + idx} className="contents">
              <div className="border-t border-black/5 bg-surface/50 px-5 py-4 font-semibold text-ink">{row.feature}</div>
              <div className="border-t border-black/5 bg-primary/5 px-5 py-4 text-sm text-ink">{row.us}</div>
              <div className="border-t border-black/5 bg-surface px-5 py-4 text-sm text-muted">{row.them}</div>
            </div>
          ))}
        </div>
        {body ? (
          <Reveal delay={0.08} className="mt-8 max-w-3xl">
            <TextReveal text={body} className="text-sm leading-relaxed text-muted" />
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}

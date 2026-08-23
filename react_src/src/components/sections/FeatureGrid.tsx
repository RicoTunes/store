import { Container } from '@/components/ui/Container';
import { Reveal, Stagger, StaggerItem, TextReveal } from '@/motion/primitives';

function cardsFromBody(body: string) {
  const parts = (body || '')
    .split(/[.;|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 6);
  const blob = `${body || ''}`.toLowerCase();
  const labels = /\b(hotel|resort|suite|spa|guest)\b/.test(blob)
    ? ['Suites', 'Dining', 'Spa', 'Concierge', 'Location', 'Events']
    : /\b(cafe|restaurant|bistro|menu)\b/.test(blob)
      ? ['Menu', 'Ambience', 'Ingredients', 'Service', 'Reservations', 'Hours']
      : /\b(shop|store|product|retail|cart)\b/.test(blob)
        ? ['Curated', 'Quality', 'Shipping', 'Support', 'Returns', 'New']
        : /\b(gift\s*card|payout|exchange|naira|fintech|wallet|rates?)\b/.test(blob)
          ? ['Rates', 'Speed', 'Security', 'Payouts', 'Support', 'Coverage']
          : /\b(saas|software|dashboard|analytics|platform)\b/.test(blob)
            ? ['Speed', 'Clarity', 'Insights', 'Integrations', 'Security', 'Support']
            : ['Clarity', 'Care', 'Craft', 'Calm', 'Confidence', 'Continuity'];
  const titleFrom = (d: string, i: number) => {
    const labeled = d.match(/^([^:—-]{2,28})\s*[:—-]\s*(.+)$/);
    if (labeled) return { t: labeled[1].trim(), d: labeled[2].trim() };
    const words = d.split(/\s+/).filter(Boolean);
    if (words.length >= 6) {
      return { t: words.slice(0, 2).join(' '), d };
    }
    return { t: labels[i] || `Point ${i + 1}`, d };
  };
  if (parts.length === 0) {
    return labels.slice(0, 3).map((t, i) => ({
      t,
      d: ['Thoughtful details in every visit.', 'Support that feels personal.', 'Process you can trust.'][i],
    }));
  }
  return parts.map((d, i) => titleFrom(d, i));
}

export function FeatureGrid({ id, title, body, gridClass, chrome, kicker, presentation = 'cards' }: { id?: string; title: string; body: string; gridClass?: string; chrome?: string; kicker?: string; presentation?: string }) {
  const cards = cardsFromBody(body);
  const mode = presentation || 'cards';
  const cardChrome = (() => {
    if (mode === 'editorial' || mode === 'none' || chrome === 'editorial') {
      return 'border-t border-black/15 bg-transparent px-0 py-5';
    }
    if (mode === 'list' || mode === 'full-width') {
      return 'rounded-[var(--radius-md)] border border-black/10 bg-surface/80 p-5 sm:p-6';
    }
    if (mode === 'split') {
      return 'rounded-[var(--radius-md)] border border-black/8 bg-surface p-6 md:flex md:items-start md:gap-6';
    }
    switch (chrome) {
      case 'bordered':
        return 'rounded-[var(--radius-md)] border border-black/10 bg-surface p-6';
      case 'glass':
        return 'rounded-[var(--radius-md)] bg-surface/60 p-6 ring-1 ring-white/40 backdrop-blur shadow-[0_12px_40px_-28px_rgba(0,0,0,0.35)]';
      case 'brutalist':
        return 'rounded-none border-2 border-ink bg-surface p-6 shadow-[6px_6px_0_0_var(--color-primary)]';
      case 'editorial':
        return 'border-t border-black/15 bg-transparent px-0 py-5';
      case 'pill':
        return 'rounded-[2rem] bg-surface/95 p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.28)] ring-1 ring-black/5';
      default:
        return 'group relative overflow-hidden rounded-[var(--radius-md)] bg-surface/90 p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.35)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-primary/25';
    }
  })();
  const layoutClass =
    mode === 'list' || mode === 'full-width' || mode === 'editorial' || mode === 'none'
      ? 'grid gap-3'
      : mode === 'tiles'
        ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
        : mode === 'split'
          ? 'grid gap-4'
          : (gridClass || 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3');
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker || 'Capabilities'}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        </Reveal>
        <Stagger className={`mt-10 ${layoutClass}`}>
          {cards.map((c, idx) => (
            <StaggerItem key={c.t + idx}>
              <article className={cardChrome}>
                <span className="font-display text-3xl font-bold text-primary/25 transition group-hover:text-primary/45">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="mt-3 font-semibold text-ink md:mt-0">{c.t}</h3>
                  <TextReveal text={c.d} className="mt-2 text-sm leading-relaxed text-muted" />
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

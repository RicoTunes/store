import { Container } from '@/components/ui/Container';
import { Reveal } from '@/motion/primitives';

function statsFromBody(body: string) {
  const parts = (body || '')
    .split(/[.;|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4)
    .slice(0, 4);
  const defaults = [
    { value: '98%', label: 'Satisfaction', detail: 'Clients who return' },
    { value: '24h', label: 'Response', detail: 'Average reply time' },
    { value: '10+', label: 'Years', detail: 'In the field' },
  ];
  if (parts.length === 0) {
    return defaults.map((d, i) => ({ ...d, detail: i === 0 ? (body || d.detail) : d.detail }));
  }
  return parts.map((raw, i) => {
    const numMatch = raw.match(/^([\d+%+kK.]+(?:\s*[kKmM])?)\s*(.+)$/);
    if (numMatch) return { value: numMatch[1].trim(), label: numMatch[2].trim().slice(0, 24), detail: raw };
    const labeled = raw.match(/^([^:—-]{2,20})\s*[:—-]\s*(.+)$/);
    if (labeled) {
      const valGuess = labeled[2].match(/^([\d.%+]+)/);
      return {
        value: valGuess ? valGuess[1] : String(i + 1).padStart(2, '0'),
        label: labeled[1].trim(),
        detail: labeled[2].trim(),
      };
    }
    return { value: String(i + 1).padStart(2, '0'), label: raw.split(/\s+/).slice(0, 2).join(' '), detail: raw };
  });
}

export function StatStrip({ id, title, body, kicker }: { id?: string; title: string; body: string; kicker?: string; chrome?: string }) {
  const stats = statsFromBody(body);
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <Reveal className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker || 'By the numbers'}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, idx) => (
            <article
              key={s.label + idx}
              className="border-t-2 border-primary/30 pt-6"
            >
              <p className="font-display text-5xl font-bold tracking-tight text-primary md:text-6xl">{s.value}</p>
              <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink">{s.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.detail}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

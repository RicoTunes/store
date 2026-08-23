import { Container } from '@/components/ui/Container';
import { Reveal, TextReveal } from '@/motion/primitives';

function milestonesFromBody(body: string) {
  const parts = (body || '')
    .split(/[.;|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .slice(0, 6);
  if (parts.length === 0) {
    return [
      { label: 'Start', detail: body || 'Where the journey begins.' },
      { label: 'Build', detail: 'Craft, iterate, and refine with care.' },
      { label: 'Deliver', detail: 'Ship outcomes people can feel.' },
    ];
  }
  return parts.map((detail, i) => {
    const labeled = detail.match(/^([^:—-]{2,24})\s*[:—-]\s*(.+)$/);
    if (labeled) return { label: labeled[1].trim(), detail: labeled[2].trim() };
    const words = detail.split(/\s+/).filter(Boolean);
    const label = words.length >= 2 ? words.slice(0, 2).join(' ') : `Phase ${i + 1}`;
    return { label, detail };
  });
}

export function Timeline({ id, title, body, kicker }: { id?: string; title: string; body: string; kicker?: string; chrome?: string }) {
  const items = milestonesFromBody(body);
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker || 'Timeline'}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        </Reveal>
        <div className="mt-12 overflow-x-auto pb-2">
          <ol className="flex min-w-[36rem] gap-0 md:min-w-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {items.map((item, idx) => (
              <li key={item.label + idx} className="relative flex-1 px-4 first:pl-0 last:pr-0">
                {idx < items.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[calc(50%+1.25rem)] top-5 hidden h-px w-[calc(100%-2.5rem)] bg-black/10 md:block"
                  />
                ) : null}
                <div className="relative">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{item.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

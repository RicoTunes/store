import { Container } from '@/components/ui/Container';
import { Reveal, TextReveal } from '@/motion/primitives';

function stepsFromBody(body: string) {
  const parts = (body || '')
    .split(/[.;|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .slice(0, 5);
  if (parts.length === 0) {
    return [
      { title: 'Discover', detail: body || 'Understand goals and constraints.' },
      { title: 'Plan', detail: 'Map a clear path forward.' },
      { title: 'Execute', detail: 'Deliver with attention to detail.' },
    ];
  }
  return parts.map((raw, i) => {
    const labeled = raw.match(/^([^:—-]{2,28})\s*[:—-]\s*(.+)$/);
    if (labeled) return { title: labeled[1].trim(), detail: labeled[2].trim() };
    const words = raw.split(/\s+/).filter(Boolean);
    return {
      title: words.length >= 2 ? words.slice(0, 2).join(' ') : `Step ${i + 1}`,
      detail: raw,
    };
  });
}

export function ProcessSteps({ id, title, body, kicker }: { id?: string; title: string; body: string; kicker?: string; chrome?: string }) {
  const steps = stepsFromBody(body);
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker || 'Process'}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
            <p className="mt-4 max-w-md text-sm text-muted">{steps.length} clear steps — no guesswork.</p>
          </Reveal>
          <ol className="relative space-y-0">
            {steps.map((step, idx) => (
              <li key={step.title + idx} className="relative grid grid-cols-[3rem_1fr] gap-x-4 gap-y-1 pb-10 last:pb-0">
                {idx < steps.length - 1 ? (
                  <span aria-hidden className="absolute left-[1.45rem] top-10 bottom-0 w-px bg-black/10" />
                ) : null}
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-ink font-display text-lg font-bold text-background">
                  {idx + 1}
                </span>
                <div className="pt-1">
                  <h3 className="font-semibold text-ink">{step.title}</h3>
                  <TextReveal text={step.detail} className="mt-2 text-sm leading-relaxed text-muted" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

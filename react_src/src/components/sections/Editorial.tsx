import { Container } from '@/components/ui/Container';
import { Reveal, TextReveal } from '@/motion/primitives';

function paragraphsFromBody(body: string) {
  const parts = (body || '')
    .split(/\n\n+|(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
  if (parts.length === 0) return [body || ''];
  return parts.slice(0, 4);
}

export function Editorial({ id, title, body, kicker }: { id?: string; title: string; body: string; kicker?: string; chrome?: string }) {
  const paras = paragraphsFromBody(body);
  const lead = paras[0] || body;
  const rest = paras.slice(1);
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <Reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{kicker || 'Story'}</p>
            <h2 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-5xl lg:text-[3.25rem]">
              {title}
            </h2>
          </Reveal>
          <div className="lg:pt-12">
            <p className="text-lg font-medium leading-relaxed text-ink md:text-xl">{lead}</p>
            {rest.map((p, idx) => (
              <Reveal key={idx} delay={0.06 * (idx + 1)}>
                <TextReveal text={p} className="mt-6 text-base leading-relaxed text-muted" />
              </Reveal>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none mt-16 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent"
        />
      </Container>
    </section>
  );
}

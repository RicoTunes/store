import { Container } from '@/components/ui/Container';
import { Reveal, TextReveal } from '@/motion/primitives';

export function Section({ id, title, body }: { id?: string; title: string; body: string }) {
  return (
    <section id={id} className="relative border-b border-black/5 py-16 md:py-20">
      <Container>
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Overview</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
          </Reveal>
          {body ? (
            <Reveal delay={0.08}>
              <TextReveal text={body} className="text-base leading-relaxed text-muted md:pt-8 md:text-lg" />
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Reveal, TextReveal } from '@/motion/primitives';

function highlightsFromBody(body: string) {
  const parts = (body || '')
    .split(/[.;|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .slice(0, 4);
  if (parts.length === 0) return [body || 'Crafted with care and built to last.'];
  return parts;
}

export function Showcase({ id, title, body, kicker }: { id?: string; title: string; body: string; kicker?: string; chrome?: string }) {
  const highlights = highlightsFromBody(body);
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <Reveal className="order-2 lg:order-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker || 'Featured'}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
            <ul className="mt-8 space-y-4 border-l-2 border-primary/30 pl-5">
              {highlights.map((h, idx) => (
                <li key={idx} className="text-base leading-relaxed text-muted">
                  <span className="sr-only">Highlight {idx + 1}: </span>
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/contact"><Button>Learn more</Button></Link>
              <Link to="/about"><Button variant="outline">Our approach</Button></Link>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="order-1 lg:order-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius-md)+0.35rem)] bg-gradient-to-br from-primary/25 via-surface to-secondary/20 ring-1 ring-black/5">
              <div
                aria-hidden
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    'radial-gradient(ellipse 70% 60% at 30% 20%, color-mix(in srgb, var(--color-primary) 40%, transparent), transparent 55%)',
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 border-t border-black/5 bg-surface/80 p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Spotlight</p>
                <TextReveal text={highlights[0] || body} className="mt-2 text-sm leading-relaxed text-ink" />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

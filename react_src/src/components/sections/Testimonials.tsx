import { Container } from '@/components/ui/Container';
import { Reveal, Stagger, StaggerItem } from '@/motion/primitives';

export function Testimonials({ id, title, body }: { id?: string; title: string; body: string }) {
  const quotes = [
    { name: 'Alex M.', role: 'Client', text: body || 'A calm, polished experience from the first visit.' },
    { name: 'Jordan Lee', role: 'Patient', text: 'Clear messaging and a team that actually follows through.' },
    { name: 'Sam Rivera', role: 'Family', text: 'Felt premium without being complicated — we keep coming back.' },
  ];
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Stories</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
          {quotes.map((q) => (
            <StaggerItem key={q.name}>
              <blockquote className="flex h-full flex-col rounded-[var(--radius-md)] bg-surface p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
                <p className="flex-1 text-sm leading-relaxed text-muted">“{q.text}”</p>
                <footer className="mt-5 border-t border-black/5 pt-4">
                  <p className="text-sm font-semibold text-ink">{q.name}</p>
                  <p className="text-xs text-muted">{q.role}</p>
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

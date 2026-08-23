import { useState } from 'react';
import { Container } from '@/components/ui/Container';

export function FAQ({ id, title, body }: { id?: string; title: string; body: string }) {
  const items = [
    { q: 'How do I get started?', a: body || 'Reach out and we will guide you through onboarding.' },
    { q: 'What should I expect on a first visit?', a: 'A calm conversation about your goals, a clear plan, and time for questions — never a rush.' },
    { q: 'Do you accept new clients?', a: 'Yes. Share a little about what you need and we will find a time that works.' },
    { q: 'Can I change details later?', a: 'Absolutely. Message us anytime — we keep follow-ups simple and responsive.' },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">FAQ</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
            <p className="mt-3 max-w-md text-muted">Straight answers so you can decide with confidence.</p>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const isOpen = open === idx;
              return (
                <div key={item.q} className="rounded-[var(--radius-md)] bg-surface ring-1 ring-black/5">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : idx)}
                  >
                    <span className="font-semibold text-ink">{item.q}</span>
                    <span className="text-primary" aria-hidden>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen ? <p className="border-t border-black/5 px-5 py-4 text-sm leading-relaxed text-muted">{item.a}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

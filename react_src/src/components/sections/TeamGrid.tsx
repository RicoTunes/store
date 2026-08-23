import { Container } from '@/components/ui/Container';
import { Reveal, TextReveal } from '@/motion/primitives';

function membersFromBody(body: string) {
  const parts = (body || '')
    .split(/[.;|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .slice(0, 6);
  if (parts.length === 0) {
    return [
      { name: 'Lead', role: 'Founder', bio: body || 'Sets direction and keeps standards high.' },
      { name: 'Partner', role: 'Operations', bio: 'Makes sure every detail lands on time.' },
    ];
  }
  return parts.map((raw) => {
    const named = raw.match(/^([^,—-]{2,32})\s*[,—-]\s*(.+)$/);
    if (named) {
      const roleMatch = named[2].match(/^([^:—-]{2,24})\s*[:—-]\s*(.+)$/);
      if (roleMatch) return { name: named[1].trim(), role: roleMatch[1].trim(), bio: roleMatch[2].trim() };
      return { name: named[1].trim(), role: 'Team', bio: named[2].trim() };
    }
    const labeled = raw.match(/^([^:—-]{2,24})\s*[:—-]\s*(.+)$/);
    if (labeled) return { name: labeled[1].trim(), role: 'Team', bio: labeled[2].trim() };
    const words = raw.split(/\s+/).filter(Boolean);
    return { name: words.slice(0, 2).join(' '), role: 'Team', bio: raw };
  });
}

export function TeamGrid({ id, title, body, kicker }: { id?: string; title: string; body: string; kicker?: string; chrome?: string }) {
  const members = membersFromBody(body);
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker || 'Team'}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        </Reveal>
        <div className="mt-12 space-y-0 divide-y divide-black/5">
          {members.map((m, idx) => (
            <article
              key={m.name + idx}
              className={`grid gap-6 py-10 md:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] md:items-start ${
                idx % 2 === 1 ? 'md:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)]' : ''
              }`}
            >
              <div className={idx % 2 === 1 ? 'md:order-2 md:text-right' : ''}>
                <div
                  className={`inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 font-display text-2xl font-bold text-primary ${
                    idx % 2 === 1 ? 'md:ml-auto' : ''
                  }`}
                  aria-hidden
                >
                  {m.name.slice(0, 1).toUpperCase()}
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink">{m.name}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary">{m.role}</p>
              </div>
              <div className={idx % 2 === 1 ? 'md:order-1' : ''}>
                <TextReveal text={m.bio} className="text-base leading-relaxed text-muted" />
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export function Pricing({ id, title, body }: { id?: string; title: string; body: string }) {
  const plans = [
    { name: 'Starter', price: '$19', detail: body || 'Essentials to get going.', featured: false },
    { name: 'Growth', price: '$49', detail: 'For teams ready to scale.', featured: true },
    { name: 'Pro', price: '$99', detail: 'Advanced tools and priority support.', featured: false },
  ];
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-3 text-muted">{body}</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <article
              key={p.name}
              className={`rounded-[var(--radius-md)] p-6 ring-1 ${
                p.featured
                  ? 'bg-primary text-white ring-primary shadow-lg'
                  : 'bg-surface ring-black/5'
              }`}
            >
              <h3 className={`font-semibold ${p.featured ? 'text-white' : ''}`}>{p.name}</h3>
              <p className={`mt-2 font-display text-4xl ${p.featured ? 'text-white' : 'text-primary'}`}>{p.price}</p>
              <p className={`mt-3 text-sm ${p.featured ? 'text-white/80' : 'text-muted'}`}>{p.detail}</p>
              <Link to="/contact" className="mt-5 block">
                <Button className={p.featured ? '!bg-white !text-[#0f172a] w-full' : 'w-full'} variant={p.featured ? 'primary' : 'outline'}>
                  Choose {p.name}
                </Button>
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

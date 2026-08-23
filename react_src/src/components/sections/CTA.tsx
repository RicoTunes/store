import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function CTA({ id, title, body, chrome, kicker }: { id?: string; title: string; body: string; chrome?: string; kicker?: string }) {
  const useGradient = chrome !== 'bordered' && chrome !== 'editorial';
  const shell =
    chrome === 'brutalist'
      ? 'relative overflow-hidden rounded-none border-2 border-ink px-6 py-12 text-center sm:px-10 md:py-14'
      : chrome === 'editorial'
        ? 'relative overflow-hidden border-y border-black/15 px-6 py-12 text-center sm:px-10 md:py-14'
        : chrome === 'bordered'
          ? 'relative overflow-hidden rounded-[var(--radius-md)] border border-black/10 bg-surface px-6 py-12 text-center sm:px-10 md:py-14'
          : 'relative overflow-hidden rounded-[calc(var(--radius-md)+0.5rem)] px-6 py-12 text-center sm:px-10 md:py-14';
  return (
    <section id={id} className="py-16 md:py-20">
      <Container>
        <motion.div
          className={shell}
          style={useGradient ? {
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 88%, #000), color-mix(in srgb, var(--color-secondary) 55%, var(--color-primary)))',
          } : undefined}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.55 }}
        >
          {useGradient ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30"
              style={{ background: 'radial-gradient(circle at 80% 20%, #fff, transparent 45%)' }}
            />
          ) : null}
          {kicker ? <p className={`relative mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${useGradient ? 'text-white/80' : 'text-primary'}`}>{kicker}</p> : null}
          <h2 className={`relative font-display text-3xl font-semibold tracking-tight md:text-4xl ${useGradient ? 'text-white' : 'text-ink'}`}>{title}</h2>
          <p className={`relative mx-auto mt-3 max-w-xl text-base ${useGradient ? 'text-white/85' : 'text-muted'}`}>{body}</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact"><Button className={useGradient ? '!bg-white !text-[#0f172a] hover:!opacity-95' : undefined}>Contact us</Button></Link>
            <Link to="/about"><Button variant="outline" className={useGradient ? '!border-white/50 !text-white hover:!bg-white/10' : undefined}>About</Button></Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

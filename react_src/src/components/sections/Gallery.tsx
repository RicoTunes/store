import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Reveal, Stagger, StaggerItem } from '@/motion/primitives';

function photo(seed: string, key: string) {
  const s = String(seed || 'dwene');
  const topic = /\\b(hotel|resort|suite|spa)\\b/i.test(s)
    ? 'hotel,interior'
    : /\\b(cafe|restaurant|bistro)\\b/i.test(s)
      ? 'restaurant,food'
      : /\\b(shop|store|retail|fashion|sneak)\\b/i.test(s)
        ? 'boutique,retail,sneakers'
        : 'workspace,lifestyle,creative';
  const lock = Math.abs(
    Array.from(`${s}-${key}`).reduce((a, c) => a + c.charCodeAt(0), 0),
  ) % 10000;
  // Avoid picsum — random seeds often resolve to White House / landmark placeholders.
  return `https://loremflickr.com/900/700/${encodeURIComponent(topic)}/all?lock=${lock}`;
}

function captionsFromBody(body: string, title: string, count: number) {
  const parts = (body || '')
    .split(/[.|;•\\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  const brand = (title || 'Gallery').trim();
  return Array.from({ length: count }, (_, i) => {
    if (parts[i]) return parts[i];
    if (parts.length === 1) return parts[0];
    return `Moment ${i + 1} · ${brand}`;
  });
}

const ASPECTS = ['aspect-[4/5]', 'aspect-square', 'aspect-[5/4]', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-square'];

export function Gallery({
  id = 'gallery',
  title,
  body,
  mediaSeed = 'dwene',
  images = [],
}: {
  id?: string;
  title: string;
  body: string;
  mediaSeed?: string;
  images?: string[];
}) {
  const custom = (images || []).filter(Boolean);
  const count = custom.length ? custom.length : 8;
  const captions = captionsFromBody(body, title, count);
  const shots = (custom.length
    ? custom.map((src, i) => ({ src, label: captions[i] || `Moment ${i + 1}` }))
    : Array.from({ length: count }, (_, i) => ({
        src: photo(mediaSeed, `gal-${i}`),
        label: captions[i] || `Moment ${i + 1}`,
      }))
  );
  const [open, setOpen] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((n) => (n === null ? n : (n + 1) % shots.length));
      if (e.key === 'ArrowLeft') setOpen((n) => (n === null ? n : (n - 1 + shots.length) % shots.length));
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, shots.length]);

  function go(delta: number) {
    setOpen((n) => {
      if (n === null) return n;
      return (n + delta + shots.length) % shots.length;
    });
  }

  function onPointerDown(e: { clientX: number; clientY: number }) {
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
  }

  function onPointerUp(e: { clientX: number; clientY: number }) {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.clientX - touchStartX.current;
    const dy = e.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    go(dx < 0 ? 1 : -1);
  }

  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Gallery</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
          <p className="mt-3 text-muted">{body}</p>
        </Reveal>
        <Stagger className="mt-10 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
          {shots.map((shot, i) => (
            <StaggerItem key={shot.src + i}>
              <button
                type="button"
                className="group relative block w-full overflow-hidden rounded-[var(--radius-md)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setOpen(i)}
                aria-label={`View ${shot.label}`}
              >
                <img
                  src={shot.src}
                  alt={shot.label}
                  className={`${ASPECTS[i % ASPECTS.length]} w-full object-cover transition duration-500 group-hover:scale-105`}
                  loading="lazy"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden p-3 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 md:block">
                  <span className="font-display text-sm font-semibold text-white">{shot.label}</span>
                </span>
              </button>
              <span className="mt-2 block px-0.5 font-display text-sm font-medium text-ink md:hidden">
                {shot.label}
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
      <AnimatePresence>
        {open !== null ? (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-ink/88 p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            onClick={() => setOpen(null)}
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <p className="text-sm font-medium tabular-nums text-white/80">
                {open + 1} / {shots.length}
              </p>
              <button
                type="button"
                className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setOpen(null); }}
              >
                Close
              </button>
            </div>
            <div
              className="relative flex min-h-0 flex-1 items-center justify-center"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { touchStartX.current = null; touchStartY.current = null; }}
            >
              {shots.length > 1 ? (
                <button
                  type="button"
                  aria-label="Previous photo"
                  className="absolute left-1 z-10 rounded-full bg-white/15 px-3 py-2 text-xl text-white ring-1 ring-white/20 backdrop-blur sm:left-3"
                  onClick={() => go(-1)}
                >
                  ‹
                </button>
              ) : null}
              <motion.img
                key={shots[open].src + open}
                src={shots[open].src}
                alt={shots[open].label}
                className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl"
                initial={{ scale: 0.94, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                draggable={false}
              />
              {shots.length > 1 ? (
                <button
                  type="button"
                  aria-label="Next photo"
                  className="absolute right-1 z-10 rounded-full bg-white/15 px-3 py-2 text-xl text-white ring-1 ring-white/20 backdrop-blur sm:right-3"
                  onClick={() => go(1)}
                >
                  ›
                </button>
              ) : null}
            </div>
            <div className="mx-auto mt-4 max-w-2xl px-2 text-center" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-lg font-semibold text-white sm:text-xl">{shots[open].label}</p>
              <p className="mt-1 text-sm text-white/65">{title}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

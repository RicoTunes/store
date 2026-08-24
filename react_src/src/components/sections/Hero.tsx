import { HeroScene } from '@/motion/HeroScene';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { TextReveal } from '@/motion/primitives';

function photo(seed: string, key: string, w = 1600, h = 980) {
  const s = String(seed || 'dwene');
  // Never use architecture/landmark topics — those feeds often return White House photos.
  const topic = /\\b(hotel|resort|suite)\\b|\\bspa\\b/i.test(s)
    ? 'hotel,lobby,luxury'
    : /\\b(cafe|restaurant|bistro)\\b/i.test(s)
      ? 'restaurant,food,interior'
      : /\\b(clinic|dental|health|medical)\\b/i.test(s)
        ? 'clinic,modern,interior'
        : /\\b(shop|store|retail|fashion)\\b/i.test(s)
          ? 'boutique,retail,interior'
          : /\\b(gift|fintech|finance|payout|exchange|naira|wallet)\\b/i.test(s)
            ? 'fintech,mobile,payment'
            : /\\b(saas|software|dashboard|analytics)\\b/i.test(s)
              ? 'office,laptop,workspace'
              : /\\b(gym|fitness|yoga)\\b/i.test(s)
                ? 'fitness,gym,lifestyle'
                : 'workspace,lifestyle,creative';
  const lock = Math.abs(
    Array.from(`${s}-${key}`).reduce((a, c) => a + c.charCodeAt(0), 0),
  ) % 10000;
  // Topic-aware stock photos with deterministic lock; CSS fallback covers network failures.
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(topic)}/all?lock=${lock}`;
}

const PHOTO_FALLBACK =
  'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 72%, #0b1220), color-mix(in srgb, var(--color-secondary) 45%, #111827))';

function Photo({
  src,
  className = '',
  alt = '',
  style,
}: {
  src: string;
  className?: string;
  alt?: string;
  style?: Record<string, string | number>;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={(e) => {
        const el = e.currentTarget;
        el.style.objectFit = 'cover';
        el.style.background = PHOTO_FALLBACK;
        el.removeAttribute('src');
      }}
    />
  );
}

function slidesFrom(title: string, body: string, seed: string, images: string[] = []) {
  const parts = (body || '')
    .split(/[.|;•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .slice(0, 8);
  const base = parts.length ? parts : [body || `Welcome to ${title}`];
  const imgs = (images || []).filter(Boolean);
  return base.map((text, i) => ({
    text,
    src: imgs[i] || imgs[i % Math.max(imgs.length, 1)] || photo(seed, `hero-${i}`, 1800, 1100),
    label: i === 0 ? title : `Moment ${i + 1}`,
  }));
}

function slideMotion(
  transition: string,
  direction: string,
  phase: 'enter' | 'exit' | 'center',
) {
  const dir = String(direction || 'left-to-right');
  const ltr = dir === 'left-to-right' || dir === 'edge-in';
  const rtl = dir === 'right-to-left';
  const ttb = dir === 'top-to-bottom';
  const btt = dir === 'bottom-to-top';
  const diagTl = dir === 'diagonal-tl-br' || dir.includes('tl');
  const xEnter = rtl ? 72 : ltr || (!ttb && !btt) ? -72 : 0;
  const xExit = rtl ? -72 : ltr || (!ttb && !btt) ? 72 : 0;
  const yEnter = btt ? 64 : ttb ? -64 : 0;
  const yExit = btt ? -64 : ttb ? 64 : 0;
  const dx = diagTl ? -56 : 56;
  const dy = diagTl ? -40 : 40;
  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
  void phase;
  const t = String(transition || 'crossfade');
  if (t === 'crossfade' || t === 'soft-dissolve') return fade;
  if (t === 'slide-horizontal') {
    return {
      initial: { opacity: 0.85, x: xEnter },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0.85, x: xExit },
    };
  }
  if (t === 'slide-vertical') {
    return {
      initial: { opacity: 0.85, y: yEnter || -64 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0.85, y: yExit || 64 },
    };
  }
  if (t === 'diagonal') {
    return {
      initial: { opacity: 0.8, x: dx, y: dy },
      animate: { opacity: 1, x: 0, y: 0 },
      exit: { opacity: 0.8, x: -dx, y: -dy },
    };
  }
  if (t === 'scale' || t === 'zoom-in') {
    return {
      initial: { opacity: 0, scale: 1.12 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.96 },
    };
  }
  if (t === 'zoom-out') {
    return {
      initial: { opacity: 0, scale: 0.88 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.08 },
    };
  }
  if (t === 'ken-burns') {
    return {
      initial: { opacity: 0.9, scale: 1.12, x: ltr ? -18 : 18 },
      animate: { opacity: 1, scale: 1, x: 0 },
      exit: { opacity: 0, scale: 1.04 },
    };
  }
  if (t === 'layered-parallax') {
    return {
      initial: { opacity: 0, y: 36 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -24 },
    };
  }
  const insetEnter =
    t === 'split-reveal'
      ? 'inset(0 50% 0 50%)'
      : t === 'curtain'
        ? 'inset(0 0 100% 0)'
        : t === 'wipe' || t === 'mask-reveal'
          ? ltr || rtl
            ? rtl
              ? 'inset(0 0 0 100%)'
              : 'inset(0 100% 0 0)'
            : ttb
              ? 'inset(0 0 100% 0)'
              : 'inset(100% 0 0 0)'
          : dir === 'center-out' || dir === 'edge-in'
            ? 'inset(40% 40% 40% 40%)'
            : 'inset(0 100% 0 0)';
  return {
    initial: { opacity: 1, clipPath: insetEnter },
    animate: { opacity: 1, clipPath: 'inset(0 0 0 0)' },
    exit: {
      opacity: 0.9,
      clipPath:
        t === 'split-reveal'
          ? 'inset(0 50% 0 50%)'
          : t === 'curtain'
            ? 'inset(100% 0 0 0)'
            : 'inset(0 0 0 100%)',
    },
  };
}

const ROMAN_MARKS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function Hero({
  id,
  title,
  body,
  variant = 'split-card',
  mediaSeed = 'dwene',
  images = [],
  mediaKind = '',
  videoUrl = '',
  sliderArchitecture = 'full-bleed',
  imageTransition = 'crossfade',
  transitionDirection = 'left-to-right',
  indicatorStyle = 'pills',
  indicatorPosition = 'bottom-center',
  arrowPlacement = 'edge',
  textTransition = 'fade',
  heroComposition = 'image-behind-text',
  autoplayMs = 5200,
  motionLanguage = 'fade',
}: {
  id?: string;
  title: string;
  body: string;
  variant?: string;
  mediaSeed?: string;
  images?: string[];
  mediaKind?: string;
  videoUrl?: string;
  sliderArchitecture?: string;
  imageTransition?: string;
  transitionDirection?: string;
  indicatorStyle?: string;
  indicatorPosition?: string;
  arrowPlacement?: string;
  textTransition?: string;
  heroComposition?: string;
  autoplayMs?: number;
  motionLanguage?: string;
}) {
  const slides = slidesFrom(title, body, mediaSeed, images);
  const [active, setActive] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const wantsVideo = mediaKind === 'video' || Boolean(videoUrl);
  const poster = (images && images[0]) || slides[0]?.src || '';
  const arch = String(sliderArchitecture || 'full-bleed');
  // Slider materialization is intentional — only cinematic-slider (DNA architectures live inside it).
  // Do not hijack editorial/split/product heroes just because body text yields multiple sentences.
  const useSlider = variant === 'cinematic-slider';
  const effectiveTransition = reducedMotion
    ? 'crossfade'
    : String(imageTransition || 'crossfade');
  const imgMotion = slideMotion(effectiveTransition, transitionDirection, 'enter');
  const textMotion =
    textTransition === 'slide'
      ? { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } }
      : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  const verticalArch = arch === 'vertical';
  const prevGlyph = verticalArch ? '↑' : '‹';
  const nextGlyph = verticalArch ? '↓' : '›';
  void heroComposition;
  void motionLanguage;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(Boolean(mq.matches));
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', apply);
      else mq.removeListener(apply);
    };
  }, []);

  useEffect(() => {
    if (!useSlider || slides.length < 2 || !autoplayMs || autoplayMs <= 0) return undefined;
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (Date.now() < pausedUntil) return;
      setActive((n) => (n + 1) % slides.length);
    }, autoplayMs);
    return () => window.clearInterval(timer);
  }, [useSlider, slides.length, pausedUntil, autoplayMs]);

  function goSlide(delta: number) {
    if (slides.length < 2) return;
    setActive((n) => (n + delta + slides.length) % slides.length);
    setPausedUntil(Date.now() + 8000);
  }

  function goTo(i: number) {
    setActive(i);
    setPausedUntil(Date.now() + 8000);
  }

  function onPointerDown(e: { clientX: number; clientY: number }) {
    if (!useSlider || slides.length < 2) return;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
  }

  function onPointerUp(e: { clientX: number; clientY: number }) {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.clientX - touchStartX.current;
    const dy = e.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (verticalArch) {
      if (Math.abs(dy) < 42 || Math.abs(dy) < Math.abs(dx) * 1.15) return;
      goSlide(dy < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    goSlide(dx < 0 ? 1 : -1);
  }

  function onKeyDown(e: { key: string; preventDefault: () => void }) {
    if (!useSlider || slides.length < 2) return;
    const focused =
      hovered ||
      (typeof document !== 'undefined' &&
        sectionRef.current &&
        sectionRef.current.contains(document.activeElement));
    if (!focused) return;
    if (e.key === 'ArrowLeft' || (verticalArch && e.key === 'ArrowUp')) {
      e.preventDefault();
      goSlide(-1);
    } else if (e.key === 'ArrowRight' || (verticalArch && e.key === 'ArrowDown')) {
      e.preventDefault();
      goSlide(1);
    }
  }

  function indicatorPosClass() {
    switch (indicatorPosition) {
      case 'bottom-left':
        return 'left-4 bottom-6 md:left-8 justify-start';
      case 'bottom-right':
        return 'right-4 bottom-6 md:right-8 justify-end';
      case 'top-right':
        return 'right-4 top-6 md:right-8 justify-end';
      case 'left-center':
        return 'left-3 top-1/2 -translate-y-1/2 flex-col';
      case 'right-center':
        return 'right-3 top-1/2 -translate-y-1/2 flex-col';
      case 'edge-rail':
        return verticalArch
          ? 'left-3 top-1/2 -translate-y-1/2 flex-col'
          : 'right-3 top-1/2 -translate-y-1/2 flex-col';
      case 'floating-control':
        return 'right-6 bottom-10';
      case 'beside-cta':
      case 'under-image':
        return 'relative mt-6';
      case 'bottom-center':
      default:
        return 'left-1/2 bottom-6 -translate-x-1/2 justify-center';
    }
  }

  function renderArrows(toneClass = '') {
    if (arrowPlacement === 'none' || slides.length < 2) return null;
    const baseBtn =
      'z-20 rounded-full text-white backdrop-blur-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
    if (arrowPlacement === 'editorial-large') {
      return (
        <div className={`pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-2 md:px-4 ${toneClass}`}>
          <button type="button" aria-label="Previous slide" className={`pointer-events-auto px-4 py-3 text-4xl md:text-6xl ${baseBtn} bg-transparent`} onClick={() => goSlide(-1)}>{prevGlyph}</button>
          <button type="button" aria-label="Next slide" className={`pointer-events-auto px-4 py-3 text-4xl md:text-6xl ${baseBtn} bg-transparent`} onClick={() => goSlide(1)}>{nextGlyph}</button>
        </div>
      );
    }
    if (arrowPlacement === 'text-chevrons') {
      return (
        <div className={`mt-4 flex gap-4 text-sm font-semibold uppercase tracking-[0.18em] ${toneClass}`}>
          <button type="button" aria-label="Previous slide" className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" onClick={() => goSlide(-1)}>Prev</button>
          <button type="button" aria-label="Next slide" className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" onClick={() => goSlide(1)}>Next</button>
        </div>
      );
    }
    if (arrowPlacement === 'bottom-with-indicators') {
      return (
        <div className={`mt-4 flex gap-2 ${toneClass}`}>
          <button type="button" aria-label="Previous slide" className={`${baseBtn} bg-black/35 px-3 py-2`} onClick={() => goSlide(-1)}>{prevGlyph}</button>
          <button type="button" aria-label="Next slide" className={`${baseBtn} bg-black/35 px-3 py-2`} onClick={() => goSlide(1)}>{nextGlyph}</button>
        </div>
      );
    }
    const floatish = arrowPlacement === 'floating';
    const side = verticalArch
      ? {
          prev: 'left-1/2 top-3 z-20 -translate-x-1/2',
          next: 'left-1/2 bottom-3 z-20 -translate-x-1/2',
        }
      : {
          prev: floatish ? 'left-6 bottom-24 z-20' : 'left-3 top-1/2 z-20 -translate-y-1/2 md:left-6',
          next: floatish ? 'right-6 bottom-24 z-20' : 'right-3 top-1/2 z-20 -translate-y-1/2 md:right-6',
        };
    return (
      <>
        <button type="button" aria-label="Previous slide" className={`absolute ${side.prev} ${baseBtn} bg-black/35 px-3 py-2 text-xl ${toneClass}`} onClick={() => goSlide(-1)}>{prevGlyph}</button>
        <button type="button" aria-label="Next slide" className={`absolute ${side.next} ${baseBtn} bg-black/35 px-3 py-2 text-xl ${toneClass}`} onClick={() => goSlide(1)}>{nextGlyph}</button>
      </>
    );
  }

  function renderIndicators(tone: 'light' | 'dark' = 'light') {
    if (slides.length < 2) return null;
    const onBg = tone === 'light' ? 'bg-white' : 'bg-ink';
    const offBg = tone === 'light' ? 'bg-white/40' : 'bg-ink/30';
    const onTx = tone === 'light' ? 'text-white' : 'text-ink';
    const offTx = tone === 'light' ? 'text-white/70' : 'text-muted';
    const ring = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';
    const n = slides.length;
    const style = indicatorStyle;
    const wrapAbs = !['beside-cta', 'under-image'].includes(indicatorPosition);
    const colish =
      style === 'vertical-rail' ||
      indicatorPosition === 'left-center' ||
      indicatorPosition === 'right-center' ||
      indicatorPosition === 'edge-rail';
    const wrapClass = `${wrapAbs ? `absolute z-20 flex gap-2 ${indicatorPosClass()}` : `flex gap-2 ${indicatorPosClass()}`} ${colish ? 'flex-col' : ''}`;

    if (style === 'fraction') {
      return (
        <div className={wrapClass}>
          <span className={`text-sm font-semibold tabular-nums ${onTx}`}>
            {active + 1} / {n}
          </span>
        </div>
      );
    }
    if (style === 'progress-bar') {
      return (
        <div className={`${wrapAbs ? `absolute z-20 ${indicatorPosClass()}` : indicatorPosClass()} w-40 max-w-[40vw]`} role="progressbar" aria-valuenow={active + 1} aria-valuemin={1} aria-valuemax={n}>
          <div className={`h-1 w-full overflow-hidden rounded-full ${tone === 'light' ? 'bg-white/25' : 'bg-ink/15'}`}>
            <div className={`h-full ${onBg}`} style={{ width: `${((active + 1) / n) * 100}%` }} />
          </div>
        </div>
      );
    }
    if (style === 'progress-ring') {
      const r = 14;
      const c = 2 * Math.PI * r;
      const pct = (active + 1) / n;
      return (
        <div className={wrapClass}>
          <svg width="40" height="40" viewBox="0 0 40 40" aria-label={`Slide ${active + 1} of ${n}`}>
            <circle cx="20" cy="20" r={r} fill="none" stroke={tone === 'light' ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.2)'} strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r={r}
              fill="none"
              stroke={tone === 'light' ? '#fff' : 'currentColor'}
              strokeWidth="3"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
        </div>
      );
    }
    if (style === 'thumbnails') {
      return (
        <div className={`${wrapAbs ? `absolute z-20 flex gap-2 ${indicatorPosClass()}` : `flex gap-2 ${indicatorPosClass()}`}`}>
          {slides.map((s, i) => (
            <button key={s.src + String(i)} type="button" aria-label={`Show slide ${i + 1}`} aria-current={i === active} className={`${ring} overflow-hidden rounded-md border-2 ${i === active ? 'border-white opacity-100' : 'border-transparent opacity-60'}`} onClick={() => goTo(i)}>
              <img src={s.src} alt="" className="h-10 w-14 object-cover" />
            </button>
          ))}
        </div>
      );
    }
    return (
      <div className={wrapClass} role="tablist" aria-label="Slides">
        {slides.map((s, i) => {
          const activeNow = i === active;
          if (style === 'dots') {
            return (
              <button key={s.src + String(i)} type="button" aria-label={`Show slide ${i + 1}`} className={`${ring} h-2.5 w-2.5 rounded-full transition ${activeNow ? `${onBg} scale-125` : offBg}`} onClick={() => goTo(i)} />
            );
          }
          if (style === 'numbers' || style === 'roman' || style === 'labels') {
            const label = style === 'roman' ? ROMAN_MARKS[i] || String(i + 1) : style === 'labels' ? s.label || String(i + 1) : String(i + 1).padStart(2, '0');
            return (
              <button key={s.src + String(i)} type="button" aria-label={`Show slide ${i + 1}`} className={`${ring} text-xs font-semibold tracking-wide transition ${activeNow ? onTx : offTx}`} onClick={() => goTo(i)}>{label}</button>
            );
          }
          if (style === 'timeline' || style === 'line-markers' || style === 'segmented' || style === 'minimal-markers') {
            return (
              <button key={s.src + String(i)} type="button" aria-label={`Show slide ${i + 1}`} className={`${ring} h-0.5 transition ${activeNow ? `w-8 ${onBg}` : `w-4 ${offBg}`}`} onClick={() => goTo(i)} />
            );
          }
          if (style === 'vertical-rail') {
            return (
              <button key={s.src + String(i)} type="button" aria-label={`Show slide ${i + 1}`} className={`${ring} h-6 w-1.5 rounded-full transition ${activeNow ? onBg : offBg}`} onClick={() => goTo(i)} />
            );
          }
          return (
            <button key={s.src + String(i)} type="button" aria-label={`Show slide ${i + 1}`} className={`${ring} h-1.5 rounded-full transition ${activeNow ? `w-10 ${onBg}` : `w-4 ${offBg}`}`} onClick={() => goTo(i)} />
          );
        })}
      </div>
    );
  }

  function renderSlideText(light = true) {
    const titleCls = light
      ? 'max-w-3xl font-display text-4xl font-bold text-white sm:text-6xl'
      : 'max-w-3xl font-display text-4xl font-bold text-ink sm:text-6xl';
    const bodyCls = light
      ? 'mt-4 max-w-xl text-base text-white/85 sm:text-lg'
      : 'mt-4 max-w-xl text-base text-muted sm:text-lg';
    return (
      <>
        <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.22em] ${light ? 'text-white/80' : 'text-primary'}`}>
          {slides[active]?.label || 'Featured'}
        </p>
        <TextReveal as="h1" text={title} className={titleCls} />
        <div aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[active]?.text || body}
              initial={textMotion.initial}
              animate={textMotion.animate}
              exit={textMotion.exit}
              transition={{ duration: 0.45 }}
            >
              <p className={bodyCls}>{slides[active]?.text || body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    );
  }

  function renderCtas(light = true) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/contact"><Button className={light ? '!bg-white !text-[#0f172a] hover:!opacity-95' : ''}>Get in touch</Button></Link>
        <Link to="/services"><Button variant="outline" className={light ? '!border-white/50 !text-white hover:!bg-white/10' : ''}>Explore</Button></Link>
      </div>
    );
  }

  function renderActiveImage(className: string) {
    return (
      <AnimatePresence mode="wait">
        <motion.img
          key={slides[active]?.src + String(active)}
          src={slides[active]?.src}
          alt=""
          draggable={false}
          className={className}
          initial={imgMotion.initial}
          animate={imgMotion.animate}
          exit={imgMotion.exit}
          transition={{ duration: reducedMotion ? 0.25 : 0.8 }}
          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
        />
      </AnimatePresence>
    );
  }

  if (wantsVideo) {
    return (
      <section id={id} className="relative min-h-[78vh] overflow-hidden border-b border-black/5" style={{ background: PHOTO_FALLBACK }}>
        {videoUrl ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={poster || undefined}
            src={videoUrl}
          />
        ) : (
          <img
            src={poster || photo(mediaSeed, 'video-poster', 1600, 900)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.opacity = '0'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />
        <Container className="relative flex min-h-[78vh] flex-col justify-end py-16 md:py-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Watch</p>
          <TextReveal as="h1" text={title} className="max-w-3xl font-display text-4xl font-bold text-white sm:text-6xl" />
          <TextReveal text={body} className="mt-4 max-w-xl text-base text-white/85 sm:text-lg" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact"><Button className="!bg-white !text-[#0f172a] hover:!opacity-95">Get in touch</Button></Link>
            <Link to="/about"><Button variant="outline" className="!border-white/50 !text-white hover:!bg-white/10">Learn more</Button></Link>
          </div>
          {!videoUrl ? (
            <p className="mt-6 max-w-lg text-sm text-white/70">
              Video hero is ready — paste an mp4/webm URL in Direct AI to replace the poster.
            </p>
          ) : null}
        </Container>
      </section>
    );
  }

  if (useSlider) {
    const nextIdx = (active + 1) % slides.length;
    const sectionProps = {
      id,
      ref: sectionRef,
      tabIndex: 0 as const,
      className: 'relative min-h-[78vh] touch-pan-y overflow-hidden border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      style: { background: PHOTO_FALLBACK, touchAction: verticalArch ? 'pan-x' : 'pan-y' } as Record<string, string>,
      'aria-roledescription': 'carousel' as const,
      'aria-label': title,
      onPointerDown,
      onPointerUp,
      onPointerCancel: () => { touchStartX.current = null; touchStartY.current = null; },
      onKeyDown,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocus: () => setHovered(true),
      onBlur: () => setHovered(false),
    };

    if (arch === 'split') {
      return (
        <section {...sectionProps} className="relative border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
          <Container className="grid min-h-[78vh] items-center gap-8 py-14 md:grid-cols-2 md:py-20">
            <div>
              {renderSlideText(false)}
              {renderCtas(false)}
              {arrowPlacement === 'text-chevrons' || arrowPlacement === 'bottom-with-indicators' || indicatorPosition === 'beside-cta' ? (
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {renderArrows('text-ink')}
                  {indicatorPosition === 'beside-cta' ? renderIndicators('dark') : null}
                </div>
              ) : null}
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-[var(--radius-md)] shadow-xl ring-1 ring-black/10">
              {renderActiveImage('absolute inset-0 h-full w-full object-cover')}
              {indicatorPosition === 'under-image' ? <div className="absolute inset-x-0 bottom-4 flex justify-center">{renderIndicators('light')}</div> : null}
            </div>
          </Container>
          {arrowPlacement !== 'text-chevrons' && arrowPlacement !== 'bottom-with-indicators' ? renderArrows() : null}
          {indicatorPosition !== 'beside-cta' && indicatorPosition !== 'under-image' ? renderIndicators('dark') : null}
        </section>
      );
    }

    if (arch === 'peek') {
      return (
        <section {...sectionProps} className="relative min-h-[78vh] overflow-x-visible overflow-y-hidden border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60" style={{ background: PHOTO_FALLBACK }}>
          <div className="absolute inset-0 flex">
            <div className="relative h-full w-[78%] overflow-hidden">
              {renderActiveImage('absolute inset-0 h-full w-full object-cover')}
            </div>
            <div className="relative h-full w-[22%] overflow-hidden opacity-70">
              <img src={slides[nextIdx]?.src} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          {renderArrows()}
          <Container className="relative z-10 flex min-h-[78vh] flex-col justify-end py-16 md:py-24">
            {renderSlideText(true)}
            {renderCtas(true)}
            {indicatorPosition === 'beside-cta' ? <div className="mt-6">{renderIndicators('light')}</div> : null}
          </Container>
          {indicatorPosition !== 'beside-cta' ? renderIndicators('light') : null}
        </section>
      );
    }

    if (arch === 'stacked') {
      return (
        <section {...sectionProps} className="relative border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
          <Container className="grid min-h-[78vh] items-center gap-10 py-14 md:grid-cols-2 md:py-20">
            <div>
              {renderSlideText(false)}
              {renderCtas(false)}
              {indicatorPosition === 'beside-cta' ? <div className="mt-6">{renderIndicators('dark')}</div> : null}
            </div>
            <div className="relative mx-auto h-[360px] w-full max-w-md">
              {slides.map((s, i) => {
                const offset = (i - active + slides.length) % slides.length;
                if (offset > 2) return null;
                return (
                  <motion.img
                    key={s.src + String(i)}
                    src={s.src}
                    alt=""
                    className="absolute left-1/2 top-4 h-72 w-52 rounded-[var(--radius-md)] object-cover shadow-2xl ring-1 ring-black/10 sm:w-56"
                    style={{ zIndex: 3 - offset }}
                    animate={{ x: '-50%', rotate: offset * 7, y: offset * 18, scale: 1 - offset * 0.04, opacity: 1 - offset * 0.15 }}
                    transition={{ duration: 0.45 }}
                  />
                );
              })}
            </div>
          </Container>
          {renderArrows()}
          {indicatorPosition !== 'beside-cta' ? renderIndicators('dark') : null}
        </section>
      );
    }

    if (arch === 'vertical') {
      return (
        <section {...sectionProps} className="relative min-h-[78vh] overflow-hidden border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60" style={{ background: PHOTO_FALLBACK }}>
          {renderActiveImage('absolute inset-0 h-full w-full object-cover')}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          {renderArrows()}
          {renderIndicators('light')}
          <Container className="relative z-10 flex min-h-[78vh] flex-col justify-end py-16 md:py-24">
            {renderSlideText(true)}
            {renderCtas(true)}
          </Container>
        </section>
      );
    }

    if (arch === 'thumbnail') {
      return (
        <section {...sectionProps} className="relative border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
          <Container className="grid min-h-[78vh] gap-8 py-14 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-20">
            <div className="relative min-h-[360px] overflow-hidden rounded-[var(--radius-md)] shadow-xl">
              {renderActiveImage('absolute inset-0 h-full w-full object-cover')}
            </div>
            <div>
              {renderSlideText(false)}
              {renderCtas(false)}
              <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
                {slides.map((s, i) => (
                  <button key={s.src + String(i)} type="button" aria-label={`Show slide ${i + 1}`} aria-current={i === active} className={`shrink-0 overflow-hidden rounded-md border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${i === active ? 'border-primary opacity-100' : 'border-transparent opacity-60'}`} onClick={() => goTo(i)}>
                    <img src={s.src} alt="" className="h-14 w-20 object-cover" />
                  </button>
                ))}
              </div>
              {arrowPlacement === 'text-chevrons' || arrowPlacement === 'bottom-with-indicators' ? renderArrows('text-ink') : null}
            </div>
          </Container>
          {arrowPlacement !== 'text-chevrons' && arrowPlacement !== 'bottom-with-indicators' && arrowPlacement !== 'none' ? renderArrows() : null}
        </section>
      );
    }

    if (arch === 'editorial' || arch === 'story') {
      return (
        <section {...sectionProps} className="relative border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
          <Container className="grid min-h-[78vh] items-end gap-10 py-14 md:grid-cols-[1.15fr_0.85fr] md:py-24">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-primary">{slides[active]?.label || 'Story'}</p>
              <TextReveal as="h1" text={title} className="font-display text-5xl font-bold leading-[0.95] text-ink md:text-7xl" />
              <div aria-live="polite" className="mt-6">
                <AnimatePresence mode="wait">
                  <motion.p key={slides[active]?.text} className="max-w-lg text-lg text-muted" initial={textMotion.initial} animate={textMotion.animate} exit={textMotion.exit}>
                    {slides[active]?.text || body}
                  </motion.p>
                </AnimatePresence>
              </div>
              {renderCtas(false)}
              {indicatorPosition === 'beside-cta' ? <div className="mt-6">{renderIndicators('dark')}</div> : null}
            </div>
            <div className="relative min-h-[420px] overflow-hidden">
              {renderActiveImage('absolute inset-0 h-full w-full object-cover')}
            </div>
          </Container>
          {renderArrows()}
          {indicatorPosition !== 'beside-cta' ? renderIndicators('dark') : null}
        </section>
      );
    }

    if (arch === 'card' || arch === 'coverflow') {
      return (
        <section {...sectionProps} className="relative overflow-hidden border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
          <Container className="py-14 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              {renderSlideText(false)}
              {renderCtas(false)}
            </div>
            <div className="relative mx-auto mt-10 flex h-[320px] max-w-4xl items-center justify-center">
              {slides.map((s, i) => {
                const offset = i - active;
                const abs = Math.abs(offset);
                if (abs > 2) return null;
                return (
                  <motion.button
                    key={s.src + String(i)}
                    type="button"
                    aria-label={`Show slide ${i + 1}`}
                    className="absolute h-56 w-40 overflow-hidden rounded-[var(--radius-md)] shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-64 sm:w-48"
                    style={{ zIndex: 10 - abs }}
                    animate={{ x: offset * (arch === 'coverflow' ? 130 : 110), rotateY: arch === 'coverflow' ? offset * -28 : 0, scale: 1 - abs * 0.08, opacity: 1 - abs * 0.2 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => goTo(i)}
                  >
                    <img src={s.src} alt="" className="h-full w-full object-cover" draggable={false} />
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-center gap-4">
              {renderArrows('!static !translate-y-0 relative')}
              {renderIndicators('dark')}
            </div>
          </Container>
        </section>
      );
    }

    if (arch === 'parallax' || arch === 'progression') {
      return (
        <section {...sectionProps} className="relative min-h-[78vh] overflow-hidden border-b border-black/5 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60" style={{ background: PHOTO_FALLBACK }}>
          <motion.div
            className="absolute inset-0"
            animate={{ y: arch === 'parallax' ? active * -12 : 0, scale: arch === 'progression' ? 1 + active * 0.01 : 1 }}
            transition={{ duration: 0.7 }}
          >
            {renderActiveImage('absolute inset-0 h-full w-full object-cover')}
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />
          {renderArrows()}
          <Container className="relative z-10 flex min-h-[78vh] flex-col justify-end py-16 md:py-24">
            {renderSlideText(true)}
            {renderCtas(true)}
            {arch === 'progression' ? (
              <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-white/25">
                <div className="h-full bg-white transition-all" style={{ width: `${((active + 1) / slides.length) * 100}%` }} />
              </div>
            ) : null}
            {indicatorPosition === 'beside-cta' ? <div className="mt-6">{renderIndicators('light')}</div> : null}
          </Container>
          {indicatorPosition !== 'beside-cta' ? renderIndicators('light') : null}
        </section>
      );
    }

    // full-bleed (default) and unknown architectures
    return (
      <section {...sectionProps}>
        {renderActiveImage('absolute inset-0 h-full w-full object-cover')}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />
        {renderArrows()}
        <Container className="relative z-10 flex min-h-[78vh] flex-col justify-end py-16 md:py-24">
          {renderSlideText(true)}
          {renderCtas(true)}
          {indicatorPosition === 'beside-cta' || arrowPlacement === 'bottom-with-indicators' || arrowPlacement === 'text-chevrons' ? (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {arrowPlacement === 'bottom-with-indicators' || arrowPlacement === 'text-chevrons' ? renderArrows() : null}
              {indicatorPosition === 'beside-cta' ? renderIndicators('light') : null}
            </div>
          ) : null}
        </Container>
        {indicatorPosition !== 'beside-cta' ? renderIndicators('light') : null}
      </section>
    );
  }
  if (variant === 'editorial') {
    return (
      <section id={id} className="border-b border-black/5">
        <Container className="grid gap-8 py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Studio note</p>
            <TextReveal as="h1" text={title} className="font-display text-5xl font-bold leading-[0.95] text-ink md:text-7xl" />
            <TextReveal text={body} className="mt-6 max-w-lg text-lg text-muted" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact"><Button>Start a project</Button></Link>
              <Link to="/about"><Button variant="outline">Our story</Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <img
                key={i}
                src={photo(mediaSeed, `edit-${i}`, 700, i % 2 ? 900 : 640)}
                alt=""
                className={`w-full rounded-[var(--radius-md)] object-cover shadow-lg ${i === 1 ? 'mt-8' : ''}`}
              />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'media-stack') {
    return (
      <section id={id} className="relative overflow-hidden border-b border-black/5 py-16 md:py-24">
        <Container className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Welcome</p>
            <TextReveal as="h1" text={title} className="font-display text-4xl font-bold text-ink sm:text-6xl" />
            <TextReveal text={body} className="mt-5 max-w-xl text-lg text-muted" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact"><Button>Get in touch</Button></Link>
              <Link to="/services"><Button variant="outline">View work</Button></Link>
            </div>
          </div>
          <div className="relative mx-auto h-[340px] w-full max-w-md">
            {[0, 1, 2].map((i) => (
              <motion.img
                key={i}
                src={photo(mediaSeed, `stack-${i}`, 800, 900)}
                alt=""
                className="absolute left-1/2 top-6 h-64 w-48 rounded-[var(--radius-md)] object-cover shadow-2xl ring-1 ring-black/10 sm:h-72 sm:w-56"
                style={{ zIndex: 3 - i }}
                initial={{ x: '-50%', rotate: (i - 1) * 8, y: i * 18 }}
                animate={{ x: '-42%', rotate: (i - 1) * 9, y: i * 22 }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
              />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'minimal-glow') {
    return (
      <section id={id} className="relative overflow-hidden border-b border-black/5 py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% -10%, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 60%)',
          }}
        />
        <Container className="relative max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Welcome</p>
          <TextReveal as="h1" text={title} className="font-display text-5xl font-bold text-ink md:text-6xl" />
          <TextReveal text={body} className="mx-auto mt-5 text-lg text-muted" />
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/contact"><Button>Get in touch</Button></Link>
            <Link to="/services"><Button variant="outline">Learn more</Button></Link>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'no-hero') {
    return null;
  }

  if (variant === 'typography-first') {
    return (
      <section id={id} className="border-b border-black/5 py-16 md:py-28">
        <Container className="max-w-5xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-primary">Introduction</p>
          <TextReveal as="h1" text={title} className="font-display text-5xl font-bold leading-[0.92] tracking-tight text-ink sm:text-7xl md:text-8xl" />
          <TextReveal text={body} className="mt-8 max-w-2xl text-lg text-muted md:text-xl" />
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/contact"><Button>Get in touch</Button></Link>
            <Link to="/about"><Button variant="outline">Read more</Button></Link>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'full-bleed') {
    return (
      <section id={id} className="relative min-h-[88vh] overflow-hidden border-b border-black/5" style={{ background: PHOTO_FALLBACK }}>
        <Photo src={photo(mediaSeed, 'bleed', 2000, 1200)} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/25" />
        <Container className="relative flex min-h-[88vh] flex-col justify-end py-16 md:py-24">
          <TextReveal as="h1" text={title} className="max-w-4xl font-display text-5xl font-bold text-white sm:text-7xl" />
          <TextReveal text={body} className="mt-5 max-w-xl text-lg text-white/85" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact"><Button className="!bg-white !text-[#0f172a]">Get in touch</Button></Link>
            <Link to="/services"><Button variant="outline" className="!border-white/50 !text-white hover:!bg-white/10">Explore</Button></Link>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'asymmetric') {
    return (
      <section id={id} className="border-b border-black/5 py-14 md:py-20">
        <Container className="grid items-start gap-8 md:grid-cols-12">
          <div className="md:col-span-5 md:pt-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Now</p>
            <TextReveal as="h1" text={title} className="font-display text-4xl font-bold text-ink sm:text-5xl" />
            <TextReveal text={body} className="mt-5 text-base text-muted" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact"><Button>Get in touch</Button></Link>
            </div>
          </div>
          <div className="md:col-span-7">
            <img
              src={photo(mediaSeed, 'asym', 1400, 1100)}
              alt=""
              className="h-[min(70vh,560px)] w-full rounded-[var(--radius-md)] object-cover shadow-xl md:-mr-8 md:translate-x-4"
            />
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'product-first') {
    return (
      <section id={id} className="border-b border-black/5 py-14 md:py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <img
              src={photo(mediaSeed, 'product', 1200, 1200)}
              alt=""
              className="mx-auto aspect-square max-w-md rounded-[var(--radius-md)] object-cover shadow-2xl ring-1 ring-black/10"
            />
          </div>
          <div className="order-1 md:order-2">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Product</p>
            <TextReveal as="h1" text={title} className="font-display text-4xl font-bold text-ink sm:text-5xl" />
            <TextReveal text={body} className="mt-5 text-lg text-muted" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/services"><Button>See details</Button></Link>
              <Link to="/contact"><Button variant="outline">Talk to us</Button></Link>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'search-first') {
    return (
      <section id={id} className="border-b border-black/5 py-16 md:py-24">
        <Container className="max-w-3xl text-center">
          <TextReveal as="h1" text={title} className="font-display text-4xl font-bold text-ink sm:text-5xl" />
          <TextReveal text={body} className="mx-auto mt-4 max-w-xl text-muted" />
          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            action="/services"
            method="get"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="sr-only" htmlFor="dwene-hero-search">Search</label>
            <input
              id="dwene-hero-search"
              name="q"
              type="search"
              placeholder="Search products, services, or topics"
              className="min-h-12 flex-1 rounded-[var(--radius-md)] border border-black/10 bg-surface px-4 text-ink outline-none ring-primary focus:ring-2"
            />
            <Button type="submit" className="min-h-12 px-6">Search</Button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-muted">
            <Link className="hover:text-primary" to="/services">Browse all</Link>
            <span aria-hidden>·</span>
            <Link className="hover:text-primary" to="/contact">Get help</Link>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'data-hero') {
    const stats = [
      { label: 'Active', value: '128' },
      { label: 'Latency', value: '42ms' },
      { label: 'Uptime', value: '99.9%' },
    ];
    return (
      <section id={id} className="border-b border-black/5 py-14 md:py-20">
        <Container className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Live overview</p>
            <TextReveal as="h1" text={title} className="font-display text-4xl font-bold text-ink sm:text-5xl" />
            <TextReveal text={body} className="mt-5 text-lg text-muted" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard"><Button>Open dashboard</Button></Link>
              <Link to="/contact"><Button variant="outline">Talk to sales</Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-[var(--radius-md)] border border-black/10 bg-surface p-4 shadow-sm">
            {stats.map((s) => (
              <div key={s.label} className="rounded-md bg-background/80 p-4 text-center">
                <p className="font-display text-2xl font-bold text-primary">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id={id} className="relative overflow-hidden border-b border-black/5">
      <HeroScene />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 15% 20%, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 10%, color-mix(in srgb, var(--color-secondary) 22%, transparent), transparent 50%)',
        }}
      />
      <Container className="relative grid gap-10 py-16 md:grid-cols-[1.15fr_0.85fr] md:items-end md:py-24 lg:py-28">
        <div>
          <motion.p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            Welcome
          </motion.p>
          <TextReveal as="h1" text={title} className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl" />
          <TextReveal text={body} className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg" />
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/contact"><Button>Get in touch</Button></Link>
            <Link to="/services"><Button variant="outline">View services</Button></Link>
          </div>
        </div>
        <motion.aside
          className="relative min-h-[260px] overflow-hidden rounded-[calc(var(--radius-md)+0.35rem)] shadow-[0_20px_50px_-28px_rgba(0,0,0,0.45)] ring-1 ring-black/10"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <img src={photo(mediaSeed, 'split', 1200, 900)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative flex h-full min-h-[260px] flex-col justify-end p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">At a glance</p>
            <p className="mt-2 text-sm text-white/90">A calmer first visit — clear guidance, time to listen, follow-up that sticks.</p>
          </div>
        </motion.aside>
      </Container>
    </section>
  );
}

import { type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { MOTION, resolvePageVariant } from '@/motion/config';

const ease = [0.22, 1, 0.36, 1] as const;

export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.25 });
  if (reduceMotion) return null;
  return (
    <motion.div
      className="dwene-scroll-progress"
      style={{ scaleX, transformOrigin: '0% 50%' }}
      aria-hidden
    />
  );
}

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || MOTION.language === 'motionless-editorial') {
    return <div className={className}>{children}</div>;
  }
  const snappy = MOTION.language === 'snappy-confident' || MOTION.intensity === 'high';
  const soft = MOTION.language === 'soft-gentle-fade' || MOTION.language === 'smooth-luxurious';
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: soft ? 36 : snappy ? 16 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: soft ? 0.7 : snappy ? 0.35 : 0.55, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function TextReveal({
  text,
  as: Tag = 'p',
  className = '',
}: {
  text: string;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span';
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || MOTION.language === 'motionless-editorial') {
    return <Tag className={className}>{text}</Tag>;
  }
  const words = String(text || '').split(/\s+/).filter(Boolean);
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block mr-[0.28em]"
          initial={{ opacity: 0, y: '0.55em' }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: 0.42, delay: Math.min(i, 18) * 0.035, ease }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}

export function Stagger({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || MOTION.language === 'motionless-editorial') {
    return <div className={className}>{children}</div>;
  }
  const gap = MOTION.language === 'kinetic-energetic' ? 0.05 : MOTION.language === 'smooth-luxurious' ? 0.12 : 0.08;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-8% 0px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || MOTION.language === 'motionless-editorial') {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({
  routeKey,
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const variant = resolvePageVariant(MOTION.language);
  if (reduceMotion || MOTION.language === 'motionless-editorial') {
    return <div key={routeKey}>{children}</div>;
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={variant.initial}
        animate={variant.animate}
        exit={variant.exit}
        transition={variant.transition as any}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

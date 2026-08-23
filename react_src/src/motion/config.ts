export const MOTION = {
  library: 'framer-motion',
  scroll: true,
  text: true,
  pageTransitions: true,
  forms: true,
  respectReducedMotion: true,
  three: false,
  language: "scale",
  intensity: "medium",
  primary: "#ea580c",
  secondary: "#f97316",
} as const;

/** Page / section transition presets keyed by design DNA motion language. */
export const PAGE_VARIANTS: Record<string, {
  initial: Record<string, number>;
  animate: Record<string, number>;
  exit: Record<string, number>;
  transition: Record<string, number | number[] | string>;
}> = {
  fade: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  slide: {
    initial: { opacity: 0, x: 28 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -22 },
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  reveal: {
    initial: { opacity: 0, y: 36, filter: 6 },
    animate: { opacity: 1, y: 0, filter: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  'snappy-confident': {
    initial: { opacity: 0, y: 18, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] },
  },
  'smooth-luxurious': {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -14 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  'bouncy-playful': {
    initial: { opacity: 0, y: 20, scale: 0.94 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.97 },
    transition: { type: 'spring', stiffness: 320, damping: 22 },
  },
  'cinematic-dramatic': {
    initial: { opacity: 0, y: 48 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -28 },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
  'kinetic-energetic': {
    initial: { opacity: 0, x: 40, rotate: -0.4 },
    animate: { opacity: 1, x: 0, rotate: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
  },
  'soft-gentle-fade': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.45, ease: 'easeOut' },
  },
  'minimal-restrained': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.18 },
  },
  'motionless-editorial': {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 },
  },
};

export function resolvePageVariant(language?: string) {
  const key = String(language || MOTION.language || 'fade');
  return PAGE_VARIANTS[key] || PAGE_VARIANTS.fade;
}

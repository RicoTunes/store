import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export function FieldMessage({ error, success }: { error?: string; success?: string }) {
  const reduceMotion = useReducedMotion();
  const message = error || success;
  if (reduceMotion) {
    return (
      <div className="min-h-[1.25rem]">
        {message ? (
          <p className={`text-xs font-medium ${error ? 'text-red-500' : 'text-primary'}`}>{message}</p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="min-h-[1.25rem]">
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key={error}
            className="text-xs font-medium text-red-500"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {error}
          </motion.p>
        ) : success ? (
          <motion.p
            key={success}
            className="text-xs font-medium text-primary"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {success}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

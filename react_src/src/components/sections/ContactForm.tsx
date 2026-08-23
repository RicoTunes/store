import { FormEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/motion/primitives';
import { contactSchema, type ContactValues } from '@/forms/contactSchema';
import { FieldMessage } from '@/forms/Field';
import { formsApi } from '@/services/apiClient';

export function ContactForm({ id, title, body }: { id?: string; title: string; body: string }) {
  const [values, setValues] = useState<ContactValues>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactValues, string>>>({});
  const [sent, setSent] = useState(false);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const field =
    'w-full rounded-[var(--radius-md)] border bg-surface px-3.5 py-2.5 text-ink outline-none transition placeholder:text-muted focus:ring-2 focus:ring-primary/20';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof ContactValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'name' || key === 'email' || key === 'message') next[key] = issue.message;
      }
      setErrors(next);
      setShake((n) => n + 1);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await formsApi.submit('contact', {
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      });
      setSent(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send message');
      setShake((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  const inputClass = useMemo(
    () => (name: keyof ContactValues) =>
      `${field} ${errors[name] ? 'border-red-400 focus:border-red-400' : 'border-black/10 focus:border-primary/40'}`,
    [errors],
  );

  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
            <p className="mt-3 max-w-md text-muted">{body}</p>
            <ul className="mt-8 space-y-3 text-sm text-muted">
              <li>Response within one business day</li>
              <li>Phone and email both welcome</li>
              <li>No pressure — ask anything</li>
            </ul>
          </Reveal>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="ok"
                className="rounded-[var(--radius-md)] bg-primary/10 p-6 text-primary ring-1 ring-primary/20"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                Thanks — we received your message and will reply soon.
              </motion.div>
            ) : (
              <motion.form
                key={`form-${shake}`}
                className="space-y-3 rounded-[var(--radius-md)] bg-surface p-6 ring-1 ring-black/5"
                onSubmit={(e) => { void onSubmit(e); }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div>
                  <input
                    name="name"
                    placeholder="Name"
                    value={values.name}
                    onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                    className={inputClass('name')}
                    aria-invalid={Boolean(errors.name)}
                  />
                  <FieldMessage error={errors.name} />
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={values.email}
                    onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                    className={inputClass('email')}
                    aria-invalid={Boolean(errors.email)}
                  />
                  <FieldMessage error={errors.email} />
                </div>
                <div>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="How can we help?"
                    value={values.message}
                    onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                    className={inputClass('message')}
                    aria-invalid={Boolean(errors.message)}
                  />
                  <FieldMessage error={errors.message} />
                </div>
                {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
                <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
                  {busy ? 'Sending…' : 'Send message'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}

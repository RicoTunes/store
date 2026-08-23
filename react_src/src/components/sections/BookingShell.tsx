import { FormEvent, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { bookingsApi } from '@/services/apiClient';

const SLOTS = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

export function BookingShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!date || !slot || !name.trim() || !email.trim()) {
      setError('Please fill date, slot, name, and email.');
      return;
    }
    setBusy(true);
    try {
      await bookingsApi.create({ date, slot, name: name.trim(), email: email.trim() });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create booking');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Booking</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>

        {done ? (
          <div className="mt-8 max-w-lg rounded-[var(--radius-md)] bg-primary/10 p-6 text-ink ring-1 ring-primary/20">
            <p className="font-display text-xl font-semibold">You are booked</p>
            <p className="mt-2 text-sm text-muted">
              {date} at {slot} — confirmation sent toward {email}.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mt-8 grid max-w-xl gap-4 rounded-[var(--radius-md)] bg-surface p-6 ring-1 ring-black/5"
          >
            <label className="block text-sm">
              <span className="font-medium text-ink">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-black/10 bg-background px-3 py-2.5 text-ink outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-ink">Time slot</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      slot === s ? 'bg-primary text-[color:var(--color-on-primary,#fff)]' : 'bg-background text-ink ring-1 ring-black/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm">
              <span className="font-medium text-ink">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-black/10 bg-background px-3 py-2.5 text-ink outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-black/10 bg-background px-3 py-2.5 text-ink outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={busy}>
              {busy ? 'Booking…' : 'Confirm booking'}
            </Button>
          </form>
        )}
      </Container>
    </section>
  );
}

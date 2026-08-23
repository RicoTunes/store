import { Link } from 'react-router-dom';
import { INTENT, SITE_BRAND } from '@/config/site';

function copyForArchetype(arch: string) {
  switch (arch) {
    case 'professional':
      return {
        lead: 'Stay close to the people who',
        accent: 'shape your work',
        body: 'Your network, messages, and updates live here — not on a brochure.',
      };
    case 'creator':
      return {
        lead: 'Share what you make with people who',
        accent: 'follow along',
        body: 'Post, message, and grow with members who actually signed up.',
      };
    case 'community':
      return {
        lead: 'Join conversations with people who',
        accent: 'share your world',
        body: 'Groups, threads, and DMs for members of this community.',
      };
    case 'messaging':
      return {
        lead: 'Talk with the people who',
        accent: 'matter most',
        body: 'Direct messages with real members — no placeholder chats.',
      };
    default:
      return {
        lead: 'See everyday moments from people you',
        accent: 'actually know',
        body: 'Feed, friends, and messages for registered members of this community.',
      };
  }
}

function StoryRing({ label, offset }: { label: string; offset: string }) {
  return (
    <div
      className={`absolute flex h-36 w-24 flex-col items-center justify-end overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-primary/80 to-primary shadow-xl ring-4 ring-white ${offset}`}
    >
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-primary">
        {label}
      </span>
    </div>
  );
}

function BrandArt({ letter, visual }: { letter: string; visual: string }) {
  if (visual === 'type-only') return null;
  if (visual === 'orbs') {
    return (
      <div className="relative mt-auto h-56">
        <span className="absolute bottom-6 left-8 h-28 w-28 rounded-full bg-primary/25" />
        <span className="absolute bottom-16 left-24 h-20 w-20 rounded-full bg-primary/50" />
        <span className="absolute bottom-4 left-44 h-16 w-16 rounded-full bg-primary/80" />
      </div>
    );
  }
  if (visual === 'slabs') {
    return (
      <div className="relative mt-auto flex h-56 items-end gap-2">
        <span className="h-24 w-10 rounded-lg bg-primary/30" />
        <span className="h-40 w-10 rounded-lg bg-primary/55" />
        <span className="h-32 w-10 rounded-lg bg-primary" />
        <span className="h-20 w-10 rounded-lg bg-primary/40" />
      </div>
    );
  }
  return (
    <div className="relative mt-auto h-64">
      <StoryRing label={letter} offset="left-8 bottom-6 -rotate-6" />
      <StoryRing label="+" offset="left-28 bottom-10 rotate-3" />
      <StoryRing label={letter} offset="left-52 bottom-4 rotate-12" />
    </div>
  );
}

export function authFieldClass() {
  const chrome = String((INTENT as any).authFormChrome || 'rounded');
  const base =
    'mt-1 w-full px-3 py-2.5 text-ink placeholder:text-muted outline-none transition focus:ring-2 focus:ring-primary/30';
  if (chrome === 'pill') return `${base} rounded-full border border-black/10 bg-background`;
  if (chrome === 'sharp') return `${base} rounded-none border border-black/15 bg-background`;
  if (chrome === 'underline') return `${base} rounded-none border-0 border-b border-black/20 bg-transparent px-0 focus:ring-0 focus:border-primary`;
  if (chrome === 'soft-fill') return `${base} rounded-2xl border border-transparent bg-black/[0.05] focus:bg-background focus:border-black/10`;
  if (chrome === 'elevated') return `${base} rounded-2xl border border-black/5 bg-surface shadow-sm`;
  if (chrome === 'inset') return `${base} rounded-xl border border-black/10 bg-black/[0.03] shadow-inner`;
  if (chrome === 'outline-glow') return `${base} rounded-xl border border-primary/25 bg-background focus:ring-primary/40 focus:border-primary/50`;
  return `${base} rounded-xl border border-black/10 bg-background`;
}

export function authButtonClass() {
  const chrome = String((INTENT as any).authFormChrome || 'rounded');
  if (chrome === 'pill') return 'w-full rounded-full py-2.5 font-semibold shadow-sm';
  if (chrome === 'sharp') return 'w-full rounded-none py-2.5 font-semibold';
  if (chrome === 'elevated' || chrome === 'outline-glow') return 'w-full rounded-2xl py-2.5 font-semibold shadow-md';
  return 'w-full rounded-xl py-2.5 font-semibold';
}

export function scorePasswordStrength(password: string): {
  level: 0 | 1 | 2 | 3;
  label: string;
  percent: number;
  barClass: string;
  textClass: string;
} {
  const pw = String(password || '');
  if (!pw) {
    return { level: 0, label: '', percent: 0, barClass: 'bg-black/15', textClass: 'text-muted' };
  }
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  else if (/[a-zA-Z]/.test(pw)) score += 0.5;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (pw.length < 6) score = Math.min(score, 0.5);

  if (score < 2) {
    return { level: 1, label: 'Weak', percent: 28, barClass: 'bg-red-500', textClass: 'text-red-600' };
  }
  if (score < 3.5) {
    return { level: 2, label: 'Strong', percent: 66, barClass: 'bg-amber-500', textClass: 'text-amber-700' };
  }
  return { level: 3, label: 'Very strong', percent: 100, barClass: 'bg-emerald-500', textClass: 'text-emerald-700' };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const s = scorePasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${s.barClass}`}
          style={{ width: `${s.percent}%` }}
        />
      </div>
      <p className={`text-xs font-semibold ${s.textClass}`}>Password strength: {s.label}</p>
    </div>
  );
}

export function AuthSplitLayout({ children }: { children: any }) {
  const brand = SITE_BRAND || 'Community';
  const arch = String((INTENT as any).socialArchetype || 'general');
  const pattern = String((INTENT as any).authFormPattern || 'split-start');
  const visual = String((INTENT as any).authFormVisual || 'rings');
  const copy = copyForArchetype(arch);
  const letter = String(brand).trim().slice(0, 1).toUpperCase() || 'C';

  const headline = (
    <>
      <h2 className="max-w-md font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
        {copy.lead}{' '}
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {copy.accent}
        </span>
        .
      </h2>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{copy.body}</p>
    </>
  );

  const brandPane = (
    <aside className="relative hidden overflow-hidden bg-background px-10 py-10 lg:flex lg:flex-col">
      <Link to="/" className="font-display text-2xl font-bold tracking-tight text-primary">
        {brand}
      </Link>
      <div className="mt-16">{headline}</div>
      <BrandArt letter={letter} visual={visual} />
    </aside>
  );

  const formPane = (
    <section className="flex flex-col justify-center px-6 py-12 sm:px-10 md:px-16">
      <Link to="/" className="mb-8 font-display text-xl font-bold text-primary lg:hidden">
        {brand}
      </Link>
      <div className="mx-auto w-full max-w-sm">{children}</div>
    </section>
  );

  if (pattern === 'split-end') {
    return (
      <div className="min-h-screen bg-surface text-ink">
        <div className="grid min-h-screen lg:grid-cols-2">
          {formPane}
          <div className="border-l border-black/8">{brandPane}</div>
        </div>
      </div>
    );
  }

  if (pattern === 'cover-card') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background text-ink">
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="absolute inset-y-0 left-0 w-[58%] px-12 py-12">
            <p className="font-display text-2xl font-bold text-primary">{brand}</p>
            <div className="mt-16">{headline}</div>
            <BrandArt letter={letter} visual={visual} />
          </div>
        </div>
        <div className="relative flex min-h-screen items-center justify-center p-6 lg:justify-end lg:pr-16">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-black/10">
            <Link to="/" className="mb-6 block font-display text-xl font-bold text-primary lg:hidden">
              {brand}
            </Link>
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (pattern === 'stacked-banner') {
    return (
      <div className="min-h-screen bg-surface text-ink">
        <header className="bg-primary px-6 py-10 text-[color:var(--color-on-primary,#fff)] md:px-12">
          <Link to="/" className="font-display text-xl font-bold">
            {brand}
          </Link>
          <h2 className="mt-6 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {copy.lead} {copy.accent}.
          </h2>
        </header>
        <div className="mx-auto w-full max-w-sm px-6 py-12">{children}</div>
      </div>
    );
  }

  if (pattern === 'inset-stage') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-ink md:p-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-surface shadow-2xl ring-1 ring-black/10 lg:grid-cols-2">
          <div className="hidden flex-col bg-background px-10 py-10 lg:flex">
            <Link to="/" className="font-display text-2xl font-bold text-primary">
              {brand}
            </Link>
            <div className="mt-10">{headline}</div>
            <BrandArt letter={letter} visual={visual} />
          </div>
          <div className="px-6 py-10 sm:px-10">
            <Link to="/" className="mb-8 block font-display text-xl font-bold text-primary lg:hidden">
              {brand}
            </Link>
            <div className="mx-auto w-full max-w-sm">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  if (pattern === 'centered-minimal') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-ink">
        <Link to="/" className="mb-10 font-display text-3xl font-bold tracking-tight text-primary">
          {brand}
        </Link>
        <div className="w-full max-w-sm">{children}</div>
        <p className="mt-8 max-w-xs text-center text-xs text-muted">{copy.body}</p>
      </div>
    );
  }

  if (pattern === 'rail') {
    return (
      <div className="grid min-h-screen bg-surface text-ink lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden flex-col justify-between bg-primary px-6 py-8 text-[color:var(--color-on-primary,#fff)] lg:flex">
          <Link to="/" className="font-display text-xl font-bold">
            {brand}
          </Link>
          <p className="text-sm leading-relaxed opacity-90">
            {copy.lead} {copy.accent}.
          </p>
        </aside>
        <section className="flex flex-col justify-center px-6 py-12 sm:px-10">
          <Link to="/" className="mb-8 font-display text-xl font-bold text-primary lg:hidden">
            {brand}
          </Link>
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </section>
      </div>
    );
  }

  if (pattern === 'video-wash') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 py-16 text-ink">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/40 via-ink to-background" />
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative w-full max-w-md rounded-3xl bg-surface/95 p-7 shadow-2xl ring-1 ring-white/20 backdrop-blur">
          <Link to="/" className="mb-6 block font-display text-2xl font-bold text-primary">
            {brand}
          </Link>
          {children}
        </div>
      </div>
    );
  }

  if (pattern === 'photo-mosaic') {
    return (
      <div className="grid min-h-screen bg-background text-ink lg:grid-cols-[1.1fr_minmax(0,26rem)]">
        <aside className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4 opacity-90">
            <div className="rounded-3xl bg-gradient-to-br from-primary/50 to-primary/10" />
            <div className="mt-10 rounded-3xl bg-gradient-to-br from-black/10 to-primary/30" />
            <div className="-mt-6 rounded-3xl bg-gradient-to-br from-primary/20 to-black/5" />
            <div className="rounded-3xl bg-gradient-to-br from-primary/40 to-background" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-end p-10">
            <p className="font-display text-3xl font-bold text-ink">{brand}</p>
            <p className="mt-3 max-w-sm text-sm text-muted">{copy.body}</p>
          </div>
        </aside>
        <section className="flex flex-col justify-center bg-surface px-6 py-12 sm:px-10">
          <Link to="/" className="mb-8 font-display text-xl font-bold text-primary lg:hidden">
            {brand}
          </Link>
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="border-r border-black/8">{brandPane}</div>
        {formPane}
      </div>
    </div>
  );
}

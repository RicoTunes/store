import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { INTENT, SITE_BRAND } from '@/config/site';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = { label: string; to: string };

function MessengerAuth() {
  const { user, logout } = useAuth();
  if (user) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="hidden max-w-[9rem] truncate text-xs text-muted sm:inline" title={user.email || user.name || ''}>
          {user.name || user.email || 'Signed in'}
        </span>
        <button
          type="button"
          className="rounded-md px-2 py-1.5 text-sm font-medium text-ink/80 hover:bg-black/5 hover:text-primary"
          onClick={() => void logout()}
        >
          Sign out
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Link to="/login" className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10">
        Login
      </Link>
      <Link to="/register" className="rounded-md px-2.5 py-1.5 text-sm font-medium text-ink/80 hover:bg-black/5">
        Register
      </Link>
    </span>
  );
}

export function MessengerLayout({
  brand,
  navItems = [],
  chromeVariant = 'app-bar',
}: {
  brand: string;
  navItems?: NavItem[];
  chromeVariant?: string;
}) {
  const location = useLocation();
  const name = brand || SITE_BRAND || 'Messages';
  const mDesign = ((INTENT as any).messengerDesign && typeof (INTENT as any).messengerDesign === 'object')
    ? ((INTENT as any).messengerDesign as Record<string, string>)
    : {};
  const skin = String((INTENT as any).messengerSkin || mDesign.skin || 'classic-dm');
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.search]);
  const slimNav = (navItems || []).filter((item) => {
    const lab = String(item.label || '').trim().toLowerCase();
    const to = String(item.to || '');
    // Home/Messages to / is redundant with the brand mark on a messenger home.
    if (to === '/' || to === '' || lab === 'home' || lab === 'messages' || lab === 'chat') return false;
    // ChatGPT-style AI homes: keep chrome lean — Agents / Dashboard only.
    if ((INTENT as any).ai_messenger) {
      const keep = new Set(['agents', 'dashboard', 'workspace', 'settings', 'profile']);
      return keep.has(lab);
    }
    return Boolean(lab && to);
  });
  const authPath = ['/login', '/register', '/forgot-password', '/reset-password'].some(
    (p) => location.pathname === p || location.pathname.endsWith(p),
  );
  const barClass =
    chromeVariant === 'minimal'
      ? 'border-b border-transparent bg-transparent'
      : chromeVariant === 'solid-brand'
        ? 'border-b border-black/10 bg-primary text-[color:var(--color-on-primary,#fff)]'
        : 'border-b border-black/5 bg-surface/95 backdrop-blur-md';
  const linkClass =
    chromeVariant === 'solid-brand'
      ? 'rounded-md px-2.5 py-1.5 text-sm font-medium text-white/90 hover:bg-white/15'
      : 'rounded-md px-2.5 py-1.5 text-sm font-medium text-ink/75 hover:bg-black/5 hover:text-primary';
  const brandClass =
    chromeVariant === 'solid-brand'
      ? 'font-display text-lg font-bold tracking-tight text-white'
      : 'font-display text-lg font-bold tracking-tight text-ink';

  return (
    <div
      className={`messenger-app-shell flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-background text-ink messenger-skin--${skin}`}
      data-messenger-shell="1"
      data-chrome={chromeVariant}
    >
      <header className={`z-30 flex h-12 shrink-0 items-center gap-3 px-3 sm:px-4 ${barClass}`}>
        <Link to="/" className={`min-w-0 truncate ${brandClass}`}>
          {name}
        </Link>
        {slimNav.length ? (
          <nav className="ml-1 hidden items-center gap-0.5 sm:flex" aria-label="Messenger">
            {slimNav.map((item) => (
              <Link key={item.to + item.label} to={item.to} className={linkClass}>
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          {INTENT.auth ? <MessengerAuth /> : null}
        </div>
      </header>
      <div className={`min-h-0 flex-1 overflow-hidden ${authPath ? 'overflow-y-auto' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
}

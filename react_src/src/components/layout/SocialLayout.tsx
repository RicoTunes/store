import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { INTENT, SITE_BRAND } from '@/config/site';
import { friendsApi, messagesApi, notificationsApi, profileApi, socialSearchApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = { label: string; to: string; icon?: string };

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', to: '/', icon: 'home' },
  { label: 'Friends', to: '/friends', icon: 'users' },
  { label: 'Groups', to: '/groups', icon: 'groups' },
  { label: 'Pages', to: '/pages', icon: 'pages' },
  { label: 'Messages', to: '/messages', icon: 'messages' },
  { label: 'Profile', to: '/profile', icon: 'profile' },
];

const DEFAULT_MOBILE: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Friends', to: '/friends' },
  { label: 'Create', to: '/#compose' },
  { label: 'Messages', to: '/messages' },
  { label: 'Profile', to: '/profile' },
];

function navFromIntent(): { nav: NavItem[]; mobile: NavItem[] } {
  const nav = Array.isArray((INTENT as any).socialNav) ? ((INTENT as any).socialNav as NavItem[]) : DEFAULT_NAV;
  const mobile = Array.isArray((INTENT as any).socialMobileNav)
    ? ((INTENT as any).socialMobileNav as NavItem[])
    : DEFAULT_MOBILE;
  return { nav: nav.length ? nav : DEFAULT_NAV, mobile: mobile.length ? mobile : DEFAULT_MOBILE };
}

function isGatedPath(to: string) {
  const p = String(to || '').replace(/^\//, '').split('#')[0].split('?')[0];
  return ['friends', 'messages', 'groups', 'pages', 'profile', 'jobs', 'saved', 'explore', 'notifications', 'reports', 'reels'].some(
    (k) => p === k || p.startsWith(`${k}/`),
  );
}

function iconGlyph(icon?: string) {
  switch (icon) {
    case 'users':
      return '👥';
    case 'groups':
      return '⌂';
    case 'pages':
      return '▣';
    case 'messages':
      return '✎';
    case 'profile':
      return '◉';
    case 'jobs':
      return '▣';
    case 'discover':
      return '◎';
    case 'saved':
      return '☆';
    case 'explore':
      return '◎';
    case 'reels':
      return '▶';
    case 'create':
      return '+';
    case 'home':
      return '⌂';
    case 'notifications':
      return 'bell';
    default:
      return '⌂';
  }
}

function RailIcon({ icon, active }: { icon?: string; active?: boolean }) {
  const cls = `h-6 w-6 ${active ? 'stroke-[2.1]' : 'stroke-[1.7]'}`;
  const common = { viewBox: '0 0 24 24', className: cls, fill: 'none', stroke: 'currentColor', 'aria-hidden': true as const };
  switch (icon) {
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M3.5 18.5c.7-2.8 2.9-4.2 5.5-4.2s4.8 1.4 5.5 4.2" strokeLinecap="round" />
          <path d="M14.5 15c1.4-.5 3-.3 4.5.8" strokeLinecap="round" />
        </svg>
      );
    case 'messages':
      return (
        <svg {...common}>
          <path d="M5 6.5h14A1.5 1.5 0 0 1 20.5 8v7.5A1.5 1.5 0 0 1 19 17h-5.2L8 20.2V17H5A1.5 1.5 0 0 1 3.5 15.5V8A1.5 1.5 0 0 1 5 6.5z" strokeLinejoin="round" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19c1.1-3.2 3.4-4.8 7-4.8s5.9 1.6 7 4.8" strokeLinecap="round" />
        </svg>
      );
    case 'explore':
    case 'discover':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="m10.2 13.8 1.2-3.4 3.4-1.2-1.2 3.4-3.4 1.2z" strokeLinejoin="round" />
        </svg>
      );
    case 'groups':
      return (
        <svg {...common}>
          <path d="M4 19V7.5A1.5 1.5 0 0 1 5.5 6H10l2 2h6.5A1.5 1.5 0 0 1 20 9.5V19" strokeLinejoin="round" />
        </svg>
      );
    case 'pages':
    case 'jobs':
      return (
        <svg {...common}>
          <rect x="5" y="4.5" width="14" height="15" rx="2" />
          <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
        </svg>
      );
    case 'saved':
      return (
        <svg {...common}>
          <path d="M7 4.5h10v15l-5-3.2L7 19.5v-15z" strokeLinejoin="round" />
        </svg>
      );
    case 'reels':
      return (
        <svg {...common}>
          <rect x="4.5" y="5" width="15" height="14" rx="2.5" />
          <path d="m10.5 9.5 5 2.5-5 2.5v-5z" strokeLinejoin="round" />
        </svg>
      );
    case 'create':
      return (
        <svg {...common}>
          <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
          <path d="M12 8.5v7M8.5 12h7" strokeLinecap="round" />
        </svg>
      );
    case 'notifications':
      return (
        <svg {...common}>
          <path d="M6.5 16.5h11l-1.2-1.4V11a4.3 4.3 0 1 0-8.6 0v4.1L6.5 16.5z" strokeLinejoin="round" />
          <path d="M10.2 18.2a1.8 1.8 0 0 0 3.6 0" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M4.5 11.2 12 4.8l7.5 6.4V19a1.2 1.2 0 0 1-1.2 1.2h-4.1v-5.2h-4.4V20.2H5.7A1.2 1.2 0 0 1 4.5 19v-7.8z" strokeLinejoin="round" />
        </svg>
      );
  }
}

function countLabel(n: number) {
  if (!n) return '';
  return n > 9 ? '9+' : String(n);
}

function personInitials(name: string) {
  return (
    String(name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

function HeaderCircle({
  to,
  label,
  count,
  children,
}: {
  to: string;
  label: string;
  count?: number;
  children: any;
}) {
  return (
    <Link
      to={to}
      aria-label={count ? `${label}, ${count} new` : label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06] text-ink hover:bg-black/[0.1]"
    >
      {children}
      {count ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-[color:var(--color-on-primary,#fff)]">
          {countLabel(count)}
        </span>
      ) : null}
    </Link>
  );
}

function MessagesGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 6.5h14A1.5 1.5 0 0 1 20.5 8v7.5A1.5 1.5 0 0 1 19 17h-5.2L8 20.2V17H5A1.5 1.5 0 0 1 3.5 15.5V8A1.5 1.5 0 0 1 5 6.5z" />
    </svg>
  );
}

function BellGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  );
}

function FriendsGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="9" cy="8.5" r="3" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M3.5 18.5c.6-2.8 2.8-4.2 5.5-4.2s4.9 1.4 5.5 4.2" strokeLinecap="round" />
      <path d="M14.2 14.8c1.5-.6 3.2-.4 4.8.7 1.1.8 1.7 1.9 1.9 3" strokeLinecap="round" />
    </svg>
  );
}

export function SocialLayout({
  brand,
  navItems,
  chromeVariant,
}: {
  brand?: string;
  navItems?: NavItem[];
  chromeVariant?: string;
}) {
  const { user, logout } = useAuth() as any;
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState(() => {
    try {
      return new URLSearchParams(location.search || '').get('q') || '';
    } catch {
      return '';
    }
  });
  const [liveHits, setLiveHits] = useState<{ people: any[]; posts: any[] } | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveBusy, setLiveBusy] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const searchBoxRef = useRef<HTMLFormElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const liveTimer = useRef<number | undefined>(undefined);
  // Declare Messages FAB state before any effect that reads it (TDZ blank-page crash).
  const [msgFabOpen, setMsgFabOpen] = useState(false);
  const [fabThreads, setFabThreads] = useState<any[]>([]);
  const [fabBusy, setFabBusy] = useState(false);
  const msgFabRef = useRef<HTMLDivElement | null>(null);
  const [msgUnread, setMsgUnread] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  useEffect(() => {
    try {
      setQ(new URLSearchParams(location.search || '').get('q') || '');
    } catch {
      /* ignore */
    }
  }, [location.search]);
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.search]);
  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (!searchBoxRef.current?.contains(target)) setLiveOpen(false);
      if (!accountMenuRef.current?.contains(target)) setAccountOpen(false);
      if (!msgFabRef.current?.contains(target)) setMsgFabOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  useEffect(() => {
    setAccountOpen(false);
    setMsgFabOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!msgFabOpen || !user?.id) return;
    let cancelled = false;
    setFabBusy(true);
    void messagesApi.listThreads()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.threads) ? data.threads : Array.isArray(data) ? data : [];
        setFabThreads(list.slice(0, 24));
      })
      .catch(() => {
        if (!cancelled) setFabThreads([]);
      })
      .finally(() => {
        if (!cancelled) setFabBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [msgFabOpen, user?.id]);
  const { nav: intentNav, mobile: mobileNav } = useMemo(() => navFromIntent(), []);
  const sideNav = (navItems && navItems.length ? navItems : intentNav).filter(
    (n) => n.to && !['login', 'register'].includes(String(n.to).replace(/^\//, '')),
  );
  const visibleNav = user ? sideNav : sideNav.filter((n) => !isGatedPath(n.to));
  const visibleMobile = user ? mobileNav : [];
  const brandName = brand || SITE_BRAND || 'Community';
  const chrome = String(chromeVariant || (INTENT as any).socialChrome || 'soft-surface').toLowerCase().replace(/_/g, '-');
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const designMods = [
    design.shell ? `social-shell--${design.shell}` : '',
    design.topbar ? `social-topbar--${design.topbar}` : '',
    design.nav_style ? `social-nav--${design.nav_style}` : '',
    design.surface ? `social-surface--${design.surface}` : '',
    design.density ? `social-density--${design.density}` : '',
    design.motion ? `social-motion--${design.motion}` : '',
  ].filter(Boolean).join(' ');
  const classic = chrome === 'classic-blue' || design.shell === 'classic-three' || design.topbar === 'solid-brand';
  const navStyle = String(design.nav_style || '').toLowerCase().replace(/_/g, '-') || 'hybrid-labels';
  const path = `${location.pathname}${location.hash || ''}`;
  const isMessages = path.includes('messages');
  const isAuthGate = path.includes('login') || path.includes('register') || path.includes('forgot') || path.includes('reset');
  // Side-rail nav for networking / social apps (Instagram-like icon rail or labeled app rail).
  const useIconSideRail =
    ['icon-rail', 'dock-glass', 'side-reveal', 'numbered-marks'].includes(navStyle) ||
    design.shell === 'studio-column' ||
    design.shell === 'immersive-stage' ||
    chrome === 'creator-studio';
  const useWideSideRail =
    !useIconSideRail &&
    !classic &&
    chrome !== 'messenger-rail' &&
    design.shell !== 'messenger-first' &&
    (
      navStyle === 'hybrid-labels' ||
      navStyle === 'compact-pills' ||
      design.left_rail === 'app-nav' ||
      design.left_rail === 'shortcuts' ||
      design.left_rail === 'communities' ||
      design.shell === 'rail-feed' ||
      design.shell === 'split-focus' ||
      design.shell === 'dual-canvas' ||
      design.shell === 'forum-rail' ||
      design.shell === 'narrow-stream'
    );
  const showSideRail = Boolean(user) && !isAuthGate && !isMessages && (useIconSideRail || useWideSideRail);
  const hideTopPrimaryNav = showSideRail && useIconSideRail;
  const chatEntry = String(design.chat_entry || 'header-icon');
  // Messages stay in header / side nav / mobile tab — no floating message FAB on social.
  const showMsgFab = false; // dwene-no-msg-fab

  useEffect(() => {
    if (!user?.id) {
      setMsgUnread(0);
      setNotifCount(0);
      setAvatarUrl('');
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      try {
        const [threads, notifs, friends, me] = await Promise.all([
          messagesApi.listThreads().catch(() => null),
          notificationsApi.list().catch(() => null),
          friendsApi.list().catch(() => null),
          profileApi.me().catch(() => null),
        ]);
        if (cancelled) return;
        const list = Array.isArray(threads?.threads) ? threads.threads : Array.isArray(threads) ? threads : [];
        setMsgUnread(list.reduce((n: number, t: any) => n + (Number(t?.unread) || 0), 0));
        const unreadN = Number(notifs?.unread || 0);
        const items = Array.isArray(notifs?.notifications) ? notifs.notifications : [];
        const requestNotifs = items.filter((x: any) => String(x.kind || '') === 'friend_request' && !x.read).length;
        const incomingN = Array.isArray(friends?.requests?.incoming) ? friends.requests.incoming.length : 0;
        setNotifCount(unreadN + Math.max(0, incomingN - requestNotifs));
        const p = (me && (me.profile || me)) || {};
        setAvatarUrl(String(p.avatar_url || user.avatar || ''));
      } catch {
        /* ignore */
      }
    };
    void refresh();
    const t = window.setInterval(() => void refresh(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [user?.id]);

  function runLiveSearch(term: string) {
    window.clearTimeout(liveTimer.current);
    const next = term.trim();
    if (!next) {
      setLiveHits(null);
      setLiveBusy(false);
      return;
    }
    setLiveBusy(true);
    liveTimer.current = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await socialSearchApi.search(next);
          setLiveHits({ people: data?.people || [], posts: data?.posts || [] });
          setLiveOpen(true);
        } catch {
          setLiveHits({ people: [], posts: [] });
          setLiveOpen(true);
        } finally {
          setLiveBusy(false);
        }
      })();
    }, 180);
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setLiveOpen(false);
    navigate(`/?q=${encodeURIComponent(term)}`);
  }

  if (isAuthGate) {
    return (
      <div className="min-h-screen bg-background text-ink">
        <Outlet />
      </div>
    );
  }

  return (
    <div className={`social-chrome--${chrome} ${designMods} flex min-h-screen flex-col text-ink ${
      classic
        ? 'bg-[color-mix(in_srgb,var(--color-background)_92%,#c5d4e8)]'
        : chrome === 'creator-studio'
          ? 'bg-background'
          : 'bg-[color-mix(in_srgb,var(--color-background)_88%,#94a3b8)]'
    }`}>
      <header
        className={`sticky top-0 z-40 ${
          classic
            ? 'bg-primary text-[color:var(--color-on-primary,#fff)] shadow-sm'
            : 'border-b border-black/8 bg-surface/95 backdrop-blur'
        }`}
      >
        <div className={`mx-auto flex h-14 w-full items-center gap-3 px-3 md:px-4 ${
          classic ? 'max-w-[1280px]' : 'max-w-[1400px]'
        }`}>
          <Link
            to="/"
            className={`shrink-0 font-display text-lg font-bold tracking-tight ${
              classic ? 'text-[color:var(--color-on-primary,#fff)]' : 'text-primary'
            }`}
          >
            {brandName}
          </Link>
          {user ? (
            <form ref={searchBoxRef} onSubmit={onSearch} className="relative min-w-0 flex-1 md:max-w-md">
              <label className="sr-only" htmlFor="social-global-search">
                Search
              </label>
              <input
                id="social-global-search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  runLiveSearch(e.target.value);
                  setLiveOpen(true);
                }}
                onFocus={() => {
                  if (q.trim()) setLiveOpen(true);
                }}
                placeholder={classic ? `Search ${brandName}...` : 'Search people, posts, groups'}
                className={`w-full rounded-full px-4 py-2 text-sm outline-none focus:ring-2 ${
                  classic
                    ? 'border-0 bg-white/95 text-ink placeholder:text-muted focus:ring-white/40'
                    : 'border border-black/10 bg-background text-ink focus:ring-primary/30'
                }`}
                autoComplete="off"
              />
              {liveOpen && q.trim() ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-2xl bg-surface text-ink shadow-xl ring-1 ring-black/10">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {liveBusy ? 'Searching…' : 'Live results'}
                  </p>
                  <div className="max-h-80 overflow-y-auto">
                    <p className="px-3 pb-1 text-[11px] font-semibold text-muted">People</p>
                    <ul>
                      {(liveHits?.people || []).slice(0, 6).map((p: any) => (
                        <li key={p.id}>
                          <Link
                            to={`/u/${p.id}`}
                            onClick={() => setLiveOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-black/[0.04]"
                          >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                              {String(p.name || p.id)
                                .split(/\s+/)
                                .map((x: string) => x[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                            <span className="truncate font-medium">{p.name || p.id}</span>
                          </Link>
                        </li>
                      ))}
                      {!liveBusy && !liveHits?.people?.length ? (
                        <li className="px-3 py-2 text-sm text-muted">No people</li>
                      ) : null}
                    </ul>
                    <p className="mt-1 px-3 pb-1 text-[11px] font-semibold text-muted">Posts</p>
                    <ul>
                      {(liveHits?.posts || []).slice(0, 6).map((p: any) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setLiveOpen(false);
                              navigate(`/?q=${encodeURIComponent(q.trim())}`);
                            }}
                            className="block w-full truncate px-3 py-2 text-left text-sm text-ink hover:bg-black/[0.04]"
                          >
                            <span className="font-medium">{p.author}</span>
                            <span className="text-muted"> · {p.text}</span>
                          </button>
                        </li>
                      ))}
                      {!liveBusy && !liveHits?.posts?.length ? (
                        <li className="px-3 py-2 text-sm text-muted">No posts</li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              ) : null}
            </form>
          ) : (
            <div className="hidden min-w-0 flex-1 sm:block md:max-w-md" />
          )}
          {user && classic ? (
            <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary">
              <NavLink
                to="/"
                end
                aria-label="Home"
                className={({ isActive }) =>
                  `inline-flex h-10 w-12 items-center justify-center rounded-lg ${
                    isActive ? 'bg-black/15' : 'hover:bg-black/10'
                  }`
                }
              >
                <HomeGlyph />
              </NavLink>
              <NavLink
                to="/friends"
                aria-label="Friends"
                className={({ isActive }) =>
                  `inline-flex h-10 w-12 items-center justify-center rounded-lg ${
                    isActive ? 'bg-black/15' : 'hover:bg-black/10'
                  }`
                }
              >
                <FriendsGlyph />
              </NavLink>
              <NavLink
                to="/notifications"
                aria-label={notifCount ? `Notifications, ${notifCount} new` : 'Notifications'}
                className={({ isActive }) =>
                  `relative inline-flex h-10 w-12 items-center justify-center rounded-lg ${
                    isActive ? 'bg-black/15' : 'hover:bg-black/10'
                  }`
                }
              >
                <BellGlyph />
                {notifCount ? (
                  <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-on-primary,#fff)] px-1 text-[9px] font-bold leading-none text-primary">
                    {countLabel(notifCount)}
                  </span>
                ) : null}
              </NavLink>
            </nav>
          ) : user && !hideTopPrimaryNav ? (
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary">
            {visibleNav.slice(0, 5).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1.5 text-sm font-semibold ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-black/5 hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          ) : (
            <div className={`ml-auto hidden md:block ${hideTopPrimaryNav ? 'flex-1' : ''}`} />
          )}
          <div className={`flex shrink-0 items-center gap-1.5 ${user ? (classic ? 'md:ml-2' : 'ml-auto md:ml-0') : 'ml-auto'}`}>
            {user ? (
              <>
                {!classic ? (
                  <>
                    <HeaderCircle to="/messages" label="Messages" count={msgUnread}>
                      <MessagesGlyph />
                    </HeaderCircle>
                    <HeaderCircle to="/notifications" label="Notifications" count={notifCount}>
                      <BellGlyph />
                    </HeaderCircle>
                  </>
                ) : null}
                <div ref={accountMenuRef} className="relative">
                  <button
                    type="button"
                    aria-label="Account menu"
                    aria-expanded={accountOpen}
                    onClick={() => setAccountOpen((v) => !v)}
                    className={`inline-flex items-center gap-2 overflow-hidden ${
                      classic
                        ? 'rounded-lg bg-black/10 py-1 pl-1 pr-2 hover:bg-black/15'
                        : 'h-9 w-9 rounded-full bg-primary/15 text-xs font-bold text-primary ring-1 ring-black/10'
                    }`}
                  >
                    <span className={`inline-flex overflow-hidden ${classic ? 'h-8 w-8 rounded-lg' : 'h-full w-full rounded-full'}`}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className={`flex h-full w-full items-center justify-center text-xs font-bold ${classic ? 'bg-black/20' : ''}`}>
                          {personInitials(user.name || 'U')}
                        </span>
                      )}
                    </span>
                    {classic ? (
                      <>
                        <span className="hidden max-w-[7rem] truncate text-sm font-semibold sm:inline">{user.name || 'You'}</span>
                        <span aria-hidden className="text-[10px] opacity-80">▾</span>
                      </>
                    ) : null}
                  </button>
                  {accountOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.4rem)] z-50 min-w-[11rem] overflow-hidden rounded-2xl bg-surface py-1 text-ink shadow-xl ring-1 ring-black/10">
                      <p className="truncate px-3 py-2 text-xs font-semibold text-muted">{user.name || user.email || 'Account'}</p>
                      <Link
                        to="/profile"
                        onClick={() => setAccountOpen(false)}
                        className="block px-3 py-2.5 text-sm font-semibold text-ink hover:bg-black/[0.04]"
                      >
                        View profile
                      </Link>
                      {typeof logout === 'function' ? (
                        <button
                          type="button"
                          className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-black/[0.04]"
                          onClick={() => {
                            setAccountOpen(false);
                            void logout();
                          }}
                        >
                          Log out
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  classic
                    ? 'bg-white text-primary'
                    : 'bg-primary text-[color:var(--color-on-primary,#fff)]'
                }`}
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div
        className={`mx-auto flex w-full flex-1 gap-0 px-0 md:gap-4 md:px-4 ${
          classic ? 'max-w-[1280px]' : 'max-w-[1400px]'
        }`}
      >
        {showSideRail ? (
          useIconSideRail ? (
            <aside
              className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 py-3 lg:flex lg:flex-col ${
                navStyle === 'dock-glass'
                  ? 'w-[4.75rem] px-1.5'
                  : navStyle === 'side-reveal'
                    ? 'w-[5.25rem] px-1'
                    : 'w-[4.75rem] px-1'
              }`}
              aria-label="App rail"
            >
              <nav
                className={`flex h-full flex-col rounded-[1.35rem] py-3 ${
                  navStyle === 'dock-glass'
                    ? 'bg-surface/80 shadow-lg ring-1 ring-black/8 backdrop-blur-xl'
                    : navStyle === 'side-reveal'
                      ? 'bg-transparent'
                      : 'bg-surface shadow-sm ring-1 ring-black/8'
                }`}
              >
                <Link
                  to="/"
                  className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary"
                  aria-label={brandName}
                  title={brandName}
                >
                  {brandName.slice(0, 1).toUpperCase()}
                </Link>
                <ul className="flex min-h-0 flex-1 flex-col items-stretch gap-0.5 overflow-y-auto px-1.5">
                  {visibleNav.map((item, idx) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        title={item.label}
                        className={({ isActive }) =>
                          `group flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold transition ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted hover:bg-black/[0.04] hover:text-ink'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className="relative inline-flex items-center justify-center">
                              {navStyle === 'numbered-marks' ? (
                                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                  isActive ? 'bg-primary text-[color:var(--color-on-primary,#fff)]' : 'bg-black/[0.06] text-ink'
                                }`}>
                                  {idx + 1}
                                </span>
                              ) : (
                                <RailIcon icon={item.icon || (item.to === '/' ? 'home' : undefined)} active={isActive} />
                              )}
                              {item.to.includes('messages') && msgUnread ? (
                                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
                              ) : null}
                              {item.to.includes('notifications') && notifCount ? (
                                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
                              ) : null}
                            </span>
                            <span className="max-w-full truncate px-0.5">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                  <li>
                    <Link
                      to="/#compose"
                      title="Create"
                      className="group flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold text-muted hover:bg-black/[0.04] hover:text-ink"
                    >
                      <RailIcon icon="create" />
                      <span>Create</span>
                    </Link>
                  </li>
                </ul>
                <Link
                  to="/profile"
                  className="mx-auto mt-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[11px] font-bold text-primary ring-2 ring-surface"
                  title="Profile"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    personInitials(String(user?.name || 'You'))
                  )}
                </Link>
              </nav>
            </aside>
          ) : (
            <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[240px] shrink-0 overflow-y-auto py-4 lg:block">
              <nav
                className={`rounded-2xl bg-surface p-2 shadow-sm ring-1 ring-black/5 ${
                  chrome === 'community-forum' || design.shell === 'forum-rail' ? 'ring-primary/20' : ''
                }`}
                aria-label="App"
              >
                <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Navigate
                </p>
                <ul className="space-y-0.5">
                  {visibleNav.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                            isActive ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-black/[0.04]'
                          }`
                        }
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04] text-ink">
                          <RailIcon icon={item.icon || (item.to === '/' ? 'home' : undefined)} active={false} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.to.includes('messages') && msgUnread ? (
                          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--color-on-primary,#fff)]">
                            {countLabel(msgUnread)}
                          </span>
                        ) : null}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              <p className="mt-4 px-3 text-[11px] leading-relaxed text-muted">
                You are inside {brandName}. Navigate, discover, and interact — this is the product, not a brochure.
              </p>
            </aside>
          )
        ) : null}

        <main className={`min-w-0 flex-1 ${user ? 'pb-20 lg:pb-4' : 'pb-4'} ${isMessages ? 'py-0 md:py-3' : 'py-3 md:py-4'}`}>
          <Outlet />
        </main>
      </div>

      {showMsgFab ? (
        <div ref={msgFabRef} className="pointer-events-none fixed bottom-20 right-4 z-[70] flex flex-col items-end gap-3 lg:bottom-6">
          {msgFabOpen ? (
            <div
              role="dialog"
              aria-label="Messages"
              className="pointer-events-auto flex h-[min(32rem,70vh)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-black/10 animate-[dweneFabIn_0.22s_ease-out]"
            >
              <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-ink">Messages</p>
                  <p className="text-[11px] text-muted">{msgUnread ? `${msgUnread} unread` : 'Your conversations'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to="/messages"
                    className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                    onClick={() => setMsgFabOpen(false)}
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    aria-label="Close messages"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-black/[0.05]"
                    onClick={() => setMsgFabOpen(false)}
                  >
                    ×
                  </button>
                </div>
              </div>
              <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
                {fabBusy ? (
                  <li className="px-3 py-8 text-center text-xs text-muted">Loading…</li>
                ) : fabThreads.length ? (
                  fabThreads.map((t: any) => (
                    <li key={String(t.id)}>
                      <Link
                        to={`/messages?thread=${encodeURIComponent(String(t.id || ''))}`}
                        onClick={() => setMsgFabOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 hover:bg-black/[0.04]"
                      >
                        <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                          {String(t.name || 'C')
                            .split(/\s+/)
                            .map((p: string) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                          {Number(t.unread || 0) > 0 ? (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{t.name || 'Chat'}</span>
                          <span className="block truncate text-xs text-muted">{t.preview || t.last_message || 'Say hello'}</span>
                        </span>
                        {t.time || t.time_label ? (
                          <span className="shrink-0 text-[10px] text-muted">{t.time || t.time_label}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-10 text-center text-xs text-muted">
                    No conversations yet.
                    <Link to="/messages" className="mt-2 block font-semibold text-primary" onClick={() => setMsgFabOpen(false)}>
                      Start a chat
                    </Link>
                  </li>
                )}
              </ul>
              <div className="border-t border-black/5 p-2">
                <Link
                  to="/messages"
                  onClick={() => setMsgFabOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-[color:var(--color-on-primary,#fff)] shadow-sm"
                >
                  New message
                </Link>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            aria-label="Messages"
            aria-expanded={msgFabOpen}
            onClick={() => setMsgFabOpen((v) => !v)}
            className={`pointer-events-auto group flex items-center gap-2 rounded-full bg-surface pl-3 pr-4 py-2.5 text-sm font-semibold text-ink shadow-xl ring-1 ring-black/10 transition hover:scale-[1.03] hover:shadow-2xl ${
              chatEntry === 'fab-bubble' ? 'bg-primary text-[color:var(--color-on-primary,#fff)] ring-primary/30' : ''
            }`}
          >
            <span className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full ${
              chatEntry === 'fab-bubble' ? 'bg-white/20' : 'bg-primary/15 text-primary'
            }`} aria-hidden>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" strokeLinejoin="round" />
              </svg>
              {msgUnread > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-[color:var(--color-on-primary,#fff)]">
                  {msgUnread > 9 ? '9+' : msgUnread}
                </span>
              ) : null}
            </span>
            Messages
          </button>
          <style>{`@keyframes dweneFabIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}`}</style>
        </div>
      ) : null}

      {user && visibleMobile.length ? (
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-surface/95 backdrop-blur lg:hidden"
        aria-label="Mobile"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {visibleMobile.slice(0, 5).map((item) => {
            const active =
              item.to === '/'
                ? path === '/' || path === '' || path.startsWith('/#')
                : path.includes(item.to.replace(/^\//, '').split('#')[0] || '___');
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-semibold ${
                    active ? 'text-primary' : 'text-muted'
                  }`}
                >
                  <span className="text-sm" aria-hidden>
                    {iconGlyph(item.icon)}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      ) : null}
    </div>
  );
}

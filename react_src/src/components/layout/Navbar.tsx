import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { INTENT } from '@/config/site';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const MOBILE_NAV_PATTERN = "drawer";
const MEGA_MENU_ENABLED = false;
const HEADER_STICKY = true;
const HEADER_TRANSPARENT = false;
const HEADER_SHRINK = false;


export type NavItem = { label: string; to: string; children?: NavItem[] };

function isAuthNavItem(item: { label?: string; to?: string } | null | undefined): boolean {
  const to = String(item?.to || '').toLowerCase();
  const label = String(item?.label || '').toLowerCase().trim();
  if (['/login', '/register', '/signup', '/sign-up', '/signin', '/sign-in'].some((p) => to === p || to.endsWith(p))) return true;
  return /^(login|log in|sign in|signin|register|sign up|signup|create account)$/.test(label);
}

function withoutAuthNavItems(items: NavItem[]): NavItem[] {
  return (items || [])
    .map((item) => {
      const children = (item.children || []).filter((child) => !isAuthNavItem(child));
      return { ...item, children: children.length ? children : undefined };
    })
    .filter((item) => !isAuthNavItem(item));
}

export function SmartNavLink({
  to,
  children,
  className = '',
  onNavigate,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  if (to.startsWith('#')) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          const id = to.slice(1);
          const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (location.pathname !== '/') {
            navigate('/');
            window.setTimeout(scroll, 80);
          } else {
            scroll();
          }
          onNavigate?.();
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <Link to={to} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  // Explicit SVG — CSS bar spans were often invisible on dark themes / thin previews.
  if (open) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar({ brand, navItems, variant = 'top', mobileNavPattern = MOBILE_NAV_PATTERN }: { brand: string; navItems: NavItem[]; variant?: string; mobileNavPattern?: string }) {
  const headerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const mobilePattern = mobileNavPattern || MOBILE_NAV_PATTERN;
  const useBottomNav = compact && mobilePattern === 'bottom' && (!Boolean((INTENT as any).social) || Boolean(user));
  const useDrawerToggle = compact && mobilePattern !== 'bottom';
  // Auth CTA lives in AuthSlot — drop DNA login/register links so they don't linger after sign-in.
  const baseNav = INTENT.auth ? withoutAuthNavItems(navItems) : navItems;
  const visibleNav = Boolean((INTENT as any).social) && !user
    ? baseNav.filter((item) => {
        const p = String(item.to || '').replace(/^\//, '').split('#')[0].split('?')[0];
        return !['friends', 'messages', 'groups', 'pages', 'profile', 'jobs', 'saved', 'explore', 'notifications', 'reports', 'reels'].some(
          (k) => p === k || p.startsWith(`${k}/`),
        );
      })
    : baseNav;

  useEffect(() => {
    const el = headerRef.current;
    const measure = () => {
      const width = el?.getBoundingClientRect().width || window.innerWidth;
      setCompact(width < 960);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(measure) : null;
    if (el && ro) ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setExpandedGroups({});
  }, [location.pathname, location.hash, compact]);

  useEffect(() => {
    if (!HEADER_SHRINK) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open && mobilePattern !== 'bottom' ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, mobilePattern]);

  const linkClass =
    'rounded-md px-2 py-1.5 text-sm font-medium text-ink/80 transition hover:bg-primary/10 hover:text-primary';

  const shellClass = (() => {
    const shrinkCls = HEADER_SHRINK && scrolled ? ' is-shrunk' : '';
    const stickyCls = HEADER_STICKY ? ' sticky top-0 z-40' : ' relative z-40';
    const transparentCls = HEADER_TRANSPARENT ? ' bg-transparent border-transparent' : '';
    if (variant === 'floating') {
      return `dwene-header sticky top-3 z-40 mx-3 rounded-[var(--radius-md)] border border-black/10 bg-surface/90 shadow-lg backdrop-blur-md${compact ? ' is-compact' : ''}${shrinkCls}`;
    }
    if (variant === 'minimal' || HEADER_TRANSPARENT) {
      return `dwene-header border-b border-transparent bg-transparent${compact ? ' is-compact' : ''}${shrinkCls}${stickyCls}`;
    }
    return `dwene-header border-b border-black/5 bg-surface/85 backdrop-blur-md${compact ? ' is-compact' : ''}${shrinkCls}${stickyCls}${transparentCls}`;
  })();

  const rowClass =
    variant === 'centered'
      ? 'relative flex h-16 items-center justify-center gap-4'
      : variant === 'split'
        ? 'flex h-16 items-center justify-between gap-4'
        : 'flex h-16 items-center justify-between gap-4';

  const brandNode = (
    <Link to="/" className="dwene-brand min-w-0 truncate font-display text-lg font-bold tracking-tight sm:text-xl">
      {brand}
    </Link>
  );

  const desktopNav = (
    <nav className={`dwene-nav-desktop ${variant === 'sidebar' || variant === 'minimal' ? (variant === 'sidebar' ? '!hidden' : '') : ''} ${variant === 'centered' ? '!flex' : ''}`} aria-label="Primary">
      {visibleNav.map((item) => (
        item.children?.length ? (
          <div key={item.to + item.label} className="group relative">
            <SmartNavLink to={item.to} className={linkClass}>
              {item.label}
              <span className="ml-1 text-[10px] opacity-70">▾</span>
            </SmartNavLink>
            <div className={`invisible absolute left-0 top-full z-40 translate-y-1 rounded-md bg-surface opacity-0 shadow-xl ring-1 ring-black/10 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${(MEGA_MENU_ENABLED || variant === 'dropdown' || variant === 'mega') && item.children.length >= 2 ? 'min-w-[28rem] max-w-[36rem] p-4' : 'min-w-[12rem] p-2'}`}>
              <div className={(MEGA_MENU_ENABLED || variant === 'dropdown' || variant === 'mega') && item.children.length >= 2 ? `grid gap-1 ${item.children.length >= 6 ? 'grid-cols-3' : 'grid-cols-2'}` : 'flex flex-col gap-0.5'}>
                {item.children.map((child) => (
                  <SmartNavLink
                    key={child.to + child.label}
                    to={child.to}
                    className="block rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-primary/10 hover:text-primary"
                  >
                    {child.label}
                  </SmartNavLink>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <SmartNavLink key={item.to + item.label} to={item.to} className={linkClass}>
            {item.label}
          </SmartNavLink>
        )
      ))}
      {INTENT.cart ? <span className="inline-flex items-center gap-2"><SavedBadge /><CartBadge /></span> : null}
      {INTENT.auth ? <AuthSlot /> : null}
    </nav>
  );

  const mobilePanelClass =
    mobilePattern === 'fullscreen'
      ? 'dwene-mobile-panel mobile-nav fixed inset-0 z-50 flex flex-col bg-background'
      : 'dwene-mobile-panel mobile-nav';

  const renderMobileLinks = () => (
    <>
      {visibleNav.map((item) => (
        item.children?.length ? (
          mobilePattern === 'accordion' ? (
            <div key={'g-' + item.label} className="dwene-mobile-group dwene-mobile-accordion">
              <button
                type="button"
                className="dwene-mobile-link flex w-full items-center justify-between text-left"
                aria-expanded={!!expandedGroups[item.label]}
                onClick={() => setExpandedGroups((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
              >
                {item.label}
                <span className="text-xs opacity-70">{expandedGroups[item.label] ? '▴' : '▾'}</span>
              </button>
              {expandedGroups[item.label] ? (
                <div className="dwene-mobile-group-links pl-3">
                  {item.children.map((child) => (
                    <SmartNavLink
                      key={'m-' + child.to + child.label}
                      to={child.to}
                      className="dwene-mobile-link"
                      onNavigate={() => setOpen(false)}
                    >
                      {child.label}
                    </SmartNavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div key={'g-' + item.label} className="dwene-mobile-group">
              <p className="dwene-mobile-group-label">{item.label}</p>
              <div className="dwene-mobile-group-links">
                {item.children.map((child) => (
                  <SmartNavLink
                    key={'m-' + child.to + child.label}
                    to={child.to}
                    className="dwene-mobile-link"
                    onNavigate={() => setOpen(false)}
                  >
                    {child.label}
                  </SmartNavLink>
                ))}
              </div>
            </div>
          )
        ) : (
          <SmartNavLink
            key={'m-' + item.to + item.label}
            to={item.to}
            className="dwene-mobile-link"
            onNavigate={() => setOpen(false)}
          >
            {item.label}
          </SmartNavLink>
        )
      ))}
      {INTENT.auth ? (
        <div className="dwene-mobile-auth">
          <AuthSlot />
        </div>
      ) : null}
    </>
  );

  return (
    <header ref={headerRef} className={shellClass}>
      <Container className={rowClass}>
        {variant === 'centered' ? (
          <>
            <div className="absolute left-4 top-1/2 -translate-y-1/2">{brandNode}</div>
            {desktopNav}
            <div className="dwene-nav-mobile absolute right-4 top-1/2 -translate-y-1/2">
              {INTENT.cart ? <span className="inline-flex items-center gap-2"><SavedBadge /><CartBadge /></span> : null}
              {useDrawerToggle ? (
              <button
                id="hamburger"
                type="button"
                className="dwene-menu-btn menu-toggle hamburger"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((v) => !v)}
              >
                <MenuIcon open={open} />
              </button>
              ) : null}
            </div>
          </>
        ) : variant === 'split' ? (
          <>
            {brandNode}
            <nav className={`dwene-nav-desktop ${variant === 'sidebar' ? '!hidden' : ''}`} aria-label="Primary">
              {visibleNav.slice(0, Math.ceil(visibleNav.length / 2)).map((item) => (
                <SmartNavLink key={item.to + item.label} to={item.to} className={linkClass}>{item.label}</SmartNavLink>
              ))}
            </nav>
            <nav className={`dwene-nav-desktop ${variant === 'sidebar' ? '!hidden' : ''}`} aria-label="Secondary">
              {visibleNav.slice(Math.ceil(visibleNav.length / 2)).map((item) => (
                <SmartNavLink key={item.to + item.label} to={item.to} className={linkClass}>{item.label}</SmartNavLink>
              ))}
              {INTENT.cart ? <span className="inline-flex items-center gap-2"><SavedBadge /><CartBadge /></span> : null}
              {INTENT.auth ? <AuthSlot /> : null}
            </nav>
            <div className="dwene-nav-mobile">
              {INTENT.cart ? <span className="inline-flex items-center gap-2"><SavedBadge /><CartBadge /></span> : null}
              {useDrawerToggle ? (
              <button
                id="hamburger"
                type="button"
                className="dwene-menu-btn menu-toggle hamburger"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((v) => !v)}
              >
                <MenuIcon open={open} />
              </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            {brandNode}
            {variant === 'minimal' ? (
              <nav className="dwene-nav-desktop !flex gap-1" aria-label="Primary">
                {visibleNav.slice(0, 4).map((item) => (
                  <SmartNavLink key={item.to + item.label} to={item.to} className={linkClass}>{item.label}</SmartNavLink>
                ))}
                {INTENT.cart ? <span className="inline-flex items-center gap-2"><SavedBadge /><CartBadge /></span> : null}
                {INTENT.auth ? <AuthSlot /> : null}
              </nav>
            ) : desktopNav}
            <div className="dwene-nav-mobile">
              {INTENT.cart ? <span className="inline-flex items-center gap-2"><SavedBadge /><CartBadge /></span> : null}
              {useDrawerToggle ? (
              <button
                id="hamburger"
                type="button"
                className="dwene-menu-btn menu-toggle hamburger"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((v) => !v)}
              >
                <MenuIcon open={open} />
              </button>
              ) : null}
            </div>
          </>
        )}
      </Container>

      {open && compact && useDrawerToggle ? (
        <div
          id="mobile-nav"
          className={mobilePanelClass}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {mobilePattern === 'fullscreen' ? (
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <p className="font-display text-lg font-bold text-nav">{brand}</p>
              <button
                type="button"
                className="dwene-menu-btn menu-toggle hamburger inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-black/10"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <MenuIcon open={true} />
              </button>
            </div>
          ) : null}
          <Container className={`dwene-mobile-panel-inner ${mobilePattern === 'fullscreen' ? 'flex-1 overflow-y-auto py-6' : ''}`}>
            {renderMobileLinks()}
          </Container>
        </div>
      ) : null}

      {useBottomNav ? (
        <nav
          id="mobile-nav"
          className="dwene-bottom-nav mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-surface/95 backdrop-blur-md lg:hidden"
          aria-label="Mobile primary navigation"
        >
          <Container className="flex items-stretch justify-around gap-1 py-2">
            {visibleNav.slice(0, 5).map((item) => (
              <SmartNavLink
                key={'b-' + item.to + item.label}
                to={item.to}
                className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[11px] font-medium text-ink/75 hover:text-primary"
              >
                <span className="truncate">{item.label}</span>
              </SmartNavLink>
            ))}
          </Container>
        </nav>
      ) : null}

    </header>
  );
}

function CartBadge() {
  const { count, setOpen, setDrawerTab } = useCart();
  return (
    <button
      type="button"
      aria-label={count ? `Open cart, ${count} items` : 'Open cart'}
      className="relative inline-flex h-10 w-10 items-center justify-center text-ink transition hover:opacity-70"
      onClick={() => { setDrawerTab('cart'); setOpen(true); }}
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12H7L6 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8a3 3 0 0 1 6 0" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold leading-none text-background">
        {count > 99 ? '99+' : count}
      </span>
    </button>
  );
}

function SavedBadge() {
  const { wishlistCount, setOpen, setDrawerTab } = useCart();
  return (
    <button
      type="button"
      aria-label={wishlistCount ? `Open saved items, ${wishlistCount}` : 'Open saved items'}
      className="relative inline-flex h-10 w-10 items-center justify-center text-ink transition hover:opacity-70"
      onClick={() => { setDrawerTab('saved'); setOpen(true); }}
    >
      <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" aria-hidden="true">
        <path
          d="M12 21s-6.7-4.35-9.33-8.1C.8 10.2 1.2 6.9 3.7 5.2c2-1.35 4.55-.95 6.05.85L12 8.4l2.25-2.35c1.5-1.8 4.05-2.2 6.05-.85 2.5 1.7 2.9 5 1.03 7.7C18.7 16.65 12 21 12 21z"
          fill={wishlistCount ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
      {wishlistCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold leading-none text-background">
          {wishlistCount > 99 ? '99+' : wishlistCount}
        </span>
      ) : null}
    </button>
  );
}


function money(amount: number, currency = 'NGN') {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `₦${n.toFixed(2)}`;
  }
}

export function CartFab() {
  const { count, setOpen, setDrawerTab } = useCart();
  const [pulse, setPulse] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (count > prev.current) {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 520);
      prev.current = count;
      return () => window.clearTimeout(t);
    }
    prev.current = count;
    return undefined;
  }, [count]);

  return (
    <button
      type="button"
      aria-label={count ? `Open cart, ${count} items` : 'Open cart'}
      onClick={() => { setDrawerTab('cart'); setOpen(true); }}
      className={`dwene-cart-fab fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink text-background shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${pulse ? 'scale-110' : ''}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12H7L6 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8a3 3 0 0 1 6 0" />
      </svg>
      <span className={`absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[10px] font-bold leading-none text-ink ring-1 ring-black/10 transition ${pulse ? 'scale-125' : ''}`}>
        {count > 99 ? '99+' : count}
      </span>
    </button>
  );
}

export function CartDrawer() {
  const {
    open, setOpen, items, total, currency, count, removeItem, updateQty, clearCart,
    drawerTab, setDrawerTab, wishlist, wishlistCount, removeWishlist, addItem,
  } = useCart();
  const panelRef = useRef<HTMLElement | null>(null);
  const [movingId, setMovingId] = useState('');
  const pd = ((INTENT as any).productDesign && typeof (INTENT as any).productDesign === 'object')
    ? ((INTENT as any).productDesign as Record<string, string>)
    : {};
  const cartChrome = String(pd.cart_chrome || 'drawer');
  const panelWidth = cartChrome === 'mini' ? 'w-[min(100%,18rem)]' : 'w-[min(100%,26rem)]';

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => {
      const closeBtn = panelRef.current?.querySelector<HTMLElement>('[data-cart-close]');
      closeBtn?.focus();
    }, 40);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  function keepBrowsing() {
    setOpen(false);
    window.setTimeout(() => {
      const target =
        document.getElementById('catalog')
        || document.getElementById('shop')
        || document.querySelector('[id*="catalog"], [id*="shop"], [id*="product"]');
      if (target && 'scrollIntoView' in target) {
        (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }

  async function moveSavedToCart(item: { id: string; name: string; price: number; img?: string }) {
    setMovingId(item.id);
    try {
      await addItem({ id: item.id, name: item.name, price: item.price, qty: 1, img: item.img || '' });
      removeWishlist(item.id);
      setDrawerTab('cart');
    } finally {
      setMovingId('');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={drawerTab === 'saved' ? 'Saved items' : 'Shopping cart'}>
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-ink/40"
        onClick={() => setOpen(false)}
      />
      <aside
        ref={panelRef as any}
        className={`absolute right-0 top-0 flex h-full ${panelWidth} animate-[dweneCartIn_280ms_ease-out] flex-col overflow-hidden border-l border-black/10 bg-background text-ink shadow-[-18px_0_50px_rgba(0,0,0,0.18)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes dweneCartIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <header className="relative flex items-center justify-center border-b border-black/10 px-5 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-ink">
            {drawerTab === 'saved' ? 'Saved' : 'Cart'}
          </h2>
          <button
            type="button"
            data-cart-close
            aria-label="Close cart"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center text-xl text-ink transition hover:opacity-60"
          >
            ×
          </button>
        </header>

        <div className="flex justify-center gap-6 border-b border-black/10 px-5" role="tablist" aria-label="Bag panels">
          <button
            type="button"
            role="tab"
            aria-selected={drawerTab === 'cart'}
            onClick={() => setDrawerTab('cart')}
            className={`border-b-2 px-1 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${drawerTab === 'cart' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            Cart ({count})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={drawerTab === 'saved'}
            onClick={() => setDrawerTab('saved')}
            className={`border-b-2 px-1 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${drawerTab === 'saved' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            Saved ({wishlistCount})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {drawerTab === 'saved' ? (
            wishlist.length === 0 ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center px-4 text-center">
                <div className="relative mb-5 text-ink" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12H7L6 8z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8a3 3 0 0 1 6 0" />
                  </svg>
                  <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-background">×</span>
                </div>
                <p className="text-sm text-ink">Nothing saved yet.</p>
                <button
                  type="button"
                  onClick={keepBrowsing}
                  className="mt-6 w-full max-w-xs bg-ink px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-background transition hover:opacity-90"
                >
                  Start shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-5">
                {wishlist.map((item) => (
                  <li key={item.id} className="flex gap-4 border-b border-black/5 pb-5">
                    <div className="h-24 w-20 shrink-0 overflow-hidden bg-neutral-100">
                      {item.img ? (
                        <img src={item.img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold uppercase tracking-wide text-ink">{item.name}</p>
                          <p className="mt-1 text-sm tabular-nums text-ink">{money(item.price, currency)}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name} from saved`}
                          onClick={() => removeWishlist(item.id)}
                          className="text-ink/50 transition hover:text-ink"
                        >
                          ×
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={movingId === item.id}
                          onClick={() => void moveSavedToCart(item)}
                          className="bg-ink px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-background disabled:opacity-60"
                        >
                          {movingId === item.id ? 'Adding…' : 'Add to bag'}
                        </button>
                        <Link
                          to={`/product/${item.id}`}
                          onClick={() => setOpen(false)}
                          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : items.length === 0 ? (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center px-4 text-center">
              <div className="relative mb-5 text-ink" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12H7L6 8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8a3 3 0 0 1 6 0" />
                </svg>
                <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-background">×</span>
              </div>
              <p className="text-sm text-ink">Your cart is currently empty.</p>
              <button
                type="button"
                onClick={keepBrowsing}
                className="mt-6 w-full max-w-xs bg-ink px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-background transition hover:opacity-90"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item, idx) => {
                const qty = Number(item.qty ?? item.quantity ?? 1) || 1;
                const price = Number(item.price) || 0;
                const img = item.img || item.image || '';
                const id = String(item.id || '');
                return (
                  <li key={id || idx} className="flex gap-4 border-b border-black/5 pb-5">
                    <div className="h-24 w-20 shrink-0 overflow-hidden bg-neutral-100">
                      {img ? (
                        <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold uppercase tracking-wide text-ink">{item.name || 'Item'}</p>
                          <p className="mt-1 text-sm tabular-nums text-ink">{money(price, currency)}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name || 'item'}`}
                          onClick={() => { if (id) void removeItem(id); }}
                          className="text-ink/50 transition hover:text-ink"
                        >
                          ×
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center border border-black/15">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={!id}
                            onClick={() => { if (id) void updateQty(id, qty - 1); }}
                            className="inline-flex h-8 w-8 items-center justify-center text-ink disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={!id}
                            onClick={() => { if (id) void updateQty(id, qty + 1); }}
                            className="inline-flex h-8 w-8 items-center justify-center text-ink disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-ink">
                          {money(price * qty, currency)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {drawerTab === 'cart' && items.length ? (
          <footer className="shrink-0 border-t border-black/10 bg-background px-5 py-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Subtotal</p>
              <p className="text-base font-semibold tabular-nums text-ink">{money(total, currency)}</p>
            </div>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center bg-ink px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-background transition hover:opacity-90"
            >
              Checkout
            </Link>
            <button
              type="button"
              onClick={() => void clearCart()}
              className="mt-3 w-full py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted transition hover:text-ink"
            >
              Clear cart
            </button>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function AuthSlot() {
  const { user, logout } = useAuth();
  if (user) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="hidden max-w-[10rem] truncate text-xs text-muted sm:inline" title={user.email || user.name || ''}>
          {user.name || user.email || 'Signed in'}
        </span>
        <button type="button" className="px-2 py-1.5 text-sm font-medium text-ink/80 hover:text-primary" onClick={() => void logout()}>
          Sign out
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Link to="/login" className="px-2 py-1.5 text-sm font-semibold text-primary">Login</Link>
      <Link to="/register" className="px-2 py-1.5 text-sm font-medium text-ink/80 hover:text-primary">Register</Link>
    </span>
  );
}

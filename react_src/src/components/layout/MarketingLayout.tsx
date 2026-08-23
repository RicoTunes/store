import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar, CartFab, CartDrawer, type NavItem } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition, ScrollProgress } from '@/motion/primitives';
import { SmartNavLink } from '@/components/layout/Navbar';
import { INTENT } from '@/config/site';

function withoutAuthNavItems(items: NavItem[]): NavItem[] {
  const blocked = new Set(['login', 'register', 'sign in', 'sign up', 'log in']);
  return (items || []).filter((item) => !blocked.has(String(item.label || '').trim().toLowerCase()));
}

export function MarketingLayout({
  brand,
  navItems,
  navVariant = 'top',
  footerVariant = "multi-column",
  mobileNavPattern = "drawer",
}: {
  brand: string;
  navItems: NavItem[];
  navVariant?: string;
  footerVariant?: string;
  mobileNavPattern?: string;
}) {
  const location = useLocation();
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.search]);
  const pd = ((INTENT as any).productDesign && typeof (INTENT as any).productDesign === 'object')
    ? ((INTENT as any).productDesign as Record<string, string>)
    : {};
  const pdNav = String(pd.nav_style || '');
  const pdShell = String(pd.shell || '');
  const forceSidebar =
    !((INTENT as any).chat && !(INTENT as any).social) && (
    pdNav === 'sidebar' ||
    pdNav === 'hybrid' ||
    pdShell === 'sidebar-app' ||
    pdShell === 'dense-workspace' ||
    pdShell === 'split-console' ||
    pdShell === 'focus-canvas' ||
    pdShell === 'trust-dashboard' ||
    pdShell === 'defi-console' ||
    pdShell === 'panel-dashboard'
    );
  // Messenger / AI product design owns its own rail — never duplicate as MarketingLayout sidebar.
  const messengerShell = (
    pdShell === 'rail-list-chat' ||
    pdShell === 'list-chat' ||
    pdShell === 'rail-chat' ||
    pdShell === 'topnav-list-chat' ||
    pdShell === 'compact-dual' ||
    pdShell === 'focus-chat' ||
    pdShell === 'history-chat' ||
    pdShell === 'rail-history-chat' ||
    pdShell === 'focus-composer' ||
    pdShell === 'split-tools' ||
    pdShell === 'minimal-center' ||
    pdShell === 'topnav-history-chat' ||
    pdNav === 'icon-rail' ||
    Boolean((INTENT as any).productDesignFamily === 'messenger') ||
    Boolean((INTENT as any).productDesignFamily === 'ai_assistant') ||
    Boolean((INTENT as any).productDesignFamily === 'ai_agent_platform') ||
    Boolean((INTENT as any).productDesignFamily === 'multi_agent') ||
    Boolean((INTENT as any).ai_messenger)
  );
  const sidebar = (navVariant === 'sidebar' || forceSidebar) && !messengerShell && !((INTENT as any).chat && !(INTENT as any).social);
  const sideItems = withoutAuthNavItems(navItems);
  const bottomPad = mobileNavPattern === 'bottom' ? ' pb-20 lg:pb-0' : '';
  const routeKey = `${location.pathname}${location.search}${location.hash}`;
  const designMods = [
    pd.shell ? `pd-shell--${pd.shell}` : '',
    pd.topbar ? `pd-topbar--${pd.topbar}` : '',
    pd.nav_style ? `pd-nav--${pd.nav_style}` : '',
    pd.hero ? `pd-hero--${pd.hero}` : '',
    pd.surface ? `pd-surface--${pd.surface}` : '',
    pd.density ? `pd-density--${pd.density}` : '',
    pd.motion ? `pd-motion--${pd.motion}` : '',
    pd.product_grid ? `pd-product-grid-root--${pd.product_grid}` : '',
    pd.pdp ? `pd-pdp--${pd.pdp}` : '',
    pd.cart_chrome ? `pd-cart--${pd.cart_chrome}` : '',
    pd.menu_layout ? `pd-menu--${pd.menu_layout}` : '',
    pd.booking_chrome ? `pd-booking--${pd.booking_chrome}` : '',
    pd.dashboard ? `pd-dashboard--${pd.dashboard}` : '',
    pd.sidebar ? `pd-sidebar--${pd.sidebar}` : '',
    pd.trust_chrome ? `pd-trust--${pd.trust_chrome}` : '',
    pd.market_layout ? `pd-market--${pd.market_layout}` : '',
    pd.wallet_chrome ? `pd-wallet--${pd.wallet_chrome}` : '',
    pd.article ? `pd-article--${pd.article}` : '',
    pd.typography ? `pd-typography--${pd.typography}` : '',
    pd.panel ? `pd-panel--${pd.panel}` : '',
    pd.map_chrome ? `pd-map--${pd.map_chrome}` : '',
    (INTENT as any).productDesignFamily ? `pd-family--${(INTENT as any).productDesignFamily}` : '',
    (INTENT as any).productDesignSkin ? `pd-skin--${(INTENT as any).productDesignSkin}` : '',
  ].filter(Boolean).join(' ');
  const cartChrome = String(pd.cart_chrome || 'drawer');
  return (
    <div className={`flex min-h-screen bg-background text-ink ${designMods} ${sidebar ? 'lg:flex-row' : 'flex-col'}${bottomPad}`}>
      <ScrollProgress />
      {sidebar ? (
        <aside className="dwene-sidebar sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/5 bg-surface/90 p-5 lg:flex">
          <p className="font-display text-xl font-bold text-nav">{brand}</p>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Sidebar">
            {sideItems.flatMap((item) => (
              item.children?.length
                ? item.children.map((child) => (
                    <SmartNavLink key={child.to + child.label} to={child.to} className="rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-primary/10 hover:text-primary">
                      {child.label}
                    </SmartNavLink>
                  ))
                : [
                    <SmartNavLink key={item.to + item.label} to={item.to} className="rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-primary/10 hover:text-primary">
                      {item.label}
                    </SmartNavLink>,
                  ]
            ))}
          </nav>
        </aside>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar brand={brand} navItems={navItems} variant={sidebar ? 'sidebar' : navVariant} mobileNavPattern={mobileNavPattern} />
        <div className="flex-1">
          <PageTransition routeKey={routeKey}>
            <Outlet />
          </PageTransition>
        </div>
        {(INTENT as any).social ? null : <Footer brand={brand} footerVariant={footerVariant} />}
      </div>
      {INTENT.cart && cartChrome !== 'page' ? <CartFab /> : null}
      {INTENT.cart && (cartChrome === 'drawer' || cartChrome === 'mini' || cartChrome === 'sticky-bar') ? <CartDrawer /> : null}
    </div>
  );
}

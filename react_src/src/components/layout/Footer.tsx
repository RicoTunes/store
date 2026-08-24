import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';

const FOOTER_VARIANT = "True";

function FooterWatermark({ brand, year }: { brand: string; year: number }) {
  return (
    <Container className="mt-10 flex flex-col gap-3 border-t border-black/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p>© {year} {brand}. All rights reserved.</p>
      <a
        href="https://dwene.com"
        target="_blank"
        rel="noopener noreferrer"
        className="dwene-made-with inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted hover:text-primary"
        data-dwene-watermark="1"
      >
        Made with <span className="font-semibold text-ink">Dwene</span>
      </a>
    </Container>
  );
}

export function Footer({ brand, footerVariant = FOOTER_VARIANT }: { brand: string; footerVariant?: string }) {
  const year = new Date().getFullYear();
  const variant = footerVariant || FOOTER_VARIANT;

  if (variant === 'minimal') {
    return (
      <footer className="mt-auto border-t border-black/5 py-6 text-sm text-muted">
        <Container className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {brand}</p>
          <a href="https://dwene.com" target="_blank" rel="noopener noreferrer" className="dwene-made-with text-xs hover:text-primary" data-dwene-watermark="1">
            Made with <span className="font-semibold text-ink">Dwene</span>
          </a>
        </Container>
      </footer>
    );
  }

  if (variant === 'compact') {
    return (
      <footer className="mt-auto border-t border-black/5 bg-surface/40 py-6 text-sm text-muted">
        <Container className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-semibold text-nav">{brand}</p>
          <nav className="flex flex-wrap gap-4 text-xs">
            <Link className="hover:text-primary" to="/">Home</Link>
            <Link className="hover:text-primary" to="/about">About</Link>
            <Link className="hover:text-primary" to="/contact">Contact</Link>
          </nav>
          <p className="text-xs">© {year}</p>
        </Container>
      </footer>
    );
  }

  if (variant === 'editorial' || variant === 'brand-story') {
    return (
      <footer className="mt-auto border-t border-black/5 bg-surface/50 py-16 text-sm text-muted">
        <Container>
          <p className="font-display text-3xl font-bold tracking-tight text-nav sm:text-4xl">{brand}</p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed">
            {variant === 'brand-story'
              ? 'Every detail reflects our story — crafted with care, shared with intention, and built to welcome you back.'
              : 'Editorial clarity meets warm hospitality — explore what we offer and find your next favorite moment.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <Link className="hover:text-primary" to="/about">Our story</Link>
            <Link className="hover:text-primary" to="/services">Services</Link>
            <Link className="hover:text-primary" to="/contact">Contact</Link>
          </div>
        </Container>
        <FooterWatermark brand={brand} year={year} />
      </footer>
    );
  }

  if (variant === 'cta') {
    return (
      <footer className="mt-auto border-t border-black/5">
        <div className="bg-primary/10 py-12">
          <Container className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl font-bold text-nav">Ready to get started?</p>
              <p className="mt-1 text-muted">Join {brand} today — no friction, no guesswork.</p>
            </div>
            <Link to="/contact" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[color:var(--color-on-primary,#fff)] hover:brightness-110">
              Get in touch
            </Link>
          </Container>
        </div>
        <div className="bg-surface/50 py-8 text-sm text-muted">
          <Container className="flex flex-wrap gap-4">
            <Link className="hover:text-primary" to="/">Home</Link>
            <Link className="hover:text-primary" to="/about">About</Link>
            <Link className="hover:text-primary" to="/contact">Contact</Link>
          </Container>
          <FooterWatermark brand={brand} year={year} />
        </div>
      </footer>
    );
  }

  if (variant === 'mega') {
    return (
      <footer className="mt-auto border-t border-black/5 bg-surface/50 py-14 text-sm text-muted">
        <Container className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="font-display text-xl font-bold text-nav">{brand}</p>
            <p className="mt-3 max-w-sm leading-relaxed">Discover products, services, and stories — all in one place.</p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink">Shop</p>
            <ul className="space-y-2">
              <li><Link className="hover:text-primary" to="/">Home</Link></li>
              <li><Link className="hover:text-primary" to="/services">Catalog</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink">Company</p>
            <ul className="space-y-2">
              <li><Link className="hover:text-primary" to="/about">About</Link></li>
              <li><Link className="hover:text-primary" to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink">Support</p>
            <ul className="space-y-2">
              <li><Link className="hover:text-primary" to="/contact">Help</Link></li>
            </ul>
          </div>
        </Container>
        <FooterWatermark brand={brand} year={year} />
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-black/5 bg-surface/50 py-12 text-sm text-muted">
      <Container className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-display text-lg font-bold text-nav">{brand}</p>
          <p className="mt-2 max-w-sm leading-relaxed">
            Built for clarity and care — explore services, learn our story, or reach out anytime.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink">Explore</p>
          <ul className="space-y-2">
            <li><Link className="hover:text-primary" to="/">Home</Link></li>
            <li><Link className="hover:text-primary" to="/about">About</Link></li>
            <li><Link className="hover:text-primary" to="/services">Services</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink">Connect</p>
          <ul className="space-y-2">
            <li><Link className="hover:text-primary" to="/contact">Contact</Link></li>
          </ul>
        </div>
      </Container>
      <FooterWatermark brand={brand} year={year} />
    </footer>
  );
}

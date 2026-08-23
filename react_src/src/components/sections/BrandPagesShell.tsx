import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { pagesApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

export function BrandPagesShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const { pageId } = useParams();
  const { user } = useAuth();
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const pagesLayout = String(design.pages_layout || 'pages-list');
  const [pages, setPages] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadList() {
    try {
      const data = await pagesApi.list();
      setPages(data?.pages || data?.items || []);
    } catch {
      setPages([]);
    }
  }

  async function loadPage(pid: string) {
    try {
      const data = await pagesApi.get(pid);
      setActive(data?.page || data || null);
    } catch {
      setStatus('Could not load page.');
      setActive(null);
    }
  }

  useEffect(() => {
    if (pageId) void loadPage(pageId);
    else void loadList();
  }, [pageId, user?.id]);

  async function createPage(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      const data = await pagesApi.create({
        name: name.trim(),
        description,
        category: category.trim() || undefined,
      });
      setName('');
      setDescription('');
      setCategory('');
      const pid = data?.page?.id || data?.id;
      if (pid) window.location.hash = `#/pages/${pid}`;
      else await loadList();
    } catch (err: any) {
      setStatus(err?.message || 'Could not create page.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleFollow() {
    if (!active?.id) return;
    const wasFollowing = Boolean(active.is_following || active.following);
    setActive((prev: any) =>
      prev
        ? {
            ...prev,
            is_following: !wasFollowing,
            following: !wasFollowing,
            follower_count: Math.max(
              0,
              Number(prev.follower_count || 0) + (wasFollowing ? -1 : 1),
            ),
          }
        : prev,
    );
    setStatus('');
    try {
      if (wasFollowing) await pagesApi.unfollow(active.id);
      else await pagesApi.follow(active.id);
    } catch (err: any) {
      setActive((prev: any) =>
        prev
          ? {
              ...prev,
              is_following: wasFollowing,
              following: wasFollowing,
              follower_count: Math.max(
                0,
                Number(prev.follower_count || 0) + (wasFollowing ? 1 : -1),
              ),
            }
          : prev,
      );
      setStatus(err?.message || 'Follow action failed.');
    }
  }

  if (!user) {
    return (
      <section id={id} className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Sign in to see pages
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Brand pages and follows are only available after you log in.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#fff)] hover:opacity-90"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-md border border-black/10 bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-black/5"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (pageId && active) {
    const following = Boolean(active.is_following || active.following);
    return (
      <section id={id} className="bg-background">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-4 lg:grid-cols-[minmax(0,1fr)] lg:items-start">
          <aside className="hidden">
            <nav className="rounded-[var(--radius-md)] bg-surface p-3 ring-1 ring-black/5">
              <ul className="space-y-1 text-sm font-semibold text-ink">
                <li>
                  <Link to="/" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                    Feed
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/friends" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                    Friends
                  </Link>
                </li>
                <li>
                  <Link to="/groups" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                    Groups
                  </Link>
                </li>
                <li>
                  <Link to="/messages" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                    Messages
                  </Link>
                </li>
                <li>
                  <Link to="/pages" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                    Pages
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>
          <div className="order-1 min-w-0 lg:order-2">
          <Link to="/pages" className="text-sm font-semibold text-primary hover:underline">
            ← All pages
          </Link>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] ring-1 ring-black/5">
            <div className="h-28 bg-gradient-to-br from-primary/20 to-black/10 md:h-36" />
            <div className="bg-surface px-5 py-5 md:px-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">{active.name}</h1>
                  <p className="mt-1 text-sm text-muted">{active.description || body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {active.category ? `${active.category} · ` : ''}
                    {active.follower_count || 0} followers
                  </p>
                </div>
                {user ? (
                  <Button type="button" onClick={() => void toggleFollow()}>
                    {following ? 'Following' : 'Follow'}
                  </Button>
                ) : null}
              </div>
              {status ? <p className="mt-3 text-sm text-primary">{status}</p> : null}
            </div>
          </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-4 lg:grid-cols-[minmax(0,1fr)] lg:items-start">
        <aside className="hidden">
          <nav className="rounded-[var(--radius-md)] bg-surface p-3 ring-1 ring-black/5">
            <ul className="space-y-1 text-sm font-semibold text-ink">
              <li>
                <Link to="/" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                  Feed
                </Link>
              </li>
              <li>
                <Link to="/profile" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/friends" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                  Friends
                </Link>
              </li>
              <li>
                <Link to="/groups" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                  Groups
                </Link>
              </li>
              <li>
                <Link to="/messages" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/pages" className="block rounded-md px-2 py-1.5 hover:bg-black/5">
                  Pages
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        <div className="order-1 min-w-0 lg:order-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{body}</p>
        {status ? <p className="mt-3 text-sm text-primary">{status}</p> : null}

        <form onSubmit={(e) => void createPage(e)} className="mt-8 max-w-xl space-y-3 rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-black/5">
          <p className="text-sm font-semibold text-ink">Create a page</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Page name"
            className="w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="About this page"
            className="w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            className="w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="submit" disabled={busy || !name.trim()}>
            Create
          </Button>
        </form>

        {pagesLayout === 'pages-featured' && pages[0] ? (
          <Link to={`/pages/${pages[0].id}`} className="mt-6 block overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-surface p-6 ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Featured</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-ink">{pages[0].name}</h3>
            <p className="mt-2 text-sm text-muted">{pages[0].description || 'Brand page'}</p>
          </Link>
        ) : null}
        <ul
          className={
            pagesLayout === 'pages-grid'
              ? 'mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
              : 'mt-8 space-y-3'
          }
        >
          {(pagesLayout === 'pages-featured' ? pages.slice(1) : pages).map((p) => (
            <li
              key={p.id}
              className={
                pagesLayout === 'pages-grid'
                  ? 'flex flex-col gap-2 rounded-2xl bg-surface p-4 ring-1 ring-black/5'
                  : 'flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-4 py-4 ring-1 ring-black/5'
              }
            >
              <div>
                <Link to={`/pages/${p.id}`} className="font-semibold text-ink hover:underline">
                  {p.name}
                </Link>
                <p className="mt-1 text-sm text-muted">{p.description || 'Brand page'}</p>
                <p className="mt-1 text-xs text-muted">
                  {p.category ? `${p.category} · ` : ''}
                  {p.follower_count || 0} followers
                  {p.is_following || p.following ? ' · following' : ''}
                </p>
              </div>
              <Link to={`/pages/${p.id}`} className="text-sm font-semibold text-primary hover:underline">
                Open
              </Link>
            </li>
          ))}
          {!pages.length ? <li className="text-sm text-muted">No pages yet — create the first one.</li> : null}
        </ul>
        </div>
      </div>
    </section>
  );
}

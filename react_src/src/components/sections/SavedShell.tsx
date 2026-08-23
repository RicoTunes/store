import { useEffect, useState } from 'react';
import { bookmarksApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

export function SavedShell({ id, title, body }: { id?: string; title: string; body: string }) {
  const { user } = useAuth() as any;
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const savedLayout = String(design.saved_layout || 'saved-list');
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.id) return;
            void bookmarksApi.list('feed').then((d) => setPosts(d?.posts || d?.bookmarks || [])).catch(() => setPosts([]));
  }, [user?.id]);
  if (!user?.id) {
    return <section id={id} className="px-4 py-16 text-center"><p className="text-muted">Sign in to see saved posts.</p></section>;
  }
  return (
    <section id={id} className={`mx-auto max-w-2xl px-4 py-6 social-saved--${savedLayout}`}>
      <h1 className="font-display text-2xl font-semibold">{title || 'Saved'}</h1>
      <p className="mt-1 text-sm text-muted">{body}</p>
      <ul className={savedLayout === 'saved-grid' ? 'mt-4 grid gap-3 sm:grid-cols-2' : savedLayout === 'saved-compact' ? 'mt-4 space-y-1' : 'mt-4 space-y-3'}>
        {posts.map((p) => (
          <li key={p.id} className={savedLayout === 'saved-compact' ? 'rounded-lg bg-surface px-3 py-2 ring-1 ring-black/5' : 'rounded-2xl bg-surface p-4 ring-1 ring-black/5'}>
            <p className="font-semibold">{p.author}</p>
            {p.text ? <p className="mt-2 text-sm">{p.text}</p> : null}
            {p.video_url ? <video src={p.video_url} controls className="mt-2 max-h-64 w-full rounded-md bg-black" /> : null}
            {p.image_url ? <img src={p.image_url} alt="" className="mt-2 max-h-64 w-full rounded-md object-cover" /> : null}
            <button type="button" className="mt-2 text-xs font-semibold text-primary" onClick={async () => {
              await bookmarksApi.toggle('feed', p.id);
              setPosts((prev) => prev.filter((x) => x.id !== p.id));
            }}>Remove</button>
          </li>
        ))}
        {!posts.length ? <li className="text-sm text-muted">Nothing saved yet — bookmark posts from the feed.</li> : null}
      </ul>
    </section>
  );
}

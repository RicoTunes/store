import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { exploreApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

export function ExploreShell({ id, title, body }: { id?: string; title: string; body: string }) {
  const { user } = useAuth() as any;
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const exploreLayout = String(design.explore_layout || 'explore-masonry');
  const [params] = useSearchParams();
  const tag = String(params.get('tag') || '');
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  useEffect(() => {
    if (tag) {
      void exploreApi.hashtag(tag).then((d) => setPosts(d?.posts || [])).catch(() => setPosts([]));
      return;
    }
    void exploreApi.get().then((d) => {
      setHashtags(d?.hashtags || []);
      setPosts(d?.posts || []);
      setReels(d?.reels || []);
    }).catch(() => undefined);
  }, [tag, user?.id]);
  return (
    <section id={id} className={`mx-auto max-w-5xl px-4 py-6 social-explore--${exploreLayout}`}>
      <h1 className="font-display text-2xl font-semibold">{title || 'Explore'}</h1>
      <p className="mt-1 text-sm text-muted">{body}</p>
      {tag ? <p className="mt-3 text-sm font-semibold">#{tag} <Link to="/explore" className="text-primary">Clear</Link></p> : null}
      {!tag ? (
        <ul className={exploreLayout === 'explore-topics' ? 'mt-4 space-y-2' : 'mt-4 flex flex-wrap gap-2'}>
          {hashtags.map((h) => (
            <li key={h.tag}>
              <Link
                to={`/explore?tag=${encodeURIComponent(h.tag)}`}
                className={
                  exploreLayout === 'explore-topics'
                    ? 'block rounded-xl bg-surface px-4 py-3 text-sm font-semibold ring-1 ring-black/5'
                    : 'rounded-full bg-surface px-3 py-1 text-sm font-semibold ring-1 ring-black/5'
                }
              >
                #{h.tag} · {h.count}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {reels.length ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Videos</h2>
            <Link to="/reels" className="text-xs font-semibold text-primary">Open Reels</Link>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
            {reels.slice(0, 8).map((p) => (
              <Link key={p.id} to="/reels" className="overflow-hidden rounded-xl bg-black">
                <video src={p.video_url} muted className="h-40 w-full object-cover" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <ul
        className={
          exploreLayout === 'explore-masonry'
            ? 'mt-6 columns-1 gap-3 sm:columns-2 lg:columns-3'
            : exploreLayout === 'explore-list'
              ? 'mt-6 space-y-2'
              : 'mt-6 space-y-3'
        }
      >
        {posts.map((p) => (
          <li
            key={p.id}
            className={
              exploreLayout === 'explore-masonry'
                ? 'mb-3 break-inside-avoid rounded-2xl bg-surface p-4 ring-1 ring-black/5'
                : 'rounded-2xl bg-surface p-4 ring-1 ring-black/5'
            }
          >
            <p className="font-semibold">{p.author}</p>
            {p.text ? <p className="mt-2 text-sm">{p.text}</p> : null}
            {p.video_url ? <video src={p.video_url} controls className="mt-2 max-h-72 w-full rounded-md bg-black" /> : null}
            {p.image_url ? <img src={p.image_url} alt="" className="mt-2 max-h-72 w-full rounded-md object-cover" /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

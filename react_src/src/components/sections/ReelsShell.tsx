import { useEffect, useState } from 'react';
import { feedApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

export function ReelsShell({ id, title }: { id?: string; title: string; body?: string }) {
  const { user } = useAuth() as any;
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const reelsLayout = String(design.reels_layout || 'reels-full');
  const [posts, setPosts] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    void feedApi.list({ kind: 'video', sort: 'ranked', limit: 24 }).then((d) => setPosts(d?.posts || [])).catch(() => setPosts([]));
  }, [user?.id]);
  const cur = posts[idx];
  if (reelsLayout === 'reels-grid') {
    return (
      <section id={id} className="mx-auto max-w-5xl px-4 py-6 social-reels--reels-grid">
        <h1 className="font-display text-2xl font-semibold text-ink">{title || 'Reels'}</h1>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
          {posts.map((p, i) => (
            <button key={p.id} type="button" className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black" onClick={() => setIdx(i)}>
              {p.video_url ? <video src={p.video_url} muted className="h-full w-full object-cover" /> : null}
              <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-left text-xs text-white">{p.text}</span>
            </button>
          ))}
          {!posts.length ? <p className="col-span-full text-sm text-muted">No videos yet.</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section id={id} className={`flex min-h-[calc(100vh-4rem)] items-center justify-center bg-black social-reels--${reelsLayout}`}>
      {!cur ? (
        <p className="text-sm text-white/70">{title || 'Reels'} — no videos yet. Post a video from Home.</p>
      ) : (
        <div className={`relative w-full ${reelsLayout === 'reels-peek' ? 'h-[70vh] max-w-md' : 'h-[90vh] max-w-sm'}`}>
          <video key={cur.id} src={cur.video_url} autoPlay controls className="h-full w-full object-contain" />
          <p className="absolute bottom-16 left-3 right-3 text-sm text-white">{cur.text}</p>
          <button type="button" className="absolute inset-y-0 left-0 w-1/3" aria-label="Previous" onClick={() => setIdx((i) => Math.max(0, i - 1))} />
          <button type="button" className="absolute inset-y-0 right-0 w-1/3" aria-label="Next" onClick={() => setIdx((i) => Math.min(posts.length - 1, i + 1))} />
        </div>
      )}
    </section>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { bookmarksApi, mediaApi, postsApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';

type Post = { slug: string; title: string; excerpt: string; date: string; body?: string };

const SEED_POSTS: Post[] = [
  {
    slug: 'building-in-public',
    title: 'Building in public without the noise',
    excerpt: 'A calm weekly cadence for shipping, listening, and iterating with your readers.',
    date: '2026-03-12',
    body: 'Building in public works best when the cadence is calm. Share what shipped, what you learned, and what you are trying next — without turning every update into a performance.',
  },
  {
    slug: 'design-systems-that-breathe',
    title: 'Design systems that breathe',
    excerpt: 'Tokens, motion, and content rules that keep a blog feeling human at scale.',
    date: '2026-02-28',
    body: 'A design system should leave room for editorial voice. Tokens set rhythm; content rules keep pages readable; motion should guide attention, not decorate every block.',
  },
  {
    slug: 'editorial-voice',
    title: 'Finding an editorial voice',
    excerpt: 'How to sound like your brand without sounding like a press release.',
    date: '2026-02-10',
    body: 'Voice is consistency under pressure. Write like a person who cares about the reader, then edit for clarity. Avoid slogans that could belong to any brand.',
  },
];

function normalizePost(raw: any, idx: number): Post {
  return {
    slug: String(raw?.slug || raw?.id || `post-${idx + 1}`),
    title: String(raw?.title || 'Untitled'),
    excerpt: String(raw?.excerpt || raw?.summary || raw?.body || ''),
    date: String(raw?.date || raw?.published_at || raw?.created_at || ''),
    body: raw?.body != null ? String(raw.body) : undefined,
  };
}

function RelatedCards({ items }: { items: Post[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-14 border-t border-black/5 pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Related articles</p>
      <h3 className="mt-2 font-display text-2xl font-semibold text-ink">Keep reading</h3>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {items.map((post) => (
          <article
            key={post.slug}
            className="flex flex-col rounded-[var(--radius-md)] bg-surface p-5 ring-1 ring-black/5 transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{post.date}</p>
            <h4 className="mt-2 font-display text-lg font-semibold text-ink">
              <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                {post.title}
              </Link>
            </h4>
            <p className="mt-2 flex-1 text-sm text-muted line-clamp-3">{post.excerpt}</p>
            <Link to={`/blog/${post.slug}`} className="mt-4 text-sm font-semibold text-primary hover:underline">
              Read article →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

type BlogComment = { id: string; author: string; text: string; imageUrl?: string; audioUrl?: string };

function BlogArticle({
  id,
  seedRelated,
}: {
  id?: string;
  seedRelated: Post[];
}) {
  const { slug } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>(seedRelated);
  const [status, setStatus] = useState('Loading…');
  const [likes, setLikes] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [commentAudio, setCommentAudio] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      setStatus('Loading…');
      try {
        const data = await postsApi.get(slug, 3);
        if (cancelled) return;
        if (data?.post) {
          setPost(normalizePost(data.post, 0));
          setLikes(Number(data.post.likes || 0));
          const rel = Array.isArray(data?.related) ? data.related.map(normalizePost) : [];
          setRelated(rel.length ? rel : seedRelated.filter((p) => p.slug !== slug).slice(0, 3));
          setStatus('');
        } else {
          const seed = SEED_POSTS.find((p) => p.slug === slug) || null;
          setPost(seed);
          setRelated(seedRelated.filter((p) => p.slug !== slug).slice(0, 3));
          setStatus(seed ? '' : 'Article not found.');
        }
      } catch {
        if (cancelled) return;
        const seed = SEED_POSTS.find((p) => p.slug === slug) || null;
        setPost(seed);
        setRelated(seedRelated.filter((p) => p.slug !== slug).slice(0, 3));
        setStatus(seed ? '' : 'Article not found.');
      }
      if (slug) {
        try {
          const c = await postsApi.comments(slug);
          if (!cancelled) {
            setComments(
              (c?.comments || []).map((x: any, i: number) => ({
                id: String(x.id || i),
                author: String(x.author || 'Reader'),
                text: String(x.text || ''),
                imageUrl: x.image_url ? String(x.image_url) : undefined,
                audioUrl: x.audio_url ? String(x.audio_url) : undefined,
              })),
            );
          }
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function onLike() {
    if (!slug) return;
    setLikes((n) => n + 1);
    try {
      const data = await postsApi.like(slug);
      if (typeof data?.likes === 'number') setLikes(data.likes);
    } catch {
      /* optimistic */
    }
  }

  async function onBookmark() {
    if (!slug) return;
    try {
      const data = await bookmarksApi.toggle('blog', slug);
      setBookmarked(Boolean(data?.bookmarked ?? !bookmarked));
    } catch {
      setBookmarked((v) => !v);
    }
  }

  async function uploadCommentMedia(file: File | null, kind: 'image' | 'audio') {
    if (!file) return;
    try {
      const data = await mediaApi.upload(file, kind === 'audio' ? 'audio' : 'blog');
      const url = String(data?.url || '');
      if (!url) return;
      if (kind === 'audio') setCommentAudio(url);
      else setCommentImage(url);
    } catch {
      setStatus('Media upload failed.');
    }
  }

  async function submitComment(e?: FormEvent) {
    e?.preventDefault();
    if (!slug || (!commentDraft.trim() && !commentImage && !commentAudio)) return;
    setBusy(true);
    try {
      const data = await postsApi.comment(slug, commentDraft.trim(), {
        image_url: commentImage,
        audio_url: commentAudio,
      });
      const c = data?.comment;
      if (c) {
        setComments((prev) => [
          ...prev,
          {
            id: String(c.id || Date.now()),
            author: String(c.author || user?.name || 'You'),
            text: String(c.text || commentDraft),
            imageUrl: c.image_url ? String(c.image_url) : commentImage || undefined,
            audioUrl: c.audio_url ? String(c.audio_url) : commentAudio || undefined,
          },
        ]);
      }
      setCommentDraft('');
      setCommentImage('');
      setCommentAudio('');
    } catch {
      setStatus('Could not post comment.');
    } finally {
      setBusy(false);
    }
  }

  if (!post) {
    return (
      <section id={id} className="border-b border-black/5 py-16 md:py-20">
        <Container>
          <p className="text-muted">{status || 'Article not found.'}</p>
          <Link to="/blog" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            ← Back to journal
          </Link>
        </Container>
      </section>
    );
  }

  const paragraphs = String(post.body || post.excerpt || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <Link to="/blog" className="text-sm font-semibold text-primary hover:underline">
          ← Journal
        </Link>
        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">{post.date}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => void onLike()} className="text-sm font-semibold text-primary hover:underline">
            ♥ {likes} Like
          </button>
          <button type="button" onClick={() => void onBookmark()} className="text-sm font-semibold text-primary hover:underline">
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>
        <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-ink">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-10 max-w-3xl border-t border-black/5 pt-8">
          <h3 className="font-display text-xl font-semibold text-ink">Comments</h3>
          <ul className="mt-4 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-[var(--radius-md)] bg-surface p-3 ring-1 ring-black/5">
                <p className="text-sm font-semibold text-ink">{c.author}</p>
                {c.text ? <p className="mt-1 text-sm text-ink">{c.text}</p> : null}
                {c.imageUrl ? <img src={c.imageUrl} alt="" className="mt-2 max-h-48 rounded-md object-cover" /> : null}
                {c.audioUrl ? <audio controls src={c.audioUrl} className="mt-2 w-full max-w-sm" /> : null}
              </li>
            ))}
            {!comments.length ? <li className="text-sm text-muted">No comments yet.</li> : null}
          </ul>
          <form onSubmit={(e) => void submitComment(e)} className="mt-4 space-y-2">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              placeholder={user ? 'Write a comment' : 'Sign in to comment'}
              className="w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                Photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadCommentMedia(e.target.files?.[0] || null, 'image')} />
              </label>
              <label className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                Audio
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => void uploadCommentMedia(e.target.files?.[0] || null, 'audio')} />
              </label>
              {commentImage ? <img src={commentImage} alt="" className="h-10 w-10 rounded object-cover" /> : null}
              {commentAudio ? <span className="text-xs text-muted">Audio attached</span> : null}
              <Button type="submit" disabled={busy || (!commentDraft.trim() && !commentImage && !commentAudio)}>
                Comment
              </Button>
            </div>
          </form>
        </div>

        <RelatedCards items={related} />
      </Container>
    </section>
  );
}

export function BlogFeed({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const { slug } = useParams();
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await postsApi.list({ page, limit: 9 });
        const list = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : [];
        if (!cancelled && list.length) setPosts(list.map(normalizePost));
        if (!cancelled) {
          const total = Number(data?.total || data?.pages || 0);
          if (data?.has_more != null) setHasMore(Boolean(data.has_more));
          else if (total) setHasMore(page * 9 < total);
          else setHasMore(list.length >= 9);
        }
      } catch {
        /* seed fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (slug) {
    return <BlogArticle id={id} seedRelated={posts} />;
  }

  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Journal</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col rounded-[var(--radius-md)] bg-surface p-6 ring-1 ring-black/5 transition hover:-translate-y-0.5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{post.date}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted">{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`} className="mt-4 text-sm font-semibold text-primary hover:underline">
                Read article →
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <p className="text-sm text-muted">Page {page}</p>
          <Button type="button" disabled={!hasMore || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </Container>
    </section>
  );
}

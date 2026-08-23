import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { bookmarksApi, feedApi, groupsApi, mediaApi, messagesApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '😉', '😍', '🥰', '😘', '😜', '🤪', '😎', '🤩', '🥳',
  '😏', '😢', '😭', '😤', '😡', '🤯', '😳', '🤗', '🤔', '🫡',
  '😴', '🥱', '❤️', '🧡', '💛', '💚', '💙', '💜', '💯', '🔥',
  '👏', '🙌', '👍', '👎', '🙏', '🎉', '✨', '⭐', '🌸', '☀️',
];

function EmojiIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <path d="M8.4 14.4c1.1 1.5 2.6 2.2 3.6 2.2s2.5-.7 3.6-2.2" strokeLinecap="round" />
    </svg>
  );
}

function FeedActionIcon({
  name,
  filled,
}: {
  name: 'like' | 'comment' | 'share' | 'bookmark';
  filled?: boolean;
}) {
  const cls = 'h-[18px] w-[18px] shrink-0';
  if (name === 'like') {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
        <path d="M12 20.4S4.6 15.3 3.1 10.9C2.2 8.4 3.6 5.7 6.4 5.3c1.6-.2 3.1.5 4 1.8L12 8.6l1.6-1.5c.9-1.3 2.4-2 4-1.8 2.8.4 4.2 3.1 3.3 5.6C19.4 15.3 12 20.4 12 20.4z" />
      </svg>
    );
  }
  if (name === 'comment') {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
        <path d="M6 5.5h12A2.5 2.5 0 0 1 20.5 8v6.5A2.5 2.5 0 0 1 18 17h-5.2L7 20.5V17H6A2.5 2.5 0 0 1 3.5 14.5V8A2.5 2.5 0 0 1 6 5.5z" />
      </svg>
    );
  }
  if (name === 'share') {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <circle cx="18" cy="5.5" r="2.4" />
        <circle cx="6" cy="12" r="2.4" />
        <circle cx="18" cy="18.5" r="2.4" />
        <path d="M8.2 10.9 15.7 6.7M8.2 13.1l7.5 4.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={cls} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M7 4h10a1.5 1.5 0 0 1 1.5 1.5V20L12 16.2 5.5 20V5.5A1.5 1.5 0 0 1 7 4z" />
    </svg>
  );
}

export function GroupsShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const { groupId } = useParams();
  const { user } = useAuth();
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const groupsLayout = String(design.groups_layout || 'groups-list');
  const [groups, setGroups] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [inviteCode, setInviteCode] = useState('');
  const [createdInvite, setCreatedInvite] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [draft, setDraft] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [lightboxMediaIndex, setLightboxMediaIndex] = useState(0);
  const [postLightbox, setPostLightbox] = useState(false);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentDraft, setCommentDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyToId, setReplyToId] = useState('');
  const [replyToName, setReplyToName] = useState('');

  async function loadList() {
    try {
      const data = await groupsApi.list(q.trim() || undefined);
      setGroups(data?.groups || []);
    } catch {
      setGroups([]);
    }
  }

  async function loadGroup(gid: string) {
    try {
      const data = await groupsApi.get(gid);
      setActive(data?.group || null);
      setPosts(data?.posts || []);
      setMembers(data?.members || []);
      setCreatedInvite('');
    } catch {
      setStatus('Could not load group.');
      setActive(null);
    }
  }

  useEffect(() => {
    if (groupId) void loadGroup(groupId);
    else void loadList();
  }, [groupId, user?.id]);

  async function createGroup(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const data = await groupsApi.create({
        name: name.trim(),
        description,
        privacy,
      });
      setName('');
      setDescription('');
      setPrivacy('public');
      const gid = data?.group?.id;
      if (gid) window.location.hash = `#/groups/${gid}`;
      else await loadList();
    } catch {
      setStatus('Could not create group.');
    } finally {
      setBusy(false);
    }
  }

  async function joinWithInvite(e: FormEvent) {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;
    setBusy(true);
    setStatus('');
    try {
      const data = await groupsApi.joinInvite(code);
      setJoinCode('');
      const gid = data?.group?.id || data?.group_id;
      if (gid) window.location.hash = `#/groups/${gid}`;
      else {
        setStatus(data?.message || 'Joined via invite.');
        await loadList();
      }
    } catch (err: any) {
      setStatus(err?.message || 'Invite code failed.');
    } finally {
      setBusy(false);
    }
  }

  async function createInvite() {
    if (!active?.id) return;
    setBusy(true);
    setStatus('');
    try {
      const data = await groupsApi.createInvite(active.id, { max_uses: 20, expires_hours: 72 });
      const code = String(data?.invite?.code || data?.code || '');
      setCreatedInvite(code);
      setInviteCode(code);
      if (!code) setStatus('Invite created.');
    } catch (err: any) {
      setStatus(err?.message || 'Could not create invite.');
    } finally {
      setBusy(false);
    }
  }

  async function joinOrLeave() {
    if (!active?.id) return;
    try {
      if (active.is_member) {
        await groupsApi.leave(active.id);
        window.location.hash = '#/groups';
      } else {
        const data = await groupsApi.join(active.id);
        setActive(data?.group || active);
        await loadGroup(active.id);
      }
    } catch (err: any) {
      setStatus(err?.message || 'Action failed.');
    }
  }

  async function postToGroup(e: FormEvent) {
    e.preventDefault();
    if (!active?.id || (!draft.trim() && !imageUrls.length && !videoUrl)) return;
    setBusy(true);
    try {
      const data = await feedApi.create({
        text: draft,
        image_url: imageUrls[0] || '',
        image_urls: imageUrls,
        video_url: videoUrl || '',
        group_id: active.id,
      });
      setDraft('');
      setImageUrls([]);
      setVideoUrl('');
      if (data?.post) setPosts((prev) => [data.post, ...prev]);
    } catch {
      setStatus('Could not post.');
    } finally {
      setBusy(false);
    }
  }

  async function onPickImages(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    const next = [...imageUrls];
    try {
      for (const file of list) {
        if (next.length >= 10) break;
        const data = await mediaApi.upload(file, 'group');
        if (data?.url && !next.includes(String(data.url))) next.push(String(data.url));
      }
      setImageUrls(next.slice(0, 10));
    } catch {
      setStatus('Image upload failed.');
    }
  }

  function patchPost(postId: string, patch: Record<string, unknown>) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
  }

  async function onLike(postId: string) {
    try {
      const data = await feedApi.like(postId);
      const post = data?.post;
      if (post) patchPost(postId, { liked: Boolean(post.liked), likes: Number(post.likes ?? 0) });
    } catch {
      /* ignore */
    }
  }

  async function onShare(postId: string) {
    try {
      const data = await feedApi.share(postId);
      const post = data?.post;
      if (post) patchPost(postId, { shares_count: Number(post.shares_count ?? post.shares ?? 0) });
    } catch {
      /* ignore */
    }
  }

  async function onBookmark(postId: string) {
    try {
      const data = await bookmarksApi.toggle('feed', postId);
      patchPost(postId, { bookmarked: Boolean(data?.bookmarked) });
    } catch {
      /* ignore */
    }
  }

  async function openCommentSheet(postId: string, opts?: { mediaIndex?: number }) {
    setCommentSheetPostId(postId);
    setPostLightbox(true);
    setLightboxMediaIndex(Math.max(0, opts?.mediaIndex ?? 0));
    setCommentDraft('');
    setShowEmoji(false);
    setReplyToId('');
    setReplyToName('');
    try {
      const data = await feedApi.comments(postId);
      setComments((prev) => ({ ...prev, [postId]: data?.comments || [] }));
    } catch {
      setComments((prev) => ({ ...prev, [postId]: prev[postId] || [] }));
    }
  }

  function closeCommentSheet() {
    setCommentSheetPostId(null);
    setPostLightbox(false);
    setLightboxMediaIndex(0);
    setShowEmoji(false);
    setCommentDraft('');
    setReplyToId('');
    setReplyToName('');
  }

  useEffect(() => {
    if (!commentSheetPostId || !postLightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [commentSheetPostId, postLightbox]);

  async function submitComment(postId: string) {
    const text = commentDraft.trim();
    if (!text) return;
    const parent = replyToId;
    setCommentDraft('');
    setShowEmoji(false);
    setReplyToId('');
    setReplyToName('');
    try {
      await feedApi.comment(postId, text, { parent_id: parent || undefined });
      const data = await feedApi.comments(postId);
      setComments((prev) => ({ ...prev, [postId]: data?.comments || [] }));
      patchPost(postId, {
        comments_count: Number((posts.find((p) => p.id === postId)?.comments_count || 0) + 1),
      });
    } catch {
      /* ignore */
    }
  }

  async function onLikeComment(commentId: string) {
    if (!commentSheetPostId) return;
    try {
      const data = await feedApi.likeComment(commentId);
      const next = data?.comment;
      const patchTree = (list: any[]): any[] =>
        (list || []).map((c) => {
          if (c.id === commentId) {
            return { ...c, liked: Boolean(next?.liked ?? !c.liked), likes: Number(next?.likes ?? c.likes ?? 0) };
          }
          return { ...c, replies: patchTree(c.replies || []) };
        });
      setComments((prev) => ({
        ...prev,
        [commentSheetPostId]: patchTree(prev[commentSheetPostId] || []),
      }));
    } catch {
      /* ignore */
    }
  }

  function renderComment(c: any, nested = false) {
    return (
      <li key={c.id} className={nested ? 'rounded-xl bg-background/40 p-3 text-sm text-ink' : 'rounded-xl bg-background/60 p-3 text-sm text-ink'}>
        <p>
          <span className="font-semibold">{c.author}</span>
          {c.text ? <span className="text-muted"> · {c.text}</span> : null}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
          <button type="button" onClick={() => void onLikeComment(c.id)} className={c.liked ? 'text-primary' : 'text-muted'}>
            Like{c.likes ? ` · ${c.likes}` : ''}
          </button>
          <button
            type="button"
            onClick={() => {
              setReplyToId(c.parent_id || c.id);
              setReplyToName(c.author);
            }}
            className="text-muted hover:text-ink"
          >
            Reply
          </button>
        </div>
        {(c.replies || []).length ? (
          <ul className="mt-2 space-y-2 border-l border-black/10 pl-3">
            {(c.replies || []).map((r: any) => renderComment(r, true))}
          </ul>
        ) : null}
      </li>
    );
  }

  const isOwner = Boolean(active && (active.role === 'owner' || active.owner_id === user?.id));

  if (!user) {
    return (
      <section id={id} className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Sign in to see groups
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Groups, posts, and invites stay private until you have an account.
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

  if (groupId && active) {
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
          <Link to="/groups" className="text-sm font-semibold text-primary hover:underline">
            ← All groups
          </Link>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] ring-1 ring-black/5">
            <div
              className="h-28 bg-gradient-to-br from-primary/25 to-black/10 md:h-36"
              style={
                active.cover_url
                  ? { backgroundImage: `url(${active.cover_url})`, backgroundSize: 'cover' }
                  : undefined
              }
            />
            <div className="bg-surface px-5 py-5 md:px-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">{active.name}</h1>
                  <p className="mt-1 text-sm text-muted">{active.description || body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {active.member_count || members.length} members · {active.privacy}
                  </p>
                </div>
                {user ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void joinOrLeave()}>
                      {active.is_member ? (active.role === 'owner' ? 'Owner' : 'Leave') : 'Join'}
                    </Button>
                    {active.is_member ? (
                      <Button
                        type="button"
                        onClick={async () => {
                          try {
                            const data = await messagesApi.createChannel(String(active.id), 'general');
                            const tid = String(data?.thread?.id || '');
                            window.location.hash = tid ? '#/messages' : '#/messages';
                          } catch {
                            /* ignore */
                          }
                        }}
                      >
                        Open #general
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {active.privacy === 'private' && isOwner ? (
                <div className="mt-4 rounded-md border border-black/10 bg-background px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" onClick={() => void createInvite()} disabled={busy}>
                      Create invite
                    </Button>
                    {(createdInvite || inviteCode) ? (
                      <p className="text-sm text-ink">
                        Code: <span className="font-mono font-semibold">{createdInvite || inviteCode}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {status ? <p className="mt-3 text-sm text-primary">{status}</p> : null}
            </div>
          </div>

          {active.is_member ? (
            <form onSubmit={(e) => void postToGroup(e)} className="mt-6 rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-black/5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder="Share with the group"
                className="w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              {imageUrls.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {imageUrls.map((u, i) => (
                    <span key={`${u}-${i}`} className="relative inline-block">
                      <img src={u} alt="" className="h-20 w-20 rounded-md object-cover" />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              {videoUrl ? (
                <div className="mt-2">
                  <video src={videoUrl} controls className="max-h-56 w-full rounded-md bg-black" />
                  <button type="button" className="mt-1 text-xs font-semibold text-primary" onClick={() => setVideoUrl('')}>
                    Remove video
                  </button>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-3">
                  <label className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                    Add photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void onPickImages(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <label className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                    Add video
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const data = await mediaApi.upload(file, 'video');
                          const url = String(data?.url || '');
                          if (url) setVideoUrl(url);
                        } catch {
                          setStatus('Video upload failed (mp4/webm/mov, max 40MB).');
                        }
                      }}
                    />
                  </label>
                </div>
                <Button type="submit" disabled={busy || (!draft.trim() && !imageUrls.length && !videoUrl)}>
                  Post
                </Button>
              </div>
            </form>
          ) : null}

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_14rem]">
            <div>
              <h2 className="font-semibold text-ink">Group posts</h2>
              <ul className="mt-3 space-y-3">
                {posts.map((p) => (
                  <li key={p.id} className="rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-black/5">
                    <p className="text-sm font-semibold text-ink">{p.author}</p>
                    {p.text ? <p className="mt-1 text-sm text-ink">{p.text}</p> : null}
                    {p.video_url ? (
                      <button
                        type="button"
                        className="mt-2 block w-full overflow-hidden rounded-md text-left"
                        onClick={() => void openCommentSheet(p.id, { mediaIndex: 0 })}
                        aria-label="View video"
                      >
                        <video src={p.video_url} className="max-h-64 w-full bg-black object-cover" muted playsInline />
                      </button>
                    ) : null}
                    {Array.isArray(p.image_urls) && p.image_urls.length > 1 ? (
                      <div className="mt-2 grid grid-cols-2 gap-1 overflow-hidden rounded-md">
                        {p.image_urls.slice(0, 4).map((u: string, i: number) => (
                          <button
                            key={`${u}-${i}`}
                            type="button"
                            className="relative block overflow-hidden text-left"
                            onClick={() => void openCommentSheet(p.id, { mediaIndex: i })}
                            aria-label={`View photo ${i + 1}`}
                          >
                            <img src={u} alt="" className="h-40 w-full object-cover" />
                            {i === 3 && p.image_urls.length > 4 ? (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                                +{p.image_urls.length - 4}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    ) : p.image_url || p.image_urls?.[0] ? (
                      <button
                        type="button"
                        className="mt-2 block w-full overflow-hidden rounded-md text-left"
                        onClick={() => void openCommentSheet(p.id, { mediaIndex: 0 })}
                        aria-label="View photo"
                      >
                        <img src={p.image_url || p.image_urls[0]} alt="" className="max-h-64 w-full object-cover" />
                      </button>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void onLike(p.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold hover:bg-black/[0.04] ${
                          p.liked ? 'text-primary' : 'text-muted'
                        }`}
                        aria-label="Like"
                      >
                        <FeedActionIcon name="like" filled={Boolean(p.liked)} />
                        {p.likes ? <span>{p.likes}</span> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => void openCommentSheet(p.id)}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-black/[0.04]"
                        aria-label="Comment"
                      >
                        <FeedActionIcon name="comment" />
                        {p.comments_count ? <span>{p.comments_count}</span> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onShare(p.id)}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-black/[0.04]"
                        aria-label="Share"
                      >
                        <FeedActionIcon name="share" />
                        {p.shares_count ? <span>{p.shares_count}</span> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onBookmark(p.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold hover:bg-black/[0.04] ${
                          p.bookmarked ? 'text-primary' : 'text-muted'
                        }`}
                        aria-label="Bookmark"
                      >
                        <FeedActionIcon name="bookmark" filled={Boolean(p.bookmarked)} />
                      </button>
                    </div>
                  </li>
                ))}
                {!posts.length ? <li className="text-sm text-muted">No posts yet.</li> : null}
              </ul>
            </div>
            <aside>
              <h3 className="font-semibold text-ink">Members</h3>
              <ul className="mt-2 space-y-1">
                {members.slice(0, 20).map((m) => (
                  <li key={m.user_id || m.id}>
                    <Link to={`/u/${m.id || m.user_id}`} className="text-sm text-primary hover:underline">
                      {m.name || m.user_id} {m.role === 'owner' ? '· owner' : ''}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
          </div>
        </div>
        {typeof document !== 'undefined' && commentSheetPostId && postLightbox
          ? createPortal(
              <div
                className="post-lightbox fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-8"
                style={{ position: 'fixed', inset: 0 }}
              >
                <button
                  type="button"
                  aria-label="Close post"
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={closeCommentSheet}
                />
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute right-4 top-4 z-[210] flex h-10 w-10 items-center justify-center rounded-full text-2xl text-white hover:bg-white/10"
                  onClick={closeCommentSheet}
                >
                  ×
                </button>
                {(() => {
                  const lbPost = posts.find((p) => p.id === commentSheetPostId);
                  if (!lbPost) return null;
                  const mediaUrls = Array.isArray(lbPost.image_urls) && lbPost.image_urls.length
                    ? lbPost.image_urls
                    : lbPost.image_url
                      ? [lbPost.image_url]
                      : [];
                  const hasMedia = mediaUrls.length > 0;
                  const mediaIdx = Math.min(lightboxMediaIndex, Math.max(0, mediaUrls.length - 1));
                  return (
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label="Post"
                      className={`relative z-[205] flex w-full overflow-hidden rounded-xl shadow-2xl ${
                        hasMedia
                          ? 'h-[min(92vh,900px)] max-h-[min(92vh,900px)] max-w-5xl flex-col bg-black md:flex-row'
                          : 'max-h-[min(92vh,900px)] max-w-lg flex-col bg-surface'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hasMedia ? (
                        <div className="relative flex max-h-[42vh] min-h-0 flex-none items-center justify-center bg-black md:max-h-none md:min-h-0 md:flex-1">
                          <img src={mediaUrls[mediaIdx]} alt="" className="max-h-[42vh] w-full object-contain md:max-h-full" />
                          {mediaUrls.length > 1 ? (
                            <>
                              <button
                                type="button"
                                aria-label="Previous photo"
                                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow"
                                onClick={() => setLightboxMediaIndex((i) => (i - 1 + mediaUrls.length) % mediaUrls.length)}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                aria-label="Next photo"
                                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow"
                                onClick={() => setLightboxMediaIndex((i) => (i + 1) % mediaUrls.length)}
                              >
                                ›
                              </button>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      <div className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface ${hasMedia ? 'md:w-[22rem] md:flex-none md:self-stretch lg:w-[24rem]' : ''}`}>
                        <div className="flex shrink-0 items-center gap-3 border-b border-black/5 px-4 py-3">
                          <p className="text-sm font-semibold text-ink">{lbPost.author}</p>
                        </div>
                        <div className="lightbox-comments-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
                          {lbPost.text ? (
                            <p className="text-sm text-ink">
                              <span className="font-semibold">{lbPost.author}</span> {lbPost.text}
                            </p>
                          ) : null}
                          <ul className="space-y-2">
                            {(comments[commentSheetPostId] || []).map((c) => renderComment(c))}
                            {!comments[commentSheetPostId]?.length ? (
                              <li className="py-8 text-center text-sm text-muted">No comments yet — start the thread.</li>
                            ) : null}
                          </ul>
                        </div>
                        <div className="shrink-0 border-t border-black/5 px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => void onLike(lbPost.id)} className={`rounded-full p-2 hover:bg-black/[0.04] ${lbPost.liked ? 'text-primary' : 'text-ink'}`} aria-label="Like">
                              <FeedActionIcon name="like" filled={Boolean(lbPost.liked)} />
                            </button>
                            <button type="button" onClick={() => void onShare(lbPost.id)} className="rounded-full p-2 text-ink hover:bg-black/[0.04]" aria-label="Share">
                              <FeedActionIcon name="share" />
                            </button>
                            <button type="button" onClick={() => void onBookmark(lbPost.id)} className={`ml-auto rounded-full p-2 hover:bg-black/[0.04] ${lbPost.bookmarked ? 'text-primary' : 'text-ink'}`} aria-label="Bookmark">
                              <FeedActionIcon name="bookmark" filled={Boolean(lbPost.bookmarked)} />
                            </button>
                          </div>
                          <p className="px-2 text-sm font-semibold text-ink">{lbPost.likes ? `${lbPost.likes} likes` : 'Be the first to like'}</p>
                        </div>
                        <div className="shrink-0 space-y-2 border-t border-black/5 p-3">
                          {replyToId ? (
                            <div className="flex items-center justify-between gap-2 text-xs text-muted">
                              <span>Replying to {replyToName || 'comment'}</span>
                              <button type="button" className="font-semibold hover:text-ink" onClick={() => { setReplyToId(''); setReplyToName(''); }}>Cancel</button>
                            </div>
                          ) : null}
                          {showEmoji ? (
                            <div className="grid max-h-36 grid-cols-8 gap-1 overflow-y-auto rounded-xl bg-background p-2 ring-1 ring-black/10">
                              {EMOJIS.map((em) => (
                                <button key={em} type="button" className="rounded-md p-1 text-lg leading-none hover:bg-black/5" onClick={() => setCommentDraft((d) => d + em)}>{em}</button>
                              ))}
                            </div>
                          ) : null}
                          <div className="flex items-center gap-1">
                            <button type="button" aria-label="Add emoji" onClick={() => setShowEmoji((v) => !v)} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${showEmoji ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-black/5'}`}>
                              <EmojiIcon />
                            </button>
                            <input
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              placeholder="Add a comment..."
                              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  void submitComment(commentSheetPostId);
                                }
                              }}
                            />
                            <button type="button" disabled={!commentDraft.trim()} onClick={() => void submitComment(commentSheetPostId)} className="shrink-0 px-2 text-sm font-semibold text-primary disabled:opacity-40">
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>,
              document.body,
            )
          : null}
      </section>
    );
  }

  return (
    <section id={id} className={`bg-background social-groups--${groupsLayout}`}>
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

        <form onSubmit={(e) => void createGroup(e)} className="mt-8 max-w-xl space-y-3 rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-black/5">
          <p className="text-sm font-semibold text-ink">Create a group</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What is this group about?"
            className="w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <label className="block text-sm text-muted">
            Privacy
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value === 'private' ? 'private' : 'public')}
              className="mt-1 w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <Button type="submit" disabled={busy || !name.trim()}>
            Create
          </Button>
        </form>

        <form onSubmit={(e) => void joinWithInvite(e)} className="mt-4 max-w-xl flex flex-wrap gap-2 rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-black/5">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Join with invite code"
            className="min-w-[12rem] flex-1 rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="submit" disabled={busy || !joinCode.trim()}>
            Join invite
          </Button>
        </form>

        <div className="mt-8 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search groups"
            className="min-w-[12rem] flex-1 rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="button" onClick={() => void loadList()}>
            Search
          </Button>
        </div>

        <ul
          className={
            groupsLayout === 'groups-cards'
              ? 'mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
              : groupsLayout === 'groups-directory'
                ? 'mt-6 divide-y divide-black/10 rounded-xl bg-surface ring-1 ring-black/5'
                : 'mt-6 space-y-3'
          }
        >
          {groups.map((g) => (
            <li
              key={g.id}
              className={
                groupsLayout === 'groups-cards'
                  ? 'flex flex-col gap-2 rounded-2xl bg-surface p-4 ring-1 ring-black/5'
                  : groupsLayout === 'groups-directory'
                    ? 'flex flex-wrap items-center justify-between gap-3 px-4 py-3'
                    : 'flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-4 py-4 ring-1 ring-black/5'
              }
            >
              <div>
                <Link to={`/groups/${g.id}`} className="font-semibold text-ink hover:underline">
                  {g.name}
                </Link>
                <p className="mt-1 text-sm text-muted">{g.description || 'Community group'}</p>
                <p className="mt-1 text-xs text-muted">
                  {g.member_count || 0} members · {g.privacy || 'public'}
                  {g.is_member ? ' · joined' : ''}
                </p>
              </div>
              <Link to={`/groups/${g.id}`} className="text-sm font-semibold text-primary hover:underline">
                Open
              </Link>
            </li>
          ))}
          {!groups.length ? <li className="text-sm text-muted">No groups yet — create the first one.</li> : null}
        </ul>
        </div>
      </div>
    </section>
  );
}

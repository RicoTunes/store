import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  albumsApi,
  bookmarksApi,
  feedApi,
  followApi,
  friendsApi,
  mediaApi,
  messagesApi,
  moderationApi,
  profileApi,
} from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

type Profile = {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  friendship: string;
  following?: boolean;
  followers_count?: number;
  following_count?: number;
  is_self?: boolean;
};

type GalleryItem = { url: string; post_id?: string; text?: string; ts?: number };
type AlbumItem = { url: string; post_id?: string; sort_order?: number };
type Album = {
  id: string;
  title: string;
  cover_url?: string;
  item_count?: number;
  items?: AlbumItem[];
  privacy?: string;
};

export function ProfileShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const { userId: routeUserId } = useParams();
  const { user, logout } = useAuth() as any;
  const viewingId = routeUserId || user?.id || '';
  const isSelf = !routeUserId || routeUserId === user?.id;
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const profileLayout = String(design.profile_layout || 'profile-cover-tabs');
  const galleryLayout = String(design.gallery_layout || 'grid-3');
  const albumsStyle = String(design.albums_style || 'highlights-row');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'albums' | 'saved' | 'tagged'>('posts');
  const [activeAlbumId, setActiveAlbumId] = useState('');
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isSelf && !routeUserId) {
          const data = await profileApi.me();
          if (cancelled) return;
          const p = data?.profile || {};
          const pid = String(p.id || user?.id || '');
          setProfile({
            id: pid,
            name: String(p.name || user?.name || ''),
            bio: String(p.bio || ''),
            avatar_url: String(p.avatar_url || ''),
            cover_url: String(p.cover_url || ''),
            friendship: 'self',
            following: false,
            followers_count: Number(p.followers_count || 0),
            following_count: Number(p.following_count || 0),
            is_self: true,
          });
          setName(String(p.name || user?.name || ''));
          setBio(String(p.bio || ''));
          const feed = await feedApi.list({ author_id: pid });
          if (!cancelled) setPosts(feed?.posts || []);
          try {
            const media = await profileApi.media(pid);
            if (!cancelled) setGallery(Array.isArray(media?.media) ? media.media : []);
          } catch { if (!cancelled) setGallery([]); }
          try {
            const alb = await albumsApi.list(pid);
            if (!cancelled) setAlbums(Array.isArray(alb?.albums) ? alb.albums : []);
          } catch { if (!cancelled) setAlbums([]); }
          try {
            const saved = await bookmarksApi.list('feed');
            if (!cancelled) setSavedPosts(saved?.posts || saved?.bookmarks || []);
          } catch { if (!cancelled) setSavedPosts([]); }
        } else if (viewingId) {
          const data = await profileApi.get(viewingId);
          if (cancelled) return;
          const p = data?.profile || {};
          setProfile({
            id: String(p.id || viewingId),
            name: String(p.name || 'Member'),
            bio: String(p.bio || ''),
            avatar_url: String(p.avatar_url || ''),
            cover_url: String(p.cover_url || ''),
            friendship: String(p.friendship || 'none'),
            following: Boolean(p.following),
            followers_count: Number(p.followers_count || 0),
            following_count: Number(p.following_count || 0),
            is_self: Boolean(p.is_self),
          });
          setPosts(data?.posts || []);
          try {
            const media = await profileApi.media(String(p.id || viewingId));
            if (!cancelled) setGallery(Array.isArray(media?.media) ? media.media : []);
          } catch { if (!cancelled) setGallery([]); }
          try {
            const alb = await albumsApi.list(String(p.id || viewingId));
            if (!cancelled) setAlbums(Array.isArray(alb?.albums) ? alb.albums : []);
          } catch { if (!cancelled) setAlbums([]); }
        }
      } catch {
        if (!cancelled) setStatus('Could not load profile.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewingId, isSelf, routeUserId, user?.id, user?.name]);

  const galleryFromPosts = useMemo(() => {
    if (gallery.length) return gallery;
    const items: GalleryItem[] = [];
    const seen = new Set<string>();
    for (const p of posts) {
      const urls = Array.isArray(p.image_urls) && p.image_urls.length
        ? p.image_urls
        : p.image_url
          ? [p.image_url]
          : [];
      for (const u of urls) {
        const url = String(u || '');
        if (!url || seen.has(url)) continue;
        seen.add(url);
        items.push({ url, post_id: String(p.id || ''), text: String(p.text || ''), ts: Number(p.ts || 0) });
      }
    }
    return items;
  }, [gallery, posts]);

  const activeAlbum = albums.find((a) => a.id === activeAlbumId) || null;
  const gridClass =
    galleryLayout === 'grid-2'
      ? 'grid grid-cols-2 gap-1'
      : galleryLayout === 'masonry'
        ? 'columns-2 gap-1 sm:columns-3'
        : galleryLayout === 'flush-tiles'
          ? 'grid grid-cols-3 gap-0'
          : 'grid grid-cols-3 gap-1';
  const tileRadius = galleryLayout === 'rounded-tiles' || galleryLayout === 'grid-3' ? 'rounded-md' : '';

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await profileApi.update({ display_name: name, bio });
      const p = data?.profile || {};
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: String(p.name || name),
              bio: String(p.bio || bio),
            }
          : prev,
      );
      setStatus('Profile saved.');
    } catch {
      setStatus('Could not save profile.');
    } finally {
      setBusy(false);
    }
  }

  async function friendAction(action: string) {
    if (!profile?.id) return;
    try {
      if (action === 'request') await friendsApi.request(profile.id);
      else await friendsApi.action(profile.id, action);
      const data = await profileApi.get(profile.id);
      setProfile((prev) =>
        prev ? { ...prev, friendship: String(data?.profile?.friendship || action) } : prev,
      );
    } catch {
      setStatus('Friend action failed.');
    }
  }

  async function message() {
    if (!profile?.id) return;
    try {
      const data = await messagesApi.openDm(profile.id);
      const tid = data?.thread?.id;
      window.location.href = tid ? `/messages` : '/messages';
    } catch {
      setStatus('Could not open chat.');
    }
  }

  async function uploadPhoto(kind: 'avatar' | 'cover', file: File | null) {
    if (!file || !isSelf) return;
    setBusy(true);
    try {
      const data = await mediaApi.upload(file, kind);
      const url = String(data?.url || '');
      if (!url) throw new Error('no url');
      const patch = kind === 'avatar' ? { avatar_url: url } : { cover_url: url };
      const saved = await profileApi.update(patch);
      const p = saved?.profile || {};
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: String(p.avatar_url || prev.avatar_url || ''),
              cover_url: String(p.cover_url || prev.cover_url || ''),
            }
          : prev,
      );
      setStatus(kind === 'avatar' ? 'Avatar updated.' : 'Cover updated.');
    } catch {
      setStatus('Photo upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleFollow() {
    if (!profile?.id) return;
    const wasFollowing = Boolean(profile.following);
    // Optimistic UI — flip immediately; roll back if the request fails.
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            following: !wasFollowing,
            followers_count: Math.max(0, (prev.followers_count || 0) + (wasFollowing ? -1 : 1)),
          }
        : prev,
    );
    try {
      if (wasFollowing) await followApi.unfollow(profile.id);
      else await followApi.follow(profile.id);
    } catch {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              following: wasFollowing,
              followers_count: Math.max(0, (prev.followers_count || 0) + (wasFollowing ? 1 : -1)),
            }
          : prev,
      );
      setStatus('Follow action failed.');
    }
  }

  async function reportMember() {
    if (!profile?.id) return;
    const reason = window.prompt('Why are you reporting this member?') || '';
    try {
      await moderationApi.report('user', profile.id, reason);
      setStatus('Report submitted.');
    } catch {
      setStatus('Could not submit report.');
    }
  }

  async function banMember() {
    if (!profile?.id || isSelf) return;
    if (!window.confirm('Ban this member from posting?')) return;
    try {
      await moderationApi.ban(profile.id, true);
      setStatus('Member banned.');
    } catch {
      setStatus('Ban failed — admin only.');
    }
  }

  async function createAlbum() {
    if (!profile?.id || !isSelf) return;
    const title = window.prompt('Album name', 'Highlights') || '';
    if (!title.trim()) return;
    setBusy(true);
    try {
      const data = await albumsApi.create(profile.id, { title: title.trim(), privacy: 'public' });
      if (data?.album) {
        setAlbums((prev) => [data.album, ...prev]);
        setTab('albums');
        setActiveAlbumId(String(data.album.id));
        setStatus('Album created.');
      }
    } catch {
      setStatus('Could not create album.');
    } finally {
      setBusy(false);
    }
  }

  async function addPhotosToAlbum(albumId: string, files: FileList | null) {
    if (!files?.length || !profile?.id || !isSelf) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 10)) {
        const up = await mediaApi.upload(file, 'gallery');
        const url = String(up?.url || (up?.media?.id ? mediaApi.url(String(up.media.id)) : '') || '');
        if (url) urls.push(url);
      }
      if (!urls.length) throw new Error('upload failed');
      const data = await albumsApi.update(albumId, { add_urls: urls });
      if (data?.album) {
        setAlbums((prev) => prev.map((a) => (a.id === albumId ? data.album : a)));
        setStatus('Photos added to album.');
      }
    } catch {
      setStatus('Could not add photos.');
    } finally {
      setBusy(false);
    }
  }

  async function removeAlbum(albumId: string) {
    if (!isSelf || !window.confirm('Delete this album?')) return;
    try {
      await albumsApi.remove(albumId);
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      if (activeAlbumId === albumId) setActiveAlbumId('');
      setStatus('Album deleted.');
    } catch {
      setStatus('Could not delete album.');
    }
  }

  if (isSelf && !routeUserId && !user) {
    return (
      <section id={id} className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Sign in to see your profile
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Your posts, photos, and profile settings appear here after you log in.
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

  return (
    <section id={id} className={`bg-background social-profile--${profileLayout}`}>
      <div className="mx-auto w-full max-w-5xl px-3 py-4 md:px-4">
        <div
          className={
            profileLayout === 'profile-compact'
              ? 'rounded-2xl bg-surface p-5 ring-1 ring-black/5'
              : profileLayout === 'profile-magazine'
                ? 'border-b border-black/10 pb-6'
                : 'overflow-hidden rounded-2xl bg-surface ring-1 ring-black/5'
          }
        >
          {profileLayout !== 'profile-compact' ? (
            <div
              className={
                profileLayout === 'profile-magazine'
                  ? 'mb-4 h-28 bg-gradient-to-r from-primary/25 to-transparent md:h-36'
                  : profileLayout === 'profile-cinematic'
                    ? 'h-44 bg-gradient-to-br from-primary/40 via-background to-black/20 md:h-56'
                    : 'h-36 bg-gradient-to-br from-primary/35 via-primary/10 to-transparent md:h-44'
              }
              style={
                profile?.cover_url
                  ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : undefined
              }
            />
          ) : null}
          <div className={profileLayout === 'profile-compact' || profileLayout === 'profile-magazine' ? '' : 'px-4 pb-5 pt-0 md:px-6'}>
            <div
              className={
                profileLayout === 'profile-compact'
                  ? 'flex flex-wrap items-center gap-4'
                  : profileLayout === 'profile-magazine'
                    ? 'flex flex-wrap items-end gap-4'
                    : profileLayout === 'profile-split-bio'
                      ? 'grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-end'
                      : '-mt-10 flex flex-wrap items-end gap-4'
              }
            >
              <div
                className={`relative flex items-center justify-center overflow-hidden rounded-full bg-background font-semibold text-ink shadow-sm ${
                  profileLayout === 'profile-compact'
                    ? 'h-14 w-14 text-lg ring-2 ring-surface'
                    : 'h-24 w-24 text-2xl ring-4 ring-surface md:h-28 md:w-28'
                }`}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (profile?.name || '?').slice(0, 1).toUpperCase()
                )}
                {isSelf ? (
                  <label className="absolute inset-x-0 bottom-0 cursor-pointer bg-black/55 py-0.5 text-center text-[10px] font-semibold text-white opacity-0 transition hover:opacity-100 focus-within:opacity-100">
                    Edit
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void uploadPhoto('avatar', e.target.files?.[0] || null)}
                    />
                  </label>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1
                      className={`font-display font-semibold tracking-tight text-ink ${
                        profileLayout === 'profile-magazine' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
                      }`}
                    >
                      {profile?.name || title || 'Profile'}
                    </h1>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                      {profile?.bio || body}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <span className="text-ink">
                        <strong className="font-semibold">{profile?.followers_count || 0}</strong>{' '}
                        <span className="text-muted">followers</span>
                      </span>
                      <span className="text-ink">
                        <strong className="font-semibold">{profile?.following_count || 0}</strong>{' '}
                        <span className="text-muted">following</span>
                      </span>
                      <span className="text-ink">
                        <strong className="font-semibold">{posts.length}</strong>{' '}
                        <span className="text-muted">posts</span>
                      </span>
                      <span className="text-ink">
                        <strong className="font-semibold">{galleryFromPosts.length}</strong>{' '}
                        <span className="text-muted">photos</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isSelf ? (
                      <>
                        {profileLayout !== 'profile-compact' ? (
                          <label className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-black/10 hover:bg-black/[0.04]">
                            Change cover
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => void uploadPhoto('cover', e.target.files?.[0] || null)}
                            />
                          </label>
                        ) : null}
                        <Link
                          to="/friends"
                          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-black/10 hover:bg-black/[0.04]"
                        >
                          Friends
                        </Link>
                        {typeof logout === 'function' ? (
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted ring-1 ring-black/10 hover:bg-black/[0.04]"
                            onClick={() => void logout()}
                          >
                            Log out
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Button type="button" onClick={() => void toggleFollow()}>
                          {profile?.following ? 'Following' : 'Follow'}
                        </Button>
                        {profile?.friendship === 'none' || profile?.friendship === 'rejected' ? (
                          <Button type="button" onClick={() => void friendAction('request')}>
                            Add friend
                          </Button>
                        ) : null}
                        {profile?.friendship === 'pending' ? (
                          <span className="self-center text-sm text-muted">Request pending</span>
                        ) : null}
                        {profile?.friendship === 'accepted' ? (
                          <>
                            <Button type="button" onClick={() => void message()}>
                              Message
                            </Button>
                            <button
                              type="button"
                              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted ring-1 ring-black/10 hover:bg-black/[0.04]"
                              onClick={() => void friendAction('unfriend')}
                            >
                              Unfriend
                            </button>
                          </>
                        ) : null}
                        {profile?.friendship !== 'blocked' ? (
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted ring-1 ring-black/10 hover:bg-black/[0.04]"
                            onClick={() => void friendAction('block')}
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted ring-1 ring-black/10 hover:bg-black/[0.04]"
                            onClick={() => void friendAction('unfriend')}
                          >
                            Unblock
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted ring-1 ring-black/10 hover:bg-black/[0.04]"
                          onClick={() => void reportMember()}
                        >
                          Report
                        </button>
                        {user?.role === 'admin' && !isSelf ? (
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted ring-1 ring-black/10 hover:bg-black/[0.04]"
                            onClick={() => void banMember()}
                          >
                            Ban member
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {status ? <p className="mt-3 text-sm text-primary">{status}</p> : null}
          </div>
        </div>

        <div
          className={
            profileLayout === 'profile-split-bio' || profileLayout === 'profile-cover-tabs'
              ? 'mt-4 grid gap-4 lg:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)]'
              : 'mt-4 space-y-4'
          }
        >
          <div className="space-y-4">
            {isSelf ? (
              <form
                onSubmit={(e) => void saveProfile(e)}
                className="rounded-2xl bg-surface p-4 ring-1 ring-black/5"
              >
                <p className="text-sm font-semibold text-ink">Edit profile</p>
                <div className="mt-3 space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Display name"
                    className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Bio"
                    className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex flex-wrap gap-3">
                    <label className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                      Change avatar
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void uploadPhoto('avatar', e.target.files?.[0] || null)}
                      />
                    </label>
                    <label className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                      Change cover
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void uploadPhoto('cover', e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl bg-surface p-4 ring-1 ring-black/5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">About</p>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                  {profile?.bio || body || 'No bio yet.'}
                </p>
              </div>
            )}

            {albumsStyle !== 'hidden' ? (
              <div className={`rounded-2xl bg-surface p-4 ring-1 ring-black/5 ${albumsStyle === 'album-rail' ? '' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Albums</p>
                  {isSelf ? (
                    <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => void createAlbum()}>
                      New
                    </button>
                  ) : null}
                </div>
                <div className={`mt-3 flex gap-3 overflow-x-auto pb-1 ${albumsStyle === 'album-boards' ? 'flex-wrap' : ''}`}>
                  {isSelf ? (
                    <button
                      type="button"
                      onClick={() => void createAlbum()}
                      className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
                    >
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-black/20 text-xl text-muted">+</span>
                      <span className="w-full truncate text-[11px] text-muted">New</span>
                    </button>
                  ) : null}
                  {albums.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setTab('albums');
                        setActiveAlbumId(a.id);
                      }}
                      className={`flex ${albumsStyle === 'album-boards' ? 'w-28' : 'w-16'} shrink-0 flex-col items-center gap-1.5 text-center`}
                    >
                      <span className="inline-flex h-14 w-14 overflow-hidden rounded-full bg-black/5 ring-2 ring-black/10">
                        {a.cover_url ? <img src={a.cover_url} alt="" className="h-full w-full object-cover" /> : null}
                      </span>
                      <span className="w-full truncate text-[11px] font-medium text-ink">{a.title}</span>
                    </button>
                  ))}
                  {!albums.length && !isSelf ? (
                    <p className="text-xs text-muted">No albums yet.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-center gap-1 border-b border-black/10">
              {([
                { id: 'posts' as const, label: 'Posts', icon: '▦' },
                { id: 'albums' as const, label: 'Albums', icon: '◎' },
                ...(isSelf ? [{ id: 'saved' as const, label: 'Saved', icon: 'Bookmark' }] : []),
                { id: 'tagged' as const, label: 'Tagged', icon: '👤' },
              ]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id);
                    if (t.id !== 'albums') setActiveAlbumId('');
                  }}
                  className={`inline-flex items-center gap-2 border-t-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                    tab === t.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'posts' ? (
              galleryFromPosts.length ? (
                <div className={`${gridClass} profile-photo-gallery`}>
                  {galleryFromPosts.map((item, i) => (
                    <button
                      key={`${item.url}-${i}`}
                      type="button"
                      className={`group relative block w-full overflow-hidden bg-black/5 text-left ${tileRadius} ${
                        galleryLayout === 'masonry' ? 'mb-1 break-inside-avoid' : 'aspect-square'
                      }`}
                      onClick={() =>
                        setLightbox({
                          urls: galleryFromPosts.map((g) => g.url),
                          index: i,
                        })
                      }
                    >
                      <img
                        src={item.url}
                        alt=""
                        className={galleryLayout === 'masonry' ? 'w-full object-cover' : 'h-full w-full object-cover transition group-hover:scale-[1.02]'}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-surface px-4 py-16 text-center ring-1 ring-black/5">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-black/15 text-2xl text-muted">📷</div>
                  <p className="font-display text-xl font-semibold text-ink">Share photos</p>
                  <p className="mt-2 text-sm text-muted">When you share photos, they will appear on your profile.</p>
                </div>
              )
            ) : null}

            {tab === 'albums' ? (
              <div className="space-y-4">
                {activeAlbum ? (
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => setActiveAlbumId('')}>
                          ← All albums
                        </button>
                        <h3 className="font-display text-lg font-semibold text-ink">{activeAlbum.title}</h3>
                        <p className="text-xs text-muted">{activeAlbum.items?.length || activeAlbum.item_count || 0} photos</p>
                      </div>
                      {isSelf ? (
                        <div className="flex flex-wrap gap-2">
                          <label className="cursor-pointer rounded-lg bg-black/[0.06] px-3 py-1.5 text-sm font-semibold text-ink hover:bg-black/[0.1]">
                            Add photos
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => void addPhotosToAlbum(activeAlbum.id, e.target.files)}
                            />
                          </label>
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                            onClick={() => void removeAlbum(activeAlbum.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {(activeAlbum.items || []).length ? (
                      <div className={gridClass}>
                        {(activeAlbum.items || []).map((item, i) => (
                          <button
                            key={`${item.url}-${i}`}
                            type="button"
                            className={`aspect-square overflow-hidden bg-black/5 ${tileRadius}`}
                            onClick={() =>
                              setLightbox({
                                urls: (activeAlbum.items || []).map((x) => x.url),
                                index: i,
                              })
                            }
                          >
                            <img src={item.url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-surface px-4 py-10 text-center text-sm text-muted ring-1 ring-black/5">
                        This album is empty{isSelf ? ' — add photos above.' : '.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className={albumsStyle === 'album-boards' ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3 sm:grid-cols-3'}>
                    {albums.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setActiveAlbumId(a.id)}
                        className="overflow-hidden rounded-xl bg-surface text-left ring-1 ring-black/5 hover:ring-black/15"
                      >
                        <div className="aspect-square bg-black/5">
                          {a.cover_url ? <img src={a.cover_url} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <div className="px-3 py-2">
                          <p className="truncate text-sm font-semibold text-ink">{a.title}</p>
                          <p className="text-xs text-muted">{a.item_count || a.items?.length || 0} photos</p>
                        </div>
                      </button>
                    ))}
                    {!albums.length ? (
                      <p className="col-span-full rounded-2xl bg-surface px-4 py-10 text-center text-sm text-muted ring-1 ring-black/5">
                        {isSelf ? 'Create an album to organize your photos.' : 'No albums yet.'}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

            {tab === 'saved' && isSelf ? (
              savedPosts.length ? (
                <div className={gridClass}>
                  {savedPosts
                    .flatMap((p) =>
                      Array.isArray(p.image_urls) && p.image_urls.length
                        ? p.image_urls.map((u: string) => ({ url: u, post: p }))
                        : p.image_url
                          ? [{ url: p.image_url, post: p }]
                          : [],
                    )
                    .map((item, i, arr) => (
                      <button
                        key={`${item.url}-${i}`}
                        type="button"
                        className={`aspect-square overflow-hidden bg-black/5 ${tileRadius}`}
                        onClick={() => setLightbox({ urls: arr.map((x) => x.url), index: i })}
                      >
                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-surface px-4 py-10 text-center text-sm text-muted ring-1 ring-black/5">
                  Nothing saved yet — bookmark posts from the feed.
                </p>
              )
            ) : null}

            {tab === 'tagged' ? (
              <p className="rounded-2xl bg-surface px-4 py-10 text-center text-sm text-muted ring-1 ring-black/5">
                No tagged photos yet.
              </p>
            ) : null}

            {tab === 'posts' && posts.some((p) => !p.image_url && !(Array.isArray(p.image_urls) && p.image_urls.length)) ? (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-ink">Text posts</h3>
                <ul className="space-y-3">
                  {posts
                    .filter((p) => !p.image_url && !(Array.isArray(p.image_urls) && p.image_urls.length))
                    .map((p) => (
                      <li key={p.id} className="rounded-2xl bg-surface p-4 ring-1 ring-black/5">
                        <p className="text-sm leading-relaxed text-ink">{p.text}</p>
                        <p className="mt-2 text-xs text-muted">♥ {p.likes || 0} · {p.time || p.when || ''}</p>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {lightbox ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/10"
            onClick={() => setLightbox(null)}
          >
            Close
          </button>
          {lightbox.urls.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                onClick={() =>
                  setLightbox((prev) =>
                    prev
                      ? { ...prev, index: (prev.index - 1 + prev.urls.length) % prev.urls.length }
                      : prev,
                  )
                }
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                onClick={() =>
                  setLightbox((prev) =>
                    prev ? { ...prev, index: (prev.index + 1) % prev.urls.length } : prev,
                  )
                }
              >
                ›
              </button>
            </>
          ) : null}
          <img
            src={lightbox.urls[Math.min(lightbox.index, lightbox.urls.length - 1)]}
            alt=""
            className="max-h-[90vh] max-w-full object-contain"
          />
          {lightbox.urls.length > 1 ? (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {lightbox.index + 1}/{lightbox.urls.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

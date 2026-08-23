import { FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  bookmarksApi,
  feedApi,
  followApi,
  friendsApi,
  mediaApi,
  messagesApi,
  moderationApi,
  notificationsApi,
  socialEventsApi,
  socialPollApi,
  socialSearchApi,
  storiesApi,
  suggestionsApi,
} from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

type FeedPost = {
  id: string;
  author: string;
  authorId: string;
  text: string;
  imageUrl: string;
  imageUrls: string[];
  privacy: string;
  likes: number;
  commentsCount: number;
  liked: boolean;
  bookmarked?: boolean;
  shares?: number;
  when: string;
  ts?: number;
  postKind?: string;
  feeling?: string;
  event?: { title?: string; when?: string; where?: string };
  poll?: { question?: string; options?: { id: string; text: string; votes?: number }[]; total?: number; my_vote?: string };
  articleUrl?: string;
  articleTitle?: string;
  videoUrl?: string;
  editedAt?: number;
  scheduledTs?: number;
  hashtags?: string[];
};

type Comment = {
  id: string;
  author: string;
  text: string;
  when: string;
  imageUrl?: string;
  audioUrl?: string;
  likes?: number;
  liked?: boolean;
  parentId?: string;
  replies?: Comment[];
};
type StoryItem = { id: string; imageUrl: string; videoUrl?: string; mediaKind?: string; time: string };
type StoryRing = { authorId: string; author: string; mine?: boolean; items: StoryItem[] };
type Notif = { id: string; text: string; time: string; read: boolean };

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

const COMPOSER_ACTIONS = Array.isArray((INTENT as any).socialComposerActions)
  ? ((INTENT as any).socialComposerActions as string[])
  : ['Photo', 'Video', 'Feeling', 'Event'];

function mapPost(raw: any, idx: number): FeedPost {
  const imageUrls = Array.isArray(raw?.image_urls) && raw.image_urls.length
    ? raw.image_urls.map((u: any) => String(u || '')).filter(Boolean)
    : raw?.image_url
      ? [String(raw.image_url)]
      : [];
  return {
    id: String(raw?.id || `p${idx + 1}`),
    author: String(raw?.author || raw?.name || 'Member'),
    authorId: String(raw?.author_id || ''),
    text: String(raw?.text || raw?.body || ''),
    imageUrl: String(raw?.image_url || imageUrls[0] || ''),
    imageUrls,
    privacy: String(raw?.privacy || 'public'),
    likes: Number(raw?.likes ?? 0),
    commentsCount: Number(raw?.comments_count ?? 0),
    liked: Boolean(raw?.liked),
    bookmarked: Boolean(raw?.bookmarked),
    shares: Number(raw?.shares ?? raw?.shares_count ?? 0),
    when: String(raw?.when || raw?.time || ''),
    ts: Number(raw?.ts || 0) || undefined,
    postKind: String(raw?.post_kind || 'status'),
    feeling: String(raw?.feeling || ''),
    event: raw?.event && typeof raw.event === 'object' ? raw.event : {},
    poll: raw?.poll && typeof raw.poll === 'object' ? raw.poll : {},
    articleUrl: String(raw?.article_url || ''),
    articleTitle: String(raw?.article_title || ''),
    videoUrl: String(raw?.video_url || ''),
    editedAt: Number(raw?.edited_at || 0) || undefined,
    scheduledTs: Number(raw?.scheduled_ts || 0) || undefined,
    hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.map((t: any) => String(t)) : [],
  };
}

function mergeFeedPost(prev: FeedPost, next: FeedPost): FeedPost {
  const imageUrls =
    (next.imageUrls && next.imageUrls.length ? next.imageUrls : undefined) ||
    (next.imageUrl ? [next.imageUrl] : undefined) ||
    (prev.imageUrls && prev.imageUrls.length ? prev.imageUrls : undefined) ||
    (prev.imageUrl ? [prev.imageUrl] : []);
  return {
    ...prev,
    ...next,
    text: next.text || prev.text,
    imageUrl: next.imageUrl || imageUrls[0] || prev.imageUrl || '',
    imageUrls: imageUrls || [],
    videoUrl: next.videoUrl || prev.videoUrl || '',
    articleUrl: next.articleUrl || prev.articleUrl || '',
    articleTitle: next.articleTitle || prev.articleTitle || '',
    feeling: next.feeling || prev.feeling || '',
    event: next.event && Object.keys(next.event).length ? next.event : prev.event,
    poll: next.poll && Object.keys(next.poll).length ? next.poll : prev.poll,
  };
}

function PhotoGrid({
  urls,
  compact,
  onOpen,
}: {
  urls: string[];
  compact?: boolean;
  onOpen?: (index: number) => void;
}) {
  const list = (urls || []).filter(Boolean).slice(0, 10);
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIdx(0);
  }, [list.join('|')]);

  if (!list.length) return null;

  // Single photo
  if (list.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpen?.(0)}
        className="mt-3 block w-full overflow-hidden rounded-md text-left"
        aria-label="View photo"
      >
        <img
          src={list[0]}
          alt=""
          className={compact ? 'max-h-56 w-full object-cover' : 'max-h-96 w-full object-cover'}
        />
      </button>
    );
  }

  // 2–3 photos: compact grid (tap opens lightbox)
  if (list.length <= 3) {
    return (
      <div className={`grid grid-cols-2 gap-1 overflow-hidden rounded-md ${compact ? 'mt-1' : 'mt-3'} ${list.length === 3 ? 'grid-rows-2' : ''}`}>
        {list.map((u, i) => (
          <button
            key={`${u}-${i}`}
            type="button"
            onClick={() => onOpen?.(i)}
            className={`relative block overflow-hidden text-left ${list.length === 3 && i === 0 ? 'row-span-2' : ''}`}
            aria-label={`View photo ${i + 1}`}
          >
            <img
              src={u}
              alt=""
              className={
                compact
                  ? 'h-28 w-full object-cover'
                  : list.length === 3 && i === 0
                    ? 'h-full min-h-[11rem] w-full object-cover'
                    : 'h-44 w-full object-cover'
              }
            />
          </button>
        ))}
      </div>
    );
  }

  // More than 3 photos: in-feed slider (swipe + arrows + dots) — FEED_PHOTO_SLIDER
  const safeIdx = Math.min(Math.max(idx, 0), list.length - 1);
  function go(next: number) {
    const n = ((next % list.length) + list.length) % list.length;
    setIdx(n);
    const el = scrollerRef.current;
    if (el) {
      const w = el.clientWidth || 1;
      el.scrollTo({ left: n * w, behavior: 'smooth' });
    }
  }

  return (
    <div className={`feed-photo-slider relative ${compact ? 'mt-1' : 'mt-3'}`}>
      <div className="relative overflow-hidden rounded-md">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            const w = el.clientWidth || 1;
            const next = Math.round(el.scrollLeft / w);
            if (next !== safeIdx && next >= 0 && next < list.length) setIdx(next);
          }}
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            if (start == null) return;
            const end = e.changedTouches[0]?.clientX ?? start;
            const dx = end - start;
            if (Math.abs(dx) < 40) return;
            go(safeIdx + (dx < 0 ? 1 : -1));
          }}
        >
          {list.map((u, i) => (
            <button
              key={`${u}-${i}`}
              type="button"
              className="relative w-full min-w-full shrink-0 snap-center snap-always overflow-hidden text-left"
              onClick={() => onOpen?.(i)}
              aria-label={`View photo ${i + 1} of ${list.length}`}
            >
              <img
                src={u}
                alt=""
                className={compact ? 'max-h-56 w-full object-cover' : 'max-h-[32rem] w-full object-cover'}
                draggable={false}
              />
            </button>
          ))}
        </div>

        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {safeIdx + 1}/{list.length}
        </span>

        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            go(safeIdx - 1);
          }}
          className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md ring-1 ring-black/10 backdrop-blur transition hover:bg-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m14.5 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            go(safeIdx + 1);
          }}
          className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md ring-1 ring-black/10 backdrop-blur transition hover:bg-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m9.5 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-label="Photo pages">
        {list.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === safeIdx}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === safeIdx ? 'w-4 bg-primary' : 'w-1.5 bg-black/20 hover:bg-black/35'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function RichText({ text }: { text: string }) {
  const parts = String(text || '').split(/([#@][a-zA-Z0-9_.-]{2,40})/g);
  return (
    <p className="mt-3 text-sm leading-relaxed text-ink">
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Link key={`${tag}-${i}`} to={`/explore?tag=${encodeURIComponent(tag)}`} className="font-semibold text-primary hover:underline">
              {part}
            </Link>
          );
        }
        if (part.startsWith('@')) {
          return (
            <span key={`${part}-${i}`} className="font-semibold text-primary">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function mapComment(c: any, i: number): Comment {
  return {
    id: String(c?.id || i),
    author: String(c?.author || 'Member'),
    text: String(c?.text || ''),
    when: String(c?.time || c?.when || ''),
    imageUrl: c?.image_url ? String(c.image_url) : undefined,
    audioUrl: c?.audio_url ? String(c.audio_url) : undefined,
    likes: Number(c?.likes ?? 0),
    liked: Boolean(c?.liked),
    parentId: String(c?.parent_id || ''),
    replies: Array.isArray(c?.replies) ? c.replies.map((r: any, j: number) => mapComment(r, j)) : [],
  };
}

function mapStoryRing(raw: any): StoryRing {
  return {
    authorId: String(raw?.author_id || ''),
    author: String(raw?.author || 'Member'),
    mine: Boolean(raw?.mine),
    items: Array.isArray(raw?.items)
      ? raw.items.map((it: any) => ({
          id: String(it?.id || ''),
          imageUrl: String(it?.image_url || ''),
          videoUrl: String(it?.video_url || ''),
          mediaKind: String(it?.media_kind || (it?.video_url ? 'video' : 'image')),
          time: String(it?.time || ''),
        }))
      : [],
  };
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

function personInitials(name: string) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function FeedSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="feed-skeleton space-y-4" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="animate-pulse rounded-2xl bg-surface p-4 ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-black/[0.08]" />
            <div className="min-w-0 flex-1 space-y-2">
              <span className="block h-3 w-28 rounded-full bg-black/[0.08]" />
              <span className="block h-2.5 w-16 rounded-full bg-black/[0.05]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <span className="block h-3 w-full rounded-full bg-black/[0.06]" />
            <span className="block h-3 w-4/5 rounded-full bg-black/[0.05]" />
          </div>
          <span className="mt-4 block aspect-[16/10] w-full rounded-xl bg-black/[0.06]" />
          <div className="mt-3 flex gap-6">
            <span className="h-3 w-10 rounded-full bg-black/[0.05]" />
            <span className="h-3 w-10 rounded-full bg-black/[0.05]" />
            <span className="h-3 w-10 rounded-full bg-black/[0.05]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SocialFeed({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const headerQuery = String(searchParams.get('q') || '').trim();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [draft, setDraft] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [lightboxMediaIndex, setLightboxMediaIndex] = useState(0);
  const [postLightbox, setPostLightbox] = useState(false);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [commentAudio, setCommentAudio] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyToId, setReplyToId] = useState('');
  const [replyToName, setReplyToName] = useState('');
  const [stories, setStories] = useState<StoryRing[]>([]);
  const [storyViewer, setStoryViewer] = useState<{ ring: number; item: number } | null>(null);
  const storyFileRef = useRef<HTMLInputElement | null>(null);
  const videoFileRef = useRef<HTMLInputElement | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [searchHits, setSearchHits] = useState<{ people: any[]; posts: any[] } | null>(null);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [feedSince, setFeedSince] = useState(0);
  const [notifSince, setNotifSince] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lightboxCommentRef = useRef<HTMLInputElement | null>(null);
  const [composerKind, setComposerKind] = useState('status');
  const [feeling, setFeeling] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventWhen, setEventWhen] = useState('');
  const [eventWhere, setEventWhere] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('Yes\nNo');
  const [articleUrl, setArticleUrl] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [feedSort, setFeedSort] = useState<'ranked' | 'chrono'>('ranked');
  const [editingId, setEditingId] = useState('');
  const [reelId, setReelId] = useState<string | null>(null);
  const [postMenuId, setPostMenuId] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const [friendTiles, setFriendTiles] = useState<any[]>([]);
  const [messengerContacts, setMessengerContacts] = useState<any[]>([]);
  const [contactQ, setContactQ] = useState('');
  const arch = String((INTENT as any).socialArchetype || 'general');
  const chrome = String((INTENT as any).socialChrome || 'soft-surface').toLowerCase().replace(/_/g, '-');
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const postActions = String(design.post_actions || 'actions-row');
  const feedLayout = String(design.feed_layout || 'timeline');
  const composerStyle = String(design.composer || 'composer-card');
  const storiesStyle = String(design.stories || 'stories-ring-row');
  const commentsStyle = String(design.comments || 'comments-sheet');
  const mediaFrame = String(design.media_frame || 'soft-radius');
  const motionStyle = String(design.motion || 'subtle');
  const atmosphere = String(design.atmosphere || 'clear-day');
  const lightboxStyle = String(design.lightbox || 'ig-split');
  const designMods = [
    design.shell ? `social-shell--${design.shell}` : '',
    design.surface ? `social-surface--${design.surface}` : '',
    design.density ? `social-density--${design.density}` : '',
    motionStyle ? `social-motion--${motionStyle}` : '',
    feedLayout ? `social-feed--${feedLayout}` : '',
    postActions ? `social-actions--${postActions}` : '',
    composerStyle ? `social-composer--${composerStyle}` : '',
    storiesStyle ? `social-stories--${storiesStyle}` : '',
    mediaFrame ? `social-media--${mediaFrame}` : '',
    atmosphere ? `social-atmosphere--${atmosphere}` : '',
    lightboxStyle ? `social-lightbox--${lightboxStyle}` : '',
  ].filter(Boolean).join(' ');
  const classic = chrome === 'classic-blue' || design.shell === 'classic-three';
  const messengerFirst =
    chrome === 'messenger-rail' ||
    classic ||
    design.shell === 'messenger-first' ||
    design.right_rail === 'messenger';
  // media-first / studio single-column must NOT collapse messenger rails into
  // full-width Intro/Photos cards (blank, sparse "broken profile" look).
  const singleCol =
    !messengerFirst &&
    (
      chrome === 'creator-studio' ||
      arch === 'creator' ||
      design.shell === 'studio-column' ||
      design.shell === 'immersive-stage' ||
      feedLayout === 'media-first'
    );
  const feedGridClass = singleCol
    ? 'lg:grid-cols-[minmax(0,1fr)]'
    : messengerFirst
      ? 'lg:grid-cols-[minmax(15rem,17rem)_minmax(0,1fr)_minmax(16rem,18rem)]'
      : chrome === 'community-forum' || feedLayout === 'compact-forum'
        ? 'lg:grid-cols-[minmax(13rem,15rem)_minmax(0,1fr)_minmax(15rem,17rem)]'
        : feedLayout === 'magazine'
          ? 'lg:grid-cols-[minmax(0,1fr)_minmax(17rem,19rem)]'
          : 'lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]';
  const showProfileRail = messengerFirst || chrome === 'community-forum';
  // Never pin the compose form to the corner — keep it in the feed column.
  const effectiveComposer =
    composerStyle === 'composer-fab' || composerStyle === 'composer-pen'
      ? 'composer-card'
      : composerStyle;
  const postCardClass =
    feedLayout === 'card-stream'
      ? 'rounded-2xl bg-surface p-4 shadow-md ring-1 ring-black/5'
      : feedLayout === 'magazine'
        ? 'rounded-none border-b border-black/10 bg-transparent py-5'
        : feedLayout === 'compact-forum'
          ? 'rounded-md bg-surface px-3 py-2.5 ring-1 ring-black/5'
          : feedLayout === 'media-first'
            ? 'overflow-hidden rounded-xl bg-surface ring-1 ring-black/5'
            : 'rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-black/5';

  async function loadFeed(opts?: { before?: number; append?: boolean }) {
    if (!opts?.append) setFeedLoading(true);
    try {
      const data = await feedApi.list({ limit: 8, before: opts?.before, sort: feedSort });
      const list = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : [];
      const mapped = list.map(mapPost);
      if (opts?.append) {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...prev, ...mapped.filter((p) => !ids.has(p.id))];
        });
      } else if (mapped.length) {
        setPosts((prev) => {
          const byId = new Map(prev.map((p) => [p.id, p]));
          return mapped.map((p) => {
            const old = byId.get(p.id);
            return old ? mergeFeedPost(old, p) : p;
          });
        });
        const maxTs = list.reduce((m: number, p: any) => Math.max(m, Number(p?.ts || 0)), 0);
        if (maxTs) setFeedSince(maxTs);
      } else if (!opts?.append) {
        setPosts([]);
      }
      setHasMore(Boolean(data?.has_more));
      const nb = data?.next_before != null ? Number(data.next_before) : null;
      setNextBefore(nb && !Number.isNaN(nb) ? nb : null);
    } finally {
      if (!opts?.append) setFeedLoading(false);
    }
  }

  async function loadStories() {
    try {
      const data = await storiesApi.list();
      const rings = (data?.stories || []).map(mapStoryRing);
      if (rings.length) setStories(rings);
      else if (user?.id) {
        setStories([{ authorId: String(user.id), author: 'Your story', mine: true, items: [] }]);
      } else {
        setStories([]);
      }
    } catch {
      if (user?.id) {
        setStories([{ authorId: String(user.id), author: 'Your story', mine: true, items: [] }]);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        if (!cancelled) {
          setSuggestions([]);
          setIncoming([]);
          setNotifs([]);
          setUnread(0);
        }
        return;
      }
      try {
        await loadFeed();
      } catch {
        /* seed */
      }
      if (cancelled) return;
      try {
        await loadStories();
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      try {
        const n = await notificationsApi.list();
        if (!cancelled) {
          setNotifs(
            (n?.notifications || []).map((x: any) => ({
              id: String(x.id),
              text: String(x.text || x.kind || 'Update'),
              time: String(x.time || ''),
              read: Boolean(x.read),
            })),
          );
          setUnread(Number(n?.unread || 0));
          const maxN = (n?.notifications || []).reduce(
            (m: number, x: any) => Math.max(m, Number(x?.ts || 0)),
            0,
          );
          if (maxN) setNotifSince(maxN);
        }
      } catch {
        /* ignore */
      }
      try {
        const f = await friendsApi.list();
        if (!cancelled) {
          setIncoming(f?.requests?.incoming || []);
          const friends = Array.isArray(f?.friends) ? f.friends : Array.isArray(f) ? f : [];
          setFriendTiles(friends.slice(0, 9));
        }
      } catch {
        /* ignore */
      }
      try {
        const s = await suggestionsApi.people(6);
        if (!cancelled) setSuggestions(s?.people || []);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
      try {
        const threads = await messagesApi.listThreads();
        const list = Array.isArray(threads?.threads) ? threads.threads : Array.isArray(threads) ? threads : [];
        if (!cancelled) {
          setMessengerContacts(
            list.slice(0, 16).map((t: any, i: number) => ({
              id: String(t?.peer_id || t?.id || i),
              name: String(t?.name || t?.title || 'Chat'),
              time: String(t?.time || t?.time_label || ''),
              unread: Number(t?.unread || 0) || 0,
              threadId: String(t?.id || ''),
            })),
          );
        }
      } catch {
        if (!cancelled) setMessengerContacts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void loadFeed();
  }, [feedSort]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    let pollTimer: number | undefined;
    let es: EventSource | null = null;
    let localFeedSince = feedSince;
    let localNotifSince = notifSince;

    const applyPoll = async () => {
      try {
        const data = await socialPollApi.poll({
          feed_since: localFeedSince || undefined,
          notif_since: localNotifSince || undefined,
        });
        if (cancelled) return;
        if (Array.isArray(data?.posts) && data.posts.length) {
          setPosts((prev) => {
            const byId = new Map(prev.map((p) => [p.id, p]));
            const incoming = data.posts.map((raw: any, i: number) => mapPost(raw, i));
            for (const p of incoming) {
              const old = byId.get(p.id);
              byId.set(p.id, old ? mergeFeedPost(old, p) : p);
            }
            // Keep existing order for known posts; prepend truly new ones.
            const existingIds = new Set(prev.map((p) => p.id));
            const fresh = incoming.filter((p: FeedPost) => !existingIds.has(p.id));
            const rest = prev.map((p) => byId.get(p.id) || p);
            return [...fresh, ...rest];
          });
          if (data.feed_ts) {
            localFeedSince = Number(data.feed_ts);
            setFeedSince(localFeedSince);
          }
        }
        if (Array.isArray(data?.notifications) && data.notifications.length) {
          setNotifs((prev) => {
            const ids = new Set(prev.map((n) => n.id));
            const extra = data.notifications
              .filter((x: any) => !ids.has(String(x.id)))
              .map((x: any) => ({
                id: String(x.id),
                text: String(x.text || 'Update'),
                time: String(x.time || ''),
                read: Boolean(x.read),
              }));
            return [...extra, ...prev];
          });
          setUnread(Number(data.unread || 0));
          const maxN = data.notifications.reduce(
            (m: number, x: any) => Math.max(m, Number(x?.ts || 0)),
            localNotifSince,
          );
          localNotifSince = maxN;
          setNotifSince(maxN);
        } else if (typeof data?.unread === 'number') {
          setUnread(data.unread);
        }
      } catch {
        /* ignore poll errors */
      }
    };

    const startPoll = () => {
      if (pollTimer || cancelled) return;
      pollTimer = window.setInterval(() => {
        void applyPoll();
      }, 20000);
    };

    try {
      es = socialEventsApi.connect((ev) => {
        const type = String(ev?.type || '');
        if (type === 'feed' || type === 'notification' || type === 'message' || !type) {
          void applyPoll();
        }
      });
      if (es) {
        es.onerror = () => {
          try {
            es?.close();
          } catch {
            /* ignore */
          }
          es = null;
          if (!cancelled) startPoll();
        };
      } else {
        startPoll();
      }
    } catch {
      startPoll();
    }

    return () => {
      cancelled = true;
      try {
        es?.close();
      } catch {
        /* ignore */
      }
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [user?.id]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, nextBefore, loadingMore]);

  async function loadMore() {
    if (!hasMore || loadingMore || nextBefore == null) return;
    setLoadingMore(true);
    try {
      await loadFeed({ before: nextBefore, append: true });
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    const kind = composerKind;
    const event =
      kind === 'event' && (eventTitle.trim() || eventWhen.trim() || eventWhere.trim())
        ? { title: eventTitle.trim(), when: eventWhen.trim(), where: eventWhere.trim() }
        : undefined;
    const poll =
      kind === 'poll'
        ? {
            question: pollQuestion.trim() || text || 'Poll',
            options: pollOptions
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 8),
          }
        : undefined;
    if (!text && !imageUrls.length && !videoUrl && !feeling && !event && !(poll && poll.options.length >= 2) && !articleUrl) return;
    setBusy(true);
    const imgs = imageUrls.slice(0, 10);
    const sched = scheduledLocal ? Math.floor(new Date(scheduledLocal).getTime() / 1000) : 0;
    const optimistic: FeedPost = {
      id: `local-${Date.now()}`,
      author: user?.name || 'You',
      authorId: user?.id || '',
      text,
      imageUrl: imgs[0] || '',
      imageUrls: imgs,
      privacy,
      likes: 0,
      commentsCount: 0,
      liked: false,
      when: sched > Date.now() / 1000 ? 'scheduled' : 'now',
      postKind: kind,
      feeling,
      event,
      poll: poll ? { question: poll.question, options: poll.options.map((t, i) => ({ id: `o${i + 1}`, text: t, votes: 0 })) } : {},
      articleUrl,
      articleTitle,
      videoUrl,
    };
    if (!sched || sched <= Date.now() / 1000) setPosts((prev) => [optimistic, ...prev]);
    setDraft('');
    setImageUrls([]);
    try {
      const data = await feedApi.create({
        text,
        image_url: imgs[0] || '',
        image_urls: imgs,
        privacy,
        post_kind: kind,
        feeling,
        event,
        poll,
        article_url: articleUrl,
        article_title: articleTitle,
        video_url: videoUrl,
        scheduled_ts: sched || undefined,
      });
      const saved = data?.post || data;
      if (saved?.id) {
        setPosts((prev) => prev.map((p) => (p.id === optimistic.id ? mergeFeedPost(p, mapPost(saved, 0)) : p)));
      }
      setFeeling('');
      setEventTitle('');
      setEventWhen('');
      setEventWhere('');
      setPollQuestion('');
      setPollOptions('Yes\nNo');
      setArticleUrl('');
      setArticleTitle('');
      setVideoUrl('');
      setScheduledLocal('');
      setComposerKind('status');
    } catch {
      /* keep optimistic */
    } finally {
      setBusy(false);
    }
  }

  async function onLike(postId: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1, liked: !p.liked }
          : p,
      ),
    );
    try {
      const data = await feedApi.like(postId);
      const post = data?.post;
      if (post) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  liked: Boolean(post.liked),
                  likes: Number(post.likes ?? p.likes),
                }
              : p,
          ),
        );
      }
    } catch {
      /* optimistic stay */
    }
  }

  async function onShare(postId: string) {
    try {
      const data = await feedApi.share(postId);
      const post = data?.post;
      if (post) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, shares: Number(post.shares_count ?? post.shares ?? (p.shares || 0) + 1) }
              : p,
          ),
        );
      } else {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p)),
        );
      }
    } catch {
      /* ignore */
    }
  }

  async function onBookmark(postId: string) {
    try {
      const data = await bookmarksApi.toggle('feed', postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, bookmarked: Boolean(data?.bookmarked ?? !p.bookmarked) } : p,
        ),
      );
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p)),
      );
    }
  }

  async function openCommentSheet(postId: string, opts?: { mediaIndex?: number; lightbox?: boolean }) {
    const preferLightbox = opts?.lightbox === true || commentsStyle !== 'comments-inline';
    if (commentsStyle === 'comments-inline' && !preferLightbox) {
      if (commentSheetPostId === postId && !postLightbox) {
        closeCommentSheet();
        return;
      }
      setPostLightbox(false);
    } else {
      setPostLightbox(true);
    }
    setCommentSheetPostId(postId);
    setLightboxMediaIndex(Math.max(0, opts?.mediaIndex ?? 0));
    setCommentDraft('');
    setCommentImage('');
    setCommentAudio('');
    setShowEmoji(false);
    setReplyToId('');
    setReplyToName('');
    try {
      const data = await feedApi.comments(postId);
      setComments((prev) => ({
        ...prev,
        [postId]: (data?.comments || []).map(mapComment),
      }));
    } catch {
      setComments((prev) => ({ ...prev, [postId]: prev[postId] || [] }));
    }
  }

  function closeCommentSheet() {
    setCommentSheetPostId(null);
    setLightboxMediaIndex(0);
    setPostLightbox(false);
    setShowEmoji(false);
    setCommentDraft('');
    setCommentImage('');
    setCommentAudio('');
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

  function focusLightboxComment() {
    const el = lightboxCommentRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => el.focus({ preventScroll: true }), 80);
  }

  async function submitComment(postId: string) {
    const text = commentDraft.trim();
    if (!text && !commentImage && !commentAudio) return;
    setCommentDraft('');
    const img = commentImage;
    const aud = commentAudio;
    const parent = replyToId;
    setCommentImage('');
    setCommentAudio('');
    setShowEmoji(false);
    setReplyToId('');
    setReplyToName('');
    try {
      await feedApi.comment(postId, text, { image_url: img, audio_url: aud, parent_id: parent || undefined });
      const data = await feedApi.comments(postId);
      setComments((prev) => ({
        ...prev,
        [postId]: (data?.comments || []).map(mapComment),
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p)),
      );
    } catch {
      /* ignore */
    }
  }

  async function onLikeComment(commentId: string) {
    if (!commentSheetPostId) return;
    try {
      const data = await feedApi.likeComment(commentId);
      const next = data?.comment;
      const patchTree = (list: Comment[]): Comment[] =>
        list.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              liked: Boolean(next?.liked ?? !c.liked),
              likes: Number(next?.likes ?? (c.liked ? Math.max(0, (c.likes || 0) - 1) : (c.likes || 0) + 1)),
            };
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

  async function uploadCommentMedia(file: File | null, kind: 'image' | 'audio') {
    if (!file) return;
    try {
      const data = await mediaApi.upload(file, kind === 'audio' ? 'audio' : 'comment');
      const url = String(data?.url || '');
      if (!url) return;
      if (kind === 'audio') setCommentAudio(url);
      else setCommentImage(url);
    } catch {
      alert('Comment media upload failed.');
    }
  }

  async function onPickImages(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    setBusy(true);
    const next = [...imageUrls];
    try {
      for (const file of list) {
        if (next.length >= 10) break;
        try {
          const data = await mediaApi.upload(file, 'feed');
          const url = String(data?.url || '');
          if (url && !next.includes(url)) next.push(url);
        } catch {
          if (file.size <= 350_000) {
            const url = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ''));
              reader.readAsDataURL(file);
            });
            if (url && !next.includes(url)) next.push(url);
          } else {
            alert('Upload failed — try an image under 15MB.');
          }
        }
      }
      setImageUrls(next.slice(0, 10));
    } finally {
      setBusy(false);
    }
  }

  async function onPickVideo(file: File | null) {
    if (!file) return;
    const okType =
      file.type.startsWith('video/') ||
      /\.(mp4|webm|mov|m4v)$/i.test(file.name);
    if (!okType) {
      alert('Please choose an mp4, webm, or mov video.');
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      alert('Video is too large (max 40MB).');
      return;
    }
    setBusy(true);
    try {
      const data = await mediaApi.upload(file, 'video');
      const url = String(data?.url || '');
      if (!url) throw new Error('no url');
      setVideoUrl(url);
      setComposerKind('video');
      setImageUrls([]);
    } catch (err: any) {
      alert(err?.message || 'Video upload failed (mp4/webm/mov, max 40MB).');
    } finally {
      setBusy(false);
    }
  }

  async function onStoryFile(file: File | null) {
    if (!file) return;
    try {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
      const data = await mediaApi.upload(file, isVideo ? 'video' : 'story');
      const url = String(data?.url || '');
      if (!url) return;
      if (isVideo) await storiesApi.create('', { video_url: url });
      else await storiesApi.create(url);
      await loadStories();
    } catch {
      alert('Could not add story.');
    }
  }

  function openStoryViewer(ring: number, item = 0) {
    const target = stories[ring];
    if (!target?.items?.length) return;
    setStoryViewer({ ring, item });
  }

  function onStoryRingClick(ring: StoryRing, index: number) {
    if (ring.mine && !ring.items.length) {
      storyFileRef.current?.click();
      return;
    }
    if (ring.items.length) openStoryViewer(index, 0);
  }

  function advanceStory(delta: number) {
    if (!storyViewer) return;
    const ring = stories[storyViewer.ring];
    if (!ring) {
      setStoryViewer(null);
      return;
    }
    const nextItem = storyViewer.item + delta;
    if (nextItem >= 0 && nextItem < ring.items.length) {
      setStoryViewer({ ring: storyViewer.ring, item: nextItem });
      return;
    }
    const nextRing = storyViewer.ring + delta;
    if (nextRing >= 0 && nextRing < stories.length && stories[nextRing].items.length) {
      setStoryViewer({
        ring: nextRing,
        item: delta > 0 ? 0 : stories[nextRing].items.length - 1,
      });
      return;
    }
    setStoryViewer(null);
  }

  async function deletePost(postId: string) {
    if (!window.confirm('Delete this post?')) return;
    try {
      await feedApi.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setPostMenuId('');
    } catch {
      alert('Could not delete post.');
    }
  }

  function hidePost(postId: string) {
    setHiddenPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
    setPostMenuId('');
  }

  function notInterestedPost(postId: string) {
    setHiddenPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
    setPostMenuId('');
  }

  async function reportPost(postId: string) {
    setPostMenuId('');
    const reason = window.prompt('Why report this post?') || '';
    try {
      await moderationApi.report('post', postId, reason);
    } catch {
      /* ignore */
    }
  }

  async function toggleFollowAuthor(authorId: string) {
    if (!authorId || !user?.id || authorId === user.id) return;
    const wasFollowing = Boolean(followingMap[authorId]);
    setFollowingMap((prev) => ({ ...prev, [authorId]: !wasFollowing }));
    try {
      if (wasFollowing) await followApi.unfollow(authorId);
      else await followApi.follow(authorId);
    } catch {
      setFollowingMap((prev) => ({ ...prev, [authorId]: wasFollowing }));
    }
  }

  useEffect(() => {
    if (!postMenuId) return;
    function onDoc(e: MouseEvent) {
      if (postMenuRef.current && !postMenuRef.current.contains(e.target as Node)) {
        setPostMenuId('');
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [postMenuId]);

  async function saveEdit(post: FeedPost) {
    const next = window.prompt('Edit post', post.text);
    if (next == null) return;
    try {
      const data = await feedApi.edit(post.id, { text: next });
      if (data?.post) setPosts((prev) => prev.map((p) => (p.id === post.id ? mapPost(data.post, 0) : p)));
    } catch {
      alert('Could not edit post.');
    }
  }

  async function votePoll(postId: string, optionId: string) {
    try {
      const data = await feedApi.vote(postId, optionId);
      if (data?.post) setPosts((prev) => prev.map((p) => (p.id === postId ? mapPost({ ...data.post, poll: { ...(data.post.poll || {}), my_vote: data.post.my_vote } }, 0) : p)));
    } catch {
      /* ignore */
    }
  }

  async function runSearch(term: string) {
    const q = term.trim();
    if (!q) {
      setSearchHits(null);
      return;
    }
    try {
      const data = await socialSearchApi.search(q);
      setSearchHits({ people: data?.people || [], posts: data?.posts || [] });
    } catch {
      setSearchHits({ people: [], posts: [] });
    }
  }

  useEffect(() => {
    void runSearch(headerQuery);
  }, [headerQuery]);

  async function acceptFriend(uid: string) {
    try {
      await friendsApi.action(uid, 'accept');
      setIncoming((prev) => prev.filter((x) => x.user_id !== uid));
    } catch {
      /* ignore */
    }
  }

  if (!user) {
    return (
      <section
        id={id}
        className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-16"
      >
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Join the conversation
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Sign in or create an account to see posts, share updates, and connect with people.
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

  const storyPeople = stories.length
    ? stories
    : user?.id
      ? [{ authorId: String(user.id), author: 'Your story', mine: true, items: [] as StoryItem[] }]
      : [];

  function renderComment(c: Comment, nested = false) {
    return (
      <li key={c.id} className={nested ? 'rounded-xl bg-background/40 p-3 text-sm text-ink' : 'rounded-xl bg-background/60 p-3 text-sm text-ink'}>
        <div className="flex items-start justify-between gap-2">
          <p>
            <span className="font-semibold">{c.author}</span>
            {c.text ? <span className="text-muted"> · {c.text}</span> : null}
          </p>
          {c.when ? <span className="shrink-0 text-[11px] text-muted">{c.when}</span> : null}
        </div>
        {c.imageUrl ? (
          <img src={c.imageUrl} alt="" className="mt-2 max-h-40 rounded-md object-cover" />
        ) : null}
        {c.audioUrl ? <audio controls src={c.audioUrl} className="mt-2 w-full max-w-xs" /> : null}
        <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => void onLikeComment(c.id)}
            className={c.liked ? 'text-primary' : 'text-muted'}
          >
            Like{c.likes ? ` · ${c.likes}` : ''}
          </button>
          <button
            type="button"
            onClick={() => {
              setReplyToId(c.parentId || c.id);
              setReplyToName(c.author);
            }}
            className="text-muted hover:text-ink"
          >
            Reply
          </button>
        </div>
        {(c.replies || []).length ? (
          <ul className="mt-2 space-y-2 border-l border-black/10 pl-3">
            {(c.replies || []).map((r) => renderComment(r, true))}
          </ul>
        ) : null}
      </li>
    );
  }

  const photoTiles = posts
    .flatMap((p) => (p.imageUrls.length ? p.imageUrls : p.imageUrl ? [p.imageUrl] : []))
    .filter(Boolean)
    .slice(0, 8);
  const filteredContacts = messengerContacts.filter((c) =>
    !contactQ.trim() || String(c.name || '').toLowerCase().includes(contactQ.trim().toLowerCase()),
  );
  const brandLabel = String(title || 'Community').replace(/\s+Feed$/i, '') || 'Community';

  return (
    <section id={id} className={`bg-transparent social-feed--${arch} social-chrome--${chrome} ${designMods}`}>
      <div className={`mx-auto grid w-full gap-4 px-3 py-4 lg:items-start ${messengerFirst || chrome === 'community-forum' ? 'max-w-[1180px]' : 'max-w-5xl'} ${feedGridClass}`}>
        {showProfileRail ? (
          <aside className="hidden lg:block lg:sticky lg:top-[4.25rem] lg:self-start">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-black/5">
                <div
                  className="h-16 bg-gradient-to-br from-primary/55 via-primary/20 to-transparent"
                  style={
                    user?.cover_url
                      ? { backgroundImage: `url(${user.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : undefined
                  }
                />
                <div className="relative px-3 pb-3 pt-0">
                  <div className="-mt-7 flex items-end gap-2.5">
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-[color:var(--color-on-primary,#fff)] ring-4 ring-surface">
                      {user?.avatar || user?.avatar_url ? (
                        <img src={String(user.avatar || user.avatar_url)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        personInitials(String(user?.name || 'You'))
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="truncate text-sm font-bold text-ink">{user?.name || 'You'}</p>
                      <p className="truncate text-[11px] text-muted">Member · {brandLabel}</p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="mt-3 flex w-full items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
                  >
                    View profile
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl bg-surface p-3.5 shadow-sm ring-1 ring-black/5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Intro</p>
                <p className="mt-2 text-xs leading-relaxed text-ink/90">
                  Share updates, connect with friends, and stay in the loop on {brandLabel}.
                </p>
                <Link to="/profile" className="mt-2.5 inline-block text-xs font-semibold text-primary hover:underline">
                  Edit profile
                </Link>
              </div>
              {photoTiles.length ? (
                <div className="rounded-2xl bg-surface p-3.5 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Photos</p>
                    <Link to="/explore" className="text-[11px] font-semibold text-primary hover:underline">See all</Link>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-1">
                    {photoTiles.slice(0, 6).map((u, i) => (
                      <img key={`${u}-${i}`} src={u} alt="" className="aspect-square w-full rounded-md object-cover" />
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl bg-surface p-3.5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Friends</p>
                  <Link to="/friends" className="text-[11px] font-semibold text-primary hover:underline">See all</Link>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {(friendTiles.length ? friendTiles : suggestions).slice(0, 6).map((p: any) => (
                    <Link key={p.id || p.user_id} to={`/u/${p.id || p.user_id}`} className="flex flex-col items-center gap-1">
                      <span className="flex aspect-square w-full items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                        {personInitials(String(p.name || p.id || '?'))}
                      </span>
                      <span className="w-full truncate text-center text-[10px] text-ink">{p.name || p.id}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {chrome === 'community-forum' ? (
                <div className="rounded-2xl bg-surface p-3.5 shadow-sm ring-1 ring-black/5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Communities</p>
                  <ul className="mt-2 space-y-0.5 text-sm font-semibold">
                    <li><Link to="/groups" className="block rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">Browse groups</Link></li>
                    <li><Link to="/explore" className="block rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">Discover topics</Link></li>
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
        <div className="min-w-0 space-y-3">
          {storiesStyle !== 'stories-hidden' ? (
          <div
            className={
              storiesStyle === 'stories-rail'
                ? 'overflow-x-auto rounded-none border-b border-black/10 bg-transparent py-2'
                : storiesStyle === 'stories-peek'
                  ? 'overflow-x-auto rounded-xl bg-surface/70 p-2 ring-1 ring-black/5'
                  : 'overflow-x-auto rounded-2xl bg-surface p-3 ring-1 ring-black/5'
            }
          >
            <input
              ref={storyFileRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="hidden"
              onChange={(e) => void onStoryFile(e.target.files?.[0] || null)}
            />
            <div className={`flex min-w-max items-start ${storiesStyle === 'stories-peek' ? 'gap-2' : 'gap-3'}`}>
              {storyPeople.map((s, idx) => (
                <div key={s.authorId || idx} className={`flex flex-col items-center gap-1.5 text-center ${storiesStyle === 'stories-peek' ? 'w-12' : 'w-16'}`}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => onStoryRingClick(s, idx)}
                      className={`flex items-center justify-center overflow-hidden rounded-full text-sm font-bold ${
                        storiesStyle === 'stories-peek' ? 'h-10 w-10' : 'h-14 w-14'
                      } ${
                        s.mine && !s.items.length
                          ? 'border border-dashed border-primary/50 bg-background text-primary'
                          : s.items.length
                            ? 'bg-gradient-to-br from-primary/80 to-primary text-[color:var(--color-on-primary,#fff)] ring-2 ring-primary/30 ring-offset-2 ring-offset-surface'
                            : 'bg-black/10 text-muted'
                      }`}
                    >
                      {s.items[0]?.imageUrl ? (
                        <img src={s.items[0].imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : s.mine ? (
                        '+'
                      ) : (
                        String(s.author)
                          .split(/\s+/)
                          .map((p: string) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </button>
                    {s.mine ? (
                      <button
                        type="button"
                        aria-label="Add to your story"
                        onClick={() => storyFileRef.current?.click()}
                        className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-[color:var(--color-on-primary,#fff)] ring-2 ring-surface"
                      >
                        +
                      </button>
                    ) : null}
                  </div>
                  <span className="w-full truncate text-[11px] font-medium text-ink">
                    {s.mine ? 'Your story' : s.author}
                  </span>
                </div>
              ))}
            </div>
          </div>
          ) : null}

          <form
            id="compose"
            onSubmit={(e) => void onCreate(e)}
            className={
              effectiveComposer === 'composer-bar'
                ? 'rounded-full bg-surface px-3 py-2 ring-1 ring-black/5'
                : effectiveComposer === 'composer-minimal'
                  ? 'border-b border-black/10 bg-transparent py-2'
                  : effectiveComposer === 'composer-expanded'
                    ? 'rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5'
                    : 'rounded-2xl bg-surface p-3 ring-1 ring-black/5'
            }
          >
            <div className="flex gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {String(user?.name || 'Y')
                  .split(/\s+/)
                  .map((p: string) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                placeholder="What's on your mind?"
                className="w-full resize-none rounded-xl border border-black/10 bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {imageUrls.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
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
              <div className="relative mt-3 overflow-hidden rounded-md bg-black">
                <video src={videoUrl} controls className="max-h-64 w-full" />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white"
                  onClick={() => {
                    setVideoUrl('');
                    if (composerKind === 'video') setComposerKind('status');
                  }}
                >
                  Remove
                </button>
              </div>
            ) : null}
            {composerKind === 'video' && !videoUrl ? (
              <button
                type="button"
                onClick={() => videoFileRef.current?.click()}
                className="mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-8 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                <span>Choose a video to upload</span>
                <span className="text-xs font-normal text-muted">mp4, webm, or mov · max 40MB</span>
              </button>
            ) : null}
            {composerKind === 'feeling' ? (
              <input
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                placeholder="Feeling… (happy, grateful, focused)"
                className="mt-3 w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm"
              />
            ) : null}
            {composerKind === 'event' ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event title" className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
                <input value={eventWhen} onChange={(e) => setEventWhen(e.target.value)} placeholder="When" className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
                <input value={eventWhere} onChange={(e) => setEventWhere(e.target.value)} placeholder="Where" className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
              </div>
            ) : null}
            {composerKind === 'poll' ? (
              <div className="mt-3 space-y-2">
                <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll question" className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
                <textarea value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} rows={3} placeholder="One option per line" className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
              </div>
            ) : null}
            {composerKind === 'article' ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="Article title" className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
                <input value={articleUrl} onChange={(e) => setArticleUrl(e.target.value)} placeholder="https://…" className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3">
              <div className="flex flex-wrap items-center gap-1">
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*,.mp4,.webm,.mov,.m4v"
                  className="hidden"
                  onChange={(e) => {
                    void onPickVideo(e.target.files?.[0] || null);
                    e.target.value = '';
                  }}
                />
                <label className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
                  Photos
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
                {COMPOSER_ACTIONS.filter((a) => a.toLowerCase() !== 'photo' && a.toLowerCase() !== 'live').map((a) => {
                  const key = a.toLowerCase() === 'link' ? 'article' : a.toLowerCase() === 'story' ? 'story' : a.toLowerCase();
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        if (key === 'story') {
                          storyFileRef.current?.click();
                          return;
                        }
                        if (key === 'video') {
                          setComposerKind('video');
                          videoFileRef.current?.click();
                          return;
                        }
                        setComposerKind(composerKind === key ? 'status' : key);
                      }}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                        composerKind === key || (key === 'video' && videoUrl)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted hover:bg-black/5'
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
                {!COMPOSER_ACTIONS.some((a) => a.toLowerCase() === 'video') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setComposerKind('video');
                      videoFileRef.current?.click();
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      videoUrl || composerKind === 'video' ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'
                    }`}
                  >
                    Video
                  </button>
                ) : null}
                <input
                  type="datetime-local"
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                  className="rounded-lg border border-black/10 bg-background px-2 py-1 text-xs text-ink"
                  aria-label="Schedule post"
                />
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="rounded-lg border border-black/10 bg-background px-2 py-1 text-xs text-ink"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends</option>
                  <option value="only_me">Only me</option>
                </select>
              </div>
              <Button type="submit" disabled={busy || (!draft.trim() && !imageUrls.length && !videoUrl && !feeling && !articleUrl && composerKind !== 'poll' && composerKind !== 'event')}>
                {busy ? 'Posting…' : scheduledLocal ? 'Schedule' : 'Post'}
              </Button>
            </div>
          </form>

          {headerQuery ? (
            <div className="space-y-3">
              <p className="px-1 text-sm font-semibold text-ink">Results for “{headerQuery}”</p>
              {(searchHits?.people || []).length ? (
                <ul className="flex gap-3 overflow-x-auto pb-1">
                  {(searchHits?.people || []).slice(0, 10).map((p: any) => (
                    <li key={p.id} className="shrink-0">
                      <Link to={`/u/${p.id}`} className="flex w-20 flex-col items-center gap-1.5 text-center">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {personInitials(String(p.name || p.id))}
                        </span>
                        <span className="w-full truncate text-[11px] font-medium text-ink">{p.name || p.id}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className="space-y-4">
                {(searchHits?.posts || []).map((p: any) => (
                  <li key={p.id} className="rounded-2xl bg-surface p-4 ring-1 ring-black/5">
                    <p className="font-semibold text-ink">{p.author}</p>
                    {p.text ? <p className="mt-2 text-sm leading-relaxed text-ink">{p.text}</p> : null}
                  </li>
                ))}
              </ul>
              {searchHits && !searchHits.people?.length && !searchHits.posts?.length ? (
                <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted ring-1 ring-black/5">
                  No matches.
                </p>
              ) : null}
            </div>
          ) : feedLoading && !posts.length ? (
            <FeedSkeleton />
          ) : (
          <>
          <div className="flex items-center justify-between px-1">
            <div className="flex gap-1 rounded-full bg-surface p-0.5 ring-1 ring-black/5">
              <button type="button" onClick={() => setFeedSort('ranked')} className={`rounded-full px-3 py-1 text-xs font-semibold ${feedSort === 'ranked' ? 'bg-primary/10 text-primary' : 'text-muted'}`}>For you</button>
              <button type="button" onClick={() => setFeedSort('chrono')} className={`rounded-full px-3 py-1 text-xs font-semibold ${feedSort === 'chrono' ? 'bg-primary/10 text-primary' : 'text-muted'}`}>Latest</button>
            </div>
            {arch === 'creator' ? (
              <Link to="/reels" className="text-xs font-semibold text-primary hover:underline">Reels</Link>
            ) : null}
          </div>
          <ul className="space-y-4">
            {posts.filter((post) => !hiddenPostIds.includes(post.id)).map((post, postIdx) => (
              <motion.li
                key={post.id}
                initial={
                  motionStyle === 'calm'
                    ? { opacity: 0 }
                    : motionStyle === 'cinematic'
                      ? { opacity: 0, y: 28 }
                      : motionStyle === 'springy' || motionStyle === 'playful'
                        ? { opacity: 0, y: 16 }
                        : { opacity: 0, y: 12 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={
                  motionStyle === 'snappy'
                    ? { type: 'spring', stiffness: 420, damping: 28, delay: Math.min(postIdx, 6) * 0.03 }
                    : motionStyle === 'cinematic'
                      ? { type: 'spring', stiffness: 180, damping: 24, delay: Math.min(postIdx, 5) * 0.05 }
                      : motionStyle === 'springy'
                        ? { type: 'spring', stiffness: 320, damping: 18, delay: Math.min(postIdx, 6) * 0.04 }
                        : { duration: motionStyle === 'fade-rise' ? 0.45 : 0.28, delay: Math.min(postIdx, 6) * 0.04 }
                }
                className={`${postCardClass} ${postActions === 'actions-rail' ? 'relative pr-14' : ''} ${
                  mediaFrame === 'polaroid'
                    ? 'bg-white p-3 shadow-lg ring-1 ring-black/10'
                    : mediaFrame === 'film-border'
                      ? 'ring-2 ring-ink/80'
                      : mediaFrame === 'shadow-lift'
                        ? 'shadow-xl shadow-black/10'
                        : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {post.authorId ? (
                    <Link
                      to={`/u/${post.authorId}`}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-1 ring-black/5"
                      aria-label={`${post.author} profile`}
                    >
                      {personInitials(post.author)}
                    </Link>
                  ) : (
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {personInitials(post.author)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {post.authorId ? (
                        <Link to={`/u/${post.authorId}`} className="hover:underline">
                          {post.author}
                        </Link>
                      ) : (
                        post.author
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {post.when}
                      {post.privacy !== 'public' ? ` · ${post.privacy}` : ''}
                      {post.editedAt ? ' · edited' : ''}
                      {post.feeling ? ` · feeling ${post.feeling}` : ''}
                    </p>
                  </div>
                  {user?.id && post.authorId && post.authorId !== user.id ? (
                    <button
                      type="button"
                      onClick={() => void toggleFollowAuthor(post.authorId)}
                      className="shrink-0 rounded-lg bg-black/[0.06] px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-black/[0.1]"
                    >
                      {followingMap[post.authorId] ? 'Following' : 'Follow'}
                    </button>
                  ) : null}
                  <div className="relative shrink-0" ref={postMenuId === post.id ? postMenuRef : undefined}>
                    <button
                      type="button"
                      aria-label="Post menu"
                      aria-expanded={postMenuId === post.id}
                      onClick={() => setPostMenuId((cur) => (cur === post.id ? '' : post.id))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/[0.06] hover:text-ink"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <circle cx="5" cy="12" r="1.6" />
                        <circle cx="12" cy="12" r="1.6" />
                        <circle cx="19" cy="12" r="1.6" />
                      </svg>
                    </button>
                    {postMenuId === post.id ? (
                      <div
                        className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl bg-surface py-1 shadow-lg ring-1 ring-black/10"
                        role="menu"
                      >
                        {user?.id && (post.authorId === user.id || user.role === 'admin') ? (
                          <>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-sm font-medium text-ink hover:bg-black/[0.04]"
                              onClick={() => {
                                setPostMenuId('');
                                void saveEdit(post);
                              }}
                            >
                              Edit post
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                              onClick={() => void deletePost(post.id)}
                            >
                              Delete post
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full px-3.5 py-2.5 text-left text-sm font-medium text-ink hover:bg-black/[0.04]"
                          onClick={() => hidePost(post.id)}
                        >
                          Hide post
                        </button>
                        {user?.id && post.authorId && post.authorId !== user.id ? (
                          <>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-sm font-medium text-ink hover:bg-black/[0.04]"
                              onClick={() => notInterestedPost(post.id)}
                            >
                              Not interested
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-sm font-medium text-ink hover:bg-black/[0.04]"
                              onClick={() => void reportPost(post.id)}
                            >
                              Report post
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                {post.text ? <RichText text={post.text} /> : null}
                {post.event && (post.event.title || post.event.when || post.event.where) ? (
                  <div className="mt-3 rounded-xl border border-black/10 bg-background px-3 py-2 text-sm">
                    <p className="font-semibold text-ink">{post.event.title || 'Event'}</p>
                    <p className="text-muted">{[post.event.when, post.event.where].filter(Boolean).join(' · ')}</p>
                  </div>
                ) : null}
                {post.poll && Array.isArray(post.poll.options) && post.poll.options.length ? (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-sm font-semibold text-ink">{post.poll.question || 'Poll'}</p>
                    {post.poll.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => void votePoll(post.id, opt.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                          post.poll?.my_vote === opt.id ? 'border-primary bg-primary/10 text-primary' : 'border-black/10 bg-background'
                        }`}
                      >
                        <span>{opt.text}</span>
                        <span className="text-xs text-muted">{opt.votes || 0}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {post.articleUrl ? (
                  <a href={post.articleUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl border border-black/10 bg-background px-3 py-2 hover:bg-black/[0.03]">
                    <p className="text-sm font-semibold text-ink">{post.articleTitle || post.articleUrl}</p>
                    <p className="truncate text-xs text-primary">{post.articleUrl}</p>
                  </a>
                ) : null}
                {post.videoUrl ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="block w-full overflow-hidden rounded-md"
                      onClick={() => void openCommentSheet(post.id, { lightbox: true, mediaIndex: 0 })}
                      aria-label="View video"
                    >
                      <video src={post.videoUrl} className="max-h-[28rem] w-full bg-black object-cover" muted playsInline />
                    </button>
                    <button type="button" onClick={() => setReelId(post.id)} className="mt-1 text-xs font-semibold text-primary hover:underline">
                      Open vertical viewer
                    </button>
                  </div>
                ) : null}
                <PhotoGrid
                  urls={post.imageUrls.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : []}
                  onOpen={(i) => void openCommentSheet(post.id, { lightbox: true, mediaIndex: i })}
                />
                <div
                  className={
                    postActions === 'actions-stack'
                      ? 'mt-4 flex flex-col items-stretch gap-1 border-t border-black/5 pt-2'
                      : postActions === 'actions-rail'
                        ? 'absolute right-2 top-14 flex flex-col items-center gap-1'
                        : postActions === 'actions-split'
                          ? 'mt-4 flex items-center justify-between gap-2 border-t border-black/5 pt-3'
                          : postActions === 'actions-overflow'
                            ? 'mt-4 flex items-center gap-1'
                            : 'mt-4 flex flex-wrap items-center gap-1'
                  }
                >
                  <button
                    type="button"
                    onClick={() => void onLike(post.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold hover:bg-black/[0.04] ${
                      postActions === 'actions-stack' ? 'w-full justify-start' : ''
                    } ${post.liked ? 'text-primary' : 'text-muted'}`}
                    aria-label="Like"
                  >
                    <FeedActionIcon name="like" filled={post.liked} />
                    {postActions === 'actions-stack' ? <span>Like</span> : null}
                    {post.likes ? <span>{post.likes}</span> : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => void openCommentSheet(post.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-black/[0.04] ${
                      postActions === 'actions-stack' ? 'w-full justify-start' : ''
                    }`}
                    aria-label="Comment"
                  >
                    <FeedActionIcon name="comment" />
                    {postActions === 'actions-stack' ? <span>Comment</span> : null}
                    {post.commentsCount ? <span>{post.commentsCount}</span> : null}
                  </button>
                  {postActions === 'actions-overflow' ? (
                    <details className="relative ml-auto">
                      <summary className="cursor-pointer list-none rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-black/[0.04]">
                        More
                      </summary>
                      <div className="absolute right-0 z-20 mt-1 min-w-[9rem] rounded-xl bg-surface p-1 shadow-lg ring-1 ring-black/10">
                        <button
                          type="button"
                          onClick={() => void onShare(post.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted hover:bg-black/[0.04]"
                        >
                          <FeedActionIcon name="share" /> Share
                          {post.shares ? <span className="ml-auto text-xs">{post.shares}</span> : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onBookmark(post.id)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-black/[0.04] ${
                            post.bookmarked ? 'text-primary' : 'text-muted'
                          }`}
                        >
                          <FeedActionIcon name="bookmark" filled={post.bookmarked} /> Save
                        </button>
                      </div>
                    </details>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void onShare(post.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-black/[0.04] ${
                          postActions === 'actions-stack' ? 'w-full justify-start' : ''
                        }`}
                        aria-label="Share"
                      >
                        <FeedActionIcon name="share" />
                        {postActions === 'actions-stack' ? <span>Share</span> : null}
                        {post.shares ? <span>{post.shares}</span> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onBookmark(post.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold hover:bg-black/[0.04] ${
                          postActions === 'actions-stack' ? 'w-full justify-start' : ''
                        } ${postActions === 'actions-split' ? 'ml-auto' : ''} ${
                          post.bookmarked ? 'text-primary' : 'text-muted'
                        }`}
                        aria-label="Bookmark"
                      >
                        <FeedActionIcon name="bookmark" filled={post.bookmarked} />
                        {postActions === 'actions-stack' ? <span>Save</span> : null}
                      </button>
                    </>
                  )}
                </div>
                {commentsStyle === 'comments-inline' && commentSheetPostId === post.id && !postLightbox ? (
                  <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
                    <ul className="max-h-56 space-y-2 overflow-y-auto">
                      {(comments[post.id] || []).map((c) => renderComment(c))}
                      {!comments[post.id]?.length ? (
                        <li className="py-2 text-center text-sm text-muted">No comments yet.</li>
                      ) : null}
                    </ul>
                    <div className="flex items-center gap-1">
                      <input
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Write a comment"
                        className="min-w-0 flex-1 rounded-full border border-black/10 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <Button type="button" onClick={() => void submitComment(post.id)}>
                        Post
                      </Button>
                    </div>
                  </div>
                ) : null}
              </motion.li>
            ))}
          </ul>
          </>
          )}
          {!headerQuery && !feedLoading && !posts.length ? (
            <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted ring-1 ring-black/5">
              No posts yet. Be the first to share something.
            </p>
          ) : null}
          {!headerQuery ? (
            <>
              <div ref={loadMoreRef} className="h-8" />
              {loadingMore ? <FeedSkeleton rows={2} /> : null}
            </>
          ) : null}
        </div>

        {messengerFirst ? (
        <aside className="hidden lg:block lg:sticky lg:top-[4.25rem] lg:self-start">
          <div className="flex h-[calc(100vh-5.5rem)] flex-col overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-black/5 bg-primary/10 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">Messenger</span>
                <span aria-hidden className="text-xs text-muted">✎</span>
              </div>
              <Link to="/messages" className="text-xs font-semibold text-primary hover:underline">Open</Link>
            </div>
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1.5 py-2">
              {filteredContacts.length
                ? filteredContacts.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={c.threadId ? `/messages?thread=${encodeURIComponent(c.threadId)}` : '/messages'}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-black/[0.04]"
                      >
                        <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                          {personInitials(String(c.name))}
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{c.name}</span>
                        {c.time ? <span className="shrink-0 text-[10px] text-muted">{c.time}</span> : null}
                      </Link>
                    </li>
                  ))
                : friendTiles.length
                  ? friendTiles.slice(0, 8).map((p: any) => (
                      <li key={p.id || p.user_id}>
                        <Link to="/messages" className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-black/[0.04]">
                          <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                            {personInitials(String(p.name || p.id))}
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name || p.id}</span>
                        </Link>
                      </li>
                    ))
                  : (
                    <li className="px-2 py-6 text-center text-xs text-muted">No conversations yet.</li>
                  )}
            </ul>
            <div className="flex items-center gap-2 border-t border-black/5 p-2">
              <input
                value={contactQ}
                onChange={(e) => setContactQ(e.target.value)}
                placeholder="Search for friends..."
                className="min-w-0 flex-1 rounded-full border border-black/10 bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Link
                to="/messages"
                aria-label="New message"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-[color:var(--color-on-primary,#fff)]"
              >
                +
              </Link>
            </div>
          </div>
        </aside>
        ) : !singleCol ? (
        <aside className="hidden lg:block lg:sticky lg:top-[4.25rem] lg:self-start">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl bg-surface shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.06]">
              <div className="h-16 bg-gradient-to-br from-primary/35 via-primary/12 to-transparent" />
              <div className="-mt-8 px-4 pb-4">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-sm font-bold text-[color:var(--color-on-primary,#fff)] ring-4 ring-surface">
                  {personInitials(String(user?.name || 'You'))}
                </span>
                <p className="mt-2 truncate text-sm font-semibold text-ink">{user?.name || 'You'}</p>
                <Link to="/profile" className="text-xs font-semibold text-primary hover:underline">
                  View profile
                </Link>
              </div>
            </div>

            {incoming.length ? (
              <div className="rounded-3xl bg-surface p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.06]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Friend requests</p>
                <ul className="mt-3 space-y-3">
                  {incoming.map((r) => (
                    <li key={r.id || r.user_id} className="flex items-center gap-2.5">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                        {personInitials(String(r.name || r.user_id || '?'))}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{r.name || r.user_id}</span>
                      <button
                        type="button"
                        onClick={() => void acceptFriend(String(r.user_id))}
                        className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-[color:var(--color-on-primary,#fff)]"
                      >
                        Accept
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {suggestions.length ? (
              <div className="rounded-3xl bg-surface p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.06]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">People you may know</p>
                  <Link to="/friends" className="text-xs font-semibold text-primary hover:underline">
                    See all
                  </Link>
                </div>
                <ul className="mt-3 space-y-3">
                  {suggestions.map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                        {personInitials(String(p.name || p.id))}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link to={`/u/${p.id}`} className="block truncate text-sm font-medium text-ink hover:underline">
                          {p.name || p.id}
                        </Link>
                        <p className="truncate text-[11px] text-muted">{p.reason || 'Suggested for you'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await friendsApi.request(p.id);
                            setSuggestions((prev) => prev.filter((x) => x.id !== p.id));
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-3xl bg-surface p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.06]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Shortcuts</p>
              <ul className="mt-2 space-y-1 text-sm font-semibold">
                <li><Link to="/explore" className="block rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">Explore</Link></li>
                <li><Link to="/saved" className="block rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">Saved</Link></li>
                <li><Link to="/notifications" className="block rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">Notifications</Link></li>
                {arch === 'professional' ? <li><Link to="/jobs" className="block rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">Jobs</Link></li> : null}
                {arch === 'creator' ? <li><Link to="/reels" className="block rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">Reels</Link></li> : null}
              </ul>
            </div>

            <div className="rounded-3xl bg-surface p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.06]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Alerts</p>
                {unread ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-[color:var(--color-on-primary,#fff)]">
                    {unread}
                  </span>
                ) : null}
              </div>
              <ul className="mt-3 space-y-3">
                {notifs.length === 0 ? (
                  <li className="text-sm text-muted">No alerts yet.</li>
                ) : (
                  notifs.slice(0, 6).map((n) => (
                    <li key={n.id} className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                      <div className="min-w-0">
                        <p className="text-sm leading-snug text-ink">{n.text}</p>
                        {n.time ? <p className="mt-0.5 text-[11px] text-muted">{n.time}</p> : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>
              {unread ? (
                <button
                  type="button"
                  onClick={() => {
                    void notificationsApi.markRead().then(() => setUnread(0));
                  }}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          </div>
        </aside>
        ) : null}
      </div>
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {commentSheetPostId && postLightbox ? (
                <motion.div
                  key="post-lightbox-root"
                  className="post-lightbox fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-8"
                  style={{ position: 'fixed', inset: 0 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
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
                    const mediaUrls = lbPost.imageUrls.length
                      ? lbPost.imageUrls
                      : lbPost.imageUrl
                        ? [lbPost.imageUrl]
                        : [];
                    const hasVideo = Boolean(lbPost.videoUrl);
                    const hasMedia = hasVideo || mediaUrls.length > 0;
                    const mediaIdx = Math.min(lightboxMediaIndex, Math.max(0, mediaUrls.length - 1));
                    return (
                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Post"
                        className={`relative z-[205] flex w-full overflow-hidden rounded-xl bg-black shadow-2xl ${
                          hasMedia
                            ? 'h-[min(92vh,900px)] max-h-[min(92vh,900px)] max-w-5xl flex-col md:flex-row'
                            : 'max-h-[min(92vh,900px)] max-w-lg flex-col bg-surface'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {hasMedia ? (
                          <div className="relative flex max-h-[42vh] min-h-0 flex-none items-center justify-center bg-black md:max-h-none md:min-h-0 md:min-w-0 md:flex-1">
                            {hasVideo && mediaUrls.length === 0 ? (
                              <video
                                src={lbPost.videoUrl}
                                controls
                                autoPlay
                                className="max-h-[42vh] w-full object-contain md:max-h-full"
                              />
                            ) : (
                              <img
                                src={mediaUrls[mediaIdx]}
                                alt=""
                                className="max-h-[42vh] w-full object-contain md:max-h-full"
                              />
                            )}
                            {mediaUrls.length > 1 ? (
                              <>
                                <button
                                  type="button"
                                  aria-label="Previous photo"
                                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow"
                                  onClick={() =>
                                    setLightboxMediaIndex((i) => (i - 1 + mediaUrls.length) % mediaUrls.length)
                                  }
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
                                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                                  {mediaUrls.map((_, i) => (
                                    <span
                                      key={i}
                                      className={`h-1.5 w-1.5 rounded-full ${i === mediaIdx ? 'bg-white' : 'bg-white/40'}`}
                                    />
                                  ))}
                                </div>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                        <div
                          className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface ${
                            hasMedia ? 'md:w-[22rem] md:flex-none md:self-stretch lg:w-[24rem]' : ''
                          }`}
                        >
                          <div className="flex shrink-0 items-center gap-3 border-b border-black/5 px-4 py-3">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                              {personInitials(lbPost.author)}
                            </span>
                            <div className="min-w-0 flex-1">
                              {lbPost.authorId ? (
                                <Link
                                  to={`/u/${lbPost.authorId}`}
                                  className="truncate text-sm font-semibold text-ink hover:underline"
                                  onClick={closeCommentSheet}
                                >
                                  {lbPost.author}
                                </Link>
                              ) : (
                                <p className="truncate text-sm font-semibold text-ink">{lbPost.author}</p>
                              )}
                              <p className="text-xs text-muted">{lbPost.when}</p>
                            </div>
                          </div>
                          <div className="lightbox-comments-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
                            {lbPost.text ? (
                              <div className="flex gap-3">
                                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                  {personInitials(lbPost.author)}
                                </span>
                                <div className="min-w-0 pt-0.5">
                                  <p className="text-sm text-ink">
                                    <span className="font-semibold">{lbPost.author}</span>{' '}
                                    <span className="whitespace-pre-wrap">{lbPost.text}</span>
                                  </p>
                                </div>
                              </div>
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
                              <button
                                type="button"
                                onClick={() => void onLike(lbPost.id)}
                                className={`rounded-full p-2 hover:bg-black/[0.04] ${lbPost.liked ? 'text-primary' : 'text-ink'}`}
                                aria-label="Like"
                              >
                                <FeedActionIcon name="like" filled={lbPost.liked} />
                              </button>
                              <button
                                type="button"
                                onClick={focusLightboxComment}
                                className="rounded-full p-2 text-ink hover:bg-black/[0.04]"
                                aria-label="Comment"
                              >
                                <FeedActionIcon name="comment" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void onShare(lbPost.id)}
                                className="rounded-full p-2 text-ink hover:bg-black/[0.04]"
                                aria-label="Share"
                              >
                                <FeedActionIcon name="share" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void onBookmark(lbPost.id)}
                                className={`ml-auto rounded-full p-2 hover:bg-black/[0.04] ${
                                  lbPost.bookmarked ? 'text-primary' : 'text-ink'
                                }`}
                                aria-label="Bookmark"
                              >
                                <FeedActionIcon name="bookmark" filled={lbPost.bookmarked} />
                              </button>
                            </div>
                            <p className="px-2 text-sm font-semibold text-ink">
                              {lbPost.likes ? `${lbPost.likes} like${lbPost.likes === 1 ? '' : 's'}` : 'Be the first to like'}
                            </p>
                            <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted">{lbPost.when}</p>
                          </div>
                          <div className="shrink-0 space-y-2 border-t border-black/5 p-3">
                            {replyToId ? (
                              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                                <span>Replying to {replyToName || 'comment'}</span>
                                <button
                                  type="button"
                                  className="font-semibold hover:text-ink"
                                  onClick={() => {
                                    setReplyToId('');
                                    setReplyToName('');
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : null}
                            {showEmoji ? (
                              <div className="grid max-h-36 grid-cols-8 gap-1 overflow-y-auto rounded-xl bg-background p-2 ring-1 ring-black/10">
                                {EMOJIS.map((em) => (
                                  <button
                                    key={em}
                                    type="button"
                                    className="rounded-md p-1 text-lg leading-none hover:bg-black/5"
                                    onClick={() => setCommentDraft((d) => d + em)}
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="Add emoji"
                                aria-expanded={showEmoji}
                                onClick={() => setShowEmoji((v) => !v)}
                                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                  showEmoji ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-black/5'
                                }`}
                              >
                                <EmojiIcon />
                              </button>
                              <input
                                ref={lightboxCommentRef}
                                value={commentDraft}
                                onChange={(e) => setCommentDraft(e.target.value)}
                                placeholder={replyToId ? `Reply to ${replyToName || 'comment'}` : 'Add a comment...'}
                                className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void submitComment(commentSheetPostId);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={!commentDraft.trim() && !commentImage && !commentAudio}
                                onClick={() => void submitComment(commentSheetPostId)}
                                className="shrink-0 px-2 text-sm font-semibold text-primary disabled:opacity-40"
                              >
                                Post
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 px-1 text-xs">
                              <label className="cursor-pointer font-semibold text-primary hover:underline">
                                Photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => void uploadCommentMedia(e.target.files?.[0] || null, 'image')}
                                />
                              </label>
                              {commentImage ? <img src={commentImage} alt="" className="h-8 w-8 rounded object-cover" /> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
      <AnimatePresence>
        {storyViewer && stories[storyViewer.ring]?.items?.[storyViewer.item] ? (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
              <p className="truncate text-sm font-semibold">
                {stories[storyViewer.ring].mine ? 'Your story' : stories[storyViewer.ring].author}
                <span className="ml-2 font-normal text-white/60">
                  {stories[storyViewer.ring].items[storyViewer.item].time}
                </span>
              </p>
              <button
                type="button"
                aria-label="Close story"
                onClick={() => setStoryViewer(null)}
                className="rounded-md px-2 py-1 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              {stories[storyViewer.ring].items[storyViewer.item].videoUrl ? (
                <video
                  src={stories[storyViewer.ring].items[storyViewer.item].videoUrl}
                  autoPlay
                  controls
                  className="h-full w-full object-contain"
                />
              ) : (
                <img
                  src={stories[storyViewer.ring].items[storyViewer.item].imageUrl}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}
              <button
                type="button"
                aria-label="Previous story"
                className="absolute inset-y-0 left-0 w-1/3"
                onClick={() => advanceStory(-1)}
              />
              <button
                type="button"
                aria-label="Next story"
                className="absolute inset-y-0 right-0 w-1/3"
                onClick={() => advanceStory(1)}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {reelId ? (
          <motion.div className="fixed inset-0 z-[85] flex items-center justify-center bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close reel" className="absolute right-4 top-4 z-10 rounded-md px-2 py-1 text-sm font-semibold text-white/80 hover:bg-white/10" onClick={() => setReelId(null)}>Close</button>
            {(() => {
              const reel = posts.find((p) => p.id === reelId) || posts.filter((p) => p.videoUrl)[0];
              if (!reel?.videoUrl) return <p className="text-white">No video</p>;
              return (
                <div className="flex h-[90vh] w-full max-w-sm flex-col justify-center">
                  <video src={reel.videoUrl} autoPlay controls className="max-h-[90vh] w-full object-contain" />
                  <p className="mt-2 px-3 text-sm text-white">{reel.text}</p>
                </div>
              );
            })()}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { friendsApi, mediaApi, messagesApi, presenceApi, profileApi, socialEventsApi, socialPollApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

type Thread = { id: string; name: string; preview: string; time: string; unread?: number; peerId?: string; kind?: string };
type Message = { id: string; from: 'me' | 'them'; text: string; time: string; status?: string; imageUrl?: string; imageUrls?: string[]; audioUrl?: string; edited?: boolean; deleted?: boolean; ts?: number };
type Contact = { id: string; name: string };

function initials(name: string) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function hueFrom(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function normalizeThread(raw: any, idx: number): Thread {
  return {
    id: String(raw?.id || `thread-${idx + 1}`),
    name: String(raw?.name || raw?.title || 'Conversation'),
    preview: String(raw?.preview || raw?.last_message || raw?.snippet || ''),
    time: String(raw?.time || raw?.updated_at || raw?.time_label || ''),
    unread: Number(raw?.unread || 0) || undefined,
    peerId: raw?.peer_id ? String(raw.peer_id) : undefined,
    kind: String(raw?.kind || 'dm'),
  };
}

function normalizeMessage(raw: any, idx: number, myId = ''): Message {
  const fromRaw = String(raw?.from || raw?.role || raw?.sender_id || '').toLowerCase();
  const from: 'me' | 'them' =
    fromRaw === 'me' ||
    fromRaw === 'user' ||
    fromRaw === 'self' ||
    (myId && fromRaw === String(myId).toLowerCase())
      ? 'me'
      : 'them';
  return {
    id: String(raw?.id || `m${idx + 1}`),
    from,
    text: String(raw?.text || raw?.body || raw?.content || ''),
    time: String(raw?.time || raw?.created_at || ''),
    status: raw?.status ? String(raw.status) : from === 'me' ? 'sent' : undefined,
    imageUrl: raw?.image_url || raw?.imageUrl ? String(raw.image_url || raw.imageUrl) : undefined,
    imageUrls: Array.isArray(raw?.image_urls)
      ? raw.image_urls.map((u: any) => String(u || '')).filter(Boolean)
      : raw?.image_url || raw?.imageUrl
        ? [String(raw.image_url || raw.imageUrl)]
        : undefined,
    audioUrl: raw?.audio_url || raw?.audioUrl ? String(raw.audio_url || raw.audioUrl) : undefined,
    edited: Boolean(raw?.edited_at),
    deleted: Boolean(raw?.deleted),
    ts: Number(raw?.ts || 0) || undefined,
  };
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const h = hueFrom(name);
  const dim = size === 'lg' ? 'h-11 w-11 text-sm' : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ${dim}`}
      style={{ background: `linear-gradient(145deg, hsl(${h} 62% 46%), hsl(${(h + 40) % 360} 55% 38%))` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function Bubble({
  message,
  showTail,
  reduceMotion,
  mineClass,
  themClass,
}: {
  message: Message;
  showTail: boolean;
  reduceMotion: boolean | null;
  mineClass?: string;
  themClass?: string;
}) {
  const mine = message.from === 'me';
  const radius = mine
    ? showTail
      ? 'rounded-2xl rounded-br-md'
      : 'rounded-2xl'
    : showTail
      ? 'rounded-2xl rounded-bl-md'
      : 'rounded-2xl';
  const body = (
    <div
      className={`relative max-w-[min(78%,26rem)] px-3 py-2 text-[15px] leading-snug shadow-sm ${radius} ${
        mine
          ? mineClass || 'bg-primary text-[color:var(--color-on-primary,#fff)]'
          : themClass || 'bg-[color-mix(in_srgb,var(--color-ink)_10%,var(--color-surface))] text-ink ring-1 ring-black/10'
      }`}
    >
      {message.deleted ? (
        <p className="italic opacity-70">Message unsent</p>
      ) : message.text ? (
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      ) : null}
      {message.edited && !message.deleted ? (
        <span className="ml-1 text-[10px] opacity-70">edited</span>
      ) : null}
      {(message.imageUrls && message.imageUrls.length) || message.imageUrl ? (
        message.imageUrls && message.imageUrls.length > 1 ? (
          <div className="mt-1.5 grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
            {message.imageUrls.slice(0, 4).map((u, i) => (
              <div key={`${u}-${i}`} className="relative">
                <img src={u} alt="" className="h-28 w-full object-cover" />
                {i === 3 && message.imageUrls && message.imageUrls.length > 4 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-semibold text-white">
                    +{message.imageUrls.length - 4}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <img
            src={(message.imageUrls && message.imageUrls[0]) || message.imageUrl}
            alt=""
            className="mt-1.5 max-h-56 w-full rounded-xl object-cover"
          />
        )
      ) : null}
      {message.audioUrl ? (
        <audio controls src={message.audioUrl} className="mt-1.5 w-full max-w-xs" />
      ) : null}
      <span
        className={`mt-1 flex items-center justify-end gap-1 text-[10px] leading-none ${
          mine ? 'text-white/80' : 'text-muted'
        }`}
      >
        {message.time}
        {mine ? (
          <span aria-hidden className="tracking-tight">
            {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
          </span>
        ) : null}
      </span>
    </div>
  );
  if (reduceMotion) return body;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {body}
    </motion.div>
  );
}

export function ChatShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  // Messenger: live members only — no placeholder threads or fake participants.
  const useLive = Boolean(INTENT.modules?.includes?.('messenger') || INTENT.social);
  const { user } = useAuth();
  const myId = String(user?.id || '');
  const reduceMotion = useReducedMotion();
  const mDesign = ((INTENT as any).messengerDesign && typeof (INTENT as any).messengerDesign === 'object')
    ? ((INTENT as any).messengerDesign as Record<string, string>)
    : {};
  const mSkin = String((INTENT as any).messengerSkin || mDesign.skin || 'classic-dm');
  const mShell = String(mDesign.shell || 'list-chat');
  const mNavRail = String(mDesign.nav_rail || 'none');
  const mBubbles = String(mDesign.bubbles || 'neutral-rounded');
  const mChatBg = String(mDesign.chat_bg || 'solid-soft');
  const mFilters = String(mDesign.filters || 'none');
  const mHeader = String(mDesign.header || 'identity-status');
  const mComposer = String(mDesign.composer || 'pill-attach');
  const designMods = [
    mShell ? `messenger-shell--${mShell}` : '',
    mNavRail ? `messenger-nav--${mNavRail}` : '',
    mDesign.list_style ? `messenger-list--${mDesign.list_style}` : '',
    mFilters ? `messenger-filters--${mFilters}` : '',
    mHeader ? `messenger-header--${mHeader}` : '',
    mComposer ? `messenger-composer--${mComposer}` : '',
    mBubbles ? `messenger-bubbles--${mBubbles}` : '',
    mChatBg ? `messenger-bg--${mChatBg}` : '',
    mDesign.density ? `messenger-density--${mDesign.density}` : '',
    mDesign.surface ? `messenger-surface--${mDesign.surface}` : '',
    mSkin ? `messenger-skin--${mSkin}` : '',
  ].filter(Boolean).join(' ');
  const showIconRail = mNavRail !== 'none' && (mShell === 'rail-list-chat' || mShell === 'rail-chat' || mShell === 'topnav-list-chat');
  // WhatsApp/Telegram style: list + chat only. Details is an optional overlay, never a forced third column.
  const showDetailsPane = false;
  const gridClass =
    mShell === 'rail-list-chat'
      ? 'lg:grid-cols-[4.25rem_minmax(18rem,22rem)_minmax(0,1fr)]'
      : mShell === 'rail-chat'
        ? 'lg:grid-cols-[4.25rem_minmax(0,1fr)]'
        : mShell === 'focus-chat'
          ? 'lg:grid-cols-[minmax(14rem,16rem)_minmax(0,1fr)]'
          : mShell === 'compact-dual'
            ? 'lg:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)]'
            : mShell === 'topnav-list-chat'
              ? 'lg:grid-cols-[minmax(18rem,20rem)_minmax(0,1fr)]'
              : 'lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)]';
  const bubbleMine =
    mBubbles === 'whatsapp-green'
      ? 'bg-[#005c4b] text-white'
      : mBubbles === 'telegram-blue'
        ? 'bg-[#2b5278] text-white'
        : mBubbles === 'signal-simple'
          ? 'bg-primary text-[color:var(--color-on-primary,#fff)]'
          : mBubbles === 'sharp-modern'
            ? 'rounded-md bg-primary text-[color:var(--color-on-primary,#fff)]'
            : 'bg-primary text-[color:var(--color-on-primary,#fff)]';
  const bubbleThem =
    mChatBg === 'solid-dark'
      ? 'bg-zinc-700 text-zinc-50 ring-1 ring-white/10'
      : mBubbles === 'whatsapp-green'
        ? 'bg-[#202c33] text-[#e9edef] ring-1 ring-white/5'
        : mBubbles === 'telegram-blue'
          ? 'bg-[#182533] text-[#e4ecf2] ring-1 ring-white/5'
          : 'bg-[color-mix(in_srgb,var(--color-ink)_12%,var(--color-surface))] text-ink shadow-sm ring-1 ring-black/10';
  const chatPaneBg =
    mChatBg === 'doodle'
      ? 'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.06)_1px,transparent_0)] bg-[length:18px_18px] bg-background'
      : mChatBg === 'solid-dark'
        ? 'bg-zinc-900 text-zinc-100'
        : mChatBg === 'wash'
          ? 'bg-gradient-to-b from-primary/5 to-background'
          : mChatBg === 'pattern-light'
            ? 'bg-[linear-gradient(135deg,rgba(0,0,0,0.03)_25%,transparent_25%),linear-gradient(225deg,rgba(0,0,0,0.03)_25%,transparent_25%)] bg-[length:24px_24px] bg-background'
            : 'bg-background';
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState('');
  const [draft, setDraft] = useState('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [status, setStatus] = useState('');
  const [mobilePane, setMobilePane] = useState<'list' | 'chat' | 'details'>('list');
  const [showDetails, setShowDetails] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [attachAudio, setAttachAudio] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsBusy, setContactsBusy] = useState(false);
  const [peerTyping, setPeerTyping] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const threadsLoadedRef = useRef(false);
  const typingPing = useRef<number | undefined>(undefined);
  const typingClear = useRef<number | undefined>(undefined);

  function notePeerTyping(name: string) {
    setPeerTyping(name || 'Someone');
    window.clearTimeout(typingClear.current);
    typingClear.current = window.setTimeout(() => setPeerTyping(''), 4500);
  }

  function pingTyping(threadId: string) {
    window.clearTimeout(typingPing.current);
    typingPing.current = window.setTimeout(() => {
      void messagesApi.typing(threadId).catch(() => undefined);
    }, 280);
  }

  const mergeMessages = useCallback((threadId: string, incoming: Message[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const existing = prev[threadId] || [];
      const byId = new Map(existing.map((m) => [m.id, m]));
      for (const m of incoming) {
        const prevMsg = byId.get(m.id);
        if (!prevMsg) {
          byId.set(m.id, m);
          continue;
        }
        // Never let a thin poll payload wipe photos/audio already on screen.
        const imageUrls =
          (m.imageUrls && m.imageUrls.length ? m.imageUrls : undefined) ||
          (m.imageUrl ? [m.imageUrl] : undefined) ||
          prevMsg.imageUrls ||
          (prevMsg.imageUrl ? [prevMsg.imageUrl] : undefined);
        byId.set(m.id, {
          ...prevMsg,
          ...m,
          text: m.text || prevMsg.text,
          imageUrl: m.imageUrl || imageUrls?.[0] || prevMsg.imageUrl,
          imageUrls,
          audioUrl: m.audioUrl || prevMsg.audioUrl,
        });
      }
      const merged = Array.from(byId.values());
      merged.sort((a, b) => {
        const ta = Number(a.ts || String(a.id).replace(/\D/g, '') || 0);
        const tb = Number(b.ts || String(b.id).replace(/\D/g, '') || 0);
        return ta - tb;
      });
      return { ...prev, [threadId]: merged };
    });
  }, []);

  const loadThreads = useCallback(async () => {
    if (!useLive || !user?.id) return;
    try {
      const data = await messagesApi.listThreads();
      const list = Array.isArray(data?.threads) ? data.threads : Array.isArray(data) ? data : [];
      const next = list.map(normalizeThread);
      setThreads(next);
      threadsLoadedRef.current = true;
      if (!next.length) {
        setStatus('');
        return;
      }
      setStatus('');
      setActiveId((prev) => (prev && next.some((t) => t.id === prev) ? prev : ''));
      const bundleMsgs = data?.messages && typeof data.messages === 'object' ? data.messages : null;
      if (bundleMsgs) {
        for (const [tid, arr] of Object.entries(bundleMsgs)) {
          mergeMessages(
            tid,
            (Array.isArray(arr) ? arr : []).map((m, i) => normalizeMessage(m, i, myId)),
          );
        }
      }
    } catch {
      if (!threadsLoadedRef.current) setStatus('Could not load conversations.');
    }
  }, [useLive, user?.id, myId, mergeMessages]);

  async function uploadAttach(files: FileList | File[] | File | null, kind: 'image' | 'audio') {
    const list = !files ? [] : files instanceof File ? [files] : Array.from(files);
    if (!list.length) return;
    try {
      if (kind === 'audio') {
        const data = await mediaApi.upload(list[0], 'audio');
        const url = String(data?.url || '');
        if (url) setAttachAudio(url);
        return;
      }
      const next = [...attachImages];
      for (const file of list) {
        if (next.length >= 10) break;
        const data = await mediaApi.upload(file, 'chat');
        const url = String(data?.url || '');
        if (url && !next.includes(url)) next.push(url);
      }
      setAttachImages(next.slice(0, 10));
    } catch {
      setStatus('Media upload failed.');
    }
  }

  useEffect(() => {
    if (!useLive || !user?.id) {
      setThreads([]);
      setMessages({});
      setActiveId('');
      threadsLoadedRef.current = false;
      return;
    }
    void loadThreads();
  }, [useLive, user?.id, loadThreads]);

  useEffect(() => {
    if (!user?.id) return;
    void presenceApi.heartbeat().catch(() => undefined);
    const t = window.setInterval(() => void presenceApi.heartbeat().catch(() => undefined), 20000);
    return () => window.clearInterval(t);
  }, [user?.id]);

  useEffect(() => {
    if (!useLive || !activeId || mobilePane !== 'chat') return;
    let cancelled = false;
    (async () => {
      try {
        const data = await messagesApi.listMessages(activeId);
        const list = Array.isArray(data?.messages) ? data.messages : Array.isArray(data) ? data : [];
        if (cancelled) return;
        if (list.length) {
          mergeMessages(activeId, list.map((m, i) => normalizeMessage(m, i, myId)));
        } else {
          setMessages((prev) => ({ ...prev, [activeId]: prev[activeId] || [] }));
        }
        void messagesApi.markRead(activeId).catch(() => undefined);
        const peerRead = Number(data?.peer_last_read || 0);
        if (peerRead) {
          setMessages((prev) => ({
            ...prev,
            [activeId]: (prev[activeId] || []).map((m) =>
              m.from === 'me' && (m.ts || 0) <= peerRead ? { ...m, status: 'read' } : m,
            ),
          }));
        }
      } catch {
        /* keep cached */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useLive, activeId, myId, mobilePane, mergeMessages]);

  useEffect(() => {
    if (!useLive || !activeId || !user?.id || mobilePane !== 'chat') return;
    let cancelled = false;
    let threadSince = 0;
    let pollTimer: number | undefined;
    let es: EventSource | null = null;

    const refreshThread = async () => {
      try {
        const data = await socialPollApi.poll({
          thread_id: activeId,
          feed_since: threadSince || undefined,
        });
        if (cancelled) return;
        const list = Array.isArray(data?.messages) ? data.messages : [];
        if (list.length) {
          mergeMessages(activeId, list.map((m: any, i: number) => normalizeMessage(m, i, myId)));
          const maxTs = list.reduce((m: number, x: any) => Math.max(m, Number(x?.ts || 0)), 0);
          if (maxTs) threadSince = maxTs;
        } else if (data?.thread_ts) {
          threadSince = Number(data.thread_ts);
        }
        const others = Array.isArray(data?.typing)
          ? data.typing.filter((t: any) => String(t?.user_id || '') !== myId)
          : [];
        if (others.length) notePeerTyping(String(others[0]?.name || 'Someone'));
      } catch {
        /* ignore */
      }
    };

    const startPoll = () => {
      if (pollTimer || cancelled) return;
      pollTimer = window.setInterval(() => {
        void refreshThread();
      }, 2500);
    };

    setPeerTyping('');
    void refreshThread();
    try {
      es = socialEventsApi.connect((ev) => {
        const type = String(ev?.type || '');
        const nested = ev?.data && typeof ev.data === 'object' ? ev.data : null;
        if (type === 'typing') {
          const tid = String(ev?.thread_id || nested?.thread_id || '');
          const uid = String(ev?.user_id || nested?.user_id || '');
          if (tid === activeId && uid && uid !== myId) {
            notePeerTyping(String(ev?.name || nested?.name || 'Someone'));
          }
          return;
        }
        if (type === 'message' || type === 'notification' || !type) {
          void refreshThread();
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
      }
    } catch {
      /* poll below */
    }
    startPoll();

    return () => {
      cancelled = true;
      try {
        es?.close();
      } catch {
        /* ignore */
      }
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [useLive, activeId, user?.id, myId, mobilePane, mergeMessages]);

  async function loadContacts(term = '') {
    setContactsBusy(true);
    try {
      const q = term.trim();
      const friendsData = await friendsApi.list();
      const usersData = q.length >= 2 ? await profileApi.list(q) : { users: [] };
      const seen = new Set<string>();
      const out: Contact[] = [];
      const push = (raw: any) => {
        const cid = String(raw?.user_id || raw?.id || '').trim();
        const name = String(raw?.name || raw?.display_name || '').trim();
        if (!cid || cid === myId || seen.has(cid)) return;
        if (String(raw?.friendship || raw?.status || '') === 'blocked') return;
        seen.add(cid);
        out.push({ id: cid, name: name || 'Member' });
      };
      for (const f of friendsData?.friends || []) push(f);
      if (q.length >= 2) {
        for (const u of usersData?.users || usersData?.people || []) push(u);
      }
      setContacts(out);
    } catch {
      setContacts([]);
    } finally {
      setContactsBusy(false);
    }
  }

  async function startConversation(peerId: string) {
    try {
      const data = await messagesApi.openDm(peerId);
      const thread = data?.thread ? normalizeThread(data.thread, 0) : null;
      if (!thread) return;
      setThreads((prev) => {
        const rest = prev.filter((t) => t.id !== thread.id);
        return [thread, ...rest];
      });
      setShowNewChat(false);
      setContactQuery('');
      openThread(thread.id);
      void loadThreads();
    } catch {
      setStatus('Cannot message this person.');
    }
  }

  useEffect(() => {
    if (showNewChat) void loadContacts(contactQuery);
  }, [showNewChat, contactQuery, myId]);

  const filtered = useMemo(
    () => threads.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
    [threads, query],
  );
  const active = filtered.find((t) => t.id === activeId) || null;
  const threadMessages = active ? messages[active.id] || [] : [];
  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [contacts, contactQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [threadMessages.length, active?.id, sending, reduceMotion, peerTyping]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    const image_urls = attachImages.slice(0, 10);
    const audio_url = attachAudio;
    if ((!text && !image_urls.length && !audio_url) || !active || sending) return;
    const optimistic: Message = {
      id: `local-${Date.now()}`,
      from: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      imageUrl: image_urls[0] || undefined,
      imageUrls: image_urls.length ? image_urls : undefined,
      audioUrl: audio_url || undefined,
    };
    setMessages((prev) => ({
      ...prev,
      [active.id]: [...(prev[active.id] || []), optimistic],
    }));
    setDraft('');
    setAttachImages([]);
    setAttachAudio('');
    setSending(true);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, preview: text || (image_urls.length ? 'Photo' : 'Audio'), time: 'now', unread: 0 }
          : t,
      ),
    );
    if (!useLive) {
      setMessages((prev) => ({
        ...prev,
        [active.id]: (prev[active.id] || []).map((m) =>
          m.id === optimistic.id ? { ...m, status: 'read' } : m,
        ),
      }));
      setSending(false);
      return;
    }
    try {
      const data = await messagesApi.send(active.id, text, { image_url: image_urls[0] || '', image_urls, audio_url });
      const saved = data?.message ? normalizeMessage(data.message, 0, myId) : null;
      if (saved) {
        setMessages((prev) => ({
          ...prev,
          [active.id]: [
            ...(prev[active.id] || []).filter((m) => m.id !== optimistic.id),
            { ...saved, from: 'me', status: 'delivered' },
          ],
        }));
      }
    } catch {
      setStatus('Message saved locally — cloud sync unavailable.');
      setMessages((prev) => ({
        ...prev,
        [active.id]: (prev[active.id] || []).map((m) =>
          m.id === optimistic.id ? { ...m, status: 'sent' } : m,
        ),
      }));
    } finally {
      setSending(false);
    }
  }

  function openThread(tid: string) {
    setPeerTyping('');
    setActiveId(tid);
    setMobilePane('chat');
    setThreads((prev) => prev.map((t) => (t.id === tid ? { ...t, unread: 0 } : t)));
    void messagesApi.markRead(tid).catch(() => undefined);
  }

  if (!user?.id) {
    return (
      <section id={id} className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">Sign in to message</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Your conversations sync here — only real members you can reach appear in your inbox.
          </p>
        </div>
      </section>
    );
  }

  const sharedMedia = threadMessages.filter((m) => m.imageUrl).slice(-6);
  const sharedFiles = threadMessages.filter((m) => m.audioUrl).slice(-4);

  return (
    <section id={id} className={`messenger-chat-root h-full min-h-0 bg-transparent ${designMods}`}>
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col">
        {status ? <p className="shrink-0 px-3 py-1 text-xs text-primary md:px-0">{status}</p> : null}
        <div className={`grid min-h-0 flex-1 overflow-hidden border-black/10 bg-surface shadow-sm md:rounded-none lg:rounded-none ${gridClass} border-0 md:border-x`}>
          {showIconRail ? (
            <nav
              className="hidden flex-col items-center gap-3 border-r border-black/10 bg-zinc-900 py-4 text-zinc-300 lg:flex"
              aria-label="Messenger"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-sm font-bold text-emerald-400">⌂</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg opacity-80" aria-hidden>◎</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg opacity-80" aria-hidden>▦</span>
              <span className="mt-auto inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-700 text-[10px] font-bold">
                {String(user?.name || 'U').slice(0, 1).toUpperCase()}
              </span>
            </nav>
          ) : null}
          <aside
            className={`relative flex flex-col border-r border-black/5 bg-surface ${
              mobilePane === 'chat' || mobilePane === 'details' ? 'hidden lg:flex' : 'flex'
            } ${mShell === 'rail-chat' && !activeId ? '' : ''}`}
          >
            <div className="border-b border-black/5 p-3">
              <p className="mb-2 text-sm font-bold text-ink">{title || 'Chats'}</p>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or start a new chat"
                className="w-full rounded-full border border-black/10 bg-background py-2 pl-3 pr-3 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30"
              />
              {mFilters !== 'none' ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['All', 'Unread', 'Favorites', 'Groups'].map((f) => (
                    <span
                      key={f}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        f === 'All' ? 'bg-primary/15 text-primary' : 'bg-black/[0.04] text-muted'
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <ul className="flex-1 overflow-y-auto">
              <AnimatePresence initial={false}>
                {filtered.map((t) => (
                  <motion.li
                    key={t.id}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      type="button"
                      onClick={() => openThread(t.id)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${
                        active?.id === t.id ? 'bg-primary/10' : 'hover:bg-black/[0.035]'
                      }`}
                    >
                      <Avatar name={t.name} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-ink">{t.kind === 'channel' ? t.name : t.name}</span>
                          <span className="shrink-0 text-[11px] text-muted">{t.time}</span>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted">{t.preview}</span>
                          {t.unread ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-[color:var(--color-on-primary,#fff)]">
                              {t.unread}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
              {!filtered.length ? (
                <li className="px-4 py-8 text-center text-sm text-muted">
                  No conversations yet. Tap + to start a chat with someone you know.
                </li>
              ) : null}
            </ul>
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              className="absolute bottom-4 right-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-light text-[color:var(--color-on-primary,#fff)] shadow-lg ring-4 ring-surface transition hover:brightness-110 lg:bottom-5 lg:right-5"
              aria-label="Start new conversation"
            >
              +
            </button>
          </aside>

          <div
            className={`relative flex min-h-[24rem] flex-col border-r border-black/5 ${
              mobilePane === 'list' || mobilePane === 'details' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {!active ? (
              <div className={`flex flex-1 flex-col items-center justify-center px-6 text-center ${chatPaneBg}`}>
                <p className="font-display text-xl font-semibold text-ink">{title || 'Messages'} on Web</p>
                <p className="mt-2 max-w-sm text-sm text-muted">
                  {body || 'Send and receive messages. Keep conversations private and in sync across your devices.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewChat(true)}
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#fff)]"
                >
                  New message
                </button>
              </div>
            ) : (
              <>
            {/* Conversation header — geometry from messenger Design DNA */}
            {mHeader === 'minimal-back' ? (
              <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/5 bg-surface px-3">
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-sm font-semibold text-primary lg:hidden"
                  onClick={() => setMobilePane('list')}
                >
                  ←
                </button>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{active?.name || 'Chat'}</p>
              </header>
            ) : mHeader === 'centered-title' ? (
              <header className="grid h-14 shrink-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-black/5 bg-surface px-3">
                <button
                  type="button"
                  className="justify-self-start rounded-full px-2 py-1 text-sm font-semibold text-primary lg:invisible"
                  onClick={() => setMobilePane('list')}
                >
                  ←
                </button>
                <div className="min-w-0 text-center">
                  <p className="truncate text-sm font-bold text-ink">{active?.name || 'Chat'}</p>
                  <p className="truncate text-[10px] text-muted">
                    {peerTyping ? `${peerTyping} is typing…` : 'Conversation'}
                  </p>
                </div>
                <div className="flex items-center gap-1 justify-self-end">
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-black/5"
                    onClick={() => setShowDetails(true)}
                  >
                    Info
                  </button>
                </div>
              </header>
            ) : mHeader === 'toolbar-dense' ? (
              <header className="flex h-11 shrink-0 items-center gap-2 border-b border-black/10 bg-surface px-2 md:px-3">
                <button
                  type="button"
                  className="rounded px-1.5 py-1 text-sm text-primary lg:hidden"
                  onClick={() => setMobilePane('list')}
                >
                  ←
                </button>
                <Avatar name={active?.name || 'Chat'} size="sm" />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{active?.name || 'Chat'}</p>
                <div className="flex shrink-0 items-center gap-0.5">
                  {['⌕', '⋮'].map((glyph) => (
                    <button
                      key={glyph}
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted hover:bg-black/5"
                      onClick={() => setShowDetails(true)}
                      aria-label={glyph === '⌕' ? 'Search in chat' : 'More'}
                    >
                      {glyph}
                    </button>
                  ))}
                </div>
              </header>
            ) : mHeader === 'identity-actions' ? (
              <header className="flex items-center gap-3 border-b border-black/5 bg-surface px-3 py-2.5 md:px-4">
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-sm font-semibold text-primary lg:hidden"
                  onClick={() => setMobilePane('list')}
                >
                  ←
                </button>
                <Avatar name={active?.name || 'Chat'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{active?.name || 'Chat'}</p>
                  <p className="text-[11px] text-muted">
                    {peerTyping ? `${peerTyping} is typing…` : 'Online · tap for info'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-black/5"
                    onClick={() => setShowDetails(true)}
                  >
                    Details
                  </button>
                </div>
              </header>
            ) : (
              <header className="flex items-center gap-3 border-b border-black/5 bg-surface/95 px-3 py-3 backdrop-blur md:px-4">
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-sm font-semibold text-primary lg:hidden"
                  onClick={() => setMobilePane('list')}
                >
                  ←
                </button>
                <Avatar name={active?.name || 'Chat'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{active?.name || 'Chat'}</p>
                  <p className="text-[11px] text-muted">
                    {peerTyping ? `${peerTyping} is typing…` : active?.preview || 'Direct message'}
                  </p>
                </div>
              </header>
            )}

            <div className={`relative flex-1 space-y-1 overflow-y-auto px-3 py-4 md:px-5 ${chatPaneBg}`}>
              {!threadMessages.length ? (
                <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                  <p className="font-display text-lg font-semibold text-ink">Say hello</p>
                  <p className="mt-1 max-w-xs text-sm text-muted">
                    Messages stay in this pane — start typing below.
                  </p>
                </div>
              ) : (
                threadMessages.map((m, idx) => {
                  const prev = threadMessages[idx - 1];
                  const showTail = !prev || prev.from !== m.from;
                  const mine = m.from === 'me';
                  return (
                    <div
                      key={m.id}
                      className={`group flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'} ${
                        showTail ? 'mt-3' : 'mt-0.5'
                      }`}
                    >
                      {!mine && showTail ? <Avatar name={active?.name || 'Member'} size="sm" /> : null}
                      {!mine && !showTail ? <span className="w-8 shrink-0" /> : null}
                      <div className={`flex min-w-0 max-w-[min(78%,26rem)] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        <Bubble
                          message={m}
                          showTail={showTail}
                          reduceMotion={reduceMotion}
                          mineClass={bubbleMine}
                          themClass={bubbleThem}
                        />
                        {mine && !m.deleted ? (
                          <span className="mt-0.5 flex gap-2 text-[10px] text-muted opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              type="button"
                              className="hover:underline"
                              onClick={async () => {
                                const next = window.prompt('Edit message', m.text);
                                if (next == null || !active) return;
                                try {
                                  await messagesApi.edit(active.id, m.id, next);
                                  setMessages((prev) => ({
                                    ...prev,
                                    [active.id]: (prev[active.id] || []).map((x) =>
                                      x.id === m.id ? { ...x, text: next, edited: true } : x,
                                    ),
                                  }));
                                } catch { /* ignore */ }
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="hover:underline"
                              onClick={async () => {
                                if (!active || !window.confirm('Unsend this message?')) return;
                                try {
                                  await messagesApi.unsend(active.id, m.id);
                                  setMessages((prev) => ({
                                    ...prev,
                                    [active.id]: (prev[active.id] || []).map((x) =>
                                      x.id === m.id ? { ...x, text: '', deleted: true } : x,
                                    ),
                                  }));
                                } catch { /* ignore */ }
                              }}
                            >
                              Unsend
                            </button>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
              {peerTyping ? (
                <div className="mt-3 flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-surface px-3 py-2 text-xs text-muted ring-1 ring-black/5">
                    <span className="sr-only">{peerTyping} is typing</span>
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" />
                    </span>
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            <form
              className={`flex flex-col gap-2 border-t border-black/5 bg-surface ${
                mComposer === 'compact-underline' ? 'px-3 py-2' : 'p-3'
              }`}
              onSubmit={(e) => void send(e)}
              data-composer={mComposer}
            >
              {(attachImages.length || attachAudio) ? (
                <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-muted">
                  {attachImages.map((u, i) => (
                    <span key={`${u}-${i}`} className="inline-flex items-center gap-2">
                      <img src={u} alt="" className="h-10 w-10 rounded object-cover" />
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setAttachImages((prev) => prev.filter((_, j) => j !== i))}
                      >
                        Remove
                      </button>
                    </span>
                  ))}
                  {attachAudio ? (
                    <span className="inline-flex items-center gap-2">
                      <audio controls src={attachAudio} className="h-8 max-w-[12rem]" />
                      <button type="button" className="underline" onClick={() => setAttachAudio('')}>
                        Remove audio
                      </button>
                    </span>
                  ) : null}
                </div>
              ) : null}

              {mComposer === 'split-tools' ? (
                <>
                  <div className="rounded-xl border border-black/10 bg-background px-3 py-1 focus-within:ring-2 focus-within:ring-primary/30">
                    <textarea
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (e.target.value.trim() && active?.id) pingTyping(active.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={2}
                      placeholder="Write a message…"
                      className="max-h-28 min-h-[2.75rem] w-full resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-md px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
                      Photo
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void uploadAttach(e.target.files, 'image'); e.target.value = ''; }} />
                    </label>
                    <label className="cursor-pointer rounded-md px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
                      Audio
                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => void uploadAttach(e.target.files?.[0] || null, 'audio')} />
                    </label>
                    <button
                      type="submit"
                      disabled={(!draft.trim() && !attachImages.length && !attachAudio) || sending}
                      className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#fff)] disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : mComposer === 'docked-bar' ? (
                <div className="flex items-end gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-black/10 bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/25">
                    <textarea
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (e.target.value.trim() && active?.id) pingTyping(active.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={1}
                      placeholder="Message"
                      className="max-h-28 min-h-[2.25rem] w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                    />
                    <div className="flex items-center gap-2 border-t border-black/5 pt-1.5">
                      <label className="cursor-pointer text-xs font-semibold text-muted hover:text-primary">
                        Attach
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void uploadAttach(e.target.files, 'image'); e.target.value = ''; }} />
                      </label>
                      <label className="cursor-pointer text-xs font-semibold text-muted hover:text-primary">
                        Voice
                        <input type="file" accept="audio/*" className="hidden" onChange={(e) => void uploadAttach(e.target.files?.[0] || null, 'audio')} />
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={(!draft.trim() && !attachImages.length && !attachAudio) || sending}
                    className="inline-flex h-11 shrink-0 items-center rounded-xl bg-primary px-4 text-sm font-bold text-[color:var(--color-on-primary,#fff)] disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              ) : mComposer === 'inline-icons' ? (
                <div className="flex items-center gap-1 rounded-2xl border border-black/10 bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-primary/30">
                  <label className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary hover:bg-primary/10" title="Attach photo">
                    <span aria-hidden>＋</span>
                    <span className="sr-only">Attach photo</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void uploadAttach(e.target.files, 'image'); e.target.value = ''; }} />
                  </label>
                  <textarea
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      if (e.target.value.trim() && active?.id) pingTyping(active.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message"
                    className="max-h-28 min-h-[2.25rem] w-full resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted"
                  />
                  <label className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary hover:bg-primary/10" title="Attach audio">
                    <span aria-hidden>♫</span>
                    <span className="sr-only">Attach audio</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => void uploadAttach(e.target.files?.[0] || null, 'audio')} />
                  </label>
                  <button
                    type="submit"
                    disabled={(!draft.trim() && !attachImages.length && !attachAudio) || sending}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-[color:var(--color-on-primary,#fff)] disabled:opacity-40"
                    aria-label="Send message"
                  >
                    ↑
                  </button>
                </div>
              ) : mComposer === 'compact-underline' ? (
                <div className="flex items-end gap-3">
                  <div className="min-w-0 flex-1 border-b border-black/20 focus-within:border-primary">
                    <textarea
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (e.target.value.trim() && active?.id) pingTyping(active.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={1}
                      placeholder="Message"
                      className="max-h-24 min-h-[2rem] w-full resize-none bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-muted"
                    />
                  </div>
                  <label className="cursor-pointer pb-1.5 text-xs font-medium text-muted hover:text-primary">
                    +
                    <input type="file" accept="image/*,audio/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void uploadAttach(f, f.type.startsWith('audio') ? 'audio' : 'image');
                      e.target.value = '';
                    }} />
                  </label>
                  <button
                    type="submit"
                    disabled={(!draft.trim() && !attachImages.length && !attachAudio) || sending}
                    className="pb-1.5 text-sm font-bold text-primary disabled:opacity-40"
                    aria-label="Send message"
                  >
                    Send
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <label
                    className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-lg font-semibold text-primary hover:bg-primary/10"
                    title="Attach photo"
                  >
                    <span aria-hidden>＋</span>
                    <span className="sr-only">Attach photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void uploadAttach(e.target.files, 'image');
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <label
                    className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm font-semibold text-primary hover:bg-primary/10"
                    title="Attach audio"
                  >
                    <span aria-hidden>♫</span>
                    <span className="sr-only">Attach audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => void uploadAttach(e.target.files?.[0] || null, 'audio')}
                    />
                  </label>
                  <div className="flex min-w-0 flex-1 items-end rounded-2xl border border-black/10 bg-background px-3 py-1 focus-within:ring-2 focus-within:ring-primary/30">
                    <textarea
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (e.target.value.trim() && active?.id) pingTyping(active.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={1}
                      placeholder="Type a message"
                      className="max-h-28 min-h-[2.5rem] w-full resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={(!draft.trim() && !attachImages.length && !attachAudio) || sending}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-[color:var(--color-on-primary,#fff)] shadow-md transition hover:brightness-110 disabled:opacity-40"
                    aria-label="Send message"
                  >
                    ↑
                  </button>
                </div>
              )}
            </form>
              </>
            )}
          </div>

          {showDetails && active ? (
            <>
              <button
                type="button"
                aria-label="Close details"
                className="absolute inset-0 z-40 bg-black/30"
                onClick={() => setShowDetails(false)}
              />
              <aside
                className="absolute inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto border-l border-black/10 bg-surface shadow-xl"
                role="dialog"
                aria-label="Chat details"
              >
                <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                  <p className="text-sm font-bold text-ink">Chat details</p>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-black/5"
                    onClick={() => setShowDetails(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-5 p-4">
                  <div className="flex flex-col items-center text-center">
                    <Avatar name={active?.name || 'Chat'} size="lg" />
                    <p className="mt-2 font-semibold text-ink">{active?.name || 'Conversation'}</p>
                    <p className="text-xs text-muted">Shared media and files stay in this panel.</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Shared media ({sharedMedia.length})
                    </p>
                    {sharedMedia.length ? (
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {sharedMedia.map((m) => (
                          <img key={m.id} src={m.imageUrl} alt="" className="aspect-square rounded-md object-cover" />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted">No photos yet.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Shared files</p>
                    {sharedFiles.length ? (
                      <ul className="mt-2 space-y-2">
                        {sharedFiles.map((m) => (
                          <li key={m.id} className="rounded-lg bg-background px-3 py-2 text-sm text-ink ring-1 ring-black/5">
                            Audio clip · {m.time}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted">No files shared yet.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Participants</p>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-center gap-2 text-sm text-ink">
                        <Avatar name={active?.name || 'Them'} size="sm" />
                        {active?.name || 'Contact'}
                      </li>
                      <li className="flex items-center gap-2 text-sm text-ink">
                        <Avatar name={user?.name || 'You'} size="sm" />
                        You
                      </li>
                    </ul>
                  </div>
                </div>
              </aside>
            </>
          ) : null}
        </div>
        <AnimatePresence>
          {showNewChat ? (
            <>
              <motion.button
                type="button"
                aria-label="Close"
                className="fixed inset-0 z-[60] bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNewChat(false)}
              />
              <motion.div
                role="dialog"
                aria-label="New conversation"
                className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-h-[min(75vh,32rem)] w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-black/10 md:inset-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[min(80vh,36rem)] md:-translate-x-1/2 md:-translate-y-1/2"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              >
                <div className="flex items-center justify-between border-b border-black/5 p-4">
                  <p className="text-sm font-bold text-ink">New message</p>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-black/5"
                    onClick={() => setShowNewChat(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="border-b border-black/5 px-4 pb-4">
                  <input
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    placeholder="Search members"
                    className="mt-3 w-full rounded-full border border-black/10 bg-background px-4 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                    onClick={async () => {
                      const title = window.prompt('Group chat name', 'Group chat') || '';
                      if (!title.trim()) return;
                      const ids = filteredContacts.slice(0, 8).map((c) => c.id);
                      try {
                        const data = await messagesApi.createGroup(title.trim(), ids);
                        const tid = String(data?.thread?.id || '');
                        setShowNewChat(false);
                        await loadThreads();
                        if (tid) openThread(tid);
                      } catch {
                        setStatus('Could not create group chat.');
                      }
                    }}
                  >
                    Create group chat
                  </button>
                </div>
                <ul className="max-h-[50vh] overflow-y-auto p-2">
                  {contactsBusy ? (
                    <li className="px-4 py-6 text-center text-sm text-muted">Loading people…</li>
                  ) : filteredContacts.length ? (
                    filteredContacts.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => void startConversation(c.id)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-black/[0.035]"
                        >
                          <Avatar name={c.name} size="sm" />
                          <span className="min-w-0 truncate text-sm font-semibold text-ink">{c.name}</span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-8 text-center text-sm text-muted">
                      No members found. Add friends first or search by name.
                    </li>
                  )}
                </ul>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

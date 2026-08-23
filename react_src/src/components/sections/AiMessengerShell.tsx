import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { INTENT, SITE_BRAND, SITE_TOKEN } from '@/config/site';
import { agentApi, mediaApi } from '@/services/apiClient';

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  audioUrl?: string;
};
type Thread = {
  id: string;
  title: string;
  messages: ChatMsg[];
  updated: number;
  draft?: string;
};

type StoredChat = {
  version: 1;
  activeId: string;
  threads: Thread[];
  draft?: string;
};

const QUICK_PROMPTS = [
  { id: 'img', label: 'Create an image', hint: 'Describe a scene to visualize' },
  { id: 'write', label: 'Write or edit', hint: 'Draft or refine some text' },
  { id: 'search', label: 'Search the web', hint: 'Ask for current information' },
];

type WorkspaceId = 'chat' | 'images' | 'library' | 'projects' | 'more';

type NavItem = {
  id: WorkspaceId;
  label: string;
  hint: string;
  route?: string;
};

const SIDE_NAV: NavItem[] = [
  { id: 'chat', label: 'New chat', hint: 'Start a fresh conversation' },
  { id: 'images', label: 'Images', hint: 'Generate and browse visuals', route: '/images' },
  { id: 'library', label: 'Library', hint: 'Saved answers and knowledge', route: '/library' },
  { id: 'projects', label: 'Projects', hint: 'Organize workspaces', route: '/projects' },
  { id: 'more', label: 'More', hint: 'Explore more workspaces' },
];

function Icon({ name, className = 'h-[18px] w-[18px]' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const };
  const stroke = { stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'logo':
      return (
        <svg {...common}>
          <path d="M12 3.5c-2.2 1.6-3.6 4.2-3.6 7.1 0 3.4 2.1 6.3 5.1 7.5 1.1-1.8 1.7-3.9 1.7-6.1 0-3.1-1.2-5.9-3.2-8.5Z" fill="currentColor" opacity="0.92" />
          <path d="M12 3.5c2.2 1.6 3.6 4.2 3.6 7.1 0 3.4-2.1 6.3-5.1 7.5" {...stroke} />
        </svg>
      );
    case 'new':
      return (
        <svg {...common}>
          <path d="M8 4h7l3 3v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" {...stroke} />
          <path d="M14 4v4h4M9.5 13h5M9.5 16.5h3.5" {...stroke} />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" {...stroke} />
          <path d="M16.5 16.5 20 20" {...stroke} />
        </svg>
      );
    case 'sidebar':
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" {...stroke} />
          <path d="M9 4.5v15" {...stroke} />
        </svg>
      );
    case 'images':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" {...stroke} />
          <path d="m3.5 15.5 4.2-4.2a2 2 0 0 1 2.8 0L15 16m0 0 1.7-1.7a2 2 0 0 1 2.8 0l1 1M15 16l2.5 2.5" {...stroke} />
          <circle cx="9" cy="9" r="1.25" fill="currentColor" />
        </svg>
      );
    case 'library':
      return (
        <svg {...common}>
          <path d="M5 5.5h4.5v13H5a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 5 5.5Zm4.5 0H14v13H9.5Zm4.5 0H19A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-1.5 1.5h-5" {...stroke} />
        </svg>
      );
    case 'projects':
      return (
        <svg {...common}>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H10l2 2h5.5A2.5 2.5 0 0 1 20 10.5v7A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" {...stroke} />
        </svg>
      );
    case 'more':
      return (
        <svg {...common}>
          <circle cx="6.5" cy="12" r="1.35" fill="currentColor" />
          <circle cx="12" cy="12" r="1.35" fill="currentColor" />
          <circle cx="17.5" cy="12" r="1.35" fill="currentColor" />
        </svg>
      );
    case 'history':
      return (
        <svg {...common}>
          <path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h6" {...stroke} />
          <rect x="4" y="4.5" width="16" height="15" rx="3" {...stroke} />
        </svg>
      );
    case 'upgrade':
      return (
        <svg {...common}>
          <path d="M12 4.5 14 10l5.5.5-4.2 3.5 1.4 5.3L12 16.4l-4.7 2.9 1.4-5.3L4.5 10.5 10 10l2-5.5Z" {...stroke} />
        </svg>
      );
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="3.25" {...stroke} />
          <path d="M5.5 19c1.5-3 4-4.5 6.5-4.5S17 16 18.5 19" {...stroke} />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" {...stroke} />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" {...stroke} />
        </svg>
      );
    case 'help':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M9.8 9.4a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.2.9-1.2 1.8M12 17h.01" {...stroke} />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path d="M10 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1" {...stroke} />
          <path d="M3.5 12H14M7 8.5 3.5 12 7 15.5" {...stroke} />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common} className={className || 'h-3.5 w-3.5'}>
          <path d="M4 7h16M9 7V5h6v2m-7 3v8m4-8v8m4-8v8M6 7l1 14h10l1-14" {...stroke} />
        </svg>
      );
    case 'personalize':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M12 8v4l2.5 1.5" {...stroke} />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common} className={className || 'h-4 w-4'}>
          <path d="m9 6 6 6-6 6" {...stroke} />
        </svg>
      );
    default:
      return null;
  }
}

function threadTitleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return 'New chat';
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}

function chatStorageKey(): string {
  const tok = String(SITE_TOKEN || 'local').trim() || 'local';
  const brand = String(SITE_BRAND || 'site').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `dwene_ai_chat_v1_${tok}_${brand}`;
}

function sidebarStorageKey(): string {
  const tok = String(SITE_TOKEN || 'local').trim() || 'local';
  return `dwene_ai_sidebar_v1_${tok}`;
}

function readSidebarExpanded(): boolean {
  try {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      // Mobile uses a drawer; never restore desktop "expanded" as an open overlay.
      return false;
    }
    const raw = localStorage.getItem(sidebarStorageKey());
    if (raw === '0') return false;
    if (raw === '1') return true;
  } catch { /* ignore */ }
  return true;
}

function isMobileAiViewport(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
  } catch {
    return false;
  }
}

function emptyThread(id?: string): Thread {
  return {
    id: id || `t-${Date.now()}`,
    title: 'New chat',
    messages: [],
    updated: Date.now(),
    draft: '',
  };
}

function loadStoredChat(): StoredChat | null {
  try {
    const raw = localStorage.getItem(chatStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChat;
    if (!parsed || !Array.isArray(parsed.threads) || !parsed.threads.length) return null;
    const threads = parsed.threads
      .filter((t) => t && typeof t.id === 'string')
      .map((t) => ({
        id: String(t.id),
        title: String(t.title || 'New chat').slice(0, 120),
        messages: Array.isArray(t.messages)
          ? t.messages
              .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
              .map((m) => ({
                id: String(m.id || `m-${Math.random()}`),
                role: m.role as 'user' | 'assistant',
                text: String(m.text || ''),
                imageUrl: m.imageUrl ? String(m.imageUrl) : undefined,
                audioUrl: m.audioUrl ? String(m.audioUrl) : undefined,
              }))
          : [],
        updated: Number(t.updated) || Date.now(),
        draft: typeof t.draft === 'string' ? t.draft : '',
      }));
    if (!threads.length) return null;
    const activeId = threads.some((t) => t.id === parsed.activeId)
      ? String(parsed.activeId)
      : threads[0].id;
    return { version: 1, activeId, threads, draft: typeof parsed.draft === 'string' ? parsed.draft : '' };
  } catch {
    return null;
  }
}

export function AiMessengerShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const pd = ((INTENT as any).productDesign && typeof (INTENT as any).productDesign === 'object')
    ? ((INTENT as any).productDesign as Record<string, string>)
    : {};
  const shell = String(pd.shell || 'history-chat');
  const historyStyle = String(pd.history || 'titled-recents');
  const sidebarStyle = String(pd.sidebar || 'soft-surface');
  const emptyState = String(pd.empty_state || 'ready-line');
  const composerStyle = String(pd.composer || 'pill-plus');
  const bubbles = String(pd.bubbles || 'plain-flat');
  const replyActions = String(pd.reply_actions || 'copy-rate');
  const quickActions = String(pd.quick_actions || 'chips-row');
  const skin = String(pd.skin || (INTENT as any).productDesignSkin || 'chatgpt-classic');
  const brand = SITE_BRAND || title || 'Assistant';
  const navigate = useNavigate();
  const dark = sidebarStyle === 'dark-ink';
  const userInitials = brand.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'AI';

  const boot = useMemo(() => loadStoredChat(), []);
  const [threads, setThreads] = useState<Thread[]>(() => boot?.threads?.length ? boot.threads : [emptyThread('t0')]);
  const [activeId, setActiveId] = useState(() => boot?.activeId || threads[0]?.id || 't0');
  const [draft, setDraft] = useState(() => {
    if (boot?.draft) return boot.draft;
    const active = boot?.threads?.find((t) => t.id === boot.activeId) || boot?.threads?.[0];
    return active?.draft || '';
  });
  const [busy, setBusy] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => readSidebarExpanded());
  // Mobile drawer must start closed on every load/reload (MOBILE_MENU_CLOSED_ON_LOAD).
  const [historyOpen, setHistoryOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceId>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navMoreOpen, setNavMoreOpen] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [attachImage, setAttachImage] = useState('');
  const [attachAudio, setAttachAudio] = useState('');
  const [recording, setRecording] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) || threads[0],
    [threads, activeId],
  );
  const messages = active?.messages || [];
  const isEmpty = messages.length === 0;
  const historyThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...threads].sort((a, b) => (b.updated || 0) - (a.updated || 0));
    if (!q) return sorted;
    return sorted.filter((t) => t.title.toLowerCase().includes(q) || t.messages.some((m) => m.text.toLowerCase().includes(q)));
  }, [threads, searchQuery]);

  useEffect(() => {
    setHydrated(true);
    // Hard guarantee: never present the mobile history overlay after reload.
    setHistoryOpen(false);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onViewport = () => {
      if (mq.matches) setHistoryOpen(false);
    };
    onViewport();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onViewport);
      return () => mq.removeEventListener('change', onViewport);
    }
    mq.addListener(onViewport);
    return () => mq.removeListener(onViewport);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      // Only persist desktop rail preference; mobile stays drawer-closed by default.
      if (!isMobileAiViewport()) {
        localStorage.setItem(sidebarStorageKey(), sidebarExpanded ? '1' : '0');
      }
    } catch { /* ignore */ }
  }, [sidebarExpanded, hydrated]);

  // Persist threads + active chat + draft across reloads
  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: StoredChat = {
        version: 1,
        activeId,
        draft,
        threads: threads.map((t) => ({
          ...t,
          draft: t.id === activeId ? draft : (t.draft || ''),
          messages: (t.messages || []).slice(-200),
        })),
      };
      localStorage.setItem(chatStorageKey(), JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
  }, [threads, activeId, draft, hydrated]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, busy, activeId, workspace]);

  useEffect(() => {
    if (!searchOpen) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [searchOpen, sidebarExpanded]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onDoc(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [userMenuOpen]);

  function setExpanded(next: boolean) {
    setSidebarExpanded(next);
    if (next) setHistoryOpen(false);
  }

  function goChatHome() {
    setWorkspace('chat');
    setNavMoreOpen(false);
    try { navigate('/'); } catch { /* ignore */ }
  }

  function openThread(tid: string) {
    if (!tid) return;
    setWorkspace('chat');
    if (tid === activeId) {
      setHistoryOpen(false);
      return;
    }
    const leavingDraft = draft;
    const next = threads.find((t) => t.id === tid);
    setThreads((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, draft: leavingDraft, updated: Date.now() } : t)),
    );
    setActiveId(tid);
    setDraft(next?.draft || '');
    setAttachImage('');
    setAttachAudio('');
    setUploadError('');
    setHistoryOpen(false);
  }

  function newChat() {
    setWorkspace('chat');
    const withDraft = threads.map((t) => (t.id === activeId ? { ...t, draft } : t));
    const blank = withDraft.find((t) => !t.messages.length && t.title === 'New chat');
    if (blank) {
      setThreads(withDraft);
      setActiveId(blank.id);
      setDraft(blank.draft || '');
    } else {
      const created = emptyThread();
      setThreads([created, ...withDraft]);
      setActiveId(created.id);
      setDraft('');
    }
    setAttachImage('');
    setAttachAudio('');
    setUploadError('');
    setHistoryOpen(false);
    setSearchOpen(false);
    try { navigate('/'); } catch { /* ignore */ }
  }

  function deleteThread(tid: string, e?: { stopPropagation?: () => void }) {
    e?.stopPropagation?.();
    const next = threads
      .map((t) => (t.id === activeId ? { ...t, draft } : t))
      .filter((t) => t.id !== tid);
    if (!next.length) {
      const created = emptyThread();
      setThreads([created]);
      setActiveId(created.id);
      setDraft('');
    } else {
      setThreads(next);
      if (tid === activeId) {
        const pick = next[0];
        setActiveId(pick.id);
        setDraft(pick.draft || '');
      }
    }
    setAttachImage('');
    setAttachAudio('');
  }

  function openHistoryPanel() {
    setWorkspace('chat');
    if (isMobileAiViewport()) {
      setHistoryOpen(true);
      return;
    }
    if (!sidebarExpanded) setExpanded(true);
  }

  function openSearch() {
    setSearchOpen(true);
    setWorkspace('chat');
    if (isMobileAiViewport()) {
      setHistoryOpen(true);
      window.setTimeout(() => searchInputRef.current?.focus(), 40);
      return;
    }
    if (!sidebarExpanded) setExpanded(true);
    else window.setTimeout(() => searchInputRef.current?.focus(), 40);
  }

  function openWorkspace(item: NavItem) {
    setNavMoreOpen(false);
    setUserMenuOpen(false);
    if (item.id === 'chat') {
      newChat();
      return;
    }
    if (item.id === 'more') {
      setNavMoreOpen((v) => !v);
      if (!sidebarExpanded) setExpanded(true);
      return;
    }
    setWorkspace(item.id);
    const preferRoute =
      (item.id === 'projects' && (INTENT as any).dashboard && '/dashboard')
      || (item.id === 'library' && (INTENT as any).portal && '/portal')
      || item.route
      || '';
    if (preferRoute === '/dashboard' && (INTENT as any).dashboard) {
      try { navigate('/dashboard'); return; } catch { /* fall through */ }
    }
    if (preferRoute === '/portal' && (INTENT as any).portal) {
      try { navigate('/portal'); return; } catch { /* fall through */ }
    }
    // In-app workspace pages (always available even without dedicated routes)
    if (!sidebarExpanded && (item.id === 'images' || item.id === 'library')) {
      // rail: go directly into the workspace page
    }
    try { navigate('/'); } catch { /* ignore */ }
  }

  function patchActive(updater: (msgs: ChatMsg[]) => ChatMsg[], titleHint?: string) {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeId) return t;
        const nextMsgs = updater(t.messages);
        const nextTitle =
          t.title === 'New chat' && titleHint ? threadTitleFrom(titleHint) : t.title;
        return { ...t, messages: nextMsgs, title: nextTitle, updated: Date.now(), draft };
      }),
    );
  }

  async function uploadFile(file: File, kind: 'image' | 'audio') {
    setUploadError('');
    try {
      const data = await mediaApi.upload(file, kind === 'audio' ? 'voice' : 'agent');
      const url = String(data?.url || (data?.media?.id ? mediaApi.url(String(data.media.id)) : '') || '');
      if (!url) throw new Error('Upload failed');
      if (kind === 'audio') setAttachAudio(url);
      else setAttachImage(url);
      return url;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      return '';
    }
  }

  async function onPickImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    await uploadFile(file, 'image');
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  async function onPickAudio(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    await uploadFile(file, 'audio');
    if (audioInputRef.current) audioInputRef.current.value = '';
  }

  async function toggleVoiceRecord() {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recordChunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordChunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordChunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
        void uploadFile(file, 'audio');
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
      setUploadError('');
    } catch {
      setUploadError('Microphone permission is required for voice notes.');
      setRecording(false);
    }
  }

  async function sendPrompt(textRaw: string, media?: { imageUrl?: string; audioUrl?: string }) {
    const text = textRaw.trim();
    const imageUrl = media?.imageUrl || attachImage;
    const audioUrl = media?.audioUrl || attachAudio;
    if ((!text && !imageUrl && !audioUrl) || busy) return;
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: text || (imageUrl ? 'Analyze this photo' : 'Voice note'),
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
    };
    patchActive((prev) => [...prev, userMsg], text || userMsg.text);
    setDraft('');
    setAttachImage('');
    setAttachAudio('');
    setBusy(true);
    try {
      const data = await agentApi.run({
        prompt: text || (imageUrl ? 'Analyze this photo and describe what you see.' : 'Respond to this voice note.'),
        mode: 'messenger',
        brand,
        site_name: brand,
        image_url: imageUrl || undefined,
        audio_url: audioUrl || undefined,
      });
      const reply = String(data?.reply || data?.message || data?.text || 'I could not reach the agent runtime.');
      patchActive((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: reply }]);
    } catch {
      patchActive((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'Offline preview reply: connect Dwene Cloud agent/run to enable live answers, photo analysis, and voice notes.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await sendPrompt(draft);
  }

  async function copyText(msg: ChatMsg) {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId(''), 1600);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = msg.text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedId(msg.id);
        window.setTimeout(() => setCopiedId(''), 1600);
      } catch {
        /* ignore */
      }
    }
  }


  const showChrome = historyStyle !== 'hidden' && shell !== 'minimal-center';
  const showToolsRail = shell === 'split-tools';
  const railMode = showChrome && !sidebarExpanded;

  const gridClass = !showChrome
    ? (showToolsRail ? 'lg:grid-cols-[minmax(0,1fr)_minmax(14rem,16rem)]' : 'lg:grid-cols-[minmax(0,1fr)]')
    : railMode
      ? (showToolsRail ? 'lg:grid-cols-[3.5rem_minmax(0,1fr)_minmax(14rem,16rem)]' : 'lg:grid-cols-[3.5rem_minmax(0,1fr)]')
      : (showToolsRail ? 'lg:grid-cols-[minmax(16.5rem,18.5rem)_minmax(0,1fr)_minmax(14rem,16rem)]' : 'lg:grid-cols-[minmax(16.5rem,18.5rem)_minmax(0,1fr)]');

  const sideTone = dark
    ? {
        panel: 'bg-[#0f0f10] text-zinc-100 border-white/10',
        hover: 'hover:bg-white/10',
        active: 'bg-white/12',
        muted: 'text-zinc-500',
        soft: 'bg-white/8',
        border: 'border-white/10',
        input: 'bg-white/8 placeholder:text-zinc-500',
        icon: 'text-zinc-200',
      }
    : {
        panel: 'bg-[#f7f7f8] text-ink border-black/[0.06]',
        hover: 'hover:bg-black/[0.045]',
        active: 'bg-black/[0.07]',
        muted: 'text-zinc-500',
        soft: 'bg-black/[0.045]',
        border: 'border-black/[0.06]',
        input: 'bg-white placeholder:text-zinc-400 shadow-sm ring-1 ring-black/[0.04]',
        icon: 'text-zinc-700',
      };

  const userBubble =
    bubbles === 'plain-flat'
      ? 'rounded-3xl bg-[color-mix(in_srgb,var(--color-ink)_8%,var(--color-surface))] px-4 py-2.5 text-ink'
      : bubbles === 'soft-bubble'
        ? 'rounded-2xl bg-primary/15 px-4 py-2.5 text-ink'
        : bubbles === 'card-reply'
          ? 'rounded-xl bg-surface px-4 py-3 text-ink ring-1 ring-black/5 shadow-sm'
          : bubbles === 'sharp-modern'
            ? 'rounded-md bg-primary px-4 py-2.5 text-[color:var(--color-on-primary,#fff)]'
            : 'rounded-2xl bg-primary px-4 py-2.5 text-[color:var(--color-on-primary,#fff)]';

  const assistantClass =
    bubbles === 'plain-flat'
      ? 'max-w-3xl text-[15px] leading-7 text-ink'
      : bubbles === 'soft-bubble'
        ? 'max-w-3xl rounded-2xl bg-surface px-4 py-3 text-[15px] leading-7 text-ink ring-1 ring-black/5'
        : bubbles === 'card-reply'
          ? 'max-w-3xl rounded-xl bg-surface px-4 py-3 text-[15px] leading-7 text-ink shadow-sm ring-1 ring-black/5'
          : 'max-w-3xl rounded-2xl bg-background px-4 py-3 text-[15px] leading-7 text-ink ring-1 ring-black/5';

  const emptyHeadline =
    emptyState === 'ready-line'
      ? 'Ready when you are.'
      : emptyState === 'greeting-center'
        ? `Hi — I'm ${brand}.`
        : emptyState === 'branded-hero'
          ? brand
          : emptyState === 'minimal-cursor'
            ? ''
            : `Ask ${brand}`;

  const composerPad =
    composerStyle === 'card-stage'
      ? 'rounded-2xl bg-surface p-3 ring-1 ring-black/5 shadow-lg'
      : '';

  const inputClass =
    composerStyle === 'underline-minimal'
      ? 'min-w-0 flex-1 border-0 border-b border-black/15 bg-transparent px-2 py-3 text-[15px] text-ink outline-none focus:border-primary'
      : composerStyle === 'dock-wide'
        ? 'min-w-0 flex-1 rounded-xl border border-black/10 bg-background px-4 py-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-primary/25'
        : 'min-w-0 flex-1 rounded-full border-0 bg-transparent px-2 py-2.5 text-[15px] text-ink outline-none';

  const formShell =
    composerStyle === 'underline-minimal'
      ? 'flex w-full items-end gap-2'
      : composerStyle === 'dock-wide'
        ? 'flex w-full items-end gap-2'
        : 'flex w-full items-center gap-1 rounded-[1.75rem] border border-black/10 bg-surface px-2 py-1.5 shadow-sm ring-1 ring-black/5';

  const workspaceMeta: Record<Exclude<WorkspaceId, 'chat'>, { title: string; blurb: string; cta: string; prompt: string }> = {
    images: {
      title: 'Images',
      blurb: 'Describe a scene and generate or refine visuals with ' + brand + '.',
      cta: 'Create an image',
      prompt: 'Create an image of ',
    },
    library: {
      title: 'Library',
      blurb: 'Revisit saved chats, answers, and knowledge you want to keep close.',
      cta: 'Ask from library',
      prompt: 'Using my saved context, ',
    },
    projects: {
      title: 'Projects',
      blurb: 'Group chats, files, and instructions into focused workspaces.',
      cta: 'Start a project chat',
      prompt: 'Help me organize a project for ',
    },
    more: {
      title: 'More',
      blurb: 'Explore extra workspaces and shortcuts for ' + brand + '.',
      cta: 'New chat',
      prompt: '',
    },
  };

  function renderWorkspace() {
    if (workspace === 'chat') return null;
    const meta = workspaceMeta[workspace === 'more' ? 'more' : workspace];
    return (
      <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col justify-center px-6 py-16">
        <div className="rounded-[1.75rem] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-primary)_12%,#fff)_0%,#fafafa_55%,#fff_100%)] p-8 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.05]">
          <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${sideTone.soft} ${sideTone.icon}`}>
            <Icon name={workspace === 'chat' ? 'new' : workspace} className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{meta.title}</h1>
          <p className="mt-2 max-w-lg text-[15px] leading-6 text-muted">{meta.blurb}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              onClick={() => {
                if (workspace === 'more' || !meta.prompt) {
                  newChat();
                  return;
                }
                const prompt = meta.prompt;
                setWorkspace('chat');
                const withDraft = threads.map((t) => (t.id === activeId ? { ...t, draft } : t));
                const created = emptyThread();
                created.draft = prompt;
                setThreads([created, ...withDraft]);
                setActiveId(created.id);
                setDraft(prompt);
              }}
            >
              {meta.cta}
            </button>
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-black/[0.03]"
              onClick={() => setWorkspace('chat')}
            >
              Back to chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  function NavRow({ item, collapsed = false }: { item: NavItem; collapsed?: boolean }) {
    const iconName = item.id === 'chat' ? 'new' : item.id;
    const selected = item.id !== 'chat' && workspace === item.id;
    return (
      <button
        type="button"
        title={item.label}
        aria-label={item.label}
        onClick={() => openWorkspace(item)}
        className={`group flex w-full items-center gap-3 rounded-xl text-sm font-medium transition ${
          collapsed ? 'h-10 w-10 justify-center p-0' : 'px-3 py-2.5'
        } ${selected ? sideTone.active : sideTone.hover} ${sideTone.icon}`}
      >
        <Icon name={iconName} />
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </button>
    );
  }

  function RecentsList({ compact = false }: { compact?: boolean }) {
    return (
      <div className={compact ? '' : 'min-h-0 flex-1 overflow-y-auto px-2 pb-3'}>
        {!compact ? (
          <p className={`px-2 pb-2 text-[11px] font-semibold tracking-wide ${sideTone.muted}`}>Recents</p>
        ) : null}
        <ul className="space-y-0.5">
          {historyThreads.map((t) => {
            const activeRow = t.id === activeId && workspace === 'chat';
            return (
              <li key={t.id} className="group relative">
                <button
                  type="button"
                  onClick={() => openThread(t.id)}
                  className={`w-full truncate rounded-xl py-2.5 pl-3 pr-9 text-left text-sm transition ${
                    activeRow ? `${sideTone.active} font-medium` : sideTone.hover
                  }`}
                >
                  {historyStyle === 'icon-only' ? 'Chat' : t.title}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${t.title}`}
                  title="Delete chat"
                  onClick={(e) => deleteThread(t.id, e)}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100 ${sideTone.hover} ${sideTone.muted}`}
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  function UserMenu() {
    if (!userMenuOpen) return null;
    return (
      <div
        className="absolute bottom-[4.25rem] left-2 z-50 w-[min(17.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-black/10 bg-white text-ink shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)]"
        role="menu"
      >
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-black/[0.03]"
          onClick={() => { setUserMenuOpen(false); try { navigate('/profile'); } catch { setWorkspace('more'); } }}
        >
          <span>
            <span className="block text-sm font-semibold">{brand}</span>
            <span className="text-xs text-muted">Free</span>
          </span>
          <Icon name="chevron" className="h-4 w-4 text-muted" />
        </button>
        <div className="border-t border-black/[0.06] py-1.5">
          {[
            { icon: 'upgrade', label: 'Upgrade plan', to: '/pricing' },
            { icon: 'personalize', label: 'Personalization', to: '' },
            { icon: 'profile', label: 'Profile', to: '/profile' },
            { icon: 'settings', label: 'Settings', to: '/settings' },
          ].map((row) => (
            <button
              key={row.label}
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/[0.03]"
              onClick={() => {
                setUserMenuOpen(false);
                if (row.to) {
                  try { navigate(row.to); } catch { /* ignore */ }
                } else {
                  setWorkspace('more');
                }
              }}
            >
              <Icon name={row.icon} className="h-4 w-4 text-zinc-600" />
              {row.label}
            </button>
          ))}
        </div>
        <div className="border-t border-black/[0.06] py-1.5">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/[0.03]"
            onClick={() => setUserMenuOpen(false)}
          >
            <Icon name="help" className="h-4 w-4 text-zinc-600" />
            Help
            <span className="ml-auto"><Icon name="chevron" className="h-4 w-4 text-muted" /></span>
          </button>
          <Link
            to="/login"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/[0.03]"
            onClick={() => setUserMenuOpen(false)}
          >
            <Icon name="logout" className="h-4 w-4 text-zinc-600" />
            Log out
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section
      id={id}
      className={`ai-messenger-shell ai-rail-shell flex h-full max-h-full min-h-0 flex-col overflow-hidden bg-background text-ink ai-shell--${shell} ai-skin--${skin}`}
      data-ai-shell={shell}
      data-ai-rail={railMode ? 'collapsed' : 'expanded'}
      aria-label={title || 'AI Chat'}
    >
      <div className={`grid h-full min-h-0 flex-1 overflow-hidden ${gridClass}`}>
        {showChrome ? (
          <aside
            className={`ai-side-rail relative hidden min-h-0 flex-col border-r transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex ${sideTone.panel} ${
              railMode ? 'items-center px-1.5 py-3' : 'py-2'
            }`}
          >
            {railMode ? (
              <>
                <button
                  type="button"
                  title={`Open ${brand} menu`}
                  aria-label="Expand sidebar"
                  onClick={() => setExpanded(true)}
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition ${sideTone.hover} ${sideTone.icon}`}
                >
                  <Icon name="logo" className="h-5 w-5" />
                </button>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    title="New chat"
                    aria-label="New chat"
                    onClick={() => newChat()}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${sideTone.hover} ${sideTone.icon}`}
                  >
                    <Icon name="new" />
                  </button>
                  <button
                    type="button"
                    title="Search chats"
                    aria-label="Search chats"
                    onClick={() => openSearch()}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${sideTone.hover} ${sideTone.icon}`}
                  >
                    <Icon name="search" />
                  </button>
                  <button
                    type="button"
                    title="Chat history"
                    aria-label="Chat history"
                    onClick={() => openHistoryPanel()}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${sideTone.hover} ${sideTone.icon}`}
                  >
                    <Icon name="history" />
                  </button>
                </div>
                <div className="mt-3 flex flex-col items-center gap-1">
                  {SIDE_NAV.filter((n) => n.id !== 'chat' && n.id !== 'more').map((item) => (
                    <NavRow key={item.id} item={item} collapsed />
                  ))}
                </div>
                <div className="mt-auto flex flex-col items-center pb-1" ref={userMenuRef}>
                  <UserMenu />
                  <button
                    type="button"
                    title="Account"
                    aria-label="Account menu"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-black/10 transition ${sideTone.soft}`}
                  >
                    {userInitials}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 px-3 pb-2 pt-1">
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left text-[15px] font-semibold tracking-tight"
                    onClick={() => goChatHome()}
                    title={brand}
                  >
                    {brand}
                  </button>
                  <button
                    type="button"
                    aria-label="Search chats"
                    title="Search"
                    onClick={() => openSearch()}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${sideTone.hover} ${sideTone.icon}`}
                  >
                    <Icon name="search" />
                  </button>
                  <button
                    type="button"
                    aria-label="Collapse sidebar"
                    title="Close sidebar"
                    onClick={() => setExpanded(false)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${sideTone.hover} ${sideTone.icon}`}
                  >
                    <Icon name="sidebar" />
                  </button>
                </div>

                {(searchOpen || historyStyle === 'search-pinned') ? (
                  <div className="px-3 pb-2">
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats"
                      className={`w-full rounded-xl px-3 py-2 text-sm outline-none ${sideTone.input}`}
                    />
                  </div>
                ) : null}

                <nav className="space-y-0.5 px-2 pb-3" aria-label="Primary">
                  {SIDE_NAV.map((item) => (
                    <NavRow key={item.id} item={item} />
                  ))}
                </nav>

                {navMoreOpen ? (
                  <div className={`mx-2 mb-2 rounded-xl px-3 py-2 text-xs ${sideTone.soft} ${sideTone.muted}`}>
                    More workspaces coming soon — Images, Library, and Projects are ready now.
                  </div>
                ) : null}

                <RecentsList />

                <div className={`relative mt-auto border-t px-2 py-2 ${sideTone.border}`} ref={userMenuRef}>
                  <UserMenu />
                  <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ring-black/10 ${sideTone.soft}`}
                      aria-label="Account menu"
                    >
                      {userInitials}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium">{brand}</span>
                      <span className={`block text-[11px] ${sideTone.muted}`}>Free</span>
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${sideTone.border} ${sideTone.hover}`}
                      onClick={() => { try { navigate('/pricing'); } catch { setWorkspace('more'); } }}
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              </>
            )}
          </aside>
        ) : null}

        <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-black/5 px-3 lg:hidden">
            <button
              type="button"
              className="rounded-md px-2 py-1.5 text-sm font-medium text-ink/80 hover:bg-black/5"
              onClick={() => setHistoryOpen(true)}
            >
              Menu
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1.5 text-sm font-medium text-ink/80 hover:bg-black/5"
              onClick={() => newChat()}
            >
              New
            </button>
            <span className="ml-auto truncate text-sm font-semibold text-ink">{brand}</span>
          </div>

          {showChrome && railMode ? (
            <button
              type="button"
              className="absolute left-3 top-3 z-10 hidden h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white/90 text-ink shadow-sm backdrop-blur lg:inline-flex"
              onClick={() => setExpanded(true)}
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Icon name="sidebar" />
            </button>
          ) : null}

          <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {workspace !== 'chat' ? (
              renderWorkspace()
            ) : isEmpty ? (
              <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
                {emptyState === 'branded-hero' ? (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{brand}</p>
                ) : null}
                {emptyHeadline ? (
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                    {emptyHeadline}
                  </h1>
                ) : (
                  <span className="inline-block h-5 w-0.5 animate-pulse bg-ink/40" aria-hidden />
                )}
                {emptyState !== 'minimal-cursor' && emptyState !== 'ready-line' ? (
                  <p className="mt-3 max-w-md text-sm text-muted">{body || `Chat with ${brand}.`}</p>
                ) : null}
                {quickActions !== 'none' && (emptyState === 'prompt-chips' || quickActions === 'chips-row' || quickActions === 'icon-links' || quickActions === 'stacked') ? (
                  <div className={`mt-8 flex w-full max-w-xl ${
                    quickActions === 'stacked' ? 'flex-col gap-2' : 'flex-wrap justify-center gap-2'
                  }`}>
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => void sendPrompt(q.hint)}
                        className="rounded-full border border-black/10 bg-surface px-4 py-2 text-sm text-ink hover:bg-black/[0.03]"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={m.role === 'user' ? `max-w-[85%] ${userBubble}` : assistantClass}>
                      {m.imageUrl ? (
                        <img
                          src={m.imageUrl}
                          alt="Attached"
                          className="mb-2 max-h-64 w-full rounded-xl object-cover ring-1 ring-black/10"
                        />
                      ) : null}
                      {m.audioUrl ? (
                        <audio controls src={m.audioUrl} className="mb-2 w-full max-w-xs" />
                      ) : null}
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      {m.role === 'assistant' && replyActions !== 'none' ? (
                        <div className="mt-2 flex items-center gap-1 text-muted">
                          <button
                            type="button"
                            className="rounded px-1.5 py-0.5 text-[11px] font-medium hover:bg-black/5"
                            onClick={() => void copyText(m)}
                            title="Copy response"
                          >
                            {copiedId === m.id ? 'Copied' : 'Copy'}
                          </button>
                          {replyActions === 'copy-rate' ? (
                            <>
                              <span className="text-[11px] opacity-50">·</span>
                              <span className="text-[11px] opacity-60">Helpful</span>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                {busy ? (
                  <p className="text-sm text-muted">Thinking…</p>
                ) : null}
              </div>
            )}
          </div>

          {workspace === 'chat' ? (
          <div className="ai-composer-dock z-20 shrink-0 border-t border-black/5 bg-background px-3 py-3 md:px-4">
            {(attachImage || attachAudio || uploadError) ? (
              <div className="mx-auto mb-2 flex w-full max-w-3xl flex-wrap items-center gap-2">
                {attachImage ? (
                  <div className="relative">
                    <img src={attachImage} alt="Pending" className="h-14 w-14 rounded-lg object-cover ring-1 ring-black/10" />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 rounded-full bg-ink px-1.5 text-[10px] text-white"
                      onClick={() => setAttachImage('')}
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ) : null}
                {attachAudio ? (
                  <div className="flex items-center gap-2 rounded-lg bg-surface px-2 py-1 ring-1 ring-black/5">
                    <audio controls src={attachAudio} className="h-8 max-w-[12rem]" />
                    <button type="button" className="text-xs text-muted" onClick={() => setAttachAudio('')}>
                      Remove
                    </button>
                  </div>
                ) : null}
                {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
              </div>
            ) : null}
            <form
              onSubmit={(e) => void onSubmit(e)}
              className={`mx-auto w-full max-w-3xl ${composerPad} ${formShell}`}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickImage(e.target.files)}
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => void onPickAudio(e.target.files)}
              />
              {(composerStyle === 'pill-plus' || composerStyle === 'attach-mic' || composerStyle === 'think-tools' || composerStyle === 'dock-wide' || composerStyle === 'underline-minimal' || composerStyle === 'card-stage') ? (
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-muted hover:bg-black/5"
                  aria-label="Add photo"
                  title="Upload photo"
                  onClick={() => imageInputRef.current?.click()}
                >
                  +
                </button>
              ) : null}
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={attachImage ? 'Ask about this photo…' : attachAudio ? 'Add a note for this voice…' : 'Ask anything'}
                className={inputClass}
                disabled={busy}
              />
              {composerStyle === 'think-tools' ? (
                <button
                  type="button"
                  className="hidden shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-black/5 sm:inline-flex"
                >
                  Think
                </button>
              ) : null}
              <button
                type="button"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold hover:bg-black/5 ${
                  recording ? 'bg-red-500/15 text-red-600' : 'text-muted'
                }`}
                aria-label={recording ? 'Stop recording' : 'Record voice note'}
                title={recording ? 'Stop recording' : 'Voice note'}
                onClick={() => void toggleVoiceRecord()}
              >
                {recording ? '■' : '🎙'}
              </button>
              <button
                type="button"
                className="hidden h-9 shrink-0 items-center justify-center rounded-full px-2 text-xs text-muted hover:bg-black/5 sm:inline-flex"
                aria-label="Upload audio file"
                title="Upload audio"
                onClick={() => audioInputRef.current?.click()}
              >
                Audio
              </button>
              <button
                type="submit"
                disabled={busy || (!draft.trim() && !attachImage && !attachAudio)}
                className="flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-[color:var(--color-on-primary,#fff)] disabled:opacity-40"
              >
                {busy ? '…' : 'Send'}
              </button>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted">
              {brand} can make mistakes. Check important info.
            </p>
          </div>
          ) : null}
        </div>

        {showToolsRail ? (
          <aside className="hidden min-h-0 flex-col border-l border-black/5 bg-surface p-4 lg:flex">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tools</p>
            <ul className="mt-3 space-y-2 text-sm text-ink">
              <li className="rounded-lg bg-background px-3 py-2 ring-1 ring-black/5">Browse</li>
              <li className="rounded-lg bg-background px-3 py-2 ring-1 ring-black/5">Images</li>
              <li className="rounded-lg bg-background px-3 py-2 ring-1 ring-black/5">Code</li>
            </ul>
          </aside>
        ) : null}
      </div>

      {/* Mobile side menu */}
      {historyOpen && showChrome ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setHistoryOpen(false)}
          />
          <aside className={`absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col ${sideTone.panel}`}>
            <div className="flex items-center justify-between px-3 py-3">
              <p className="text-sm font-semibold">{brand}</p>
              <button type="button" className="text-sm opacity-70" onClick={() => setHistoryOpen(false)}>
                Close
              </button>
            </div>
            <nav className="space-y-0.5 px-2 pb-2">
              {SIDE_NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${sideTone.hover}`}
                  onClick={() => { openWorkspace(item); setHistoryOpen(false); }}
                >
                  <Icon name={item.id === 'chat' ? 'new' : item.id} />
                  {item.label}
                </button>
              ))}
            </nav>
            <RecentsList />
          </aside>
        </div>
      ) : null}
    </section>
  );
}

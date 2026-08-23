import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { friendsApi, followApi, profileApi, suggestionsApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

export function FriendsShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const { user } = useAuth();
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const friendsLayout = String(design.friends_layout || 'friends-list');
  const [friends, setFriends] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [focusId, setFocusId] = useState('');
  const peopleGrid =
    friendsLayout === 'friends-cards'
      ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
      : friendsLayout === 'friends-dense'
        ? 'grid gap-1 sm:grid-cols-2'
        : 'space-y-2';
  const shellGrid =
    friendsLayout === 'friends-two-pane'
      ? 'lg:grid-cols-[minmax(0,1fr)_280px]'
      : 'lg:grid-cols-[minmax(0,1fr)]';

  async function refresh() {
    try {
      const data = await friendsApi.list();
      setFriends(data?.friends || []);
      setIncoming(data?.requests?.incoming || []);
      setOutgoing(data?.requests?.outgoing || []);
    } catch {
      setStatus('Sign in to manage friends.');
    }
  }

  async function loadSuggestions() {
    if (!user?.id) {
      setSuggestions([]);
      return;
    }
    try {
      const data = await suggestionsApi.people(8);
      setSuggestions(data?.people || []);
    } catch {
      setSuggestions([]);
    }
  }

  useEffect(() => {
    void refresh();
    void loadSuggestions();
  }, [user?.id]);

  async function findPeople() {
    try {
      const data = await profileApi.list(q.trim() || undefined);
      setPeople((data?.users || []).filter((u: any) => u.id && u.id !== user?.id));
    } catch {
      setPeople([]);
    }
  }

  if (!user) {
    return (
      <section id={id} className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Sign in to see friends
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Friend lists, requests, and people you may know are only available after you log in.
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
    <section id={id} className={`bg-background social-friends--${friendsLayout}`}>
      <div className={`mx-auto grid w-full max-w-6xl gap-4 px-3 py-4 ${shellGrid} lg:items-start`}>
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

        {suggestions.length ? (
          <div className="mt-6">
            <h3 className="font-semibold text-ink">People you may know</h3>
            <ul className={`mt-3 ${friendsLayout === 'friends-cards' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : friendsLayout === 'friends-dense' ? 'grid gap-1 sm:grid-cols-2' : 'grid gap-3 sm:grid-cols-2'}`}>
              {suggestions.map((p) => (
                <li
                  key={p.id}
                  className={
                    friendsLayout === 'friends-cards'
                      ? 'flex flex-col gap-3 rounded-2xl bg-surface p-4 ring-1 ring-black/5'
                      : friendsLayout === 'friends-dense'
                        ? 'flex items-center justify-between gap-2 rounded-md bg-surface px-2 py-1.5 text-sm ring-1 ring-black/5'
                        : 'flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-4 py-3 ring-1 ring-black/5'
                  }
                >
                  <div className="min-w-0">
                    <Link to={`/u/${p.id}`} className="font-medium text-ink hover:underline">
                      {p.name || p.id}
                    </Link>
                    <p className="text-xs text-muted">{p.reason || 'Suggested for you'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={async () => {
                        const wasFollowing = Boolean(p.following);
                        setSuggestions((prev) =>
                          prev.map((x) =>
                            x.id === p.id
                              ? { ...x, following: !wasFollowing }
                              : x,
                          ),
                        );
                        try {
                          if (wasFollowing) await followApi.unfollow(p.id);
                          else await followApi.follow(p.id);
                        } catch {
                          setSuggestions((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, following: wasFollowing } : x,
                            ),
                          );
                          setStatus('Follow action failed.');
                        }
                      }}
                    >
                      {p.following ? 'Following' : 'Follow'}
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        await friendsApi.request(p.id);
                        await refresh();
                        await loadSuggestions();
                      }}
                    >
                      Add friend
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find people"
            className="min-w-[12rem] flex-1 rounded-md border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="button" onClick={() => void findPeople()}>
            Search
          </Button>
        </div>

        {people.length ? (
          <ul className="mt-4 space-y-2">
            {people.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-4 py-3 ring-1 ring-black/5"
              >
                <Link to={`/u/${p.id}`} className="font-medium text-ink hover:underline">
                  {p.name || p.id}
                </Link>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={async () => {
                      const wasFollowing = Boolean(p.following);
                      setPeople((prev) =>
                        prev.map((x) =>
                          x.id === p.id ? { ...x, following: !wasFollowing } : x,
                        ),
                      );
                      try {
                        if (wasFollowing) await followApi.unfollow(p.id);
                        else await followApi.follow(p.id);
                      } catch {
                        setPeople((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, following: wasFollowing } : x,
                          ),
                        );
                        setStatus('Follow action failed.');
                      }
                    }}
                  >
                    {p.following ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      await friendsApi.request(p.id);
                      await refresh();
                      await loadSuggestions();
                    }}
                  >
                    Add friend
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={`mt-8 grid gap-8 ${friendsLayout === 'friends-two-pane' ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
          <div>
            <h3 className="font-semibold text-ink">Requests</h3>
            <ul className="mt-3 space-y-2">
              {incoming.map((r) => (
                <li key={r.id || r.user_id} className="flex items-center justify-between gap-2 text-sm">
                  <Link to={`/u/${r.user_id}`} className="text-primary hover:underline">
                    {r.name || r.user_id}
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={async () => {
                        await friendsApi.action(r.user_id, 'accept');
                        await refresh();
                        await loadSuggestions();
                      }}
                    >
                      Accept
                    </Button>
                    <button
                      type="button"
                      className="text-muted hover:underline"
                      onClick={async () => {
                        await friendsApi.action(r.user_id, 'reject');
                        await refresh();
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
              {!incoming.length ? <li className="text-sm text-muted">No incoming requests</li> : null}
              {outgoing.length ? (
                <li className="pt-2 text-xs text-muted">{outgoing.length} outgoing request(s)</li>
              ) : null}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-ink">Your friends</h3>
            <ul className={`mt-3 ${peopleGrid}`}>
              {friends.map((f) => (
                <li
                  key={f.id || f.user_id}
                  className={
                    friendsLayout === 'friends-cards'
                      ? 'rounded-2xl bg-surface p-4 ring-1 ring-black/5'
                      : friendsLayout === 'friends-dense'
                        ? 'rounded-md bg-surface px-2 py-1.5 ring-1 ring-black/5'
                        : friendsLayout === 'friends-two-pane'
                          ? `cursor-pointer rounded-lg px-3 py-2 ring-1 ring-black/5 ${focusId === (f.id || f.user_id) ? 'bg-primary/10' : 'bg-surface'}`
                          : ''
                  }
                  onClick={() => {
                    if (friendsLayout === 'friends-two-pane') setFocusId(String(f.id || f.user_id || ''));
                  }}
                >
                  <Link to={`/u/${f.id || f.user_id}`} className="text-sm font-medium text-primary hover:underline">
                    {f.name || f.user_id}
                  </Link>
                </li>
              ))}
              {!friends.length ? <li className="text-sm text-muted">No friends yet</li> : null}
            </ul>
          </div>
        </div>
        </div>
        {friendsLayout === 'friends-two-pane' ? (
          <aside className="hidden rounded-2xl bg-surface p-4 ring-1 ring-black/5 lg:block">
            <h3 className="text-sm font-bold text-ink">Preview</h3>
            {focusId ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted">Selected member</p>
                <Link to={`/u/${focusId}`} className="text-sm font-semibold text-primary hover:underline">
                  Open profile
                </Link>
                <Link to="/messages" className="block text-sm font-semibold text-ink hover:underline">
                  Message
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Select a friend to preview.</p>
            )}
          </aside>
        ) : null}
      </div>
    </section>
  );
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, getStoredSession, setStoredSession } from '@/services/apiClient';

type AuthUser = { id?: string; email?: string; name?: string; role?: string } | null;

type AuthCtx = {
  user: AuthUser;
  loading: boolean;
  login: (email: string, password: string, opts?: { remember?: boolean }) => Promise<void>;
  register: (payload: Record<string, string>) => Promise<{ message?: string; verification_required?: boolean }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<Record<string, unknown>>;
  resetPassword: (payload: Record<string, string>) => Promise<Record<string, unknown>>;
};

const AuthContext = createContext<AuthCtx | null>(null);

function userFromSession(session: any, fallbackEmail = ''): AuthUser {
  if (!session) return fallbackEmail ? { email: fallbackEmail } : null;
  return {
    id: session.id || session.user_id || '',
    email: session.email || fallbackEmail || '',
    name: session.name || '',
    role: session.role || 'user',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cached = getStoredSession();
    if (cached?.token) setUser(userFromSession(cached));

    authApi.session()
      .then((data) => {
        if (cancelled) return;
        // Prefer a session that may have been written by login() while this request was in flight.
        const live = getStoredSession();
        const session = data.session || data;
        if (session?.token || session?.email) {
          const next = {
            token: session.token || live?.token || cached?.token,
            id: session.id || session.user_id || live?.id || cached?.id || '',
            email: session.email || live?.email || '',
            name: session.name || live?.name || '',
            role: session.role || live?.role || 'user',
          };
          setStoredSession(next);
          setUser(userFromSession(next));
          return;
        }
        if (live?.token) {
          setUser(userFromSession(live));
          return;
        }
        setUser(null);
      })
      .catch(() => {
        if (cancelled) return;
        // Never wipe a session that landed after this request started (login race).
        const live = getStoredSession();
        if (live?.token) {
          setUser(userFromSession(live));
          return;
        }
        if (!cached?.token) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    loading,
    async login(email, password, opts) {
      const remember = opts?.remember !== false;
      const data = await authApi.login(email, password, { remember });
      const session = data.session || data;
      if (!session?.token) throw new Error(data.message || data.error || 'Could not create session');
      setStoredSession(session, { remember });
      setUser(userFromSession(session, email));
    },
    async register(payload) {
      const data = await authApi.register(payload);
      // Dwene Cloud never auto-signs-in after register — user must login next.
      setStoredSession(null);
      setUser(null);
      return {
        message: data.message || 'Account created. Please sign in.',
        verification_required: !!data.verification_required,
      };
    },
    async logout() {
      await authApi.logout().catch(() => null);
      setStoredSession(null);
      setUser(null);
    },
    async forgotPassword(email) {
      return authApi.forgotPassword(email);
    },
    async resetPassword(payload) {
      const data = await authApi.resetPassword(payload);
      return data;
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}

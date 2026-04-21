import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const SESSION_KEY = 'mira_user';

interface UserSession {
  status?: string;
  user_id?: string;
  transactions?: any[];
  [key: string]: any;
}

interface UserSessionContextType {
  userSession: UserSession | null;
  setUserSession: (session: UserSession | null) => void;
  logout: () => void;
  loading: boolean;
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [userSession, _setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from sessionStorage on first mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        _setUserSession(parsed);
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const setUserSession = (session: UserSession | null) => {
    _setUserSession(session);
    try {
      if (session) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  const logout = () => {
    setUserSession(null);
  };

  return (
    <UserSessionContext.Provider value={{ userSession, setUserSession, logout, loading }}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (context === undefined) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
}

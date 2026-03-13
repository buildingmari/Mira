import { createContext, useContext, useState, ReactNode } from "react";

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
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(
  undefined
);

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  const logout = () => {
    setUserSession(null);
  };

  return (
    <UserSessionContext.Provider value={{ userSession, setUserSession, logout }}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (context === undefined) {
    throw new Error("useUserSession must be used within a UserSessionProvider");
  }
  return context;
}
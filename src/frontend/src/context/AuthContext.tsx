import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { User } from "../backend.d";
import { getStoredUser, setStoredUser, clearStoredUser } from "../store/authStore";

interface AuthContextValue {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => getStoredUser());

  const setUser = useCallback((u: User) => {
    setStoredUser(u);
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    clearStoredUser();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

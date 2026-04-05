import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MarzbanClient } from "@/lib/marzban";

interface AuthState {
  baseUrl: string;
  token: string;
  client: MarzbanClient;
}

interface AuthContextType {
  auth: AuthState | null;
  login: (baseUrl: string, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "marzban_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { baseUrl, token } = JSON.parse(stored);
        if (baseUrl && token) {
          return { baseUrl, token, client: new MarzbanClient({ baseUrl, token }) };
        }
      }
    } catch {
    }
    return null;
  });

  function login(baseUrl: string, token: string) {
    const client = new MarzbanClient({ baseUrl, token });
    const state = { baseUrl, token, client };
    setAuth(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl, token }));
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

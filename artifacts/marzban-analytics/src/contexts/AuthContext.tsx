import { createContext, useContext, useState, ReactNode } from "react";
import { MarzbanClient } from "@/lib/marzban";
import { DemoMarzbanClient } from "@/lib/demo-client";

type AnyClient = MarzbanClient | DemoMarzbanClient;

interface AuthState {
  baseUrl: string;
  token: string;
  client: AnyClient;
  isDemo: boolean;
}

interface AuthContextType {
  auth: AuthState | null;
  login: (baseUrl: string, token: string) => void;
  loginDemo: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "marzban_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.isDemo) {
          return { baseUrl: "demo", token: "demo", client: new DemoMarzbanClient(), isDemo: true };
        }
        if (parsed.baseUrl && parsed.token) {
          return { baseUrl: parsed.baseUrl, token: parsed.token, client: new MarzbanClient({ baseUrl: parsed.baseUrl, token: parsed.token }), isDemo: false };
        }
      }
    } catch {
    }
    return null;
  });

  function login(baseUrl: string, token: string) {
    const client = new MarzbanClient({ baseUrl, token });
    const state = { baseUrl, token, client, isDemo: false };
    setAuth(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl, token, isDemo: false }));
  }

  function loginDemo() {
    const state = { baseUrl: "demo", token: "demo", client: new DemoMarzbanClient(), isDemo: true };
    setAuth(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isDemo: true }));
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ auth, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "../lib/api";

interface Admin {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  admin: Admin;
}

interface ProfileResponse {
  admin: Admin;
}

interface AuthContextValue {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "verseserver_admin_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAdmin(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest<ProfileResponse>(
          "/api/v1/auth/me",
          { token },
        );

        if (!cancelled) {
          setAdmin(response.data.admin);
        }
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);

        if (!cancelled) {
          setAdmin(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest<LoginResponse>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    sessionStorage.setItem(TOKEN_KEY, response.data.accessToken);
    setAdmin(response.data.admin);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

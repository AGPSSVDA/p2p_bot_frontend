import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService } from "@/services/auth.service";

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
  loading: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem("p2p_user");
      const savedToken = localStorage.getItem("p2p_token");
      if (savedUser && savedToken) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch (e) {
          localStorage.removeItem("p2p_user");
          localStorage.removeItem("p2p_token");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        const { user: userData, token: jwtToken } = response.data;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem("p2p_user", JSON.stringify(userData));
        localStorage.setItem("p2p_token", jwtToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("p2p_user");
      localStorage.removeItem("p2p_token");
    }
  };


  return (
    <Ctx.Provider value={{ user, login, logout, token, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
};

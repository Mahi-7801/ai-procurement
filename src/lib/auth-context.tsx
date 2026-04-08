import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserRole } from "./mock-data";
import { API_BASE_URL } from "@/config";

interface AuthState {
  isAuthenticated: boolean;
  username: string;
  role: UserRole;
  token: string | null;
  user?: any;
}

interface AuthContextType {
  auth: AuthState;
  login: (username: string, password: string, role: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return {
          isAuthenticated: true,
          username: user.username,
          role: user.role as UserRole,
          token: savedToken,
          user: user
        };
      } catch (e) {
        return { isAuthenticated: false, username: "", role: "PROCUREMENT_OFFICER", token: null };
      }
    }
    return {
      isAuthenticated: false,
      username: "",
      role: "PROCUREMENT_OFFICER",
      token: null,
    };
  });

  const login = async (username: string, password: string, role: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const newState = {
        isAuthenticated: true,
        username: data.user.username,
        role: data.user.role as UserRole,
        token: data.access_token,
        user: data.user
      };

      setAuth(newState);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Registration failed:", errorData.detail);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, username: "", role: "PROCUREMENT_OFFICER", token: null });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

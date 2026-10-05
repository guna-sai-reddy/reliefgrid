import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, refresh: string, user?: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  /** Load user + token from localStorage on app startup */
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token, refresh, user) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("refresh_token", refresh);
    if (user) localStorage.setItem("user", JSON.stringify(user));
    set({ token, user: user ?? null, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    let user: User | null = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        user = null;
      }
    }
    set({ token, user, isAuthenticated: !!token });
  },
}));
import { create } from "zustand";
import type { User } from "../types";

const STORAGE_KEY = "crm_user";

type SessionState = {
  user: User | null;
  navigation: string[];
  setUser: (user: User | null) => void;
  setNavigation: (navigation: string[]) => void;
  logout: () => void;
};

const saved = localStorage.getItem(STORAGE_KEY);

export const useSessionStore = create<SessionState>((set) => ({
  user: saved ? (JSON.parse(saved) as User) : null,
  navigation: ["Daily Planning", "MyMerchant", "Existing Customers", "Market Visit Customers", "My Followup"],
  setUser: (user) => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
    set({ user });
  },
  setNavigation: (navigation) => set({ navigation }),
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null });
  }
}));

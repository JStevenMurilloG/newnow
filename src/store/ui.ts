import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Article } from '../lib/types';

export type Theme = 'system' | 'dark' | 'light';

export interface Toast {
  id: number;
  message: string;
  icon?: string;
  action?: { label: string; run: () => void };
  /** ms; 0 = no se cierra solo */
  duration: number;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  href: string;
  time: number;
  read: boolean;
}

interface UIState {
  theme: Theme;
  setTheme: (t: Theme) => void;

  bookmarks: Article[];
  /** devuelve true si quedó guardado */
  toggleBookmark: (a: Article) => boolean;

  notifications: Notice[];
  notify: (n: Omit<Notice, 'time' | 'read'>) => void;
  markAllRead: () => void;
  clearNotifications: () => void;

  toasts: Toast[];
  toast: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      bookmarks: [],
      toggleBookmark: (a) => {
        const saved = get().bookmarks.some((b) => b.id === a.id);
        set({ bookmarks: saved ? get().bookmarks.filter((b) => b.id !== a.id) : [a, ...get().bookmarks] });
        return !saved;
      },

      notifications: [],
      notify: (n) => {
        if (get().notifications.some((x) => x.id === n.id)) return;
        set({ notifications: [{ ...n, time: Date.now(), read: false }, ...get().notifications].slice(0, 30) });
      },
      markAllRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      clearNotifications: () => set({ notifications: [] }),

      toasts: [],
      toast: (message, options) =>
        set({ toasts: [...get().toasts.slice(-2), { id: ++toastId, message, duration: 3200, ...options }] }),
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: 'newsnow-ui',
      partialize: ({ theme, bookmarks, notifications }) => ({ theme, bookmarks, notifications }),
    },
  ),
);

export const useIsBookmarked = (id: string) => useUI((s) => s.bookmarks.some((b) => b.id === id));

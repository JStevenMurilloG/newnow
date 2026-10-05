import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** Tema efectivo ('dark' | 'light') a partir de la preferencia guardada. */
export function useResolvedTheme(theme: 'system' | 'dark' | 'light'): 'dark' | 'light' {
  const systemLight = useMediaQuery('(prefers-color-scheme: light)');
  if (theme === 'system') return systemLight ? 'light' : 'dark';
  return theme;
}

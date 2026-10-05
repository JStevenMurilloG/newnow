import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { BottomNav, Sidebar, Toaster, Topbar } from './components/chrome';
import { CountrySelector } from './components/CountrySelector';
import { useResolvedTheme } from './hooks/useMediaQuery';
import { useUI } from './store/ui';

function useThemeAttribute() {
  const theme = useResolvedTheme(useUI((s) => s.theme));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#060a18' : '#f3f6fd');
  }, [theme]);
}

function useServiceWorker() {
  const toast = useUI((s) => s.toast);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (offlineReady) toast('Lista para usarse sin conexión', { icon: 'check' });
  }, [offlineReady, toast]);

  useEffect(() => {
    if (needRefresh) {
      toast('Nueva versión disponible', {
        icon: 'refresh',
        duration: 0,
        action: { label: 'Actualizar', run: () => updateServiceWorker(true) },
      });
    }
  }, [needRefresh, toast, updateServiceWorker]);
}

export default function App() {
  useThemeAttribute();
  useServiceWorker();

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="shell__main">
        <Topbar />
        <main id="main">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <CountrySelector />
      <Toaster />
      <ScrollRestoration />
    </div>
  );
}

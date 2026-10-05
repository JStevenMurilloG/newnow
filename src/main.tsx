import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/sora/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/motion.css';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

const DAY = 24 * 60 * 60_000;

const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: DAY, refetchOnWindowFocus: false } },
});

// La caché se guarda en el dispositivo: ahorra cuota de NewsAPI y permite leer sin conexión.
const persister = createSyncStoragePersister({ storage: window.localStorage, key: 'newsnow-cache' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: DAY, buster: 'v1' }}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </PersistQueryClientProvider>
  </StrictMode>,
);

import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Article from './pages/Article';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Saved from './pages/Saved';
import Search from './pages/Search';

export const router = createBrowserRouter(
  [
  {
    element: <App />,
    children: [
      {
        // La portada es una ruta contenedora: cambiar de lugar no la desmonta y el globo conserva su estado.
        element: <Home />,
        children: [
          // sin elemento propio: solo aportan los parámetros del lugar
          { index: true, element: null },
          { path: 'r/:region', element: null },
          { path: 'c/:country', element: null },
          { path: 'c/:country/:city', element: null },
        ],
      },
      { path: 'a/:id', element: <Article /> },
      { path: 'search', element: <Search /> },
      { path: 'saved', element: <Saved /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

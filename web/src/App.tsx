import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExplorerPage } from './pages/ExplorerPage';
import { AboutPage } from './pages/AboutPage';
import { LandingPage } from './pages/LandingPage';
import { CustomCursor } from './components/CustomCursor';
import { HudBootIntro } from './components/HudBootIntro';
import { useAppStore } from './state/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type Page = 'landing' | 'explorer' | 'about';

function pageFromPath(path: string): Page {
  if (path === '/about') return 'about';
  if (path === '/explore' || path.startsWith('/s/')) return 'explorer';
  return 'landing';
}

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() =>
    typeof window === 'undefined' ? 'landing' : pageFromPath(window.location.pathname)
  );
  const { setCurrentCacheKey, setActiveTab } = useAppStore();

  useEffect(() => {
    const apply = (path: string) => {
      setCurrentPage(pageFromPath(path));
      if (path.startsWith('/s/')) {
        const key = path.replace('/s/', '').trim();
        if (key) {
          setCurrentCacheKey(key);
          setActiveTab('results');
        }
      }
    };
    apply(window.location.pathname);
    const onPop = () => apply(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setCurrentCacheKey, setActiveTab]);

  const go = (page: Page, path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPage(page);
  };

  const aboutReturn = React.useRef<Page>('landing');
  const handleOpenAbout = () => {
    aboutReturn.current = currentPage === 'about' ? aboutReturn.current : currentPage;
    go('about', '/about');
  };
  const handleOpenDemo = () => go('explorer', '/explore');
  const handleBackToLanding = () => go('landing', '/');
  const handleBackToExplorer = () => go('explorer', '/explore');

  return (
    <QueryClientProvider client={queryClient}>
      {currentPage !== 'landing' && <CustomCursor />}
      {currentPage === 'explorer' && <HudBootIntro />}
      {currentPage === 'about' ? (
        <AboutPage onBack={aboutReturn.current === 'landing' ? handleBackToLanding : handleBackToExplorer} />
      ) : currentPage === 'landing' ? (
        <LandingPage onOpenDemo={handleOpenDemo} onOpenAbout={handleOpenAbout} />
      ) : (
        <ExplorerPage onOpenAbout={handleOpenAbout} onGoHome={handleBackToLanding} />
      )}
    </QueryClientProvider>
  );
};

export default App;

import { useRef, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScrollLayout } from './components/layout';
import { LandingPage, HomePage, HistoryPage, SavedPage } from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const location = useLocation();
  const hasNavigated = useRef(false);
  const [skipAnimation, setSkipAnimation] = useState(false);

  // After first animation completes, mark as navigated
  const handleAnimationComplete = () => {
    hasNavigated.current = true;
  };

  // When route changes after initial load, skip animation
  useEffect(() => {
    if (hasNavigated.current) {
      setSkipAnimation(true);
    }
  }, [location.pathname]);

  return (
    <ScrollLayout
      skipAnimation={skipAnimation}
      onAnimationComplete={handleAnimationComplete}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/saved" element={<SavedPage />} />
      </Routes>
    </ScrollLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

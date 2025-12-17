import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { SettingsPage } from '@/pages/SettingsPage';
import { toast } from 'sonner';
import { useLocalStore } from './store/local-store';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
    errorElement: <RouteErrorBoundary />,
  },
]);
export function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'sync-complete') {
          console.log('Sync complete message received from SW.');
          toast.success('Background sync completed successfully!');
          // Re-initialize watcher to get the latest count (which should be 0)
          // and reload conversations to reflect any server-side changes if applicable.
          useLocalStore.getState().initSyncWatcher();
          useLocalStore.getState().loadConversations();
        }
      };
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered: ', registration);
          navigator.serviceWorker.addEventListener('message', handleSWMessage);
        } catch (registrationError) {
          console.log('SW registration failed: ', registrationError);
        }
      };
      window.addEventListener('load', registerSW);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, []);
  return (
    <RouterProvider router={router} />
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
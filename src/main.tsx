import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LeftVault } from "@/components/wiki/LeftVault";
import { HomePage } from '@/pages/HomePage';
import { WikiEditor } from '@/pages/WikiEditor';
import { ImportPage } from '@/pages/ImportPage';
import '@/index.css';
const queryClient = new QueryClient();
const AppContainer = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <LeftVault />
    <SidebarInset>
      {children}
    </SidebarInset>
  </SidebarProvider>
);
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppContainer><HomePage /></AppContainer>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/editor/:id",
    element: <AppContainer><WikiEditor /></AppContainer>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/import",
    element: <AppContainer><ImportPage /></AppContainer>,
    errorElement: <RouteErrorBoundary />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
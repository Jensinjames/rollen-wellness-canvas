
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UnifiedAuthProvider } from "@/contexts/UnifiedAuthContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppErrorBoundary } from "@/components/error/AppErrorBoundary";
import { RouteErrorBoundary } from "@/components/error/RouteErrorBoundary";
import { DevPanel } from "@/components/debug/DevPanel";
import { shouldShowDebugInfo, getEnvironment, safeConsoleLog } from "@/utils/environment";
import { Suspense, lazy, useEffect } from "react";

// Lazy load page components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Categories = lazy(() => import("./pages/Categories"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Priority loading for critical pages to improve LCP
const IndexWithPriority = lazy(() => 
  import("./pages/Index").then(module => ({ default: module.default }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status === 401 || status === 403) return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  useEffect(() => {
    if (shouldShowDebugInfo()) {
      safeConsoleLog('🚀 App initialized');
      safeConsoleLog('📍 Environment:', getEnvironment());
      safeConsoleLog('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing');
    }
  }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UnifiedAuthProvider>
          <TimerProvider>
            <TooltipProvider>
              <Toaster />
              <DevPanel />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route 
                      path="/auth" 
                      element={
                        <RouteErrorBoundary>
                          <AuthGuard />
                        </RouteErrorBoundary>
                      } 
                    />
                    <Route
                      path="/"
                      element={
                        <RouteErrorBoundary>
                          <ProtectedRoute>
                            <IndexWithPriority />
                          </ProtectedRoute>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="/categories"
                      element={
                        <RouteErrorBoundary>
                          <ProtectedRoute>
                            <Categories />
                          </ProtectedRoute>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <RouteErrorBoundary>
                          <ProtectedRoute>
                            <Analytics />
                          </ProtectedRoute>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="/calendar"
                      element={
                        <RouteErrorBoundary>
                          <ProtectedRoute>
                            <Calendar />
                          </ProtectedRoute>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <RouteErrorBoundary>
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        </RouteErrorBoundary>
                      }
                    />
                    <Route 
                      path="*" 
                      element={
                        <RouteErrorBoundary>
                          <NotFound />
                        </RouteErrorBoundary>
                      } 
                    />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </TimerProvider>
        </UnifiedAuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

// Force rebuild to fix connection issues
export default App;

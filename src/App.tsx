
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UnifiedAuthProvider } from "@/contexts/UnifiedAuthContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppErrorBoundary } from "@/components/error/AppErrorBoundary";
import { Suspense, lazy } from "react";

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
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UnifiedAuthProvider>
          <TimerProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/auth" element={<AuthGuard />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <IndexWithPriority />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/categories"
                      element={
                        <ProtectedRoute>
                          <Categories />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/calendar"
                      element={
                        <ProtectedRoute>
                          <Calendar />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
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

export default App;

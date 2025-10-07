import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingFallback } from "./components/LoadingFallback";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewPatient from "./pages/NewPatient";
import NewAdmission from "./pages/NewAdmission";
import PatientDetail from "./pages/PatientDetail";
import AdmissionPrint from "./pages/AdmissionPrint";
import NotFound from "./pages/NotFound";

// Lazy load heavy components
const ClinicalProtocols = lazy(() => import("./pages/ClinicalProtocols"));
const Statistics = lazy(() => import("./pages/Statistics"));
const DocumentUpload = lazy(() => import("./pages/DocumentUpload"));
const SemanticSearch = lazy(() => import("./pages/SemanticSearch"));
const ClinicalAssistant = lazy(() => import("./pages/ClinicalAssistant"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with AppLayout */}
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/patient/new" element={<AppLayout><NewPatient /></AppLayout>} />
          <Route path="/admission/new" element={<AppLayout><NewAdmission /></AppLayout>} />
          <Route path="/patient/:id" element={<AppLayout><PatientDetail /></AppLayout>} />
          <Route path="/admission/:id/print" element={<AdmissionPrint />} />
          
          {/* Lazy loaded routes */}
          <Route
            path="/protocols"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <ClinicalProtocols />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/stats"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Statistics />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/documents/upload"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <DocumentUpload />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/search"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <SemanticSearch />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/assistant"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <ClinicalAssistant />
                </Suspense>
              </AppLayout>
            }
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

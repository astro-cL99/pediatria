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
import Profile from "./pages/Profile";
import DocumentsPage from "./pages/DocumentsPage";
import TasksPage from "./pages/TasksPage";

// Lazy load heavy components
const ClinicalProtocols = lazy(() => import("./pages/ClinicalProtocols"));
const Statistics = lazy(() => import("./pages/Statistics"));
const DocumentUpload = lazy(() => import("./pages/DocumentUpload"));
const SemanticSearch = lazy(() => import("./pages/SemanticSearch"));
const ClinicalAssistant = lazy(() => import("./pages/ClinicalAssistant"));
const Epicrisis = lazy(() => import("./pages/Epicrisis"));
const NewEpicrisis = lazy(() => import("./pages/NewEpicrisis"));
const EpicrisisView = lazy(() => import("./pages/EpicrisisView"));
const HandoverDashboard = lazy(() => import("./pages/HandoverDashboard"));
const BedManagement = lazy(() => import("./pages/BedManagement"));
const Patients = lazy(() => import("./pages/Patients"));
const AddAnthropometry = lazy(() => import("./pages/AddAnthropometry"));

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
          <Route 
            path="/patients" 
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Patients />
                </Suspense>
              </AppLayout>
            } 
          />
          <Route path="/patient/new" element={<AppLayout><NewPatient /></AppLayout>} />
          <Route path="/admission/new" element={<AppLayout><NewAdmission /></AppLayout>} />
          <Route path="/patient/:id" element={<AppLayout><PatientDetail /></AppLayout>} />
          <Route path="/patients/:id" element={<Navigate to="/patient/:id" replace />} />
          <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
          <Route 
            path="/patient/:id/anthropometry" 
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AddAnthropometry />
                </Suspense>
              </AppLayout>
            } 
          />
          
          {/* Documentos del paciente */}
          <Route 
            path="/patient/:patientId/documents" 
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <DocumentsPage />
                </Suspense>
              </AppLayout>
            } 
          />
          
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
          <Route path="/documents" element={<Navigate to="/documents/upload" replace />} />
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
          <Route
            path="/epicrisis"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Epicrisis />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/epicrisis/new"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <NewEpicrisis />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/epicrisis/:id"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <EpicrisisView />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/handover"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <HandoverDashboard />
                </Suspense>
              </AppLayout>
            }
          />
          <Route
            path="/beds"
            element={
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <BedManagement />
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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import Tenders from "./pages/Tenders";
import Evaluations from "./pages/Evaluations";
import Risks from "./pages/Risks";
import Communications from "./pages/Communications";
import Reports from "./pages/Reports";
import RoleRights from "./pages/RoleRights";
import Draft from "./pages/Draft";
import PreRfpValidator from "./pages/PreRfpValidator";
import RfpProcess from "./pages/RfpProcess";
import BidSubmission from "./pages/BidSubmission";
import Monitoring from "./pages/Monitoring";
import AiModels from "./pages/AiModels";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/tenders" element={<ProtectedRoute><Tenders /></ProtectedRoute>} />
      <Route path="/dashboard/evaluations" element={<ProtectedRoute><Evaluations /></ProtectedRoute>} />
      <Route path="/dashboard/risks" element={<ProtectedRoute><Risks /></ProtectedRoute>} />
      <Route path="/dashboard/communications" element={<ProtectedRoute><Communications /></ProtectedRoute>} />
      <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/dashboard/users" element={<ProtectedRoute><RoleRights /></ProtectedRoute>} />
      <Route path="/dashboard/draft" element={<ProtectedRoute><Draft /></ProtectedRoute>} />
      <Route path="/dashboard/validator" element={<ProtectedRoute><PreRfpValidator /></ProtectedRoute>} />
      <Route path="/dashboard/rfp-process" element={<ProtectedRoute><RfpProcess /></ProtectedRoute>} />
      <Route path="/dashboard/bid-submission" element={<ProtectedRoute><BidSubmission /></ProtectedRoute>} />
      <Route path="/dashboard/contract-monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
      <Route path="/dashboard/ai-models" element={<ProtectedRoute><AiModels /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

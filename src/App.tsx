import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

// Layout and pages
import { Layout } from "@/components";
import Dashboard from "@/pages/Dashboard";
import JobTracker from "@/pages/JobTracker";
import AutoApply from "@/pages/AutoApply";
import Credentials from "@/pages/Credentials";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

// Add global type for window to include authContext
declare global {
  interface Window {
    authContext: ReturnType<typeof useAuth> | null;
  }
}

// Create a client for React Query
const queryClient = new QueryClient();

// AuthContextProvider component to make auth context globally available
const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  
  useEffect(() => {
    // Make auth context available globally for token refresh
    window.authContext = auth;
    
    return () => {
      window.authContext = null;
    };
  }, [auth]);
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AuthContextProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                } />
                <Route path="/job-tracker" element={
                  <Layout>
                    <JobTracker />
                  </Layout>
                } />
                <Route path="/auto-apply" element={
                  <Layout>
                    <AutoApply />
                  </Layout>
                } />
                <Route path="/credentials" element={
                  <Layout>
                    <Credentials />
                  </Layout>
                } />
                <Route path="/settings" element={
                  <Layout>
                    <Settings />
                  </Layout>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthContextProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

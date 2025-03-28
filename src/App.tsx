import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

// Layout and pages
import { Layout } from "@/components";
import Dashboard from "@/pages/Dashboard";
import JobTracker from "@/pages/JobTracker";
import AutoApply from "@/pages/AutoApply";
import Credentials from "@/pages/Credentials";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

// Create a client for React Query
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

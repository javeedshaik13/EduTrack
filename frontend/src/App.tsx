import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import LoginPage from "@/components/auth/LoginPage";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Materials from "@/pages/Materials";
import Assignments from "@/pages/Assignments";
import AIAssistant from "@/pages/AIAssistant";
import Statistics from "@/pages/Statistics";
import Profile from "@/pages/Profile";
import Classrooms from "@/pages/Classrooms";
import ManageClassroom from "@/pages/ManageClassroom";
import ClassroomView from "@/pages/ClassroomView";
import AssignmentSubmission from "@/components/AssignmentSubmission";
import Chatbot from "@/pages/Chatbot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="edu-portal-theme"
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/materials"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Materials />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Assignments />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-assistant"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AIAssistant />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chatbot"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Chatbot />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/statistics"
                element={
                  <ProtectedRoute requiredRole="student">
                    <MainLayout>
                      <Statistics />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classrooms"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <MainLayout>
                      <Classrooms />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classrooms/:id/manage"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <MainLayout>
                      <ManageClassroom />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classrooms/:classroomId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ClassroomView />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments/:assignmentId/submit"
                element={
                  <ProtectedRoute requiredRole="student">
                    <MainLayout>
                      <AssignmentSubmission />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
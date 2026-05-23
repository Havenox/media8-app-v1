import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";

// Layout
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import OrdersPage from "@/pages/OrdersPage";
import NewOrderPage from "@/pages/NewOrderPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import UsersPage from "@/pages/UsersPage";
import ServicesPage from "@/pages/ServicesPage";

import SettingsPage from "@/pages/SettingsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import EditsPage from "@/pages/EditsPage";
import BrandingProfilesPage from "@/pages/BrandingProfilesPage";
import EditingProfilesPage from "@/pages/EditingProfilesPage";
import OffersPage from "@/pages/admin/OffersPage";
import VideoFormatsPage from "@/pages/admin/VideoFormatsPage";
import EditingStylesPage from "@/pages/admin/EditingStylesPage";
import AccessDeniedPage from "@/pages/AccessDeniedPage";
import NotFound from "@/pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              
              {/* Protected Routes */}
              <Route element={<MainLayout />}>
                {/* Common - All authenticated users */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                
                {/* Client + Admin routes */}
                <Route path="/services" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Client']}>
                    <ServicesPage />
                  </ProtectedRoute>
                } />
                
                {/* Client + Admin routes */}
                <Route path="/orders" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Client']}>
                    <OrdersPage />
                  </ProtectedRoute>
                } />
                <Route path="/orders/new" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Client']}>
                    <NewOrderPage />
                  </ProtectedRoute>
                } />
                <Route path="/orders/:id" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Client']}>
                    <OrderDetailPage />
                  </ProtectedRoute>
                } />
                
                {/* Editor + Admin routes */}
                <Route path="/edits" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
                    <EditsPage />
                  </ProtectedRoute>
                } />
                
{/* Admin only routes */}
<Route path="/users" element={
  <ProtectedRoute allowedRoles={['Admin']}>
    <UsersPage />
  </ProtectedRoute>
} />
<Route path="/admin/offers" element={
  <ProtectedRoute allowedRoles={['Admin']}>
    <OffersPage />
  </ProtectedRoute>
} />
<Route path="/admin/video-formats" element={
  <ProtectedRoute allowedRoles={['Admin']}>
    <VideoFormatsPage />
  </ProtectedRoute>
} />
<Route path="/admin/editing-styles" element={
  <ProtectedRoute allowedRoles={['Admin']}>
    <EditingStylesPage />
  </ProtectedRoute>
} />

{/* Branding Profiles - Client + Admin */}
<Route path="/branding-profiles" element={
  <ProtectedRoute allowedRoles={['Admin', 'Client']}>
    <BrandingProfilesPage />
  </ProtectedRoute>
} />

{/* Editing Profiles - Client + Admin */}
<Route path="/editing-profiles" element={
  <ProtectedRoute allowedRoles={['Admin', 'Client']}>
    <EditingProfilesPage />
  </ProtectedRoute>
} />
</Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

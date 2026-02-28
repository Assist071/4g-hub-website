import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import { useOrderStore } from "@/store/orderStore";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Menu from "./pages/Menu";
import Queue from "./pages/Queue";
import Kitchen from "./pages/Kitchen";
import Admin from "./pages/Admin";
import AdminLogin from "@/components/AdminLogin";
import StaffLogin from "./pages/StaffLogin";
import { IPValidation } from "@/components/IPValidation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

  const App = () => {
  const location = useLocation();
  const { checkAuth } = useAuthStore();
  const { loadOrdersFromDatabase, loadMenuItemsFromDatabase, loadCategoriesFromDatabase } = useOrderStore();

  useEffect(() => {
    checkAuth();
    // Load initial data from database
    loadOrdersFromDatabase();
    loadMenuItemsFromDatabase();
    loadCategoriesFromDatabase();
  }, [checkAuth, loadOrdersFromDatabase, loadMenuItemsFromDatabase, loadCategoriesFromDatabase]);

  // Hide Navigation on validation page
  const showNavigation = location.pathname !== '/';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showNavigation && <Navigation />}
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<IPValidation />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Index />} />} />
            <Route path="/queue" element={<ProtectedRoute element={<Queue />} />} />
            <Route path="/kitchen" element={<ProtectedRoute element={<Kitchen />} />} />
            <Route path="/admin" element={<ProtectedRoute element={<Admin />} />} />
            
            {/* Catch-all for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
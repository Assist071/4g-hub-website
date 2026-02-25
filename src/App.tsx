import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { checkAuth } = useAuthStore();
  const { loadOrdersFromDatabase, loadMenuItemsFromDatabase, loadCategoriesFromDatabase } = useOrderStore();

  useEffect(() => {
    checkAuth();
    // Load initial data from database
    loadOrdersFromDatabase();
    loadMenuItemsFromDatabase();
    loadCategoriesFromDatabase();
  }, [checkAuth, loadOrdersFromDatabase, loadMenuItemsFromDatabase, loadCategoriesFromDatabase]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Navigation />
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/admin" element={<ProtectedRoute element={<Admin />} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
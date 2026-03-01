import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { IPGuard } from "@/components/IPGuard";
import NotFound from "./pages/NotFound";
import { IPValidation } from "./components/IPValidation";
import { supabase } from "@/lib/supabase";
import { getDeviceTokenFromStorage } from "@/lib/deviceTokens";

const queryClient = new QueryClient();

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const { loadOrdersFromDatabase, loadMenuItemsFromDatabase, loadCategoriesFromDatabase } = useOrderStore();
  const [isIPValidated, setIsIPValidated] = useState<boolean | null>(null);

  // Check if current IP has an active session/is validated
  useEffect(() => {
    const checkIPValidation = async () => {
      try {
        // Get client IP
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const clientIP = ipData.ip;

        // Check if this IP is registered in detected_ips table
        const { data: ipRecord } = await supabase
          .from('detected_ips')
          .select('status, assigned_pc_id')
          .eq('ip_address', clientIP)
          .eq('status', 'registered')
          .single();

        setIsIPValidated(!!ipRecord && !!ipRecord.assigned_pc_id);
      } catch (err) {
        console.log('IP validation check:', err);
        // If we can't check, assume not validated (safe default)
        setIsIPValidated(false);
      }
    };

    checkIPValidation();
  }, []);

  // Monitor device token for revocation
  useEffect(() => {
    const deviceToken = getDeviceTokenFromStorage();
    if (!deviceToken) return;

    console.log('🔐 [APP] Monitoring device token for revocation...');

    const subscription = supabase
      .channel(`device_token_monitor_${deviceToken}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_tokens',
          filter: `token=eq.${deviceToken}`,
        },
        async (payload) => {
          const tokenRecord = payload.new as any;
          console.log('🔐 [APP] Device token status changed:', tokenRecord?.status);

          // If token was approved but is now rejected, redirect to validate
          if (tokenRecord?.status === 'rejected') {
            console.log('❌ [APP] Device token was revoked! Redirecting to /validate...');
            
            // Clear the token from storage
            localStorage.removeItem('device_token');
            
            // Redirect to validate page
            navigate('/validate', { replace: true });
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [APP TOKEN SUB] Status: ${status}`);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    checkAuth();
    // Load initial data from database
    loadOrdersFromDatabase();
    loadMenuItemsFromDatabase();
    loadCategoriesFromDatabase();
  }, [checkAuth, loadOrdersFromDatabase, loadMenuItemsFromDatabase, loadCategoriesFromDatabase]);

  // Monitor IP registration status for changes
  useEffect(() => {
    const monitorIPStatus = async () => {
      try {
        // Get client IP
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const clientIP = ipData.ip;

        console.log('📍 [APP] Monitoring IP status:', clientIP);

        const subscription = supabase
          .channel(`ip_status_monitor_${clientIP}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'detected_ips',
              filter: `ip_address=eq.${clientIP}`,
            },
            async (payload) => {
              const ipRecord = payload.new as any;
              console.log('📍 [APP] IP status changed:', ipRecord?.status);

              // If IP becomes unregistered or offline, redirect to validate
              if (!ipRecord || ipRecord.status !== 'registered') {
                console.log('❌ [APP] IP is no longer registered! Redirecting to /validate...');
                setIsIPValidated(false);
                navigate('/validate', { replace: true });
              }
            }
          )
          .subscribe((status) => {
            console.log(`📡 [APP IP SUB] Status: ${status}`);
          });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.log('IP status monitoring error:', err);
      }
    };

    if (isIPValidated) {
      monitorIPStatus();
    }
  }, [isIPValidated, navigate]);

  // Hide Navigation on validation page
  const showNavigation = location.pathname !== '/validate';

  // Show loading while checking validation
  if (isIPValidated === null) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking access...</p>
            </div>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showNavigation && <Navigation />}
        <Routes>
          {/* IP Validation Based Routes */}
          {isIPValidated ? (
            <Route path="/" element={<Landing />} />
          ) : (
            <Route path="/" element={<Navigate to="/validate" replace />} />
          )}
          
          <Route path="/validate" element={<IPValidation />} />
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
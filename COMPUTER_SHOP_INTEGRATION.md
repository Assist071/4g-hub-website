/**
 * COMPUTER SHOP AUTO-IP DETECTION SYSTEM
 * Integration Examples
 * 
 * This file shows how to integrate the IP validation and admin PC management
 * components into your existing React application.
 */

// ============================================================================
// EXAMPLE 1: Routing Setup
// ============================================================================

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { IPValidation } from '@/components/IPValidation';
import { PCManagementAdmin } from '@/components/PCManagementAdmin';

// Your existing pages
import { Landing } from '@/pages/Landing';
import { Admin } from '@/pages/Admin';

export function AppRouting() {
  return (
    <Router>
      <Routes>
        {/* 
          Customer validation flow
          Show this BEFORE the landing page to detect IP and manage PC access
        */}
        <Route path="/validate" element={<IPValidation />} />

        {/* 
          Admin PC management dashboard
          Integrate into admin panel for staff to manage computers
        */}
        <Route path="/admin/pc-management" element={<PCManagementAdmin />} />

        {/* 
          Admin main page - add link to PC management
        */}
        <Route path="/admin" element={<Admin />} />

        {/* 
          Landing page
          Auto-redirect here after IP validation passes
        */}
        <Route path="/" element={<Landing />} />
      </Routes>
    </Router>
  );
}

// ============================================================================
// EXAMPLE 2: Modify Existing Navigation to Add PC Management Link
// ============================================================================

import { Navigation } from '@/components/Navigation';

export function EnhancedNavigation() {
  return (
    <nav>
      <Navigation />
      <a href="/admin/pc-management" className="admin-link">
        PC Management
      </a>
    </nav>
  );
}

// ============================================================================
// EXAMPLE 3: Protect Routes - Check Session Before Showing App
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAdminAuthenticated } = useAuthStore();
  const [clientIP, setClientIP] = useState<string | null>(null);

  // Detect client IP and verify session
  useEffect(() => {
    const detectIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setClientIP(data.ip);

        // TODO: Verify IP has active session
        // If not, redirect to /validate
      } catch (error) {
        console.error('IP detection failed:', error);
      }
    };

    detectIP();
  }, []);

  // Auto-redirect unvalidated IPs
  if (!clientIP) {
    return <div>Detecting station...</div>;
  }

  return <>{children}</>;
}

// ============================================================================
// EXAMPLE 4: Use Custom Hook in Custom Component
// ============================================================================

import { useComputerShopDatabase } from '@/hooks/useComputerShopDatabase';
import { useEffect, useState } from 'react';

export function CustomPCMonitoringWidget() {
  const [onlinePCCount, setOnlinePCCount] = useState(0);
  const [pendingPCCount, setPendingPCCount] = useState(0);
  const { getAllPCs, subscribeToPCChanges } = useComputerShopDatabase();

  useEffect(() => {
    const loadPCs = async () => {
      const pcs = await getAllPCs();
      setOnlinePCCount(pcs.filter((p) => p.status === 'online').length);
      setPendingPCCount(pcs.filter((p) => p.status === 'pending').length);
    };

    loadPCs();

    // Subscribe to changes
    const unsubscribe = subscribeToPCChanges((updatedPC) => {
      loadPCs(); // Reload counts when any PC changes
    });

    return () => unsubscribe();
  }, [getAllPCs, subscribeToPCChanges]);

  return (
    <div className="monitoring-widget">
      <div>
        <span>Online:</span>
        <strong>{onlinePCCount}</strong>
      </div>
      <div>
        <span>Pending:</span>
        <strong>{pendingPCCount}</strong>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Admin Panel Enhancement - Add to Admin.tsx
// ============================================================================

import { tabs } from '@/pages/Admin'; // Your existing admin tabs

// In your Admin.tsx, add this new tab:
export const computerShopAdminTab = {
  label: 'PC Management',
  value: 'pcs',
  component: PCManagementAdmin,
  icon: Server,
};

// Then add to tabs array:
// const adminTabs = [...tabs, computerShopAdminTab];

// ============================================================================
// EXAMPLE 6: Middleware for Session Validation on App Load
// ============================================================================

import { useEffect } from 'react';

export function SessionValidationMiddleware() {
  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();

        // Check if IP has valid session
        const hasValidSession = await checkIPSession(ip);

        if (!hasValidSession) {
          // Redirect to validation
          window.location.href = '/validate';
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        // Optionally redirect to validation on error
        // window.location.href = '/validate';
      }
    };

    validateSession();
  }, []);

  return null;
}

async function checkIPSession(ip: string): Promise<boolean> {
  // This would query your backend to check if IP has active session
  // For now, return true to allow access
  return true;
}

// ============================================================================
// EXAMPLE 7: Use in App.tsx Main Component
// ============================================================================

import { AppRouting } from './routing';
import { SessionValidationMiddleware } from './middleware';

export function App() {
  return (
    <>
      <SessionValidationMiddleware />
      <AppRouting />
    </>
  );
}

// ============================================================================
// EXAMPLE 8: Standalone PC Validation Page Component
// ============================================================================

import { FC } from 'react';
import { IPValidation } from '@/components/IPValidation';

export const PCValidationPage: FC = () => {
  return (
    <div className="pc-validation-page">
      <IPValidation />
    </div>
  );
};

// Export as route component
export default PCValidationPage;

// ============================================================================
// EXAMPLE 9: Admin Dashboard Enhancement with Stats
// ============================================================================

import { useComputerShopDatabase } from '@/hooks/useComputerShopDatabase';
import { useCallback, useEffect, useState } from 'react';

export function AdminDashboardWithStats() {
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    pending: 0,
    offline: 0,
    maintenance: 0,
  });

  const { getAllPCs, subscribeToPCChanges } = useComputerShopDatabase();

  const calculateStats = useCallback(async () => {
    const pcs = await getAllPCs();
    setStats({
      total: pcs.length,
      online: pcs.filter((p) => p.status === 'online').length,
      pending: pcs.filter((p) => p.status === 'pending').length,
      offline: pcs.filter((p) => p.status === 'offline').length,
      maintenance: pcs.filter((p) => p.status === 'maintenance').length,
    });
  }, [getAllPCs]);

  useEffect(() => {
    calculateStats();

    const unsubscribe = subscribeToPCChanges(() => {
      calculateStats();
    });

    return () => unsubscribe();
  }, [calculateStats, subscribeToPCChanges]);

  return (
    <div className="admin-stats">
      <div className="stat-card">
        <h3>Total PCs</h3>
        <p className="stat-value">{stats.total}</p>
      </div>
      <div className="stat-card online">
        <h3>Online</h3>
        <p className="stat-value">{stats.online}</p>
      </div>
      <div className="stat-card pending">
        <h3>Pending</h3>
        <p className="stat-value">{stats.pending}</p>
      </div>
      <div className="stat-card offline">
        <h3>Offline</h3>
        <p className="stat-value">{stats.offline}</p>
      </div>
      <div className="stat-card maintenance">
        <h3>Maintenance</h3>
        <p className="stat-value">{stats.maintenance}</p>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Real-Time Notifiation System for Admin
// ============================================================================

import { useComputerShopDatabase } from '@/hooks/useComputerShopDatabase';
import { useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function AdminNotificationsSubscriber() {
  const { toast } = useToast();
  const { subscribeToPCChanges } = useComputerShopDatabase();

  useEffect(() => {
    const unsubscribe = subscribeToPCChanges((pc) => {
      if (pc.status === 'pending') {
        toast({
          title: '🔔 New Request',
          description: `${pc.pc_number} is requesting access from ${pc.ip_address}`,
          duration: 5000,
        });
      }

      if (pc.status === 'online') {
        toast({
          title: '✅ Access Granted',
          description: `${pc.pc_number} is now online`,
          duration: 3000,
        });
      }
    });

    return () => unsubscribe();
  }, [toast, subscribeToPCChanges]);

  return null;
}

// ============================================================================
// DATABASE MIGRATION CHECKLIST
// ============================================================================

/*
Before deploying to production, ensure:

1. ✅ Run COMPUTER_SHOP_SCHEMA.sql in Supabase
   - Creates pcs table with sample data
   - Creates sessions table
   - Enables realtime subscriptions
   - Creates indexes for performance

2. ✅ Set up Row Level Security (RLS)
   - Customers can only view available PCs
   - Admins can manage all PCs
   - Sessions are write-restricted

3. ✅ Configure environment variables
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

4. ✅ Test in development
   - Validate IP detection works
   - Test PC selection flow
   - Verify real-time updates
   - Check admin actions

5. ✅ Deploy to production
   - No changes needed to existing code
   - Just add routes and components
   - Monitor Supabase dashboard for issues
*/

// ============================================================================
// TYPESCRIPT INTERFACES (if using separately)
// ============================================================================

export interface PC {
  id: number;
  pc_number: string;
  ip_address: string | null;
  status: 'offline' | 'online' | 'pending' | 'maintenance';
  current_session_id: string | null;
  session_started_at: string | null;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  pc_id: number;
  ip_address: string;
  status: 'pending' | 'active' | 'ended' | 'rejected';
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// QUICK REFERENCE - API ENDPOINT
// ============================================================================

/*
IP Detection API: https://api.ipify.org?format=json
Response: { "ip": "192.168.1.101" }

CORS: Enabled (should work from browsers)
Rate Limit: 30 requests per minute per IP
*/

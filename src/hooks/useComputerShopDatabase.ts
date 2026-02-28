import { supabase } from '@/lib/supabase';
import { useCallback, useState } from 'react';

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

export function useComputerShopDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Detect client IP address
   */
  const detectClientIP = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (err) {
      console.error('Failed to detect IP:', err);
      return null;
    }
  }, []);

  /**
   * Check if IP exists in database
   */
  const checkIPExists = useCallback(async (ipAddress: string): Promise<PC | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pcs')
        .select('*')
        .eq('ip_address', ipAddress)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      return data || null;
    } catch (err) {
      console.error('Error checking IP:', err);
      return null;
    }
  }, []);

  /**
   * Get all available PCs (offline or maintenance)
   */
  const getAvailablePCs = useCallback(async (): Promise<PC[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pcs')
        .select('*')
        .in('status', ['offline', 'maintenance'])
        .order('pc_number', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching available PCs:', err);
      return [];
    }
  }, []);

  /**
   * Get all PCs for admin view
   */
  const getAllPCs = useCallback(async (): Promise<PC[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pcs')
        .select('*')
        .order('pc_number', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching PCs:', err);
      return [];
    }
  }, []);

  /**
   * Get PC by number
   */
  const getPCByNumber = useCallback(async (pcNumber: string): Promise<PC | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pcs')
        .select('*')
        .eq('pc_number', pcNumber.toUpperCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      return data || null;
    } catch (err) {
      console.error('Error fetching PC by number:', err);
      return null;
    }
  }, []);

  /**
   * Request access to a PC
   */
  const requestPCAccess = useCallback(
    async (pcId: number, ipAddress: string): Promise<Session | null> => {
      try {
        setLoading(true);
        setError(null);

        // Create session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert([
            {
              pc_id: pcId,
              ip_address: ipAddress,
              status: 'pending',
            },
          ])
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Update PC with IP and pending status
        const { error: pcError } = await supabase
          .from('pcs')
          .update({
            ip_address: ipAddress,
            status: 'pending',
            last_seen: new Date().toISOString(),
          })
          .eq('id', pcId);

        if (pcError) throw pcError;

        return sessionData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to request access';
        setError(errorMsg);
        console.error('Error requesting access:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Grant access (admin action)
   */
  const grantAccess = useCallback(async (pcId: number, sessionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Update session status
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({
          status: 'active',
          started_at: now,
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Update PC status
      const { error: pcError } = await supabase
        .from('pcs')
        .update({
          status: 'online',
          session_started_at: now,
          last_seen: now,
          current_session_id: sessionId,
        })
        .eq('id', pcId);

      if (pcError) throw pcError;

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to grant access';
      setError(errorMsg);
      console.error('Error granting access:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set PC status to online directly (without session requirement)
   */
  const setPCOnline = useCallback(async (pcId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      const { error: pcError } = await supabase
        .from('pcs')
        .update({
          status: 'online',
          session_started_at: now,
          last_seen: now,
        })
        .eq('id', pcId);

      if (pcError) throw pcError;

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set PC online';
      setError(errorMsg);
      console.error('Error setting PC online:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deny access (admin action)
   */
  const denyAccess = useCallback(async (pcId: number, sessionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Update session status
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({
          status: 'rejected',
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Reset PC
      const { error: pcError } = await supabase
        .from('pcs')
        .update({
          ip_address: null,
          status: 'offline',
          last_seen: new Date().toISOString(),
        })
        .eq('id', pcId);

      if (pcError) throw pcError;

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to deny access';
      setError(errorMsg);
      console.error('Error denying access:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * End session (admin action) - keeps IP for auto-detect
   */
  const endSession = useCallback(async (pcId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Get current session
      const { data: pc } = await supabase.from('pcs').select('current_session_id').eq('id', pcId).single();

      if (pc?.current_session_id) {
        // End session
        await supabase
          .from('sessions')
          .update({
            status: 'ended',
            ended_at: now,
          })
          .eq('id', pc.current_session_id);
      }

      // Update PC status to offline but keep IP
      const { error: pcError } = await supabase
        .from('pcs')
        .update({
          status: 'offline',
          session_started_at: null,
          current_session_id: null,
          last_seen: now,
        })
        .eq('id', pcId);

      if (pcError) throw pcError;

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMsg);
      console.error('Error ending session:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Kick client (admin action) - removes IP assignment
   */
  const kickClient = useCallback(async (pcId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Get current session
      const { data: pc } = await supabase.from('pcs').select('current_session_id').eq('id', pcId).single();

      if (pc?.current_session_id) {
        // End session
        await supabase
          .from('sessions')
          .update({
            status: 'ended',
            ended_at: now,
          })
          .eq('id', pc.current_session_id);
      }

      // Update PC status to offline and remove IP
      const { error: pcError } = await supabase
        .from('pcs')
        .update({
          ip_address: null,
          status: 'offline',
          session_started_at: null,
          current_session_id: null,
          last_seen: now,
        })
        .eq('id', pcId);

      if (pcError) throw pcError;

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to kick client';
      setError(errorMsg);
      console.error('Error kicking client:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set PC to maintenance (admin action)
   */
  const setMaintenance = useCallback(async (pcId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Get current session
      const { data: pc } = await supabase.from('pcs').select('current_session_id').eq('id', pcId).single();

      if (pc?.current_session_id) {
        await supabase.from('sessions').update({ status: 'ended', ended_at: now }).eq('id', pc.current_session_id);
      }

      // Update PC to maintenance
      const { error: pcError } = await supabase
        .from('pcs')
        .update({
          status: 'maintenance',
          session_started_at: null,
          current_session_id: null,
          last_seen: now,
        })
        .eq('id', pcId);

      if (pcError) throw pcError;

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set maintenance';
      setError(errorMsg);
      console.error('Error setting maintenance:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Restore PC from maintenance
   */
  const restoreFromMaintenance = useCallback(async (pcId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: pcError } = await supabase
        .from('pcs')
        .update({
          status: 'offline',
          last_seen: new Date().toISOString(),
        })
        .eq('id', pcId);

      if (pcError) throw pcError;

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to restore PC';
      setError(errorMsg);
      console.error('Error restoring PC:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Subscribe to PC changes
   */
  const subscribeToPCChanges = useCallback((callback: (pc: PC) => void) => {
    const subscription = supabase
      .channel('pcs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pcs',
        },
        (payload) => {
          callback(payload.new as PC);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Subscribe to session changes for a specific PC
   */
  const subscribeToSessionChanges = useCallback(
    (pcId: number, callback: (session: Session) => void) => {
      const subscription = supabase
        .channel(`sessions-pc-${pcId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sessions',
          },
          (payload) => {
            const session = payload.new as Session;
            if (session.pc_id === pcId) {
              callback(session);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    },
    []
  );

  /**
   * Log detected IP that is not yet registered to any PC
   */
  const logDetectedIP = useCallback(async (ipAddress: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check if IP already exists in detected_ips
      const { data: existing } = await supabase
        .from('detected_ips')
        .select('id')
        .eq('ip_address', ipAddress)
        .eq('status', 'pending')
        .single();

      // Only insert if it doesn't already exist
      if (!existing) {
        const { error: insertError } = await supabase
          .from('detected_ips')
          .insert([
            {
              ip_address: ipAddress,
              status: 'pending',
            },
          ]);

        if (insertError) throw insertError;
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to log detected IP';
      setError(errorMsg);
      console.error('Error logging detected IP:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all detected IPs
   */
  const getDetectedIPs = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('detected_ips')
        .select('*')
        .order('detected_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching detected IPs:', err);
      return [];
    }
  }, []);

  /**
   * Update detected IP status
   */
  const updateDetectedIPStatus = useCallback(
    async (ipAddress: string, newStatus: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('💾 [DB] Updating detected IP status...');
        console.log('💾 [DB] IP:', ipAddress, '| New Status:', newStatus);

        const { error: updateError } = await supabase
          .from('detected_ips')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('ip_address', ipAddress);

        if (updateError) {
          console.error('❌ [DB] Status update error:', updateError);
          throw updateError;
        }
        console.log('✅ [DB] IP status updated successfully to:', newStatus);

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update IP status';
        setError(errorMsg);
        console.error('❌ [DB] Error updating IP status:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Assign detected IP to a PC
   */
  const assignIPToPC = useCallback(
    async (ipAddress: string, pcId: number): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('💾 [DB] Starting to assign IP to PC...');
        console.log('💾 [DB] IP:', ipAddress, '| PC ID:', pcId);

        // Update PC with IP
        console.log('💾 [DB] Updating PC table...');
        const { error: pcError } = await supabase
          .from('pcs')
          .update({
            ip_address: ipAddress,
            status: 'offline',
            last_seen: new Date().toISOString(),
          })
          .eq('id', pcId);

        if (pcError) {
          console.error('❌ [DB] PC update error:', pcError);
          throw pcError;
        }
        console.log('✅ [DB] PC updated successfully');

        // Update detected_ips record
        console.log('💾 [DB] Updating detected_ips table...');
        console.log('💾 [DB] Setting status="registered" for IP:', ipAddress);
        const { error: ipError } = await supabase
          .from('detected_ips')
          .update({
            status: 'registered',
            assigned_pc_id: pcId,
            registered_at: new Date().toISOString(),
          })
          .eq('ip_address', ipAddress);

        if (ipError) {
          console.error('❌ [DB] detected_ips update error:', ipError);
          throw ipError;
        }
        console.log('✅ [DB] detected_ips updated successfully - status=registered');
        console.log('✅ [DB] Assignment complete!');

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to assign IP to PC';
        setError(errorMsg);
        console.error('❌ [DB] Error assigning IP to PC:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Delete a detected IP and remove it from PC
   */
  const deleteDetectedIP = useCallback(
    async (ipAddress: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        console.log('🗑️ [DB] Deleting detected IP...');
        console.log('🗑️ [DB] IP:', ipAddress);

        // First, get the detected IP record to see which PC it's assigned to
        const { data: detectedIPData, error: fetchError } = await supabase
          .from('detected_ips')
          .select('assigned_pc_id')
          .eq('ip_address', ipAddress)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('❌ [DB] Error fetching detected IP:', fetchError);
          throw fetchError;
        }

        const assignedPCId = detectedIPData?.assigned_pc_id;
        console.log('🗑️ [DB] Assigned PC ID:', assignedPCId);

        // Delete from detected_ips table
        console.log('🗑️ [DB] Deleting from detected_ips...');
        const { error: deleteError } = await supabase
          .from('detected_ips')
          .delete()
          .eq('ip_address', ipAddress);

        if (deleteError) {
          console.error('❌ [DB] Delete error:', deleteError);
          throw deleteError;
        }
        console.log('✅ [DB] Deleted from detected_ips');

        // If PC was assigned, remove IP from PC table
        if (assignedPCId) {
          console.log('🗑️ [DB] Clearing IP from PC table for PC ID:', assignedPCId);
          const { error: pcError } = await supabase
            .from('pcs')
            .update({
              ip_address: null,
              last_seen: new Date().toISOString(),
            })
            .eq('id', assignedPCId);

          if (pcError) {
            console.error('❌ [DB] PC update error:', pcError);
            throw pcError;
          }
          console.log('✅ [DB] IP cleared from PC table');
        }

        console.log('✅ [DB] IP deletion complete:', ipAddress);
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete IP';
        setError(errorMsg);
        console.error('❌ [DB] Error deleting IP:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Subscribe to detected IPs changes
   */
  const subscribeToDetectedIPChanges = useCallback((callback: (ips: any[]) => void) => {
    const subscription = supabase
      .channel('detected_ips_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'detected_ips',
        },
        async () => {
          const ips = await getDetectedIPs();
          callback(ips);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [getDetectedIPs]);

  return {
    loading,
    error,
    detectClientIP,
    checkIPExists,
    getAvailablePCs,
    getAllPCs,
    getPCByNumber,
    requestPCAccess,
    grantAccess,
    denyAccess,
    endSession,
    kickClient,
    setMaintenance,
    restoreFromMaintenance,
    subscribeToPCChanges,
    subscribeToSessionChanges,
    logDetectedIP,
    getDetectedIPs,
    assignIPToPC,
    subscribeToDetectedIPChanges,
    updateDetectedIPStatus,
    deleteDetectedIP,
    setPCOnline,
  };
}

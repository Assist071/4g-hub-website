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
   * Revoke all approved tokens for a PC (when PC goes offline)
   * Revokes tokens based on both pc_id AND ip_address
   * Also marks the IP as unregistered so user must request new token
   */
  const revokeTokensForPC = useCallback(async (pcId: number, ipAddress?: string | null): Promise<boolean> => {
    try {
      console.log('🔐 [REVOKE] Revoking tokens for PC ID:', pcId, 'IP:', ipAddress);

      // Revoke tokens by pc_id
      const { data: tokensByPcId, error: fetchErrorPcId } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('pc_id', pcId)
        .eq('status', 'approved');

      if (fetchErrorPcId) {
        console.error('🔐 [REVOKE] Error fetching tokens by pc_id:', fetchErrorPcId);
        throw fetchErrorPcId;
      }

      console.log('🔐 [REVOKE] Found', tokensByPcId?.length || 0, 'approved token(s) by pc_id');

      // Revoke tokens by pc_id
      if (tokensByPcId && tokensByPcId.length > 0) {
        console.log('🔐 [REVOKE] Revoking', tokensByPcId.length, 'token(s) by pc_id');
        const { error: updateErrorPcId } = await supabase
          .from('device_tokens')
          .update({
            status: 'rejected',
          })
          .eq('pc_id', pcId)
          .eq('status', 'approved');

        if (updateErrorPcId) {
          console.error('🔐 [REVOKE] Error revoking tokens by pc_id:', updateErrorPcId);
          throw updateErrorPcId;
        }
      }

      // Find and revoke approved tokens by IP address (even if not assigned to pc_id)
      if (ipAddress) {
        const { data: tokensByIp, error: fetchErrorIp } = await supabase
          .from('device_tokens')
          .select('id')
          .eq('ip_address', ipAddress)
          .eq('status', 'approved');

        if (fetchErrorIp) {
          console.error('🔐 [REVOKE] Error fetching tokens by IP:', fetchErrorIp);
          throw fetchErrorIp;
        }

        console.log('🔐 [REVOKE] Found', tokensByIp?.length || 0, 'approved token(s) by IP address:', ipAddress);

        if (tokensByIp && tokensByIp.length > 0) {
          console.log('🔐 [REVOKE] Revoking approved token(s) for IP:', ipAddress);
          const { error: updateErrorIp } = await supabase
            .from('device_tokens')
            .update({
              status: 'rejected',
            })
            .eq('ip_address', ipAddress)
            .eq('status', 'approved');

          if (updateErrorIp) {
            console.error('🔐 [REVOKE] Error revoking tokens by IP:', updateErrorIp);
            throw updateErrorIp;
          }
        }

        // Mark IP as unregistered (pending) so user must request new token
        console.log('🔐 [REVOKE] Marking IP as unregistered:', ipAddress);
        const { error: ipUpdateError } = await supabase
          .from('detected_ips')
          .update({
            status: 'pending',
            assigned_pc_id: null,
          })
          .eq('ip_address', ipAddress)
          .eq('status', 'registered');

        if (ipUpdateError) {
          console.error('🔐 [REVOKE] Warning: Could not update IP status:', ipUpdateError);
          // Don't throw - this is not critical
        } else {
          console.log('✅ [REVOKE] IP marked as pending for new token request');
        }
      }

      console.log('✅ [REVOKE] Successfully revoked all approved token(s) for PC:', pcId);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to revoke tokens for PC';
      console.error('❌ [REVOKE] Error:', errorMsg);
      return false;
    }
  }, []);

  /**
   * Deny access (admin action)
   */
  const denyAccess = useCallback(async (pcId: number, sessionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // First, get the PC's current IP address before updating
      const { data: pc } = await supabase
        .from('pcs')
        .select('ip_address')
        .eq('id', pcId)
        .single();

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

      // Revoke any approved tokens for this PC
      console.log('🔑 [DENY] Access denied, revoking tokens...');
      await revokeTokensForPC(pcId, pc?.ip_address);

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to deny access';
      setError(errorMsg);
      console.error('Error denying access:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [revokeTokensForPC]);

  /**
   * End session (admin action) - keeps IP for auto-detect
   */
  const endSession = useCallback(async (pcId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Get current session and PC's IP address
      const { data: pc } = await supabase.from('pcs').select('current_session_id, ip_address').eq('id', pcId).single();

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

      // Revoke any approved tokens for this PC
      console.log('🔑 [END SESSION] Session ended, revoking tokens...');
      await revokeTokensForPC(pcId, pc?.ip_address);

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMsg);
      console.error('Error ending session:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [revokeTokensForPC]);

  /**
   * Kick client (admin action) - removes IP assignment
   */
  const kickClient = useCallback(async (pcId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Get current session and PC's IP address
      const { data: pc } = await supabase.from('pcs').select('current_session_id, ip_address').eq('id', pcId).single();

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

      // Revoke any approved tokens for this PC
      console.log('🔑 [KICK] PC going offline, revoking tokens...');
      await revokeTokensForPC(pcId, pc?.ip_address);

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to kick client';
      setError(errorMsg);
      console.error('Error kicking client:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [revokeTokensForPC]);

  /**
   * Set PC to maintenance (admin action)
   */
  const setMaintenance = useCallback(async (pcId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Get current session and IP address
      const { data: pc } = await supabase.from('pcs').select('current_session_id, ip_address').eq('id', pcId).single();

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

      // Revoke any approved tokens for this PC
      console.log('🔑 [MAINTENANCE] PC going to maintenance, revoking tokens...');
      await revokeTokensForPC(pcId, pc?.ip_address);

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set maintenance';
      setError(errorMsg);
      console.error('Error setting maintenance:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [revokeTokensForPC]);

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

        // Update PC with IP and set to PENDING (waiting for final confirmation/activation)
        console.log('💾 [DB] Updating PC table...');
        const now = new Date().toISOString();
        const { error: pcError } = await supabase
          .from('pcs')
          .update({
            ip_address: ipAddress,
            status: 'pending',
            last_seen: now,
          })
          .eq('id', pcId);

        if (pcError) {
          console.error('❌ [DB] PC update error:', pcError);
          throw pcError;
        }
        console.log('✅ [DB] PC updated successfully to PENDING (waiting for activation)');

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
          // Add delay to ensure database writes are complete
          await new Promise(resolve => setTimeout(resolve, 500));
          const ips = await getDetectedIPs();
          callback(ips);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [getDetectedIPs]);

  /**
   * Create a new device token
   */
  const createDeviceToken = useCallback(
    async (ipAddress: string, deviceName?: string): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);

        // Generate a unique token
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const token = Array.from(array)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const { data, error: insertError } = await supabase
          .from('device_tokens')
          .insert([
            {
              token,
              ip_address: ipAddress,
              device_name: deviceName || `Device from ${ipAddress}`,
              status: 'pending',
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        // Create notification for all admins
        const { data: admins } = await supabase
          .from('staff_users')
          .select('id')
          .eq('role', 'admin');

        if (admins && admins.length > 0) {
          const notifications = admins.map((admin) => ({
            admin_id: admin.id,
            type: 'device_token',
            title: 'New Device Token Pending Approval',
            message: `Device from IP ${ipAddress} (${deviceName}) is requesting access. Token: ${token}`,
            reference_type: 'device_token',
            reference_id: data.id,
          }));

          await supabase.from('admin_notifications').insert(notifications);
        }

        return token;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create device token';
        setError(errorMsg);
        console.error('Error creating device token:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Verify device token
   */
  const verifyDeviceToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('token', token)
        .eq('status', 'approved')
        .gt('expires_at', 'now()')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        // Update last_used timestamp
        await supabase
          .from('device_tokens')
          .update({ last_used: new Date().toISOString() })
          .eq('id', data.id);

        return true;
      }

      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to verify device token';
      setError(errorMsg);
      console.error('Error verifying device token:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all device tokens
   */
  const getDeviceTokens = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('device_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching device tokens:', err);
      return [];
    }
  }, []);

  /**
   * Approve device token (admin action)
   */
  const approveDeviceToken = useCallback(
    async (tokenId: number, pcId?: number): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { data: tokenData } = await supabase
          .from('device_tokens')
          .select('*')
          .eq('id', tokenId)
          .single();

        if (!tokenData) {
          throw new Error('Token not found');
        }

        // Update token status to approved
        const { error: updateError } = await supabase
          .from('device_tokens')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            pc_id: pcId || null,
          })
          .eq('id', tokenId);

        if (updateError) throw updateError;

        // Assign IP to PC if pcId provided
        if (pcId && tokenData.ip_address) {
          await assignIPToPC(tokenData.ip_address, pcId);
        }

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to approve device token';
        setError(errorMsg);
        console.error('Error approving device token:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [assignIPToPC]
  );

  /**
   * Reject device token (admin action)
   */
  const rejectDeviceToken = useCallback(async (tokenId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('device_tokens')
        .update({
          status: 'rejected',
        })
        .eq('id', tokenId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject device token';
      setError(errorMsg);
      console.error('Error rejecting device token:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a device token
   */
  const deleteDeviceToken = useCallback(async (tokenId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('device_tokens')
        .delete()
        .eq('id', tokenId);

      if (deleteError) throw deleteError;

      console.log('✅ Device token deleted successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete device token';
      setError(errorMsg);
      console.error('Error deleting device token:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete all device tokens by status
   */
  const deleteAllDeviceTokensByStatus = useCallback(async (status: 'pending' | 'rejected'): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('device_tokens')
        .delete()
        .eq('status', status);

      if (deleteError) throw deleteError;

      console.log(`✅ All ${status} device tokens deleted successfully`);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to delete all ${status} device tokens`;
      setError(errorMsg);
      console.error(`Error deleting all ${status} device tokens:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Subscribe to device token changes
   */
  const subscribeToDeviceTokenChanges = useCallback((callback: (tokens: any[]) => void) => {
    const subscription = supabase
      .channel('device_tokens_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_tokens',
        },
        async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          const tokens = await getDeviceTokens();
          callback(tokens);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [getDeviceTokens]);

  /**
   * Get admin notifications
   */
  const getAdminNotifications = useCallback(async (adminId: number) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
      return [];
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback(async (notificationId: number): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  /**
   * Subscribe to admin notifications
   */
  const subscribeToAdminNotifications = useCallback((adminId: number, callback: (notifications: any[]) => void) => {
    const subscription = supabase
      .channel(`admin_notifications_${adminId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
          filter: `admin_id=eq.${adminId}`,
        },
        async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          const notifications = await getAdminNotifications(adminId);
          callback(notifications);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [getAdminNotifications]);

  /**
   * Refresh both PCs and detected IPs data
   */
  const refreshAllData = useCallback(async () => {
    try {
      const pcs = await getAllPCs();
      const ips = await getDetectedIPs();
      return { pcs, ips };
    } catch (err) {
      console.error('Error refreshing data:', err);
      return null;
    }
  }, [getAllPCs, getDetectedIPs]);

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
    refreshAllData,
    // Device token functions
    createDeviceToken,
    verifyDeviceToken,
    getDeviceTokens,
    approveDeviceToken,
    rejectDeviceToken,
    deleteDeviceToken,
    deleteAllDeviceTokensByStatus,
    revokeTokensForPC,
    subscribeToDeviceTokenChanges,
    // Admin notification functions
    getAdminNotifications,
    markNotificationAsRead,
    subscribeToAdminNotifications,
  };
}

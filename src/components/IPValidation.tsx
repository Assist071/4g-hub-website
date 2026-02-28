import { useEffect, useState } from 'react';
import { useComputerShopDatabase, type PC, type Session } from '@/hooks/useComputerShopDatabase';
import { Button } from '@/components/ui/button';
import { Loader2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './IPValidation.css';

interface IPValidationState {
  step: 'detecting' | 'waiting' | 'error';
  ip: string | null;
  session: Session | null;
  errorMessage: string | null;
}

export function IPValidation() {
  const [state, setState] = useState<IPValidationState>({
    step: 'detecting',
    ip: null,
    session: null,
    errorMessage: null,
  });

  const [loading, setLoading] = useState(false);
  const { detectClientIP, checkIPExists, requestPCAccess, subscribeToSessionChanges, logDetectedIP } =
    useComputerShopDatabase();

  // Step 1: Detect IP
  useEffect(() => {
    const detectIP = async () => {
      const detectedIP = await detectClientIP();

      if (!detectedIP) {
        setState((prev) => ({
          ...prev,
          step: 'error',
          errorMessage: 'Failed to detect your IP address. Please refresh and try again.',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        ip: detectedIP,
        step: 'waiting',
      }));
    };

    detectIP();
  }, [detectClientIP]);

  // Step 2: Check IP and request access for associated PC
  useEffect(() => {
    if (state.step !== 'waiting' || !state.ip || state.session) return;

    let unsubscribeIP: (() => void) | null = null;
    let unsubscribeSession: (() => void) | null = null;

    const autoRequest = async () => {
      setLoading(true);
      try {
        // Check if IP has a known PC
        const pc = await checkIPExists(state.ip);
        console.log('🔍 [CHECK] IP exists in database?', !!pc);

        if (!pc) {
          console.log('🆕 [NEW IP] IP not found in database, logging as detected IP');
          // Log this detected IP to database for admin review
          await logDetectedIP(state.ip);
          console.log('✅ [NEW IP] Detected IP logged to database:', state.ip);
          
          // Show waiting screen with detected IP - admin will register it
          setState((prev) => ({
            ...prev,
            step: 'waiting',
          }));

          // Use a local variable to avoid closure issues
          const currentIP = state.ip;
          console.log('🔐 [CLOSURE] Using currentIP:', currentIP);
          
          // Subscribe to detected_ips table changes for this IP
          console.log('📡 [SUBSCRIPTION] Setting up subscription for IP:', currentIP);
          const subscription = supabase
            .channel(`ip_${currentIP}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'detected_ips',
                filter: `ip_address=eq.${currentIP}`,
              },
              async (payload) => {
                console.log('📨 [EVENT] Raw payload received:', JSON.stringify(payload));
                
                const ipRecord = payload.new as any;
                console.log('🔄 [SUBSCRIPTION] IP update received:', ipRecord?.ip_address);
                console.log('🔄 [SUBSCRIPTION] Status:', ipRecord?.status, '| Assigned PC:', ipRecord?.assigned_pc_id);
                console.log('🔄 [SUBSCRIPTION] Full record:', JSON.stringify(ipRecord));

                // If status is registered and has assigned PC, redirect to landing page
                if (ipRecord?.status === 'registered' && ipRecord?.assigned_pc_id) {
                  console.log('✅ [SUBSCRIPTION] IP registered! Ready to redirect...');
                  console.log('✅ [SUBSCRIPTION] PC ID:', ipRecord.assigned_pc_id);
                  
                  // Clean up subscription before redirect
                  console.log('🧹 [SUBSCRIPTION] Cleaning up before redirect');
                  unsubscribeIP?.();
                  
                  // Wait a moment for PC status to update
                  setTimeout(() => {
                    console.log('🚀 [REDIRECT] NOW redirecting to home page!');
                    window.location.href = '/';
                  }, 1500);
                } else {
                  console.log('⏳ [SUBSCRIPTION] Not ready yet. Status:', ipRecord?.status, 'PC ID:', ipRecord?.assigned_pc_id);
                }
              }
            )
            .subscribe((status, err) => {
              console.log(`📡 [SUBSCRIPTION] Subscription status: ${status}`);
              if (err) {
                console.error('📡 [SUBSCRIPTION] Subscription error:', err);
              }
              if (status === 'SUBSCRIBED') {
                console.log('✅ [SUBSCRIPTION] Successfully subscribed to IP changes!');
                console.log('✅ [SUBSCRIPTION] Listening for updates on IP:', currentIP);
              } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ [SUBSCRIPTION] Channel error!');
              } else if (status === 'TIMED_OUT') {
                console.error('❌ [SUBSCRIPTION] Subscription timed out!');
              }
            });

          unsubscribeIP = () => {
            console.log('📡 [SUBSCRIPTION] Unsubscribing from IP changes');
            subscription.unsubscribe();
          };

          setLoading(false);
          return;
        }

        // Request access for the PC associated with this IP
        const session = await requestPCAccess(pc.id, state.ip);
        console.log('🖥️ [KNOWN IP] Found PC:', pc.pc_number, '(ID:', pc.id, ')');
        console.log('📋 [SESSION] Request status:', !!session ? 'Created' : 'Failed');

        if (session) {
          setState((prev) => ({
            ...prev,
            session,
          }));

          // Subscribe to session changes
          console.log('📋 [SESSION] Subscribing to session changes for PC:', pc.id);
          unsubscribeSession = subscribeToSessionChanges(pc.id, (updatedSession) => {
            console.log('📋 [SESSION] Status changed:', updatedSession.status);
            
            if (updatedSession.status === 'active') {
              console.log('✅ [SESSION] Session approved! Redirecting to landing page...');
              setState((prev) => ({
                ...prev,
                step: 'waiting',
              }));
              // Auto-redirect to home
              setTimeout(() => {
                console.log('🚀 [REDIRECT] Redirecting to home page');
                window.location.href = '/';
              }, 1000);
              unsubscribeSession?.();
            } else if (updatedSession.status === 'rejected') {
              console.log('❌ [SESSION] Session rejected');
              setState((prev) => ({
                ...prev,
                step: 'error',
                errorMessage: 'Your access request was denied. Please try again.',
                session: null,
              }));
              unsubscribeSession?.();
            }
          });
        } else {
          setState((prev) => ({
            ...prev,
            step: 'error',
            errorMessage: 'Failed to request access. Please try again.',
          }));
        }
      } catch (err) {
        console.error('❌ [ERROR] Auto-request failed:', err);
        setState((prev) => ({
          ...prev,
          step: 'error',
          errorMessage: 'An error occurred. Please try again.',
        }));
      } finally {
        setLoading(false);
      }
    };

    autoRequest();

    return () => {
      unsubscribeIP?.();
      unsubscribeSession?.();
    };
  }, [state.step, state.ip, state.session, checkIPExists, requestPCAccess, subscribeToSessionChanges, logDetectedIP]);

  // Render: Detecting IP
  if (state.step === 'detecting') {
    return (
      <div className="ip-validation-container detecting">
        <div className="detecting-content">
          <Loader2 className="detecting-spinner" />
          <h1>Detecting your station...</h1>
          <p>Please wait while we identify your computer</p>
        </div>
      </div>
    );
  }

  // Render: Error
  if (state.step === 'error') {
    return (
      <div className="ip-validation-container error">
        <div className="error-content">
          <h1>⚠️ Error</h1>
          <p>{state.errorMessage}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Render: Waiting for approval
  if (state.step === 'waiting') {
    return (
      <div className="ip-validation-container waiting">
        <div className="waiting-content">
          <div className="pulse-animation">
            <div className="pulse-circle"></div>
          </div>

          <h1>Waiting for Approval</h1>
          <p>Your access request is being processed...</p>

          <div className="info-box">
            <div className="info-row">
              <span className="label">IP Address:</span>
              <code className="value">{state.ip}</code>
            </div>
          </div>

          <p className="waiting-hint">
            <Clock className="inline mr-2 h-4 w-4" />
            You will be redirected automatically when approved
          </p>
        </div>
      </div>
    );
  }

  return null;
}

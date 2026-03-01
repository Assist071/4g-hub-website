import { useEffect, useState } from 'react';
import { useComputerShopDatabase, type PC, type Session } from '@/hooks/useComputerShopDatabase';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getDeviceTokenFromStorage, saveDeviceTokenToStorage } from '@/lib/deviceTokens';
import './IPValidation.css';

interface IPValidationState {
  step: 'detecting' | 'token_pending' | 'waiting' | 'error';
  ip: string | null;
  token: string | null;
  session: Session | null;
  errorMessage: string | null;
}

export function IPValidation() {
  const [state, setState] = useState<IPValidationState>({
    step: 'detecting',
    ip: null,
    token: null,
    session: null,
    errorMessage: null,
  });

  const [loading, setLoading] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const { 
    detectClientIP, 
    checkIPExists, 
    requestPCAccess, 
    subscribeToSessionChanges, 
    logDetectedIP,
    createDeviceToken,
    verifyDeviceToken,
  } = useComputerShopDatabase();

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

  // Step 2: Check IP, then token, then create if needed
  useEffect(() => {
    if (state.step !== 'waiting' || !state.ip || state.session) return;

    let unsubscribeIP: (() => void) | null = null;
    let unsubscribeSession: (() => void) | null = null;
    let unsubscribeToken: (() => void) | null = null;

    const autoRequest = async () => {
      setLoading(true);
      try {
        // Check if IP has a known PC
        const pc = await checkIPExists(state.ip);
        console.log('🔍 [CHECK] IP exists in database?', !!pc);

        if (pc) {
          // IP is registered to a PC - request access
          console.log('🖥️ [KNOWN IP] Found PC:', pc.pc_number, '(ID:', pc.id, ')');
          
          const session = await requestPCAccess(pc.id, state.ip);
          if (session) {
            setState((prev) => ({
              ...prev,
              session,
            }));

            unsubscribeSession = subscribeToSessionChanges(pc.id, (updatedSession) => {
              console.log('📋 [SESSION] Status changed:', updatedSession.status);
              
              if (updatedSession.status === 'active') {
                console.log('✅ [SESSION] Session approved! Redirecting...');
                setState((prev) => ({
                  ...prev,
                  step: 'waiting',
                }));
                setTimeout(() => {
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
        } else {
          // IP is not registered - check for device token
          console.log('🎫 [TOKEN] IP not registered, checking for device token...');
          
          const existingToken = getDeviceTokenFromStorage();
          
          if (existingToken) {
            console.log('🎫 [TOKEN] Found existing token in storage, verifying...');
            const isValid = await verifyDeviceToken(existingToken);
            
            if (isValid) {
              console.log('✅ [TOKEN] Token is valid, waiting for approval status...');
              // Token is valid, monitor it for approval
              setState((prev) => ({
                ...prev,
                token: existingToken,
                step: 'token_pending',
              }));
            } else {
              console.log('❌ [TOKEN] Token is invalid or expired, creating new one...');
              // Token is invalid, create a new one
              await createNewToken();
            }
          } else {
            console.log('🆕 [TOKEN] No existing token, creating new one...');
            // No token, create a new one
            await createNewToken();
          }
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

    const createNewToken = async () => {
      try {
        const newToken = await createDeviceToken(state.ip!, 'Browser Device');
        
        if (newToken) {
          saveDeviceTokenToStorage(newToken);
          console.log('✅ [TOKEN] New token created:', newToken);
          console.log('🔔 [NOTIFICATION] Admin has been notified');
          
          setState((prev) => ({
            ...prev,
            token: newToken,
            step: 'token_pending',
          }));

          // Log detected IP
          await logDetectedIP(state.ip!);
        } else {
          throw new Error('Failed to create token');
        }
      } catch (err) {
        console.error('❌ [TOKEN] Failed to create token:', err);
        setState((prev) => ({
          ...prev,
          step: 'error',
          errorMessage: 'Failed to generate access token. Please try again.',
        }));
      }
    };

    autoRequest();

    return () => {
      unsubscribeIP?.();
      unsubscribeSession?.();
      unsubscribeToken?.();
    };
  }, [state.step, state.ip, state.session, checkIPExists, requestPCAccess, subscribeToSessionChanges, logDetectedIP, createDeviceToken, verifyDeviceToken]);

  // Monitor token approval status
  useEffect(() => {
    if (state.step !== 'token_pending' || !state.token) return;

    let unsubscribeToken: (() => void) | null = null;

    const monitorToken = () => {
      const subscription = supabase
        .channel(`device_token_${state.token}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'device_tokens',
            filter: `token=eq.${state.token}`,
          },
          async (payload) => {
            const tokenRecord = payload.new as any;
            console.log('🔄 [TOKEN] Status changed:', tokenRecord?.status);

            if (tokenRecord?.status === 'approved') {
              console.log('✅ [TOKEN] Token approved! PC ID:', tokenRecord?.pc_id);
              
              if (tokenRecord?.pc_id) {
                // If PC is already assigned, request access
                const session = await requestPCAccess(tokenRecord.pc_id, state.ip!);
                if (session) {
                  setState((prev) => ({
                    ...prev,
                    session,
                    step: 'waiting',
                  }));

                  setTimeout(() => {
                    console.log('🚀 [REDIRECT] Redirecting to home page');
                    window.location.href = '/';
                  }, 1500);
                }
              } else {
                // Just redirect - PC will be assigned by admin
                console.log('🚀 [REDIRECT] Redirecting to home page');
                setTimeout(() => {
                  window.location.href = '/';
                }, 1500);
              }

              unsubscribeToken?.();
            } else if (tokenRecord?.status === 'rejected') {
              console.log('❌ [TOKEN] Token was rejected/revoked');
              setState((prev) => ({
                ...prev,
                step: 'error',
                errorMessage: '🔐 Your device access was revoked or rejected by an administrator. Please request a new token.',
                token: null,
              }));
              
              // Clear token from storage
              localStorage.removeItem('device_token');
              
              // Auto-redirect after 3 seconds
              setTimeout(() => {
                window.location.href = '/validate';
              }, 3000);
              
              unsubscribeToken?.();
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 [TOKEN SUB] Status: ${status}`);
        });

      unsubscribeToken = () => {
        subscription.unsubscribe();
      };
    };

    monitorToken();

    return () => {
      unsubscribeToken?.();
    };
  }, [state.step, state.token, state.ip, requestPCAccess]);

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

  // Render: Token Pending Approval
  if (state.step === 'token_pending' && state.token) {
    return (
      <div className="ip-validation-container token-pending">
        <div className="token-pending-content">
          <div className="pulse-animation">
            <div className="pulse-circle"></div>
          </div>

          <h1>Device Approval Token</h1>
          <p>Your device needs approval from an administrator</p>

          <div className="info-box token-box">
            <div className="info-row">
              <span className="label">IP Address:</span>
              <code className="value">{state.ip}</code>
            </div>
          </div>

          <p className="waiting-hint">
            <Clock className="inline mr-2 h-4 w-4" />
            Waiting for approval... This may take a few moments.
          </p>
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

  // Render: Waiting for approval (IP-based)
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

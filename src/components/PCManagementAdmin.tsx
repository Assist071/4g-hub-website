import { useEffect, useState, useCallback } from 'react';
import { useComputerShopDatabase, type PC } from '@/hooks/useComputerShopDatabase';
import { Button } from '@/components/ui/button';
import { CheckCheck, X, LogOut, Zap, AlertTriangle, Power, Network, Key, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import './PCManagementAdmin.css';

type StatusFilter = 'all' | 'online' | 'pending' | 'offline';

interface DetectedIP {
  id: number;
  ip_address: string;
  status: string;
  detected_at: string;
}

interface DeviceToken {
  id: number;
  token: string;
  device_name: string;
  ip_address: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  created_at: string;
  expires_at: string;
  pc_id: number | null;
}

export function PCManagementAdmin() {
  const [pcs, setPCs] = useState<PC[]>([]);
  const [detectedIPs, setDetectedIPs] = useState<DetectedIP[]>([]);
  const [deviceTokens, setDeviceTokens] = useState<DeviceToken[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(false);
  const [selectedDetectedIP, setSelectedDetectedIP] = useState<string | null>(null);
  const [selectedPCForIP, setSelectedPCForIP] = useState<number | null>(null);
  const [approvedIP, setApprovedIP] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [tokenTab, setTokenTab] = useState<'pending' | 'rejected'>('pending');

  const { 
    getAllPCs, 
    grantAccess, 
    denyAccess, 
    endSession, 
    kickClient, 
    subscribeToPCChanges, 
    getDetectedIPs, 
    assignIPToPC, 
    subscribeToDetectedIPChanges, 
    updateDetectedIPStatus, 
    deleteDetectedIP, 
    setPCOnline, 
    refreshAllData,
    getDeviceTokens,
    approveDeviceToken,
    rejectDeviceToken,
    deleteDeviceToken,
    deleteAllDeviceTokensByStatus,
    subscribeToDeviceTokenChanges,
  } = useComputerShopDatabase();

  // Load PCs
  useEffect(() => {
    const loadPCs = async () => {
      const data = await getAllPCs();
      setPCs(data);
    };
    loadPCs();
  }, [getAllPCs]);

  // Load detected IPs from database
  useEffect(() => {
    const loadDetectedIPs = async () => {
      const ips = await getDetectedIPs();
      setDetectedIPs(ips);
    };

    loadDetectedIPs();

    // Subscribe to detected IPs changes with immediate resync
    const unsubscribe = subscribeToDetectedIPChanges((ips) => {
      console.log('📡 [SYNC] Detected IPs updated, refreshing PCs too...');
      setDetectedIPs(ips);
      // Also refresh PCs when detected IPs change to ensure sync
      getAllPCs().then(data => {
        setPCs(data);
        console.log('📡 [SYNC] PCs refreshed due to detected IP change');
      });
    });

    // Check URL parameter for recently detected IP
    const params = new URLSearchParams(window.location.search);
    const detectedIP = params.get('detected-ip');
    if (detectedIP) {
      setSelectedDetectedIP(detectedIP);
    }

    return () => {
      unsubscribe();
    };
  }, [getDetectedIPs, subscribeToDetectedIPChanges, getAllPCs]);

  // Load device tokens from database
  useEffect(() => {
    const loadDeviceTokens = async () => {
      const tokens = await getDeviceTokens();
      setDeviceTokens(tokens);
    };

    loadDeviceTokens();

    // Subscribe to device tokens changes
    const unsubscribe = subscribeToDeviceTokenChanges((tokens) => {
      console.log('📡 [SYNC] Device tokens updated');
      setDeviceTokens(tokens);
    });

    return () => {
      unsubscribe();
    };
  }, [getDeviceTokens, subscribeToDeviceTokenChanges]);

  // Subscribe to realtime changes
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const subscribeToChanges = () => {
      unsubscribe = subscribeToPCChanges((updatedPC) => {
        setPCs((prev) => {
          const index = prev.findIndex((p) => p.id === updatedPC.id);
          if (index >= 0) {
            const newPCs = [...prev];
            newPCs[index] = updatedPC;
            return newPCs;
          }
          return [...prev, updatedPC];
        });
      });
    };

    subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToPCChanges]);



  // Filter PCs
  const filteredPCs = pcs.filter((pc) => {
    if (filter === 'all') return true;
    return pc.status === filter;
  }).sort((a, b) => {
    const numA = parseInt(a.pc_number.replace('PC-', ''));
    const numB = parseInt(b.pc_number.replace('PC-', ''));
    return numA - numB;
  });

  // Count by status
  const counts = {
    all: pcs.length,
    online: pcs.filter((p) => p.status === 'online').length,
    pending: pcs.filter((p) => p.status === 'pending').length,
    offline: pcs.filter((p) => p.status === 'offline').length,
  };

  // Action handlers
  const handleGrantAccess = useCallback(
    async (pc: PC) => {
      setLoading(true);
      console.log('✓ GRANT clicked for PC:', pc.pc_number, '(ID:', pc.id, ')');
      
      try {
        let success = false;
        
        // If PC has a current_session_id, grant that session
        if (pc.current_session_id) {
          console.log('✓ Granting session:', pc.current_session_id);
          success = await grantAccess(pc.id, pc.current_session_id);
        } else {
          // Otherwise, just set PC status to online directly
          console.log('✓ No session found, setting PC to online directly');
          success = await setPCOnline(pc.id);
        }
        
        if (success) {
          console.log('✓ PC status updated to ONLINE');
          // Wait for DB propagation then reload PCs to reflect changes
          await new Promise(resolve => setTimeout(resolve, 500));
          const data = await getAllPCs();
          setPCs(data);
          const ips = await getDetectedIPs();
          setDetectedIPs(ips);
        }
      } catch (err) {
        console.error('✗ Error granting access:', err);
      } finally {
        setLoading(false);
      }
    },
    [grantAccess, setPCOnline, getAllPCs, getDetectedIPs]
  );

  const handleDenyAccess = useCallback(
    async (pc: PC) => {
      setLoading(true);
      const session = pcs.find((p) => p.id === pc.id)?.current_session_id;
      if (session) {
        await denyAccess(pc.id, session);
      }
      setLoading(false);
    },
    [pcs, denyAccess]
  );

  const handleEndSession = useCallback(
    async (pcId: number) => {
      setLoading(true);
      await endSession(pcId);
      setLoading(false);
    },
    [endSession]
  );

  const handleKickClient = useCallback(
    async (pcId: number) => {
      if (window.confirm('Are you sure you want to kick this client? They will need to select a new PC.')) {
        setLoading(true);
        await kickClient(pcId);
        setLoading(false);
      }
    },
    [kickClient]
  );



  const handleSetOnline = useCallback(
    async (pcId: number) => {
      setLoading(true);
      console.log('🟢 Setting PC to ONLINE:', pcId);
      try {
        const success = await setPCOnline(pcId);
        if (success) {
          console.log('✓ PC set to ONLINE successfully');
          await new Promise(resolve => setTimeout(resolve, 500));
          const data = await getAllPCs();
          setPCs(data);
          const ips = await getDetectedIPs();
          setDetectedIPs(ips);
        }
      } catch (err) {
        console.error('✗ Error setting PC to online:', err);
      } finally {
        setLoading(false);
      }
    },
    [setPCOnline, getAllPCs, getDetectedIPs]
  );

  const handleAssignIPToPC = useCallback(
    async (ipAddress: string, pcId: number) => {
      try {
        setLoading(true);
        console.log('🟢 [ADMIN] CONFIRM clicked');
        console.log('🟢 [ADMIN] Assigning IP:', ipAddress, 'to PC ID:', pcId);

        // Assign IP to PC using hook function (this now sets PC to online automatically)
        const success = await assignIPToPC(ipAddress, pcId);
        console.log('🟢 [ADMIN] assignIPToPC result:', success);

        if (success) {
          console.log('✅ [ADMIN] Assignment successful! PC is now ONLINE');
          
          console.log('✅ [ADMIN] Clearing approval states...');
          setSelectedDetectedIP(null);
          setSelectedPCForIP(null);
          setApprovedIP(null);
          
          // Refresh all data to sync PCs and detected IPs
          console.log('🔄 [ADMIN] Refreshing all data...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB propagation
          const data = await getAllPCs();
          const ips = await getDetectedIPs();
          setPCs(data);
          setDetectedIPs(ips);
          console.log('✅ [ADMIN] Data refreshed and synced');
        } else {
          console.error('❌ [ADMIN] Assignment failed!');
        }
      } catch (err) {
        console.error('❌ [ADMIN] Error assigning IP to PC:', err);
      } finally {
        setLoading(false);
      }
    },
    [assignIPToPC, getAllPCs, getDetectedIPs]
  );

  const handleApproveIP = (ipAddress: string) => {
    console.log('🔵 [APPROVAL] Approve button clicked for IP:', ipAddress);
    console.log('🔵 [APPROVAL] Current approvedIP state:', approvedIP);
    setApprovedIP(ipAddress);
    console.log('🔵 [APPROVAL] Setting approvedIP to:', ipAddress);
    
    // Update status to approved in database
    updateDetectedIPStatus(ipAddress, 'approved').then(() => {
      console.log('🔵 [APPROVAL] ✓ IP status updated to "approved" in database');
    }).catch((err) => {
      console.error('🔴 [APPROVAL] ✗ Failed to update IP status:', err);
    });
  };

  const handleRejectIP = (ipAddress: string) => {
    console.log('🔴 [APPROVAL] Reject button clicked for IP:', ipAddress);
    setSelectedDetectedIP(null);
    setApprovedIP(null);
    setSelectedPCForIP(null);
    console.log('🔴 [APPROVAL] Reset all approval states');
    
    // Update status to ignored in database
    updateDetectedIPStatus(ipAddress, 'ignored').then(() => {
      console.log('🔴 [APPROVAL] ✗ IP status updated to "ignored" in database');
    }).catch((err) => {
      console.error('🔴 [APPROVAL] ✗ Failed to update IP status:', err);
    });
  };

  const handleSelectPendingIP = (ipAddress: string) => {
    console.log('📡 [IP LIST] IP clicked:', ipAddress);
    setSelectedDetectedIP(ipAddress);
    setApprovedIP(null);
    setSelectedPCForIP(null);
    console.log('📡 [IP LIST] Showing approval card for IP:', ipAddress);
  };

  const handleDeleteIP = (ipAddress: string) => {
    if (window.confirm(`Are you sure you want to delete IP ${ipAddress}?`)) {
      console.log('🗑️ [DELETE] Delete confirmed for IP:', ipAddress);
      setLoading(true);
      deleteDetectedIP(ipAddress).then((success) => {
        if (success) {
          console.log('✅ [DELETE] IP deleted successfully');
          setSelectedDetectedIP(null);
          setApprovedIP(null);
          setSelectedPCForIP(null);
        } else {
          console.error('❌ [DELETE] Failed to delete IP');
        }
        setLoading(false);
      });
    }
  };

  // Device token handlers
  const handleApproveDeviceToken = useCallback(
    async (tokenId: number, pcId?: number) => {
      try {
        setLoading(true);
        console.log('🎫 [TOKEN] Approving token ID:', tokenId, 'for PC:', pcId);
        
        const success = await approveDeviceToken(tokenId, pcId);
        
        if (success) {
          console.log('✅ [TOKEN] Token approved successfully');
          setSelectedTokenId(null);
          
          // Refresh tokens
          await new Promise(resolve => setTimeout(resolve, 500));
          const tokens = await getDeviceTokens();
          setDeviceTokens(tokens);
        }
      } catch (err) {
        console.error('❌ [TOKEN] Error approving token:', err);
      } finally {
        setLoading(false);
      }
    },
    [approveDeviceToken, getDeviceTokens]
  );

  const handleRejectDeviceToken = useCallback(
    async (tokenId: number) => {
      if (!window.confirm('Are you sure you want to reject this device token?')) {
        return;
      }
      
      try {
        setLoading(true);
        console.log('🎫 [TOKEN] Rejecting token ID:', tokenId);
        
        const success = await rejectDeviceToken(tokenId);
        
        if (success) {
          console.log('✅ [TOKEN] Token rejected successfully');
          setSelectedTokenId(null);
          
          // Refresh tokens
          await new Promise(resolve => setTimeout(resolve, 500));
          const tokens = await getDeviceTokens();
          setDeviceTokens(tokens);
        }
      } catch (err) {
        console.error('❌ [TOKEN] Error rejecting token:', err);
      } finally {
        setLoading(false);
      }
    },
    [rejectDeviceToken, getDeviceTokens]
  );

  const handleDeleteDeviceToken = useCallback(
    async (tokenId: number) => {
      if (!window.confirm('Are you sure you want to delete this device token?')) {
        return;
      }
      
      try {
        setLoading(true);
        console.log('🗑️ [TOKEN] Deleting token ID:', tokenId);
        
        const success = await deleteDeviceToken(tokenId);
        
        if (success) {
          console.log('✅ [TOKEN] Token deleted successfully');
          setSelectedTokenId(null);
          
          // Refresh tokens
          await new Promise(resolve => setTimeout(resolve, 500));
          const tokens = await getDeviceTokens();
          setDeviceTokens(tokens);
        }
      } catch (err) {
        console.error('❌ [TOKEN] Error deleting token:', err);
      } finally {
        setLoading(false);
      }
    },
    [deleteDeviceToken, getDeviceTokens]
  );

  const handleDeleteAllDeviceTokens = useCallback(
    async (status: 'pending' | 'rejected') => {
      const count = deviceTokens.filter(t => t.status === status).length;
      if (!window.confirm(`Are you sure you want to delete all ${count} ${status} token(s)? This cannot be undone.`)) {
        return;
      }
      
      try {
        setLoading(true);
        console.log(`🗑️ [TOKEN] Deleting all ${status} tokens`);
        
        const success = await deleteAllDeviceTokensByStatus(status);
        
        if (success) {
          console.log(`✅ [TOKEN] All ${status} tokens deleted successfully`);
          setSelectedTokenId(null);
          
          // Refresh tokens
          await new Promise(resolve => setTimeout(resolve, 500));
          const tokens = await getDeviceTokens();
          setDeviceTokens(tokens);
        }
      } catch (err) {
        console.error(`❌ [TOKEN] Error deleting all ${status} tokens:`, err);
      } finally {
        setLoading(false);
      }
    },
    [deleteAllDeviceTokensByStatus, getDeviceTokens, deviceTokens]
  );

  // Get icon for status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <div className="status-dot online" />;
      case 'pending':
        return <div className="status-dot pending" />;
      case 'offline':
        return <div className="status-dot offline" />;
      default:
        return null;
    }
  };



  return (
    <div className="pc-management-admin tech-card corner-bracket scan-line">
      <div className="admin-header">
        <h1 className="font-ethnocentric neon-glow cyber-text">PC Management Dashboard</h1>
        <p>Real-time computer shop status monitoring and control</p>
      </div>

      {/* Detected IPs Alert Section */}
      {(selectedDetectedIP || detectedIPs.length > 0) && (
        <div className="detected-ips-alert">
          <div className="alert-header">
            <Network className="h-5 w-5 text-green-400" />
            <span className="alert-title">Detected IP Addresses</span>
          </div>

          {selectedDetectedIP && (
            <div className="detected-ip-card">
              <div className="ip-info">
                <span className="ip-label">New Detection:</span>
                <code className="ip-value">{selectedDetectedIP}</code>
              </div>

              {/* Progress indicator */}
              <div className="approval-progress">
                <div className={`progress-step ${!approvedIP ? 'active' : 'completed'}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Approve IP</span>
                </div>
                <div className={`progress-step ${approvedIP && !selectedPCForIP ? 'active' : selectedPCForIP ? 'completed' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Select PC</span>
                </div>
                <div className={`progress-step ${selectedPCForIP ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">Confirm</span>
                </div>
              </div>

              {!approvedIP ? (
                <div className="approval-buttons">
                  <p className="approval-prompt">Do you want to approve this IP address?</p>
                  <div className="button-group">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔵 APPROVE button clicked');
                        handleApproveIP(selectedDetectedIP);
                      }}
                      disabled={loading}
                      className="approve-btn"
                      style={{
                        padding: '10px 20px',
                        minWidth: '120px',
                        pointerEvents: 'auto',
                      }}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      ✓ APPROVE
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔴 REJECT button clicked');
                        handleRejectIP(selectedDetectedIP);
                      }}
                      disabled={loading}
                      className="reject-btn"
                      style={{
                        padding: '10px 20px',
                        minWidth: '120px',
                        pointerEvents: 'auto',
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      ✗ REJECT
                    </Button>
                  </div>
                </div>
              ) : approvedIP === selectedDetectedIP && selectedPCForIP ? (
                <div className="assign-confirmation">
                  <span>Assigning to: <strong>{pcs.find((p) => p.id === selectedPCForIP)?.pc_number}</strong></span>
                  <div className="button-group">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('✅ CONFIRM button clicked for IP:', selectedDetectedIP, 'PC ID:', selectedPCForIP);
                        handleAssignIPToPC(selectedDetectedIP, selectedPCForIP);
                      }}
                      disabled={loading}
                      className="confirm-btn"
                      style={{
                        padding: '10px 20px',
                        minWidth: '120px',
                        pointerEvents: 'auto',
                      }}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      CONFIRM
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('❌ CANCEL button clicked');
                        setSelectedPCForIP(null);
                      }}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        minWidth: '120px',
                        pointerEvents: 'auto',
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      CANCEL
                    </Button>
                  </div>
                </div>
              ) : approvedIP === selectedDetectedIP ? (
                <div className="pc-selector">
                  <label>✓ Approved! Now select a PC:</label>
                  <div className="pc-grid">
                    {pcs
                      .filter((p) => p.status === 'offline' && !p.ip_address)
                      .sort((a, b) => {
                        const numA = parseInt(a.pc_number.replace('PC-', ''));
                        const numB = parseInt(b.pc_number.replace('PC-', ''));
                        return numA - numB;
                      })
                      .map((pc) => (
                        <button
                          key={pc.id}
                          className={`pc-option ${selectedPCForIP === pc.id ? 'selected' : ''}`}
                          onClick={() => {
                            console.log('📱 PC selected from button:', pc.id, 'PC Number:', pc.pc_number);
                            setSelectedPCForIP(pc.id);
                          }}
                        >
                          {pc.pc_number}
                        </button>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {detectedIPs.length > 0 && (
            <div className="detected-ips-list">
              <span className="list-label">📡 All Detected IPs:</span>
              {detectedIPs
                .map((ip) => (
                  <div 
                    key={ip.id} 
                    className={`pending-ip-item status-${ip.status}`}
                    onClick={() => ip.status === 'pending' && handleSelectPendingIP(ip.ip_address)}
                  >
                    <div className="ip-details">
                      <code>{ip.ip_address}</code>
                      <span className={`ip-status-badge ${ip.status}`}>{ip.status.toUpperCase()}</span>
                      <span className="time-ago">
                        {new Date(ip.detected_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="ip-actions">
                      {ip.status === 'pending' && <span className="click-hint">Click to approve →</span>}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteIP(ip.ip_address);
                        }}
                        disabled={loading}
                        className="delete-ip-btn"
                        title="Delete this IP"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Device Tokens Alert Section */}
      {(deviceTokens.some(t => t.status === 'pending') || deviceTokens.some(t => t.status === 'rejected')) && (
        <div className="device-tokens-alert" style={{ marginTop: '20px' }}>
          <div className="alert-header">
            <Key className="h-5 w-5 text-blue-400" />
            <span className="alert-title">Device Tokens</span>
          </div>

          {/* Token Tabs */}
          <div className="token-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #ddd', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setTokenTab('pending')}
                className={`token-tab ${tokenTab === 'pending' ? 'active' : ''}`}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: tokenTab === 'pending' ? 'bold' : 'normal',
                  color: tokenTab === 'pending' ? '#3b82f6' : '#666',
                  borderBottom: tokenTab === 'pending' ? '2px solid #3b82f6' : 'none',
                }}
              >
                PENDING ({deviceTokens.filter(t => t.status === 'pending').length})
              </button>
              {deviceTokens.some(t => t.status === 'rejected') && (
                <button
                  onClick={() => setTokenTab('rejected')}
                  className={`token-tab ${tokenTab === 'rejected' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: tokenTab === 'rejected' ? 'bold' : 'normal',
                    color: tokenTab === 'rejected' ? '#ef4444' : '#666',
                    borderBottom: tokenTab === 'rejected' ? '2px solid #ef4444' : 'none',
                  }}
                >
                  REJECTED ({deviceTokens.filter(t => t.status === 'rejected').length})
                </button>
              )}
            </div>
            
            {tokenTab === 'pending' && deviceTokens.filter(t => t.status === 'pending').length > 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => handleDeleteAllDeviceTokens('pending')}
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
            
            {tokenTab === 'rejected' && deviceTokens.filter(t => t.status === 'rejected').length > 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => handleDeleteAllDeviceTokens('rejected')}
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>

          {/* Pending Tokens Tab */}
          {tokenTab === 'pending' && (
            <div className="pending-tokens-list">
              {deviceTokens
                .filter(t => t.status === 'pending')
              .map((token) => (
                <div 
                  key={token.id} 
                  className="pending-token-item"
                  onClick={() => setSelectedTokenId(token.id)}
                >
                  <div className="token-details">
                    <div className="token-header">
                      <span className="device-name">{token.device_name}</span>
                      <span className="token-status-badge pending">PENDING</span>
                    </div>
                    <div className="token-info">
                      <span className="label">IP:</span>
                      <code className="ip">{token.ip_address}</code>
                      <span className="label ml-4">Created:</span>
                      <span className="time">{new Date(token.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="token-preview">
                      <span className="label">Token: </span>
                      <code>{token.token.substring(0, 24)}...</code>
                    </div>
                  </div>

                  {selectedTokenId === token.id && (
                    <div className="token-actions">
                      <div className="button-group">
                        <Button
                          size="sm"
                          disabled={loading}
                          onClick={() => handleApproveDeviceToken(token.id)}
                          className="approve-btn"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve Token
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading}
                          onClick={() => handleRejectDeviceToken(token.id)}
                          className="reject-btn"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeviceToken(token.id);
                          }}
                          style={{ color: '#ef4444', borderColor: '#ef4444' }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Rejected Tokens Tab */}
          {tokenTab === 'rejected' && (
            <div className="rejected-tokens-list">
              {deviceTokens
                .filter(t => t.status === 'rejected')
                .map((token) => (
                  <div key={token.id} className="rejected-token-item" style={{
                    padding: '12px',
                    marginBottom: '10px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div className="token-details">
                      <div className="token-header">
                        <span className="device-name" style={{ fontWeight: 'bold' }}>{token.device_name}</span>
                        <span className="token-status-badge" style={{
                          padding: '4px 8px',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}>✗ REJECTED</span>
                      </div>
                      <div className="token-info" style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                        <span className="label">IP:</span>
                        <code style={{ marginRight: '12px' }}>{token.ip_address}</code>
                        <span className="label">Status:</span>
                        <span style={{ marginLeft: '4px' }}>Revoked/Rejected</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeviceToken(token.id);
                      }}
                      style={{ color: '#ef4444', borderColor: '#ef4444', minWidth: '80px', flexShrink: 0, marginLeft: '12px' }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                ))}
              {deviceTokens.filter(t => t.status === 'rejected').length === 0 && (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No rejected tokens</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ marginTop: '30px' }}>
        {(['all', 'online', 'pending', 'offline'] as StatusFilter[]).map((tab) => (
          <button
            key={tab}
            className={`tab ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            <span className="tab-label">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            <span className="tab-count">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="pc-table">
          <thead>
            <tr>
              <th>PC</th>
              <th>IP ADDRESS</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPCs.map((pc) => (
              <tr key={pc.id} className={`status-${pc.status}`}>
                <td className="pc-name-cell">
                  <div className="pc-name-content">
                    <span className="pc-number">{pc.pc_number}</span>
                    {pc.ip_address && <span className="auto-badge">AUTO</span>}
                  </div>
                </td>

                <td className="ip-cell">
                  {pc.ip_address ? (
                    <div className="ip-display">
                      <code>{pc.ip_address}</code>
                      <span className="saved-label">saved</span>
                    </div>
                  ) : (
                    <span className="not-assigned">Not assigned</span>
                  )}
                </td>

                <td className="status-cell">
                  <div className="status-display">
                    {getStatusIcon(pc.status)}
                    <span className={`status-badge ${pc.status}`}>{pc.status.toUpperCase()}</span>
                  </div>
                </td>

                <td className="action-cell">
                  <div className="action-buttons">
                    {pc.status === 'pending' && (
                      <>
                        {pc.ip_address ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleSetOnline(pc.id)} disabled={loading}>
                              <Power className="h-4 w-4 mr-2" />
                              GO ONLINE
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDenyAccess(pc)} disabled={loading}>
                              <X className="h-4 w-4 mr-2" />
                              DENY
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleGrantAccess(pc)} disabled={loading}>
                              <CheckCheck className="h-4 w-4 mr-2" />
                              GRANT
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDenyAccess(pc)} disabled={loading}>
                              <X className="h-4 w-4 mr-2" />
                              DENY
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    {pc.status === 'online' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEndSession(pc.id)} disabled={loading}>
                          <LogOut className="h-4 w-4 mr-2" />
                          END
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleKickClient(pc.id)} disabled={loading}>
                          <Zap className="h-4 w-4 mr-2" />
                          KICK
                        </Button>
                      </>
                    )}

                    {pc.status === 'offline' && (
                      <>
                        {pc.ip_address ? (
                          <Button size="sm" variant="outline" onClick={() => handleSetOnline(pc.id)} disabled={loading}>
                            <Power className="h-4 w-4 mr-2" />
                            GO ONLINE
                          </Button>
                        ) : (
                          <span className="no-ip-text">No IP</span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPCs.length === 0 && (
        <div className="empty-state">
          <p>No computers found for the selected filter</p>
        </div>
      )}
    </div>
  );
}

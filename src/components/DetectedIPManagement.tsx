import { useEffect, useState, useCallback } from 'react';
import { useComputerShopDatabase, type PC } from '@/hooks/useComputerShopDatabase';
import { Button } from '@/components/ui/button';
import { CheckCheck, X, Network, Key, Clock, CheckCircle2 } from 'lucide-react';

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

export function DetectedIPManagement() {
  const [pcs, setPCs] = useState<PC[]>([]);
  const [detectedIPs, setDetectedIPs] = useState<DetectedIP[]>([]);
  const [deviceTokens, setDeviceTokens] = useState<DeviceToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetectedIP, setSelectedDetectedIP] = useState<string | null>(null);
  const [selectedPCForIP, setSelectedPCForIP] = useState<number | null>(null);
  const [approvedIP, setApprovedIP] = useState<string | null>(null);
  const [selectedPCForToken, setSelectedPCForToken] = useState<number | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'ips' | 'tokens'>('ips');

  const {
    getAllPCs,
    getDetectedIPs,
    assignIPToPC,
    subscribeToDetectedIPChanges,
    updateDetectedIPStatus,
    deleteDetectedIP,
    getDeviceTokens,
    approveDeviceToken,
    rejectDeviceToken,
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

  // Load detected IPs
  useEffect(() => {
    const loadDetectedIPs = async () => {
      const ips = await getDetectedIPs();
      setDetectedIPs(ips);
    };

    loadDetectedIPs();

    const unsubscribe = subscribeToDetectedIPChanges((ips) => {
      console.log('📡 [SYNC] Detected IPs updated');
      setDetectedIPs(ips);
    });

    return () => {
      unsubscribe();
    };
  }, [getDetectedIPs, subscribeToDetectedIPChanges]);

  // Load device tokens
  useEffect(() => {
    const loadDeviceTokens = async () => {
      const tokens = await getDeviceTokens();
      setDeviceTokens(tokens);
    };

    loadDeviceTokens();

    const unsubscribe = subscribeToDeviceTokenChanges((tokens) => {
      console.log('📡 [SYNC] Device tokens updated');
      setDeviceTokens(tokens);
    });

    return () => {
      unsubscribe();
    };
  }, [getDeviceTokens, subscribeToDeviceTokenChanges]);

  // IP handlers
  const handleApproveIP = (ipAddress: string) => {
    setApprovedIP(ipAddress);
    updateDetectedIPStatus(ipAddress, 'approved').then(() => {
      console.log('✓ IP status updated to "approved"');
    });
  };

  const handleRejectIP = (ipAddress: string) => {
    setSelectedDetectedIP(null);
    setApprovedIP(null);
    setSelectedPCForIP(null);
    updateDetectedIPStatus(ipAddress, 'ignored').then(() => {
      console.log('✗ IP status updated to "ignored"');
    });
  };

  const handleAssignIPToPC = useCallback(
    async (ipAddress: string, pcId: number) => {
      try {
        setLoading(true);
        const success = await assignIPToPC(ipAddress, pcId);

        if (success) {
          console.log('✅ Assignment successful!');
          setSelectedDetectedIP(null);
          setSelectedPCForIP(null);
          setApprovedIP(null);

          await new Promise(resolve => setTimeout(resolve, 1000));
          const data = await getAllPCs();
          const ips = await getDetectedIPs();
          setPCs(data);
          setDetectedIPs(ips);
        }
      } catch (err) {
        console.error('❌ Error assigning IP:', err);
      } finally {
        setLoading(false);
      }
    },
    [assignIPToPC, getAllPCs, getDetectedIPs]
  );

  const handleDeleteIP = (ipAddress: string) => {
    if (window.confirm(`Are you sure you want to delete IP ${ipAddress}?`)) {
      setLoading(true);
      deleteDetectedIP(ipAddress).then((success) => {
        if (success) {
          console.log('✅ IP deleted successfully');
          setSelectedDetectedIP(null);
          setApprovedIP(null);
          setSelectedPCForIP(null);
        }
        setLoading(false);
      });
    }
  };

  // Token handlers
  const handleApproveDeviceToken = useCallback(
    async (tokenId: number, pcId?: number) => {
      try {
        setLoading(true);
        const success = await approveDeviceToken(tokenId, pcId);

        if (success) {
          console.log('✅ Token approved successfully');
          setSelectedTokenId(null);
          setSelectedPCForToken(null);

          await new Promise(resolve => setTimeout(resolve, 500));
          const tokens = await getDeviceTokens();
          setDeviceTokens(tokens);
        }
      } catch (err) {
        console.error('❌ Error approving token:', err);
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
        const success = await rejectDeviceToken(tokenId);

        if (success) {
          console.log('✅ Token rejected successfully');
          setSelectedTokenId(null);
          setSelectedPCForToken(null);

          await new Promise(resolve => setTimeout(resolve, 500));
          const tokens = await getDeviceTokens();
          setDeviceTokens(tokens);
        }
      } catch (err) {
        console.error('❌ Error rejecting token:', err);
      } finally {
        setLoading(false);
      }
    },
    [rejectDeviceToken, getDeviceTokens]
  );

  const pendingIPs = detectedIPs.filter(ip => ip.status === 'pending');
  const pendingTokens = deviceTokens.filter(t => t.status === 'pending');

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px', color: '#ff8c33', fontWeight: '700' }}>
          Access Management
        </h1>
        <p style={{ fontSize: '14px', color: '#888', margin: '0' }}>
          Manage IP addresses and device token approvals
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #333' }}>
        <button
          onClick={() => setActiveTab('ips')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'ips' ? '#ff8c33' : 'transparent',
            color: activeTab === 'ips' ? '#fff' : '#888',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '4px 4px 0 0',
            position: 'relative',
            bottom: '-2px',
          }}
        >
          <Network className="inline mr-2 h-4 w-4" />
          Detected IPs {pendingIPs.length > 0 && <span style={{ marginLeft: '8px', background: '#ff4444', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{pendingIPs.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'tokens' ? '#3b82f6' : 'transparent',
            color: activeTab === 'tokens' ? '#fff' : '#888',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '4px 4px 0 0',
            position: 'relative',
            bottom: '-2px',
          }}
        >
          <Key className="inline mr-2 h-4 w-4" />
          Device Tokens {pendingTokens.length > 0 && <span style={{ marginLeft: '8px', background: '#ff4444', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{pendingTokens.length}</span>}
        </button>
      </div>

      {/* Detected IPs Tab */}
      {activeTab === 'ips' && (
        <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
          {detectedIPs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <p style={{ margin: '0' }}>No detected IP addresses</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {detectedIPs.map((ip) => (
                <div
                  key={ip.id}
                  style={{
                    padding: '16px',
                    border: `1px solid ${ip.status === 'pending' ? 'rgba(255, 140, 51, 0.3)' : 'rgba(107, 114, 128, 0.2)'}`,
                    borderRadius: '8px',
                    background: ip.status === 'pending' ? 'rgba(255, 140, 51, 0.05)' : 'rgba(107, 114, 128, 0.05)',
                    cursor: ip.status === 'pending' ? 'pointer' : 'default',
                  }}
                  onClick={() => ip.status === 'pending' && setSelectedDetectedIP(ip.ip_address)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <code style={{ fontSize: '14px', fontWeight: '600', color: '#ff8c33' }}>{ip.ip_address}</code>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                      background: ip.status === 'pending' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                      color: ip.status === 'pending' ? '#ef4444' : '#888',
                    }}>
                      {ip.status}
                    </span>
                  </div>

                  {selectedDetectedIP === ip.ip_address && (
                    <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255, 140, 51, 0.2)' }}>
                      {!approvedIP && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600' }}>Approve this IP?</p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                              size="sm"
                              onClick={() => handleApproveIP(ip.ip_address)}
                              disabled={loading}
                              style={{ flex: 1 }}
                            >
                              <CheckCheck className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectIP(ip.ip_address)}
                              disabled={loading}
                              style={{ flex: 1 }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {approvedIP === ip.ip_address && (
                        <div>
                          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600' }}>Select PC to assign:</p>
                          <select
                            value={selectedPCForIP || ''}
                            onChange={(e) => setSelectedPCForIP(parseInt(e.target.value))}
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #444',
                              borderRadius: '6px',
                              background: '#1a1a1a',
                              color: '#fff',
                              marginBottom: '12px',
                              fontSize: '12px',
                              fontFamily: 'inherit',
                            }}
                          >
                            <option value="">-- Select PC --</option>
                            {pcs.map((pc) => (
                              <option key={pc.id} value={pc.id}>
                                {pc.pc_number} ({pc.status})
                              </option>
                            ))}
                          </select>

                          {selectedPCForIP && (
                            <Button
                              size="sm"
                              onClick={() => handleAssignIPToPC(ip.ip_address, selectedPCForIP)}
                              disabled={loading}
                              style={{ width: '100%' }}
                            >
                              {loading ? 'Assigning...' : 'Confirm & Assign'}
                            </Button>
                          )}
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteIP(ip.ip_address)}
                        disabled={loading}
                        style={{ marginTop: '12px', width: '100%' }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Delete IP
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Device Tokens Tab */}
      {activeTab === 'tokens' && (
        <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
          {deviceTokens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <p style={{ margin: '0' }}>No device tokens</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {deviceTokens.map((token) => (
                <div
                  key={token.id}
                  style={{
                    padding: '16px',
                    border: `1px solid ${token.status === 'pending' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.2)'}`,
                    borderRadius: '8px',
                    background: token.status === 'pending' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(107, 114, 128, 0.05)',
                    cursor: token.status === 'pending' ? 'pointer' : 'default',
                  }}
                  onClick={() => token.status === 'pending' && setSelectedTokenId(token.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#fff' }}>{token.device_name}</p>
                      <code style={{ fontSize: '12px', color: '#3b82f6' }}>{token.ip_address}</code>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                      background: token.status === 'pending' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                      color: token.status === 'pending' ? '#ef4444' : '#888',
                    }}>
                      {token.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>
                    Created: {new Date(token.created_at).toLocaleString()}
                  </div>

                  {selectedTokenId === token.id && (
                    <div style={{ padding: '12px 0', borderTop: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600' }}>Token: <code style={{ fontSize: '11px' }}>{token.token.substring(0, 24)}...</code></p>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600' }}>Select PC (optional):</p>
                        <select
                          value={selectedPCForToken || ''}
                          onChange={(e) => setSelectedPCForToken(parseInt(e.target.value))}
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#fff',
                            fontSize: '12px',
                            fontFamily: 'inherit',
                          }}
                        >
                          <option value="">-- No PC Assignment --</option>
                          {pcs.map((pc) => (
                            <option key={pc.id} value={pc.id}>
                              {pc.pc_number} ({pc.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          size="sm"
                          onClick={() => handleApproveDeviceToken(token.id, selectedPCForToken || undefined)}
                          disabled={loading}
                          style={{ flex: 1, background: '#3b82f6' }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectDeviceToken(token.id)}
                          disabled={loading}
                          style={{ flex: 1 }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

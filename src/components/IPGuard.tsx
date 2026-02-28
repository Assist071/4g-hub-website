import { useEffect, useState } from 'react';
import { useComputerShopDatabase } from '@/hooks/useComputerShopDatabase';
import { IPValidation } from '@/components/IPValidation';

const REGISTERED_IP_CACHE = 'hub_food_flow_registered_ip';

export function IPGuard() {
  const [shouldRender, setShouldRender] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { detectClientIP, checkIPExists } = useComputerShopDatabase();

  useEffect(() => {
    const checkIP = async () => {
      try {
        const detectedIP = await detectClientIP();
        
        if (detectedIP) {
          // Check if we have cached result for this IP
          const cachedIP = localStorage.getItem(REGISTERED_IP_CACHE);
          if (cachedIP === detectedIP) {
            // IP is cached as registered - instant redirect
            window.location.href = '/';
            return;
          }

          // Check if IP is already registered (has a PC assigned)
          const pc = await checkIPExists(detectedIP);
          
          if (pc) {
            // IP is registered - cache it and redirect
            localStorage.setItem(REGISTERED_IP_CACHE, detectedIP);
            window.location.href = '/';
            return;
          }
        }
        
        // IP is not registered - show validation screen
        setShouldRender(true);
      } catch (error) {
        console.error('Error checking IP:', error);
        setShouldRender(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkIP();
  }, [detectClientIP, checkIPExists]);

  // While checking, render nothing
  if (isChecking) {
    return null;
  }

  // If IP is registered, this won't render (already redirected)
  // If IP is not registered, show IPValidation
  if (!shouldRender) {
    return null;
  }

  return <IPValidation />;
}

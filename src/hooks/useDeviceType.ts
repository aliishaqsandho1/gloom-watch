import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const detectDeviceType = (): DeviceType => {
      const userAgent = navigator.userAgent.toLowerCase();
      const width = window.innerWidth;
      
      // Check for mobile devices
      const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Check for tablets
      const isTablet = /ipad|tablet|(android(?!.*mobile))|kindle|silk/i.test(userAgent) || 
                      (width >= 768 && width <= 1024);
      
      // Mobile specific check with width
      if (isMobile && width < 768) {
        return 'mobile';
      }
      
      // Tablet check
      if (isTablet || (width >= 768 && width <= 1024)) {
        return 'tablet';
      }
      
      // Desktop
      return 'desktop';
    };

    const handleResize = () => {
      setDeviceType(detectDeviceType());
    };

    // Initial detection
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation changes (important for mobile/tablet)
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100); // Small delay to ensure dimensions are updated
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceType;
};
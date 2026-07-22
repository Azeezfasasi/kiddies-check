'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      return;
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/register-sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker updated');
      });
    }

    window.addEventListener('online', () => {
      console.log('App is online');
      window.location.reload();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
    });
  }, []);

  return null;
}

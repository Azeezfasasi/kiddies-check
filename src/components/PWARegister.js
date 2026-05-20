'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    // Check if service workers are supported
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

    // Listen for app updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker updated');
        // Optional: Show notification to user about update
      });
    }

    // Handle app being installed
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('beforeinstallprompt event fired');
      // Show install button if desired
    });

    // Listen for online/offline events
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

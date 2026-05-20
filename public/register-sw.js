if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(
      function(registration) {
        console.log('Service Worker registration successful:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('New Service Worker activated');
              // Optional: notify user about app update
              if (confirm('A new version of KiddiesCheck is available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      },
      function(err) {
        console.log('Service Worker registration failed:', err);
      }
    );
  });
}

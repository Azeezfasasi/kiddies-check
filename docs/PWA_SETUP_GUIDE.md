# PWA Setup Guide for KiddiesCheck

## Overview
Your KiddiesCheck project has been configured as a Progressive Web App (PWA). This enables:
- **Offline Functionality**: Users can access cached content without internet
- **App Installation**: Install on home screen like native apps
- **Push Notifications**: Send real-time updates to users
- **Background Sync**: Sync data when connection is restored
- **Fast Loading**: Service worker caching for improved performance

## Configuration Files Created

### 1. **public/manifest.json**
- PWA metadata and configuration
- App name, icon definitions, shortcuts, and screenshots
- Used by browsers to install the app

### 2. **public/sw.js**
- Service Worker implementation
- Handles caching strategies
- Manages offline functionality
- Processes push notifications
- Implements background sync

### 3. **public/register-sw.js**
- Service Worker registration script
- Handles updates and user notifications

### 4. **public/offline.html**
- Fallback page when offline
- User-friendly offline message

### 5. **src/components/PWARegister.js**
- React component that registers the service worker
- Handles online/offline events
- Manages app lifecycle

### 6. **next.config.mjs** (Updated)
- Added next-pwa plugin
- Configured PWA settings:
  - Automatic service worker generation
  - Cache-on-front-end navigation
  - Reload on connection restoration

### 7. **src/app/layout.js** (Updated)
- Added PWA meta tags for iOS and Android
- Included manifest link
- Added apple-touch-icon support
- Added PWARegister component

## How to Use

### Development Mode
PWA is disabled during development for easier testing:
```bash
npm run dev
```
To enable PWA in development, change `disable: process.env.NODE_ENV === 'development'` in `next.config.mjs` to `disable: false`

### Production Build
```bash
npm run build
npm start
```
PWA is fully enabled in production.

## Required Assets

You need to add the following icons to the `public/` directory (replace with your own branding):
- `icon-192x192.png` - Standard app icon (192x192)
- `icon-512x512.png` - Large app icon (512x512)
- `icon-maskable-192x192.png` - Maskable icon for Android (192x192)
- `icon-maskable-512x512.png` - Maskable icon for Android (512x512)
- `screenshot-540x720.png` - Mobile screenshot (540x720)
- `screenshot-1280x720.png` - Desktop screenshot (1280x720)
- `apple-icon.png` - iOS app icon (180x180+)

### Icon Guidelines
- Use PNG format with transparency
- Ensure proper dimensions
- Maskable icons: Keep important content in the center (safe zone)
- Brand colors should match your theme

## Testing PWA Features

### 1. **Audit with Lighthouse**
```bash
# In Chrome DevTools: Ctrl+Shift+I > Lighthouse > PWA
```

### 2. **Test Service Worker**
- Open DevTools (F12)
- Go to Application > Service Workers
- Verify service worker is registered and running

### 3. **Test Offline Mode**
- DevTools > Application > Service Workers > Check "Offline"
- Navigate the app
- Return to online and observe automatic sync

### 4. **Test Installation (Chrome)**
- Open app in Chrome
- Click the install icon in the address bar
- Or right-click > Install app

### 5. **Test on Mobile**
- On Android: Chrome will show install prompt
- On iOS: Use Share > Add to Home Screen

## Caching Strategy

The service worker uses a **Network First** strategy:
1. Attempts to fetch from network first
2. Falls back to cache if offline
3. Updates cache when online
4. Serves offline.html as fallback

### Excluded from Caching
- `/api/*` routes (always fetch fresh)
- Cloudinary images (always fetch fresh)
- External resources

## Performance Optimization

The PWA configuration includes:
- **aggressiveFrontEndNavCaching**: Cache navigation requests
- **cacheOnFrontEndNav**: Cache pages as user navigates
- **reloadOnOnline**: Auto-reload when connection restored
- **skipWaiting**: Activate new service worker immediately

## Updating Icons

1. **Generate icons** using a PWA icon generator:
   - https://www.pwabuilder.com/
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/

2. **Place in public/** folder

3. **Update manifest.json** if sizes change

4. **Rebuild**:
   ```bash
   npm run build
   npm start
   ```

## Push Notifications Setup

To enable push notifications:

1. **Frontend** - User subscribes in PWARegister.js:
```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
});
```

2. **Backend** - Send notifications:
```javascript
webpush.sendNotification(subscription, {
  title: 'Alert Title',
  body: 'Alert message',
  icon: '/icon-192x192.png'
});
```

3. **Environment Variables** (.env.local):
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

## Background Sync Setup

To enable background sync (e.g., sync data when connection restored):

1. **Register sync task** when offline:
```javascript
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-messages');
}
```

2. **Handle in Service Worker** (already in sw.js):
```javascript
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // Sync logic here
    );
  }
});
```

## Troubleshooting

### PWA Not Installing
- Ensure HTTPS is used (localhost works for testing)
- Check manifest.json is valid: https://manifest-validator.appspot.com/
- Verify icons exist and are correct size

### Service Worker Not Registering
- Check browser console for errors
- Verify sw.js path is correct
- Clear browser cache and reload
- Check DevTools > Application > Service Workers

### Cache Issues
- Open DevTools > Application > Cache Storage
- Delete old caches
- Reload the page
- The service worker will rebuild cache

### Icons Not Showing
- Check public/ folder has all icon files
- Verify manifest.json paths match file names
- Try incognito mode (clears cache)
- Rebuild and redeploy

## Next Steps

1. **Add icons** to `public/` directory
2. **Test on device** to verify installation
3. **Set up push notifications** for alerts
4. **Implement background sync** for data persistence
5. **Monitor** with Lighthouse for PWA compliance

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [next-pwa GitHub](https://github.com/shadowwalker/next-pwa)
- [Web Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Manifest Validator](https://manifest-validator.appspot.com/)

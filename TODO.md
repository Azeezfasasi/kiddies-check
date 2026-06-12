# TODO

- [x] Inspect current PWA install prompt implementation in `src/components/PWAInstallPrompt.js`.
- [ ] Implement “show prompt only once” using storage (so it persists across revisits) but still allows it to show on next visit.
- [ ] Update prompt logic so it doesn’t re-render multiple times during the same prompt availability.
- [ ] Validate behavior:
  - Prompt appears once per user per availability cycle
  - Prompt reappears on next page visit (fresh load)
  - Prompt never shows when app is already installed
- [ ] Run `npm test`/lint/build as available.


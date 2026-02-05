# PWA Configuration

## vite-plugin-pwa Setup
- Register type: `autoUpdate`
- Manifest references non-existent PNGs: `pwa-192x192.png`, `pwa-512x512.png`
- Builds successfully but displays default browser icon

## Workbox
- Generates: `sw.js`, `registerSW.js`, `workbox-*.js`
- Precaches 5 entries (~379 KB)
- Offline cache + installability

## Service Worker
- Automatically registered via `registerSW()` in main
- Self-hosted, no external dependencies

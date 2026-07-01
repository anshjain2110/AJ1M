/**
 * SSR safety stub: on the server (no window), provide no-op localStorage /
 * sessionStorage so ported CRA components that read them during render don't
 * throw ReferenceError. Never persists anything server-side; getItem -> null,
 * which renders the logged-out / empty initial state (correct for crawlers).
 * We deliberately do NOT stub `window`/`document`, so `typeof window` guards
 * keep working as intended.
 */
if (typeof window === 'undefined') {
  const noopStore = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {},
    key() { return null; },
    length: 0,
  };
  if (typeof globalThis.localStorage === 'undefined') {
    try { globalThis.localStorage = noopStore; } catch (e) { /* ignore */ }
  }
  if (typeof globalThis.sessionStorage === 'undefined') {
    try { globalThis.sessionStorage = noopStore; } catch (e) { /* ignore */ }
  }
}

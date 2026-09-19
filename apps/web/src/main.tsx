import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { setLoaderOptions } from '@loaders.gl/core';
import './styles.css';

// deck.gl pulls in loaders.gl, which by default resolves worker scripts from unpkg.com at
// runtime. This application claims to make no third-party request, so the CDN is disabled
// outright and workers are resolved locally. e2e/no-external-requests.mjs fails the build if
// any cross-origin request escapes, so the claim is tested rather than asserted.
setLoaderOptions({ CDN: null, worker: false, useLocalLibraries: true });
import { useStore } from './state';

// Test hook: lets the e2e harness drive selection deterministically instead of
// guessing at screen coordinates on a rotating globe.
(window as unknown as Record<string, unknown>).__select = (iso3: string | null) =>
  useStore.getState().select(iso3);

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);

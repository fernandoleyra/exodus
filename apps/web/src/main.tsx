import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { useStore } from './state';

// Test hook: lets the e2e harness drive selection deterministically instead of
// guessing at screen coordinates on a rotating globe.
(window as unknown as Record<string, unknown>).__select = (iso3: string | null) =>
  useStore.getState().select(iso3);

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);

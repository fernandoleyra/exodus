import { useEffect, useState } from 'react';

export type Route = 'landing' | 'observer' | 'sources' | 'legal' | 'methods' | 'concordance';

const ROUTES: Record<string, Route> = {
  '': 'landing', '/': 'landing',
  '/observer': 'observer', '/sources': 'sources', '/legal': 'legal', '/methods': 'methods',
  '/concordance': 'concordance',
};

export function parse(hash: string): Route {
  const p = hash.replace(/^#/, '') || '/';
  return ROUTES[p] ?? 'landing';
}

export function navigate(r: Route) {
  const to = r === 'landing' ? '/' : `/${r}`;
  if (window.location.hash !== `#${to}`) window.location.hash = to;
  else window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute(): Route {
  const [r, setR] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const on = () => { setR(parse(window.location.hash)); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}

/** Acceptance of the terms. Stored in localStorage, which under ePrivacy Art. 5(3) is
 *  "strictly necessary" for a service the user explicitly requested — it exists solely so we
 *  do not ask the same person twice. It is never read by anything else and never leaves
 *  the browser. */
const KEY = 'exodus.terms.accepted.v1';
export function hasAccepted(): boolean {
  try { return localStorage.getItem(KEY) != null; } catch { return false; }
}
export function accept(): void {
  try { localStorage.setItem(KEY, new Date().toISOString()); } catch { /* private mode */ }
}

import type { ReactNode } from 'react';
import { navigate } from '../router';
import './pages.css';

export function PageShell({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <div className="page">
      <header className="page-nav">
        <button className="wordmark-btn" onClick={() => navigate('landing')}>EXODUS</button>
        <nav>
          <a href="#/sources">Sources</a>
          <a href="#/methods">Methods</a>
          <a href="#/legal">Legal</a>
          <a href="#/observer">Observer</a>
        </nav>
      </header>
      <main className="page-body">
        <div className="page-kicker">{kicker}</div>
        <h1>{title}</h1>
        {children}
      </main>
      <footer className="page-foot">
        Open source under AGPL-3.0-or-later · every figure here is a modelled estimate ·
        <a href="#/sources"> source ledger</a>
      </footer>
    </div>
  );
}

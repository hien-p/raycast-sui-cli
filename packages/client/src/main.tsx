import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { initializeAnalytics } from './lib/analytics';
import { initClarity } from './lib/clarity';
import { initStatsig } from './lib/statsig';
import './styles/globals.css';

// Handle chunk loading errors (happens after new deployments when user has cached old chunks)
// Auto-reload page once to get fresh chunks
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('ChunkLoadError')
  ) {
    // Only reload once to prevent infinite loops
    const hasReloaded = sessionStorage.getItem('chunk-reload');
    if (!hasReloaded) {
      sessionStorage.setItem('chunk-reload', 'true');
      window.location.reload();
    }
  }
});

// Clear reload flag on successful load
window.addEventListener('load', () => {
  sessionStorage.removeItem('chunk-reload');
});

// Initialize Analytics
initializeAnalytics();
initClarity();
initStatsig(); // Session replay + auto-capture

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

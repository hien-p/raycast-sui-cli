import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { initializeAnalytics } from './lib/analytics';
import { initClarity } from './lib/clarity';
import './styles/globals.css';

// Initialize Analytics
initializeAnalytics();
initClarity();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Auto-reload on Vite dynamic import chunk hash mismatch when new builds are deployed
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (new deployment detected). Reloading page...', event);
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

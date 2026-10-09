import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary, AppErrorFallback } from './components/errors';

declare global {
  interface Window {
    gm_authFailure?: () => void;
    __GMAPS_AUTH_FAILED__?: boolean;
  }
}

// Interceptor global para fallas de autenticación y activación de Google Maps Platform
if (typeof window !== 'undefined') {
  // Callback oficial de falla de autenticación de Google Maps
  window.gm_authFailure = () => {
    window.__GMAPS_AUTH_FAILED__ = true;
    window.dispatchEvent(new CustomEvent('gmaps_auth_error', { detail: 'ApiNotActivatedMapError' }));
  };

  // Interceptar errores no capturados provocados por scripts externos de Google Maps
  window.addEventListener('error', (event: ErrorEvent) => {
    const msg = typeof event.message === 'string' ? event.message : '';
    if (
      msg.includes('ApiNotActivatedMapError') ||
      msg.includes('ApiProjectMapError') ||
      (msg.includes('Google Maps JavaScript API error') && (msg.includes('ApiNotActivated') || msg.includes('Project')))
    ) {
      window.__GMAPS_AUTH_FAILED__ = true;
      window.dispatchEvent(new CustomEvent('gmaps_auth_error', { detail: 'ApiNotActivatedMapError' }));
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  });

  // Interceptar unhandled rejections procedentes del loader de Google Maps
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (
      reasonMsg.includes('ApiNotActivatedMapError') ||
      reasonMsg.includes('ApiProjectMapError')
    ) {
      window.__GMAPS_AUTH_FAILED__ = true;
      window.dispatchEvent(new CustomEvent('gmaps_auth_error', { detail: 'ApiNotActivatedMapError' }));
      event.preventDefault();
    }
  });

  // Interceptar mensajes de consola de error de Google Maps
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const firstArg = typeof args[0] === 'string' ? args[0] : '';
    if (
      firstArg.includes('Google Maps JavaScript API error') ||
      firstArg.includes('ApiNotActivatedMapError') ||
      firstArg.includes('ApiProjectMapError')
    ) {
      window.__GMAPS_AUTH_FAILED__ = true;
      window.dispatchEvent(new CustomEvent('gmaps_auth_error', { detail: 'ApiNotActivatedMapError' }));
      console.warn('[Google Maps Platform]', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary name="RootApp" fallback={<AppErrorFallback />}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


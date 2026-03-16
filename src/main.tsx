import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Deep error catching for Android debugging — remove after fix confirmed
window.onerror = (msg, src, line, col, err) => {
  console.error('[CRASH] window.onerror:', msg, 'at', src, String(line) + ':' + String(col), err?.stack || '');
};
window.addEventListener('unhandledrejection', (e) => {
  console.error('[CRASH] unhandledrejection:', e.reason);
});
window.addEventListener('error', (e) => {
  console.error('[CRASH] window listener error:', e.message || 'Unknown error', e.error?.stack || '');
}, true); // Capture phase to get resource errors

console.log('[DEBUG] main.tsx executing');

const container = document.getElementById('root');
if (!container) {
  console.error('[CRASH] root container NOT FOUND');
} else {
  console.log('[DEBUG] root container found. Initializing React 19 root...');
  try {
    const root = createRoot(container);
    root.render(<App />);
    console.log('[DEBUG] root.render() called successfully');
  } catch (err) {
    console.error('[CRASH] Failed during createRoot or render:', err);
  }
}
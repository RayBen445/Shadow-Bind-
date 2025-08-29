import '../styles/globals.css';
import '../styles/advanced-features.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Register service workers for PWA functionality
    if ('serviceWorker' in navigator) {
      // Register notification service worker
      navigator.serviceWorker
        .register('/sw-notifications.js')
        .then((registration) => {
          console.log('✅ Notification Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('❌ Notification Service Worker registration failed:', error);
        });
    }
  }, []);

  return <Component {...pageProps} />;
}
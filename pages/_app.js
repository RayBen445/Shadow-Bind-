import '../styles/globals.css';
import '../styles/advanced-features.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registration successful with scope: ', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed: ', error);
        });
      
      // Register notification service worker
      navigator.serviceWorker
        .register('/sw-notifications.js')
        .then((registration) => {
          console.log('Notification Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('Notification Service Worker registration failed:', error);
        });
    }
  }, []);

  return <Component {...pageProps} />;
}
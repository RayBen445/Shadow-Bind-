import Head from 'next/head';
import AuthStatus from '../components/AuthStatus';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Shadow Bind - Messaging App</title>
        <meta name="description" content="A secure messaging app with Firebase integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </Head>

      <main className="main">
        <div className="hero">
          <h1 className="title">
            Welcome to <span className="gradient-text">Shadow Bind</span>
          </h1>
          
          <p className="description">
            A secure messaging platform built with Next.js and Firebase
          </p>

          <AuthStatus />

          <div className="features">
            <div className="feature-card">
              <h3>🔐 Secure Authentication</h3>
              <p>Firebase Authentication with multiple sign-in methods</p>
            </div>
            
            <div className="feature-card">
              <h3>💬 Real-time Messaging</h3>
              <p>Instant messaging powered by Firestore</p>
            </div>
            
            <div className="feature-card">
              <h3>📱 Progressive Web App</h3>
              <p>Install and use offline with PWA capabilities</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Shadow Bind. All rights reserved.</p>
      </footer>
    </div>
  );
}
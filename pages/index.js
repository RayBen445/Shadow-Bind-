import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthStatus from '../components/AuthStatus';
import { useAdminAuth } from '../lib/admin/middleware';
import SearchBox from '../components/search/SearchBox';
import { initializeNotifications } from '../lib/notifications/service';
import { initializeEncryption } from '../lib/encryption/e2ee';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  
  const adminAuth = useAdminAuth(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Initialize advanced features when user logs in
      if (user) {
        try {
          // Initialize notifications
          await initializeNotifications();
          
          // Initialize encryption
          await initializeEncryption();
          
          console.log('✅ Advanced features initialized');
        } catch (error) {
          console.error('Failed to initialize advanced features:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  return (
    <div className="container">
      <Head>
        <title>Shadow Bind - Advanced Messaging Platform</title>
        <meta name="description" content="A secure messaging app with advanced features: search, groups, encryption, and admin tools" />
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
            Advanced secure messaging platform with AI-powered search, groups, encryption, and admin tools
          </p>

          <AuthStatus />

          {/* Quick Search (when logged in) */}
          {user && (
            <div className="quick-search">
              <SearchBox 
                onResults={handleSearchResults}
                placeholder="Quick search across all your content..."
                className="home-search-box"
              />
              
              {searchResults && searchResults.total > 0 && (
                <div className="quick-search-results">
                  <p>{searchResults.total} results found</p>
                  <Link href="/search" className="view-all-results">View all results →</Link>
                </div>
              )}
            </div>
          )}

          <div className="features">
            <div className="feature-card">
              <h3>🔐 End-to-End Encryption</h3>
              <p>Advanced encryption with Signal Protocol and Web Crypto API</p>
            </div>
            
            <div className="feature-card">
              <h3>🔍 AI-Powered Search</h3>
              <p>Intelligent search with real-time updates and semantic understanding</p>
            </div>
            
            <div className="feature-card">
              <h3>👥 Advanced Groups</h3>
              <p>Rich group features with roles, permissions, and file sharing</p>
            </div>
            
            <div className="feature-card">
              <h3>🔔 Smart Notifications</h3>
              <p>Contextual notifications with scheduling and cross-platform sync</p>
            </div>
            
            <div className="feature-card">
              <h3>⚡ Real-time Everything</h3>
              <p>Live updates for messages, search results, and admin monitoring</p>
            </div>
            
            <div className="feature-card">
              <h3>🛡️ Admin Dashboard</h3>
              <p>Comprehensive administrative tools with security monitoring</p>
            </div>
          </div>

          {/* Navigation Links (when logged in) */}
          {user && (
            <div className="nav-links">
              <Link href="/features" className="nav-link featured">
                🚀 All 50 Features
              </Link>
              <Link href="/search" className="nav-link">
                🔍 Advanced Search
              </Link>
              <Link href="/groups" className="nav-link">
                👥 Groups
              </Link>
              <Link href="/notifications" className="nav-link">
                🔔 Notifications
              </Link>
              {adminAuth.isAdmin && (
                <Link href="/admin" className="nav-link admin">
                  🛡️ Admin Dashboard
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Shadow Bind. All rights reserved.</p>
        <p className="footer-version">
          Advanced Features v1.0.0 | 
          <a href="https://github.com/RayBen445/Shadow-Bind-" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Chat from '../components/Chat';
import FileUpload from '../components/FileUpload';
import UserProfile from '../components/UserProfile';
import GroupChat from '../components/GroupChat';
import NotificationSettings from '../components/NotificationSettings';
import MessageSearch from '../components/MessageSearch';

/**
 * Demo page to showcase all scaffolded features
 * This page demonstrates all the major features that have been implemented
 * with minimal viable functionality and comprehensive TODO documentation.
 */

export default function Demo() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDemo, setActiveDemo] = useState('chat');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFileUploaded = (fileData) => {
    console.log('File uploaded:', fileData);
    alert(`File uploaded successfully: ${fileData.originalName}`);
  };

  const handleSearchResultSelect = (result) => {
    console.log('Search result selected:', result);
    alert(`Selected message from ${result.senderName}: ${result.content.substring(0, 100)}...`);
  };

  if (loading) {
    return (
      <div className="container">
        <Head>
          <title>Features Demo - Shadow Bind</title>
        </Head>
        <div className="main">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Head>
        <title>Features Demo - Shadow Bind</title>
        <meta name="description" content="Demo of Shadow Bind scaffolded features" />
      </Head>

      <main className="main">
        <div className="hero">
          <h1 className="title">
            🚀 <span className="gradient-text">Shadow Bind</span> Features Demo
          </h1>
          
          <p className="description">
            Explore the scaffolded features with minimal viable functionality
          </p>

          {!user && (
            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
              <p>⚠️ Please sign in first on the <Link href="/" style={{ color: '#2563eb' }}>home page</Link> to fully test these features.</p>
            </div>
          )}

          <div className="demo-navigation">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
              <button 
                onClick={() => setActiveDemo('chat')}
                className={`btn ${activeDemo === 'chat' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                💬 Real-time Chat
              </button>
              <button 
                onClick={() => setActiveDemo('upload')}
                className={`btn ${activeDemo === 'upload' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                📁 File Upload
              </button>
              <button 
                onClick={() => setActiveDemo('profile')}
                className={`btn ${activeDemo === 'profile' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                👤 User Profile
              </button>
              <button 
                onClick={() => setActiveDemo('groups')}
                className={`btn ${activeDemo === 'groups' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                👥 Group Chat
              </button>
              <button 
                onClick={() => setActiveDemo('notifications')}
                className={`btn ${activeDemo === 'notifications' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                🔔 Notifications
              </button>
              <button 
                onClick={() => setActiveDemo('search')}
                className={`btn ${activeDemo === 'search' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                🔍 Message Search
              </button>
              <Link 
                href="/admin"
                className="btn btn-outline"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none' }}
              >
                🛡️ Admin Dashboard
              </Link>
            </div>
          </div>

          <div className="demo-content">
            {activeDemo === 'chat' && (
              <div className="demo-section">
                <h2>💬 Real-time Messaging with Firestore</h2>
                <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                  Demonstrates real-time chat functionality with Firestore backend.
                  Includes message sending, receiving, and real-time updates.
                </p>
                <Chat userId={user?.uid} chatId="demo-chat" />
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>TODO Features:</strong> Message reactions, replies, typing indicators, 
                  read receipts, message editing, file attachments, emoji picker, voice messages.
                </div>
              </div>
            )}

            {activeDemo === 'upload' && (
              <div className="demo-section">
                <h2>📁 File Upload with Firebase Storage</h2>
                <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                  Demonstrates file upload functionality using Firebase Storage.
                  Includes progress tracking and file validation.
                </p>
                <FileUpload onFileUploaded={handleFileUploaded} />
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>TODO Features:</strong> Drag & drop, multiple files, image preview, 
                  compression, file organization, access controls, virus scanning.
                </div>
              </div>
            )}

            {activeDemo === 'profile' && (
              <div className="demo-section">
                <h2>👤 User Profiles and Settings</h2>
                <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                  Demonstrates user profile management with Firestore storage.
                  Includes profile editing, image upload, and privacy settings.
                </p>
                <UserProfile userId={user?.uid} isOwnProfile={true} />
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>TODO Features:</strong> Social media links, badges, achievements, 
                  activity status, profile themes, verification system, QR codes.
                </div>
              </div>
            )}

            {activeDemo === 'groups' && (
              <div className="demo-section">
                <h2>👥 Group Chat Functionality</h2>
                <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                  Demonstrates group chat creation and management with Firestore.
                  Includes group creation, member management, and chat interface.
                </p>
                <GroupChat />
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>TODO Features:</strong> Member roles, permissions, group settings, 
                  file sharing, group discovery, templates, analytics, moderation tools.
                </div>
              </div>
            )}

            {activeDemo === 'notifications' && (
              <div className="demo-section">
                <h2>🔔 Push Notifications</h2>
                <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                  Demonstrates web push notification setup and configuration.
                  Includes permission handling, subscription management, and preferences.
                </p>
                <NotificationSettings />
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>TODO Features:</strong> Service worker implementation, notification scheduling, 
                  rich notifications, action buttons, notification history, analytics.
                </div>
              </div>
            )}

            {activeDemo === 'search' && (
              <div className="demo-section">
                <h2>🔍 Message Search and Filtering</h2>
                <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                  Demonstrates message search functionality with advanced filtering.
                  Includes search history, relevance scoring, and result highlighting.
                </p>
                <MessageSearch onResultSelect={handleSearchResultSelect} />
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>TODO Features:</strong> Full-text search indexing, semantic search, 
                  real-time updates, search analytics, export results, AI-powered search.
                </div>
              </div>
            )}
          </div>

          <div className="demo-info" style={{ marginTop: '3rem', padding: '2rem', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #0ea5e9' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0c4a6e' }}>🔧 Additional Scaffolded Features</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>🔐 Message Encryption</h4>
                <p style={{ margin: '0', fontSize: '0.875rem', color: '#64748b' }}>
                  Utility functions and documentation for end-to-end encryption implementation.
                  Located in <code>/lib/messageEncryption.js</code>
                </p>
              </div>
              <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>🛡️ Admin Dashboard</h4>
                <p style={{ margin: '0', fontSize: '0.875rem', color: '#64748b' }}>
                  Protected admin interface with user management, analytics, and system controls.
                  Visit <Link href="/admin" style={{ color: '#2563eb' }}>/admin</Link> (requires admin role)
                </p>
              </div>
            </div>
          </div>

          <div className="demo-navigation" style={{ marginTop: '2rem' }}>
            <Link href="/" className="btn btn-outline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Shadow Bind. All scaffolded features with comprehensive TODO documentation.</p>
      </footer>
    </div>
  );
}
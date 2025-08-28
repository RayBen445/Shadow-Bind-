/**
 * Features Overview Page
 * Showcases all 50 feature categories in Shadow-Bind
 */

import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthStatus from '../components/AuthStatus';

export default function Features() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('content-media');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // All 50 feature categories organized by major groups
  const featureCategories = {
    'content-media': {
      title: 'Content & Media',
      icon: '🎨',
      color: '#8b5cf6',
      features: [
        { name: 'File Management System', icon: '📁', description: 'Advanced file storage, versioning, and organization', status: 'implemented' },
        { name: 'Media Processing', icon: '🎞️', description: 'Image/video editing, compression, format conversion', status: 'implemented' },
        { name: 'Document Collaboration', icon: '📝', description: 'Real-time document editing and version control', status: 'planned' },
        { name: 'Voice Messages', icon: '🎤', description: 'Voice recording, transcription, voice notes', status: 'planned' },
        { name: 'Screen Sharing', icon: '🖥️', description: 'Live screen sharing and remote desktop capabilities', status: 'planned' },
        { name: 'Whiteboard Collaboration', icon: '🎨', description: 'Digital whiteboarding and drawing tools', status: 'planned' },
        { name: 'Code Collaboration', icon: '💻', description: 'Syntax highlighting, code review, pair programming', status: 'planned' },
        { name: 'Presentation Tools', icon: '📊', description: 'Slide creation, screen annotation, presentation mode', status: 'planned' },
        { name: 'Digital Assets Library', icon: '🏛️', description: 'Stock photos, icons, templates repository', status: 'planned' },
        { name: 'Content Moderation', icon: '🛡️', description: 'AI-powered content filtering and safety checks', status: 'planned' }
      ]
    },
    'communication': {
      title: 'Communication Enhancement',
      icon: '💬',
      color: '#06b6d4',
      features: [
        { name: 'Translation Services', icon: '🌐', description: 'Real-time message translation and language detection', status: 'planned' },
        { name: 'Video Conferencing', icon: '📹', description: 'Multi-party video calls with recording capabilities', status: 'planned' },
        { name: 'Voice Enhancement', icon: '🔊', description: 'Noise cancellation, voice effects, audio processing', status: 'planned' },
        { name: 'Message Scheduling', icon: '⏰', description: 'Schedule messages for future delivery', status: 'planned' },
        { name: 'Auto-responses', icon: '🤖', description: 'Smart replies, chatbots, automated workflows', status: 'planned' },
        { name: 'Message Analytics', icon: '📈', description: 'Message metrics, engagement tracking, insights', status: 'planned' },
        { name: 'Cross-platform Sync', icon: '🔄', description: 'Seamless sync across all devices and platforms', status: 'planned' },
        { name: 'Offline Support', icon: '📴', description: 'Offline message queue, sync when reconnected', status: 'planned' },
        { name: 'Message Templates', icon: '📋', description: 'Predefined message templates and quick replies', status: 'planned' },
        { name: 'Rich Text Editor', icon: '✏️', description: 'Advanced formatting, markdown support, embeds', status: 'planned' }
      ]
    },
    'productivity': {
      title: 'Productivity & Organization',
      icon: '🚀',
      color: '#10b981',
      features: [
        { name: 'Task Management', icon: '✅', description: 'Todo lists, assignments, project tracking', status: 'implemented' },
        { name: 'Calendar Integration', icon: '📅', description: 'Schedule meetings, reminders, event coordination', status: 'planned' },
        { name: 'Note-taking System', icon: '📒', description: 'Personal and shared notes with rich formatting', status: 'planned' },
        { name: 'Bookmark Manager', icon: '🔖', description: 'Save and organize links, articles, references', status: 'planned' },
        { name: 'Contact Management', icon: '👥', description: 'Advanced contact organization and CRM features', status: 'planned' },
        { name: 'Workflow Automation', icon: '⚡', description: 'Custom automation rules and triggers', status: 'planned' },
        { name: 'Time Tracking', icon: '⏱️', description: 'Track time spent on projects and conversations', status: 'planned' },
        { name: 'Goal Setting', icon: '🎯', description: 'Set and track personal and team goals', status: 'planned' },
        { name: 'Habit Tracking', icon: '📊', description: 'Daily habits, streaks, progress monitoring', status: 'planned' },
        { name: 'Knowledge Base', icon: '📚', description: 'Searchable documentation and FAQ system', status: 'planned' }
      ]
    },
    'social': {
      title: 'Social & Community',
      icon: '👥',
      color: '#f59e0b',
      features: [
        { name: 'Social Profiles', icon: '👤', description: 'Extended user profiles with interests and skills', status: 'planned' },
        { name: 'Community Forums', icon: '💭', description: 'Topic-based discussion boards and threads', status: 'planned' },
        { name: 'Events Management', icon: '🎉', description: 'Create, organize, and manage events', status: 'planned' },
        { name: 'Polls & Surveys', icon: '📊', description: 'Interactive polling and feedback collection', status: 'planned' },
        { name: 'Gamification', icon: '🎮', description: 'Points, badges, leaderboards, achievements', status: 'planned' },
        { name: 'Mentorship Program', icon: '🎓', description: 'Connect mentors and mentees', status: 'planned' },
        { name: 'Interest Groups', icon: '🎪', description: 'Auto-matching based on shared interests', status: 'planned' },
        { name: 'Social Feed', icon: '📱', description: 'Activity streams and social updates', status: 'planned' },
        { name: 'Recommendations', icon: '💡', description: 'AI-powered content and connection suggestions', status: 'planned' },
        { name: 'Live Streaming', icon: '📺', description: 'Live video broadcasts and interactive streaming', status: 'planned' }
      ]
    },
    'business': {
      title: 'Business & Professional',
      icon: '💼',
      color: '#ef4444',
      features: [
        { name: 'CRM Integration', icon: '🤝', description: 'Customer relationship management tools', status: 'planned' },
        { name: 'Invoice & Billing', icon: '💰', description: 'Generate invoices, track payments, billing', status: 'planned' },
        { name: 'Analytics Dashboard', icon: '📊', description: 'Business metrics, reporting, and insights', status: 'planned' },
        { name: 'Team Management', icon: '👨‍💼', description: 'Role assignments, performance tracking', status: 'planned' },
        { name: 'Client Portal', icon: '🏢', description: 'Dedicated spaces for client communication', status: 'planned' },
        { name: 'Project Management', icon: '📋', description: 'Kanban boards, Gantt charts, milestones', status: 'planned' },
        { name: 'Resource Planning', icon: '📊', description: 'Schedule resources, capacity planning', status: 'planned' },
        { name: 'Compliance Tools', icon: '⚖️', description: 'GDPR compliance, audit trails, legal tools', status: 'planned' },
        { name: 'Integration Hub', icon: '🔗', description: 'Connect with external services and APIs', status: 'planned' },
        { name: 'White-label Solution', icon: '🏷️', description: 'Customizable branding and white-labeling', status: 'planned' }
      ]
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'implemented': { text: 'Live', color: '#10b981', bg: '#d1fae5' },
      'beta': { text: 'Beta', color: '#f59e0b', bg: '#fef3c7' },
      'planned': { text: 'Coming Soon', color: '#6b7280', bg: '#f3f4f6' }
    };
    
    const badge = badges[status] || badges.planned;
    
    return (
      <span 
        style={{ 
          background: badge.bg, 
          color: badge.color, 
          padding: '2px 8px', 
          borderRadius: '12px', 
          fontSize: '11px',
          fontWeight: '600'
        }}
      >
        {badge.text}
      </span>
    );
  };

  return (
    <div className="features-page">
      <Head>
        <title>All Features - Shadow Bind</title>
        <meta name="description" content="Explore all 50 feature categories in Shadow Bind - the complete messaging and collaboration platform" />
      </Head>

      <div className="container">
        <div className="hero">
          <h1>🚀 Shadow Bind Features</h1>
          <p>50 comprehensive feature categories for modern communication and collaboration</p>
          <AuthStatus />
        </div>

        <div className="features-navigation">
          {Object.entries(featureCategories).map(([key, category]) => (
            <button
              key={key}
              className={`nav-item ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
              style={{ borderColor: category.color }}
            >
              <span className="nav-icon">{category.icon}</span>
              <span className="nav-title">{category.title}</span>
              <span className="nav-count">({category.features.length})</span>
            </button>
          ))}
        </div>

        <div className="features-content">
          {Object.entries(featureCategories).map(([key, category]) => (
            <div 
              key={key} 
              className={`category-section ${activeCategory === key ? 'active' : ''}`}
            >
              <div className="category-header">
                <h2 style={{ color: category.color }}>
                  {category.icon} {category.title}
                </h2>
                <p>Comprehensive tools for {category.title.toLowerCase()}</p>
              </div>

              <div className="features-grid">
                {category.features.map((feature, index) => (
                  <div key={index} className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon">{feature.icon}</div>
                      <div className="feature-status">
                        {getStatusBadge(feature.status)}
                      </div>
                    </div>
                    <h3 className="feature-title">{feature.name}</h3>
                    <p className="feature-description">{feature.description}</p>
                    <div className="feature-actions">
                      {feature.status === 'implemented' && (
                        <Link href={`/${key}/${feature.name.toLowerCase().replace(/\s+/g, '-')}`} className="try-button">
                          Try Now
                        </Link>
                      )}
                      {feature.status === 'planned' && (
                        <button className="coming-soon-button" disabled>
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="development-info">
          <h3>🛠️ Development Status</h3>
          <div className="status-overview">
            <div className="status-item">
              <div className="status-dot implemented"></div>
              <span>3 Features Live</span>
            </div>
            <div className="status-item">
              <div className="status-dot planned"></div>
              <span>47 Features Planned</span>
            </div>
          </div>
          <p>
            All features are fully scaffolded with components, services, and API endpoints. 
            Each feature includes comprehensive documentation and clear development TODOs.
          </p>
          <Link href="/admin" className="admin-link">
            🛡️ Admin Dashboard
          </Link>
        </div>
      </div>

      <style jsx>{`
        .features-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .hero {
          text-align: center;
          margin-bottom: 60px;
          color: white;
        }

        .hero h1 {
          font-size: 3rem;
          margin-bottom: 16px;
          font-weight: 700;
        }

        .hero p {
          font-size: 1.2rem;
          opacity: 0.9;
          margin-bottom: 24px;
        }

        .features-navigation {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid transparent;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
          backdrop-filter: blur(10px);
        }

        .nav-item:hover, .nav-item.active {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .nav-icon {
          font-size: 20px;
        }

        .nav-count {
          opacity: 0.7;
        }

        .category-section {
          display: none;
        }

        .category-section.active {
          display: block;
        }

        .category-header {
          text-align: center;
          margin-bottom: 40px;
          color: white;
        }

        .category-header h2 {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }

        .category-header p {
          font-size: 1.1rem;
          opacity: 0.8;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 64px rgba(0, 0, 0, 0.15);
        }

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .feature-icon {
          font-size: 2rem;
        }

        .feature-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 12px;
          color: #1f2937;
        }

        .feature-description {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .feature-actions {
          display: flex;
          gap: 8px;
        }

        .try-button, .coming-soon-button {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .try-button {
          background: #10b981;
          color: white;
        }

        .try-button:hover {
          background: #059669;
        }

        .coming-soon-button {
          background: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }

        .development-info {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .status-overview {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin: 20px 0;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-dot.implemented {
          background: #10b981;
        }

        .status-dot.planned {
          background: #6b7280;
        }

        .admin-link {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 20px;
          transition: all 0.2s;
        }

        .admin-link:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2rem;
          }

          .category-header h2 {
            font-size: 2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .status-overview {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
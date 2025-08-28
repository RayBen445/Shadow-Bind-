/**
 * Search Page
 * Full-featured search interface with advanced capabilities
 */

import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import SearchBox from '../components/search/SearchBox';

export default function SearchPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  if (loading) {
    return (
      <div className="search-loading">
        <div className="loading-spinner">⟳</div>
        <p>Loading search...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="search-auth-required">
        <Head>
          <title>Login Required - Shadow Bind Search</title>
        </Head>
        
        <main className="search-login-page">
          <h1>Authentication Required</h1>
          <p>Please log in to use the search feature.</p>
          <Link href="/" className="btn btn-primary">Go to Login</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="search-page">
      <Head>
        <title>Search - Shadow Bind</title>
        <meta name="description" content="Search messages, users, groups, and files in Shadow Bind" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="search-main">
        <div className="search-header">
          <h1>Search Shadow Bind</h1>
          <p>Find messages, users, groups, and files across your conversations</p>
        </div>

        {/* Search Interface */}
        <div className="search-interface">
          <SearchBox 
            onResults={handleSearchResults}
            placeholder="Search messages, users, groups, files..."
            className="search-main-box"
          />
        </div>

        {/* Search Results Display */}
        {searchResults && (
          <div className="search-results-container">
            <SearchResultsDisplay results={searchResults} />
          </div>
        )}

        {/* Search Tips */}
        <div className="search-tips">
          <h3>Search Tips</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <h4>🔍 Basic Search</h4>
              <p>Type keywords to find relevant content across all categories</p>
            </div>
            <div className="tip-item">
              <h4>🤖 AI Search</h4>
              <p>Enable AI search for natural language queries and semantic understanding</p>
            </div>
            <div className="tip-item">
              <h4>📂 Category Filters</h4>
              <p>Select specific categories to narrow down your search results</p>
            </div>
            <div className="tip-item">
              <h4>⚡ Real-time</h4>
              <p>Search results update automatically as new content is added</p>
            </div>
          </div>
        </div>

        {/* TODO: Add search history */}
        {/* TODO: Add saved searches */}
        {/* TODO: Add search analytics for admins */}
      </main>
    </div>
  );
}

/**
 * Search Results Display Component
 */
function SearchResultsDisplay({ results }) {
  const { results: items, total, categories, aiEnhanced } = results;

  if (total === 0) {
    return (
      <div className="search-results-empty">
        <h3>No results found</h3>
        <p>Try adjusting your search terms or enabling different categories</p>
      </div>
    );
  }

  return (
    <div className="search-results-display">
      <div className="results-header">
        <h3>
          {total} result{total !== 1 ? 's' : ''} found
          {aiEnhanced && <span className="ai-badge">🤖 AI Enhanced</span>}
        </h3>
        
        {/* Category breakdown */}
        {Object.keys(categories).length > 0 && (
          <div className="category-breakdown">
            {Object.entries(categories).map(([category, items]) => (
              <span key={category} className={`category-tag ${category}`}>
                {category}: {Array.isArray(items) ? items.length : 0}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results list */}
      <div className="results-list">
        {items.map((item, index) => (
          <SearchResultCard key={`${item.category}-${item.id}-${index}`} item={item} />
        ))}
      </div>

      {/* Load more button */}
      {total > items.length && (
        <div className="load-more-container">
          <button className="btn btn-secondary">
            Load more results
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Search Result Card
 */
function SearchResultCard({ item }) {
  const { category, _highlighted } = item;

  const renderHighlightedText = (text, highlightedText) => {
    if (highlightedText) {
      return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
    }
    return text;
  };

  const handleItemClick = () => {
    // Navigate to the specific item based on category
    switch (category) {
      case 'messages':
        if (item.groupId) {
          window.location.href = `/groups/${item.groupId}`;
        }
        break;
      case 'groups':
        window.location.href = `/groups/${item.id}`;
        break;
      case 'users':
        window.location.href = `/profile/${item.id}`;
        break;
      case 'files':
        // Handle file view/download
        console.log('View file:', item.id);
        break;
      default:
        console.log('Unknown category:', category);
    }
  };

  return (
    <div className={`search-result-card ${category}`} onClick={handleItemClick}>
      <div className="result-header">
        <span className={`category-badge ${category}`}>{category}</span>
        <span className="result-timestamp">
          {new Date(item.timestamp?.toDate?.() || item.createdAt?.toDate?.() || item.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="result-content">
        {category === 'messages' && (
          <>
            <div className="message-content">
              {renderHighlightedText(item.content, _highlighted?.content)}
            </div>
            <div className="message-sender">
              From: {renderHighlightedText(item.sender, _highlighted?.sender)}
            </div>
          </>
        )}

        {category === 'users' && (
          <>
            <div className="user-name">
              {renderHighlightedText(item.displayName, _highlighted?.displayName)}
            </div>
            <div className="user-email">
              {renderHighlightedText(item.email, _highlighted?.email)}
            </div>
          </>
        )}

        {category === 'groups' && (
          <>
            <div className="group-name">
              {renderHighlightedText(item.name, _highlighted?.name)}
            </div>
            <div className="group-description">
              {renderHighlightedText(item.description, _highlighted?.description)}
            </div>
            <div className="group-members">
              {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
            </div>
          </>
        )}

        {category === 'files' && (
          <>
            <div className="file-name">
              {renderHighlightedText(item.name, _highlighted?.name)}
            </div>
            <div className="file-info">
              <span className="file-type">{item.type}</span>
              <span className="file-size">{item.size}</span>
              <span className="file-uploader">by {item.uploadedBy}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
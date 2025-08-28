import { useState, useEffect, useCallback } from 'react';
import { auth, db, isConfigured } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';

/**
 * Message Search and Filter Component
 * 
 * TODO: Complete implementation
 * - Implement full-text search with indexing
 * - Add advanced search filters (date range, sender, file types)
 * - Implement search result highlighting
 * - Add search history and saved searches
 * - Implement search analytics and suggestions
 * - Add export search results functionality
 * - Implement real-time search updates
 * - Add search within specific chats/groups
 * - Implement semantic search and AI-powered search
 * - Add search performance optimization
 */

export default function MessageSearch({ chatId = null, onResultSelect = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    sender: '',
    messageType: 'all', // 'all', 'text', 'file', 'image'
    chatType: 'all', // 'all', 'direct', 'group'
    hasFiles: false,
    hasImages: false
  });
  const [sortBy, setSortBy] = useState('timestamp'); // 'timestamp', 'relevance'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const resultsPerPage = 20;

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('messageSearchHistory');
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Save search to history
  const saveSearchToHistory = useCallback((query, filters) => {
    if (!query.trim()) return;
    
    const searchEntry = {
      id: Date.now(),
      query: query.trim(),
      filters: { ...filters },
      timestamp: new Date(),
      resultCount: totalResults
    };

    const updatedHistory = [
      searchEntry,
      ...searchHistory.filter(entry => entry.query !== query.trim()).slice(0, 9) // Keep last 10
    ];

    setSearchHistory(updatedHistory);
    
    try {
      localStorage.setItem('messageSearchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [searchHistory, totalResults]);

  // Perform search
  const performSearch = async (page = 1) => {
    if (!searchQuery.trim() || !isConfigured || !auth.currentUser) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setCurrentPage(page);

    try {
      // TODO: Implement proper full-text search
      // This is a simplified implementation - production should use:
      // - Elasticsearch or Algolia for full-text search
      // - Cloud Functions for server-side search
      // - Proper indexing strategy
      // - Search result ranking

      // Suggested Firestore structure for search:
      // /search-index/{messageId}
      // {
      //   messageId: string,
      //   chatId: string,
      //   senderId: string,
      //   senderName: string,
      //   content: string,
      //   contentLower: string, // For case-insensitive search
      //   keywords: array, // Extracted keywords
      //   timestamp: timestamp,
      //   messageType: string,
      //   chatType: string,
      //   hasFiles: boolean,
      //   hasImages: boolean,
      //   fileTypes: array,
      //   participants: array // For group chats
      // }

      let searchRef = collection(db, 'search-index');
      let searchQuery = query(searchRef);

      // Apply text search (simplified - not actual full-text search)
      // TODO: Implement proper full-text search with indexing
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
      
      if (searchTerms.length > 0) {
        // This is a placeholder - Firestore doesn't support full-text search natively
        // In production, use array-contains for keywords or external search service
        searchQuery = query(
          searchRef,
          where('keywords', 'array-contains-any', searchTerms),
          orderBy('timestamp', sortOrder === 'desc' ? 'desc' : 'asc'),
          limit(resultsPerPage)
        );
      }

      // Apply filters
      if (filters.sender) {
        searchQuery = query(searchQuery, where('senderId', '==', filters.sender));
      }
      
      if (filters.messageType && filters.messageType !== 'all') {
        searchQuery = query(searchQuery, where('messageType', '==', filters.messageType));
      }
      
      if (filters.chatType && filters.chatType !== 'all') {
        searchQuery = query(searchQuery, where('chatType', '==', filters.chatType));
      }
      
      if (filters.hasFiles) {
        searchQuery = query(searchQuery, where('hasFiles', '==', true));
      }
      
      if (filters.hasImages) {
        searchQuery = query(searchQuery, where('hasImages', '==', true));
      }
      
      if (chatId) {
        searchQuery = query(searchQuery, where('chatId', '==', chatId));
      }

      // TODO: Add date range filtering
      if (filters.dateFrom || filters.dateTo) {
        // Implement date range filtering
        console.log('TODO: Implement date range filtering');
      }

      const snapshot = await getDocs(searchQuery);
      const results = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // TODO: Get full message data if needed
        const messageData = {
          id: doc.id,
          ...data,
          // TODO: Add relevance scoring
          relevance: calculateRelevance(data, searchQuery),
          // TODO: Add snippet with highlighted text
          snippet: generateSnippet(data.content, searchQuery)
        };
        
        results.push(messageData);
      }

      // TODO: Sort by relevance if selected
      if (sortBy === 'relevance') {
        results.sort((a, b) => b.relevance - a.relevance);
      }

      setSearchResults(results);
      setTotalResults(results.length); // TODO: Get accurate total count
      
      // Save to search history
      saveSearchToHistory(searchQuery, filters);

    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate search relevance (placeholder implementation)
  const calculateRelevance = (messageData, searchQuery) => {
    // TODO: Implement proper relevance scoring
    // Consider factors like:
    // - Exact phrase matches
    // - Word proximity
    // - Message recency
    // - Sender relevance
    // - User interaction history
    
    let score = 0;
    const content = messageData.content.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    // Exact match bonus
    if (content.includes(query)) {
      score += 100;
    }
    
    // Word matches
    const queryWords = query.split(' ');
    queryWords.forEach(word => {
      if (content.includes(word)) {
        score += 10;
      }
    });
    
    // Recency bonus (newer messages score higher)
    const daysSinceMessage = (Date.now() - messageData.timestamp.toDate().getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 50 - daysSinceMessage);
    
    return score;
  };

  // Generate search result snippet
  const generateSnippet = (content, searchQuery, maxLength = 150) => {
    // TODO: Implement proper snippet generation with highlighting
    if (content.length <= maxLength) {
      return content;
    }
    
    const query = searchQuery.toLowerCase();
    const contentLower = content.toLowerCase();
    const queryIndex = contentLower.indexOf(query);
    
    if (queryIndex !== -1) {
      const start = Math.max(0, queryIndex - 50);
      const end = Math.min(content.length, queryIndex + query.length + 50);
      let snippet = content.substring(start, end);
      
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';
      
      return snippet;
    }
    
    return content.substring(0, maxLength) + '...';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentPage(1);
    setTotalResults(0);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      sender: '',
      messageType: 'all',
      chatType: 'all',
      hasFiles: false,
      hasImages: false
    });
  };

  const loadSearchFromHistory = (historyEntry) => {
    setSearchQuery(historyEntry.query);
    setFilters(historyEntry.filters);
  };

  const removeFromHistory = (entryId) => {
    const updatedHistory = searchHistory.filter(entry => entry.id !== entryId);
    setSearchHistory(updatedHistory);
    
    try {
      localStorage.setItem('messageSearchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error updating search history:', error);
    }
  };

  if (!isConfigured) {
    return (
      <div className="search-container">
        <p>Search is not available. Please configure Firebase.</p>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="search-container">
        <p>Please sign in to search messages.</p>
      </div>
    );
  }

  return (
    <div className="search-container">
      <div className="search-header">
        <h3>🔍 Search Messages</h3>
        {chatId && <span className="search-scope">Searching in current chat</span>}
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="search-input"
          />
          <button 
            type="submit" 
            disabled={loading || !searchQuery.trim()}
            className="search-button"
          >
            {loading ? '⏳' : '🔍'}
          </button>
          {searchQuery && (
            <button 
              type="button"
              onClick={clearSearch}
              className="clear-button"
            >
              ✕
            </button>
          )}
        </div>

        <div className="search-options">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="toggle-filters-btn"
          >
            🎛️ {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>
          
          <div className="sort-options">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="timestamp">Sort by Date</option>
              <option value="relevance">Sort by Relevance</option>
            </select>
            
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div className="filter-row">
              <label>
                Date From:
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="filter-input"
                />
              </label>
              
              <label>
                Date To:
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="filter-input"
                />
              </label>
            </div>

            <div className="filter-row">
              <label>
                Message Type:
                <select
                  value={filters.messageType}
                  onChange={(e) => handleFilterChange('messageType', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Types</option>
                  <option value="text">Text Only</option>
                  <option value="file">Files</option>
                  <option value="image">Images</option>
                </select>
              </label>

              <label>
                Chat Type:
                <select
                  value={filters.chatType}
                  onChange={(e) => handleFilterChange('chatType', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Chats</option>
                  <option value="direct">Direct Messages</option>
                  <option value="group">Group Chats</option>
                </select>
              </label>
            </div>

            <div className="filter-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.hasFiles}
                  onChange={(e) => handleFilterChange('hasFiles', e.target.checked)}
                />
                <span>Has Files</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.hasImages}
                  onChange={(e) => handleFilterChange('hasImages', e.target.checked)}
                />
                <span>Has Images</span>
              </label>
            </div>

            <div className="filter-actions">
              <button type="button" onClick={clearFilters} className="btn btn-outline btn-small">
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Search History */}
      {searchHistory.length > 0 && !searchQuery && (
        <div className="search-history">
          <h4>Recent Searches</h4>
          <div className="history-list">
            {searchHistory.map(entry => (
              <div key={entry.id} className="history-item">
                <button
                  onClick={() => loadSearchFromHistory(entry)}
                  className="history-query"
                >
                  🔍 {entry.query}
                </button>
                <span className="history-count">{entry.resultCount} results</span>
                <button
                  onClick={() => removeFromHistory(entry.id)}
                  className="history-remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h4>Search Results ({totalResults})</h4>
            {/* TODO: Add export results button */}
          </div>
          
          <div className="results-list">
            {searchResults.map(result => (
              <div key={result.id} className="result-item">
                <div className="result-header">
                  <span className="result-sender">{result.senderName}</span>
                  <span className="result-date">
                    {result.timestamp?.toDate?.()?.toLocaleString() || 'Unknown date'}
                  </span>
                  {result.chatType === 'group' && (
                    <span className="result-chat">in {result.chatName || 'Group'}</span>
                  )}
                </div>
                <div className="result-content">
                  <p>{result.snippet || result.content}</p>
                  {/* TODO: Add highlighting for search terms */}
                </div>
                <div className="result-actions">
                  {onResultSelect && (
                    <button
                      onClick={() => onResultSelect(result)}
                      className="btn btn-outline btn-small"
                    >
                      Go to Message
                    </button>
                  )}
                  {result.relevance && (
                    <span className="relevance-score">
                      Relevance: {Math.round(result.relevance)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* TODO: Add pagination */}
          <div className="search-pagination">
            <p>TODO: Add pagination for search results</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="search-loading">
          <p>🔍 Searching...</p>
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !loading && (
        <div className="no-results">
          <p>No messages found matching your search.</p>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      )}

      {/* Search Tips */}
      {!searchQuery && (
        <div className="search-tips">
          <h4>Search Tips</h4>
          <ul>
            <li>Use quotes for exact phrases: &quot;hello world&quot;</li>
            <li>Search for files by type: filetype:pdf</li>
            <li>Find messages from specific users: from:username</li>
            <li>Use date filters to narrow results</li>
            <li>Combine multiple terms for better results</li>
          </ul>
        </div>
      )}
    </div>
  );
}
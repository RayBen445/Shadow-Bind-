/**
 * SearchBox Component
 * Main search interface with real-time results and suggestions
 */

import { useState, useEffect, useRef } from 'react';
import { performSearch, subscribeToSearch, getSearchSuggestions } from '../../lib/search/service';
import { performSemanticSearch } from '../../lib/search/ai';

export default function SearchBox({ onResults, placeholder = "Search messages, users, groups...", className = "" }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ results: [], total: 0, categories: {} });
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [useAISearch, setUseAISearch] = useState(false);
  
  const searchTimeout = useRef(null);
  const unsubscribeRef = useRef(null);
  const searchBoxRef = useRef(null);

  // Handle search input changes
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Debounce search
    searchTimeout.current = setTimeout(() => {
      performSearchQuery(newQuery);
    }, 300);
    
    // Get suggestions immediately for short queries
    if (newQuery.length >= 2) {
      loadSuggestions(newQuery);
    } else {
      setSuggestions([]);
      setResults({ results: [], total: 0, categories: {} });
      setShowResults(false);
    }
  };

  // Perform search query
  const performSearchQuery = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ results: [], total: 0, categories: {} });
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setShowResults(true);

    try {
      let searchResults;
      
      if (useAISearch) {
        // Use AI-powered search
        searchResults = await performSemanticSearch(searchQuery);
      } else {
        // Use regular search
        searchResults = await performSearch(searchQuery, selectedCategories);
      }
      
      setResults(searchResults);
      
      // Notify parent component
      if (onResults) {
        onResults(searchResults);
      }
      
      // Set up real-time updates for regular search
      if (!useAISearch && unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (!useAISearch) {
        unsubscribeRef.current = subscribeToSearch(
          searchQuery,
          (realtimeResults) => {
            setResults(realtimeResults);
            if (onResults) {
              onResults(realtimeResults);
            }
          },
          selectedCategories
        );
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({ results: [], total: 0, categories: {} });
    } finally {
      setIsLoading(false);
    }
  };

  // Load search suggestions
  const loadSuggestions = async (partialQuery) => {
    try {
      const newSuggestions = await getSearchSuggestions(partialQuery);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Suggestions error:', error);
      setSuggestions([]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    performSearchQuery(suggestion);
    setSuggestions([]);
  };

  // Handle category toggle
  const toggleCategory = (category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    
    // Re-perform search with new categories
    if (query.length >= 2) {
      performSearchQuery(query);
    }
  };

  // Handle AI search toggle
  const toggleAISearch = () => {
    setUseAISearch(!useAISearch);
    
    // Re-perform search with new mode
    if (query.length >= 2) {
      performSearchQuery(query);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults({ results: [], total: 0, categories: {} });
    setSuggestions([]);
    setShowResults(false);
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    if (onResults) {
      onResults({ results: [], total: 0, categories: {} });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowResults(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`search-box ${className}`} ref={searchBoxRef}>
      {/* Search Input */}
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="search-loading">
            <span className="spinner">⟳</span>
          </div>
        )}
        
        {/* Clear button */}
        {query && (
          <button 
            type="button"
            onClick={clearSearch}
            className="search-clear"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Search Options */}
      <div className="search-options">
        {/* Category filters */}
        <div className="search-categories">
          {['messages', 'users', 'groups', 'files'].map(category => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`category-filter ${selectedCategories.includes(category) ? 'active' : ''}`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* AI Search toggle */}
        <div className="search-ai-toggle">
          <label>
            <input
              type="checkbox"
              checked={useAISearch}
              onChange={toggleAISearch}
            />
            <span className="ai-label">🤖 AI Search</span>
          </label>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-item"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Results summary */}
      {showResults && (
        <div className="search-results-summary">
          <div className="results-count">
            {results.total} result{results.total !== 1 ? 's' : ''} found
            {useAISearch && <span className="ai-badge">AI Enhanced</span>}
          </div>
          
          {/* Category breakdown */}
          {Object.keys(results.categories).length > 0 && (
            <div className="results-breakdown">
              {Object.entries(results.categories).map(([category, items]) => (
                <span key={category} className="category-count">
                  {category}: {Array.isArray(items) ? items.length : 0}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Results (if not handled by parent) */}
      {showResults && !onResults && (
        <SearchResults results={results} query={query} />
      )}

      {/* TODO: Add search analytics tracking */}
      {/* TODO: Add keyboard navigation for suggestions */}
      {/* TODO: Add search history */}
    </div>
  );
}

/**
 * SearchResults Component
 * Display search results with highlighting
 */
function SearchResults({ results, query }) {
  if (!results.results || results.results.length === 0) {
    return (
      <div className="search-results empty">
        <p>No results found for &quot;{query}&quot;</p>
        <div className="search-tips">
          <p>Try:</p>
          <ul>
            <li>Checking your spelling</li>
            <li>Using different keywords</li>
            <li>Using fewer keywords</li>
            <li>Enabling AI search for better results</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      {results.results.map((result) => (
        <SearchResultItem 
          key={`${result.category}-${result.id}`} 
          result={result} 
          query={query} 
        />
      ))}
    </div>
  );
}

/**
 * SearchResultItem Component
 * Individual search result with highlighting
 */
function SearchResultItem({ result, query }) {
  const { category, _highlighted } = result;
  
  const renderHighlightedText = (text, highlightedText) => {
    if (highlightedText) {
      return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
    }
    return text;
  };

  return (
    <div className={`search-result-item ${category}`}>
      <div className="result-category">{category}</div>
      
      {category === 'messages' && (
        <div className="message-result">
          <div className="message-content">
            {renderHighlightedText(result.content, _highlighted?.content)}
          </div>
          <div className="message-meta">
            <span className="sender">{result.sender}</span>
            <span className="timestamp">{new Date(result.timestamp?.toDate?.() || result.timestamp).toLocaleString()}</span>
          </div>
        </div>
      )}
      
      {category === 'users' && (
        <div className="user-result">
          <div className="user-name">
            {renderHighlightedText(result.displayName, _highlighted?.displayName)}
          </div>
          <div className="user-email">
            {renderHighlightedText(result.email, _highlighted?.email)}
          </div>
        </div>
      )}
      
      {category === 'groups' && (
        <div className="group-result">
          <div className="group-name">
            {renderHighlightedText(result.name, _highlighted?.name)}
          </div>
          <div className="group-description">
            {renderHighlightedText(result.description, _highlighted?.description)}
          </div>
        </div>
      )}
      
      {category === 'files' && (
        <div className="file-result">
          <div className="file-name">
            {renderHighlightedText(result.name, _highlighted?.name)}
          </div>
          <div className="file-meta">
            <span className="file-type">{result.type}</span>
            <span className="file-uploader">{result.uploadedBy}</span>
          </div>
        </div>
      )}
    </div>
  );
}
/**
 * Search Service for Shadow-Bind
 * Handles full-text search with Firestore indexing and real-time updates
 */

import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Search configuration
 */
export const SEARCH_CONFIG = {
  // Maximum results per search
  MAX_RESULTS: 50,
  
  // Search categories
  CATEGORIES: {
    MESSAGES: 'messages',
    USERS: 'users',
    GROUPS: 'groups',
    FILES: 'files'
  },
  
  // Search indexes (TODO: Create these in Firestore)
  INDEXES: {
    messages: ['content', 'sender', 'timestamp', 'groupId'],
    users: ['displayName', 'email', 'status'],
    groups: ['name', 'description', 'tags', 'createdAt'],
    files: ['name', 'type', 'uploadedBy', 'groupId']
  }
};

/**
 * Perform full-text search across multiple collections
 * @param {string} searchTerm - Search query
 * @param {Array} categories - Categories to search in
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} - Search results
 */
export async function performSearch(searchTerm, categories = [], filters = {}) {
  if (!searchTerm || searchTerm.length < 2) {
    return { results: [], total: 0, categories: {} };
  }
  
  const results = {
    results: [],
    total: 0,
    categories: {}
  };
  
  // Default to all categories if none specified
  const searchCategories = categories.length > 0 ? categories : Object.values(SEARCH_CONFIG.CATEGORIES);
  
  // Search each category
  for (const category of searchCategories) {
    try {
      const categoryResults = await searchInCategory(category, searchTerm, filters);
      results.categories[category] = categoryResults;
      results.results.push(...categoryResults.map(item => ({ ...item, category })));
    } catch (error) {
      console.error(`Search error in category ${category}:`, error);
      results.categories[category] = [];
    }
  }
  
  // Sort results by relevance (timestamp for now, TODO: implement relevance scoring)
  results.results.sort((a, b) => {
    const timeA = a.timestamp?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
    const timeB = b.timestamp?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
    return timeB - timeA;
  });
  
  // Limit total results
  results.results = results.results.slice(0, SEARCH_CONFIG.MAX_RESULTS);
  results.total = results.results.length;
  
  // Log search analytics
  await logSearchAnalytics(searchTerm, results.total, categories);
  
  return results;
}

/**
 * Search within a specific category/collection
 * @param {string} category - Category to search
 * @param {string} searchTerm - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Search results for category
 */
async function searchInCategory(category, searchTerm, filters = {}) {
  const collectionRef = collection(db, category);
  const searchTermLower = searchTerm.toLowerCase();
  
  // TODO: Implement proper full-text search
  // For now, using simple text matching on indexed fields
  let searchQuery;
  
  switch (category) {
    case SEARCH_CONFIG.CATEGORIES.MESSAGES:
      searchQuery = query(
        collectionRef,
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      break;
      
    case SEARCH_CONFIG.CATEGORIES.USERS:
      searchQuery = query(
        collectionRef,
        orderBy('displayName'),
        limit(20)
      );
      break;
      
    case SEARCH_CONFIG.CATEGORIES.GROUPS:
      searchQuery = query(
        collectionRef,
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      break;
      
    case SEARCH_CONFIG.CATEGORIES.FILES:
      searchQuery = query(
        collectionRef,
        orderBy('uploadedAt', 'desc'),
        limit(20)
      );
      break;
      
    default:
      return [];
  }
  
  const snapshot = await getDocs(searchQuery);
  const results = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    
    // Simple text matching (TODO: Implement advanced search)
    if (matchesSearchTerm(data, searchTerm, category)) {
      results.push({
        id: doc.id,
        ...data,
        _highlighted: highlightSearchTerm(data, searchTerm, category)
      });
    }
  });
  
  return results;
}

/**
 * Check if document matches search term
 * @param {Object} data - Document data
 * @param {string} searchTerm - Search query
 * @param {string} category - Document category
 * @returns {boolean} - True if matches
 */
function matchesSearchTerm(data, searchTerm, category) {
  const searchTermLower = searchTerm.toLowerCase();
  const indexes = SEARCH_CONFIG.INDEXES[category] || [];
  
  return indexes.some(field => {
    const value = data[field];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(searchTermLower);
    }
    return false;
  });
}

/**
 * Highlight search term in results
 * @param {Object} data - Document data
 * @param {string} searchTerm - Search query
 * @param {string} category - Document category
 * @returns {Object} - Highlighted fields
 */
function highlightSearchTerm(data, searchTerm, category) {
  const highlighted = {};
  const indexes = SEARCH_CONFIG.INDEXES[category] || [];
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  
  indexes.forEach(field => {
    const value = data[field];
    if (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) {
      highlighted[field] = value.replace(regex, '<mark>$1</mark>');
    }
  });
  
  return highlighted;
}

/**
 * Real-time search with live updates
 * @param {string} searchTerm - Search query
 * @param {function} callback - Callback for results
 * @param {Array} categories - Categories to search
 * @returns {function} - Unsubscribe function
 */
export function subscribeToSearch(searchTerm, callback, categories = []) {
  if (!searchTerm || searchTerm.length < 2) {
    callback({ results: [], total: 0, categories: {} });
    return () => {};
  }
  
  const unsubscribes = [];
  const searchCategories = categories.length > 0 ? categories : Object.values(SEARCH_CONFIG.CATEGORIES);
  
  // Subscribe to each category
  searchCategories.forEach(category => {
    const unsubscribe = subscribeToSearchCategory(category, searchTerm, (results) => {
      // TODO: Aggregate results from all categories
      callback({ results, total: results.length, categories: { [category]: results } });
    });
    unsubscribes.push(unsubscribe);
  });
  
  // Return combined unsubscribe function
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

/**
 * Subscribe to search in specific category
 * @param {string} category - Category to search
 * @param {string} searchTerm - Search query
 * @param {function} callback - Callback for results
 * @returns {function} - Unsubscribe function
 */
function subscribeToSearchCategory(category, searchTerm, callback) {
  const collectionRef = collection(db, category);
  
  // TODO: Implement real-time search query
  let searchQuery;
  
  switch (category) {
    case SEARCH_CONFIG.CATEGORIES.MESSAGES:
      searchQuery = query(
        collectionRef,
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      break;
      
    default:
      // Return empty unsubscribe for unimplemented categories
      callback([]);
      return () => {};
  }
  
  return onSnapshot(searchQuery, (snapshot) => {
    const results = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (matchesSearchTerm(data, searchTerm, category)) {
        results.push({
          id: doc.id,
          ...data,
          _highlighted: highlightSearchTerm(data, searchTerm, category)
        });
      }
    });
    callback(results);
  });
}

/**
 * Log search analytics
 * @param {string} searchTerm - Search query
 * @param {number} resultsCount - Number of results
 * @param {Array} categories - Searched categories
 */
async function logSearchAnalytics(searchTerm, resultsCount, categories) {
  try {
    await addDoc(collection(db, 'searchAnalytics'), {
      query: searchTerm,
      resultsCount,
      categories,
      timestamp: serverTimestamp(),
      // TODO: Add user ID when available
    });
  } catch (error) {
    console.error('Error logging search analytics:', error);
  }
}

/**
 * Get search suggestions based on popular queries
 * @param {string} partial - Partial search term
 * @returns {Promise<Array>} - Search suggestions
 */
export async function getSearchSuggestions(partial) {
  if (!partial || partial.length < 2) {
    return [];
  }
  
  try {
    // TODO: Implement suggestions based on search analytics
    // For now, return static suggestions
    const suggestions = [
      'recent messages',
      'shared files',
      'group discussions',
      'user profiles'
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(partial.toLowerCase())
    );
    
    return suggestions;
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}
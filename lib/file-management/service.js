/**
 * File Management Service
 * Handles file operations, storage, versioning, and organization
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { db, storage } from '../firebase';

/**
 * Upload a file to Firebase Storage and create database record
 * @param {Object} options - Upload options
 * @param {File} options.file - File to upload
 * @param {string} options.userId - User ID
 * @param {string} options.groupId - Optional group ID
 * @param {string} options.folderId - Optional parent folder ID
 * @param {function} options.onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export async function uploadFile({ file, userId, groupId = null, folderId = null, onProgress }) {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const path = groupId 
      ? `groups/${groupId}/files/${filename}`
      : `users/${userId}/files/${filename}`;

    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Upload file with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress updates
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            // Upload completed, get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Create database record
            const fileRecord = {
              name: file.name,
              originalName: file.name,
              size: file.size,
              type: file.type,
              url: downloadURL,
              storagePath: path,
              userId,
              groupId,
              folderId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              version: 1,
              isPublic: false,
              sharedWith: [],
              tags: [],
              description: '',
              metadata: {
                originalFilename: file.name,
                uploadedBy: userId,
                fileExtension: file.name.split('.').pop()?.toLowerCase(),
                mimeType: file.type
              }
            };

            const docRef = await addDoc(collection(db, 'files'), fileRecord);
            
            resolve({
              id: docRef.id,
              ...fileRecord,
              downloadURL
            });
          } catch (error) {
            console.error('Failed to create file record:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Upload initialization failed:', error);
    throw error;
  }
}

/**
 * Get files and folders for a user or group
 * @param {Object} options - Query options
 * @param {string} options.userId - User ID
 * @param {string} options.groupId - Optional group ID
 * @param {string} options.folderId - Optional parent folder ID
 * @returns {Promise<Object>} Files and folders data
 */
export async function getFiles({ userId, groupId = null, folderId = null }) {
  try {
    // Query files
    let filesQuery = collection(db, 'files');
    
    const constraints = [
      orderBy('createdAt', 'desc')
    ];

    // Add ownership filters
    if (groupId) {
      constraints.unshift(where('groupId', '==', groupId));
    } else {
      constraints.unshift(where('userId', '==', userId));
    }

    // Add folder filter
    if (folderId) {
      constraints.unshift(where('folderId', '==', folderId));
    } else {
      constraints.unshift(where('folderId', '==', null));
    }

    filesQuery = query(filesQuery, ...constraints);
    const filesSnapshot = await getDocs(filesQuery);
    
    const files = filesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Query folders
    let foldersQuery = collection(db, 'folders');
    
    const folderConstraints = [
      orderBy('createdAt', 'desc')
    ];

    if (groupId) {
      folderConstraints.unshift(where('groupId', '==', groupId));
    } else {
      folderConstraints.unshift(where('userId', '==', userId));
    }

    if (folderId) {
      folderConstraints.unshift(where('parentId', '==', folderId));
    } else {
      folderConstraints.unshift(where('parentId', '==', null));
    }

    foldersQuery = query(foldersQuery, ...folderConstraints);
    const foldersSnapshot = await getDocs(foldersQuery);
    
    const folders = foldersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    return { files, folders };
  } catch (error) {
    console.error('Failed to get files:', error);
    throw error;
  }
}

/**
 * Create a new folder
 * @param {Object} options - Folder options
 * @param {string} options.name - Folder name
 * @param {string} options.userId - User ID
 * @param {string} options.groupId - Optional group ID
 * @param {string} options.parentId - Optional parent folder ID
 * @returns {Promise<Object>} Created folder
 */
export async function createFolder({ name, userId, groupId = null, parentId = null }) {
  try {
    const folderData = {
      name,
      userId,
      groupId,
      parentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      itemCount: 0,
      description: '',
      color: '#3b82f6', // Default blue color
      isPublic: false,
      sharedWith: []
    };

    const docRef = await addDoc(collection(db, 'folders'), folderData);
    
    return {
      id: docRef.id,
      ...folderData
    };
  } catch (error) {
    console.error('Failed to create folder:', error);
    throw error;
  }
}

/**
 * Delete a file
 * @param {string} fileId - File ID
 * @param {string} userId - User ID (for permission check)
 * @returns {Promise<void>}
 */
export async function deleteFile(fileId, userId) {
  try {
    // Get file document
    const fileDoc = await getDoc(doc(db, 'files', fileId));
    
    if (!fileDoc.exists()) {
      throw new Error('File not found');
    }

    const fileData = fileDoc.data();
    
    // Check permissions
    if (fileData.userId !== userId) {
      throw new Error('Permission denied');
    }

    // Delete from storage
    const storageRef = ref(storage, fileData.storagePath);
    await deleteObject(storageRef);

    // Delete from database
    await deleteDoc(doc(db, 'files', fileId));

    console.log('File deleted successfully');
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw error;
  }
}

/**
 * Search files and folders
 * @param {Object} options - Search options
 * @param {string} options.query - Search query
 * @param {string} options.userId - User ID
 * @param {string} options.groupId - Optional group ID
 * @param {Object} options.filters - Additional filters
 * @returns {Promise<Object>} Search results
 */
export async function searchFiles({ query, userId, groupId = null, filters = {} }) {
  try {
    // TODO: Implement full-text search with Algolia or similar service
    // For now, do basic name matching with Firestore
    
    const searchTerms = query.toLowerCase().split(' ');
    
    // Search files
    let filesQuery = collection(db, 'files');
    const fileConstraints = [
      orderBy('createdAt', 'desc'),
      limit(50) // Limit results
    ];

    if (groupId) {
      fileConstraints.unshift(where('groupId', '==', groupId));
    } else {
      fileConstraints.unshift(where('userId', '==', userId));
    }

    filesQuery = query(filesQuery, ...fileConstraints);
    const filesSnapshot = await getDocs(filesQuery);
    
    // Client-side filtering for search terms
    const files = filesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      .filter(file => {
        const searchText = `${file.name} ${file.description || ''} ${file.tags?.join(' ') || ''}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });

    // Search folders
    let foldersQuery = collection(db, 'folders');
    const folderConstraints = [
      orderBy('createdAt', 'desc'),
      limit(20)
    ];

    if (groupId) {
      folderConstraints.unshift(where('groupId', '==', groupId));
    } else {
      folderConstraints.unshift(where('userId', '==', userId));
    }

    foldersQuery = query(foldersQuery, ...folderConstraints);
    const foldersSnapshot = await getDocs(foldersQuery);
    
    const folders = foldersSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      .filter(folder => {
        const searchText = `${folder.name} ${folder.description || ''}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });

    return { files, folders, total: files.length + folders.length };
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

/**
 * Share a file
 * @param {Object} options - Share options
 * @param {string} options.fileId - File ID
 * @param {string} options.userId - User ID
 * @param {Array} options.permissions - Permissions array
 * @param {string} options.expiresIn - Expiration time
 * @returns {Promise<Object>} Share result
 */
export async function shareFile({ fileId, userId, permissions = ['read'], expiresIn = '7d' }) {
  try {
    const fileRef = doc(db, 'files', fileId);
    const fileDoc = await getDoc(fileRef);
    
    if (!fileDoc.exists()) {
      throw new Error('File not found');
    }

    const fileData = fileDoc.data();
    
    // Check permissions
    if (fileData.userId !== userId) {
      throw new Error('Permission denied');
    }

    // Calculate expiration date
    const expirationMs = {
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const expiresAt = new Date(Date.now() + (expirationMs[expiresIn] || expirationMs['7d']));

    // Generate share token
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create share record
    const shareData = {
      fileId,
      shareToken,
      permissions,
      createdBy: userId,
      createdAt: serverTimestamp(),
      expiresAt,
      isActive: true,
      accessCount: 0,
      lastAccessedAt: null
    };

    const shareRef = await addDoc(collection(db, 'fileShares'), shareData);
    
    // Update file with share info
    await updateDoc(fileRef, {
      isShared: true,
      updatedAt: serverTimestamp()
    });

    const shareUrl = `${window.location.origin}/shared/${shareToken}`;

    return {
      shareId: shareRef.id,
      shareToken,
      shareUrl,
      expiresAt,
      permissions
    };
  } catch (error) {
    console.error('Failed to share file:', error);
    throw error;
  }
}

/**
 * Get file versions
 * @param {string} fileId - File ID
 * @returns {Promise<Array>} File versions
 */
export async function getFileVersions(fileId) {
  try {
    // TODO: Implement file versioning
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error('Failed to get file versions:', error);
    throw error;
  }
}

/**
 * Subscribe to file changes in real-time
 * @param {Object} options - Subscription options
 * @param {string} options.userId - User ID
 * @param {string} options.groupId - Optional group ID
 * @param {string} options.folderId - Optional folder ID
 * @param {function} callback - Callback function
 * @returns {function} Unsubscribe function
 */
export function subscribeToFiles({ userId, groupId = null, folderId = null }, callback) {
  try {
    let filesQuery = collection(db, 'files');
    
    const constraints = [
      orderBy('createdAt', 'desc')
    ];

    if (groupId) {
      constraints.unshift(where('groupId', '==', groupId));
    } else {
      constraints.unshift(where('userId', '==', userId));
    }

    if (folderId) {
      constraints.unshift(where('folderId', '==', folderId));
    } else {
      constraints.unshift(where('folderId', '==', null));
    }

    filesQuery = query(filesQuery, ...constraints);
    
    return onSnapshot(filesQuery, (snapshot) => {
      const files = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      callback({ files });
    });
  } catch (error) {
    console.error('Failed to subscribe to files:', error);
    throw error;
  }
}

/**
 * Get storage usage statistics
 * @param {string} userId - User ID
 * @param {string} groupId - Optional group ID
 * @returns {Promise<Object>} Storage statistics
 */
export async function getStorageStats(userId, groupId = null) {
  try {
    let filesQuery = collection(db, 'files');
    
    if (groupId) {
      filesQuery = query(filesQuery, where('groupId', '==', groupId));
    } else {
      filesQuery = query(filesQuery, where('userId', '==', userId));
    }

    const snapshot = await getDocs(filesQuery);
    
    let totalSize = 0;
    let fileCount = 0;
    const fileTypes = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalSize += data.size || 0;
      fileCount++;
      
      const type = data.type?.split('/')[0] || 'unknown';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
    });

    return {
      totalSize,
      fileCount,
      fileTypes,
      formattedSize: formatBytes(totalSize)
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    throw error;
  }
}

// Utility function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Groups Service for Shadow-Bind
 * Handles group creation, management, and member operations
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment 
} from 'firebase/firestore';

/**
 * Group configuration and constants
 */
export const GROUPS_CONFIG = {
  // Member roles
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    MEMBER: 'member'
  },
  
  // Permissions by role
  PERMISSIONS: {
    owner: [
      'delete_group',
      'manage_settings',
      'manage_members',
      'manage_roles',
      'moderate_content',
      'manage_files',
      'view_analytics'
    ],
    admin: [
      'manage_members',
      'manage_roles',
      'moderate_content',
      'manage_files',
      'view_analytics'
    ],
    moderator: [
      'moderate_content',
      'manage_files'
    ],
    member: [
      'send_messages',
      'upload_files'
    ]
  },
  
  // Group types
  TYPES: {
    PUBLIC: 'public',
    PRIVATE: 'private',
    SECRET: 'secret'
  },
  
  // Group categories
  CATEGORIES: {
    GENERAL: 'general',
    WORK: 'work',
    SOCIAL: 'social',
    HOBBY: 'hobby',
    STUDY: 'study',
    GAMING: 'gaming'
  },
  
  // Limits
  MAX_MEMBERS: 10000,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_FILES_SIZE: 1024 * 1024 * 1024 // 1GB
};

/**
 * Create a new group
 * @param {Object} groupData - Group creation data
 * @param {string} creatorId - ID of the user creating the group
 * @returns {Promise<Object>} - Created group data
 */
export async function createGroup(groupData, creatorId) {
  try {
    const {
      name,
      description = '',
      type = GROUPS_CONFIG.TYPES.PRIVATE,
      category = GROUPS_CONFIG.CATEGORIES.GENERAL,
      avatar = null,
      tags = []
    } = groupData;

    // Validate input
    if (!name || name.length > GROUPS_CONFIG.MAX_NAME_LENGTH) {
      throw new Error('Invalid group name');
    }

    if (description.length > GROUPS_CONFIG.MAX_DESCRIPTION_LENGTH) {
      throw new Error('Description too long');
    }

    // Create group document
    const group = {
      name: name.trim(),
      description: description.trim(),
      type,
      category,
      avatar,
      tags: tags || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerId: creatorId,
      memberCount: 1,
      settings: {
        allowInvites: true,
        allowFileSharing: true,
        allowMediaSharing: true,
        requireApproval: type === GROUPS_CONFIG.TYPES.PRIVATE,
        maxFileSize: 10 * 1024 * 1024, // 10MB default
        allowedFileTypes: ['image', 'document', 'video', 'audio']
      },
      analytics: {
        totalMessages: 0,
        totalFiles: 0,
        activeMembers: 1,
        lastActivity: serverTimestamp()
      }
    };

    const groupRef = await addDoc(collection(db, 'groups'), group);
    
    // Add creator as owner
    await addGroupMember(groupRef.id, creatorId, GROUPS_CONFIG.ROLES.OWNER);
    
    // Create initial analytics entry
    await initializeGroupAnalytics(groupRef.id, creatorId);
    
    return {
      id: groupRef.id,
      ...group
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

/**
 * Get group by ID
 * @param {string} groupId - Group ID
 * @returns {Promise<Object>} - Group data
 */
export async function getGroup(groupId) {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    return {
      id: groupDoc.id,
      ...groupDoc.data()
    };
  } catch (error) {
    console.error('Error getting group:', error);
    throw error;
  }
}

/**
 * Update group settings
 * @param {string} groupId - Group ID
 * @param {Object} updates - Update data
 * @param {string} userId - ID of user making update
 * @returns {Promise<boolean>} - Success status
 */
export async function updateGroup(groupId, updates, userId) {
  try {
    // Check permissions
    const canManage = await hasGroupPermission(groupId, userId, 'manage_settings');
    if (!canManage) {
      throw new Error('Insufficient permissions');
    }
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'groups', groupId), updateData);
    
    // Log activity
    await logGroupActivity(groupId, userId, 'group_updated', { updates });
    
    return true;
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
}

/**
 * Add member to group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID to add
 * @param {string} role - Member role
 * @returns {Promise<boolean>} - Success status
 */
export async function addGroupMember(groupId, userId, role = GROUPS_CONFIG.ROLES.MEMBER) {
  try {
    const memberData = {
      groupId,
      userId,
      role,
      joinedAt: serverTimestamp(),
      isActive: true,
      permissions: GROUPS_CONFIG.PERMISSIONS[role] || []
    };
    
    await addDoc(collection(db, 'groupMembers'), memberData);
    
    // Update group member count
    await updateDoc(doc(db, 'groups', groupId), {
      memberCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logGroupActivity(groupId, userId, 'member_added', { role });
    
    return true;
  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;
  }
}

/**
 * Remove member from group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID to remove
 * @param {string} removedBy - ID of user performing removal
 * @returns {Promise<boolean>} - Success status
 */
export async function removeGroupMember(groupId, userId, removedBy) {
  try {
    // Check permissions
    const canManage = await hasGroupPermission(groupId, removedBy, 'manage_members');
    if (!canManage && removedBy !== userId) {
      throw new Error('Insufficient permissions');
    }
    
    // Find and remove member document
    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', groupId),
      where('userId', '==', userId)
    );
    
    const membersSnapshot = await getDocs(membersQuery);
    
    for (const memberDoc of membersSnapshot.docs) {
      await deleteDoc(memberDoc.ref);
    }
    
    // Update group member count
    await updateDoc(doc(db, 'groups', groupId), {
      memberCount: increment(-1),
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    const actionType = removedBy === userId ? 'member_left' : 'member_removed';
    await logGroupActivity(groupId, removedBy, actionType, { removedUserId: userId });
    
    return true;
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
}

/**
 * Update member role
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {string} newRole - New role
 * @param {string} updatedBy - ID of user making change
 * @returns {Promise<boolean>} - Success status
 */
export async function updateMemberRole(groupId, userId, newRole, updatedBy) {
  try {
    // Check permissions
    const canManageRoles = await hasGroupPermission(groupId, updatedBy, 'manage_roles');
    if (!canManageRoles) {
      throw new Error('Insufficient permissions');
    }
    
    // Find member document
    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', groupId),
      where('userId', '==', userId)
    );
    
    const membersSnapshot = await getDocs(membersQuery);
    
    if (membersSnapshot.empty) {
      throw new Error('Member not found');
    }
    
    // Update role
    const memberDoc = membersSnapshot.docs[0];
    await updateDoc(memberDoc.ref, {
      role: newRole,
      permissions: GROUPS_CONFIG.PERMISSIONS[newRole] || [],
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logGroupActivity(groupId, updatedBy, 'role_updated', { 
      targetUserId: userId, 
      newRole 
    });
    
    return true;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

/**
 * Get group members
 * @param {string} groupId - Group ID
 * @param {number} limitCount - Limit results
 * @returns {Promise<Array>} - Group members
 */
export async function getGroupMembers(groupId, limitCount = 100) {
  try {
    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', groupId),
      where('isActive', '==', true),
      orderBy('joinedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(membersQuery);
    const members = [];
    
    for (const doc of snapshot.docs) {
      const memberData = { id: doc.id, ...doc.data() };
      
      // TODO: Fetch user profile data
      // const userDoc = await getDoc(doc(db, 'users', memberData.userId));
      // memberData.profile = userDoc.exists() ? userDoc.data() : null;
      
      members.push(memberData);
    }
    
    return members;
  } catch (error) {
    console.error('Error getting group members:', error);
    throw error;
  }
}

/**
 * Check if user has specific permission in group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} - Has permission
 */
export async function hasGroupPermission(groupId, userId, permission) {
  try {
    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', groupId),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(membersQuery);
    
    if (snapshot.empty) {
      return false;
    }
    
    const member = snapshot.docs[0].data();
    return member.permissions?.includes(permission) || false;
  } catch (error) {
    console.error('Error checking group permission:', error);
    return false;
  }
}

/**
 * Search and discover groups
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Array>} - Found groups
 */
export async function searchGroups(searchParams) {
  try {
    const {
      query: searchQuery = '',
      category = '',
      type = '',
      tags = [],
      limit: limitCount = 20
    } = searchParams;
    
    let groupsQuery = collection(db, 'groups');
    const constraints = [];
    
    // Filter by category
    if (category) {
      constraints.push(where('category', '==', category));
    }
    
    // Filter by type (only show public groups in discovery unless user is member)
    if (type) {
      constraints.push(where('type', '==', type));
    } else {
      constraints.push(where('type', '==', GROUPS_CONFIG.TYPES.PUBLIC));
    }
    
    // TODO: Implement full-text search
    // For now, use simple ordering
    constraints.push(orderBy('memberCount', 'desc'));
    constraints.push(limit(limitCount));
    
    if (constraints.length > 0) {
      groupsQuery = query(groupsQuery, ...constraints);
    }
    
    const snapshot = await getDocs(groupsQuery);
    const groups = [];
    
    snapshot.forEach((doc) => {
      const groupData = { id: doc.id, ...doc.data() };
      
      // Simple text search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesName = groupData.name?.toLowerCase().includes(searchLower);
        const matchesDescription = groupData.description?.toLowerCase().includes(searchLower);
        const matchesTags = groupData.tags?.some(tag => 
          tag.toLowerCase().includes(searchLower)
        );
        
        if (matchesName || matchesDescription || matchesTags) {
          groups.push(groupData);
        }
      } else {
        groups.push(groupData);
      }
    });
    
    return groups;
  } catch (error) {
    console.error('Error searching groups:', error);
    throw error;
  }
}

/**
 * Get user's groups
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - User's groups
 */
export async function getUserGroups(userId) {
  try {
    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(membersQuery);
    const userGroups = [];
    
    for (const doc of snapshot.docs) {
      const memberData = doc.data();
      
      // Get group data
      const groupDoc = await getDoc(doc(db, 'groups', memberData.groupId));
      if (groupDoc.exists()) {
        userGroups.push({
          id: groupDoc.id,
          ...groupDoc.data(),
          memberRole: memberData.role,
          joinedAt: memberData.joinedAt
        });
      }
    }
    
    // Sort by last activity
    userGroups.sort((a, b) => {
      const timeA = a.analytics?.lastActivity?.toDate?.() || new Date(0);
      const timeB = b.analytics?.lastActivity?.toDate?.() || new Date(0);
      return timeB - timeA;
    });
    
    return userGroups;
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
}

/**
 * Initialize group analytics
 * @param {string} groupId - Group ID
 * @param {string} creatorId - Creator ID
 * @returns {Promise<boolean>} - Success status
 */
async function initializeGroupAnalytics(groupId, creatorId) {
  try {
    await addDoc(collection(db, 'groupAnalytics'), {
      groupId,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      metrics: {
        messagesCount: 0,
        filesCount: 0,
        activeUsers: 1,
        newMembers: 1
      },
      createdAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing group analytics:', error);
    return false;
  }
}

/**
 * Log group activity
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {string} action - Action type
 * @param {Object} metadata - Additional data
 * @returns {Promise<boolean>} - Success status
 */
async function logGroupActivity(groupId, userId, action, metadata = {}) {
  try {
    await addDoc(collection(db, 'groupActivity'), {
      groupId,
      userId,
      action,
      metadata,
      timestamp: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error logging group activity:', error);
    return false;
  }
}

/**
 * Subscribe to group updates
 * @param {string} groupId - Group ID
 * @param {function} callback - Update callback
 * @returns {function} - Unsubscribe function
 */
export function subscribeToGroup(groupId, callback) {
  return onSnapshot(doc(db, 'groups', groupId), (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to group members updates
 * @param {string} groupId - Group ID
 * @param {function} callback - Update callback
 * @returns {function} - Unsubscribe function
 */
export function subscribeToGroupMembers(groupId, callback) {
  const membersQuery = query(
    collection(db, 'groupMembers'),
    where('groupId', '==', groupId),
    where('isActive', '==', true),
    orderBy('joinedAt', 'desc')
  );
  
  return onSnapshot(membersQuery, (snapshot) => {
    const members = [];
    snapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
    callback(members);
  });
}
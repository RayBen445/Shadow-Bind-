import { useState, useEffect } from 'react';
import { auth, db, isConfigured } from '../lib/firebase';
import { 
  collection, 
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where,
  orderBy, 
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

/**
 * Group Chat Component
 * 
 * TODO: Complete implementation
 * - Add group creation wizard with settings
 * - Implement group member permissions and roles
 * - Add group settings and customization
 * - Implement group file sharing and media gallery
 * - Add group search and discovery
 * - Implement group templates and categories
 * - Add group analytics and insights
 * - Implement group archiving and deletion
 * - Add group export and backup features
 * - Implement group compliance and moderation tools
 */

export default function GroupChat() {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    category: 'general'
  });

  // Load user's groups
  useEffect(() => {
    if (!isConfigured || !auth.currentUser) {
      setLoading(false);
      return;
    }

    // TODO: Implement proper Firestore security rules for groups
    // Suggested Firestore structure:
    // /groups/{groupId}
    // {
    //   name: string,
    //   description: string,
    //   createdBy: userId,
    //   createdAt: timestamp,
    //   updatedAt: timestamp,
    //   isPrivate: boolean,
    //   category: string,
    //   avatar: string,
    //   settings: {
    //     allowFileSharing: boolean,
    //     requireApproval: boolean,
    //     muteNewMembers: boolean,
    //     allowInvites: boolean,
    //     maxMembers: number,
    //     autoDeleteMessages: boolean,
    //     encryptionEnabled: boolean
    //   },
    //   members: {
    //     [userId]: {
    //       role: 'owner' | 'admin' | 'moderator' | 'member',
    //       joinedAt: timestamp,
    //       lastActive: timestamp,
    //       permissions: array,
    //       isMuted: boolean,
    //       customTitle: string
    //     }
    //   },
    //   stats: {
    //     memberCount: number,
    //     messageCount: number,
    //     createdToday: number,
    //     lastActivity: timestamp
    //   },
    //   inviteCode: string, // for public groups
    //   tags: array of strings
    // }

    const userId = auth.currentUser.uid;
    const groupsRef = collection(db, 'groups');
    const q = query(
      groupsRef, 
      where(`members.${userId}`, '!=', null),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading groups:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser || !newGroupForm.name.trim()) return;
    
    setCreating(true);
    
    try {
      const groupData = {
        name: newGroupForm.name.trim(),
        description: newGroupForm.description.trim(),
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPrivate: newGroupForm.isPrivate,
        category: newGroupForm.category,
        avatar: '', // TODO: Add avatar upload
        settings: {
          allowFileSharing: true,
          requireApproval: newGroupForm.isPrivate,
          muteNewMembers: false,
          allowInvites: true,
          maxMembers: 100,
          autoDeleteMessages: false,
          encryptionEnabled: false // TODO: Implement group encryption
        },
        members: {
          [auth.currentUser.uid]: {
            role: 'owner',
            joinedAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            permissions: ['all'],
            isMuted: false,
            customTitle: 'Group Creator'
          }
        },
        stats: {
          memberCount: 1,
          messageCount: 0,
          createdToday: 0,
          lastActivity: serverTimestamp()
        },
        inviteCode: newGroupForm.isPrivate ? '' : generateInviteCode(),
        tags: []
      };
      
      const docRef = await addDoc(collection(db, 'groups'), groupData);
      
      // Reset form
      setNewGroupForm({
        name: '',
        description: '',
        isPrivate: false,
        category: 'general'
      });
      setShowCreateForm(false);
      
      // Set as active group
      setActiveGroup({ id: docRef.id, ...groupData });
      
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
    
    setCreating(false);
  };

  const handleJoinGroup = async (inviteCode) => {
    // TODO: Implement group joining via invite code
    console.log('TODO: Implement group join functionality for code:', inviteCode);
  };

  const handleLeaveGroup = async (groupId) => {
    if (!auth.currentUser) return;
    
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        [`members.${auth.currentUser.uid}`]: null,
        updatedAt: serverTimestamp()
      });
      
      // TODO: Handle cleanup if user was the last member
      
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group. Please try again.');
    }
  };

  const handleUpdateGroupSettings = async (groupId, settings) => {
    // TODO: Implement group settings update
    console.log('TODO: Update group settings for', groupId, settings);
  };

  const generateInviteCode = () => {
    // TODO: Generate secure, unique invite codes
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const getUserRole = (group) => {
    if (!auth.currentUser || !group.members) return 'none';
    const member = group.members[auth.currentUser.uid];
    return member ? member.role : 'none';
  };

  const canManageGroup = (group) => {
    const role = getUserRole(group);
    return ['owner', 'admin'].includes(role);
  };

  if (!isConfigured) {
    return (
      <div className="group-chat-container">
        <p>Group chat is not available. Please configure Firebase.</p>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="group-chat-container">
        <p>Please sign in to use group chat.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="group-chat-container">
        <p>Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="group-chat-container">
      <div className="group-sidebar">
        <div className="group-header">
          <h3>👥 Group Chats</h3>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary btn-small"
          >
            ➕ Create
          </button>
        </div>
        
        <div className="group-list">
          {groups.length === 0 ? (
            <div className="no-groups">
              <p>No groups yet. Create your first group!</p>
            </div>
          ) : (
            groups.map(group => (
              <div 
                key={group.id}
                className={`group-item ${activeGroup?.id === group.id ? 'active' : ''}`}
                onClick={() => setActiveGroup(group)}
              >
                <div className="group-avatar">
                  {group.avatar ? (
                    <img src={group.avatar} alt={group.name} />
                  ) : (
                    <div className="group-placeholder">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="group-info">
                  <h4>{group.name}</h4>
                  <p>{group.stats?.memberCount || 0} members</p>
                  <span className="group-role">{getUserRole(group)}</span>
                </div>
                {group.isPrivate && (
                  <div className="privacy-indicator">🔒</div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* TODO: Add group search and discovery */}
        <div className="group-actions">
          <button className="btn btn-outline btn-small">
            🔍 Discover Groups
          </button>
        </div>
      </div>
      
      <div className="group-main">
        {activeGroup ? (
          <div className="group-content">
            <div className="group-header">
              <div className="group-title">
                <h2>{activeGroup.name}</h2>
                <p>{activeGroup.description}</p>
                <div className="group-meta">
                  <span>{activeGroup.stats?.memberCount || 0} members</span>
                  <span>•</span>
                  <span>{activeGroup.category}</span>
                  {activeGroup.isPrivate && <span>• Private</span>}
                </div>
              </div>
              <div className="group-actions">
                {canManageGroup(activeGroup) && (
                  <button className="btn btn-outline btn-small">
                    ⚙️ Settings
                  </button>
                )}
                <button 
                  onClick={() => handleLeaveGroup(activeGroup.id)}
                  className="btn btn-danger btn-small"
                >
                  🚪 Leave
                </button>
              </div>
            </div>
            
            {/* TODO: Integrate with Chat component for group messages */}
            <div className="group-chat-area">
              <p>TODO: Integrate group chat messages here</p>
              <p>Group ID: {activeGroup.id}</p>
              {/* This would use the Chat component with groupId */}
            </div>
            
            {/* TODO: Add member list, file sharing, group settings */}
          </div>
        ) : (
          <div className="no-group-selected">
            <p>Select a group to start chatting</p>
          </div>
        )}
      </div>
      
      {/* Create Group Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Group</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="close-button"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="modal-body">
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  value={newGroupForm.name}
                  onChange={(e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newGroupForm.description}
                  onChange={(e) => setNewGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this group about?"
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newGroupForm.category}
                  onChange={(e) => setNewGroupForm(prev => ({ ...prev, category: e.target.value }))}
                  className="form-select"
                >
                  <option value="general">General</option>
                  <option value="work">Work</option>
                  <option value="friends">Friends</option>
                  <option value="family">Family</option>
                  <option value="hobbies">Hobbies</option>
                  <option value="study">Study</option>
                  <option value="gaming">Gaming</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newGroupForm.isPrivate}
                    onChange={(e) => setNewGroupForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  />
                  <span>Private Group (invite only)</span>
                </label>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                >
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
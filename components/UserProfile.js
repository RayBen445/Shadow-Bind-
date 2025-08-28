import { useState, useEffect } from 'react';
import { auth, db, storage, isConfigured } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';

/**
 * User Profile Component
 * 
 * TODO: Complete implementation
 * - Add profile image cropping and resizing
 * - Implement privacy settings (who can see profile)
 * - Add bio/about section with rich text editor
 * - Implement social media links
 * - Add profile themes and customization
 * - Implement user badges and achievements
 * - Add contact preferences and settings
 * - Implement profile verification system
 * - Add activity status and last seen
 * - Implement profile sharing and QR codes
 */

export default function UserProfile({ userId, isOwnProfile = false }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    phoneNumber: '',
    preferences: {
      publicProfile: true,
      showEmail: false,
      showPhone: false,
      allowMessages: true,
      theme: 'light'
    }
  });

  // Load user profile
  useEffect(() => {
    if (!userId || !isConfigured) return;

    const loadProfile = async () => {
      try {
        // TODO: Implement proper Firestore security rules
        // Suggested Firestore structure:
        // /users/{userId}/profile
        // {
        //   displayName: string,
        //   email: string,
        //   photoURL: string,
        //   bio: string,
        //   location: string,
        //   website: string,
        //   phoneNumber: string,
        //   createdAt: timestamp,
        //   lastActive: timestamp,
        //   isOnline: boolean,
        //   preferences: {
        //     publicProfile: boolean,
        //     showEmail: boolean,
        //     showPhone: boolean,
        //     allowMessages: boolean,
        //     theme: 'light' | 'dark' | 'auto',
        //     notifications: {
        //       email: boolean,
        //       push: boolean,
        //       sound: boolean
        //     }
        //   },
        //   stats: {
        //     messagesSent: number,
        //     joinedChats: number,
        //     filesShared: number
        //   },
        //   badges: array of badge objects,
        //   socialLinks: {
        //     twitter: string,
        //     linkedin: string,
        //     github: string
        //   }
        // }

        const docRef = doc(db, 'users', userId, 'profile', 'data');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setFormData({
            displayName: data.displayName || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
            phoneNumber: data.phoneNumber || '',
            preferences: {
              ...formData.preferences,
              ...data.preferences
            }
          });
        } else if (isOwnProfile) {
          // Create default profile for current user
          const defaultProfile = {
            displayName: auth.currentUser?.displayName || '',
            email: auth.currentUser?.email || '',
            photoURL: auth.currentUser?.photoURL || '',
            bio: '',
            createdAt: new Date(),
            preferences: formData.preferences
          };
          
          await setDoc(docRef, defaultProfile);
          setProfile(defaultProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, isConfigured, isOwnProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isOwnProfile || !auth.currentUser) return;

    // Validate image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Image must be less than 2MB');
      return;
    }

    setUploadingImage(true);

    try {
      // TODO: Add image compression and resizing
      const imageRef = ref(storage, `profile-images/${auth.currentUser.uid}`);
      const uploadTask = uploadBytesResumable(imageRef, file);
      
      uploadTask.on('state_changed', 
        null, 
        (error) => {
          console.error('Image upload error:', error);
          alert('Failed to upload image');
          setUploadingImage(false);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update profile with new photo URL
            const docRef = doc(db, 'users', userId, 'profile', 'data');
            await updateDoc(docRef, {
              photoURL: downloadURL,
              updatedAt: new Date()
            });
            
            setProfile(prev => ({ ...prev, photoURL: downloadURL }));
            setUploadingImage(false);
          } catch (error) {
            console.error('Error updating profile image:', error);
            setUploadingImage(false);
          }
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingImage(false);
    }
  };

  const saveProfile = async () => {
    if (!isOwnProfile || !auth.currentUser) return;
    
    setSaving(true);
    
    try {
      const docRef = doc(db, 'users', userId, 'profile', 'data');
      const updateData = {
        ...formData,
        updatedAt: new Date()
      };
      
      await updateDoc(docRef, updateData);
      setProfile(prev => ({ ...prev, ...updateData }));
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
    
    setSaving(false);
  };

  if (!isConfigured) {
    return (
      <div className="profile-container">
        <p>Profile is not available. Please configure Firebase.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile && !isOwnProfile) {
    return (
      <div className="profile-container">
        <p>Profile not found or not public.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image-section">
          <div className="profile-image">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" />
            ) : (
              <div className="profile-placeholder">
                👤
              </div>
            )}
            {uploadingImage && <div className="upload-overlay">⏳</div>}
          </div>
          
          {isOwnProfile && (
            <div className="image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{ display: 'none' }}
                id="profile-image-upload"
              />
              <label htmlFor="profile-image-upload" className="upload-button">
                📷 Change Photo
              </label>
            </div>
          )}
        </div>
        
        <div className="profile-info">
          {editing ? (
            <div className="profile-edit-form">
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Display Name"
                className="form-input"
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Bio / About"
                className="form-textarea"
                rows="3"
              />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Location"
                className="form-input"
              />
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Website"
                className="form-input"
              />
            </div>
          ) : (
            <div className="profile-display">
              <h2>{profile?.displayName || 'No Name'}</h2>
              <p className="profile-email">{profile?.email}</p>
              {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
              {profile?.location && <p className="profile-location">📍 {profile.location}</p>}
              {profile?.website && (
                <p className="profile-website">
                  🔗 <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    {profile.website}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isOwnProfile && (
        <div className="profile-actions">
          {editing ? (
            <div className="edit-actions">
              <button onClick={saveProfile} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="btn btn-primary">
              Edit Profile
            </button>
          )}
        </div>
      )}
      
      {/* TODO: Add settings section, privacy controls, activity history */}
      {isOwnProfile && editing && (
        <div className="profile-settings">
          <h3>Privacy Settings</h3>
          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={formData.preferences.publicProfile}
                onChange={(e) => handlePreferenceChange('publicProfile', e.target.checked)}
              />
              Public Profile
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.preferences.showEmail}
                onChange={(e) => handlePreferenceChange('showEmail', e.target.checked)}
              />
              Show Email
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.preferences.allowMessages}
                onChange={(e) => handlePreferenceChange('allowMessages', e.target.checked)}
              />
              Allow Messages
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
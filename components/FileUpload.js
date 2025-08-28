import { useState, useRef } from 'react';
import { auth, storage, isConfigured } from '../lib/firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';

/**
 * File Upload Component
 * 
 * TODO: Complete implementation
 * - Add drag & drop functionality
 * - Implement file type validation and restrictions
 * - Add image preview and compression
 * - Implement multiple file uploads
 * - Add upload progress cancellation
 * - Implement file organization (folders/categories)
 * - Add metadata handling (alt text, descriptions)
 * - Implement virus scanning integration
 * - Add file versioning support
 * - Implement access controls and sharing
 */

export default function FileUpload({ onFileUploaded, allowedTypes = null, maxSize = 10 * 1024 * 1024 }) { // 10MB default
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Default allowed file types if not specified
  const defaultAllowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
  const allowedFileTypes = allowedTypes || defaultAllowedTypes;

  const validateFile = (file) => {
    // File size validation
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
    }

    // File type validation
    if (!allowedFileTypes.includes(file.type)) {
      return `File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (!isConfigured || !auth.currentUser) {
      setError('Please sign in to upload files');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // TODO: Implement proper file organization structure
      // Suggested Firebase Storage structure:
      // /users/{userId}/uploads/{timestamp}_{filename}
      // or
      // /uploads/{chatId}/{messageId}/{filename}
      // or
      // /uploads/public/{category}/{timestamp}_{filename}

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `uploads/${auth.currentUser.uid}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error('Upload error:', error);
          setError('Upload failed. Please try again.');
          setUploading(false);
        }, 
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // TODO: Save file metadata to Firestore
            // Suggested Firestore structure for file metadata:
            // /files/{fileId}
            // {
            //   fileName: string,
            //   originalName: string,
            //   fileType: string,
            //   fileSize: number,
            //   downloadURL: string,
            //   uploadedBy: userId,
            //   uploadedAt: timestamp,
            //   tags: array,
            //   isPublic: boolean,
            //   accessList: array of userIds,
            //   category: string,
            //   description: string
            // }

            const fileMetadata = {
              fileName,
              originalName: file.name,
              fileType: file.type,
              fileSize: file.size,
              downloadURL,
              uploadedBy: auth.currentUser.uid,
              uploadedAt: new Date(),
            };

            // Call the callback with file info
            if (onFileUploaded) {
              onFileUploaded(fileMetadata);
            }

            setUploading(false);
            setUploadProgress(0);
            
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }

          } catch (error) {
            console.error('Error getting download URL:', error);
            setError('Failed to process uploaded file');
            setUploading(false);
          }
        }
      );

    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="upload-container">
        <p>File upload is not available. Please configure Firebase Storage.</p>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="upload-container">
        <p>Please sign in to upload files.</p>
      </div>
    );
  }

  return (
    <div className="upload-container">
      <div className="upload-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={allowedFileTypes.join(',')}
          disabled={uploading}
          className="upload-input"
        />
        
        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Uploading... {uploadProgress}%</p>
            {/* TODO: Add cancel upload button */}
          </div>
        ) : (
          <div className="upload-prompt">
            <p>📁 Select file to upload</p>
            <p className="upload-info">
              Max size: {Math.round(maxSize / (1024 * 1024))}MB
              <br />
              Allowed types: {allowedFileTypes.map(type => type.split('/')[1]).join(', ')}
            </p>
            {/* TODO: Add drag & drop zone styling */}
          </div>
        )}
        
        {error && (
          <div className="upload-error">
            <p>❌ {error}</p>
          </div>
        )}
      </div>
      
      {/* TODO: Add recently uploaded files list */}
      {/* TODO: Add upload history and management */}
    </div>
  );
}
/**
 * File Management Component
 * Provides advanced file storage, versioning, and organization capabilities
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  uploadFile, 
  getFiles, 
  deleteFile, 
  createFolder, 
  getFileVersions,
  shareFile,
  searchFiles
} from '../../lib/file-management/service';

export default function FileManager({ userId, groupId = null }) {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, tree
  const [uploadProgress, setUploadProgress] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadFiles();
  }, [currentFolder, userId, groupId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const filesData = await getFiles({
        userId,
        groupId,
        folderId: currentFolder?.id
      });
      setFiles(filesData.files || []);
      setFolders(filesData.folders || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const fileList = event.target.files;
    if (!fileList.length) return;

    for (let file of fileList) {
      try {
        setUploadProgress({ name: file.name, progress: 0 });
        
        const uploadResult = await uploadFile({
          file,
          userId,
          groupId,
          folderId: currentFolder?.id,
          onProgress: (progress) => {
            setUploadProgress({ name: file.name, progress });
          }
        });
        
        console.log('File uploaded:', uploadResult);
        await loadFiles(); // Refresh file list
        
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    
    setUploadProgress(null);
    event.target.value = ''; // Reset input
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName?.trim()) return;

    try {
      await createFolder({
        name: folderName.trim(),
        userId,
        groupId,
        parentId: currentFolder?.id
      });
      await loadFiles();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder: ' + error.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedFiles.length) return;
    
    if (!confirm(`Delete ${selectedFiles.length} selected item(s)?`)) return;

    try {
      for (let fileId of selectedFiles) {
        await deleteFile(fileId, userId);
      }
      setSelectedFiles([]);
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete files:', error);
      alert('Failed to delete files: ' + error.message);
    }
  };

  const handleFileShare = async (file) => {
    try {
      const shareResult = await shareFile({
        fileId: file.id,
        userId,
        permissions: ['read'], // TODO: Add permission selection UI
        expiresIn: '7d'
      });
      
      // Copy share link to clipboard
      await navigator.clipboard.writeText(shareResult.shareUrl);
      alert('Share link copied to clipboard!');
      
    } catch (error) {
      console.error('Failed to share file:', error);
      alert('Failed to share file: ' + error.message);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadFiles();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await searchFiles({
        query: searchQuery,
        userId,
        groupId,
        filters: {
          // TODO: Add filter options
        }
      });
      
      setFiles(searchResults.files || []);
      setFolders(searchResults.folders || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('document') || type.includes('word')) return '📝';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    return '📄';
  };

  return (
    <div className="file-manager">
      {/* Header */}
      <div className="file-manager-header">
        <div className="breadcrumb">
          <button 
            onClick={() => setCurrentFolder(null)}
            className={!currentFolder ? 'active' : ''}
          >
            🏠 Home
          </button>
          {currentFolder && (
            <span> / {currentFolder.name}</span>
          )}
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>🔍</button>
        </div>

        <div className="view-controls">
          <button 
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'active' : ''}
          >
            ⊞
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'active' : ''}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="file-manager-toolbar">
        <label className="upload-btn">
          📁 Upload Files
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        
        <button onClick={handleCreateFolder}>
          📂 New Folder
        </button>
        
        {selectedFiles.length > 0 && (
          <button onClick={handleDeleteSelected} className="danger">
            🗑️ Delete ({selectedFiles.length})
          </button>
        )}
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="upload-progress">
          <div className="progress-info">
            Uploading: {uploadProgress.name}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`file-manager-content ${viewMode}`}>
        {loading ? (
          <div className="loading">Loading files...</div>
        ) : (
          <>
            {/* Folders */}
            {folders.map(folder => (
              <div 
                key={folder.id} 
                className="file-item folder"
                onDoubleClick={() => setCurrentFolder(folder)}
              >
                <div className="file-icon">📁</div>
                <div className="file-name">{folder.name}</div>
                <div className="file-info">
                  {folder.itemCount || 0} items
                </div>
              </div>
            ))}

            {/* Files */}
            {files.map(file => (
              <div 
                key={file.id} 
                className={`file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                onClick={() => {
                  if (selectedFiles.includes(file.id)) {
                    setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                  } else {
                    setSelectedFiles([...selectedFiles, file.id]);
                  }
                }}
              >
                <div className="file-icon">
                  {getFileIcon(file.type)}
                </div>
                <div className="file-name" title={file.name}>
                  {file.name}
                </div>
                <div className="file-info">
                  <div>{formatFileSize(file.size)}</div>
                  <div>{new Date(file.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="file-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileShare(file);
                    }}
                    title="Share file"
                  >
                    🔗
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, '_blank');
                    }}
                    title="Download"
                  >
                    ⬇️
                  </button>
                </div>
              </div>
            ))}

            {files.length === 0 && folders.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p>No files or folders found</p>
                <p>Upload some files to get started!</p>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .file-manager {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
          height: 600px;
          display: flex;
          flex-direction: column;
        }

        .file-manager-header {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          gap: 16px;
          background: #f9fafb;
        }

        .breadcrumb button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .breadcrumb button.active {
          background: #3b82f6;
          color: white;
        }

        .search-bar {
          display: flex;
          flex: 1;
          max-width: 400px;
        }

        .search-bar input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px 0 0 6px;
          outline: none;
        }

        .search-bar button {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-left: none;
          border-radius: 0 6px 6px 0;
          background: #f3f4f6;
          cursor: pointer;
        }

        .view-controls button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          cursor: pointer;
        }

        .view-controls button.active {
          background: #3b82f6;
          color: white;
        }

        .file-manager-toolbar {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #fafafa;
        }

        .upload-btn {
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
        }

        .file-manager-toolbar button {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .file-manager-toolbar button.danger {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .upload-progress {
          padding: 12px 16px;
          background: #f0f9ff;
          border-bottom: 1px solid #e5e7eb;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-top: 8px;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .file-manager-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .file-manager-content.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }

        .file-manager-content.list .file-item {
          display: flex;
          align-items: center;
          padding: 8px;
          margin-bottom: 4px;
          border-radius: 4px;
        }

        .file-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .file-item:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .file-item.selected {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .file-item.folder {
          background: #fef3c7;
        }

        .file-icon {
          font-size: 24px;
          text-align: center;
          margin-bottom: 8px;
        }

        .file-name {
          font-weight: 500;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-info {
          font-size: 12px;
          color: #6b7280;
        }

        .file-actions {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }

        .file-actions button {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .file-manager-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .file-manager-content.grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
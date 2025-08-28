/**
 * Media Processing Component
 * Provides image/video editing, compression, and format conversion
 */

import { useState, useRef } from 'react';
import { 
  compressImage, 
  resizeImage, 
  convertFormat, 
  applyFilter,
  extractVideoThumbnail,
  compressVideo
} from '../../lib/media-processing/service';

export default function MediaProcessor({ onProcessed }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processedFile, setProcessedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState({
    quality: 0.8,
    width: null,
    height: null,
    format: 'original',
    filter: 'none'
  });
  const fileInputRef = useRef();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setProcessedFile(null);
      
      // Auto-detect optimal settings
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          setSettings(prev => ({
            ...prev,
            width: img.width,
            height: img.height,
            format: file.type.split('/')[1]
          }));
        };
        img.src = URL.createObjectURL(file);
      }
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    try {
      setProcessing(true);
      setProgress(0);

      let result;
      
      if (selectedFile.type.startsWith('image/')) {
        result = await processImage();
      } else if (selectedFile.type.startsWith('video/')) {
        result = await processVideo();
      } else if (selectedFile.type.startsWith('audio/')) {
        result = await processAudio();
      } else {
        throw new Error('Unsupported file type');
      }

      setProcessedFile(result);
      if (onProcessed) onProcessed(result);
      
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Processing failed: ' + error.message);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const processImage = async () => {
    const steps = [];
    
    // Resize if dimensions changed
    if (settings.width || settings.height) {
      steps.push({
        name: 'Resizing',
        action: () => resizeImage(selectedFile, settings.width, settings.height)
      });
    }

    // Apply filter
    if (settings.filter !== 'none') {
      steps.push({
        name: 'Applying filter',
        action: (file) => applyFilter(file, settings.filter)
      });
    }

    // Convert format
    if (settings.format !== 'original') {
      steps.push({
        name: 'Converting format',
        action: (file) => convertFormat(file, settings.format)
      });
    }

    // Compress
    steps.push({
      name: 'Compressing',
      action: (file) => compressImage(file, settings.quality)
    });

    let currentFile = selectedFile;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setProgress(((i + 1) / steps.length) * 100);
      currentFile = await step.action(currentFile);
    }

    return currentFile;
  };

  const processVideo = async () => {
    // TODO: Implement video processing
    throw new Error('Video processing not yet implemented');
  };

  const processAudio = async () => {
    // TODO: Implement audio processing  
    throw new Error('Audio processing not yet implemented');
  };

  const downloadProcessed = () => {
    if (!processedFile) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${selectedFile.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileSizeReduction = () => {
    if (!selectedFile || !processedFile) return null;
    
    const reduction = ((selectedFile.size - processedFile.size) / selectedFile.size) * 100;
    return Math.round(reduction);
  };

  return (
    <div className="media-processor">
      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={() => fileInputRef.current.click()}
          className="upload-btn"
        >
          📁 Select Media File
        </button>
        
        {selectedFile && (
          <div className="file-info">
            <p><strong>File:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="settings-section">
          <h3>Processing Settings</h3>
          
          {selectedFile.type.startsWith('image/') && (
            <div className="image-settings">
              <div className="setting-group">
                <label>Quality:</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.quality}
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                />
                <span>{Math.round(settings.quality * 100)}%</span>
              </div>

              <div className="setting-group">
                <label>Width:</label>
                <input
                  type="number"
                  value={settings.width || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) || null }))}
                  placeholder="Auto"
                />
              </div>

              <div className="setting-group">
                <label>Height:</label>
                <input
                  type="number"
                  value={settings.height || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, height: parseInt(e.target.value) || null }))}
                  placeholder="Auto"
                />
              </div>

              <div className="setting-group">
                <label>Format:</label>
                <select
                  value={settings.format}
                  onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value }))}
                >
                  <option value="original">Keep Original</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Filter:</label>
                <select
                  value={settings.filter}
                  onChange={(e) => setSettings(prev => ({ ...prev, filter: e.target.value }))}
                >
                  <option value="none">None</option>
                  <option value="blur">Blur</option>
                  <option value="sharpen">Sharpen</option>
                  <option value="vintage">Vintage</option>
                  <option value="bw">Black & White</option>
                  <option value="sepia">Sepia</option>
                </select>
              </div>
            </div>
          )}

          <button 
            onClick={handleProcess} 
            disabled={processing}
            className="process-btn"
          >
            {processing ? `Processing... ${Math.round(progress)}%` : '🎯 Process Media'}
          </button>
        </div>
      )}

      {processing && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {processedFile && (
        <div className="result-section">
          <h3>Processing Complete! ✨</h3>
          
          <div className="comparison">
            <div className="before-after">
              <div>
                <h4>Original</h4>
                <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                {selectedFile.type.startsWith('image/') && (
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Original"
                    style={{ maxWidth: '200px', maxHeight: '150px' }}
                  />
                )}
              </div>
              
              <div>
                <h4>Processed</h4>
                <p>{(processedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                {processedFile.type.startsWith('image/') && (
                  <img 
                    src={URL.createObjectURL(processedFile)} 
                    alt="Processed"
                    style={{ maxWidth: '200px', maxHeight: '150px' }}
                  />
                )}
              </div>
            </div>
            
            {getFileSizeReduction() !== null && (
              <div className="savings">
                <p>
                  💾 Size reduced by {getFileSizeReduction()}% 
                  ({((selectedFile.size - processedFile.size) / 1024 / 1024).toFixed(2)} MB saved)
                </p>
              </div>
            )}
          </div>

          <button onClick={downloadProcessed} className="download-btn">
            ⬇️ Download Processed File
          </button>
        </div>
      )}

      <style jsx>{`
        .media-processor {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .upload-btn, .process-btn, .download-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        }

        .upload-btn:hover, .process-btn:hover, .download-btn:hover {
          background: #2563eb;
        }

        .process-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .file-info {
          margin: 16px 0;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 6px;
        }

        .settings-section {
          margin: 24px 0;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .setting-group {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .setting-group label {
          min-width: 80px;
          font-weight: 500;
        }

        .setting-group input, .setting-group select {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          outline: none;
        }

        .progress-section {
          margin: 20px 0;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .result-section {
          margin-top: 24px;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 8px;
        }

        .before-after {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 16px 0;
        }

        .before-after > div {
          text-align: center;
          padding: 16px;
          background: white;
          border-radius: 6px;
        }

        .savings {
          text-align: center;
          margin: 16px 0;
          padding: 12px;
          background: #10b981;
          color: white;
          border-radius: 6px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .before-after {
            grid-template-columns: 1fr;
          }

          .setting-group {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
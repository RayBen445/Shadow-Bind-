/**
 * Media Processing Service
 * Handles image/video editing, compression, and format conversion
 */

/**
 * Compress an image
 * @param {File} file - Image file to compress
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize an image
 * @param {File} file - Image file to resize
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Promise<File>} Resized image file
 */
export async function resizeImage(file, width, height) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      let newWidth = width || img.width;
      let newHeight = height || img.height;
      
      if (width && !height) {
        newHeight = (img.height * width) / img.width;
      } else if (height && !width) {
        newWidth = (img.width * height) / img.height;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      canvas.toBlob((blob) => {
        const resizedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        resolve(resizedFile);
      }, file.type);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert image format
 * @param {File} file - Image file to convert
 * @param {string} format - Target format (jpeg, png, webp)
 * @returns {Promise<File>} Converted image file
 */
export async function convertFormat(file, format) {
  if (format === 'original') return file;
  
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      const mimeType = `image/${format}`;
      const fileName = file.name.replace(/\.[^/.]+$/, `.${format}`);
      
      canvas.toBlob((blob) => {
        const convertedFile = new File([blob], fileName, {
          type: mimeType,
          lastModified: Date.now()
        });
        resolve(convertedFile);
      }, mimeType);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Apply filter to image
 * @param {File} file - Image file
 * @param {string} filter - Filter type
 * @returns {Promise<File>} Filtered image file
 */
export async function applyFilter(file, filter) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      // Apply CSS filter
      switch (filter) {
        case 'blur':
          ctx.filter = 'blur(2px)';
          break;
        case 'sharpen':
          ctx.filter = 'contrast(120%) brightness(110%)';
          break;
        case 'vintage':
          ctx.filter = 'sepia(30%) contrast(90%) brightness(110%)';
          break;
        case 'bw':
          ctx.filter = 'grayscale(100%)';
          break;
        case 'sepia':
          ctx.filter = 'sepia(100%)';
          break;
        default:
          ctx.filter = 'none';
      }
      
      // Redraw with filter
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const filteredFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        resolve(filteredFile);
      }, file.type);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Extract thumbnail from video
 * @param {File} file - Video file
 * @param {number} time - Time in seconds to extract thumbnail
 * @returns {Promise<File>} Thumbnail image file
 */
export async function extractVideoThumbnail(file, time = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = Math.min(time, video.duration);
    });
    
    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const thumbnailFile = new File([blob], `thumbnail_${file.name}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        resolve(thumbnailFile);
      }, 'image/jpeg', 0.8);
    });
    
    video.addEventListener('error', (e) => {
      reject(new Error('Failed to load video'));
    });
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Compress video (placeholder - requires server-side processing)
 * @param {File} file - Video file to compress
 * @param {Object} settings - Compression settings
 * @returns {Promise<File>} Compressed video file
 */
export async function compressVideo(file, settings = {}) {
  // TODO: Implement video compression
  // This would typically be done server-side with FFmpeg
  throw new Error('Video compression requires server-side processing');
}

/**
 * Get media file metadata
 * @param {File} file - Media file
 * @returns {Promise<Object>} Media metadata
 */
export async function getMediaMetadata(file) {
  if (file.type.startsWith('image/')) {
    return getImageMetadata(file);
  } else if (file.type.startsWith('video/')) {
    return getVideoMetadata(file);
  } else if (file.type.startsWith('audio/')) {
    return getAudioMetadata(file);
  }
  
  return {
    type: file.type,
    size: file.size,
    lastModified: file.lastModified
  };
}

/**
 * Get image metadata
 * @param {File} file - Image file
 * @returns {Promise<Object>} Image metadata
 */
function getImageMetadata(file) {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        type: file.type,
        size: file.size,
        width: img.width,
        height: img.height,
        aspectRatio: (img.width / img.height).toFixed(2),
        megapixels: ((img.width * img.height) / 1000000).toFixed(1)
      });
    };
    
    img.onerror = () => {
      resolve({
        type: file.type,
        size: file.size,
        error: 'Failed to load image'
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get video metadata
 * @param {File} file - Video file
 * @returns {Promise<Object>} Video metadata
 */
function getVideoMetadata(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    
    video.addEventListener('loadedmetadata', () => {
      resolve({
        type: file.type,
        size: file.size,
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2)
      });
    });
    
    video.addEventListener('error', () => {
      resolve({
        type: file.type,
        size: file.size,
        error: 'Failed to load video'
      });
    });
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Get audio metadata
 * @param {File} file - Audio file
 * @returns {Promise<Object>} Audio metadata
 */
function getAudioMetadata(file) {
  return new Promise((resolve) => {
    const audio = new Audio();
    
    audio.addEventListener('loadedmetadata', () => {
      resolve({
        type: file.type,
        size: file.size,
        duration: audio.duration
      });
    });
    
    audio.addEventListener('error', () => {
      resolve({
        type: file.type,
        size: file.size,
        error: 'Failed to load audio'
      });
    });
    
    audio.src = URL.createObjectURL(file);
  });
}
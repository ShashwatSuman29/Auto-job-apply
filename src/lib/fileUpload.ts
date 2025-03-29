/**
 * Utility functions for handling file uploads
 */

/**
 * Converts a file to base64 string
 * @param file - The file to convert
 * @returns Promise that resolves with the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Compresses an image file to reduce its size
 * @param file - The image file to compress
 * @param maxWidthHeight - Maximum width/height in pixels
 * @param quality - JPEG quality (0-1)
 * @returns Promise that resolves with the compressed image as base64 string
 */
export const compressImage = (
  file: File, 
  maxWidthHeight = 800, 
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down image if needed
        if (width > height) {
          if (width > maxWidthHeight) {
            height = Math.round(height * maxWidthHeight / width);
            width = maxWidthHeight;
          }
        } else {
          if (height > maxWidthHeight) {
            width = Math.round(width * maxWidthHeight / height);
            height = maxWidthHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Get compressed image as base64 string
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Validates if a file is an image and within size limits
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in MB (default: 2MB)
 * @returns Object with validation result and error message if any
 */
export const validateImageFile = (file: File, maxSizeMB = 2): { valid: boolean; error?: string } => {
  // Check if file is an image
  if (!file.type.match('image.*')) {
    return { valid: false, error: 'Only image files are allowed' };
  }
  
  // Check file size (default max: 2MB)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Image size should be less than ${maxSizeMB}MB` };
  }
  
  return { valid: true };
};

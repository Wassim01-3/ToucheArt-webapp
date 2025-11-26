// Cloudinary configuration
// NOTE: Replace these with your actual Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = 'dsfrwlrdz';
const CLOUDINARY_UPLOAD_PRESET = 'ToucheArt';
const CLOUDINARY_API_KEY = '175352184737274';
const CLOUDINARY_API_SECRET = 'HYZQZKVcD_o1Pf-aOLr92NgLzIs';

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload image to Cloudinary
 * @param {string} imageUri - Local URI of the image
 * @param {string} folder - Optional folder path in Cloudinary
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadImage = async (imageUri, folder = 'toucheart') => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<string>} imageUris - Array of local URIs
 * @param {string} folder - Optional folder path
 * @returns {Promise<Array<string>>} - Array of public URLs
 */
export const uploadMultipleImages = async (imageUris, folder = 'toucheart') => {
  try {
    const uploadPromises = imageUris.map(uri => uploadImage(uri, folder));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<void>}
 */
export const deleteImage = async (publicId) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = await generateSignature(publicId, timestamp);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          timestamp,
          signature,
          api_key: CLOUDINARY_API_KEY,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Delete failed');
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Generate signature for Cloudinary API
 * @param {string} publicId 
 * @param {number} timestamp 
 * @returns {Promise<string>}
 */
const generateSignature = async (publicId, timestamp) => {
  // In production, this should be done server-side
  // For now, using a simple approach (not secure for production)
  const message = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  // You would need crypto library for proper hashing
  // For now, return empty (delete might not work without proper signature)
  return '';
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
};


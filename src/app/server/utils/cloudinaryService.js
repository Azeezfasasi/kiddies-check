import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {Buffer|string} fileData - File buffer or base64 encoded file
 * @param {string} folderName - Folder name in Cloudinary
 * @returns {Promise<Object>} Upload result with url and publicId
 */
export const uploadToCloudinary = async (fileData, folderName = 'rayob') => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary is not configured');
    }

    // Handle Buffer by converting to stream
    if (Buffer.isBuffer(fileData)) {
      return new Promise((resolve, reject) => {
        const stream = Readable.from(fileData);
        
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folderName,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
              });
            }
          }
        );

        stream.pipe(uploadStream);
      });
    }

    // Handle base64 or string
    const result = await cloudinary.uploader.upload(fileData, {
      folder: folderName,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary using destructuring
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    const response = await cloudinary.uploader.destroy(publicId);

    return {
      success: response.result === 'ok',
      message: response.result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Array>} Array of delete results
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const results = await Promise.all(
      publicIds.map(publicId => deleteFromCloudinary(publicId))
    );
    return results;
  } catch (error) {
    console.error('Cloudinary bulk delete error:', error);
    throw error;
  }
};

/**
 * Optimize image URL for different sizes
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @returns {string} Optimized URL
 */
export const optimizeImageUrl = (url, width = 500, height = 500) => {
  if (!url) return '';
  
  // Extract public ID from URL
  const regex = /\/v\d+\/(.+)\.\w+$/;
  const match = url.match(regex);
  
  if (!match) return url;
  
  const publicId = match[1];
  
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

const cloudinaryService = {
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  optimizeImageUrl,
};

export default cloudinaryService;

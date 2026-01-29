import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with secure_url and public_id
 */
export const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || 'course_materials',
        resource_type: options.resourceType || 'auto',
        public_id: options.publicId,
        use_filename: true,
        unique_filename: !options.publicId,
        overwrite: false,
        ...options
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - Type of resource (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

/**
 * Get optimized URL for file
 * @param {string} publicId - Public ID of the file
 * @param {Object} transformations - Cloudinary transformations
 * @returns {string} Optimized URL
 */
export const getOptimizedUrl = (publicId, transformations = {}) => {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations
    });
  } catch (error) {
    console.error('Cloudinary URL generation error:', error);
    return null;
  }
};

export default cloudinary;
import cloudinary from "./config";

/**
 * Upload a file to Cloudinary
 * @param {Buffer} fileBuffer - The file content as a Buffer
 * @param {string} folder - The folder to upload to
 * @param {string} resourceType - The type of resource (image, video, raw)
 * @returns {Promise<object>} - The Cloudinary upload result
 */
export async function uploadToCloudinary(
  fileBuffer,
  folder = "skooly",
  resourceType = "auto",
) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file
 * @param {string} resourceType - The type of resource
 * @returns {Promise<object>} - The Cloudinary deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = "raw") {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

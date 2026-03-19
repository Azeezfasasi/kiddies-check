import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60 second timeout
});

/**
 * Retry upload with exponential backoff
 */
async function uploadWithRetry(fileData, folderName, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await cloudinary.uploader.upload(fileData, {
        folder: folderName,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        timeout: 60000,
      });
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Only retry on timeout or connection errors
      if (!error.message.includes('Timeout') && !error.message.includes('ECONNREFUSED') && attempt === maxRetries) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Upload image to Cloudinary
 */
export async function POST(req) {
  try {
    const { fileData, folderName = 'rayob/gallery' } = await req.json();

    if (!fileData) {
      return Response.json(
        { message: 'File data is required' },
        { status: 400 }
      );
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return Response.json(
        { message: 'Cloudinary is not configured' },
        { status: 500 }
      );
    }

    const result = await uploadWithRetry(fileData, folderName);

    return Response.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return Response.json(
      {
        message: 'Failed to upload image to Cloudinary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Delete image from Cloudinary
 */
export async function DELETE(req) {
  try {
    const { publicId } = await req.json();

    if (!publicId) {
      return Response.json(
        { message: 'Public ID is required' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId);

    return Response.json({
      success: result.result === 'ok',
      message: result.result,
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return Response.json(
      {
        message: 'Failed to delete image from Cloudinary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

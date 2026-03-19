import { connectDB } from '@/app/server/db/connect';
import {
  getGallery,
  updateGallery,
  deleteGallery,
  reorderImages,
  deleteImage,
  addImagesToGallery,
} from '@/app/server/controllers/galleryController';

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    let statusCode = 200;
    let responseData = null;

    const mockRes = {
      status: function(code) {
        statusCode = code;
        return this;
      },
      json: function(data) {
        responseData = data;
        return data;
      },
    };

    const mockReq = {
      params: { id },
    };

    await getGallery(mockReq, mockRes);

    return Response.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Gallery GET error:', error);
    return Response.json(
      {
        message: 'Error fetching gallery',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await req.json();

    let statusCode = 200;
    let responseData = null;

    const mockRes = {
      status: function(code) {
        statusCode = code;
        return this;
      },
      json: function(data) {
        responseData = data;
        return data;
      },
    };

    const mockReq = {
      params: { id },
      body,
    };

    // Determine which operation to perform
    if (body.imageOrder) {
      // Reorder images
      await reorderImages(mockReq, mockRes);
    } else if (body.operation === 'addImages') {
      // Add images to gallery
      await addImagesToGallery(mockReq, mockRes);
    } else if (body.operation === 'deleteImage') {
      // Delete single image
      await deleteImage(mockReq, mockRes);
    } else {
      // Update gallery
      await updateGallery(mockReq, mockRes);
    }

    return Response.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Gallery PUT error:', error);
    return Response.json(
      {
        message: 'Error updating gallery',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    let statusCode = 200;
    let responseData = null;

    const mockRes = {
      status: function(code) {
        statusCode = code;
        return this;
      },
      json: function(data) {
        responseData = data;
        return data;
      },
    };

    const mockReq = {
      params: { id },
    };

    await deleteGallery(mockReq, mockRes);

    return Response.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Gallery DELETE error:', error);
    return Response.json(
      {
        message: 'Error deleting gallery',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

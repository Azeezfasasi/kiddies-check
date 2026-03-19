import { connectDB } from '@/app/server/db/connect';
import {
  createGallery,
  getAllGalleries,
} from '@/app/server/controllers/galleryController';

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '100';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || '-createdAt';

    const mockReq = {
      query: {
        category,
        status: status || 'active', // Default to active
        featured,
        page,
        limit,
        search,
        sortBy,
      },
    };

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

    await getAllGalleries(mockReq, mockRes);

    return Response.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Gallery GET error:', error);
    return Response.json(
      {
        message: 'Error fetching galleries',
        error: error.message,
        galleries: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    let statusCode = 201;
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
      body,
    };

    await createGallery(mockReq, mockRes);

    return Response.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Gallery POST error:', error);
    return Response.json(
      {
        message: 'Error creating gallery',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

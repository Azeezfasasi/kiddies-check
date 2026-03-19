import Gallery from '../models/Gallery.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
} from '../utils/cloudinaryService.js';

/**
 * Create a new gallery
 */
export const createGallery = async (req, res) => {
  try {
    const { title, description, category, images, featured, status, businessName, location, tags, createdBy } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Validate and process images
    const processedImages = images.map((img, index) => {
      return {
        url: img.url,
        publicId: img.publicId,
        alt: img.alt || '',
        displayOrder: index,
      };
    });

    const newGallery = new Gallery({
      title,
      description: description || '',
      category: category || 'other',
      images: processedImages,
      featured: featured || false,
      status: status || 'active',
      businessName: businessName || '',
      location: location || '',
      tags: Array.isArray(tags) ? tags : [],
      createdBy: createdBy || null,
    });

    const savedGallery = await newGallery.save();

    console.log('Gallery created successfully:', savedGallery._id);

    res.status(201).json({
      message: 'Gallery created successfully',
      gallery: savedGallery,
    });
  } catch (error) {
    console.error('Error creating gallery:', error);
    res.status(500).json({
      message: 'Error creating gallery',
      error: error.message,
    });
  }
};

/**
 * Get single gallery by ID
 */
export const getGallery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Gallery ID is required' });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Increment view count
    gallery.views = (gallery.views || 0) + 1;
    await gallery.save();

    res.status(200).json(gallery);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({
      message: 'Error fetching gallery',
      error: error.message,
    });
  }
};

/**
 * Get all galleries with filtering and pagination
 */
export const getAllGalleries = async (req, res) => {
  try {
    const { category, status, featured, page = 1, limit = 10, search, sortBy = '-createdAt' } = req.query;

    const query = {};

    // Apply filters
    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const galleries = await Gallery.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum);

    const total = await Gallery.countDocuments(query);

    res.status(200).json({
      galleries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({
      message: 'Error fetching galleries',
      error: error.message,
    });
  }
};

/**
 * Update gallery
 */
export const updateGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, featured, status, businessName, location, tags, images } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Gallery ID is required' });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Update fields
    if (title) gallery.title = title;
    if (description !== undefined) gallery.description = description;
    if (category) gallery.category = category;
    if (featured !== undefined) gallery.featured = featured;
    if (status) gallery.status = status;
    if (businessName !== undefined) gallery.businessName = businessName;
    if (location !== undefined) gallery.location = location;
    if (tags) gallery.tags = Array.isArray(tags) ? tags : [];

    // Update images if provided
    if (images && Array.isArray(images)) {
      // Delete removed images from Cloudinary
      const oldPublicIds = gallery.images.map(img => img.publicId);
      const newPublicIds = images.map(img => img.publicId);
      const idsToDelete = oldPublicIds.filter(id => !newPublicIds.includes(id));

      if (idsToDelete.length > 0) {
        await deleteMultipleFromCloudinary(idsToDelete);
      }

      // Update images with new display order
      gallery.images = images.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        alt: img.alt || '',
        displayOrder: index,
      }));
    }

    const updatedGallery = await gallery.save();

    console.log('Gallery updated successfully:', id);

    res.status(200).json({
      message: 'Gallery updated successfully',
      gallery: updatedGallery,
    });
  } catch (error) {
    console.error('Error updating gallery:', error);
    res.status(500).json({
      message: 'Error updating gallery',
      error: error.message,
    });
  }
};

/**
 * Delete gallery and associated images from Cloudinary
 */
export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Gallery ID is required' });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Delete images from Cloudinary
    const publicIds = gallery.images.map(img => img.publicId);

    if (publicIds.length > 0) {
      try {
        await deleteMultipleFromCloudinary(publicIds);
      } catch (cloudinaryError) {
        console.error('Error deleting images from Cloudinary:', cloudinaryError);
        // Continue deletion from DB even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    console.log('Gallery deleted successfully:', id);

    res.status(200).json({
      message: 'Gallery deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting gallery:', error);
    res.status(500).json({
      message: 'Error deleting gallery',
      error: error.message,
    });
  }
};

/**
 * Reorder images in a gallery
 */
export const reorderImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageOrder } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Gallery ID is required' });
    }

    if (!Array.isArray(imageOrder)) {
      return res.status(400).json({ message: 'imageOrder must be an array' });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Reorder images based on provided publicIds
    const reorderedImages = imageOrder
      .map(publicId => gallery.images.find(img => img.publicId === publicId))
      .filter(Boolean)
      .map((img, index) => ({
        ...img,
        displayOrder: index,
      }));

    gallery.images = reorderedImages;
    const updatedGallery = await gallery.save();

    res.status(200).json({
      message: 'Images reordered successfully',
      gallery: updatedGallery,
    });
  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({
      message: 'Error reordering images',
      error: error.message,
    });
  }
};

/**
 * Delete single image from gallery
 */
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { publicId } = req.body;

    if (!id || !publicId) {
      return res.status(400).json({ message: 'Gallery ID and publicId are required' });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Check if image exists in gallery
    const imageIndex = gallery.images.findIndex(img => img.publicId === publicId);

    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found in gallery' });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(publicId);
    } catch (cloudinaryError) {
      console.error('Error deleting image from Cloudinary:', cloudinaryError);
      return res.status(500).json({
        message: 'Error deleting image from cloud storage',
        error: cloudinaryError.message,
      });
    }

    // Remove from gallery
    gallery.images.splice(imageIndex, 1);

    // Recalculate display order
    gallery.images = gallery.images.map((img, index) => ({
      ...img,
      displayOrder: index,
    }));

    const updatedGallery = await gallery.save();

    res.status(200).json({
      message: 'Image deleted successfully',
      gallery: updatedGallery,
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      message: 'Error deleting image',
      error: error.message,
    });
  }
};

/**
 * Add images to existing gallery
 */
export const addImagesToGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Gallery ID is required' });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Images array is required' });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Add new images with updated display order
    const nextDisplayOrder = Math.max(...gallery.images.map(img => img.displayOrder), -1) + 1;

    const newImages = images.map((img, index) => ({
      url: img.url,
      publicId: img.publicId,
      alt: img.alt || '',
      displayOrder: nextDisplayOrder + index,
    }));

    gallery.images.push(...newImages);
    const updatedGallery = await gallery.save();

    res.status(200).json({
      message: 'Images added successfully',
      gallery: updatedGallery,
    });
  } catch (error) {
    console.error('Error adding images:', error);
    res.status(500).json({
      message: 'Error adding images',
      error: error.message,
    });
  }
};

const galleryControllers = {
  createGallery,
  getGallery,
  getAllGalleries,
  updateGallery,
  deleteGallery,
  reorderImages,
  deleteImage,
  addImagesToGallery,
};

export default galleryControllers;

'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function NotebookUploadModal({ studentId, studentName, schoolId, userId, onClose, onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [captions, setCaptions] = useState({});
  const [uploading, setUploading] = useState(false);
  const [notebookImages, setNotebookImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const fileInputRef = useRef(null);
  const imageContainerRef = useRef(null);

  // Fetch existing notebook images
  const loadNotebookImages = async () => {
    try {
      const response = await fetch(
        `/api/teacher/students/${studentId}/notebook-images`,
        {
          headers: { 'x-user-id': userId },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotebookImages(data.notebookImages || []);
      }
    } catch (error) {
      console.error('Error fetching notebook images:', error);
      toast.error('Failed to load notebook images');
    }
  };

  useEffect(() => {
    if (studentId && userId) {
      setLoadingImages(true);
      loadNotebookImages().finally(() => setLoadingImages(false));
    }
  }, [studentId, userId]);

  // Handle keyboard navigation for image viewer
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (selectedImageIndex === null) return;

      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImageIndex, notebookImages.length]);

  const goToNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < notebookImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  // Handle drag/swipe for image navigation
  const handleMouseDown = (e) => {
    setDragStart(e.clientX);
  };

  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientX);
  };

  const handleMouseUp = (e) => {
    if (!dragStart) return;
    const dragEnd = e.clientX;
    const diff = dragStart - dragEnd;
    const threshold = 50; // Minimum drag distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Dragged left, show next image
        goToNext();
      } else {
        // Dragged right, show previous image
        goToPrevious();
      }
    }
    setDragStart(null);
  };

  const handleTouchEnd = (e) => {
    if (!dragStart) return;
    const dragEnd = e.changedTouches[0].clientX;
    const diff = dragStart - dragEnd;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    setDragStart(null);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = selectedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    const newCaptions = { ...captions };
    delete newCaptions[index];
    setCaptions(newCaptions);
  };

  const updateCaption = (index, caption) => {
    setCaptions({
      ...captions,
      [index]: caption,
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      files.forEach((file, index) => {
        formData.append('files', file);
        formData.append('captions', captions[index] || '');
      });

      const response = await fetch(
        `/api/teacher/students/${studentId}/notebook-images`,
        {
          method: 'POST',
          headers: { 'x-user-id': userId },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload notebook images');
      }

      const data = await response.json();
      toast.success(data.message || 'Notebook images uploaded successfully');
      setFiles([]);
      setCaptions({});
      await loadNotebookImages();
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Error uploading notebook images:', error);
      toast.error(error.message || 'Failed to upload notebook images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Are you sure you want to delete this notebook image?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/teacher/students/${studentId}/notebook-images`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      toast.success('Notebook image deleted successfully');
      await loadNotebookImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Notebook Gallery - {studentName}
            </h2>
            <p className="text-gray-600 text-sm mt-1">Upload and manage student notebook pictures</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-gray-700 font-semibold mb-2">Upload Notebook Images</p>
              <p className="text-gray-600 text-sm mb-4">
                Select one or more images to upload
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Choose Images
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3 border-t pt-4">
                <h3 className="font-semibold text-gray-800">Selected Images ({files.length})</h3>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                      <input
                        type="text"
                        placeholder="Add a caption (optional)"
                        value={captions[index] || ''}
                        onChange={(e) => updateCaption(index, e.target.value)}
                        className="mt-2 w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload {files.length} Image{files.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Existing Images */}
          {notebookImages.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">
                Current Notebook Gallery ({notebookImages.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notebookImages.map((image, index) => (
                  <div
                    key={image._id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <div className="relative w-full aspect-square bg-gray-100">
                      <Image
                        src={image.url}
                        alt={image.caption || 'Notebook image'}
                        fill
                        className="object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20">
                        <div className="text-white text-center">
                          <p className="font-semibold">Click to view</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      {image.caption && (
                        <p className="text-sm text-gray-700 mb-2">{image.caption}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>
                          {new Date(image.uploadedAt).toLocaleDateString()}
                        </span>
                        {image.uploadedBy && (
                          <span>
                            By {image.uploadedBy.firstName} {image.uploadedBy.lastName}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image._id);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-1 rounded text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notebookImages.length === 0 && !loadingImages && files.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No notebook images yet. Start by uploading some!</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && notebookImages[selectedImageIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-5xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              disabled={selectedImageIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-80 disabled:opacity-30 disabled:cursor-not-allowed p-3 rounded-full transition-all z-20"
              title="Previous image"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              disabled={selectedImageIndex === notebookImages.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-80 disabled:opacity-30 disabled:cursor-not-allowed p-3 rounded-full transition-all z-20"
              title="Next image"
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            {/* Image Container */}
            <div
              ref={imageContainerRef}
              className="relative w-full h-[80vh] flex items-center justify-center cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={notebookImages[selectedImageIndex].url}
                alt={notebookImages[selectedImageIndex].caption || 'Notebook image'}
                fill
                className="object-contain pointer-events-none select-none"
                priority
                draggable={false}
              />
            </div>

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-6 text-white">
              <div className="max-w-5xl mx-auto">
                {notebookImages[selectedImageIndex].caption && (
                  <p className="text-lg font-semibold mb-2">
                    {notebookImages[selectedImageIndex].caption}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>
                    {new Date(notebookImages[selectedImageIndex].uploadedAt).toLocaleDateString()}
                  </span>
                  {notebookImages[selectedImageIndex].uploadedBy && (
                    <span>
                      By {notebookImages[selectedImageIndex].uploadedBy.firstName}{' '}
                      {notebookImages[selectedImageIndex].uploadedBy.lastName}
                    </span>
                  )}
                  <span className="text-gray-400">
                    {selectedImageIndex + 1} / {notebookImages.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Keyboard hint */}
            <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
              Use ← → or arrow keys • ESC to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

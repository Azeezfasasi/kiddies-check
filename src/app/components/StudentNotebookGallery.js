'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Loader } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function StudentNotebookGallery({ studentId, studentName, userId }) {
  const [notebookImages, setNotebookImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchNotebookImages();
  }, [studentId]);

  const fetchNotebookImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/teacher/students/${studentId}/notebook-images`,
        {
          headers: { 'x-user-id': userId },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotebookImages(data.notebookImages || []);
      } else {
        toast.error('Failed to load notebook images');
      }
    } catch (error) {
      console.error('Error fetching notebook images:', error);
      toast.error('Failed to load notebook images');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading notebook gallery...</p>
        </div>
      </div>
    );
  }

  if (notebookImages.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-800 mb-2">No notebook images yet</h3>
        <p className="text-gray-600 text-sm">
          Your child's notebook images will appear here as the teacher uploads them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">
          Notebook Gallery ({notebookImages.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notebookImages.map((image) => (
          <div
            key={image._id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={image.url}
                alt={image.caption || 'Notebook image'}
                fill
                className="object-cover hover:scale-105 transition-transform"
              />
            </div>
            {image.caption && (
              <div className="p-3">
                <p className="text-sm text-gray-700 line-clamp-2">{image.caption}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(image.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <Image
              src={selectedImage.url}
              alt={selectedImage.caption || 'Notebook image'}
              width={800}
              height={800}
              className="w-full h-full object-contain"
            />
            {selectedImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                <p className="font-semibold">{selectedImage.caption}</p>
                <p className="text-sm text-gray-200 mt-1">
                  {new Date(selectedImage.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

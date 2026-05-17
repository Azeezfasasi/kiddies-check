'use client';

import { useEffect, useState, useRef } from 'react';
import { BookOpen, Loader, ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function StudentNotebookGallery({ studentId, studentName, userId }) {
  const [notebookImages, setNotebookImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const slideContainerRef = useRef(null);
  const dragStartXRef = useRef(0);

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
        setCurrentSlideIndex(0);
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

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) =>
      prev === 0 ? notebookImages.length - 1 : prev - 1
    );
    setDragOffset(0);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) =>
      prev === notebookImages.length - 1 ? 0 : prev + 1
    );
    setDragOffset(0);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartXRef.current;
    setDragOffset(diff);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = e.clientX - dragStartXRef.current;
    const threshold = 50; // minimum drag distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handlePrevSlide();
      } else {
        handleNextSlide();
      }
    }
    setDragOffset(0);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    dragStartXRef.current = e.touches[0].clientX;
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - dragStartXRef.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = e.changedTouches[0].clientX - dragStartXRef.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handlePrevSlide();
      } else {
        handleNextSlide();
      }
    }
    setDragOffset(0);
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

  const currentImage = notebookImages[currentSlideIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">
          Notebook Slides ({notebookImages.length})
        </h3>
      </div>

      {/* Slides Container */}
      <div
        ref={slideContainerRef}
        className="relative w-full bg-gray-100 rounded-lg overflow-hidden group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="relative w-full aspect-video">
          <Image
            src={currentImage.url}
            alt={currentImage.caption || 'Notebook slide'}
            fill
            className="object-contain select-none pointer-events-none"
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          />

          {/* Expand Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Expand slide"
            title="Click to expand"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v4m12-4h4v4M6 18h-4v-4m16 4h4v-4" />
            </svg>
          </button>

          {/* Drag Indicator */}
          {isDragging && (
            <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
              <GripHorizontal className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Counter */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentSlideIndex + 1} / {notebookImages.length}
        </div>
      </div>

      {/* Slide Info */}
      {currentImage.caption && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="font-semibold text-gray-800 mb-2">Caption</p>
          <p className="text-gray-700">{currentImage.caption}</p>
          <p className="text-xs text-gray-500 mt-3">
            Uploaded on {new Date(currentImage.uploadedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Thumbnail Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {notebookImages.map((image, index) => (
          <button
            key={image._id}
            onClick={() => {
              setCurrentSlideIndex(index);
              setDragOffset(0);
            }}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
              index === currentSlideIndex
                ? 'border-blue-600 shadow-lg'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Image
              src={image.url}
              alt={`Slide ${index + 1}`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-6xl max-h-[95vh] bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors z-10"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Main Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={currentImage.url}
                alt={currentImage.caption || 'Notebook slide'}
                width={1200}
                height={900}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>

            {/* Modal Navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  {currentImage.caption && (
                    <p className="font-semibold text-lg mb-2">{currentImage.caption}</p>
                  )}
                  <p className="text-sm text-gray-300">
                    Uploaded on {new Date(currentImage.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  {currentSlideIndex + 1} / {notebookImages.length}
                </div>
              </div>

              {/* Modal Navigation Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrevSlide}
                  className="bg-white bg-opacity-20 hover:bg-opacity-40 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
                <button
                  onClick={handleNextSlide}
                  className="bg-white bg-opacity-20 hover:bg-opacity-40 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Side Navigation Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

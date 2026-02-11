'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileType } from 'lucide-react';
import { AssetType } from '@/app/generated/prisma';

interface CarouselItem {
  id: string;
  storageUrl: string;
  publicUrl: string;
  itemType: AssetType;
  mimeType?: string | null;
  order: number;
}

interface CarouselSliderProps {
  items: CarouselItem[];
  title: string;
}

export function CarouselSlider({ items, title }: CarouselSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg aspect-video flex items-center justify-center">
        <div className="text-center p-4">
          <FileType className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-2">No carousel items found</p>
          <p className="text-xs text-gray-600">Upload images or videos to this carousel</p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main Carousel Display */}
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg aspect-video overflow-hidden">
        {/* Navigation Buttons */}
        {items.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </>
        )}

        {/* Current Item Display */}
        <div className="w-full h-full flex items-center justify-center">
          {currentItem.itemType === AssetType.IMAGE ? (
            currentItem.publicUrl ? (
              <img
                src={currentItem.publicUrl}
                alt={`${title} - Slide ${currentIndex + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Image failed to load:', currentItem.publicUrl);
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center p-4">
                        <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p class="text-gray-600 mb-2">Failed to load image</p>
                        <p class="text-xs text-gray-500">Check R2 bucket configuration</p>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="text-center p-4">
                <FileType className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Image preview not available</p>
                <p className="text-xs text-gray-600">R2_PUBLIC_URL may not be configured</p>
              </div>
            )
          ) : currentItem.itemType === AssetType.VIDEO ? (
            currentItem.publicUrl ? (
              <video
                key={currentItem.id}
                src={currentItem.publicUrl}
                controls
                className="w-full h-full"
                onError={(e) => {
                  console.error('Video failed to load:', currentItem.publicUrl);
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center p-4">
                        <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p class="text-gray-600 mb-2">Failed to load video</p>
                        <p class="text-xs text-gray-500">Check R2 bucket configuration</p>
                      </div>
                    `;
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-center p-4">
                <FileType className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Video preview not available</p>
                <p className="text-xs text-gray-600">R2_PUBLIC_URL may not be configured</p>
              </div>
            )
          ) : (
            <div className="text-center p-4">
              <FileType className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700">Unsupported item type</p>
            </div>
          )}
        </div>

        {/* Slide Counter */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {items.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {item.itemType === AssetType.IMAGE && item.publicUrl ? (
                <img
                  src={item.publicUrl}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : item.itemType === AssetType.VIDEO && item.publicUrl ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                  <video
                    src={item.publicUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <FileType className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

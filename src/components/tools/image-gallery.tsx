"use client";

import { useState } from "react";
import { Wrench, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolImage } from "@/db/schema";

interface ImageGalleryProps {
  images: ToolImage[];
  fallbackImage?: string | null;
  toolName: string;
}

export function ImageGallery({ images, fallbackImage, toolName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Combine gallery images with fallback
  const allImages = images.length > 0 
    ? images 
    : fallbackImage 
      ? [{ id: "fallback", imageUrl: fallbackImage, altText: toolName, isPrimary: true, toolId: "", sortOrder: 0, createdAt: new Date() }]
      : [];

  const currentImage = allImages[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <Wrench className="h-24 w-24 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative group">
        <div 
          className={cn(
            "relative aspect-square rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in transition-all duration-300",
            isZoomed && "fixed inset-0 z-50 aspect-auto rounded-none cursor-zoom-out bg-black/90"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={currentImage?.imageUrl}
            alt={currentImage?.altText || toolName}
            className={cn(
              "w-full h-full transition-transform duration-500",
              isZoomed ? "object-contain" : "object-cover"
            )}
          />
          
          {/* Zoom indicator */}
          {!isZoomed && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                <ZoomIn className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {allImages.length > 1 && !isZoomed && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </>
        )}

        {/* Image counter */}
        {allImages.length > 1 && !isZoomed && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white font-medium">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all",
                selectedIndex === index
                  ? "ring-2 ring-blue-600 ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={image.imageUrl}
                alt={image.altText || `${toolName} - Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

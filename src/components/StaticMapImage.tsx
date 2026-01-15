'use client';

import { useState } from 'react';

type StaticMapImageProps = {
  imageUrl?: string;
  address?: string;
  isLoading?: boolean;
  className?: string;
  bufferDistanceFt?: number;
};

/**
 * Static map image component for AI-generated maps.
 * Falls back to a placeholder when no image URL is provided.
 */
export function StaticMapImage({
  imageUrl,
  address,
  isLoading = false,
  className = '',
  bufferDistanceFt = 500,
}: StaticMapImageProps) {
  const [imageError, setImageError] = useState(false);

  if (isLoading) {
    return (
      <div className={`relative bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Generating map image...</p>
          <p className="text-gray-400 text-xs mt-1">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (!imageUrl || imageError) {
    return (
      <div className={`relative bg-gray-100 ${className}`}>
        {/* Placeholder map visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Map Image</p>
            <p className="text-gray-400 text-sm mt-1">
              {address ? `${address}` : 'No address specified'}
            </p>
            <p className="text-gray-400 text-xs mt-2">
              AI-generated map will appear here
            </p>
          </div>
        </div>

        {/* Illustrative notice overlay */}
        <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded shadow-sm">
          <p className="text-xs font-medium text-gray-600">Illustrative map</p>
          <p className="text-xs text-gray-500">(not authoritative)</p>
        </div>

        {/* Buffer distance label */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-blue-600 font-medium bg-white/90 px-2 py-0.5 rounded shadow-sm">
            {bufferDistanceFt} ft
          </span>
        </div>

        {/* North arrow placeholder */}
        <div className="absolute bottom-4 right-4 bg-white/90 rounded-full p-2 shadow-sm">
          <div className="flex flex-col items-center text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L8 12h3v10h2V12h3L12 2z" />
            </svg>
            <span className="text-xs font-bold">N</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageUrl}
        alt={`Map of ${address || 'location'}`}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />

      {/* Overlays for generated images */}
      <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded shadow-sm">
        <p className="text-xs font-medium text-gray-600">AI-Generated</p>
        <p className="text-xs text-gray-500">(illustrative only)</p>
      </div>
    </div>
  );
}

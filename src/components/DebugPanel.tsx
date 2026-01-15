'use client';

import { useState } from 'react';
import { InfographicSpec } from '@/lib/types';
import { InteractiveMap } from './InteractiveMap';

type DebugPanelProps = {
  spec: InfographicSpec;
};

export function DebugPanel({ spec }: DebugPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mapImages: true,
    geometry: true,
    mapVisualization: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasParcelGeometry = !!spec.geometry.subjectParcel?.geometry;
  const hasBufferGeometry = !!spec.geometry.buffer?.geometry;

  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mt-6 font-mono text-sm">
      <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
        <span>🐛</span> Debug Panel
      </h3>

      {/* Map Images Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('mapImages')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-2"
        >
          <span>{expandedSections.mapImages ? '▼' : '▶'}</span>
          <span className="font-bold">mapImages</span>
          <span className={spec.mapImages.main.url ? 'text-green-400' : 'text-red-400'}>
            ({spec.mapImages.main.url ? 'populated' : 'EMPTY'})
          </span>
        </button>
        {expandedSections.mapImages && (
          <div className="ml-4 p-3 bg-gray-800 rounded">
            <div className="mb-2">
              <span className="text-gray-400">main.url: </span>
              <span className={spec.mapImages.main.url ? 'text-green-400' : 'text-red-400'}>
                {spec.mapImages.main.url || '""  (empty string)'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">main.bounds: </span>
              <span className="text-blue-400">
                [{spec.mapImages.main.bounds.map((b) => b.toFixed(6)).join(', ')}]
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Geometry Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('geometry')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-2"
        >
          <span>{expandedSections.geometry ? '▼' : '▶'}</span>
          <span className="font-bold">geometry</span>
        </button>
        {expandedSections.geometry && (
          <div className="ml-4 p-3 bg-gray-800 rounded space-y-3">
            {/* Subject Parcel */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-400">subjectParcel: </span>
                <span className={hasParcelGeometry ? 'text-green-400' : 'text-red-400'}>
                  {hasParcelGeometry ? '✓ present' : '✗ missing'}
                </span>
              </div>
              {hasParcelGeometry && (
                <details className="ml-4">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
                    Show geometry ({spec.geometry.subjectParcel?.geometry.type})
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-x-auto max-h-40">
                    {JSON.stringify(spec.geometry.subjectParcel?.geometry, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            {/* Buffer */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-400">buffer: </span>
                <span className={hasBufferGeometry ? 'text-green-400' : 'text-red-400'}>
                  {hasBufferGeometry ? '✓ present' : '✗ missing'}
                </span>
              </div>
              {hasBufferGeometry && (
                <details className="ml-4">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
                    Show geometry ({spec.geometry.buffer?.geometry.type})
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-x-auto max-h-40">
                    {JSON.stringify(spec.geometry.buffer?.geometry, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            {/* Nearby Points */}
            <div>
              <span className="text-gray-400">nearbyPoints: </span>
              <span className="text-blue-400">
                {spec.geometry.nearbyPoints?.length || 0} points
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Map Visualization Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('mapVisualization')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-2"
        >
          <span>{expandedSections.mapVisualization ? '▼' : '▶'}</span>
          <span className="font-bold">Map Visualization (Debug)</span>
        </button>
        {expandedSections.mapVisualization && (
          <div className="ml-4 space-y-4">
            {/* Map with just parcel */}
            <div>
              <p className="text-gray-400 mb-2">
                Parcel only (blue fill):
              </p>
              <InteractiveMap
                center={[spec.inputs.latLon?.[1] || -122.05, spec.inputs.latLon?.[0] || 38.25]}
                parcelGeometry={spec.geometry.subjectParcel?.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined}
                className="w-full h-[300px] rounded border border-gray-700"
                showNorthArrow={false}
              />
            </div>

            {/* Map with buffer */}
            <div>
              <p className="text-gray-400 mb-2">
                Buffer only (dashed blue, 500ft):
              </p>
              <InteractiveMap
                center={[spec.inputs.latLon?.[1] || -122.05, spec.inputs.latLon?.[0] || 38.25]}
                bufferGeometry={spec.geometry.buffer?.geometry as GeoJSON.Polygon | undefined}
                className="w-full h-[300px] rounded border border-gray-700"
                showNorthArrow={false}
              />
            </div>

            {/* Map with both */}
            <div>
              <p className="text-gray-400 mb-2">
                Both parcel + buffer:
              </p>
              <InteractiveMap
                center={[spec.inputs.latLon?.[1] || -122.05, spec.inputs.latLon?.[0] || 38.25]}
                parcelGeometry={spec.geometry.subjectParcel?.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined}
                bufferGeometry={spec.geometry.buffer?.geometry as GeoJSON.Polygon | undefined}
                className="w-full h-[300px] rounded border border-gray-700"
                showNorthArrow={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lat/Lon Info */}
      <div className="p-3 bg-gray-800 rounded">
        <span className="text-gray-400">Center coordinates: </span>
        <span className="text-green-400">
          [{spec.inputs.latLon?.[0].toFixed(6)}, {spec.inputs.latLon?.[1].toFixed(6)}]
        </span>
        <span className="text-gray-500 ml-2">(lat, lon)</span>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type MapPanelProps = {
  center: [number, number]; // [lon, lat]
  parcelGeometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bufferGeometry?: GeoJSON.Polygon;
  zoom?: number;
  showScaleBar?: boolean;
  showNorthArrow?: boolean;
  className?: string;
  onMapReady?: (map: maplibregl.Map) => void;
};

export function MapPanel({
  center,
  parcelGeometry,
  bufferGeometry,
  zoom = 16,
  showScaleBar = true,
  showNorthArrow = true,
  className = '',
  onMapReady,
}: MapPanelProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-positron': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          },
        },
        layers: [
          {
            id: 'carto-positron',
            type: 'raster',
            source: 'carto-positron',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: center,
      zoom: zoom,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    if (showScaleBar) {
      map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), 'bottom-left');
    }

    map.current.on('load', () => {
      setMapLoaded(true);
      if (onMapReady && map.current) {
        onMapReady(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [center, zoom, showScaleBar, onMapReady]);

  // Add parcel and buffer layers when map is loaded and geometry is available
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Add buffer if provided
    if (bufferGeometry) {
      if (map.current.getSource('buffer')) {
        (map.current.getSource('buffer') as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: bufferGeometry,
        });
      } else {
        map.current.addSource('buffer', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: bufferGeometry,
          },
        });

        map.current.addLayer({
          id: 'buffer-fill',
          type: 'fill',
          source: 'buffer',
          paint: {
            'fill-color': '#3B82F6',
            'fill-opacity': 0.1,
          },
        });

        map.current.addLayer({
          id: 'buffer-line',
          type: 'line',
          source: 'buffer',
          paint: {
            'line-color': '#3B82F6',
            'line-width': 2,
            'line-dasharray': [4, 4],
          },
        });
      }
    }

    // Add parcel if provided
    if (parcelGeometry) {
      if (map.current.getSource('parcel')) {
        (map.current.getSource('parcel') as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: parcelGeometry,
        });
      } else {
        map.current.addSource('parcel', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: parcelGeometry,
          },
        });

        map.current.addLayer({
          id: 'parcel-fill',
          type: 'fill',
          source: 'parcel',
          paint: {
            'fill-color': '#3B82F6',
            'fill-opacity': 0.3,
          },
        });

        map.current.addLayer({
          id: 'parcel-line',
          type: 'line',
          source: 'parcel',
          paint: {
            'line-color': '#1E40AF',
            'line-width': 3,
          },
        });
      }
    }
  }, [mapLoaded, parcelGeometry, bufferGeometry]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* North Arrow */}
      {showNorthArrow && (
        <div className="absolute bottom-16 right-3 bg-white rounded-full p-2 shadow-md">
          <div className="flex flex-col items-center text-gray-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L8 12h3v10h2V12h3L12 2z" />
            </svg>
            <span className="text-xs font-bold">N</span>
          </div>
        </div>
      )}

      {/* Illustrative map notice */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="bg-white/80 px-4 py-2 rounded text-center">
          <p className="text-sm font-semibold text-gray-600">Illustrative map</p>
          <p className="text-xs text-gray-500">(not authoritative)</p>
        </div>
      </div>

      {/* Buffer distance label */}
      {bufferGeometry && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-blue-600 font-medium bg-white/80 px-2 py-0.5 rounded">
            500 ft
          </span>
        </div>
      )}
    </div>
  );
}

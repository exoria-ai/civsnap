'use client';

import { NearbyPoint } from '@/lib/types';

type NearbyChipsProps = {
  points: NearbyPoint[];
};

const categoryIcons: Record<NearbyPoint['category'], string> = {
  school: '🏫',
  park: '🌳',
  transit: '🚌',
  fire_station: '🚒',
  hospital: '🏥',
  other: '📍',
};

export function NearbyChips({ points }: NearbyChipsProps) {
  if (points.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Nearby Reference Points</h4>
      <div className="flex flex-wrap gap-2">
        {points.map((point, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full text-sm"
          >
            <span>{categoryIcons[point.category]}</span>
            <span className="font-medium">{point.label}</span>
            <span className="text-gray-500">[{point.distanceMi.toFixed(1)} mi]</span>
          </div>
        ))}
      </div>
    </div>
  );
}

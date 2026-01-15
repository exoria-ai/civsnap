'use client';

import { useRef } from 'react';
import { InfographicSpec, Fact } from '@/lib/types';
import { InteractiveMap } from './InteractiveMap';
import { InfoCard, HazardCard } from './InfoCard';
import { NearbyChips } from './NearbyChips';

type AddressSnapshotProps = {
  spec: InfographicSpec;
};

export function AddressSnapshot({ spec }: AddressSnapshotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Group facts by category
  const parcelFacts = spec.facts.filter((f) => ['apn', 'parcel_area'].includes(f.id));
  const jurisdictionFacts = spec.facts.filter((f) =>
    ['county', 'city', 'incorporated'].includes(f.id)
  );
  const zoningFacts = spec.facts.filter((f) =>
    ['zoning', 'general_plan'].includes(f.id)
  );
  const districtFacts = spec.facts.filter((f) => f.id.startsWith('district_'));

  // Get hazard facts
  const floodHazard = spec.facts.find((f) => f.id === 'hazard_flood');
  const fireHazard = spec.facts.find((f) => f.id === 'hazard_fire');

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div
      ref={containerRef}
      id="snapshot-container"
      className="bg-white w-full max-w-[1100px] mx-auto shadow-lg"
      style={{ aspectRatio: '8.5/11' }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Template: Address Snapshot - Counter Handout</p>
        <h1 className="text-3xl font-bold text-gray-900">{spec.copy.title}</h1>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">Address (user input):</span> {spec.inputs.address}
          </p>
          <p>
            <span className="font-medium">Generated:</span> {formatDate(spec.generatedAt)}
          </p>
          <p className="text-orange-600">
            <span className="font-medium">Intended use:</span> Internal demo (not for public release)
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row p-6 gap-6">
        {/* Left: Map Panel */}
        <div className="lg:w-[55%]">
          <InteractiveMap
            center={[spec.inputs.latLon?.[1] || -122.05, spec.inputs.latLon?.[0] || 38.25]}
            parcelGeometry={spec.geometry.subjectParcel?.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined}
            bufferGeometry={spec.geometry.buffer?.geometry as GeoJSON.Polygon | undefined}
            className="w-full h-[400px] rounded-lg border border-gray-200"
          />

          {/* Nearby POIs */}
          {spec.geometry.nearbyPoints && spec.geometry.nearbyPoints.length > 0 && (
            <NearbyChips points={spec.geometry.nearbyPoints} />
          )}
        </div>

        {/* Right: Info Cards */}
        <div className="lg:w-[45%] space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Parcel & Jurisdiction</h2>

          <InfoCard title="Parcel" icon="📋" facts={parcelFacts} />
          <InfoCard title="Jurisdiction" icon="🏛️" facts={jurisdictionFacts} />

          <h2 className="text-lg font-bold text-gray-800 pt-2">Land Use & Zoning</h2>
          <InfoCard title="Zoning & General Plan" icon="⚙️" facts={zoningFacts} />

          <h2 className="text-lg font-bold text-gray-800 pt-2">Political / Service Districts</h2>
          <InfoCard title="Districts" icon="🗂️" facts={districtFacts} />

          <h2 className="text-lg font-bold text-gray-800 pt-2">Hazards & Constraints</h2>
          <div className="space-y-3">
            {floodHazard && (
              <HazardCard
                type="flood"
                label="Flood"
                severity={getHazardSeverity(floodHazard)}
                description={floodHazard.value}
              />
            )}
            {fireHazard && (
              <HazardCard
                type="fire"
                label="Fire"
                severity={getHazardSeverity(fireHazard)}
                description={fireHazard.value}
              />
            )}
            <HazardCard
              type="environmental"
              label="Environmental / Other"
              severity="none"
              description="No wetlands/critical habitat flags returned (demo)"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-100 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">What this report is</h3>
            <p className="text-sm text-gray-600">
              Values shown are <strong>demo placeholders</strong> representing what GIS-backed queries would return.{' '}
              <strong>Do not use this output for decisions without verifying against authoritative sources.</strong>
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Data sources (intended when connected)</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {spec.copy.sources.map((source, idx) => (
                <li key={idx}>{source}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 text-center">
          <strong>Disclaimer:</strong> {spec.copy.disclaimer}
        </p>
      </div>
    </div>
  );
}

function getHazardSeverity(fact: Fact): 'none' | 'low' | 'moderate' | 'high' | 'very_high' {
  const value = fact.value.toLowerCase();
  if (value.includes('very high')) return 'very_high';
  if (value.includes('high')) return 'high';
  if (value.includes('moderate')) return 'moderate';
  if (value.includes('minimal') || value.includes('low') || value.includes('zone x')) return 'low';
  return 'none';
}

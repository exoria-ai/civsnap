import { InfographicSpec, Fact, GISQueryResult, GeocodeResult } from './types';
import * as turf from '@turf/turf';

type BuildSpecOptions = {
  templateId: InfographicSpec['templateId'];
  geocodeResult: GeocodeResult;
  gisData: GISQueryResult;
  options?: Record<string, boolean | string>;
};

export function buildInfographicSpec({
  templateId,
  geocodeResult,
  gisData,
  options = {},
}: BuildSpecOptions): InfographicSpec {
  const facts: Fact[] = [];

  // Parcel facts
  if (gisData.parcel) {
    facts.push({
      id: 'apn',
      label: 'APN',
      value: gisData.parcel.apn,
      source: {
        title: 'Solano County Parcels',
        layer: 'Parcels/MapServer',
      },
    });

    if (gisData.parcel.acreage) {
      facts.push({
        id: 'parcel_area',
        label: 'Parcel Area',
        value: `${gisData.parcel.acreage.toFixed(2)} acres (${Math.round(gisData.parcel.acreage * 43560).toLocaleString()} sq ft)`,
        source: {
          title: 'Solano County Parcels',
          layer: 'Parcels/MapServer',
        },
      });
    }
  }

  // Jurisdiction facts
  if (gisData.jurisdiction) {
    facts.push({
      id: 'county',
      label: 'County',
      value: gisData.jurisdiction.county,
      source: gisData.jurisdiction.source,
    });

    if (gisData.jurisdiction.city) {
      facts.push({
        id: 'city',
        label: 'City',
        value: gisData.jurisdiction.city,
        source: gisData.jurisdiction.source,
      });
    }

    facts.push({
      id: 'incorporated',
      label: 'Incorporated',
      value: gisData.jurisdiction.incorporated ? 'Yes' : 'No (Unincorporated)',
      source: gisData.jurisdiction.source,
    });
  }

  // Zoning facts
  if (gisData.zoning) {
    facts.push({
      id: 'zoning',
      label: 'Zoning',
      value: `${gisData.zoning.code}${gisData.zoning.description ? ` (${gisData.zoning.description})` : ''}`,
      source: gisData.zoning.source,
    });
  }

  // General Plan facts
  if (gisData.generalPlan) {
    facts.push({
      id: 'general_plan',
      label: 'General Plan',
      value: gisData.generalPlan.designation,
      source: gisData.generalPlan.source,
    });
  }

  // District facts
  for (const district of gisData.districts) {
    facts.push({
      id: `district_${district.type}`,
      label: getDistrictLabel(district.type),
      value: district.name,
      source: district.source,
    });
  }

  // Hazard facts
  for (const hazard of gisData.hazards) {
    facts.push({
      id: `hazard_${hazard.type}`,
      label: getHazardLabel(hazard.type),
      value: hazard.description,
      source: hazard.source,
    });
  }

  // Build geometry
  const parcelFeature = gisData.parcel?.geometry
    ? ({
        type: 'Feature',
        properties: { apn: gisData.parcel.apn },
        geometry: gisData.parcel.geometry,
      } as GeoJSON.Feature)
    : undefined;

  // Create 500ft buffer around parcel centroid if we have parcel geometry
  let bufferFeature: GeoJSON.Feature | undefined;
  if (parcelFeature && parcelFeature.geometry.type !== 'Point') {
    try {
      const centroid = turf.centroid(parcelFeature);
      bufferFeature = turf.buffer(centroid, 500, { units: 'feet' }) as GeoJSON.Feature;
    } catch (e) {
      console.error('Failed to create buffer:', e);
    }
  }

  // Calculate map bounds
  const center: [number, number] = [geocodeResult.lon, geocodeResult.lat];
  const boundsBuffer = 0.005; // roughly 500m at this latitude
  const bounds: [number, number, number, number] = [
    center[0] - boundsBuffer,
    center[1] - boundsBuffer,
    center[0] + boundsBuffer,
    center[1] + boundsBuffer,
  ];

  return {
    templateId,
    generatedAt: new Date().toISOString(),
    inputs: {
      address: geocodeResult.standardizedAddress,
      latLon: [geocodeResult.lat, geocodeResult.lon],
      options,
    },
    facts,
    geometry: {
      subjectParcel: parcelFeature,
      buffer: bufferFeature,
      nearbyPoints: gisData.nearbyPoints,
    },
    mapImages: {
      main: {
        url: '', // Will be populated by map renderer
        bounds,
      },
    },
    copy: {
      title: 'Address Snapshot',
      subtitle: geocodeResult.standardizedAddress,
      disclaimer:
        'This document is for informational purposes only. Verify all information with authoritative sources before making decisions.',
      sources: buildSourcesList(gisData),
    },
  };
}

function getDistrictLabel(type: string): string {
  const labels: Record<string, string> = {
    supervisorial: 'Supervisorial District',
    school: 'School District',
    fire: 'Fire District',
    water: 'Water District',
  };
  return labels[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} District`;
}

function getHazardLabel(type: string): string {
  const labels: Record<string, string> = {
    flood: 'Flood Zone',
    fire: 'Fire Hazard',
    environmental: 'Environmental',
  };
  return labels[type] || type;
}

function buildSourcesList(gisData: GISQueryResult): string[] {
  const sources = new Set<string>();

  sources.add('Solano County / ReGIS: parcels, jurisdiction boundaries, districts');

  if (gisData.zoning || gisData.generalPlan) {
    sources.add('Solano County: zoning and general plan layers');
  }

  if (gisData.hazards.some((h) => h.type === 'flood')) {
    sources.add('FEMA NFHL: flood hazard layers');
  }

  if (gisData.hazards.some((h) => h.type === 'fire')) {
    sources.add('CAL FIRE / county hazard layers: fire hazard severity');
  }

  return Array.from(sources);
}

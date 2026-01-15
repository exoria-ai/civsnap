import {
  GISQueryResult,
  ParcelData,
  ZoningData,
  GeneralPlanData,
  JurisdictionData,
  HazardData,
  DistrictData,
  NearbyPoint,
} from './types';

// Solano County ReGIS ArcGIS REST Service endpoints
// These will need to be verified against actual county services
const SOLANO_GIS_BASE = 'https://gis.solanocounty.com/arcgis/rest/services';

// Layer IDs (to be verified)
const LAYERS = {
  parcels: `${SOLANO_GIS_BASE}/Parcels/MapServer/0`,
  zoning: `${SOLANO_GIS_BASE}/Planning/MapServer/0`,
  generalPlan: `${SOLANO_GIS_BASE}/Planning/MapServer/1`,
  cities: `${SOLANO_GIS_BASE}/Boundaries/MapServer/0`,
  supervisorialDistricts: `${SOLANO_GIS_BASE}/Boundaries/MapServer/1`,
  schoolDistricts: `${SOLANO_GIS_BASE}/Boundaries/MapServer/2`,
};

// FEMA Flood Hazard Layer
const FEMA_FLOOD_URL = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28';

// CAL FIRE Fire Hazard Severity Zones
const CALFIRE_FHSZ_URL = 'https://egis.fire.ca.gov/arcgis/rest/services/FHSZ/SRA_LRA/MapServer/0';

type ArcGISFeature = {
  attributes: Record<string, unknown>;
  geometry?: {
    rings?: number[][][];
    x?: number;
    y?: number;
    paths?: number[][][];
  };
};

type ArcGISQueryResponse = {
  features: ArcGISFeature[];
  error?: {
    message: string;
  };
};

async function queryArcGISPoint(
  serviceUrl: string,
  lon: number,
  lat: number,
  outFields = '*'
): Promise<ArcGISFeature[]> {
  const params = new URLSearchParams({
    geometry: JSON.stringify({ x: lon, y: lat }),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields,
    returnGeometry: 'true',
    f: 'json',
  });

  try {
    const response = await fetch(`${serviceUrl}/query?${params}`);
    if (!response.ok) {
      console.error(`GIS query failed for ${serviceUrl}: ${response.statusText}`);
      return [];
    }

    const data: ArcGISQueryResponse = await response.json();

    if (data.error) {
      console.error(`GIS query error for ${serviceUrl}:`, data.error.message);
      return [];
    }

    return data.features || [];
  } catch (error) {
    console.error(`GIS query exception for ${serviceUrl}:`, error);
    return [];
  }
}

function arcgisRingsToGeoJSON(rings: number[][][]): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  if (rings.length === 1) {
    return {
      type: 'Polygon',
      coordinates: rings,
    };
  }
  return {
    type: 'MultiPolygon',
    coordinates: rings.map((ring) => [ring]),
  };
}

async function queryParcel(lon: number, lat: number): Promise<ParcelData | undefined> {
  const features = await queryArcGISPoint(LAYERS.parcels, lon, lat);

  if (features.length === 0) return undefined;

  const feature = features[0];
  const attrs = feature.attributes;

  return {
    apn: String(attrs.APN || attrs.PARCEL_NUM || attrs.PARCELID || 'Unknown'),
    address: attrs.SITUS_ADDR ? String(attrs.SITUS_ADDR) : undefined,
    acreage: typeof attrs.ACRES === 'number' ? attrs.ACRES : undefined,
    sqft: typeof attrs.SQFT === 'number' ? attrs.SQFT : undefined,
    geometry: feature.geometry?.rings
      ? arcgisRingsToGeoJSON(feature.geometry.rings)
      : { type: 'Polygon', coordinates: [] },
  };
}

async function queryZoning(lon: number, lat: number): Promise<ZoningData | undefined> {
  const features = await queryArcGISPoint(LAYERS.zoning, lon, lat);

  if (features.length === 0) return undefined;

  const attrs = features[0].attributes;

  return {
    code: String(attrs.ZONING || attrs.ZONE_CODE || attrs.ZONE || 'Unknown'),
    description: String(attrs.ZONE_DESC || attrs.DESCRIPTION || attrs.ZONING_DESC || ''),
    source: {
      title: 'Solano County Zoning',
      layer: 'Planning/MapServer',
      url: LAYERS.zoning,
    },
  };
}

async function queryGeneralPlan(lon: number, lat: number): Promise<GeneralPlanData | undefined> {
  const features = await queryArcGISPoint(LAYERS.generalPlan, lon, lat);

  if (features.length === 0) return undefined;

  const attrs = features[0].attributes;

  return {
    designation: String(attrs.GP_DESIG || attrs.DESIGNATION || attrs.LAND_USE || 'Unknown'),
    description: String(attrs.DESCRIPTION || attrs.GP_DESC || ''),
    source: {
      title: 'Solano County General Plan',
      layer: 'Planning/MapServer',
      url: LAYERS.generalPlan,
    },
  };
}

async function queryJurisdiction(lon: number, lat: number): Promise<JurisdictionData> {
  const features = await queryArcGISPoint(LAYERS.cities, lon, lat);

  const isIncorporated = features.length > 0;
  const cityName = isIncorporated
    ? String(features[0].attributes.NAME || features[0].attributes.CITY_NAME || 'Unknown City')
    : undefined;

  return {
    county: 'Solano County',
    city: cityName,
    incorporated: isIncorporated,
    source: {
      title: 'Solano County Boundaries',
      layer: 'Boundaries/MapServer',
      url: LAYERS.cities,
    },
  };
}

async function queryFloodHazard(lon: number, lat: number): Promise<HazardData | undefined> {
  const features = await queryArcGISPoint(FEMA_FLOOD_URL, lon, lat);

  if (features.length === 0) {
    return {
      type: 'flood',
      zone: 'X',
      severity: 'low',
      description: 'Area of minimal flood hazard',
      source: {
        title: 'FEMA National Flood Hazard Layer',
        url: FEMA_FLOOD_URL,
      },
    };
  }

  const attrs = features[0].attributes;
  const zone = String(attrs.FLD_ZONE || attrs.ZONE || 'Unknown');

  // Determine severity based on FEMA zone
  let severity: HazardData['severity'] = 'low';
  if (zone.startsWith('A') || zone.startsWith('V')) {
    severity = 'high';
  } else if (zone === 'X' || zone === 'C') {
    severity = 'low';
  } else if (zone === 'B' || zone === 'X500') {
    severity = 'moderate';
  }

  return {
    type: 'flood',
    zone,
    severity,
    description: String(attrs.ZONE_SUBTY || getFloodZoneDescription(zone)),
    source: {
      title: 'FEMA National Flood Hazard Layer',
      url: FEMA_FLOOD_URL,
    },
  };
}

function getFloodZoneDescription(zone: string): string {
  const descriptions: Record<string, string> = {
    A: 'High risk flood area',
    AE: 'High risk flood area with base flood elevation',
    AH: 'Flood depths of 1-3 feet',
    AO: 'Flood depths of 1-3 feet (sheet flow)',
    V: 'Coastal high hazard area',
    VE: 'Coastal high hazard area with base flood elevation',
    X: 'Area of minimal flood hazard',
    B: 'Moderate flood hazard area',
    C: 'Area of minimal flood hazard',
  };
  return descriptions[zone] || `Flood Zone ${zone}`;
}

async function queryFireHazard(lon: number, lat: number): Promise<HazardData | undefined> {
  const features = await queryArcGISPoint(CALFIRE_FHSZ_URL, lon, lat);

  if (features.length === 0) {
    return {
      type: 'fire',
      zone: 'None',
      severity: 'none',
      description: 'Not in a designated fire hazard severity zone',
      source: {
        title: 'CAL FIRE Fire Hazard Severity Zones',
        url: CALFIRE_FHSZ_URL,
      },
    };
  }

  const attrs = features[0].attributes;
  const hazardClass = String(attrs.HAZ_CLASS || attrs.SRA22_2 || 'Unknown');

  let severity: HazardData['severity'] = 'moderate';
  if (hazardClass.toLowerCase().includes('very high') || hazardClass === '3') {
    severity = 'very_high';
  } else if (hazardClass.toLowerCase().includes('high') || hazardClass === '2') {
    severity = 'high';
  } else if (hazardClass.toLowerCase().includes('moderate') || hazardClass === '1') {
    severity = 'moderate';
  }

  return {
    type: 'fire',
    zone: hazardClass,
    severity,
    description: `Fire Hazard Severity: ${hazardClass}`,
    source: {
      title: 'CAL FIRE Fire Hazard Severity Zones',
      url: CALFIRE_FHSZ_URL,
    },
  };
}

async function queryDistricts(lon: number, lat: number): Promise<DistrictData[]> {
  const districts: DistrictData[] = [];

  // Query supervisorial district
  const supFeatures = await queryArcGISPoint(LAYERS.supervisorialDistricts, lon, lat);
  if (supFeatures.length > 0) {
    const attrs = supFeatures[0].attributes;
    districts.push({
      type: 'supervisorial',
      name: String(attrs.DISTRICT || attrs.NAME || attrs.SUP_DIST || 'Unknown'),
      source: {
        title: 'Solano County Supervisorial Districts',
        url: LAYERS.supervisorialDistricts,
      },
    });
  }

  // Query school district
  const schoolFeatures = await queryArcGISPoint(LAYERS.schoolDistricts, lon, lat);
  if (schoolFeatures.length > 0) {
    const attrs = schoolFeatures[0].attributes;
    districts.push({
      type: 'school',
      name: String(attrs.NAME || attrs.DISTRICT || attrs.SCHOOL_DIST || 'Unknown'),
      source: {
        title: 'School Districts',
        url: LAYERS.schoolDistricts,
      },
    });
  }

  return districts;
}

// For demo purposes, generate nearby points based on common POIs
// In production, this would query OSM Overpass or county POI layers
function generateDemoNearbyPoints(lon: number, lat: number): NearbyPoint[] {
  // Generate realistic-looking nearby points for demo
  const categories: Array<{
    category: NearbyPoint['category'];
    label: string;
    typicalDistance: number;
  }> = [
    { category: 'school', label: 'Elementary School', typicalDistance: 0.4 },
    { category: 'park', label: 'Park', typicalDistance: 0.3 },
    { category: 'transit', label: 'Transit Stop', typicalDistance: 0.2 },
    { category: 'fire_station', label: 'Fire Station', typicalDistance: 1.1 },
    { category: 'hospital', label: 'Hospital', typicalDistance: 1.9 },
  ];

  return categories.map((cat) => ({
    label: cat.label,
    category: cat.category,
    distanceMi: cat.typicalDistance,
    point: {
      type: 'Point' as const,
      coordinates: [
        lon + (Math.random() - 0.5) * 0.02,
        lat + (Math.random() - 0.5) * 0.02,
      ],
    },
  }));
}

export async function queryAllGISData(lon: number, lat: number): Promise<GISQueryResult> {
  // Run queries in parallel for performance
  const [parcel, zoning, generalPlan, jurisdiction, floodHazard, fireHazard, districts] =
    await Promise.all([
      queryParcel(lon, lat),
      queryZoning(lon, lat),
      queryGeneralPlan(lon, lat),
      queryJurisdiction(lon, lat),
      queryFloodHazard(lon, lat),
      queryFireHazard(lon, lat),
      queryDistricts(lon, lat),
    ]);

  const hazards: HazardData[] = [];
  if (floodHazard) hazards.push(floodHazard);
  if (fireHazard) hazards.push(fireHazard);

  // Use demo nearby points for now
  const nearbyPoints = generateDemoNearbyPoints(lon, lat);

  return {
    parcel,
    zoning,
    generalPlan,
    jurisdiction,
    hazards,
    districts,
    nearbyPoints,
  };
}

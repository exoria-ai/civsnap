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

// Solano County ArcGIS Online hosted services
// Verified working endpoints as of Jan 2025
const SOLANO_GIS_BASE = 'https://services2.arcgis.com/SCn6czzcqKAFwdGU/ArcGIS/rest/services';

const LAYERS = {
  // Address points - centroids for parcel lookups (has APN + Lat/Long)
  addressPoints: `${SOLANO_GIS_BASE}/Address_Points/FeatureServer/0`,
  // Parcel boundaries and attributes
  parcels: `${SOLANO_GIS_BASE}/Parcels_Public_Aumentum/FeatureServer/0`,
  // Unincorporated county zoning (cities have separate layers)
  zoning: `${SOLANO_GIS_BASE}/SolanoCountyZoning_092322/FeatureServer/4`,
  // General Plan for unincorporated areas
  generalPlan: `${SOLANO_GIS_BASE}/SolanoCountyUnincorporated_GeneralPlan2008_updated0923/FeatureServer/0`,
  // City boundaries (incorporated areas)
  cities: `${SOLANO_GIS_BASE}/CityBoundary/FeatureServer/2`,
  // Board of Supervisors districts
  supervisorialDistricts: `${SOLANO_GIS_BASE}/BOS_District_Boundaries_2021/FeatureServer/0`,
  // School districts - using community college districts as proxy
  schoolDistricts: `${SOLANO_GIS_BASE}/CommunityCollegeDistricts_2022/FeatureServer/0`,
};

// FEMA National Flood Hazard Layer - Flood Hazard Zones
const FEMA_FLOOD_URL = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28';

// CAL FIRE Fire Hazard Severity Zones (State Responsibility Area)
const CALFIRE_FHSZ_SRA_URL = 'https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/0';
// CAL FIRE Fire Hazard Severity Zones (Local Responsibility Area)
const CALFIRE_FHSZ_LRA_URL = 'https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/1';

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
    inSR: '4326', // Input coordinates are WGS84
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

// Query address point by address string or spatial location
// Returns APN and precise centroid coordinates
// First tries address string search (more accurate), then falls back to spatial
async function queryAddressPoint(
  lon: number,
  lat: number,
  addressString?: string
): Promise<{ apn: string; lon: number; lat: number; address: string } | undefined> {
  // First try: search by address string if provided
  if (addressString) {
    const addressResult = await searchAddressPointByString(addressString);
    if (addressResult) return addressResult;
  }

  // Fallback: spatial search near geocoded coordinates
  return searchAddressPointSpatial(lon, lat);
}

// Search Address Points by address string (e.g., "675 Texas St")
async function searchAddressPointByString(
  addressString: string
): Promise<{ apn: string; lon: number; lat: number; address: string } | undefined> {
  // Extract street number and name from address
  // Pattern: "675 Texas Street, Suite 4700, Fairfield, CA" -> number=675, street=TEXAS
  const match = addressString.match(/^(\d+)\s+([A-Za-z]+)/);
  if (!match) return undefined;

  const streetNumber = match[1];
  const streetName = match[2].toUpperCase();

  // Query for addresses matching the street number and name
  const whereClause = `fulladdress LIKE '${streetNumber} ${streetName}%' OR fulladdress LIKE '${streetNumber} W ${streetName}%' OR fulladdress LIKE '${streetNumber} E ${streetName}%' OR fulladdress LIKE '${streetNumber} N ${streetName}%' OR fulladdress LIKE '${streetNumber} S ${streetName}%'`;

  const params = new URLSearchParams({
    where: whereClause,
    outFields: 'apn,fulladdress,lat,long',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '10',
  });

  try {
    const response = await fetch(`${LAYERS.addressPoints}/query?${params}`);
    if (!response.ok) return undefined;

    const data: ArcGISQueryResponse = await response.json();
    if (data.error || !data.features?.length) return undefined;

    // Return the first match (most likely the exact address)
    const attrs = data.features[0].attributes;
    return {
      apn: String(attrs.apn || ''),
      lon: Number(attrs.long),
      lat: Number(attrs.lat),
      address: String(attrs.fulladdress || ''),
    };
  } catch {
    return undefined;
  }
}

// Spatial search for nearest address point within ~100m buffer
async function searchAddressPointSpatial(
  lon: number,
  lat: number
): Promise<{ apn: string; lon: number; lat: number; address: string } | undefined> {
  const bufferDegrees = 0.001; // ~100m at this latitude
  const envelope = {
    xmin: lon - bufferDegrees,
    ymin: lat - bufferDegrees,
    xmax: lon + bufferDegrees,
    ymax: lat + bufferDegrees,
  };

  const params = new URLSearchParams({
    geometry: JSON.stringify(envelope),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'apn,fulladdress,lat,long',
    returnGeometry: 'false',
    f: 'json',
  });

  try {
    const response = await fetch(`${LAYERS.addressPoints}/query?${params}`);
    if (!response.ok) return undefined;

    const data: ArcGISQueryResponse = await response.json();
    if (data.error || !data.features?.length) return undefined;

    // Find the closest address point to our input coordinates
    let closest = data.features[0];
    let minDist = Infinity;

    for (const feature of data.features) {
      const attrs = feature.attributes;
      const ptLon = Number(attrs.long);
      const ptLat = Number(attrs.lat);
      const dist = Math.sqrt(Math.pow(ptLon - lon, 2) + Math.pow(ptLat - lat, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = feature;
      }
    }

    const attrs = closest.attributes;
    return {
      apn: String(attrs.apn || ''),
      lon: Number(attrs.long),
      lat: Number(attrs.lat),
      address: String(attrs.fulladdress || ''),
    };
  } catch {
    return undefined;
  }
}

// Query parcel by APN (attribute query - faster and more reliable than spatial)
async function queryParcelByAPN(apn: string): Promise<ArcGISFeature | undefined> {
  const params = new URLSearchParams({
    where: `parcelid = '${apn}'`,
    outFields: '*',
    returnGeometry: 'true',
    f: 'json',
  });

  try {
    const response = await fetch(`${LAYERS.parcels}/query?${params}`);
    if (!response.ok) return undefined;

    const data: ArcGISQueryResponse = await response.json();
    if (data.error || !data.features?.length) return undefined;

    return data.features[0];
  } catch {
    return undefined;
  }
}

async function queryParcel(
  lon: number,
  lat: number,
  addressString?: string
): Promise<ParcelData | undefined> {
  // First try to find address point - by string if provided, else spatially
  const addressPoint = await queryAddressPoint(lon, lat, addressString);

  let feature: ArcGISFeature | undefined;

  // If we have an APN from address point, query by attribute (preferred)
  if (addressPoint?.apn) {
    feature = await queryParcelByAPN(addressPoint.apn);
  }

  // Fallback to spatial query if no APN or attribute query failed
  if (!feature) {
    const queryLon = addressPoint?.lon ?? lon;
    const queryLat = addressPoint?.lat ?? lat;
    const features = await queryArcGISPoint(LAYERS.parcels, queryLon, queryLat);
    if (features.length > 0) {
      feature = features[0];
    }
  }

  if (!feature) return undefined;

  const attrs = feature.attributes;

  // Field mappings for Solano County Parcels_Public_Aumentum service
  const apn = String(attrs.parcelid || attrs.APN || attrs.PARCEL_NUM || 'Unknown');
  // Use address from address point if available (more specific), else parcel site address
  const address = addressPoint?.address || (attrs.p_address ? String(attrs.p_address) : undefined);

  // Acreage fields - try multiple variations
  let acreage: number | undefined;
  if (typeof attrs.acres === 'number') acreage = attrs.acres;
  else if (typeof attrs.lotsize === 'number') acreage = attrs.lotsize / 43560;
  else if (typeof attrs.gis_acre === 'number') acreage = attrs.gis_acre;

  let sqft: number | undefined;
  if (typeof attrs.lotsize === 'number') sqft = attrs.lotsize;
  else if (acreage) sqft = Math.round(acreage * 43560);

  // Extract additional useful fields from parcel data
  const useCode = attrs.usecode ? String(attrs.usecode) : undefined;
  const useDescription = attrs.use_desc ? String(attrs.use_desc) : undefined;
  const yearBuilt = typeof attrs.yrbuilt === 'number' && attrs.yrbuilt > 0 ? attrs.yrbuilt : undefined;
  const zoning = attrs.zone1 ? String(attrs.zone1) : undefined;

  // Extract district info from parcel attributes
  const schoolDistrict = attrs.d_school ? String(attrs.d_school) : undefined;
  const fireDistrict = attrs.desc_fire ? String(attrs.desc_fire) : undefined;
  const waterDistrict = attrs.desc_water ? String(attrs.desc_water) : undefined;
  const taxAreaCode = attrs.tac ? String(attrs.tac) : undefined;
  const taxAreaCity = attrs.tac_city ? String(attrs.tac_city) : undefined;

  return {
    apn,
    address,
    acreage,
    sqft,
    useCode,
    useDescription,
    yearBuilt,
    zoning,
    schoolDistrict,
    fireDistrict,
    waterDistrict,
    taxAreaCode,
    taxAreaCity,
    geometry: feature.geometry?.rings
      ? arcgisRingsToGeoJSON(feature.geometry.rings)
      : { type: 'Polygon', coordinates: [] },
  };
}

async function queryZoning(lon: number, lat: number): Promise<ZoningData | undefined> {
  const features = await queryArcGISPoint(LAYERS.zoning, lon, lat);

  if (features.length === 0) return undefined;

  const attrs = features[0].attributes;

  // Field mappings for SolanoCountyZoning_092322 service
  return {
    code: String(attrs.zone_abbr || attrs.zoning || attrs.ZONE_CODE || 'Unknown'),
    description: String(attrs.zone_name || attrs.zone_desc || attrs.DESCRIPTION || ''),
    source: {
      title: 'Solano County Zoning',
      layer: 'SolanoCountyZoning_092322',
      url: LAYERS.zoning,
    },
  };
}

async function queryGeneralPlan(lon: number, lat: number): Promise<GeneralPlanData | undefined> {
  const features = await queryArcGISPoint(LAYERS.generalPlan, lon, lat);

  if (features.length === 0) return undefined;

  const attrs = features[0].attributes;

  // Field mappings for SolanoCountyUnincorporated_GeneralPlan2008 service
  // For incorporated areas, gplu will be 'INC'
  const designation = String(attrs.gplu || attrs.GP_DESIG || attrs.DESIGNATION || 'Unknown');
  const description = String(attrs.gp_desc || attrs.name || attrs.DESCRIPTION || '');

  return {
    designation,
    description,
    source: {
      title: 'Solano County General Plan',
      layer: 'SolanoCountyUnincorporated_GeneralPlan2008',
      url: LAYERS.generalPlan,
    },
  };
}

async function queryJurisdiction(lon: number, lat: number): Promise<JurisdictionData> {
  const features = await queryArcGISPoint(LAYERS.cities, lon, lat);

  const isIncorporated = features.length > 0;
  // Field mapping for CityBoundary service - 'name' is the city name field
  const cityName = isIncorporated
    ? String(features[0].attributes.name || features[0].attributes.NAME || 'Unknown City')
    : undefined;

  return {
    county: 'Solano County',
    city: cityName,
    incorporated: isIncorporated,
    source: {
      title: 'Solano County City Boundaries',
      layer: 'CityBoundary',
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
  // Query both SRA (State Responsibility Area) and LRA (Local Responsibility Area) layers
  const [sraFeatures, lraFeatures] = await Promise.all([
    queryArcGISPoint(CALFIRE_FHSZ_SRA_URL, lon, lat),
    queryArcGISPoint(CALFIRE_FHSZ_LRA_URL, lon, lat),
  ]);

  // Use whichever layer returns data (location can only be in one)
  const features = sraFeatures.length > 0 ? sraFeatures : lraFeatures;
  const sourceUrl = sraFeatures.length > 0 ? CALFIRE_FHSZ_SRA_URL : CALFIRE_FHSZ_LRA_URL;

  if (features.length === 0) {
    return {
      type: 'fire',
      zone: 'None',
      severity: 'none',
      description: 'Not in a designated fire hazard severity zone',
      source: {
        title: 'CAL FIRE Fire Hazard Severity Zones',
        url: CALFIRE_FHSZ_SRA_URL,
      },
    };
  }

  const attrs = features[0].attributes;
  // Field mappings: SRA uses HAZ_CODE/HAZ_CLASS, LRA may use different fields
  const hazardClass = String(
    attrs.HAZ_CLASS || attrs.HAZ_CODE || attrs.SRA22_2 || attrs.FHSZ || 'Unknown'
  );

  let severity: HazardData['severity'] = 'moderate';
  const hazardLower = hazardClass.toLowerCase();
  if (hazardLower.includes('very high') || hazardClass === '3' || hazardClass === 'VHFHSZ') {
    severity = 'very_high';
  } else if (hazardLower.includes('high') || hazardClass === '2' || hazardClass === 'HFHSZ') {
    severity = 'high';
  } else if (hazardLower.includes('moderate') || hazardClass === '1' || hazardClass === 'MFHSZ') {
    severity = 'moderate';
  }

  return {
    type: 'fire',
    zone: hazardClass,
    severity,
    description: `Fire Hazard Severity: ${hazardClass}`,
    source: {
      title: 'CAL FIRE Fire Hazard Severity Zones',
      url: sourceUrl,
    },
  };
}

async function queryDistricts(lon: number, lat: number): Promise<DistrictData[]> {
  const districts: DistrictData[] = [];

  // Query supervisorial district - BOS_District_Boundaries_2021 service
  const supFeatures = await queryArcGISPoint(LAYERS.supervisorialDistricts, lon, lat);
  if (supFeatures.length > 0) {
    const attrs = supFeatures[0].attributes;
    // Field mapping: 'district' is the district number
    const districtNum = attrs.district || attrs.DISTRICT || attrs.id;
    districts.push({
      type: 'supervisorial',
      name: `District ${districtNum}`,
      source: {
        title: 'Solano County Board of Supervisors Districts',
        url: LAYERS.supervisorialDistricts,
      },
    });
  }

  // Query school/college district - CommunityCollegeDistricts_2022 service
  const schoolFeatures = await queryArcGISPoint(LAYERS.schoolDistricts, lon, lat);
  if (schoolFeatures.length > 0) {
    const attrs = schoolFeatures[0].attributes;
    districts.push({
      type: 'school',
      name: String(attrs.name || attrs.NAME || attrs.DISTRICT || 'Unknown'),
      source: {
        title: 'Community College Districts',
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

export async function queryAllGISData(
  lon: number,
  lat: number,
  addressString?: string
): Promise<GISQueryResult> {
  // Run queries in parallel for performance
  const [parcel, zoning, generalPlan, jurisdiction, floodHazard, fireHazard, spatialDistricts] =
    await Promise.all([
      queryParcel(lon, lat, addressString),
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

  // Build districts - prioritize parcel data (more reliable names) over spatial queries
  const districts: DistrictData[] = [];

  // Add school district from parcel data first (has actual school name)
  if (parcel?.schoolDistrict) {
    districts.push({
      type: 'school',
      name: parcel.schoolDistrict.trim(),
      source: {
        title: 'Solano County Parcels',
        layer: 'Parcels_Public_Aumentum',
      },
    });
  }

  // Add supervisorial district from spatial query (not in parcel data)
  const supervisorialDistrict = spatialDistricts.find((d) => d.type === 'supervisorial');
  if (supervisorialDistrict) {
    districts.push(supervisorialDistrict);
  }

  // Add fire district from parcel data
  if (parcel?.fireDistrict && parcel.fireDistrict.trim()) {
    districts.push({
      type: 'fire',
      name: parcel.fireDistrict.trim(),
      source: {
        title: 'Solano County Parcels',
        layer: 'Parcels_Public_Aumentum',
      },
    });
  }

  // Add water district from parcel data
  if (parcel?.waterDistrict && parcel.waterDistrict.trim()) {
    districts.push({
      type: 'water',
      name: parcel.waterDistrict.trim(),
      source: {
        title: 'Solano County Parcels',
        layer: 'Parcels_Public_Aumentum',
      },
    });
  }

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

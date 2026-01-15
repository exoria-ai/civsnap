// InfographicSpec - The core data contract
// All rendering flows through this single structured object
// AI never computes facts — it only styles/transforms what the spec provides

export type DataSource = {
  title: string;
  layer?: string;
  url?: string;
};

export type Fact = {
  id: string;           // e.g., "zoning", "flood_zone"
  label: string;        // display label
  value: string;        // authoritative value
  plainLanguage?: string; // AI-transformed (Template 2 only)
  source: DataSource;
};

export type NearbyPoint = {
  label: string;
  category: 'school' | 'park' | 'transit' | 'fire_station' | 'hospital' | 'other';
  distanceMi: number;
  point: GeoJSON.Point;
};

export type MapImage = {
  url: string;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
};

export type InfographicSpec = {
  templateId: 'address-snapshot' | 'plain-language' | 'neighbor-notification';
  generatedAt: string; // ISO timestamp

  inputs: {
    address?: string;
    apn?: string;
    latLon?: [number, number];
    options: Record<string, boolean | string>;
  };

  facts: Fact[];

  geometry: {
    subjectParcel?: GeoJSON.Feature;
    buffer?: GeoJSON.Feature;
    overlays?: GeoJSON.Feature[];
    nearbyPoints?: NearbyPoint[];
  };

  mapImages: {
    main: MapImage;
    inset?: MapImage;
  };

  copy: {
    title: string;
    subtitle?: string;
    disclaimer: string;
    sources: string[];
  };
};

// Template definitions
export type TemplateOption = {
  id: string;
  label: string;
  type: 'boolean' | 'select' | 'number';
  default: boolean | string | number;
  options?: { value: string; label: string }[];
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  options: TemplateOption[];
};

// Geocoding response
export type GeocodeResult = {
  lat: number;
  lon: number;
  standardizedAddress: string;
  matchQuality: 'exact' | 'interpolated' | 'approximate' | 'no_match';
  components?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

// GIS Query responses
export type ParcelData = {
  apn: string;
  address?: string;
  acreage?: number;
  sqft?: number;
  useCode?: string;
  useDescription?: string;
  yearBuilt?: number;
  zoning?: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};

export type ZoningData = {
  code: string;
  description: string;
  source: DataSource;
};

export type GeneralPlanData = {
  designation: string;
  description: string;
  source: DataSource;
};

export type JurisdictionData = {
  county: string;
  city?: string;
  incorporated: boolean;
  source: DataSource;
};

export type HazardData = {
  type: 'flood' | 'fire' | 'environmental';
  zone: string;
  severity: 'low' | 'moderate' | 'high' | 'very_high' | 'none';
  description: string;
  source: DataSource;
};

export type DistrictData = {
  type: 'supervisorial' | 'school' | 'fire' | 'water' | 'other';
  name: string;
  source: DataSource;
};

// Full GIS query result
export type GISQueryResult = {
  parcel?: ParcelData;
  zoning?: ZoningData;
  generalPlan?: GeneralPlanData;
  jurisdiction?: JurisdictionData;
  hazards: HazardData[];
  districts: DistrictData[];
  nearbyPoints: NearbyPoint[];
};

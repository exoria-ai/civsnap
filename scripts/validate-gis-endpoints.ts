/**
 * GIS Endpoint Validation Script
 *
 * Probes all configured GIS endpoints to verify:
 * 1. Endpoint is reachable
 * 2. Returns data for a test point
 * 3. Reports available field names
 *
 * Run with: npm run validate:gis
 */

// Test point: 675 Texas St, Fairfield, CA (Solano County Admin Building)
// Geocoded coordinates from US Census Geocoder
const TEST_POINT = {
  lon: -122.041410566568,
  lat: 38.24916053813,
  description: '675 W Texas St, Fairfield, CA (County Admin)',
};

// Alternative test points
const TEST_POINTS = [
  { lon: -122.041410566568, lat: 38.24916053813, description: 'Fairfield County Admin' },
  { lon: -122.2566, lat: 38.1041, description: 'Vallejo, CA' },
  { lon: -121.9358, lat: 38.3566, description: 'Vacaville, CA' },
];

type EndpointConfig = {
  name: string;
  url: string;
  description: string;
};

const SOLANO_BASE = 'https://services2.arcgis.com/SCn6czzcqKAFwdGU/ArcGIS/rest/services';

const ENDPOINTS: EndpointConfig[] = [
  // Solano County endpoints (ArcGIS Online hosted)
  {
    name: 'Solano Address Points',
    url: `${SOLANO_BASE}/Address_Points/FeatureServer/0`,
    description: 'Address centroids with APN (for parcel lookups)',
  },
  {
    name: 'Solano Parcels',
    url: `${SOLANO_BASE}/Parcels_Public_Aumentum/FeatureServer/0`,
    description: 'Parcel boundaries and APN data',
  },
  {
    name: 'Solano Zoning (Unincorporated)',
    url: `${SOLANO_BASE}/SolanoCountyZoning_092322/FeatureServer/4`,
    description: 'County zoning for unincorporated areas',
  },
  {
    name: 'Solano General Plan',
    url: `${SOLANO_BASE}/SolanoCountyUnincorporated_GeneralPlan2008_updated0923/FeatureServer/0`,
    description: 'General plan land use',
  },
  {
    name: 'Solano City Boundaries',
    url: `${SOLANO_BASE}/CityBoundary/FeatureServer/2`,
    description: 'City boundaries (incorporated areas)',
  },
  {
    name: 'Solano BOS Districts',
    url: `${SOLANO_BASE}/BOS_District_Boundaries_2021/FeatureServer/0`,
    description: 'Board of Supervisors district boundaries',
  },
  {
    name: 'Community College Districts',
    url: `${SOLANO_BASE}/CommunityCollegeDistricts_2022/FeatureServer/0`,
    description: 'Community college district boundaries',
  },
  // Federal/State endpoints
  {
    name: 'FEMA Flood Zones',
    url: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28',
    description: 'FEMA National Flood Hazard Layer',
  },
  {
    name: 'CAL FIRE FHSZ (SRA)',
    url: 'https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/0',
    description: 'Fire Hazard Severity Zones - State Responsibility Area',
  },
  {
    name: 'CAL FIRE FHSZ (LRA)',
    url: 'https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/1',
    description: 'Fire Hazard Severity Zones - Local Responsibility Area',
  },
];

type QueryResult = {
  endpoint: EndpointConfig;
  success: boolean;
  error?: string;
  featureCount: number;
  fields: string[];
  sampleAttributes?: Record<string, unknown>;
  responseTimeMs: number;
};

async function queryEndpoint(
  endpoint: EndpointConfig,
  lon: number,
  lat: number
): Promise<QueryResult> {
  const startTime = Date.now();

  const params = new URLSearchParams({
    geometry: JSON.stringify({ x: lon, y: lat }),
    geometryType: 'esriGeometryPoint',
    inSR: '4326', // Input coordinates are WGS84
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
  });

  try {
    const response = await fetch(`${endpoint.url}/query?${params}`, {
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        endpoint,
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        featureCount: 0,
        fields: [],
        responseTimeMs,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        endpoint,
        success: false,
        error: data.error.message || JSON.stringify(data.error),
        featureCount: 0,
        fields: [],
        responseTimeMs,
      };
    }

    const features = data.features || [];
    const fields = features.length > 0 ? Object.keys(features[0].attributes || {}) : [];

    return {
      endpoint,
      success: true,
      featureCount: features.length,
      fields,
      sampleAttributes: features.length > 0 ? features[0].attributes : undefined,
      responseTimeMs,
    };
  } catch (error) {
    return {
      endpoint,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      featureCount: 0,
      fields: [],
      responseTimeMs: Date.now() - startTime,
    };
  }
}

async function validateGeocoder(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('GEOCODER VALIDATION');
  console.log('='.repeat(60));

  const testAddress = '600 Texas St, Fairfield, CA 94533';
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(testAddress)}&benchmark=Public_AR_Current&format=json`;

  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const data = await response.json();
    const responseTimeMs = Date.now() - startTime;

    if (data.result?.addressMatches?.length > 0) {
      const match = data.result.addressMatches[0];
      console.log(`\n  US Census Geocoder: ${match.matchedAddress}`);
      console.log(`  Coordinates: ${match.coordinates.x}, ${match.coordinates.y}`);
      console.log(`  Response time: ${responseTimeMs}ms`);
    } else {
      console.log(`\n  US Census Geocoder: No match found for "${testAddress}"`);
    }
  } catch (error) {
    console.log(`\n  US Census Geocoder: ERROR - ${error instanceof Error ? error.message : error}`);
  }
}

async function main(): Promise<void> {
  console.log('GIS Endpoint Validation');
  console.log('='.repeat(60));
  console.log(`Test Point: ${TEST_POINT.description}`);
  console.log(`Coordinates: ${TEST_POINT.lon}, ${TEST_POINT.lat}`);
  console.log('='.repeat(60));

  // Validate geocoder first
  await validateGeocoder();

  // Query all GIS endpoints
  console.log('\n' + '='.repeat(60));
  console.log('GIS ENDPOINT RESULTS');
  console.log('='.repeat(60));

  const results: QueryResult[] = [];

  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`\nQuerying ${endpoint.name}...`);
    const result = await queryEndpoint(endpoint, TEST_POINT.lon, TEST_POINT.lat);
    results.push(result);

    if (result.success) {
      console.log(` OK (${result.responseTimeMs}ms)`);
    } else {
      console.log(` FAILED (${result.responseTimeMs}ms)`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const successCount = results.filter((r) => r.success && r.featureCount > 0).length;
  const reachableCount = results.filter((r) => r.success).length;

  console.log(`\nEndpoints reachable: ${reachableCount}/${results.length}`);
  console.log(`Endpoints returning data: ${successCount}/${results.length}`);

  // Detailed results
  console.log('\n' + '-'.repeat(60));

  for (const result of results) {
    const status = result.success
      ? result.featureCount > 0
        ? 'DATA'
        : 'EMPTY'
      : 'ERROR';
    const statusIcon = status === 'DATA' ? '✅' : status === 'EMPTY' ? '⚠️' : '❌';

    console.log(`\n${statusIcon} ${result.endpoint.name}`);
    console.log(`   URL: ${result.endpoint.url}`);
    console.log(`   Status: ${status} | Features: ${result.featureCount} | Time: ${result.responseTimeMs}ms`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.fields.length > 0) {
      console.log(`   Fields: ${result.fields.join(', ')}`);
    }

    if (result.sampleAttributes) {
      console.log(`   Sample data:`);
      const attrs = result.sampleAttributes;
      // Show first 5 non-null attributes
      const nonNullAttrs = Object.entries(attrs)
        .filter(([, v]) => v !== null && v !== '')
        .slice(0, 5);
      for (const [key, value] of nonNullAttrs) {
        console.log(`     ${key}: ${value}`);
      }
    }
  }

  // Exit with error if any endpoints failed completely
  const criticalFailures = results.filter((r) => !r.success);
  if (criticalFailures.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('WARNING: Some endpoints failed to respond');
    console.log('='.repeat(60));
  }
}

main().catch(console.error);

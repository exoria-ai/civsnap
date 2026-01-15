/**
 * Test Fixtures
 *
 * Known good addresses and expected data for integration tests.
 * These are real Solano County locations used to validate the pipeline.
 */

export type TestAddress = {
  input: string;
  description: string;
  expectedCoords: {
    lat: number;
    lon: number;
    tolerance: number; // degrees
  };
  expectedJurisdiction: {
    incorporated: boolean;
    city?: string;
  };
};

export const TEST_ADDRESSES: TestAddress[] = [
  {
    input: '600 Texas St, Fairfield, CA 94533',
    description: 'Fairfield City Hall - incorporated, downtown',
    expectedCoords: {
      lat: 38.249,
      lon: -122.039,
      tolerance: 0.01,
    },
    expectedJurisdiction: {
      incorporated: true,
      city: 'Fairfield',
    },
  },
  {
    input: '400 Georgia St, Vallejo, CA 94590',
    description: 'Vallejo City Hall - incorporated',
    expectedCoords: {
      lat: 38.104,
      lon: -122.257,
      tolerance: 0.01,
    },
    expectedJurisdiction: {
      incorporated: true,
      city: 'Vallejo',
    },
  },
  {
    input: '650 Merchant St, Vacaville, CA 95688',
    description: 'Vacaville City Hall - incorporated',
    expectedCoords: {
      lat: 38.356,
      lon: -121.987,
      tolerance: 0.01,
    },
    expectedJurisdiction: {
      incorporated: true,
      city: 'Vacaville',
    },
  },
];

// Test point for GIS queries (Downtown Fairfield)
export const GIS_TEST_POINT = {
  lon: -122.0388,
  lat: 38.2494,
  description: 'Downtown Fairfield, CA',
};

// Known bad addresses for error handling tests
export const BAD_ADDRESSES = [
  '123 Fake Street, Nowhere, XX 00000',
  'asdfghjkl',
  '',
];

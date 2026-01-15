/**
 * Geocoder Integration Tests
 *
 * Tests the US Census Geocoder with real network requests.
 * These tests verify that the geocoding service is available
 * and returns expected results for known addresses.
 */

import { describe, it, expect } from 'vitest';
import { geocodeAddress } from '../src/lib/geocode';
import { TEST_ADDRESSES, BAD_ADDRESSES } from './fixtures';

describe('Geocoder Integration', () => {
  describe('geocodeAddress', () => {
    it('should geocode a known Fairfield address', async () => {
      const testAddr = TEST_ADDRESSES[0];
      const result = await geocodeAddress(testAddr.input);

      expect(result.matchQuality).not.toBe('no_match');
      expect(result.lat).toBeCloseTo(testAddr.expectedCoords.lat, 1);
      expect(result.lon).toBeCloseTo(testAddr.expectedCoords.lon, 1);
      expect(result.standardizedAddress).toBeTruthy();
    });

    it('should geocode a known Vallejo address', async () => {
      const testAddr = TEST_ADDRESSES[1];
      const result = await geocodeAddress(testAddr.input);

      expect(result.matchQuality).not.toBe('no_match');
      expect(result.lat).toBeCloseTo(testAddr.expectedCoords.lat, 1);
      expect(result.lon).toBeCloseTo(testAddr.expectedCoords.lon, 1);
    });

    it('should geocode a known Vacaville address', async () => {
      const testAddr = TEST_ADDRESSES[2];
      const result = await geocodeAddress(testAddr.input);

      expect(result.matchQuality).not.toBe('no_match');
      expect(result.lat).toBeCloseTo(testAddr.expectedCoords.lat, 1);
      expect(result.lon).toBeCloseTo(testAddr.expectedCoords.lon, 1);
    });

    it('should return no_match for invalid addresses', async () => {
      const result = await geocodeAddress(BAD_ADDRESSES[0]);
      expect(result.matchQuality).toBe('no_match');
    });

    it('should include address components when matched', async () => {
      const result = await geocodeAddress(TEST_ADDRESSES[0].input);

      if (result.matchQuality !== 'no_match') {
        expect(result.components).toBeDefined();
        expect(result.components?.state).toBe('CA');
      }
    });
  });

  describe('Geocoder service availability', () => {
    it('should respond within 10 seconds', async () => {
      const startTime = Date.now();
      await geocodeAddress(TEST_ADDRESSES[0].input);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(10000);
    });
  });
});

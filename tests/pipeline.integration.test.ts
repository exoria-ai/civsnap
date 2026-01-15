/**
 * Full Pipeline Integration Tests
 *
 * End-to-end tests that verify the complete flow:
 * Address → Geocode → GIS Queries → Spec Builder → InfographicSpec
 *
 * These are smoke tests to ensure the pipeline produces valid output.
 */

import { describe, it, expect } from 'vitest';
import { geocodeAddress } from '../src/lib/geocode';
import { queryAllGISData } from '../src/lib/gis-queries';
import { buildInfographicSpec } from '../src/lib/spec-builder';
import { InfographicSpec } from '../src/lib/types';
import { TEST_ADDRESSES } from './fixtures';

describe('Pipeline Integration', () => {
  describe('Full address-to-spec pipeline', () => {
    it('should produce a valid InfographicSpec for Fairfield address', async () => {
      const testAddr = TEST_ADDRESSES[0];

      // Step 1: Geocode
      const geocodeResult = await geocodeAddress(testAddr.input);
      expect(geocodeResult.matchQuality).not.toBe('no_match');

      // Step 2: Query GIS
      const gisData = await queryAllGISData(geocodeResult.lon, geocodeResult.lat);
      expect(gisData).toBeDefined();

      // Step 3: Build spec
      const spec: InfographicSpec = buildInfographicSpec({
        templateId: 'address-snapshot',
        geocodeResult,
        gisData,
        options: {},
      });

      // Validate spec structure
      expect(spec.templateId).toBe('address-snapshot');
      expect(spec.generatedAt).toBeTruthy();
      expect(spec.inputs.address).toBeTruthy();
      expect(spec.inputs.latLon).toBeDefined();
      expect(spec.facts).toBeDefined();
      expect(Array.isArray(spec.facts)).toBe(true);
      expect(spec.geometry).toBeDefined();
      expect(spec.mapImages).toBeDefined();
      expect(spec.copy).toBeDefined();
      expect(spec.copy.title).toBeTruthy();
      expect(spec.copy.disclaimer).toBeTruthy();
      expect(spec.copy.sources).toBeDefined();
    });

    it('should include hazard facts in the spec', async () => {
      const testAddr = TEST_ADDRESSES[0];
      const geocodeResult = await geocodeAddress(testAddr.input);
      const gisData = await queryAllGISData(geocodeResult.lon, geocodeResult.lat);
      const spec = buildInfographicSpec({
        templateId: 'address-snapshot',
        geocodeResult,
        gisData,
        options: {},
      });

      // Should have flood and fire hazard facts
      const hazardFacts = spec.facts.filter((f) => f.id.startsWith('hazard_'));
      expect(hazardFacts.length).toBeGreaterThanOrEqual(2);

      const floodFact = spec.facts.find((f) => f.id === 'hazard_flood');
      expect(floodFact).toBeDefined();
      expect(floodFact?.source.title).toContain('FEMA');

      const fireFact = spec.facts.find((f) => f.id === 'hazard_fire');
      expect(fireFact).toBeDefined();
      expect(fireFact?.source.title).toContain('CAL FIRE');
    });

    it('should include jurisdiction facts', async () => {
      const testAddr = TEST_ADDRESSES[0];
      const geocodeResult = await geocodeAddress(testAddr.input);
      const gisData = await queryAllGISData(geocodeResult.lon, geocodeResult.lat);
      const spec = buildInfographicSpec({
        templateId: 'address-snapshot',
        geocodeResult,
        gisData,
        options: {},
      });

      const countyFact = spec.facts.find((f) => f.id === 'county');
      expect(countyFact).toBeDefined();
      expect(countyFact?.value).toBe('Solano County');
    });

    it('should include nearby points in geometry', async () => {
      const testAddr = TEST_ADDRESSES[0];
      const geocodeResult = await geocodeAddress(testAddr.input);
      const gisData = await queryAllGISData(geocodeResult.lon, geocodeResult.lat);
      const spec = buildInfographicSpec({
        templateId: 'address-snapshot',
        geocodeResult,
        gisData,
        options: {},
      });

      expect(spec.geometry.nearbyPoints).toBeDefined();
      expect(spec.geometry.nearbyPoints!.length).toBeGreaterThan(0);
    });

    it('should include data sources in copy', async () => {
      const testAddr = TEST_ADDRESSES[0];
      const geocodeResult = await geocodeAddress(testAddr.input);
      const gisData = await queryAllGISData(geocodeResult.lon, geocodeResult.lat);
      const spec = buildInfographicSpec({
        templateId: 'address-snapshot',
        geocodeResult,
        gisData,
        options: {},
      });

      expect(spec.copy.sources.length).toBeGreaterThan(0);
      // Should cite Solano County
      expect(spec.copy.sources.some((s) => s.includes('Solano'))).toBe(true);
    });
  });

  describe('Pipeline performance', () => {
    it('should complete full pipeline within 30 seconds', async () => {
      const testAddr = TEST_ADDRESSES[0];
      const startTime = Date.now();

      const geocodeResult = await geocodeAddress(testAddr.input);
      const gisData = await queryAllGISData(geocodeResult.lon, geocodeResult.lat);
      buildInfographicSpec({
        templateId: 'address-snapshot',
        geocodeResult,
        gisData,
        options: {},
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(30000);

      console.log(`Pipeline completed in ${elapsed}ms`);
    });
  });

  describe('Error handling', () => {
    it('should handle geocoding failure gracefully', async () => {
      const result = await geocodeAddress('asdfghjkl not a real address 12345');
      expect(result.matchQuality).toBe('no_match');
    });

    it('should still produce spec even if some GIS queries fail', async () => {
      // Use a valid location - GIS queries may return partial data
      const geocodeResult = await geocodeAddress(TEST_ADDRESSES[0].input);
      const gisData = await queryAllGISData(geocodeResult.lon, geocodeResult.lat);

      // Even if parcel/zoning queries fail, we should get a spec
      const spec = buildInfographicSpec({
        templateId: 'address-snapshot',
        geocodeResult,
        gisData,
        options: {},
      });

      // Basic structure should always be present
      expect(spec.templateId).toBe('address-snapshot');
      expect(spec.generatedAt).toBeTruthy();
      expect(spec.copy.disclaimer).toBeTruthy();
    });
  });
});

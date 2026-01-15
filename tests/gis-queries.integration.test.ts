/**
 * GIS Queries Integration Tests
 *
 * Tests the GIS query functions with real network requests.
 * These tests verify endpoint availability and data structure.
 *
 * Note: Some tests may fail if county endpoints are unavailable
 * or have changed their schema. The validation script provides
 * more detailed diagnostics.
 */

import { describe, it, expect } from 'vitest';
import { queryAllGISData } from '../src/lib/gis-queries';
import { GIS_TEST_POINT } from './fixtures';

describe('GIS Queries Integration', () => {
  describe('queryAllGISData', () => {
    it('should return a valid GISQueryResult structure', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      // Structure checks - these should always pass
      expect(result).toHaveProperty('hazards');
      expect(result).toHaveProperty('districts');
      expect(result).toHaveProperty('nearbyPoints');
      expect(Array.isArray(result.hazards)).toBe(true);
      expect(Array.isArray(result.districts)).toBe(true);
      expect(Array.isArray(result.nearbyPoints)).toBe(true);
    });

    it('should return jurisdiction data', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      // Jurisdiction should always be returned (even if cities layer fails)
      expect(result.jurisdiction).toBeDefined();
      expect(result.jurisdiction?.county).toBe('Solano County');
    });

    it('should return flood hazard data from FEMA', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      const floodHazard = result.hazards.find((h) => h.type === 'flood');
      expect(floodHazard).toBeDefined();
      expect(floodHazard?.source.title).toContain('FEMA');
    });

    it('should return fire hazard data from CAL FIRE', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      const fireHazard = result.hazards.find((h) => h.type === 'fire');
      expect(fireHazard).toBeDefined();
      expect(fireHazard?.source.title).toContain('CAL FIRE');
    });

    it('should return nearby points (demo data)', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      // Currently using demo data, so should always have points
      expect(result.nearbyPoints.length).toBeGreaterThan(0);
      expect(result.nearbyPoints[0]).toHaveProperty('label');
      expect(result.nearbyPoints[0]).toHaveProperty('category');
      expect(result.nearbyPoints[0]).toHaveProperty('distanceMi');
      expect(result.nearbyPoints[0]).toHaveProperty('point');
    });

    it('should complete within 30 seconds', async () => {
      const startTime = Date.now();
      await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(30000);
    });
  });

  describe('Solano County Endpoints (may fail if services unavailable)', () => {
    it('should return parcel data if endpoint available', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      // This may be undefined if the Solano County endpoint is down or has different schema
      if (result.parcel) {
        expect(result.parcel.apn).toBeTruthy();
        expect(result.parcel.geometry).toBeDefined();
      } else {
        console.warn('Parcel data not returned - endpoint may be unavailable');
      }
    });

    it('should return zoning data if endpoint available', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      if (result.zoning) {
        expect(result.zoning.code).toBeTruthy();
        expect(result.zoning.source).toBeDefined();
      } else {
        console.warn('Zoning data not returned - endpoint may be unavailable');
      }
    });

    it('should return general plan data if endpoint available', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      if (result.generalPlan) {
        expect(result.generalPlan.designation).toBeTruthy();
        expect(result.generalPlan.source).toBeDefined();
      } else {
        console.warn('General plan data not returned - endpoint may be unavailable');
      }
    });

    it('should return district data if endpoints available', async () => {
      const result = await queryAllGISData(GIS_TEST_POINT.lon, GIS_TEST_POINT.lat);

      if (result.districts.length > 0) {
        const district = result.districts[0];
        expect(district.type).toBeTruthy();
        expect(district.name).toBeTruthy();
        expect(district.source).toBeDefined();
      } else {
        console.warn('District data not returned - endpoints may be unavailable');
      }
    });
  });
});

import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocode';
import { queryAllGISData } from '@/lib/gis-queries';
import { buildInfographicSpec } from '@/lib/spec-builder';
import { InfographicSpec } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, templateId, options = {} } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      );
    }

    // Step 1: Geocode the address
    const geocodeResult = await geocodeAddress(address);

    if (geocodeResult.matchQuality === 'no_match') {
      return NextResponse.json(
        { error: 'Address not found. Please check the address and try again.' },
        { status: 404 }
      );
    }

    // Step 2: Query GIS data (pass address for better address point matching)
    const gisData = await queryAllGISData(geocodeResult.lon, geocodeResult.lat, address);

    // Step 3: Build the infographic spec
    const spec: InfographicSpec = buildInfographicSpec({
      templateId: templateId as InfographicSpec['templateId'],
      geocodeResult,
      gisData,
      options,
    });

    return NextResponse.json(spec);
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate infographic' },
      { status: 500 }
    );
  }
}

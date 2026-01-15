import { NextRequest, NextResponse } from 'next/server';
import { queryAllGISData } from '@/lib/gis-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon } = body;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json(
        { error: 'lat and lon are required as numbers' },
        { status: 400 }
      );
    }

    const result = await queryAllGISData(lon, lat);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GIS query error:', error);
    return NextResponse.json(
      { error: 'Failed to query GIS data' },
      { status: 500 }
    );
  }
}

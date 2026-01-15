import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocode';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);

    if (result.matchQuality === 'no_match') {
      return NextResponse.json(
        { error: 'Address not found', result },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
}

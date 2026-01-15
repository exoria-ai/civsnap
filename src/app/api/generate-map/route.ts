import { NextRequest, NextResponse } from 'next/server';
import { generateMapImage, styleMapImage } from '@/lib/fal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, baseMapUrl, bufferDistanceFt = 500 } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    let result;

    if (baseMapUrl) {
      // Image-to-image: Style an existing map
      result = await styleMapImage(baseMapUrl, {
        address,
        bufferDistanceFt,
      });
    } else {
      // Text-to-image: Generate from scratch
      result = await generateMapImage({
        address,
        bufferDistanceFt,
      });
    }

    return NextResponse.json({
      success: true,
      image: result,
    });
  } catch (error) {
    console.error('Map generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate map' },
      { status: 500 }
    );
  }
}

import { fal } from '@fal-ai/client';

// Configure FAL client
fal.config({
  credentials: process.env.FAL_API_KEY,
});

type MapGenerationInput = {
  address: string;
  parcelBounds?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  bufferDistanceFt?: number;
};

type MapImageResult = {
  url: string;
  width: number;
  height: number;
};

/**
 * Generate an AI-styled map image using FAL Nano Banana Pro.
 * Creates a professional "county handout" style map visualization.
 */
export async function generateMapImage(input: MapGenerationInput): Promise<MapImageResult> {
  const { address, bufferDistanceFt = 500 } = input;

  // Build a detailed prompt for the map generation
  const prompt = `Create a professional, clean map illustration in the style of a county government planning document. The map should show:

- A grayscale/light blue base map with subtle street grid
- A highlighted subject parcel polygon in a distinct blue color (#3B82F6)
- A ${bufferDistanceFt}ft buffer ring around the parcel (thin dashed line)
- 3-5 nearby street labels in a clean sans-serif font
- A north arrow indicator in the bottom right
- A scale bar showing ${bufferDistanceFt}ft
- The text "Illustrative map (not authoritative)" watermarked across the center

Style: Clean, professional, high-legibility county handout. Muted colors (grays, blues). No decorative elements.
Location context: ${address}

The map should look like it belongs in an official property report document.`;

  try {
    const result = await fal.subscribe('fal-ai/nano-banana-pro', {
      input: {
        prompt,
        aspect_ratio: '4:3',
        output_format: 'png',
        resolution: '1K',
      },
    });

    const image = result.data.images[0];
    return {
      url: image.url,
      width: 1024,
      height: 768,
    };
  } catch (error) {
    console.error('FAL map generation error:', error);
    throw new Error('Failed to generate map image');
  }
}

/**
 * Generate an AI-styled map image using image-to-image editing.
 * Takes a base map image and transforms it into the county handout style.
 */
export async function styleMapImage(
  baseMapUrl: string,
  options: {
    address: string;
    bufferDistanceFt?: number;
  }
): Promise<MapImageResult> {
  const { address, bufferDistanceFt = 500 } = options;

  const prompt = `Transform this map into a professional county government planning document style:
- Convert to clean grayscale/light blue color scheme
- Enhance parcel boundaries with distinct blue highlighting
- Add a subtle ${bufferDistanceFt}ft buffer ring (dashed line)
- Ensure street labels are clear and readable
- Maintain professional, official document aesthetic
- Add subtle "Illustrative map (not authoritative)" watermark

Keep the geographic accuracy intact. Location: ${address}`;

  try {
    const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
      input: {
        prompt,
        image_urls: [baseMapUrl],
        aspect_ratio: 'auto',
        output_format: 'png',
        resolution: '1K',
      },
    });

    const image = result.data.images[0];
    return {
      url: image.url,
      width: 1024,
      height: 768,
    };
  } catch (error) {
    console.error('FAL map styling error:', error);
    throw new Error('Failed to style map image');
  }
}

/**
 * Generate the entire infographic as an AI image.
 * This creates a complete one-page property snapshot.
 */
export async function generateInfographicImage(options: {
  address: string;
  apn?: string;
  parcelArea?: string;
  county?: string;
  city?: string;
  zoning?: string;
  generalPlan?: string;
  floodZone?: string;
  fireHazard?: string;
  schoolDistrict?: string;
  supervisorialDistrict?: string;
}): Promise<MapImageResult> {
  const {
    address,
    apn = '[APN: requires lookup]',
    parcelArea = '[Parcel size: requires lookup]',
    county = 'Solano County',
    city = '[City: requires lookup]',
    zoning = '[Zoning: requires lookup]',
    generalPlan = '[General Plan: requires lookup]',
    floodZone = '[Flood zone: requires lookup]',
    fireHazard = '[Fire hazard: requires lookup]',
    schoolDistrict = '[School district: requires lookup]',
    supervisorialDistrict = '[Supervisorial district: requires lookup]',
  } = options;

  const prompt = `Create a US Letter 8.5x11 portrait one-page "PROPERTY SNAPSHOT" infographic for a county government.

LAYOUT:
- Top: "Address Snapshot" title with "Template: Address Snapshot - Counter Handout" tag
- Below title: "Address (user input): ${address}" and "Generated: [today's date]"
- "Intended use: Internal demo (not for public release)" in orange text

LEFT COLUMN (60%):
- Large grayscale map panel showing a highlighted parcel polygon with 500ft buffer ring
- "Illustrative map (not authoritative)" watermark on map
- North arrow and scale bar
- Below map: "Nearby Reference Points" with chips for School, Fire Station, Park, Transit, Hospital with bracketed distances

RIGHT COLUMN (40%):
Stacked info cards:
1. "Parcel & Jurisdiction" section:
   - Parcel: APN ${apn}, Size ${parcelArea}
   - Jurisdiction: County ${county}, City ${city}
2. "Land Use & Zoning" section:
   - General Plan: ${generalPlan}
   - Zoning: ${zoning}
3. "Political / Service Districts" section:
   - Supervisorial: ${supervisorialDistrict}
   - School: ${schoolDistrict}
4. "Hazards & Constraints" section with colored bands:
   - Flood (yellow/green badge): ${floodZone}
   - Fire (orange badge): ${fireHazard}
   - Environmental (gray badge): No flags returned

BOTTOM STRIP:
- "What this report is" explanation text
- "Data sources (intended when connected)" bulleted list
- Disclaimer footer

STYLE: Professional county handout, clean typography, subtle gray/blue colors, high legibility.`;

  try {
    const result = await fal.subscribe('fal-ai/nano-banana-pro', {
      input: {
        prompt,
        aspect_ratio: '3:4', // Portrait letter-ish
        output_format: 'png',
        resolution: '2K',
      },
    });

    const image = result.data.images[0];
    return {
      url: image.url,
      width: 1536,
      height: 2048,
    };
  } catch (error) {
    console.error('FAL infographic generation error:', error);
    throw new Error('Failed to generate infographic image');
  }
}

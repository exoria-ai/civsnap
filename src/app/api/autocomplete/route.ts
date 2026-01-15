import { NextRequest, NextResponse } from 'next/server';

const ADDRESS_POINTS_URL =
  'https://services2.arcgis.com/SCn6czzcqKAFwdGU/ArcGIS/rest/services/Address_Points/FeatureServer/0';

export type AutocompleteResult = {
  address: string;
  apn: string;
  lat: number;
  lon: number;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Sanitize input - remove special characters that could break the query
    const sanitized = query.replace(/['"%;]/g, '').toUpperCase();

    // Build WHERE clause to match addresses starting with the input
    const whereClause = `fulladdress LIKE '${sanitized}%'`;

    const params = new URLSearchParams({
      where: whereClause,
      outFields: 'apn,fulladdress,lat,long',
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '10',
      orderByFields: 'fulladdress',
    });

    const response = await fetch(`${ADDRESS_POINTS_URL}/query?${params}`);

    if (!response.ok) {
      console.error('Address Points query failed:', response.statusText);
      return NextResponse.json({ results: [] });
    }

    const data = await response.json();

    if (data.error || !data.features) {
      console.error('Address Points query error:', data.error);
      return NextResponse.json({ results: [] });
    }

    const results: AutocompleteResult[] = data.features.map(
      (feature: { attributes: Record<string, unknown> }) => ({
        address: String(feature.attributes.fulladdress || ''),
        apn: String(feature.attributes.apn || ''),
        lat: Number(feature.attributes.lat),
        lon: Number(feature.attributes.long),
      })
    );

    // Deduplicate by address (some addresses appear multiple times)
    const uniqueResults = results.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.address === result.address)
    );

    return NextResponse.json({ results: uniqueResults });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ results: [] });
  }
}

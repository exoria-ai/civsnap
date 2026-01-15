import { GeocodeResult } from './types';

// US Census Geocoder API
const CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

type CensusGeocodeResponse = {
  result: {
    input: {
      address: {
        address: string;
      };
    };
    addressMatches: Array<{
      coordinates: {
        x: number; // longitude
        y: number; // latitude
      };
      matchedAddress: string;
      tigerLine: {
        side: string;
        tigerLineId: string;
      };
      addressComponents: {
        preQualifier: string;
        preDirection: string;
        preType: string;
        streetName: string;
        suffixType: string;
        suffixDirection: string;
        suffixQualifier: string;
        city: string;
        state: string;
        zip: string;
      };
    }>;
  };
};

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    address,
    benchmark: 'Public_AR_Current',
    format: 'json',
  });

  const response = await fetch(`${CENSUS_GEOCODER_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  const data: CensusGeocodeResponse = await response.json();

  if (!data.result.addressMatches || data.result.addressMatches.length === 0) {
    return {
      lat: 0,
      lon: 0,
      standardizedAddress: address,
      matchQuality: 'no_match',
    };
  }

  const match = data.result.addressMatches[0];

  return {
    lat: match.coordinates.y,
    lon: match.coordinates.x,
    standardizedAddress: match.matchedAddress,
    matchQuality: 'exact',
    components: {
      street: [
        match.addressComponents.preDirection,
        match.addressComponents.streetName,
        match.addressComponents.suffixType,
        match.addressComponents.suffixDirection,
      ]
        .filter(Boolean)
        .join(' '),
      city: match.addressComponents.city,
      state: match.addressComponents.state,
      zip: match.addressComponents.zip,
    },
  };
}

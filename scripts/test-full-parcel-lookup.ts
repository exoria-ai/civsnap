/**
 * Test the full parcel lookup flow:
 * 1. Address string → Address Point (APN)
 * 2. APN → Parcel (attribute query)
 */

const SOLANO_GIS_BASE = 'https://services2.arcgis.com/SCn6czzcqKAFwdGU/ArcGIS/rest/services';
const ADDRESS_POINTS_URL = `${SOLANO_GIS_BASE}/Address_Points/FeatureServer/0`;
const PARCELS_URL = `${SOLANO_GIS_BASE}/Parcels_Public_Aumentum/FeatureServer/0`;

async function lookupAddressByString(addressString: string) {
  const match = addressString.match(/^(\d+)\s+([A-Za-z]+)/);
  if (!match) return undefined;

  const streetNumber = match[1];
  const streetName = match[2].toUpperCase();

  const whereClause = `fulladdress LIKE '${streetNumber} ${streetName}%'`;
  const params = new URLSearchParams({
    where: whereClause,
    outFields: 'apn,fulladdress,lat,long',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '1',
  });

  const response = await fetch(`${ADDRESS_POINTS_URL}/query?${params}`);
  const data = await response.json();

  if (!data.features?.length) return undefined;
  return data.features[0].attributes;
}

async function lookupParcelByAPN(apn: string) {
  const params = new URLSearchParams({
    where: `parcelid = '${apn}'`,
    outFields: 'parcelid,acres,lotsize,usecode,use_desc,yrbuilt,zone1,p_address,sitecity,d_school,propurl',
    returnGeometry: 'false',
    f: 'json',
  });

  const response = await fetch(`${PARCELS_URL}/query?${params}`);
  const data = await response.json();

  if (!data.features?.length) return undefined;
  return data.features[0].attributes;
}

async function main() {
  const testAddresses = [
    '675 Texas St, Fairfield, CA',
    '601 Texas St, Fairfield, CA',
    '400 Georgia St, Vallejo, CA',
  ];

  console.log('Full Parcel Lookup Test\n');
  console.log('Flow: Address String → Address Point (APN) → Parcel (by APN)\n');

  for (const addr of testAddresses) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Input: "${addr}"`);

    const addressPoint = await lookupAddressByString(addr);
    if (!addressPoint) {
      console.log('  ❌ No address point found\n');
      continue;
    }

    console.log(`\n  Step 1 - Address Point:`);
    console.log(`    Matched: ${addressPoint.fulladdress}`);
    console.log(`    APN: ${addressPoint.apn}`);

    const parcel = await lookupParcelByAPN(addressPoint.apn);
    if (!parcel) {
      console.log('  ❌ No parcel found for APN\n');
      continue;
    }

    console.log(`\n  Step 2 - Parcel (via attribute query):`);
    console.log(`    Parcel ID: ${parcel.parcelid}`);
    console.log(`    Site Address: ${parcel.p_address}, ${parcel.sitecity}`);
    console.log(`    Acres: ${parcel.acres}`);
    console.log(`    Lot Size: ${parcel.lotsize?.toLocaleString()} sq ft`);
    console.log(`    Use: ${parcel.use_desc} (${parcel.usecode})`);
    console.log(`    Year Built: ${parcel.yrbuilt || 'N/A'}`);
    console.log(`    Zoning: ${parcel.zone1 || 'N/A'}`);
    console.log(`    School District: ${parcel.d_school?.trim() || 'N/A'}`);
    console.log(`    Property URL: ${parcel.propurl ? '✓' : 'N/A'}`);
    console.log('');
  }
}

main().catch(console.error);

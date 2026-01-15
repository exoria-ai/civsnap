/**
 * Test script: Verify address string lookup returns correct APN
 * Tests that "675 Texas St" returns the correct parcel ID
 */

const SOLANO_GIS_BASE = 'https://services2.arcgis.com/SCn6czzcqKAFwdGU/ArcGIS/rest/services';
const ADDRESS_POINTS_URL = `${SOLANO_GIS_BASE}/Address_Points/FeatureServer/0`;

async function searchAddressPointByString(addressString: string) {
  // Extract street number and name from address
  const match = addressString.match(/^(\d+)\s+([A-Za-z]+)/);
  if (!match) return undefined;

  const streetNumber = match[1];
  const streetName = match[2].toUpperCase();

  // Query for addresses matching the street number and name
  const whereClause = `fulladdress LIKE '${streetNumber} ${streetName}%' OR fulladdress LIKE '${streetNumber} W ${streetName}%' OR fulladdress LIKE '${streetNumber} E ${streetName}%' OR fulladdress LIKE '${streetNumber} N ${streetName}%' OR fulladdress LIKE '${streetNumber} S ${streetName}%'`;

  const params = new URLSearchParams({
    where: whereClause,
    outFields: 'apn,fulladdress,lat,long',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '10',
  });

  const response = await fetch(`${ADDRESS_POINTS_URL}/query?${params}`);
  const data = await response.json();

  if (data.error || !data.features?.length) return undefined;

  return data.features.map((f: { attributes: Record<string, unknown> }) => ({
    apn: f.attributes.apn,
    address: f.attributes.fulladdress,
    lat: f.attributes.lat,
    lon: f.attributes.long,
  }));
}

async function main() {
  console.log('Testing address string lookup\n');

  // Test 1: 675 Texas St (should return APN 0030251020)
  console.log('Test 1: "675 Texas St"');
  const result1 = await searchAddressPointByString('675 Texas St');
  if (result1) {
    console.log('  ✅ Found', result1.length, 'match(es):');
    result1.forEach((r: { apn: string; address: string }) => {
      console.log(`     APN: ${r.apn}, Address: ${r.address}`);
    });
    if (result1[0]?.apn === '0030251020') {
      console.log('  ✅ Correct APN: 0030251020');
    } else {
      console.log('  ❌ Wrong APN! Expected 0030251020, got', result1[0]?.apn);
    }
  } else {
    console.log('  ❌ No results found');
  }

  // Test 2: 601 Texas St (should also return APN 0030251020 - same parcel)
  console.log('\nTest 2: "601 Texas St"');
  const result2 = await searchAddressPointByString('601 Texas St');
  if (result2) {
    console.log('  ✅ Found', result2.length, 'match(es):');
    result2.forEach((r: { apn: string; address: string }) => {
      console.log(`     APN: ${r.apn}, Address: ${r.address}`);
    });
    if (result2[0]?.apn === '0030251020') {
      console.log('  ✅ Correct APN: 0030251020 (same parcel as 675)');
    }
  } else {
    console.log('  ❌ No results found');
  }

  // Test 3: Random residential address
  console.log('\nTest 3: "1050 N Texas St"');
  const result3 = await searchAddressPointByString('1050 N Texas St');
  if (result3) {
    console.log('  ✅ Found', result3.length, 'match(es):');
    result3.forEach((r: { apn: string; address: string }) => {
      console.log(`     APN: ${r.apn}, Address: ${r.address}`);
    });
  } else {
    console.log('  ❌ No results found');
  }
}

main().catch(console.error);

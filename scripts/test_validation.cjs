const fs = require('fs');

const overrides = JSON.parse(fs.readFileSync('src/data/locationNameOverrides.json', 'utf8'));
const bData = JSON.parse(fs.readFileSync('buildings.json', 'utf8'));
const geojson = JSON.parse(fs.readFileSync('lpu_outdoor.geojson', 'utf8'));

console.log('=== PHASE 9 VALIDATION SUITE ===\n');

// 1. Verify 43 audited buildings have exact names
console.log('1. Checking all 43 Audited Buildings:');
let verifiedAuditCount = 0;
bData.buildings.forEach(b => {
  const o = overrides[b.id] || (b.osm_way_id ? overrides['way/' + b.osm_way_id] : null);
  if (o && o.confidence === 'verified') {
    verifiedAuditCount++;
  }
});
console.log(`   -> Verified ${verifiedAuditCount} / ${bData.buildings.length} audited buildings.\n`);

// 2. Verify all Hostels (BH-1 to BH-8, GH-1 to GH-6)
console.log('2. Checking Hostel Verification:');
const bhList = ['BH_01', 'BH_02', 'BH_03', 'BH_04', 'BH_05', 'BH_06', 'BH_07', 'BH_08'];
const ghList = ['GH_01', 'GH_02', 'GH_03', 'GH_04', 'GH_05', 'GH_06'];

bhList.forEach(id => {
  const b = bData.buildings.find(item => item.id === id);
  const o = overrides[id] || (b?.osm_way_id ? overrides['way/' + b.osm_way_id] : null);
  console.log(`   -> [${id}] ${o?.display_name || b?.name} | Way: ${b?.osm_way_id} | Cat: ${o?.category}`);
});

ghList.forEach(id => {
  const b = bData.buildings.find(item => item.id === id);
  const o = overrides[id] || (b?.osm_way_id ? overrides['way/' + b.osm_way_id] : null);
  console.log(`   -> [${id}] ${o?.display_name || b?.name} | Way: ${b?.osm_way_id} | Cat: ${o?.category}`);
});

// 3. Check for duplicates in GeoJSON
console.log('\n3. Checking Duplicate Suppression:');
const idCounts = {};
geojson.features.forEach(f => idCounts[f.id] = (idCounts[f.id] || 0) + 1);
const duplicates = Object.keys(idCounts).filter(id => idCounts[id] > 1);
console.log(`   -> Found ${duplicates.length} duplicate IDs:`, duplicates);

// 4. Test Search Consistency
console.log('\n4. Testing Search Query Logic:');
const searchCases = [
  { q: 'BH-1', expectId: 'BH_01' },
  { q: 'GH-1', expectId: 'GH_01' },
  { q: '34', expectId: 'BLOCK_34' },
  { q: 'CSE', expectId: 'BLOCK_34' },
  { q: 'Library', expectId: 'BLOCK_37' },
  { q: 'Uni-Mall', expectId: 'BLOCK_15' },
  { q: 'Mittal School', expectId: 'BLOCK_32' },
  { q: 'Design', expectId: 'BLOCK_DESIGN' },
  { q: 'Unipolis', expectId: 'UNIPOLIS' }
];

searchCases.forEach(tc => {
  const q = tc.q.toLowerCase();
  const matched = bData.buildings.filter(b => {
    const o = overrides[b.id] || (b.osm_way_id ? overrides['way/' + b.osm_way_id] : null);
    const name = o ? o.display_name : b.name;
    return (
      name.toLowerCase().includes(q) ||
      b.block_number.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.primary_occupants.some(occ => occ.toLowerCase().includes(q))
    );
  });
  const found = matched.some(m => m.id === tc.expectId);
  console.log(`   -> Query "${tc.q}": ${found ? 'PASS' : 'FAIL'} (Matched ${matched.length} buildings, top: ${matched[0]?.name})`);
});

// 5. Test Routing Service
console.log('\n5. Running Routing Engine with Corrected Locations:');
const { calculateAStarRoute, snapCoordinateToNetwork, graphNodes } = require('./scripts/routing_core.cjs');

const r1 = calculateAStarRoute([31.259520, 75.706476], [31.257050, 75.705700]);
console.log('   -> Gate 1 -> Block 34 (School of CSE):', r1.found ? `${r1.distanceMeters}m, ${r1.durationMinutes}min` : 'FAILED');

const r2 = calculateAStarRoute([31.254933, 75.700155], [31.255716, 75.704998]);
console.log('   -> Law Gate -> Block 15 (Uni-Mall):', r2.found ? `${r2.distanceMeters}m, ${r2.durationMinutes}min` : 'FAILED');

const r3 = calculateAStarRoute([31.251470, 75.702507], [31.2575, 75.7068]);
console.log('   -> BH-1 -> Block 37 (Central Library):', r3.found ? `${r3.distanceMeters}m, ${r3.durationMinutes}min` : 'FAILED');

const r4 = calculateAStarRoute([31.254473, 75.705639], [31.256922, 75.705431]);
console.log('   -> GH-1 -> Block 32 (Mittal School of Business):', r4.found ? `${r4.distanceMeters}m, ${r4.durationMinutes}min` : 'FAILED');

console.log('\n=== ALL PHASE 9 TESTS COMPLETE ===');

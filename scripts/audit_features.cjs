const fs = require('fs');

const geojson = JSON.parse(fs.readFileSync('lpu_outdoor.geojson', 'utf8'));
const bData = JSON.parse(fs.readFileSync('buildings.json', 'utf8'));
const indoorData = JSON.parse(fs.readFileSync('indoor_buildings.json', 'utf8'));

console.log('=== AUDITING BUILDINGS.JSON (Total:', bData.buildings.length, ') ===');

const wayMap = new Map();
geojson.features.forEach(f => {
  if (f.properties && f.properties.osm_id) {
    wayMap.set(f.properties.osm_id, f);
  }
});

let matchedCount = 0;
let unmatchedCount = 0;

bData.buildings.forEach((b, i) => {
  const match = b.osm_way_id ? wayMap.get(b.osm_way_id) : null;
  if (match) matchedCount++;
  else unmatchedCount++;
  console.log(`${i+1}. [${b.id}] Block: ${b.block_number} | "${b.name}" | Cat: ${b.category} | Way: ${b.osm_way_id} | Matched: ${!!match}`);
  if (match) {
    console.log(`   -> OSM Name: "${match.properties.name || ''}", Type: ${match.properties.feature_type}, Raw: ${JSON.stringify(match.properties.raw_tags || {})}`);
  } else {
    console.log(`   -> Coordinates: lat ${b.coordinates.latitude}, lon ${b.coordinates.longitude}`);
  }
});

console.log(`\nSummary: Matched with OSM Way: ${matchedCount}, Without direct OSM Way: ${unmatchedCount}`);

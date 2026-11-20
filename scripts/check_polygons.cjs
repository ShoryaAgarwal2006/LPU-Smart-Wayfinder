const fs = require('fs');
const geojson = JSON.parse(fs.readFileSync('lpu_outdoor.geojson', 'utf8'));
const bData = JSON.parse(fs.readFileSync('buildings.json', 'utf8'));

function getDist(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const bldgWays = geojson.features.filter(f => f.properties && f.properties.feature_type === 'building');

console.log('Checking 15 buildings without osm_way_id:');
bData.buildings.filter(b => !b.osm_way_id).forEach(b => {
  const bLat = b.coordinates.latitude;
  const bLon = b.coordinates.longitude;
  let closest = null;
  let minDist = Infinity;
  bldgWays.forEach(bw => {
    let lat, lon;
    if (bw.properties.center) {
      lat = bw.properties.center[0];
      lon = bw.properties.center[1];
    } else if (bw.geometry && bw.geometry.coordinates) {
      const coords = bw.geometry.type === 'Polygon' ? bw.geometry.coordinates[0] : bw.geometry.coordinates[0][0];
      const sum = coords.reduce((acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]], [0, 0]);
      lon = sum[0] / coords.length;
      lat = sum[1] / coords.length;
    }
    if (lat && lon) {
      const d = getDist(bLat, bLon, lat, lon);
      if (d < minDist) {
        minDist = d;
        closest = { way: bw, dist: d, lat, lon };
      }
    }
  });
  console.log(`[${b.id}] ${b.name}: Closest polygon is ${closest ? closest.way.id : 'none'} at ${Math.round(minDist)}m (levels: ${closest?.way?.properties?.levels})`);
});

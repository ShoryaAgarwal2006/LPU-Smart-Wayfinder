import json

with open('osm_lpu_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

elements = data.get('elements', [])
node_dict = {el['id']: (el['lon'], el['lat']) for el in elements if el['type'] == 'node'}
way_dict = {el['id']: el for el in elements if el['type'] == 'way'}

lpu_rel = next((el for el in elements if el['type'] == 'relation' and el['id'] == 21599790), None)
w1_nodes = way_dict[422435593]['nodes']
w2_nodes = way_dict[1566901467]['nodes']
ring_nodes = list(w1_nodes)
if w2_nodes[0] == ring_nodes[-1]:
    ring_nodes.extend(w2_nodes[1:])
elif w2_nodes[-1] == ring_nodes[-1]:
    ring_nodes.extend(reversed(w2_nodes[:-1]))
poly = [node_dict[nid] for nid in ring_nodes if nid in node_dict]

def point_in_polygon(point, poly):
    x, y = point
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

features = []

# 1. Campus Boundary Feature
poly_coords = [[list(p) for p in poly]]
# Close the polygon ring if not closed
if poly_coords[0][0] != poly_coords[0][-1]:
    poly_coords[0].append(poly_coords[0][0])

features.append({
    "type": "Feature",
    "id": f"relation/{lpu_rel['id']}",
    "geometry": {
        "type": "Polygon",
        "coordinates": poly_coords
    },
    "properties": {
        "osm_id": lpu_rel['id'],
        "osm_type": "relation",
        "name": lpu_rel['tags'].get('name', 'Lovely Professional University'),
        "name_en": lpu_rel['tags'].get('name:en', 'Lovely Professional University'),
        "name_pa": lpu_rel['tags'].get('name:pa', 'ਲਵਲੀ ਪ੍ਰੋਫੈਸ਼ਨਲ ਯੂਨੀਵਰਸਿਟੀ'),
        "amenity": "university",
        "operator": lpu_rel['tags'].get('operator', 'Lovely Group'),
        "website": lpu_rel['tags'].get('website', 'https://www.lpu.in/'),
        "feature_type": "campus_boundary",
        "source": "OpenStreetMap Relation 21599790"
    }
})

# 2. Buildings inside campus
building_count = 0
for el in elements:
    if el['type'] == 'way' and 'building' in el.get('tags', {}):
        wnodes = [node_dict[nid] for nid in el.get('nodes', []) if nid in node_dict]
        if not wnodes:
            continue
        avg_lon = sum(p[0] for p in wnodes) / len(wnodes)
        avg_lat = sum(p[1] for p in wnodes) / len(wnodes)
        if point_in_polygon((avg_lon, avg_lat), poly):
            ring = [list(p) for p in wnodes]
            if ring[0] != ring[-1]:
                ring.append(ring[0])
            tags = el['tags']
            name = tags.get('name') or tags.get('ref') or f"Building {el['id']}"
            features.append({
                "type": "Feature",
                "id": f"way/{el['id']}",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ring]
                },
                "properties": {
                    "osm_id": el['id'],
                    "osm_type": "way",
                    "name": tags.get('name', None),
                    "building": tags.get('building', 'yes'),
                    "levels": tags.get('building:levels', None),
                    "material": tags.get('building:material', None),
                    "feature_type": "building",
                    "center": [avg_lat, avg_lon],
                    "raw_tags": tags,
                    "source": "OpenStreetMap"
                }
            })
            building_count += 1

# 3. Highways / Walkways inside or crossing campus
highway_count = 0
for el in elements:
    if el['type'] == 'way' and 'highway' in el.get('tags', {}):
        wnodes = [node_dict[nid] for nid in el.get('nodes', []) if nid in node_dict]
        if not wnodes:
            continue
        inside_flags = [point_in_polygon(p, poly) for p in wnodes]
        if any(inside_flags):
            tags = el['tags']
            features.append({
                "type": "Feature",
                "id": f"way/{el['id']}",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [list(p) for p in wnodes]
                },
                "properties": {
                    "osm_id": el['id'],
                    "osm_type": "way",
                    "highway": tags.get('highway'),
                    "name": tags.get('name', None),
                    "surface": tags.get('surface', None),
                    "footway": tags.get('footway', None),
                    "is_pedestrian": tags.get('highway') in ['footway', 'pedestrian', 'path', 'steps', 'living_street'],
                    "feature_type": "walkway_road",
                    "raw_tags": tags,
                    "source": "OpenStreetMap"
                }
            })
            highway_count += 1

# 4. Amenities, sports facilities, pitches, helipad, parking inside campus
other_count = 0
for el in elements:
    if el['type'] == 'way':
        tags = el.get('tags', {})
        if 'building' in tags or 'highway' in tags or el['id'] in [422435593, 1566901467]:
            continue
        wnodes = [node_dict[nid] for nid in el.get('nodes', []) if nid in node_dict]
        if not wnodes:
            continue
        avg_lon = sum(p[0] for p in wnodes) / len(wnodes)
        avg_lat = sum(p[1] for p in wnodes) / len(wnodes)
        if point_in_polygon((avg_lon, avg_lat), poly):
            ring = [list(p) for p in wnodes]
            if ring[0] != ring[-1]:
                ring.append(ring[0])
            feat_type = "facility"
            if 'leisure' in tags:
                feat_type = f"leisure_{tags['leisure']}"
            elif 'amenity' in tags:
                feat_type = f"amenity_{tags['amenity']}"
            elif 'aeroway' in tags:
                feat_type = f"aeroway_{tags['aeroway']}"
            elif 'natural' in tags:
                feat_type = f"natural_{tags['natural']}"

            features.append({
                "type": "Feature",
                "id": f"way/{el['id']}",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ring]
                },
                "properties": {
                    "osm_id": el['id'],
                    "osm_type": "way",
                    "name": tags.get('name', None),
                    "sport": tags.get('sport', None),
                    "leisure": tags.get('leisure', None),
                    "amenity": tags.get('amenity', None),
                    "feature_type": feat_type,
                    "raw_tags": tags,
                    "source": "OpenStreetMap"
                }
            })
            other_count += 1

# 5. POI Nodes (Entrances, Gates, Key markers)
# Add verified Gates from research and OSM
gate_nodes = [
    {
        "id": "gate_1_main",
        "name": "Gate 1 (Main Campus Entrance - NH-44 / GT Road)",
        "coordinates": [75.7064763, 31.2595196],
        "type": "entrance_gate",
        "description": "Primary campus entrance on National Highway 44 (GT Road) with electronic boom barriers and security check.",
        "source": "OpenStreetMap Way 1551038389 & LPU Official Guidelines"
    },
    {
        "id": "gate_2",
        "name": "Gate 2 (Eastern Auxiliary Entrance - GT Road)",
        "coordinates": [75.7061, 31.2580],
        "type": "entrance_gate",
        "description": "Auxiliary eastern entrance facing GT Road for campus transit.",
        "source": "LPU Campus Entry Guidelines"
    },
    {
        "id": "gate_3",
        "name": "Gate 3 (Commercial / Logistics Entrance - GT Road)",
        "coordinates": [75.7058, 31.2560],
        "type": "entrance_gate",
        "description": "Commercial, vendor, and delivery entry point on GT Road.",
        "source": "LPU Campus Entry Guidelines"
    },
    {
        "id": "law_gate",
        "name": "Law Gate / Maheru Gate (West Campus Access Point)",
        "coordinates": [75.7001554, 31.2549332],
        "type": "campus_gate",
        "description": "Western access point connecting campus to off-campus student hub, PGs, and commercial area (Law Gate Rd).",
        "source": "OpenStreetMap Node 13894888268, Way 646987790 & Way 1192260423"
    },
    {
        "id": "green_valley_gate",
        "name": "Green Valley Gate",
        "coordinates": [75.697562, 31.2517336],
        "type": "campus_gate",
        "description": "Ceremonial access gate near Green Valley area.",
        "source": "OpenStreetMap Node 12031088561"
    }
]

for g in gate_nodes:
    features.append({
        "type": "Feature",
        "id": f"poi/{g['id']}",
        "geometry": {
            "type": "Point",
            "coordinates": g['coordinates']
        },
        "properties": {
            "name": g['name'],
            "feature_type": g['type'],
            "description": g['description'],
            "source": g['source']
        }
    })

geojson = {
    "type": "FeatureCollection",
    "name": "LPU_Smart_Wayfinder_Outdoor_Map",
    "crs": {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    },
    "bbox": [75.6973474, 31.2457534, 75.7091258, 31.2607949],
    "features": features
}

print(f"Generated GeoJSON with {len(features)} total features:")
print(f"  - Campus boundary: 1")
print(f"  - Buildings: {building_count}")
print(f"  - Highways / Walkways: {highway_count}")
print(f"  - Other facilities (pitches, parks, helipad, parking): {other_count}")
print(f"  - Verified Gate / POI nodes: {len(gate_nodes)}")

with open('lpu_outdoor.geojson', 'w', encoding='utf-8') as f:
    json.dump(geojson, f, indent=2, ensure_ascii=False)

print("Saved to lpu_outdoor.geojson successfully.")

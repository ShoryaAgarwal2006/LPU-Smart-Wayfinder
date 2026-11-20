import json

with open('osm_lpu_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

elements = data.get('elements', [])
node_dict = {el['id']: (el['lon'], el['lat']) for el in elements if el['type'] == 'node'}
way_dict = {el['id']: el for el in elements if el['type'] == 'way'}

lpu_rel = next((el for el in elements if el['type'] == 'relation' and el['id'] == 21599790), None)

boundary_nodes = []
for m in lpu_rel.get('members', []):
    wid = m['ref']
    w = way_dict.get(wid)
    if w:
        for nid in w.get('nodes', []):
            if nid in node_dict:
                boundary_nodes.append(node_dict[nid])

min_lon = min(pt[0] for pt in boundary_nodes)
max_lon = max(pt[0] for pt in boundary_nodes)
min_lat = min(pt[1] for pt in boundary_nodes)
max_lat = max(pt[1] for pt in boundary_nodes)

print(f"LPU Campus Bounding Box:")
print(f"Latitude: {min_lat} to {max_lat}")
print(f"Longitude: {min_lon} to {max_lon}")

# Simple Point-in-Polygon (Ray casting) algorithm
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

# Construct ring of outer boundary
# Way 422435593 and 1566901467
w1_nodes = way_dict[422435593]['nodes']
w2_nodes = way_dict[1566901467]['nodes']
print(f"W1 starts {w1_nodes[0]}, ends {w1_nodes[-1]}")
print(f"W2 starts {w2_nodes[0]}, ends {w2_nodes[-1]}")

# Stitch w1 and w2
ring_nodes = list(w1_nodes)
if w2_nodes[0] == ring_nodes[-1]:
    ring_nodes.extend(w2_nodes[1:])
elif w2_nodes[-1] == ring_nodes[-1]:
    ring_nodes.extend(reversed(w2_nodes[:-1]))
elif w2_nodes[0] == ring_nodes[0]:
    ring_nodes = list(reversed(w2_nodes[1:])) + ring_nodes
elif w2_nodes[-1] == ring_nodes[0]:
    ring_nodes = list(w2_nodes[:-1]) + ring_nodes
else:
    print("Warning: ring ends do not match directly, checking node coordinates...")

poly = [node_dict[nid] for nid in ring_nodes if nid in node_dict]
print(f"Polygon vertices: {len(poly)}")

# Check features inside campus
campus_buildings = []
campus_highways = []
campus_amenities = []
campus_gates = []

for el in elements:
    if el['type'] == 'way':
        tags = el.get('tags', {})
        wnodes = [node_dict[nid] for nid in el.get('nodes', []) if nid in node_dict]
        if not wnodes:
            continue
        # Check center of way
        avg_lon = sum(p[0] for p in wnodes) / len(wnodes)
        avg_lat = sum(p[1] for p in wnodes) / len(wnodes)
        if point_in_polygon((avg_lon, avg_lat), poly):
            if 'building' in tags:
                campus_buildings.append((el['id'], tags, (avg_lat, avg_lon), len(wnodes)))
            if 'highway' in tags:
                campus_highways.append((el['id'], tags, tags.get('highway'), tags.get('name', 'unnamed'), len(wnodes)))
            if 'amenity' in tags:
                campus_amenities.append((el['id'], tags))
            if 'barrier' in tags:
                campus_gates.append((el['id'], tags))

    elif el['type'] == 'node':
        tags = el.get('tags', {})
        if not tags:
            continue
        pt = (el['lon'], el['lat'])
        if point_in_polygon(pt, poly):
            if 'barrier' in tags or 'entrance' in tags or 'gate' in str(tags).lower():
                campus_gates.append((el['id'], tags, (el['lat'], el['lon'])))
            if 'amenity' in tags:
                campus_amenities.append((el['id'], tags, (el['lat'], el['lon'])))

print(f"\nInside LPU Campus Polygon:")
print(f"Buildings count: {len(campus_buildings)}")
print(f"Highways/walkways count: {len(campus_highways)}")
print(f"Amenities count: {len(campus_amenities)}")
print(f"Gates/barriers count: {len(campus_gates)}")

print("\n--- SAMPLE CAMPUS BUILDINGS ---")
for bid, tags, center, n_verts in campus_buildings[:30]:
    print(f"Building {bid} ({center[0]:.6f}, {center[1]:.6f}): {tags}")

print("\n--- HIGHWAY TYPES INSIDE CAMPUS ---")
from collections import Counter
hw_types = Counter(h[2] for h in campus_highways)
print(hw_types)

print("\n--- NAMED HIGHWAYS INSIDE CAMPUS ---")
for h in campus_highways:
    if h[3] != 'unnamed':
        print(f"Highway {h[0]}: {h[3]} ({h[2]}) -> {h[1]}")

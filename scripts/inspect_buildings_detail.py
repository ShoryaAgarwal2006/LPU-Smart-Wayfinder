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

w1_nodes = way_dict[422435593]['nodes']
w2_nodes = way_dict[1566901467]['nodes']
ring_nodes = list(w1_nodes)
if w2_nodes[0] == ring_nodes[-1]:
    ring_nodes.extend(w2_nodes[1:])
elif w2_nodes[-1] == ring_nodes[-1]:
    ring_nodes.extend(reversed(w2_nodes[:-1]))
poly = [node_dict[nid] for nid in ring_nodes if nid in node_dict]

campus_buildings = []
for el in elements:
    if el['type'] == 'way':
        tags = el.get('tags', {})
        if 'building' not in tags:
            continue
        wnodes = [node_dict[nid] for nid in el.get('nodes', []) if nid in node_dict]
        if not wnodes:
            continue
        avg_lon = sum(p[0] for p in wnodes) / len(wnodes)
        avg_lat = sum(p[1] for p in wnodes) / len(wnodes)
        if point_in_polygon((avg_lon, avg_lat), poly):
            campus_buildings.append({
                'id': el['id'],
                'tags': tags,
                'center': [avg_lat, avg_lon],
                'nodes_count': len(wnodes),
                'nodes': el.get('nodes', [])
            })

print(f"Total buildings in campus: {len(campus_buildings)}")
named_b = [b for b in campus_buildings if 'name' in b['tags']]
print(f"Named buildings: {len(named_b)}")
for b in named_b:
    print(f"ID {b['id']}: {b['tags'].get('name')} -> {b['tags']}")

level_counts = {}
for b in campus_buildings:
    lvl = b['tags'].get('building:levels', 'unknown')
    level_counts[lvl] = level_counts.get(lvl, 0) + 1
print("Building levels distribution:", level_counts)

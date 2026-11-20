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

# Look at all highways that have at least one node inside and at least one node outside the campus polygon
crossing_ways = []
for el in elements:
    if el['type'] == 'way' and 'highway' in el.get('tags', {}):
        wnodes = [node_dict[nid] for nid in el.get('nodes', []) if nid in node_dict]
        if not wnodes:
            continue
        inside_flags = [point_in_polygon(p, poly) for p in wnodes]
        if any(inside_flags) and not all(inside_flags):
            crossing_ways.append((el['id'], el['tags'], wnodes[0], wnodes[-1], el['nodes']))

print(f"Highways crossing campus perimeter boundary: {len(crossing_ways)}")
for wid, tags, start, end, nds in crossing_ways:
    print(f"Way {wid} ({tags.get('highway')}, name={tags.get('name')}): start={start}, end={end}, nodes={len(nds)}")

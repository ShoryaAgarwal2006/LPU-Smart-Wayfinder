import json

with open('osm_lpu_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

elements = data.get('elements', [])
node_dict = {el['id']: (el['lon'], el['lat']) for el in elements if el['type'] == 'node'}

print("=== TRUNK / PRIMARY ROADS NEAR LPU ===")
for el in elements:
    if el['type'] == 'way':
        tags = el.get('tags', {})
        hw = tags.get('highway')
        if hw in ['trunk', 'primary', 'motorway']:
            print(f"Way {el['id']}: {tags.get('name', 'unnamed')} ({hw}) ref={tags.get('ref')}")

print("\n=== WAYS CONNECTING TO NH44 / ENTRANCES ===")
# Find all highways inside or bordering the campus that connect to outside
lpu_rel = next((el for el in elements if el['type'] == 'relation' and el['id'] == 21599790), None)
way_dict = {el['id']: el for el in elements if el['type'] == 'way'}
w1_nodes = set(way_dict[422435593]['nodes'])
w2_nodes = set(way_dict[1566901467]['nodes'])
boundary_node_ids = w1_nodes.union(w2_nodes)

connecting_highways = []
for el in elements:
    if el['type'] == 'way' and 'highway' in el.get('tags', {}):
        wnodes = set(el.get('nodes', []))
        common = wnodes.intersection(boundary_node_ids)
        if common:
            connecting_highways.append((el['id'], el['tags'], common))

print(f"Found {len(connecting_highways)} highway segments crossing campus boundary nodes:")
for wid, tags, common in connecting_highways:
    common_coords = [(nid, node_dict[nid]) for nid in common if nid in node_dict]
    print(f"Way {wid} ({tags.get('highway')}, name={tags.get('name')}): intersects at {common_coords}")

import json

with open('osm_lpu_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

elements = data.get('elements', [])
node_dict = {el['id']: (el['lon'], el['lat']) for el in elements if el['type'] == 'node'}
way_dict = {el['id']: el for el in elements if el['type'] == 'way'}

lpu_rel = None
for el in elements:
    if el['type'] == 'relation' and el['id'] == 21599790:
        lpu_rel = el
        break

print("LPU Relation:", lpu_rel.keys() if lpu_rel else "None")
if lpu_rel:
    members = lpu_rel.get('members', [])
    print(f"Members count: {len(members)}")
    for m in members:
        wid = m['ref']
        role = m.get('role', '')
        way = way_dict.get(wid)
        if way:
            tags = way.get('tags', {})
            nodes_count = len(way.get('nodes', []))
            print(f"Member way {wid}, role='{role}', nodes={nodes_count}, tags={tags}")
        else:
            print(f"Member way {wid} not in way_dict")

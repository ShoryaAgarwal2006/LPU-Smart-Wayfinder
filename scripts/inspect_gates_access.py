import json

with open('osm_lpu_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

elements = data.get('elements', [])
node_dict = {el['id']: (el['lon'], el['lat']) for el in elements if el['type'] == 'node'}
way_dict = {el['id']: el for el in elements if el['type'] == 'way'}

# Find all gates, entrances, barriers, or junctions near the perimeter
print("=== GATES AND PERIMETER ACCESS POINTS ===")
for el in elements:
    tags = el.get('tags', {})
    t_str = str(tags).lower()
    if any(k in t_str for k in ['gate', 'barrier', 'entrance', 'toll', 'checkpoint']):
        if el['type'] == 'node':
            print(f"Node {el['id']} ({el['lat']}, {el['lon']}): {tags}")
        elif el['type'] == 'way':
            print(f"Way {el['id']}: {tags}")

print("\n=== MAJOR HIGHWAYS NEAR LPU ===")
for el in elements:
    if el['type'] == 'way':
        tags = el.get('tags', {})
        if 'highway' in tags and 'name' in tags:
            print(f"Way {el['id']}: {tags.get('name')} ({tags.get('highway')})")

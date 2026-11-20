import json

with open('osm_lpu_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

elements = data.get('elements', [])

print("=== RELATIONS ===")
for el in elements:
    if el['type'] == 'relation':
        tags = el.get('tags', {})
        print(f"Relation ID: {el['id']}, Tags: {tags}")

print("\n=== ALL NAMED WAYS ===")
named_ways = []
for el in elements:
    if el['type'] == 'way' and 'name' in el.get('tags', {}):
        named_ways.append((el['id'], el['tags']['name'], el['tags']))

for wid, name, tags in named_ways:
    print(f"Way {wid}: {name} -> {tags}")

print("\n=== WAYS WITH REF / OPERATOR / AMENITY / BUILDING / DESCRIPTION ===")
for el in elements:
    if el['type'] == 'way':
        tags = el.get('tags', {})
        # check if it mentions LPU or block or hostel or uni
        tag_str = str(tags).lower()
        if any(w in tag_str for w in ['lpu', 'lovely', 'block', 'hostel', 'gate', 'library', 'audi', 'mall', 'unipolis', 'mess', 'ground', 'hospital', 'cafeteria', 'canteen']):
            print(f"Way {el['id']}: {tags}")

print("\n=== NODES WITH LPU / BLOCK / HOSTEL / GATE / ETC ===")
for el in elements:
    if el['type'] == 'node':
        tags = el.get('tags', {})
        tag_str = str(tags).lower()
        if any(w in tag_str for w in ['lpu', 'lovely', 'block', 'hostel', 'gate', 'library', 'audi', 'mall', 'unipolis', 'mess', 'ground', 'hospital', 'cafeteria', 'canteen']):
            print(f"Node {el['id']}: {tags.get('name', 'unnamed')} ({el.get('lat')}, {el.get('lon')}) -> {tags}")

import json
from collections import Counter

with open('osm_lpu_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

elements = data.get('elements', [])
print(f"Total elements: {len(elements)}")

type_counts = Counter(el['type'] for el in elements)
print(f"Types: {type_counts}")

named_elements = []
buildings = []
highways = []
amenities = []
barriers = []

for el in elements:
    tags = el.get('tags', {})
    if not tags:
        continue
    if 'name' in tags:
        named_elements.append((el['type'], el['id'], tags.get('name'), tags))
    if 'building' in tags:
        buildings.append((el['type'], el['id'], tags.get('name', 'unnamed'), tags))
    if 'highway' in tags:
        highways.append((el['type'], el['id'], tags.get('name', 'unnamed'), tags.get('highway'), tags))
    if 'amenity' in tags:
        amenities.append((el['type'], el['id'], tags.get('name', 'unnamed'), tags.get('amenity'), tags))
    if 'barrier' in tags or 'entrance' in tags:
        barriers.append((el['type'], el['id'], tags))

print(f"Named elements: {len(named_elements)}")
print(f"Buildings: {len(buildings)}")
print(f"Highways/Paths: {len(highways)}")
print(f"Amenities: {len(amenities)}")
print(f"Barriers/Entrances: {len(barriers)}")

print("\n--- SAMPLE NAMED BUILDINGS & AMENITIES ---")
for t, eid, name, tags in named_elements[:50]:
    if any(k in tags for k in ['building', 'amenity', 'leisure', 'shop', 'tourism', 'office']):
        print(f"[{t} {eid}] {name} -> { {k: tags[k] for k in tags if k in ['building', 'amenity', 'ref', 'addr:housename', 'leisure', 'operator']} }")

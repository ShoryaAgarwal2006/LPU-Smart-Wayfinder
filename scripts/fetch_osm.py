import urllib.request
import urllib.parse
import json
import ssl
import sys

# Bounding box for Lovely Professional University campus
# South: 31.240, West: 75.690, North: 31.265, East: 75.720
query = """
[out:json][timeout:180];
(
  node(31.240, 75.690, 31.265, 75.720);
  way(31.240, 75.690, 31.265, 75.720);
  relation(31.240, 75.690, 31.265, 75.720);
);
out body;
>;
out skel qt;
"""

url = "https://overpass-api.de/api/interpreter"
data = urllib.parse.urlencode({'data': query}).encode('utf-8')
headers = {
    'User-Agent': 'LPUWayFinderResearch/1.0 (academic research project; contact: shoryaagarwal)'
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(url, data=data, headers=headers)
try:
    print("Fetching data from Overpass API...")
    with urllib.request.urlopen(req, context=ctx, timeout=180) as resp:
        content = resp.read().decode('utf-8')
        parsed = json.loads(content)
        elements_count = len(parsed.get('elements', []))
        print(f"Successfully fetched {elements_count} elements.")
        with open('osm_lpu_raw.json', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Saved to osm_lpu_raw.json")
except Exception as e:
    print(f"Error fetching OSM data: {e}", file=sys.stderr)
    sys.exit(1)


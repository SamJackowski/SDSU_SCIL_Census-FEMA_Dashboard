import json
from pathlib import Path

source = Path("data/us_counties_geojson.json")
output = Path("data/county_lookup.json")

geojson = json.loads(source.read_text(encoding="utf-8"))

def points(coordinates):
    if isinstance(coordinates[0], (int, float)):
        yield coordinates
    else:
        for item in coordinates:
            yield from points(item)

counties = []

for feature in geojson["features"]:
    props = feature.get("properties", {})
    geoid = str(feature.get("id") or props.get("GEOID", "")).zfill(5)

    coords = list(points(feature["geometry"]["coordinates"]))
    longitudes = [point[0] for point in coords]
    latitudes = [point[1] for point in coords]

    counties.append({
        "geoid": geoid,
        "name": props.get("NAME", "Unknown county"),
        "bounds": [
            min(longitudes),
            min(latitudes),
            max(longitudes),
            max(latitudes),
        ],
    })

output.write_text(json.dumps(counties, separators=(",", ":")), encoding="utf-8")
print(f"Created {output} with {len(counties):,} counties.")
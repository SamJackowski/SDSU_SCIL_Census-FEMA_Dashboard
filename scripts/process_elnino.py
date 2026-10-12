import pandas as pd
import requests
import re
import os

print("Finding NOAA Storm Event datasets...")
base_url = "https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/"
html = requests.get(base_url).text
file_2015 = re.search(r"StormEvents_details-ftp_v1\.0_d2015_c\d+\.csv\.gz", html).group()
file_2016 = re.search(r"StormEvents_details-ftp_v1\.0_d2016_c\d+\.csv\.gz", html).group()

print("Downloading and processing data...")
df = pd.concat([
    pd.read_csv(base_url + file_2015, low_memory=False),
    pd.read_csv(base_url + file_2016, low_memory=False)
], ignore_index=True)

# Filter for peak El Nino months (Nov 2015 to Mar 2016)
target_months = ["201511", "201512", "201601", "201602", "201603"]
df = df[df["BEGIN_YEARMONTH"].astype(str).isin(target_months)]

# Parse the text-based damage values (e.g., "50K" -> 50000)
def parse_damage(val):
    if pd.isna(val): return 0
    val = str(val).upper().strip()
    multiplier = 1
    if val.endswith("K"): multiplier = 1e3
    elif val.endswith("M"): multiplier = 1e6
    elif val.endswith("B"): multiplier = 1e9
    try: return float(re.sub(r"[^0-9\.]", "", val)) * multiplier
    except: return 0

df["property_damage"] = df["DAMAGE_PROPERTY"].apply(parse_damage)
df["crop_damage"] = df["DAMAGE_CROP"].apply(parse_damage)
df["total_damage"] = df["property_damage"] + df["crop_damage"]

# Filter out zero-damage events
df = df[df["total_damage"] > 0]

# Build 5-digit County FIPS code (GEOID)
df["GEOID"] = df["STATE_FIPS"].astype(str).str.zfill(2) + df["CZ_FIPS"].astype(str).str.zfill(3)

# Aggregate damages by County
agg_df = df.groupby("GEOID")[["property_damage", "crop_damage", "total_damage"]].sum().reset_index()

# Save the final file to the data/events directory
os.makedirs("data/events", exist_ok=True)
output_file = "data/events/el_nino_2015_16_damages_by_county.csv"
agg_df.to_csv(output_file, index=False)
print(f"Success! Saved {len(agg_df)} counties to {output_file}")


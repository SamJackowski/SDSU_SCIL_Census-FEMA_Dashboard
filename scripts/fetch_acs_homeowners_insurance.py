import os
import sys
import time
import requests
import pandas as pd
import json

# Setup paths relative to census_dashboard_js
BASE_DIR = r"C:\Users\samoj\Downloads\census_dashboard\census_dashboard_js"
TRACT_DIR = os.path.join(BASE_DIR, "data", "tract_variables")
COUNTY_LOOKUP_FILE = os.path.join(BASE_DIR, "data", "county_median_homeowners_insurance.json")

CENSUS_KEY = os.environ.get("CENSUS_API_KEY", "")
YEAR = "2023"

# 12 Bracket thresholds for mortgaged homeowners in B25141 (Estimate!!Total:!!With a mortgage:)
BRACKETS = [
    (0, 100),       # B25141_003E: Less than $100
    (100, 300),     # B25141_004E: $100 to $299
    (300, 500),     # B25141_005E: $300 to $499
    (500, 800),     # B25141_006E: $500 to $799
    (800, 1000),    # B25141_007E: $800 to $999
    (1000, 1500),   # B25141_008E: $1000 to $1499
    (1500, 2000),   # B25141_009E: $1500 to $1999
    (2000, 2500),   # B25141_010E: $2000 to $2499
    (2500, 3000),   # B25141_011E: $2500 to $2999
    (3000, 3500),   # B25141_012E: $3000 to $3499
    (3500, 4000),   # B25141_013E: $3500 to $3999
    (4000, 5000),   # B25141_014E: $4000 or more
]

def calculate_binned_median(counts, total):
    """
    Computes cumulative linear interpolated median from ACS frequency bins.
    """
    if not total or total <= 0:
        return None
    half = total / 2.0
    cum = 0
    for i, count in enumerate(counts):
        low, high = BRACKETS[i]
        width = high - low
        if cum + count >= half:
            needed = half - cum
            fraction = (needed / count) if count > 0 else 0.5
            return round(low + fraction * width)
        cum += count
    return 4000

# Variables to request: Total Mortgaged + 12 bracket counts
VARS = ["B25141_002E"] + [f"B25141_{i:03d}E" for i in range(3, 15)]
GET_PARAM = ",".join(VARS)

# All FIPS for 50 states + DC + Puerto Rico
STATE_FIPS = [
    "01", "02", "04", "05", "06", "08", "09", "10", "11", "12",
    "13", "15", "16", "17", "18", "19", "20", "21", "22", "23",
    "24", "25", "26", "27", "28", "29", "30", "31", "32", "33",
    "34", "35", "36", "37", "38", "39", "40", "41", "42", "44",
    "45", "46", "47", "48", "49", "50", "51", "53", "54", "55",
    "56", "72"
]

def process_all_states():
    county_medians = {}
    total_tracts_processed = 0
    start_time = time.time()

    print(f"Starting Census ACS {YEAR} Table B25141 Ingestion for {len(STATE_FIPS)} states/territories...")

    for idx, fips in enumerate(STATE_FIPS, 1):
        state_start = time.time()
        print(f"[{idx:02d}/{len(STATE_FIPS)}] Fetching State FIPS {fips}...", end="", flush=True)

        # 1. Fetch Counties in State
        u_county = f"https://api.census.gov/data/{YEAR}/acs/acs5?get={GET_PARAM}&for=county:*&in=state:{fips}&key={CENSUS_KEY}"
        try:
            r_co = requests.get(u_county, timeout=20)
            if r_co.status_code == 200:
                co_data = r_co.json()
                for row in co_data[1:]:
                    tot = int(row[0]) if row[0] not in (None, "", "-666666666") else 0
                    cts = [int(x) if x not in (None, "", "-666666666") else 0 for x in row[1:13]]
                    st_code = row[-2]
                    co_code = row[-1]
                    co_fips = f"{st_code}{co_code}"
                    med = calculate_binned_median(cts, tot)
                    county_medians[co_fips] = med
        except Exception as e:
            print(f" [County Err: {e}]", end="")

        # 2. Fetch Tracts in State
        u_tract = f"https://api.census.gov/data/{YEAR}/acs/acs5?get={GET_PARAM}&for=tract:*&in=state:{fips}&in=county:*&key={CENSUS_KEY}"
        tract_rows = []
        try:
            r_tr = requests.get(u_tract, timeout=30)
            if r_tr.status_code == 200:
                tr_data = r_tr.json()
                for row in tr_data[1:]:
                    tot = int(row[0]) if row[0] not in (None, "", "-666666666") else 0
                    cts = [int(x) if x not in (None, "", "-666666666") else 0 for x in row[1:13]]
                    st_code = row[-3]
                    co_code = row[-2]
                    tr_code = row[-1]
                    geoid = f"{st_code}{co_code}{tr_code}"
                    med = calculate_binned_median(cts, tot)
                    tract_rows.append({
                        "GEOID": geoid,
                        "year": int(YEAR),
                        "value": float(med) if med is not None else None
                    })
        except Exception as e:
            print(f" [Tract Err: {e}]", end="")

        # Save State Tract Parquet
        if tract_rows:
            st_tract_dir = os.path.join(TRACT_DIR, fips)
            os.makedirs(st_tract_dir, exist_ok=True)
            out_parquet = os.path.join(st_tract_dir, "median_homeowners_insurance.parquet")
            df_tract = pd.DataFrame(tract_rows)
            df_tract.to_parquet(out_parquet, index=False)
            total_tracts_processed += len(tract_rows)
            print(f" Done ({len(tract_rows):,} tracts in {time.time()-state_start:.1f}s)")
        else:
            print(f" (No tracts returned in {time.time()-state_start:.1f}s)")

        # Brief rate limit breathing pause
        time.sleep(0.15)

    # Save County Medians Lookup JSON
    with open(COUNTY_LOOKUP_FILE, "w", encoding="utf-8") as f:
        json.dump(county_medians, f, indent=2)

    elapsed = time.time() - start_time
    print(f"\nCompleted in {elapsed:.1f}s!")
    print(f"Saved {total_tracts_processed:,} tracts across {len(STATE_FIPS)} state directories.")
    print(f"Saved {len(county_medians):,} county medians to: {COUNTY_LOOKUP_FILE}")

if __name__ == "__main__":
    process_all_states()

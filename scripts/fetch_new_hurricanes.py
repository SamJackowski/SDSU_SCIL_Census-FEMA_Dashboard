import urllib.request
import urllib.parse
import json
import csv
import os
from collections import defaultdict

def fetch_hurricane_nfip(hurricane_name, start_date, end_date, states, output_csv):
    print(f"\n--- Starting {hurricane_name} Extraction ---")
    print(f"Fetching NFIP claims from {start_date} to {end_date} for {states}...")
    
    # State mapping to abbreviations for the API
    state_abbr = {
        "Florida": "FL", "Georgia": "GA", "South Carolina": "SC", "North Carolina": "NC",
        "Louisiana": "LA", "Texas": "TX", "Puerto Rico": "PR"
    }
    target_abbrs = [state_abbr[s] for s in states if s in state_abbr]
    
    tract_data = defaultdict(lambda: {
        "claim_count": 0,
        "building_payments": 0.0,
        "contents_payments": 0.0,
        "icc_payments": 0.0
    })
    
    skip = 0
    top = 10000
    
    while True:
        # Build filter for states and date range
        state_filter = " or ".join([f"state eq '{s}'" for s in target_abbrs])
        date_filter = f"dateOfLoss ge '{start_date}' and dateOfLoss le '{end_date}'"
        filter_query = urllib.parse.quote(f"({state_filter}) and ({date_filter})")
        
        url = f"https://www.fema.gov/api/open/v2/FimaNfipClaims?$filter={filter_query}&$top={top}&$skip={skip}"
        
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                records = data.get("FimaNfipClaims", [])
                
                if not records:
                    break
                    
                for r in records:
                    geoid = str(r.get('censusTract') or '').strip()
                    # Needs to be 11 digits for census tracts
                    if geoid and len(geoid) == 11 and geoid != "00000000000":
                        tract_data[geoid]["claim_count"] += 1
                        tract_data[geoid]["building_payments"] += float(r.get('buildingDamageAmount') or 0.0)
                        tract_data[geoid]["contents_payments"] += float(r.get('contentsDamageAmount') or 0.0)
                        tract_data[geoid]["icc_payments"] += float(r.get('iccDamageAmount') or 0.0)
                        
                skip += top
                print(f"  Fetched {skip} records...")
                
        except Exception as e:
            print(f"Error fetching data: {e}")
            break
            
    print(f"Writing {output_csv}...")
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    
    headers = [
        "GEOID", "claim_count", "total_claim_payments", 
        "building_payments", "contents_payments", "icc_payments"
    ]
    
    with open(output_csv, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        
        for geoid, data in tract_data.items():
            total_payments = data["building_payments"] + data["contents_payments"] + data["icc_payments"]
            # Only write rows that actually have a claim
            if data["claim_count"] > 0:
                writer.writerow({
                    "GEOID": geoid,
                    "claim_count": data["claim_count"],
                    "total_claim_payments": round(total_payments, 2),
                    "building_payments": round(data["building_payments"], 2),
                    "contents_payments": round(data["contents_payments"], 2),
                    "icc_payments": round(data["icc_payments"], 2)
                })
    print("Done!")

if __name__ == "__main__":
    fetch_hurricane_nfip(
        "Hurricane Matthew (2016)", 
        "2016-10-01", "2016-10-31", 
        ["Florida", "Georgia", "South Carolina", "North Carolina"],
        "data/events/matthew_nfip_by_tract.csv"
    )
    
    fetch_hurricane_nfip(
        "Hurricane Irma (2017)", 
        "2017-09-01", "2017-10-31", 
        ["Florida", "Georgia", "South Carolina"],
        "data/events/irma_nfip_by_tract.csv"
    )
    
    fetch_hurricane_nfip(
        "Hurricane Maria (2017)", 
        "2017-09-01", "2017-10-31", 
        ["Puerto Rico"],
        "data/events/maria_nfip_by_tract.csv"
    )
    
    fetch_hurricane_nfip(
        "Hurricane Laura (2020)", 
        "2020-08-20", "2020-09-30", 
        ["Louisiana", "Texas"],
        "data/events/laura_nfip_by_tract.csv"
    )
    
    print("\nSuccessfully built CSV files for all new hurricanes!")

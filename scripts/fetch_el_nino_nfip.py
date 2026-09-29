import urllib.request
import urllib.parse
import json
import csv
import os
from collections import defaultdict

def fetch_fema_claims(start_date, end_date, states):
    print(f"Fetching NFIP claims from {start_date} to {end_date}...")
    base_url = "https://www.fema.gov/api/open/v2/FimaNfipClaims"
    
    skip = 0
    top = 10000
    all_records = []
    
    while True:
        filter_query = f"dateOfLoss ge '{start_date}T00:00:00.000Z' and dateOfLoss le '{end_date}T00:00:00.000Z'"
        url = f"{base_url}?$filter={urllib.parse.quote(filter_query)}&$top={top}&$skip={skip}"
        
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                records = data.get("FimaNfipClaims", [])
                
                if not records:
                    break
                    
                for r in records:
                    state_val = r.get('state') or r.get('propertyState') or r.get('stateCode')
                    if state_val in states and r.get('censusTract'):
                        all_records.append(r)
                        
                skip += top
                print(f"  ...retrieved {skip} records from API")
                
        except Exception as e:
            print(f"Error fetching data: {e}")
            break
            
    return all_records

def aggregate_by_tract(records):
    tracts = defaultdict(lambda: {
        "claim_count": 0,
        "total_claim_payments": 0.0,
        "building_payments": 0.0,
        "contents_payments": 0.0,
        "icc_payments": 0.0
    })
    
    for r in records:
        tract = r.get('censusTract')
        if not tract:
            continue
            
        tracts[tract]["claim_count"] += 1
        
        building = r.get('buildingDamageAmount') or 0.0
        contents = r.get('contentsDamageAmount') or 0.0
        icc = r.get('iccDamageAmount') or 0.0
        
        tracts[tract]["building_payments"] += building
        tracts[tract]["contents_payments"] += contents
        tracts[tract]["icc_payments"] += icc
        tracts[tract]["total_claim_payments"] += (building + contents + icc)
        
    return tracts

def write_csv(filename, tracts_data):
    print(f"Writing {filename}...")
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    headers = [
        "GEOID", "claim_count", "claims_per_1000_residents", 
        "total_claim_payments", "claim_payments_per_capita", 
        "average_payment_per_claim", "building_payments", 
        "contents_payments", "icc_payments"
    ]
    
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        
        for geoid, data in tracts_data.items():
            avg_payment = data["total_claim_payments"] / data["claim_count"] if data["claim_count"] > 0 else 0
            
            writer.writerow({
                "GEOID": geoid,
                "claim_count": data["claim_count"],
                "claims_per_1000_residents": "",
                "total_claim_payments": round(data["total_claim_payments"], 2),
                "claim_payments_per_capita": "",
                "average_payment_per_claim": round(avg_payment, 2),
                "building_payments": round(data["building_payments"], 2),
                "contents_payments": round(data["contents_payments"], 2),
                "icc_payments": round(data["icc_payments"], 2)
            })
    print("Done!")

if __name__ == "__main__":
    states = ["CA", "TX", "LA", "MS", "AL", "GA", "FL", "SC", "NC"]
    
    print("--- Starting 2015-16 El Nino Extraction ---")
    recs_15_16 = fetch_fema_claims("2015-11-01", "2016-04-30", states)
    tracts_15_16 = aggregate_by_tract(recs_15_16)
    write_csv("data/events/el_nino_2015_16_nfip_by_tract.csv", tracts_15_16)
    
    print("\n--- Starting 2023-24 El Nino Extraction ---")
    recs_23_24 = fetch_fema_claims("2023-11-01", "2024-04-30", states)
    tracts_23_24 = aggregate_by_tract(recs_23_24)
    write_csv("data/events/el_nino_2023_24_nfip_by_tract.csv", tracts_23_24)
    
    print("\nSuccessfully built both CSV files directly into your data/events/ folder!")

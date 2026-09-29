import urllib.request
import urllib.parse
import json
import csv
import os
from collections import defaultdict

def fetch_pa_projects(disaster_numbers):
    print(f"Fetching FEMA Public Assistance projects for disasters: {disaster_numbers}")
    
    county_totals = defaultdict(lambda: {
        "pa_project_amount": 0.0,
        "pa_federal_share": 0.0
    })
    
    for dnum in disaster_numbers:
        print(f"  Fetching DR-{dnum}...")
        skip = 0
        top = 10000
        
        while True:
            filter_query = urllib.parse.quote(f"disasterNumber eq {dnum}")
            url = f"https://www.fema.gov/api/open/v2/PublicAssistanceFundedProjectsDetails?$filter={filter_query}&$top={top}&$skip={skip}"
            
            try:
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req) as response:
                    data = json.loads(response.read().decode())
                    records = data.get("PublicAssistanceFundedProjectsDetails", [])
                    
                    if not records:
                        break
                        
                    for r in records:
                        state_code = str(r.get('stateNumberCode') or '').strip()
                        county_code = str(r.get('countyCode') or '').strip()
                        
                        # Only aggregate if we have valid FIPS codes
                        if state_code and county_code and state_code != "0" and county_code != "0":
                            geoid = state_code.zfill(2) + county_code.zfill(3)
                            
                            proj_amt = float(r.get('projectAmount') or 0.0)
                            fed_share = float(r.get('federalShareObligated') or 0.0)
                            
                            county_totals[geoid]["pa_project_amount"] += proj_amt
                            county_totals[geoid]["pa_federal_share"] += fed_share
                            
                    skip += top
                    
            except Exception as e:
                print(f"Error fetching data for {dnum}: {e}")
                break
                
    return county_totals

def write_csv(filename, county_totals):
    print(f"Writing {filename}...")
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    headers = [
        "GEOID", "pa_project_amount", "pa_federal_share"
    ]
    
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        
        for geoid, data in county_totals.items():
            writer.writerow({
                "GEOID": geoid,
                "pa_project_amount": round(data["pa_project_amount"], 2),
                "pa_federal_share": round(data["pa_federal_share"], 2)
            })
    print("Done!")

if __name__ == "__main__":
    # Disasters declared for the massive CA 2022-23 winter storms
    ca_winter_disasters_22_23 = ["4683", "4699", "4713", "4714"]
    
    totals = fetch_pa_projects(ca_winter_disasters_22_23)
    
    # Save the CSV directly to the dashboard's data directory
    write_csv("data/events/fema_pa_2022_23_by_county.csv", totals)
    print("\nSuccessfully built FEMA PA county-level CSV!")

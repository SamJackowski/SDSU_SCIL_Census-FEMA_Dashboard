import urllib.request
import urllib.parse
import json
from datetime import datetime

def get_fema_disasters(state, start_date, end_date):
    # Fetch all disaster declarations for the state
    filter_query = urllib.parse.quote(f"state eq '{state}'")
    url = f"https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter={filter_query}"
    req = urllib.request.Request(url)
    
    disasters = {}
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            records = data.get("DisasterDeclarationsSummaries", [])
            
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            
            for r in records:
                inc_date_str = r.get("incidentBeginDate", "")
                if not inc_date_str: continue
                
                # Format: 2023-01-08T00:00:00.000Z
                inc_date = datetime.strptime(inc_date_str[:10], "%Y-%m-%d")
                
                if start <= inc_date <= end:
                    # Only keep weather/storm related incidents
                    itype = r.get("incidentType", "")
                    if itype in ["Flood", "Severe Storm", "Mudslide", "Landslide", "Coastal Storm"]:
                        disasters[r["disasterNumber"]] = r.get("declarationTitle", "Unknown Disaster")
                        
    except Exception as e:
        print(f"Error fetching disaster summaries: {e}")
        
    return disasters

def get_disaster_financials(disaster_number):
    # Fetch the financial summary for a specific disaster
    filter_query = urllib.parse.quote(f"disasterNumber eq {disaster_number}")
    url = f"https://www.fema.gov/api/open/v1/FemaWebDisasterSummaries?$filter={filter_query}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            records = data.get("FemaWebDisasterSummaries", [])
            if records:
                r = records[0]
                ia = float(r.get("totalApprovedAmountIhp") or 0)
                pa = float(r.get("totalObligatedAmountPa") or 0)
                return ia, pa
    except Exception as e:
        print(f"  [API Error getting financials for {disaster_number}: {e}]")
    return 0.0, 0.0

def analyze_period(label, start_date, end_date):
    print(f"\n======================================================")
    print(f"--- {label} ({start_date} to {end_date}) ---")
    disasters = get_fema_disasters("CA", start_date, end_date)
    
    if not disasters:
        print("No storm/flood disasters declared for this period.")
        return
        
    total_ia = 0
    total_pa = 0
    
    for dnum, title in disasters.items():
        ia, pa = get_disaster_financials(dnum)
        total_ia += ia
        total_pa += pa
        print(f"\nDisaster {dnum}: {title.title()}")
        print(f"  -> Individual Assistance (Homeowners): ${ia:,.2f}")
        print(f"  -> Public Assistance (Infrastructure): ${pa:,.2f}")
        
    total = total_ia + total_pa
    print(f"\nTOTAL FEMA ASSISTANCE for {label}: ${total:,.2f}")
    print(f"======================================================\n")

if __name__ == "__main__":
    # 2015-16 El Nino
    analyze_period("2015-16 El Niño", "2015-11-01", "2016-04-30")
    
    # 2023-24 El Nino
    analyze_period("2023-24 El Niño", "2023-11-01", "2024-04-30")
    
    # Adding the 2022-23 winter as a bonus, as this was the season of the most massive
    # CA atmospheric rivers (even though it was technically a La Nina year!)
    analyze_period("2022-23 Extreme Winter Storms", "2022-12-01", "2023-04-30")

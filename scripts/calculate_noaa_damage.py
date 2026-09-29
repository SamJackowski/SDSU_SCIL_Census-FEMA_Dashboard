import urllib.request
import gzip
import csv
import re
from io import BytesIO

def parse_damage(val):
    if not val: return 0.0
    val = str(val).upper()
    multiplier = 1
    if 'K' in val: multiplier = 1e3
    elif 'M' in val: multiplier = 1e6
    elif 'B' in val: multiplier = 1e9
    
    # Extract number
    num_str = re.sub(r'[^0-9.]', '', val)
    if not num_str: return 0.0
    return float(num_str) * multiplier

def fetch_noaa_damage(year, start_month, end_month, state="CALIFORNIA"):
    print(f"Fetching NOAA data for {year}...")
    base_url = "https://www1.ncdc.noaa.gov/pub/data/swdi/stormevents/csvfiles/"
    
    # 1. Fetch directory listing to find the exact filename for the given year
    try:
        req = urllib.request.urlopen(base_url)
        html = req.read().decode('utf-8')
    except Exception as e:
        print(f"Failed to fetch directory: {e}")
        return 0.0
        
    filename = None
    for line in html.split('\n'):
        if f'StormEvents_details-ftp_v1.0_d{year}_c' in line:
            match = re.search(r'href="(StormEvents_details[^"]+\.csv\.gz)"', line)
            if match:
                filename = match.group(1)
                break
                
    if not filename:
        print(f"Could not find NOAA CSV for {year}")
        return 0.0
        
    file_url = base_url + filename
    print(f"Downloading {file_url}...")
    
    total_damage = 0.0
    try:
        req = urllib.request.urlopen(file_url)
        with gzip.open(BytesIO(req.read()), 'rt', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['STATE'].upper() != state:
                    continue
                
                # Check month
                month = int(row['BEGIN_YEARMONTH'][-2:]) # format YYYYMM
                if month >= start_month and month <= end_month:
                    # Sum property and crop damage
                    prop = parse_damage(row.get('DAMAGE_PROPERTY', ''))
                    crop = parse_damage(row.get('DAMAGE_CROP', ''))
                    total_damage += (prop + crop)
    except Exception as e:
        print(f"Failed to process {year} data: {e}")
        
    return total_damage

if __name__ == "__main__":
    # 2015-2016 El Nino (Nov 2015 - Apr 2016)
    damage_2015 = fetch_noaa_damage(2015, 11, 12)
    damage_2016 = fetch_noaa_damage(2016, 1, 4)
    total_15_16 = damage_2015 + damage_2016
    print(f"\nTotal California NOAA Damage for 2015-16 El Nino: ${total_15_16:,.2f}")
    
    # 2023-2024 El Nino (Nov 2023 - Apr 2024)
    damage_2023 = fetch_noaa_damage(2023, 11, 12)
    damage_2024 = fetch_noaa_damage(2024, 1, 4)
    total_23_24 = damage_2023 + damage_2024
    print(f"Total California NOAA Damage for 2023-24 El Nino: ${total_23_24:,.2f}")

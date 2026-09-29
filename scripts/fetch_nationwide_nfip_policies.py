import os
import pandas as pd
import urllib.request
import urllib.parse
import json
import time

def fetch_page_with_retries(skip, filter_str, retries=5):
    url = f"https://www.fema.gov/api/open/v2/FimaNfipPolicies?$filter={urllib.parse.quote(filter_str)}&$select=censusTract,policyCount&$top=10000&$skip={skip}"
    
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode())
                return data.get('FimaNfipPolicies', [])
        except urllib.error.HTTPError as e:
            if e.code == 429:
                # Rate limited! Sleep and backoff
                time.sleep((attempt + 1) * 2) 
            else:
                print(f"\nHTTP Error {e.code} on skip {skip}")
                return []
        except Exception as e:
            time.sleep((attempt + 1) * 2)
            
    print(f"\nFailed to fetch skip {skip} after {retries} retries.")
    return []

def download_and_process():
    out_file = "data/events/nationwide_nfip_policies_2023_by_tract.csv"
    os.makedirs("data/events", exist_ok=True)
    
    filter_str = "policyEffectiveDate ge '2023-01-01' and policyEffectiveDate le '2023-12-31'"
    
    print("Oops! We hit FEMA's rate limits. Switching to a polite, sequential downloader with retries...")
    print("Fetching active NFIP policies for 2023...")
    
    tract_counts = {}
    skip = 0
    total_fetched = 0
    empty_pages = 0
    
    while True:
        records = fetch_page_with_retries(skip, filter_str)
        
        if not records:
            empty_pages += 1
            if empty_pages > 3: # 3 consecutive empty pages means we hit the end
                break
        else:
            empty_pages = 0
            total_fetched += len(records)
            print(f"\rFetched {total_fetched:,} records so far...", end="", flush=True)
            
            for r in records:
                tract = str(r.get('censusTract') or '').strip().replace('.0', '').zfill(11)
                count = float(r.get('policyCount') or 1.0)
                
                if len(tract) == 11 and tract != "00000000000":
                    tract_counts[tract] = tract_counts.get(tract, 0) + count
        
        skip += 10000
        time.sleep(0.2) # Small delay to respect FEMA's servers

    print(f"\nDone! Processed {total_fetched:,} total policies across {len(tract_counts)} census tracts.")
    
    print("Loading population data to calculate per-capita metrics...")
    pop_mapping = {}
    for fips_int in range(1, 79):
        fips = str(fips_int).zfill(2)
        parquet_file = f"data/tract_variables/{fips}/total_population.parquet"
        if os.path.exists(parquet_file):
            try:
                pop_df = pd.read_parquet(parquet_file, columns=['GEOID', 'year', 'value'])
                max_yr = pop_df['year'].max()
                pop_df = pop_df[pop_df['year'] == max_yr]
                for _, row in pop_df.iterrows():
                    geoid = str(row['GEOID']).replace('.0', '').zfill(11)
                    pop_mapping[geoid] = row['value']
            except:
                pass
                
    print("Formatting final CSV...")
    new_rows = []
    for geoid, count in tract_counts.items():
        pop = pop_mapping.get(geoid, pd.NA)
        if pd.isna(pop) or pop == 0:
            per_1000 = ""
        else:
            per_1000 = (count / pop) * 1000
            
        new_rows.append({
            "GEOID": geoid,
            "nfip_policy_count": count,
            "nfip_policies_per_1000": round(per_1000, 2) if per_1000 != "" else ""
        })
        
    df_out = pd.DataFrame(new_rows)
    df_out.to_csv(out_file, index=False)
    print(f"Success! Saved to {out_file}")

if __name__ == "__main__":
    download_and_process()

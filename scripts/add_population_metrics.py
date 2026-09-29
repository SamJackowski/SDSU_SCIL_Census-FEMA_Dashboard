import os
import pandas as pd

def update_csv_with_population(csv_path, target_year, states):
    print(f"Updating {csv_path}...")
    
    try:
        df = pd.read_csv(csv_path, dtype={'GEOID': str})
    except Exception as e:
        print(f"  Failed to read CSV: {e}")
        return
        
    if df.empty:
        print("  CSV is empty, skipping.")
        return
        
    df['GEOID'] = df['GEOID'].astype(str).str.zfill(11)
    
    # State mapping to FIPS for reading the correct parquets
    state_abbr_to_fips = {
        "Florida": "12", "Georgia": "13", "South Carolina": "45", "North Carolina": "37",
        "Louisiana": "22", "Texas": "48", "Puerto Rico": "72", "California": "06",
        "Mississippi": "28", "Alabama": "01"
    }
    
    fips_list = [state_abbr_to_fips[s] for s in states if s in state_abbr_to_fips]
    
    # Load population mapping
    pop_mapping = {}
    for fips in fips_list:
        parquet_file = f"data/tract_variables/{fips}/total_population.parquet"
        if os.path.exists(parquet_file):
            try:
                pop_df = pd.read_parquet(parquet_file, columns=['GEOID', 'year', 'value'])
                
                # Check if target year exists, otherwise fallback to the most recent year
                if target_year in pop_df['year'].values:
                    pop_df = pop_df[pop_df['year'] == target_year]
                else:
                    max_yr = pop_df['year'].max()
                    print(f"  Note: Year {target_year} not in {parquet_file}, using {max_yr} instead.")
                    pop_df = pop_df[pop_df['year'] == max_yr]
                    
                for _, row in pop_df.iterrows():
                    geoid = str(row['GEOID']).replace('.0', '').zfill(11)
                    pop_mapping[geoid] = row['value']
            except Exception as e:
                print(f"  Error reading {parquet_file}: {e}")
        else:
            print(f"  Warning: {parquet_file} not found!")
                
    # Calculate fields
    new_rows = []
    for _, row in df.iterrows():
        geoid = row['GEOID']
        count = float(row.get('claim_count', 0))
        total_pay = float(row.get('total_claim_payments', 0))
        
        pop = pop_mapping.get(geoid, pd.NA)
        
        avg_pay = (total_pay / count) if count > 0 else 0.0
        
        if pd.isna(pop) or pop == 0:
            per_1000 = ""
            per_capita = ""
        else:
            per_1000 = (count / pop) * 1000
            per_capita = total_pay / pop
            
        row['average_payment_per_claim'] = round(avg_pay, 2) if pd.notna(avg_pay) else ""
        row['claims_per_1000_residents'] = round(per_1000, 2) if per_1000 != "" else ""
        row['claim_payments_per_capita'] = round(per_capita, 2) if per_capita != "" else ""
        
        new_rows.append(row)
        
    out_df = pd.DataFrame(new_rows)
    
    # Ensure correct column order
    cols = ['GEOID', 'claim_count', 'claims_per_1000_residents', 'total_claim_payments', 
            'claim_payments_per_capita', 'average_payment_per_claim', 
            'building_payments', 'contents_payments', 'icc_payments']
    
    final_cols = [c for c in cols if c in out_df.columns]
    out_df = out_df[final_cols]
    
    out_df.to_csv(csv_path, index=False)
    print("  Done!")

if __name__ == "__main__":
    configs = [
        ("data/events/matthew_nfip_by_tract.csv", 2016, ["Florida", "Georgia", "South Carolina", "North Carolina"]),
        ("data/events/irma_nfip_by_tract.csv", 2017, ["Florida", "Georgia", "South Carolina"]),
        ("data/events/maria_nfip_by_tract.csv", 2017, ["Puerto Rico"]),
        ("data/events/laura_nfip_by_tract.csv", 2020, ["Louisiana", "Texas"]),
        ("data/events/el_nino_2015_16_nfip_by_tract.csv", 2016, ["California", "Texas", "Louisiana", "Mississippi", "Alabama", "Georgia", "Florida", "South Carolina", "North Carolina"]),
        ("data/events/el_nino_2023_24_nfip_by_tract.csv", 2024, ["California", "Texas", "Louisiana", "Mississippi", "Alabama", "Georgia", "Florida", "South Carolina", "North Carolina"])
    ]
    
    print("Starting population metric calculations...")
    for path, year, states in configs:
        if os.path.exists(path):
            update_csv_with_population(path, year, states)
            
    print("\nSuccessfully updated all NFIP CSVs with per capita and per 1000 metrics!")

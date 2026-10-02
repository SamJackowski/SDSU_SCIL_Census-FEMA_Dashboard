# SDSU SCIL Census–FEMA Dashboard

An interactive web dashboard for exploring county-level demographic, socioeconomic, and FEMA National Risk Index data across the United States.  
   
Created by Sam Jackowski for the San Diego State University Climate Informatics Lab (SCIL)  
Directed by Distinguished Professor Samuel Shen (SCIL Director)  
Released August 2026   
Version 1.1.3.3

[See patch history](https://github.com/SamJackowski/SDSU_SCIL_Census-FEMA_Dashboard/blob/main/CHANGELOG.md)  

The dashboard combines American Community Survey (ACS) estimates with FEMA hazard metrics to support exploratory analysis of population characteristics and natural hazard risk at the county level.

<img width="1277" height="665" alt="image" src="https://github.com/user-attachments/assets/5934a4b8-5719-4524-acc5-f4b11265b9f3" />


 
## Running the Dashboard

The dashboard can be viewed at the link below:  
https://samjackowski.github.io/SDSU_SCIL_Census-FEMA_Dashboard/

## Features

- Interactive county and census tract choropleth maps
- Animated yearly visualization for ACS variables
- Census tract insurance info for specific disaster events.
- FEMA hazard and National Risk Index variables
- State,county, and census tract filtering
- Regional preset selections
- Summary statistics and county rankings
- Time series visualization for ACS variables
- Variable metadata panel
- Multiple color palettes
- Light and dark themes

## Data Sources

- U.S. Census Bureau American Community Survey (ACS)
- FEMA National Risk Index (NRI)

## Data Pipeline

The dataset used by this dashboard was generated using the same downloader as my Census Data AI Assistant project.

The data preparation notebook is available [here](https://github.com/SamJackowski/SDSU_SCIL_CensusData_AI_Assistant-/blob/main/CensusData_Downloader_App_PATCHED.ipynb)

## Technologies

- HTML
- CSS
- JavaScript
- Plotly.js
- Hyparquet
- Python
- MapLibre PMTiles

## Help

Detailed information about each variable used in the Dashboard can be found in [Variable Dictionary](VARIABLE_DICTIONARY.md)

## Repository Structure

```
.
├── CHANGELOG.md
├── README.md
├── VARIABLE_DICTIONARY.md
├── app.js
├── build_county_lookup.py
├── index.html
├── styles.css
└── data
    ├── events/
    │   └── ...
    ├── tiles/
    │   └── ...
    ├── tract_variables/
    │   └── ...
    ├── county_lookup.json
    ├── us_states_geojson.json
    ├── us_counties_geojson.json
    ├── acs_state_year_fema_flood_risk.parquet
    └── acs_county_year_fema_flood_risk.parquet
└── scripts
    └── ...

```
## More Previews

### State Filter (Map):
  
<img width="1278" height="675" alt="image" src="https://github.com/user-attachments/assets/5243a3e9-4e4a-4789-8972-cde7b405a93c" />

### Tract Filter (Map):

<img width="1276" height="678" alt="image" src="https://github.com/user-attachments/assets/e4c7ad0b-6690-4d34-8137-88ef61f0e6fc" />

### Time Series:
  
<img width="1265" height="665" alt="image" src="https://github.com/user-attachments/assets/87e5214e-4563-4ee9-a8e6-f33c86bdff8c" />

### Statistics:
  
<img width="1265" height="662" alt="image" src="https://github.com/user-attachments/assets/9fc1e08d-7018-488d-964e-11e3aada0e68" />

### Specific Events:

<img width="1277" height="674" alt="image" src="https://github.com/user-attachments/assets/3567db76-4a94-40a4-bec4-e4af62009184" />

### Event Comparer: 

<img width="1262" height="659" alt="image" src="https://github.com/user-attachments/assets/06fda428-b649-4bd7-a9e1-80a91c4d8daa" />










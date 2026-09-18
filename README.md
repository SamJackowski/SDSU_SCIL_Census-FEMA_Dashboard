# SDSU SCIL Census–FEMA Dashboard

An interactive web dashboard for exploring county-level demographic, socioeconomic, and FEMA National Risk Index data across the United States.  
   
Created by Sam Jackowski for the San Diego State University Climate Informatics Lab (SCIL)  
Directed by Distinguished Professor Samuel Shen (SCIL Director)  
August 2026   
Version 1.1.4  

[See patch history](https://github.com/SamJackowski/SDSU_SCIL_Census-FEMA_Dashboard/blob/main/CHANGELOG.md)  

The dashboard combines American Community Survey (ACS) estimates with FEMA hazard metrics to support exploratory analysis of population characteristics and natural hazard risk at the county level.

<img width="1257" height="585" alt="image" src="https://github.com/user-attachments/assets/f038030e-dadc-4160-8f8e-cf771bb3d697" />

 
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

```
## More Previews

### State Filter (Map):
  
<img width="1229" height="586" alt="image" src="https://github.com/user-attachments/assets/fadbcd59-3d6f-45e7-b65b-74fc85f1f38b" />

### Tract Filter (Map):

<img width="1189" height="581" alt="image" src="https://github.com/user-attachments/assets/4287d7bb-6c5f-4173-b37a-1ebf3ca3fd26" />


### Time Series:
  
<img width="938" height="602" alt="image" src="https://github.com/user-attachments/assets/271efa93-b667-4da1-a05e-bccb30165c9d" />


### Statistics:
  
<img width="1203" height="644" alt="image" src="https://github.com/user-attachments/assets/e26e6d85-1838-4b7a-95ba-fd7455650187" />

### Specific Events:

<img width="1242" height="676" alt="image" src="https://github.com/user-attachments/assets/9e3d3a76-e4ad-4401-a422-41a1dbc93e74" />








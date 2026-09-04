# SDSU SCIL Census–FEMA Dashboard

An interactive web dashboard for exploring county-level demographic, socioeconomic, and FEMA National Risk Index data across the United States.  
  
Created by the San Diego State University Climate Informatics Lab  
August 2026  
Version 1.1.2

[See patch history](https://github.com/SamJackowski/SDSU_SCIL_Census-FEMA_Dashboard/blob/main/CHANGELOG.md)  

The dashboard combines American Community Survey (ACS) estimates with FEMA hazard metrics to support exploratory analysis of population characteristics and natural hazard risk at the county level.

<img width="1257" height="585" alt="image" src="https://github.com/user-attachments/assets/f038030e-dadc-4160-8f8e-cf771bb3d697" />

 
## Running the Dashboard

The dashboard can be viewed at the link below:  
https://samjackowski.github.io/SDSU_SCIL_Census-FEMA_Dashboard/

## Features

- Interactive county choropleth maps
- Animated yearly visualization for ACS variables
- FEMA hazard and National Risk Index variables
- State and county filtering
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

## Help

Detailed information about each variable used in the Dashboard can be found in [Variable Dictionary](VARIABLE_DICTIONARY.md)

## Repository Structure

```
.
├── app.js
├── index.html
├── styles.css
└── data/
    ├── acs_county_year_fema_flood_risk.parquet
    └── us_counties_geojson.json
    └── us_states_geojson.json
    └── acs_state_year_fema_flood_risk.parquet
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







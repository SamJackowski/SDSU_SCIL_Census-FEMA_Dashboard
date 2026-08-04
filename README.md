# SDSU SCIL Census–FEMA Dashboard

An interactive web dashboard for exploring county-level demographic, socioeconomic, and FEMA National Risk Index data across the United States.

The dashboard combines American Community Survey (ACS) estimates with FEMA hazard metrics to support exploratory analysis of population characteristics and natural hazard risk at the county level.

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

The dataset used by this dashboard was generated using the Census Data AI Assistant project.

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
```
## Preview  
### Default View (Map):  
  
<img width="1265" height="667" alt="image" src="https://github.com/user-attachments/assets/092a6041-7a28-433e-97eb-6a52bd0faefb" />

### State Filter (Map):
  
<img width="1267" height="656" alt="image" src="https://github.com/user-attachments/assets/54c0988b-0676-413c-a512-286c8d778d55" />

### Time Series:
  
<img width="1263" height="570" alt="image" src="https://github.com/user-attachments/assets/b91d3f40-9b3b-411c-a05f-9cf068a41642" />

### Statistics:
  
<img width="1007" height="444" alt="image" src="https://github.com/user-attachments/assets/31898fac-fead-4782-a45c-3d67af38119a" />






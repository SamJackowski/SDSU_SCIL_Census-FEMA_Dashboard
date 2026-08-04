# SDSU SCIL Census–FEMA Dashboard

An interactive web dashboard for exploring county-level demographic, socioeconomic, and FEMA National Risk Index data across the United States.

The dashboard combines American Community Survey (ACS) estimates with FEMA hazard metrics to support exploratory analysis of population characteristics and natural hazard risk at the county level.

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

## Technologies

- HTML
- CSS
- JavaScript
- Plotly.js
- Hyparquet

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

## Running the Dashboard

The dashboard can be viewed at the link below:  
https://samjackowski.github.io/SDSU_SCIL_Census-FEMA_Dashboard/


# Variable Dictionary

This document describes the variables available in the **SDSU SCIL Census–FEMA Dashboard** (including U.S. Census, FEMA National Risk Index, and Global Climate & Disaster Risk modules).

The dashboard combines:
- **U.S. County, State & Tract Data:** Demographic and socioeconomic indicators from the **U.S. Census Bureau American Community Survey (ACS)** with natural hazard metrics from the **FEMA National Risk Index (NRI)** and disaster loss claims from the **FEMA National Flood Insurance Program (NFIP)**.
- **Global Country-Level Data:** Multi-hazard crisis risk, water scarcity, economic resilience, climate adaptation, disaster casualties, and agricultural shock metrics from the **World Bank**, the **University of Notre Dame (ND-GAIN)**, **CRED EM-DAT**, **World Resources Institute (WRI Aqueduct)**, **UN OCHA (INFORM)**, and the **UN Food and Agriculture Organization (FAO)**.

---

# Census Variables

## Total Population
**Variable:** `total_population`

**Definition:** Estimated total resident population.

**Unit:** People

**Source:** U.S. Census Bureau American Community Survey (ACS)

---

## Median Age
**Variable:** `median_age`

**Definition:** Median age of the resident population.

**Unit:** Years

**Source:** ACS

---

## Population Under 18
**Variable:** `under_18_population`

**Definition:** Number of residents younger than 18 years.

**Unit:** People

**Source:** ACS

---

## Population Under 18 (%)
**Variable:** `under_18_pct`

**Definition:** Percentage of residents younger than 18 years.

**Unit:** Percent

**Source:** ACS

---

## Population Age 65+
**Variable:** `age_65_plus_population`

**Definition:** Number of residents aged 65 years and older.

**Unit:** People

**Source:** ACS

---

## Population Age 65+ (%)
**Variable:** `age_65_plus_pct`

**Definition:** Percentage of residents aged 65 years and older.

**Unit:** Percent

**Source:** ACS

---

## Employment Rate
**Variable:** `employment_rate`

**Definition:** Percentage of the working-age population that is employed.

**Unit:** Percent

**Source:** ACS

---

## Employment-to-Population Ratio
**Variable:** `employment_population_ratio`

**Definition:** Ratio of employed individuals to the total population.

**Unit:** Percent

**Source:** ACS

---

## Labor Force Participation Rate
**Variable:** `labor_force_participation_rate`

**Definition:** Percentage of the eligible population participating in the labor force.

**Unit:** Percent

**Source:** ACS

---

## Unemployment Rate
**Variable:** `unemployment_rate`

**Definition:** Percentage of the labor force that is unemployed.

**Unit:** Percent

**Source:** ACS

---

## Median Household Income
**Variable:** `median_household_income`

**Definition:** Median household income during the previous 12 months (inflation-adjusted).

**Unit:** U.S. Dollars

**Source:** ACS

---

## Per Capita Income
**Variable:** `per_capita_income`

**Definition:** Average income per resident.

**Unit:** U.S. Dollars

**Source:** ACS

---

## Poverty Rate
**Variable:** `poverty_rate`

**Definition:** Percentage of individuals living below the federal poverty line.

**Unit:** Percent

**Source:** ACS

---

## Gini Index
**Variable:** `gini_index`

**Definition:** Measure of income inequality ranging from 0 (perfect equality) to 1 (maximum inequality).

**Unit:** Index

**Source:** ACS

---

## Less Than High School (%)
**Variable:** `less_than_high_school_pct`

**Definition:** Percentage of adults without a high school diploma.

**Unit:** Percent

**Source:** ACS

---

## High School Graduate (%)
**Variable:** `high_school_grad_pct`

**Definition:** Percentage of adults whose highest educational attainment is a high school diploma.

**Unit:** Percent

**Source:** ACS

---

## Bachelor's Degree or Higher (%)
**Variable:** `bachelors_or_higher_pct`

**Definition:** Percentage of adults holding a bachelor's degree or higher.

**Unit:** Percent

**Source:** ACS

---

## Median Home Value
**Variable:** `median_home_value`

**Definition:** Median value of owner-occupied housing units.

**Unit:** U.S. Dollars

**Source:** ACS

---

## Median Gross Rent
**Variable:** `median_gross_rent`

**Definition:** Median monthly gross rent.

**Unit:** U.S. Dollars

**Source:** ACS

---

## Median Year Built
**Variable:** `median_year_built`

**Definition:** Median year in which occupied housing units were built.

**Unit:** Year

**Source:** ACS

---
## Median Annual Homeowners Insurance
**Variable:** `median_homeowners_insurance`

**Definition:** Median annual homeowners insurance cost for owner-occupied housing units with a mortgage, computed via frequency bracket interpolation from Census ACS Table B25141. Note: ACS Table B25141 surveys all owner-occupied mortgaged units, combining single-family detached homes (HO-3 / HO-5) and condominiums / townhomes (HO-6 "walls-in"). In areas with significant condominium density, the tract median reflects this blended distribution, as condo unit-owner policies are substantially lower (~$400–$750/yr) due to HOA master policies covering exterior building structures.

**Unit:** U.S. Dollars / Year

**Source:** ACS (Table B25141)

---


## Vacancy Rate
**Variable:** `vacancy_rate`

**Definition:** Percentage of housing units that are vacant.

**Unit:** Percent

**Source:** ACS

---

## Homeownership Rate
**Variable:** `owner_occupied_pct`

**Definition:** Percentage of occupied housing units that are owner occupied.

**Unit:** Percent

**Source:** ACS

---

## Renter Occupancy Rate
**Variable:** `renter_occupied_pct`

**Definition:** Percentage of occupied housing units that are renter occupied.

**Unit:** Percent

**Source:** ACS

---

## Households Without a Vehicle
**Variable:** `no_vehicle_pct`

**Definition:** Percentage of households with no available vehicle.

**Unit:** Percent

**Source:** ACS

---

# FEMA National Risk Index Variables

These variables originate from the **Federal Emergency Management Agency (FEMA) National Risk Index**.

Unless otherwise noted:

- Higher **risk scores** indicate greater modeled hazard risk.
- Higher **expected annual loss** values indicate greater estimated annual economic losses.
- Higher **annual frequency** values indicate hazards occur more frequently.

---

# Overall Risk

## FEMA Overall Risk Score
**Variable:** `fema_risk_score`

Composite FEMA National Risk Index score summarizing expected annual loss, social vulnerability, and community resilience.

---

## FEMA Expected Annual Loss
**Variable:** `fema_expected_annual_loss`

Estimated average economic loss from all modeled natural hazards.

**Unit:** USD/year

---

## FEMA Social Vulnerability Score
**Variable:** `fema_social_vulnerability_score`

Score describing demographic and socioeconomic characteristics that may increase vulnerability during disasters.

---

## FEMA Community Resilience Score
**Variable:** `fema_resilience_score`

Score representing a community's ability to prepare for, respond to, and recover from hazards.

---

# Flood

- `fema_flood_max_risk_score`
- `fema_flood_expected_annual_loss`
- `fema_coastal_flood_risk_score`
- `fema_coastal_flood_expected_annual_loss`
- `fema_inland_flood_risk_score`
- `fema_inland_flood_expected_annual_loss`

These variables quantify overall, coastal, and inland flood risk and expected annual economic loss.

---

# Wildfire

- `fema_wildfire_risk_score`
- `fema_wildfire_expected_annual_loss`
- `fema_wildfire_total_exposure`
- `fema_wildfire_annual_frequency`
- `fema_wildfire_risk_value`

These variables describe wildfire hazard intensity, expected annual losses, exposed assets, event frequency, and modeled risk value.

---

# Hurricane

- `fema_hurricane_risk_score`
- `fema_hurricane_expected_annual_loss`
- `fema_hurricane_annual_frequency`

Measures hurricane risk, expected losses, and modeled annual occurrence.

---

# Earthquake

- `fema_earthquake_risk_score`
- `fema_earthquake_expected_annual_loss`
- `fema_earthquake_annual_frequency`

Measures earthquake hazard risk, expected losses, and annual probability of damaging events.

---

# Tornado

- `fema_tornado_risk_score`
- `fema_tornado_expected_annual_loss`
- `fema_tornado_annual_frequency`

Measures tornado hazard risk, expected losses, and annual frequency.

---

# Hail

- `fema_hail_risk_score`
- `fema_hail_expected_annual_loss`
- `fema_hail_annual_frequency`

Measures hail hazard risk, expected annual losses, and frequency.

---

# Strong Wind

- `fema_strong_wind_risk_score`
- `fema_strong_wind_expected_annual_loss`
- `fema_strong_wind_annual_frequency`

Measures non-hurricane straight-line wind hazard.

---

# Drought

- `fema_drought_risk_score`
- `fema_drought_expected_annual_loss`
- `fema_drought_annual_frequency`

Measures drought hazard risk and estimated annual frequency.

---

# Heat Wave

- `fema_heat_wave_risk_score`
- `fema_heat_wave_expected_annual_loss`
- `fema_heat_wave_annual_frequency`

Measures heat wave hazard risk and estimated annual frequency.

---

---

# Property Insurance & Actuarial Rate-Making Metrics

### Indicative Pure Loss Cost Rate
**Metric:** `indicative_loss_cost_rate`  
**Card Label:** `Indicative Loss Cost Rate ($ per $1,000 TIV)`  
**Definition:** The modeled annual expected pure loss cost per \$1,000 of insurable structural building exposure (Total Insured Value / TIV), strictly covering physical catastrophe damage before adding operating expenses, reinsurance margins, broker commissions, or carrier profit.  
**Formula:**  
$$\text{Loss Cost Rate} = \left(\frac{\text{Building Expected Annual Loss (EAL)}}{\text{Total Building Exposure Value}}\right) \times 1000$$  
**Unit:** \$ per \$1,000 TIV (or basis points of asset value)  
**Interpretation:** Direct baseline hurdle rate for property underwriters. For example, a rate of \$4.46 per \$1,000 indicates that an insurer expects \$2,230 in annualized catastrophe claim payouts for every \$500,000 of insured structural replacement value.  
**Source:** FEMA National Risk Index (NRI) & Hazus Multi-Hazard Exposure Inventory  

---

### Multi-Peril Expected Loss Composition
**Metric:** `peril_loss_composition`  
**Card Label:** `Average Annual Loss (AAL) Composition`  
**Definition:** The proportional contribution (percentage share) of each distinct natural catastrophe peril to the total Expected Annual Loss (EAL) in a jurisdiction.  
**Formula:**  
$$\text{Peril Share (\%)} = \left(\frac{\text{Peril Expected Annual Loss}}{\text{Total Multi-Peril Expected Annual Loss}}\right) \times 100$$  
**Unit:** Percentage (%) and Per-Peril Pure Loss Cost (\$ per \$1,000 TIV)  
**Interpretation:** Identifies whether a property portfolio is single-peril dominant (e.g., 60%+ earthquake in California or flood in the Gulf Coast) or diversifies across independent perils (wind, convective storm, wildfire, flood).  
**Source:** FEMA National Risk Index (NRI)  

---

### FEMA Community Rating System (CRS) Class & Flood Discount
**Metric:** `fema_crs_class`  
**Card Label:** `FEMA CRS Classification & Flood Mitigation Profile`  
**Definition:** Community-level flood mitigation rating under the National Flood Insurance Program (NFIP), categorized into 10 classes. Communities earn credit points for exceeding minimum NFIP standards through floodplain regulations, stormwater management, open-space preservation, and public awareness.  
**Discount Schedule:**  
- **Class 1 (4,500+ pts):** 45% premium discount in Special Flood Hazard Areas (SFHA)  
- **Class 2 (4,000–4,499 pts):** 40% SFHA discount  
- **Class 3 (3,500–3,999 pts):** 35% SFHA discount  
- **Class 4 (3,000–3,499 pts):** 30% SFHA discount  
- **Class 5 (2,500–2,999 pts):** 25% SFHA discount  
- **Class 6 (2,000–2,499 pts):** 20% SFHA discount  
- **Class 7 (1,500–1,999 pts):** 15% SFHA discount  
- **Class 8 (1,000–1,499 pts):** 10% SFHA discount  
- **Class 9 (500–999 pts):** 5% SFHA discount  
- **Class 10 (0–499 pts / Non-participating):** 0% discount (Standard baseline NFIP rate)  
**Interpretation:** High CRS classifications (Classes 1–5) demonstrate superior local infrastructure resiliency, proactive stormwater standards, and substantially reduced structural flood loss frequency.  
**Source:** FEMA NFIP Community Rating System (CRS) & FEMA NRI Community Resilience (HVRI BRIC)

---

# Interpretation Notes

- Census variables are derived from the **American Community Survey (ACS)**.
- FEMA variables are derived from the **FEMA National Risk Index (NRI)**.
- Expected annual loss variables are estimates of long-term average annual economic loss.
- Risk scores are relative measures and should generally be interpreted by comparing counties rather than as absolute values.
=======
# Variable Dictionary

This document describes the variables available in the **SDSU SCIL Census–FEMA Dashboard**.

The dashboard combines county-level demographic and socioeconomic indicators from the **U.S. Census Bureau American Community Survey (ACS)** with natural hazard metrics from the **FEMA National Risk Index (NRI)**.

---

# Census Variables

## Total Population
**Variable:** `total_population`

**Definition:** Estimated total resident population.

**Unit:** People

**Source:** U.S. Census Bureau American Community Survey (ACS)

---

## Median Age
**Variable:** `median_age`

**Definition:** Median age of the resident population.

**Unit:** Years

**Source:** ACS

---

## Population Under 18
**Variable:** `under_18_population`

**Definition:** Number of residents younger than 18 years.

**Unit:** People

**Source:** ACS

---

## Population Under 18 (%)
**Variable:** `under_18_pct`

**Definition:** Percentage of residents younger than 18 years.

**Unit:** Percent

**Source:** ACS

---

## Population Age 65+
**Variable:** `age_65_plus_population`

**Definition:** Number of residents aged 65 years and older.

**Unit:** People

**Source:** ACS

---

## Population Age 65+ (%)
**Variable:** `age_65_plus_pct`

**Definition:** Percentage of residents aged 65 years and older.

**Unit:** Percent

**Source:** ACS

---

## Employment Rate
**Variable:** `employment_rate`

**Definition:** Percentage of the working-age population that is employed.

**Unit:** Percent

**Source:** ACS

---

## Employment-to-Population Ratio
**Variable:** `employment_population_ratio`

**Definition:** Ratio of employed individuals to the total population.

**Unit:** Percent

**Source:** ACS

---

## Labor Force Participation Rate
**Variable:** `labor_force_participation_rate`

**Definition:** Percentage of the eligible population participating in the labor force.

**Unit:** Percent

**Source:** ACS

---

## Unemployment Rate
**Variable:** `unemployment_rate`

**Definition:** Percentage of the labor force that is unemployed.

**Unit:** Percent

**Source:** ACS

---

## Median Household Income
**Variable:** `median_household_income`

**Definition:** Median household income during the previous 12 months (inflation-adjusted).

**Unit:** U.S. Dollars

**Source:** ACS

---

## Per Capita Income
**Variable:** `per_capita_income`

**Definition:** Average income per resident.

**Unit:** U.S. Dollars

**Source:** ACS

---

## Poverty Rate
**Variable:** `poverty_rate`

**Definition:** Percentage of individuals living below the federal poverty line.

**Unit:** Percent

**Source:** ACS

---

## Gini Index
**Variable:** `gini_index`

**Definition:** Measure of income inequality ranging from 0 (perfect equality) to 1 (maximum inequality).

**Unit:** Index

**Source:** ACS

---

## Less Than High School (%)
**Variable:** `less_than_high_school_pct`

**Definition:** Percentage of adults without a high school diploma.

**Unit:** Percent

**Source:** ACS

---

## High School Graduate (%)
**Variable:** `high_school_grad_pct`

**Definition:** Percentage of adults whose highest educational attainment is a high school diploma.

**Unit:** Percent

**Source:** ACS

---

## Bachelor's Degree or Higher (%)
**Variable:** `bachelors_or_higher_pct`

**Definition:** Percentage of adults holding a bachelor's degree or higher.

**Unit:** Percent

**Source:** ACS

---

## Median Home Value
**Variable:** `median_home_value`

**Definition:** Median value of owner-occupied housing units.

**Unit:** U.S. Dollars

**Source:** ACS

---

## Median Gross Rent
**Variable:** `median_gross_rent`

**Definition:** Median monthly gross rent.

**Unit:** U.S. Dollars

**Source:** ACS

---

## Median Year Built
**Variable:** `median_year_built`

**Definition:** Median year in which occupied housing units were built.

**Unit:** Year

**Source:** ACS

---
## Median Annual Homeowners Insurance
**Variable:** `median_homeowners_insurance`

**Definition:** Median annual homeowners insurance cost for owner-occupied housing units with a mortgage, computed via frequency bracket interpolation from Census ACS Table B25141.

**Unit:** U.S. Dollars / Year

**Source:** ACS (Table B25141)

---


## Vacancy Rate
**Variable:** `vacancy_rate`

**Definition:** Percentage of housing units that are vacant.

**Unit:** Percent

**Source:** ACS

---

## Homeownership Rate
**Variable:** `owner_occupied_pct`

**Definition:** Percentage of occupied housing units that are owner occupied.

**Unit:** Percent

**Source:** ACS

---

## Renter Occupancy Rate
**Variable:** `renter_occupied_pct`

**Definition:** Percentage of occupied housing units that are renter occupied.

**Unit:** Percent

**Source:** ACS

---

## Households Without a Vehicle
**Variable:** `no_vehicle_pct`

**Definition:** Percentage of households with no available vehicle.

**Unit:** Percent

**Source:** ACS

---

# FEMA National Risk Index Variables

These variables originate from the **Federal Emergency Management Agency (FEMA) National Risk Index**.

Unless otherwise noted:

- Higher **risk scores** indicate greater modeled hazard risk.
- Higher **expected annual loss** values indicate greater estimated annual economic losses.
- Higher **annual frequency** values indicate hazards occur more frequently.

---

# Overall Risk

## FEMA Overall Risk Score
**Variable:** `fema_risk_score`

Composite FEMA National Risk Index score summarizing expected annual loss, social vulnerability, and community resilience.

---

## FEMA Expected Annual Loss
**Variable:** `fema_expected_annual_loss`

Estimated average economic loss from all modeled natural hazards.

**Unit:** USD/year

---

## FEMA Social Vulnerability Score
**Variable:** `fema_social_vulnerability_score`

Score describing demographic and socioeconomic characteristics that may increase vulnerability during disasters.

---

## FEMA Community Resilience Score
**Variable:** `fema_resilience_score`

Score representing a community's ability to prepare for, respond to, and recover from hazards.

---

# Flood

- `fema_flood_max_risk_score`
- `fema_flood_expected_annual_loss`
- `fema_coastal_flood_risk_score`
- `fema_coastal_flood_expected_annual_loss`
- `fema_inland_flood_risk_score`
- `fema_inland_flood_expected_annual_loss`

These variables quantify overall, coastal, and inland flood risk and expected annual economic loss.

---

# Wildfire

- `fema_wildfire_risk_score`
- `fema_wildfire_expected_annual_loss`
- `fema_wildfire_total_exposure`
- `fema_wildfire_annual_frequency`
- `fema_wildfire_risk_value`

These variables describe wildfire hazard intensity, expected annual losses, exposed assets, event frequency, and modeled risk value.

---

# Hurricane

- `fema_hurricane_risk_score`
- `fema_hurricane_expected_annual_loss`
- `fema_hurricane_annual_frequency`

Measures hurricane risk, expected losses, and modeled annual occurrence.

---

# Earthquake

- `fema_earthquake_risk_score`
- `fema_earthquake_expected_annual_loss`
- `fema_earthquake_annual_frequency`

Measures earthquake hazard risk, expected losses, and annual probability of damaging events.

---

# Tornado

- `fema_tornado_risk_score`
- `fema_tornado_expected_annual_loss`
- `fema_tornado_annual_frequency`

Measures tornado hazard risk, expected losses, and annual frequency.

---

# Hail

- `fema_hail_risk_score`
- `fema_hail_expected_annual_loss`
- `fema_hail_annual_frequency`

Measures hail hazard risk, expected annual losses, and frequency.

---

# Strong Wind

- `fema_strong_wind_risk_score`
- `fema_strong_wind_expected_annual_loss`
- `fema_strong_wind_annual_frequency`

Measures non-hurricane straight-line wind hazard.

---

# Drought

- `fema_drought_risk_score`
- `fema_drought_expected_annual_loss`
- `fema_drought_annual_frequency`

Measures drought hazard risk and estimated annual frequency.

---

# Heat Wave

- `fema_heat_wave_risk_score`
- `fema_heat_wave_expected_annual_loss`
- `fema_heat_wave_annual_frequency`

Measures heat wave hazard risk and estimated annual frequency.

---

---

# Specific Event Variables

These variables describe insurance claims and payments associated with individual disaster events included in the dashboard. Event variables are primarily derived from **FEMA National Flood Insurance Program (NFIP) claims data**.

The same metrics are used for named hurricane and flood events when the required NFIP data are available.

## Average Payment per Claim

**Dashboard Label:** `<Event Name> Average Payment per Claim`

**Definition:** Average NFIP payment per claim associated with the selected disaster event.

**Unit:** U.S. Dollars per claim

**Source:** FEMA National Flood Insurance Program (NFIP)

---

## Building Payments

**Dashboard Label:** `<Event Name> Building Payments`

**Definition:** Total NFIP payments for insured building damage associated with the selected disaster event.

**Unit:** U.S. Dollars

**Source:** FEMA National Flood Insurance Program (NFIP)

---

## Compliance Payments

**Dashboard Label:** `<Event Name> Compliance Payments`

**Definition:** Total Increased Cost of Compliance (ICC) payments associated with the selected disaster event. These payments may help policyholders meet floodplain management requirements following substantial or repetitive flood damage.

**Unit:** U.S. Dollars

**Source:** FEMA National Flood Insurance Program (NFIP)

---

## Contents Payments

**Dashboard Label:** `<Event Name> Contents Payments`

**Definition:** Total NFIP payments for insured personal property and building contents damaged during the selected disaster event.

**Unit:** U.S. Dollars

**Source:** FEMA National Flood Insurance Program (NFIP)

---

## NFIP Claim Count

**Dashboard Label:** `<Event Name> NFIP Claim Count`

**Definition:** Number of NFIP claims associated with the selected disaster event within the geographic area.

**Unit:** Claims

**Source:** FEMA National Flood Insurance Program (NFIP)

---

## NFIP Claim Payments per Capita

**Dashboard Label:** `<Event Name> NFIP Claim Payments per Capita`

**Definition:** Total NFIP claim payments associated with the selected disaster event divided by the resident population of the geographic area.

**Calculation:**  
`Total NFIP Claim Payments / Population`

**Unit:** U.S. Dollars per resident

**Source:** FEMA National Flood Insurance Program (NFIP) and U.S. Census Bureau population data

---

## NFIP Claims per 1,000 Residents

**Dashboard Label:** `<Event Name> NFIP Claims per 1,000 Residents`

**Definition:** Number of NFIP claims associated with the selected disaster event relative to the population of the geographic area.

**Calculation:**  
`(NFIP Claim Count / Population) × 1,000`

**Unit:** Claims per 1,000 residents

**Source:** FEMA National Flood Insurance Program (NFIP) and U.S. Census Bureau population data

---

## Total Claim Payments

**Dashboard Label:** `<Event Name> Total Claim Payments`

**Definition:** Total NFIP insurance claim payments associated with the selected disaster event within the geographic area.

**Unit:** U.S. Dollars

**Source:** FEMA National Flood Insurance Program (NFIP)

---

# Hurricane Events

Named hurricane events use the NFIP event variables described above.

For example, **Hurricane Harvey** includes:

- Hurricane Harvey Average Payment per Claim
- Hurricane Harvey Building Payments
- Hurricane Harvey Compliance Payments
- Hurricane Harvey Contents Payments
- Hurricane Harvey NFIP Claim Count
- Hurricane Harvey NFIP Claim Payments per Capita
- Hurricane Harvey NFIP Claims per 1,000 Residents
- Hurricane Harvey Total Claim Payments

The same definitions apply to other named hurricanes included in the dashboard.

---

# Flood Events

Named flood events use the same NFIP event variables when the required claim data are available:

- `<Flood Event> Average Payment per Claim`
- `<Flood Event> Building Payments`
- `<Flood Event> Compliance Payments`
- `<Flood Event> Contents Payments`
- `<Flood Event> NFIP Claim Count`
- `<Flood Event> NFIP Claim Payments per Capita`
- `<Flood Event> NFIP Claims per 1,000 Residents`
- `<Flood Event> Total Claim Payments`

These variables represent **NFIP-insured claims and payments**, not the total economic damage caused by the disaster. Properties without NFIP coverage and losses not covered by NFIP are therefore not represented in these measures.

# Global Climate & Disaster Risk Variables

The global module provides country-level indicators across 190+ sovereign states from 2010 to 2024, along with 2030–2080 climate projections. Variables are organized into six primary groups:

---

## World Bank — Development & Resilience

### GDP per Capita
**Variable:** `wb_gdp_per_capita`  
**Dashboard Label:** `GDP per Capita (USD) (World Bank)`  
**Definition:** Gross domestic product divided by midyear population, measured in current U.S. dollars. Serves as a primary baseline metric for national economic resilience, public investment resources, and disaster absorption capacity.  
**Unit:** U.S. Dollars  
**Interpretation:** Higher values indicate greater economic resources and financial capacity to absorb disaster shocks and fund climate adaptation infrastructure.  
**Source:** World Bank (World Development Indicators - `NY.GDP.PCAP.CD`)

---

### Safely Managed Drinking Water (% of population)
**Variable:** `wb_drinking_water_pct`  
**Dashboard Label:** `Safely Managed Drinking Water (% pop) (World Bank)`  
**Definition:** Percentage of the national population using safely managed drinking water services—defined as an improved drinking water source that is accessible on premises, available when needed, and free from fecal and priority chemical contamination.  
**Unit:** Percent  
**Interpretation:** Higher percentages indicate stronger municipal water infrastructure and public health resilience against drought-induced water shortages and flood-borne contamination.  
**Source:** World Bank (WDI) / WHO-UNICEF Joint Monitoring Programme (JMP - `SH.H2O.SMDW.ZS`)

---

### Fertilizer Consumption (kg/ha)
**Variable:** `wb_fertilizer_kg_per_ha`  
**Dashboard Label:** `Fertilizer Consumption (kg/ha) (World Bank)`  
**Definition:** Total fertilizer consumption (manufactured nitrogenous, potash, and phosphate nutrients) expressed in kilograms per hectare of arable land.  
**Unit:** kg/ha  
**Interpretation:** Higher values reflect intensive agricultural inputs, fertigation, and high-productivity farming technologies. Explains high per-hectare yields in arid and greenhouse agricultural regimes.  
**Source:** World Bank (WDI) / UN Food and Agriculture Organization (FAO - `AG.CON.FERT.ZS`)

---

### Access to Electricity (% of population)
**Variable:** `wb_electricity_access_pct`  
**Dashboard Label:** `Access to Electricity (% pop) (World Bank)`  
**Definition:** Percentage of the total population with access to electricity. Electrification is a foundational prerequisite for emergency services, public health facilities, water purification, and disaster communication.  
**Unit:** Percent  
**Interpretation:** Higher percentages indicate greater modern infrastructure coverage and baseline disaster response capability.  
**Source:** World Bank (WDI) / International Energy Agency (IEA - `EG.ELC.ACCS.ZS`)

---

## Notre Dame Global Adaptation Initiative (ND-GAIN)

### ND-GAIN Climate Resilience Index
**Variable:** `ndgain_index`  
**Dashboard Label:** `ND-GAIN Climate Resilience Index (Notre Dame)`  
**Definition:** The ND-GAIN Country Index summarizes a country's overall vulnerability to climate disruptions and its readiness to leverage public and private adaptation investments. It balances vulnerability across six essential sectors with readiness across economic, governance, and social pillars.  
**Calculation:**  
`(Readiness - Vulnerability + 1) × 50`  
**Unit:** Index (0–100)  
**Interpretation:** Higher values indicate stronger national climate resilience and greater adaptive capacity.  
**Source:** University of Notre Dame Environmental Change Initiative (ND-GAIN)

---

### Climate Vulnerability Score
**Variable:** `ndgain_vulnerability`  
**Dashboard Label:** `Climate Vulnerability Score (Notre Dame)`  
**Definition:** Overall climate vulnerability measuring physical and socio-economic exposure, sensitivity, and lack of adaptive capacity across six life-supporting sectors: food, water, health, ecosystem services, human habitat, and infrastructure.  
**Unit:** Score (0–1)  
**Interpretation:** Higher values indicate greater vulnerability and susceptibility to adverse climate disruptions. Lower values are better.  
**Source:** University of Notre Dame (ND-GAIN)

---

### Climate Adaptation Readiness
**Variable:** `ndgain_readiness`  
**Dashboard Label:** `Climate Adaptation Readiness (Notre Dame)`  
**Definition:** Overall adaptation readiness measuring a country's institutional, economic, and social ability to attract and effectively deploy adaptation financing across three pillars: Economic Readiness (investment climate), Governance Readiness (rule of law, political stability, corruption control), and Social Readiness (education, innovation, infrastructure).  
**Unit:** Score (0–1)  
**Interpretation:** Higher values indicate stronger institutional capacity and readiness to absorb climate investments.  
**Source:** University of Notre Dame (ND-GAIN)

---

### Food Vulnerability Score
**Variable:** `ndgain_food_vulnerability`  
**Dashboard Label:** `Food Vulnerability Score (Notre Dame)`  
**Definition:** Vulnerability of the national food supply and agricultural sector to climate change, measuring projected crop yield changes, agricultural population dependency, food import reliance, and rural poverty.  
**Unit:** Score (0–1)  
**Interpretation:** Higher values indicate greater vulnerability to climate-induced food shortfalls and agricultural instability.  
**Source:** University of Notre Dame (ND-GAIN)

---

### Water Vulnerability Score
**Variable:** `ndgain_water_vulnerability`  
**Dashboard Label:** `Water Vulnerability Score (Notre Dame)`  
**Definition:** Vulnerability of freshwater resources to climate disruption, measuring projected water runoff changes, access to reliable drinking water, and dam/groundwater storage capacity.  
**Unit:** Score (0–1)  
**Interpretation:** Higher values indicate greater susceptibility to freshwater deficits, drought, and water supply disruption.  
**Source:** University of Notre Dame (ND-GAIN)

---

## CRED EM-DAT — Disaster Impact

### Disaster Count
**Variable:** `emdat_disaster_count`  
**Dashboard Label:** `Disaster Count (CRED EM-DAT)`  
**Definition:** Number of recorded natural disaster events meeting EM-DAT entry criteria (10 or more deaths, 100 or more people affected, declaration of a state of emergency, or call for international assistance) during the calendar year.  
**Unit:** Disasters  
**Interpretation:** Higher counts indicate more frequent catastrophic events in that country during the year. Zero indicates no qualifying disaster events recorded.  
**Source:** Centre for Research on the Epidemiology of Disasters (CRED EM-DAT, UCLouvain)

---

### Disaster Deaths
**Variable:** `emdat_total_deaths`  
**Dashboard Label:** `Disaster Deaths (CRED EM-DAT)`  
**Definition:** Total confirmed fatalities and missing persons directly attributed to natural disasters during the calendar year.  
**Unit:** People  
**Interpretation:** Higher values indicate more lethal disaster events. Countries with 0 reported deaths are rendered gray on the map.  
**Source:** CRED EM-DAT

---

### Disaster Affected Population
**Variable:** `emdat_total_affected`  
**Dashboard Label:** `Disaster Affected Population (CRED EM-DAT)`  
**Definition:** Total number of people injured, left homeless, or requiring immediate emergency humanitarian assistance following natural disasters during the year.  
**Unit:** People  
**Interpretation:** Higher numbers indicate greater humanitarian disruption across the national population.  
**Source:** CRED EM-DAT

---

## World Resources Institute (WRI) — Aqueduct 4.0 Water Risk

### Water Stress Index
**Variable:** `wri_water_stress`  
**Dashboard Label:** `Water Stress Index (WRI)`  
**Definition:** Ratio of total annual water withdrawals (municipal, industrial, agricultural) to total available renewable surface and groundwater supplies. Available for historical baseline (2024) and projected forward (2030, 2050, 2080) under the Business-as-Usual scenario (SSP3-RCP7.0).  
**Unit:** Score (0–5)  
**Interpretation:** Higher scores indicate greater competition and depletion of water supplies:  
- `0–1`: Low (<10% withdrawn)  
- `1–2`: Low-Medium (10–20%)  
- `2–3`: Medium-High (20–40%)  
- `3–4`: High (40–80%)  
- `4–5`: Extremely High (>80% withdrawn)  
**Source:** World Resources Institute (WRI Aqueduct 4.0)

---

### Water Stress - Pessimistic Scenario (2050)
**Variable:** `wri_water_stress_pessimistic`  
**Dashboard Label:** `Water Stress - Pessimistic Scenario (WRI)`  
**Definition:** Projected water stress under the Pessimistic climate trajectory (SSP3-RCP8.5: high fossil-fuel emissions, fragmented geopolitical cooperation, and slow economic development).  
**Unit:** Score (0–5)  
**Interpretation:** Shows anticipated water scarcity if global emissions follow high-warming projections.  
**Source:** World Resources Institute (WRI Aqueduct 4.0)

---

### Water Stress - Optimistic Scenario (2050)
**Variable:** `wri_water_stress_optimistic`  
**Dashboard Label:** `Water Stress - Optimistic Scenario (WRI)`  
**Definition:** Projected water stress under the Optimistic climate trajectory (SSP1-RCP2.6: rapid green transition, high resource efficiency, and strong global mitigation).  
**Unit:** Score (0–5)  
**Interpretation:** Highlights potential water security gains under ambitious climate stabilization.  
**Source:** World Resources Institute (WRI Aqueduct 4.0)

---

### Agricultural Water Stress
**Variable:** `wri_water_stress_agri`  
**Dashboard Label:** `Agricultural Water Stress (WRI)`  
**Definition:** Water stress weighted specifically by national irrigation water demand. Evaluates competition and depletion in primary agricultural crop basins.  
**Unit:** Score (0–5)  
**Interpretation:** Higher scores indicate severe irrigation stress and higher risks to agricultural yields.  
**Source:** World Resources Institute (WRI Aqueduct 4.0)

---

### Domestic Water Stress
**Variable:** `wri_water_stress_domestic`  
**Dashboard Label:** `Domestic Water Stress (WRI)`  
**Definition:** Water stress weighted specifically by municipal, residential, and domestic water consumption.  
**Unit:** Score (0–5)  
**Interpretation:** Higher scores indicate acute pressure on public water utilities and drinking water availability.  
**Source:** World Resources Institute (WRI Aqueduct 4.0)

---

### Drought Risk Index
**Variable:** `wri_drought_risk`  
**Dashboard Label:** `Drought Risk Index (WRI)`  
**Definition:** Composite drought risk evaluating the likelihood and severity of meteorological and hydrological drought, weighted by historical agricultural exposure and national vulnerability.  
**Unit:** Index (0–5)  
**Interpretation:** Higher values indicate greater susceptibility to adverse agricultural and economic drought impacts.  
**Source:** World Resources Institute (WRI Aqueduct 4.0)

---

### Riverine Flood Risk Index
**Variable:** `wri_riverine_flood_risk`  
**Dashboard Label:** `Riverine Flood Risk Index (WRI)`  
**Definition:** Percentage of the national population annually exposed to riverine flood inundation within active river floodplains.  
**Unit:** Index (0–5)  
**Interpretation:** Higher scores indicate larger populations and economic assets situated within river flood zones.  
**Source:** World Resources Institute (WRI Aqueduct 4.0)

---

## UN OCHA — INFORM Risk Index

### INFORM Risk Index
**Variable:** `inform_risk`  
**Dashboard Label:** `INFORM Risk Index (UN OCHA)`  
**Definition:** The global gold-standard multi-hazard crisis risk assessment developed by UN OCHA and the European Commission. Combines Hazard Exposure (natural and human), Vulnerability (socio-economic), and Lack of Coping Capacity (infrastructure and institutional governance) into a single composite score.  
**Calculation:**  
`Hazard^(1/3) × Vulnerability^(1/3) × (Lack of Coping Capacity)^(1/3)`  
**Unit:** Index (0–10)  
**Interpretation:** Higher scores indicate greater overall risk of humanitarian crises and disaster emergency:  
- `0.0–1.9`: Very Low  
- `2.0–3.4`: Low  
- `3.5–4.9`: Medium  
- `5.0–6.4`: High  
- `6.5–10.0`: Very High  
**Source:** UN OCHA / European Commission Disaster Risk Management Knowledge Centre (INFORM)

---

### Hazard & Exposure Index
**Variable:** `inform_hazard`  
**Dashboard Label:** `Hazard & Exposure Index (UN OCHA)`  
**Definition:** Physical exposure of people and capital to natural hazards (tropical cyclones, river floods, earthquakes, tsunamis, droughts) and human-induced conflicts.  
**Unit:** Index (0–10)  
**Interpretation:** Higher values indicate greater exposure to hazard events.  
**Source:** UN OCHA (INFORM)

---

### Vulnerability Index
**Variable:** `inform_vulnerability`  
**Dashboard Label:** `Vulnerability Index (UN OCHA)`  
**Definition:** Socio-economic susceptibility to harm when hazards occur, measuring poverty rates, economic inequality, demographic dependency, and vulnerable populations (refugees, displaced persons).  
**Unit:** Index (0–10)  
**Interpretation:** Higher values indicate higher vulnerability and weaker pre-existing resilience.  
**Source:** UN OCHA (INFORM)

---

### Lack of Coping Capacity Index
**Variable:** `inform_coping_capacity`  
**Dashboard Label:** `Lack of Coping Capacity Index (UN OCHA)`  
**Definition:** Institutional, healthcare, and physical infrastructure deficits that limit a government's ability to prepare for, respond to, and absorb disaster shocks.  
**Unit:** Index (0–10)  
**Interpretation:** Higher values indicate weaker coping capacity (greater institutional deficits).  
**Source:** UN OCHA (INFORM)

---

## UN Food and Agriculture Organization (FAO) — Food & Agriculture

### Cereal Yield Anomaly (% vs Normal)
**Variable:** `cereal_yield_anomaly_pct`  
**Dashboard Label:** `Cereal Yield Anomaly (% vs Normal) (UN FAO)`  
**Definition:** Percentage departure of annual national cereal crop yield (wheat, rice, maize, barley, sorghum, millet) relative to the country's 2000–2020 normal baseline.  
**Calculation:**  
`((Yield_year - Yield_normal) / Yield_normal) × 100`  
**Unit:** Percent (% vs Normal)  
**Interpretation:**  
- **Negative values (purple):** Harvest shortfalls, agricultural drought, crop failure.  
- **Zero (gray/white):** Normal expected production.  
- **Positive values (green/yellow):** Above-average bumper crops.  
**Source:** UN Food and Agriculture Organization (FAOSTAT `QCL`)

---

### Cereal Yield (kg/ha)
**Variable:** `cereal_yield_kg_per_ha`  
**Dashboard Label:** `Cereal Yield (kg/ha) (UN FAO)`  
**Definition:** Total harvested cereal grain production divided by harvested area in kilograms per hectare.  
**Unit:** kg/ha  
**Interpretation:** Higher values indicate greater crop yield per hectare. Reflects agricultural technology, irrigation efficiency, and fertilizer usage.  
**Source:** UN FAO (FAOSTAT)

---

### Cereal Yield (tonnes/ha)
**Variable:** `cereal_yield_tonnes_per_ha`  
**Dashboard Label:** `Cereal Yield (tonnes/ha) (UN FAO)`  
**Definition:** National cereal crop yield expressed in metric tonnes per hectare (1 tonne/ha = 1,000 kg/ha).  
**Unit:** tonnes/ha  
**Interpretation:** Metric equivalent for global crop productivity comparisons.  
**Source:** UN FAO (FAOSTAT)

---

# Interpretation Notes

### U.S. Census & FEMA Data
- Census variables are derived from the **American Community Survey (ACS)** 5-year estimates.
- FEMA hazard variables are derived from the **FEMA National Risk Index (NRI)**.
- Event variables for hurricanes and floods represent **FEMA NFIP Claim Data** (insured losses, not total economic damage).
- Expected annual loss variables are estimates of long-term average annual economic loss in constant dollars.
- Risk scores are relative measures and should generally be interpreted by comparing geographic areas rather than as absolute thresholds.

### Global Data
- Global variables span **190+ countries** with standardized ISO3 identifiers, supporting annual time-series analysis (2010–2024) and long-range climate projections (2030, 2050, 2080).
- **Zero Suppression in EM-DAT:** Disaster counts and casualties naturally have many zero-value country-years. Countries with 0 events or 0 deaths are styled in neutral gray (`#94a3b8`) on the map, and zeros are excluded from the color scale to avoid skewing or compressing the visualization of real events.
- **WRI Aqueduct Projections:** Water stress baseline scores reflect 2024 conditions; 2050 optimistic (SSP1-RCP2.6) and pessimistic (SSP3-RCP8.5) scenarios capture alternative global decarbonization trajectories.
- **ND-GAIN Resilience vs. Vulnerability:** In ND-GAIN, higher **Readiness** and **ND-GAIN Index** scores represent better resilience, whereas higher **Vulnerability** scores represent greater climate exposure and harm potential.
- **INFORM Multi-Hazard Index:** Follows the Sendai Framework for Disaster Risk Reduction, balancing physical hazards against social vulnerability and governance deficits.


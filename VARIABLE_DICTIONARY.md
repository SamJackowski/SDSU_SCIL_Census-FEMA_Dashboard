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

# Interpretation Notes

- Census variables are derived from the **American Community Survey (ACS)**.
- FEMA variables are derived from the **FEMA National Risk Index (NRI)**.
- Expected annual loss variables are estimates of long-term average annual economic loss.
- Risk scores are relative measures and should generally be interpreted by comparing counties rather than as absolute values.
>>>>>>> theirs
- Annual frequency variables represent modeled average hazard occurrence and differ by hazard type (events per year, days per year, or annual probability).

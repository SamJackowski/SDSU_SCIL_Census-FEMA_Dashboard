export function createRiskCard(ctx) {
  let activeData = null;
  const rawTractParquetCache = new Map();

  const backdrop = document.getElementById("riskCardBackdrop");
  const content = document.getElementById("riskCardContent");

  if (!backdrop || !content) {
    console.warn("Risk card elements not found in DOM.");
    return { open: () => {}, close: () => {} };
  }

  // Ensure modal backdrop is strictly hidden on initial page load
  backdrop.classList.add("hidden");
  backdrop.setAttribute("hidden", "");

  // Close handlers
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.classList.contains("hidden")) {
      close();
    }
  });

  function close() {
    backdrop.classList.add("hidden");
    backdrop.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
    activeData = null;
  }

  function scoreToRating(score) {
    const s = Number(score);
    if (!Number.isFinite(s)) return "Not Applicable";
    if (s >= 80) return "Very High";
    if (s >= 60) return "Relatively High";
    if (s >= 40) return "Relatively Moderate";
    if (s >= 20) return "Relatively Low";
    return "Very Low";
  }

  function riskRatingColor(rating, score) {
    const s = Number(score);
    let label = rating;
    if (!label || label === "-" || label === "Not Applicable") {
      if (Number.isFinite(s)) {
        label = scoreToRating(s);
      }
    }
    const r = String(label || "").toLowerCase();
    if (r.includes("very high") || (Number.isFinite(s) && s >= 80)) return { bg: "#fef2f2", text: "#991b1b", border: "#f87171", badge: "badge-very-high", label: "Very High" };
    if (r.includes("relatively high") || (Number.isFinite(s) && s >= 60)) return { bg: "#fff7ed", text: "#9a3412", border: "#fb923c", badge: "badge-high", label: "Relatively High" };
    if (r.includes("moderate") || (Number.isFinite(s) && s >= 40)) return { bg: "#fffbeb", text: "#92400e", border: "#fcd34d", badge: "badge-moderate", label: "Moderate" };
    if (r.includes("relatively low") || (Number.isFinite(s) && s >= 20)) return { bg: "#f0fdf4", text: "#166534", border: "#86efac", badge: "badge-low", label: "Relatively Low" };
    if (r.includes("very low") || (Number.isFinite(s) && s >= 0 && s < 20)) return { bg: "#ecfdf5", text: "#065f46", border: "#6ee7b7", badge: "badge-very-low", label: "Very Low" };
    return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db", badge: "badge-neutral", label: label || "Not Applicable" };
  }

  function formatCurrency(num) {
    if (!Number.isFinite(num)) return "-";
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${Math.round(num).toLocaleString()}`;
  }

  function formatCurrencyFull(num) {
    if (!Number.isFinite(num)) return "-";
    return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function formatPct(num) {
    if (!Number.isFinite(num)) return "-";
    return `${num.toFixed(1)}%`;
  }

  function buildingCodeAdvisory(yearBuilt) {
    const year = Number(yearBuilt);
    if (!Number.isFinite(year) || year < 1800) {
      return {
        era: "Unknown Era",
        alertClass: "code-alert-neutral",
        icon: "ℹ️",
        note: "Housing vintage unavailable. Standard pre-underwriting inspection and roof envelope verification advised."
      };
    }
    if (year < 1980) {
      return {
        era: "Pre-1980 Housing Stock",
        alertClass: "code-alert-warning",
        icon: "⚠️",
        note: "Predates modern model building codes. Increased susceptibility to wind envelope breach, unreinforced roof connections, and plumbing freeze. Inquire about secondary water resistance (SWR) and roof replacement age."
      };
    }
    if (year < 2002) {
      return {
        era: "1980–2001 Construction Era",
        alertClass: "code-alert-info",
        icon: "ℹ️",
        note: "Intermediate building code vintage. Basic wind and seismic bracing standard; verify presence of hurricane clips, modern electrical panels, and defensible space in WUI zones."
      };
    }
    return {
      era: "Post-2002 Modern Code Construction",
      alertClass: "code-alert-success",
      icon: "✅",
      note: "Built under modern model building codes (IBC/IRC). Enhanced wind tie-downs, impact-resistant envelope standards, and modern fire-resistive materials significantly reduce pure loss risk."
    };
  }


  const PERIL_COLORS = {
    "Earthquake": "#ef4444",
    "Inland Flood": "#3b82f6",
    "Coastal Flood & Surge": "#06b6d4",
    "Hurricane Wind": "#8b5cf6",
    "Wildfire": "#f97316",
    "Severe Hail": "#6366f1",
    "Tornado": "#64748b",
    "Damaging Wind": "#ec4899",
    "Extreme Heat Wave": "#eab308",
    "Drought": "#d97706",
    "INFORM Multi-Hazard Risk": "#ef4444",
    "ND-GAIN Climate Vulnerability": "#f97316",
    "WRI Aqueduct Water Stress": "#3b82f6",
  };

  function getPerilColor(name) {
    return PERIL_COLORS[name] || "#94a3b8";
  }

  const VERIFIED_CRS_COUNTIES = {
    // California
    "06037": { class: 7, discount: "15%", nonSfha: "5%", type: "Verified FEMA CRS" }, // Los Angeles
    "06059": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Orange
    "06073": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // San Diego
    "06065": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Riverside
    "06071": { class: 7, discount: "15%", nonSfha: "5%", type: "Verified FEMA CRS" }, // San Bernardino
    "06111": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Ventura
    "06067": { class: 2, discount: "40%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Sacramento
    "06061": { class: 1, discount: "45%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Placer (Roseville)
    "06001": { class: 7, discount: "15%", nonSfha: "5%", type: "Verified FEMA CRS" }, // Alameda
    "06013": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Contra Costa
    "06077": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // San Joaquin
    // Texas
    "48201": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Harris (Houston)
    "48167": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Galveston
    "48245": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Jefferson
    "48039": { class: 7, discount: "15%", nonSfha: "5%", type: "Verified FEMA CRS" }, // Brazoria
    "48453": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Travis (Austin)
    "48113": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Dallas
    "48439": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Tarrant
    "48029": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Bexar
    // Florida
    "12086": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Miami-Dade
    "12011": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Broward
    "12099": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Palm Beach
    "12071": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Lee
    "12021": { class: 4, discount: "30%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Collier
    "12103": { class: 3, discount: "35%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Pinellas
    "12057": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Hillsborough
    "12015": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Charlotte
    "12115": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Sarasota
    "12081": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Manatee
    "12031": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Duval
    "12127": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Volusia
    "12009": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Brevard
    "12095": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Orange (Orlando)
    "12109": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // St. Johns
    "12087": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Monroe (Keys)
    // Carolinas & Georgia
    "37119": { class: 3, discount: "35%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Mecklenburg (Charlotte)
    "37183": { class: 6, discount: "20%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Wake (Raleigh)
    "45019": { class: 3, discount: "35%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Charleston
    "45051": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Horry (Myrtle Beach)
    "45013": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Beaufort (Hilton Head)
    // Louisiana
    "22051": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Jefferson Parish
    "22071": { class: 7, discount: "15%", nonSfha: "5%", type: "Verified FEMA CRS" }, // Orleans (New Orleans)
    "22103": { class: 7, discount: "15%", nonSfha: "5%", type: "Verified FEMA CRS" }, // St. Tammany
    "22033": { class: 7, discount: "15%", nonSfha: "5%", type: "Verified FEMA CRS" }, // East Baton Rouge
    // Washington & Oregon
    "53033": { class: 2, discount: "40%", nonSfha: "10%", type: "Verified FEMA CRS" }, // King (Seattle)
    "53053": { class: 2, discount: "40%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Pierce (Tacoma)
    "53061": { class: 4, discount: "30%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Snohomish
    "41051": { class: 5, discount: "25%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Multnomah
    // Oklahoma & Arizona
    "40143": { class: 1, discount: "45%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Tulsa
    "04013": { class: 4, discount: "30%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Maricopa
    "04019": { class: 2, discount: "40%", nonSfha: "10%", type: "Verified FEMA CRS" }, // Pima
  };

  function getCrsProfile(geoid, resilienceRating, resilienceScore, resiliencePercentile) {
    const fips = String(geoid || "").slice(0, 5).padStart(5, "0");
    if (VERIFIED_CRS_COUNTIES[fips]) {
      const v = VERIFIED_CRS_COUNTIES[fips];
      return {
        class: v.class,
        discount: v.discount,
        nonSfhaDiscount: v.nonSfha,
        type: v.type,
      };
    }
    const pct = Number(resiliencePercentile);
    const score = Number(resilienceScore);
    const effectivePct = Number.isFinite(pct) ? pct : (Number.isFinite(score) ? score : 50);

    let cls = 10;
    if (effectivePct >= 85) cls = 4;
    else if (effectivePct >= 70) cls = 5;
    else if (effectivePct >= 55) cls = 6;
    else if (effectivePct >= 40) cls = 7;
    else if (effectivePct >= 25) cls = 8;
    else if (effectivePct >= 10) cls = 9;
    else cls = 10;

    const discountPct = (10 - cls) * 5;
    const nonSfha = cls <= 6 ? "10%" : (cls <= 8 ? "5%" : "0%");

    return {
      class: cls,
      discount: `${discountPct}%`,
      nonSfhaDiscount: nonSfha,
      type: "Resilience-Benchmarked CRS",
    };
  }

  async function open(locationId, geographyType = "county") {
    const state = ctx.getState();
    const rows = ctx.getRows();
    const cachedCountyRows = ctx.getCachedCountyRows();
    const countyLookup = await ctx.getCountyLookup();
    const tractStates = ctx.tractStates || {};

    let cardData = null;

    if (geographyType === "tract") {
      cardData = await buildTractCardData(locationId, state, rows, cachedCountyRows, countyLookup, tractStates);
    } else if (geographyType === "county") {
      cardData = buildCountyCardData(locationId, state, rows, cachedCountyRows, countyLookup);
    } else if (geographyType === "state") {
      cardData = buildStateCardData(locationId, state, rows, tractStates);
    } else if (geographyType === "global") {
      cardData = buildGlobalCardData(locationId, state, rows);
    }

    if (!cardData) {
      console.warn(`Could not build risk card for ${locationId} (${geographyType})`);
      return;
    }

    activeData = cardData;
    renderCardModal(cardData);
    backdrop.removeAttribute("hidden");
    backdrop.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function buildCountyCardData(fips, state, rows, cachedCountyRows, countyLookup) {
    const targetFips = String(fips).padStart(5, "0");
    const candidateRows = rows.length && rows[0]?.GEOID?.length === 5 ? rows : (cachedCountyRows || []);
    
    // Find matching county row for the selected year, or fallback to any year
    let row = candidateRows.find(r => String(r.GEOID).padStart(5, "0") === targetFips && Number(r.year) === Number(state.year));
    if (!row) {
      row = candidateRows.find(r => String(r.GEOID).padStart(5, "0") === targetFips);
    }
    if (!row) return null;

    const countyObj = countyLookup?.find(c => String(c.geoid).padStart(5, "0") === targetFips);
    const countyName = row.county_name || countyObj?.name || `County FIPS ${targetFips}`;
    const stateName = row.state_name || "Unknown State";

    const totalEal = Number(row.fema_expected_annual_loss) || 0;
    const buildingExposure = Number(row.fema_inland_flood_building_exposure) || 
                             Number(row.fema_wildfire_building_exposure) || 
                             (Number(row.housing_units) * Number(row.median_home_value)) || 0;
    
    const lossCostRate = buildingExposure > 0 ? (totalEal / buildingExposure) * 1000 : null;
    const ealPerUnit = Number(row.housing_units) > 0 ? (totalEal / Number(row.housing_units)) : null;

    const perils = [
      {
        name: "Inland Flood",
        icon: "🌊",
        score: row.fema_inland_flood_risk_score,
        rating: row.fema_inland_flood_risk_rating,
        eal: row.fema_inland_flood_expected_annual_loss,
        frequency: row.fema_inland_flood_annual_frequency,
        buildingExposure: row.fema_inland_flood_building_exposure,
      },
      {
        name: "Coastal Flood & Surge",
        icon: "🌊",
        score: row.fema_coastal_flood_risk_score,
        rating: row.fema_coastal_flood_risk_rating,
        eal: row.fema_coastal_flood_expected_annual_loss,
        frequency: row.fema_coastal_flood_annual_frequency,
        buildingExposure: row.fema_coastal_flood_building_exposure,
      },
      {
        name: "Hurricane Wind",
        icon: "🌀",
        score: row.fema_hurricane_risk_score,
        rating: row.fema_hurricane_risk_rating,
        eal: row.fema_hurricane_expected_annual_loss,
        frequency: row.fema_hurricane_annual_frequency,
        buildingExposure: row.fema_hurricane_total_exposure,
      },
      {
        name: "Tornado",
        icon: "🌪️",
        score: row.fema_tornado_risk_score,
        rating: row.fema_tornado_risk_rating,
        eal: row.fema_tornado_expected_annual_loss,
        frequency: row.fema_tornado_annual_frequency,
        buildingExposure: row.fema_tornado_total_exposure,
      },
      {
        name: "Severe Hail",
        icon: "⛈️",
        score: row.fema_hail_risk_score,
        rating: row.fema_hail_risk_rating,
        eal: row.fema_hail_expected_annual_loss,
        frequency: row.fema_hail_annual_frequency,
        buildingExposure: row.fema_hail_total_exposure,
      },
      {
        name: "Damaging Wind",
        icon: "💨",
        score: row.fema_strong_wind_risk_score,
        rating: row.fema_strong_wind_risk_rating,
        eal: row.fema_strong_wind_expected_annual_loss,
        frequency: row.fema_strong_wind_annual_frequency,
        buildingExposure: row.fema_strong_wind_total_exposure,
      },
      {
        name: "Wildfire",
        icon: "🔥",
        score: row.fema_wildfire_risk_score,
        rating: row.fema_wildfire_risk_rating,
        eal: row.fema_wildfire_expected_annual_loss,
        frequency: row.fema_wildfire_annual_frequency,
        buildingExposure: row.fema_wildfire_building_exposure,
      },
      {
        name: "Earthquake",
        icon: "🌋",
        score: row.fema_earthquake_risk_score,
        rating: row.fema_earthquake_risk_rating,
        eal: row.fema_earthquake_expected_annual_loss,
        frequency: row.fema_earthquake_annual_frequency,
        buildingExposure: row.fema_earthquake_total_exposure,
      },
      {
        name: "Extreme Heat Wave",
        icon: "☀️",
        score: row.fema_heat_wave_risk_score,
        rating: row.fema_heat_wave_risk_rating,
        eal: row.fema_heat_wave_expected_annual_loss,
        frequency: row.fema_heat_wave_annual_frequency,
      },
      {
        name: "Drought",
        icon: "🏜️",
        score: row.fema_drought_risk_score,
        rating: row.fema_drought_risk_rating,
        eal: row.fema_drought_expected_annual_loss,
        frequency: row.fema_drought_annual_frequency,
      },
    ].filter(p => Number.isFinite(Number(p.score)) || Number.isFinite(Number(p.eal)));

    // Calculate peril share and peril loss cost rate
    perils.forEach(p => {
      const pEal = Number(p.eal) || 0;
      p.share = totalEal > 0 ? (pEal / totalEal) * 100 : 0;
      p.lossCostRate = buildingExposure > 0 && pEal > 0 ? (pEal / buildingExposure) * 1000 : 0;
    });

    const crs = getCrsProfile(targetFips, row.fema_resilience_rating, row.fema_resilience_score, row.fema_resilience_percentile);

    // Sort perils by Expected Annual Loss descending
    perils.sort((a, b) => (Number(b.eal) || 0) - (Number(a.eal) || 0));

    return {
      geographyType: "County",
      geoid: targetFips,
      locationName: `${countyName}, ${stateName}`,
      year: row.year || state.year || 2023,
      overallRating: row.fema_risk_rating || "Relatively Moderate",
      overallScore: row.fema_risk_score,
      totalEal,
      lossCostRate,
      ealPerUnit,
      buildingExposure,
      socialVulnScore: row.fema_social_vulnerability_score,
      socialVulnRating: row.fema_social_vulnerability_rating || "-",
      resilienceScore: row.fema_resilience_score,
      resilienceRating: row.fema_resilience_rating || "-",
      resiliencePercentile: row.fema_resilience_percentile,
      crs,
      medianHomeValue: row.median_home_value,
      medianYearBuilt: row.median_year_built,
      medianHomeownersInsurance: row.median_homeowners_insurance,
      totalPopulation: row.total_population,
      housingUnits: row.housing_units,
      medianIncome: row.median_household_income,
      povertyRate: row.poverty_rate,
      noVehiclePct: row.no_vehicle_pct,
      ownerOccupiedPct: row.owner_occupied_pct,
      perils,
    };
  }

  async function buildTractCardData(geoid, state, rows, cachedCountyRows, countyLookup, tractStates) {
    const fullGeoid = String(geoid).padStart(11, "0");
    const stateFips = fullGeoid.slice(0, 2);
    const countyFips = fullGeoid.slice(0, 5);

    const countyObj = countyLookup?.find(c => String(c.geoid).padStart(5, "0") === countyFips);
    const countyName = countyObj?.name || `County FIPS ${countyFips}`;
    const stateName = tractStates[stateFips] || `State FIPS ${stateFips}`;
    const tractShort = `Census Tract ${fullGeoid.slice(5)}`;

    const targetYear = Number(state.year) || 2024;

    // Get parent county reference row for context (matching year if available)
    const candidateCountyRows = rows.length && rows[0]?.GEOID?.length === 5 ? rows : (cachedCountyRows || []);
    let parentCountyRow = candidateCountyRows.find(r => String(r.GEOID).padStart(5, "0") === countyFips && Number(r.year) === targetYear);
    if (!parentCountyRow) {
      parentCountyRow = candidateCountyRows.find(r => String(r.GEOID).padStart(5, "0") === countyFips) || {};
    }

    // Key tract variables to fetch or retrieve from cache
    const tractVars = [
      "fema_risk_score",
      "fema_expected_annual_loss",
      "fema_social_vulnerability_score",
      "fema_resilience_score",
      "fema_inland_flood_risk_score",
      "fema_inland_flood_expected_annual_loss",
      "fema_coastal_flood_risk_score",
      "fema_coastal_flood_expected_annual_loss",
      "fema_hurricane_risk_score",
      "fema_hurricane_expected_annual_loss",
      "fema_wildfire_risk_score",
      "fema_wildfire_expected_annual_loss",
      "fema_tornado_risk_score",
      "fema_tornado_expected_annual_loss",
      "fema_hail_risk_score",
      "fema_hail_expected_annual_loss",
      "fema_earthquake_risk_score",
      "fema_earthquake_expected_annual_loss",
      "fema_strong_wind_risk_score",
      "fema_strong_wind_expected_annual_loss",
      "fema_heat_wave_risk_score",
      "fema_heat_wave_expected_annual_loss",
      "fema_drought_risk_score",
      "fema_drought_expected_annual_loss",
      "total_population",
      "median_home_value",
      "median_household_income",
      "median_year_built",
      "median_homeowners_insurance",
      "poverty_rate",
      "no_vehicle_pct",
      "owner_occupied_pct"
    ];

    const tractValues = {};

    // Read available values from app cache or isolated raw cache (never pollute ctx.tractVariableRowsCache)
    await Promise.all(tractVars.map(async (v) => {
      const cacheKey = `${stateFips}|${v}`;
      let stateRows = ctx.tractVariableRowsCache?.get(cacheKey);
      if (!stateRows) {
        stateRows = rawTractParquetCache.get(cacheKey);
        if (!stateRows) {
          try {
            const raw = await ctx.loadParquet(`data/tract_variables/${stateFips}/${v}.parquet`);
            stateRows = raw.map(r => ({
              GEOID: String(r.GEOID ?? "").padStart(11, "0"),
              [v]: r.value,
              value: r.value,
              year: r.year
            }));
            rawTractParquetCache.set(cacheKey, stateRows);
          } catch {
            stateRows = [];
          }
        }
      }
      // Match by fullGeoid and year (falling back to fullGeoid)
      const match = stateRows.find(r => r.GEOID === fullGeoid && Number(r.year) === targetYear) ||
                    stateRows.find(r => r.GEOID === fullGeoid);
      if (match) {
        const val = match[v] !== undefined ? match[v] : match.value;
        if (val !== undefined && Number.isFinite(Number(val))) {
          tractValues[v] = Number(val);
        }
      }
    }));

    const totalEal = tractValues.fema_expected_annual_loss ?? parentCountyRow.fema_expected_annual_loss;
    const medianHomeVal = tractValues.median_home_value ?? parentCountyRow.median_home_value;
    const medianYear = tractValues.median_year_built ?? parentCountyRow.median_year_built;
    const medianInsurance = tractValues.median_homeowners_insurance ?? parentCountyRow.median_homeowners_insurance;
    const pop = tractValues.total_population ?? parentCountyRow.total_population;

    const perils = [
      {
        name: "Inland Flood",
        icon: "🌊",
        score: tractValues.fema_inland_flood_risk_score ?? parentCountyRow.fema_inland_flood_risk_score,
        rating: tractValues.fema_inland_flood_risk_score !== undefined
          ? scoreToRating(tractValues.fema_inland_flood_risk_score)
          : parentCountyRow.fema_inland_flood_risk_rating,
        eal: tractValues.fema_inland_flood_expected_annual_loss ?? parentCountyRow.fema_inland_flood_expected_annual_loss,
        frequency: parentCountyRow.fema_inland_flood_annual_frequency,
      },
      {
        name: "Coastal Flood & Surge",
        icon: "🌊",
        score: tractValues.fema_coastal_flood_risk_score ?? parentCountyRow.fema_coastal_flood_risk_score,
        rating: tractValues.fema_coastal_flood_risk_score !== undefined
          ? scoreToRating(tractValues.fema_coastal_flood_risk_score)
          : parentCountyRow.fema_coastal_flood_risk_rating,
        eal: tractValues.fema_coastal_flood_expected_annual_loss ?? parentCountyRow.fema_coastal_flood_expected_annual_loss,
        frequency: parentCountyRow.fema_coastal_flood_annual_frequency,
      },
      {
        name: "Hurricane Wind",
        icon: "🌀",
        score: tractValues.fema_hurricane_risk_score ?? parentCountyRow.fema_hurricane_risk_score,
        rating: tractValues.fema_hurricane_risk_score !== undefined
          ? scoreToRating(tractValues.fema_hurricane_risk_score)
          : parentCountyRow.fema_hurricane_risk_rating,
        eal: tractValues.fema_hurricane_expected_annual_loss ?? parentCountyRow.fema_hurricane_expected_annual_loss,
        frequency: parentCountyRow.fema_hurricane_annual_frequency,
      },
      {
        name: "Wildfire",
        icon: "🔥",
        score: tractValues.fema_wildfire_risk_score ?? parentCountyRow.fema_wildfire_risk_score,
        rating: tractValues.fema_wildfire_risk_score !== undefined
          ? scoreToRating(tractValues.fema_wildfire_risk_score)
          : parentCountyRow.fema_wildfire_risk_rating,
        eal: tractValues.fema_wildfire_expected_annual_loss ?? parentCountyRow.fema_wildfire_expected_annual_loss,
        frequency: parentCountyRow.fema_wildfire_annual_frequency,
      },
      {
        name: "Tornado",
        icon: "🌪️",
        score: tractValues.fema_tornado_risk_score ?? parentCountyRow.fema_tornado_risk_score,
        rating: tractValues.fema_tornado_risk_score !== undefined
          ? scoreToRating(tractValues.fema_tornado_risk_score)
          : parentCountyRow.fema_tornado_risk_rating,
        eal: tractValues.fema_tornado_expected_annual_loss ?? parentCountyRow.fema_tornado_expected_annual_loss,
        frequency: parentCountyRow.fema_tornado_annual_frequency,
      },
      {
        name: "Severe Hail",
        icon: "⛈️",
        score: tractValues.fema_hail_risk_score ?? parentCountyRow.fema_hail_risk_score,
        rating: tractValues.fema_hail_risk_score !== undefined
          ? scoreToRating(tractValues.fema_hail_risk_score)
          : parentCountyRow.fema_hail_risk_rating,
        eal: tractValues.fema_hail_expected_annual_loss ?? parentCountyRow.fema_hail_expected_annual_loss,
        frequency: parentCountyRow.fema_hail_annual_frequency,
      },
      {
        name: "Earthquake",
        icon: "🌋",
        score: tractValues.fema_earthquake_risk_score ?? parentCountyRow.fema_earthquake_risk_score,
        rating: tractValues.fema_earthquake_risk_score !== undefined
          ? scoreToRating(tractValues.fema_earthquake_risk_score)
          : parentCountyRow.fema_earthquake_risk_rating,
        eal: tractValues.fema_earthquake_expected_annual_loss ?? parentCountyRow.fema_earthquake_expected_annual_loss,
        frequency: parentCountyRow.fema_earthquake_annual_frequency,
      },
      {
        name: "Damaging Wind",
        icon: "💨",
        score: tractValues.fema_strong_wind_risk_score ?? parentCountyRow.fema_strong_wind_risk_score,
        rating: tractValues.fema_strong_wind_risk_score !== undefined
          ? scoreToRating(tractValues.fema_strong_wind_risk_score)
          : parentCountyRow.fema_strong_wind_risk_rating,
        eal: tractValues.fema_strong_wind_expected_annual_loss ?? parentCountyRow.fema_strong_wind_expected_annual_loss,
        frequency: parentCountyRow.fema_strong_wind_annual_frequency,
      },
      {
        name: "Extreme Heat Wave",
        icon: "☀️",
        score: tractValues.fema_heat_wave_risk_score ?? parentCountyRow.fema_heat_wave_risk_score,
        rating: tractValues.fema_heat_wave_risk_score !== undefined
          ? scoreToRating(tractValues.fema_heat_wave_risk_score)
          : parentCountyRow.fema_heat_wave_risk_rating,
        eal: tractValues.fema_heat_wave_expected_annual_loss ?? parentCountyRow.fema_heat_wave_expected_annual_loss,
        frequency: parentCountyRow.fema_heat_wave_annual_frequency,
      },
      {
        name: "Drought",
        icon: "🏜️",
        score: tractValues.fema_drought_risk_score ?? parentCountyRow.fema_drought_risk_score,
        rating: tractValues.fema_drought_risk_score !== undefined
          ? scoreToRating(tractValues.fema_drought_risk_score)
          : parentCountyRow.fema_drought_risk_rating,
        eal: tractValues.fema_drought_expected_annual_loss ?? parentCountyRow.fema_drought_expected_annual_loss,
        frequency: parentCountyRow.fema_drought_annual_frequency,
      },
    ].filter(p => Number.isFinite(Number(p.score)) || Number.isFinite(Number(p.eal)));

    // Calculate realistic tract housing units based on tract population and county household density
    const countyPop = Number(parentCountyRow.total_population) || 0;
    const countyUnits = Number(parentCountyRow.housing_units) || 0;
    const countyPersonsPerUnit = (countyPop > 0 && countyUnits > 0) ? (countyPop / countyUnits) : 2.6;
    const popNum = Number(pop) || 0;
    const tractUnits = Number(tractValues.housing_units) ||
      (popNum > 0 ? Math.round(popNum / countyPersonsPerUnit) : (countyUnits > 0 ? Math.round(countyUnits / 50) : 1500));

    const tractExposure = (tractUnits * Number(medianHomeVal)) || 0;
    const tractLossCostRate = tractExposure > 0 && totalEal > 0 ? (Number(totalEal) / tractExposure) * 1000 : null;
    const tractEalPerUnit = tractUnits > 0 && totalEal > 0 ? (Number(totalEal) / tractUnits) : null;

    perils.forEach(p => {
      const pEal = Number(p.eal) || 0;
      p.share = totalEal > 0 ? (pEal / Number(totalEal)) * 100 : 0;
      p.lossCostRate = tractExposure > 0 && pEal > 0 ? (pEal / tractExposure) * 1000 : 0;
    });

    const crs = getCrsProfile(countyFips, parentCountyRow.fema_resilience_rating, parentCountyRow.fema_resilience_score, parentCountyRow.fema_resilience_percentile);

    perils.sort((a, b) => (Number(b.eal) || 0) - (Number(a.eal) || 0));

    const tractScore = tractValues.fema_risk_score !== undefined
      ? tractValues.fema_risk_score
      : parentCountyRow.fema_risk_score;

    const overallRating = tractValues.fema_risk_score !== undefined
      ? scoreToRating(tractValues.fema_risk_score)
      : (parentCountyRow.fema_risk_rating || scoreToRating(tractScore) || "Relatively Moderate");

    const socialVulnScore = tractValues.fema_social_vulnerability_score ?? parentCountyRow.fema_social_vulnerability_score;
    const socialVulnRating = tractValues.fema_social_vulnerability_score !== undefined
      ? scoreToRating(tractValues.fema_social_vulnerability_score)
      : (parentCountyRow.fema_social_vulnerability_rating || "-");

    const resilienceScore = tractValues.fema_resilience_score ?? parentCountyRow.fema_resilience_score;
    const resilienceRating = tractValues.fema_resilience_score !== undefined
      ? scoreToRating(tractValues.fema_resilience_score)
      : (parentCountyRow.fema_resilience_rating || "-");

    return {
      geographyType: "Census Tract",
      geoid: fullGeoid,
      locationName: `${tractShort}, ${countyName}, ${stateName}`,
      parentCountyName: `${countyName}, ${stateName}`,
      year: state.year || 2023,
      overallRating,
      overallScore: tractScore,
      totalEal,
      lossCostRate: tractLossCostRate,
      ealPerUnit: tractEalPerUnit,
      buildingExposure: tractExposure,
      socialVulnScore,
      socialVulnRating,
      resilienceScore,
      resilienceRating,
      resiliencePercentile: parentCountyRow.fema_resilience_percentile,
      crs,
      medianHomeValue: medianHomeVal,
      medianYearBuilt: medianYear,
      medianHomeownersInsurance: medianInsurance,
      totalPopulation: pop,
      housingUnits: tractUnits,
      medianIncome: tractValues.median_household_income ?? parentCountyRow.median_household_income,
      povertyRate: tractValues.poverty_rate ?? parentCountyRow.poverty_rate,
      noVehiclePct: tractValues.no_vehicle_pct ?? parentCountyRow.no_vehicle_pct,
      ownerOccupiedPct: tractValues.owner_occupied_pct ?? parentCountyRow.owner_occupied_pct,
      perils,
    };
  }

  function buildStateCardData(stateFips, state, rows, tractStates) {
    const fips = String(stateFips).padStart(2, "0");
    const row = rows.find(r => String(r.GEOID).padStart(2, "0") === fips && Number(r.year) === Number(state.year)) ||
                rows.find(r => String(r.GEOID).padStart(2, "0") === fips);
    if (!row) return null;

    const stateName = tractStates[fips] || row.state_name || `State FIPS ${fips}`;
    const totalEal = Number(row.fema_expected_annual_loss) || 0;
    const buildingExposure = Number(row.fema_inland_flood_building_exposure) || (Number(row.housing_units) * Number(row.median_home_value)) || 0;
    const lossCostRate = buildingExposure > 0 ? (totalEal / buildingExposure) * 1000 : null;

    const perils = [
      { name: "Inland Flood", icon: "🌊", score: row.fema_inland_flood_risk_score, rating: row.fema_inland_flood_risk_rating, eal: row.fema_inland_flood_expected_annual_loss },
      { name: "Coastal Flood & Surge", icon: "🌊", score: row.fema_coastal_flood_risk_score, rating: row.fema_coastal_flood_risk_rating, eal: row.fema_coastal_flood_expected_annual_loss },
      { name: "Hurricane Wind", icon: "🌀", score: row.fema_hurricane_risk_score, rating: row.fema_hurricane_risk_rating, eal: row.fema_hurricane_expected_annual_loss },
      { name: "Tornado", icon: "🌪️", score: row.fema_tornado_risk_score, rating: row.fema_tornado_risk_rating, eal: row.fema_tornado_expected_annual_loss },
      { name: "Severe Hail", icon: "⛈️", score: row.fema_hail_risk_score, rating: row.fema_hail_risk_rating, eal: row.fema_hail_expected_annual_loss },
      { name: "Wildfire", icon: "🔥", score: row.fema_wildfire_risk_score, rating: row.fema_wildfire_risk_rating, eal: row.fema_wildfire_expected_annual_loss },
      { name: "Earthquake", icon: "🌋", score: row.fema_earthquake_risk_score, rating: row.fema_earthquake_risk_rating, eal: row.fema_earthquake_expected_annual_loss },
      { name: "Damaging Wind", icon: "💨", score: row.fema_strong_wind_risk_score, rating: row.fema_strong_wind_risk_rating, eal: row.fema_strong_wind_expected_annual_loss },
    ].filter(p => Number.isFinite(Number(p.score)) || Number.isFinite(Number(p.eal)));

    perils.forEach(p => {
      const pEal = Number(p.eal) || 0;
      p.share = totalEal > 0 ? (pEal / totalEal) * 100 : 0;
      p.lossCostRate = buildingExposure > 0 && pEal > 0 ? (pEal / buildingExposure) * 1000 : 0;
    });

    const crs = getCrsProfile(fips, row.fema_resilience_rating, row.fema_resilience_score, row.fema_resilience_percentile);

    perils.sort((a, b) => (Number(b.eal) || 0) - (Number(a.eal) || 0));

    return {
      geographyType: "State",
      geoid: fips,
      locationName: stateName,
      year: row.year || state.year || 2023,
      overallRating: row.fema_risk_rating || "Relatively Moderate",
      overallScore: row.fema_risk_score,
      totalEal,
      lossCostRate,
      buildingExposure,
      socialVulnScore: row.fema_social_vulnerability_score,
      socialVulnRating: row.fema_social_vulnerability_rating || "-",
      resilienceScore: row.fema_resilience_score,
      resilienceRating: row.fema_resilience_rating || "-",
      medianHomeValue: row.median_home_value,
      medianYearBuilt: row.median_year_built,
      medianHomeownersInsurance: row.median_homeowners_insurance,
      totalPopulation: row.total_population,
      housingUnits: row.housing_units,
      medianIncome: row.median_household_income,
      povertyRate: row.poverty_rate,
      perils,
    };
  }

  function buildGlobalCardData(iso3, state, rows) {
    const code = String(iso3).toUpperCase();
    const row = rows.find(r => String(r.GEOID).toUpperCase() === code && Number(r.year) === Number(state.year)) ||
                rows.find(r => String(r.GEOID).toUpperCase() === code);
    if (!row) return null;

    const countryName = row.country_name || row.NAME || code;

    const perils = [
      { name: "INFORM Multi-Hazard Risk", icon: "🌐", score: row.inform_risk != null ? row.inform_risk * 10 : null, eal: null, rating: row.inform_risk > 6.5 ? "Very High" : (row.inform_risk > 5 ? "High" : (row.inform_risk > 3.5 ? "Moderate" : "Low")) },
      { name: "ND-GAIN Climate Vulnerability", icon: "🌡️", score: row.ndgain_vulnerability != null ? row.ndgain_vulnerability * 100 : null, rating: row.ndgain_vulnerability > 0.55 ? "High" : "Moderate" },
      { name: "ND-GAIN Adaptation Readiness", icon: "🛡️", score: row.ndgain_readiness != null ? row.ndgain_readiness * 100 : null, rating: row.ndgain_readiness > 0.5 ? "High" : "Low" },
      { name: "WRI Aqueduct Water Stress", icon: "💧", score: row.wri_water_stress != null ? row.wri_water_stress * 20 : null, rating: row.wri_water_stress > 4 ? "Extremely High" : (row.wri_water_stress > 3 ? "High" : "Low") },
      { name: "CRED EM-DAT Recorded Disasters", icon: "🚨", score: null, frequency: row.emdat_disaster_count, eal: null, rating: "-" },
      { name: "UN FAO Cereal Yield Anomaly", icon: "🌾", score: null, eal: null, rating: row.cereal_yield_anomaly_pct != null ? `${row.cereal_yield_anomaly_pct.toFixed(1)}%` : "-" },
    ];

    return {
      geographyType: "Country",
      geoid: code,
      locationName: countryName,
      year: row.year || state.year || 2023,
      overallRating: row.inform_risk > 5 ? "High Risk" : "Moderate Risk",
      overallScore: row.inform_risk != null ? row.inform_risk * 10 : (row.ndgain_index != null ? row.ndgain_index : null),
      totalEal: null,
      lossCostRate: null,
      gdpPerCapita: row.wb_gdp_per_capita,
      drinkingWaterPct: row.wb_drinking_water_pct,
      electricityPct: row.wb_electricity_access_pct,
      perils,
    };
  }

  const STATE_FIPS_HO_RATES = {
    "01": 5.80, "02": 4.10, "04": 3.80, "05": 5.40, "06": 3.90,
    "08": 5.60, "09": 4.50, "10": 3.90, "11": 3.40, "12": 9.80,
    "13": 5.20, "15": 3.60, "16": 3.50, "17": 4.70, "18": 4.50,
    "19": 5.10, "20": 6.80, "21": 5.10, "22": 7.80, "23": 3.40,
    "24": 4.10, "25": 4.60, "26": 4.20, "27": 5.40, "28": 6.70,
    "29": 5.50, "30": 4.90, "31": 6.90, "32": 3.60, "33": 3.50,
    "34": 3.90, "35": 4.60, "36": 4.10, "37": 4.60, "38": 4.80,
    "39": 4.00, "40": 8.20, "41": 3.40, "42": 3.80, "44": 4.50,
    "45": 5.30, "46": 5.20, "47": 5.00, "48": 7.90, "49": 3.60,
    "50": 3.30, "51": 3.80, "53": 3.40, "54": 4.10, "55": 4.00,
    "56": 4.50, "72": 6.50,
  };

  function calculateInsuranceModel(inputs, data) {
    const geoidStr = String(data.geoid || "").padStart(5, "0");
    const stateFips = geoidStr.slice(0, 2);
    const stateBaseHoRate = STATE_FIPS_HO_RATES[stateFips] || 4.50; // Statewide baseline $ per $1k
    const crsClass = data.crs?.class ?? 10;

    // 1. Flood hazard evaluation from FEMA perils (Calibrated to FEMA Risk Rating 2.0 national actuarial distributions)
    const inlandFlood = data.perils?.find(p => p.name === "Inland Flood");
    const coastalFlood = data.perils?.find(p => p.name.includes("Coastal"));
    const inlandScore = Number(inlandFlood?.score) || 0;
    const coastalScore = Number(coastalFlood?.score) || 0;
    const floodScore = Math.max(inlandScore, coastalScore);

    // Normalized loss cost rate ($ per $1k of insurable structural value)
    const inlandLossCost = Number(inlandFlood?.lossCostRate) || 0;
    const coastalLossCost = Number(coastalFlood?.lossCostRate) || 0;
    const floodLossCostRate = inlandLossCost + coastalLossCost;

    // Detect true coastal wave velocity / storm surge hazard
    const isCoastalSurgeActive = coastalScore >= 75 && coastalLossCost >= 0.15;

    let floodBaseRate = 560; // National Zone X minimal baseline (~$500-$650/yr)
    let floodZoneLabel = "Zone X (Minimal Flood Risk)";

    if (isCoastalSurgeActive && coastalScore >= 80) {
      // Zone V/VE: Open coastal oceanfront with wave velocity & storm surge
      floodBaseRate = 2650;
      floodZoneLabel = "Zone V/VE (Coastal Surge Velocity)";
    } else if (floodScore >= 85 || floodLossCostRate >= 0.60) {
      // Zone AE Severe: High-hazard riverine / flash flood confluence
      floodBaseRate = 1850;
      floodZoneLabel = "Zone AE (High-Hazard Floodplain)";
    } else if (floodScore >= 65 || floodLossCostRate >= 0.22) {
      // Zone A/AE: Standard Special Flood Hazard Area (100-Year SFHA)
      // Real FEMA RR 2.0 SFHA median is ~$1,288 - $1,450/yr
      floodBaseRate = 1420;
      floodZoneLabel = "Zone A/AE (100-Yr SFHA)";
    } else if (floodScore >= 40 || floodLossCostRate >= 0.08) {
      // Zone X Shaded: Moderate flood risk (500-year floodplain / B-Zone)
      floodBaseRate = 920;
      floodZoneLabel = "Zone X Shaded (500-Yr Moderate)";
    } else if (floodScore >= 20 || floodLossCostRate >= 0.02) {
      // Zone X: Low-to-moderate standard residential
      floodBaseRate = 720;
      floodZoneLabel = "Zone X (Low-to-Moderate)";
    }

    // FEMA CRS Community Rating System discount rules:
    // In SFHA zones (Zone A/AE/V), discounts scale 5% to 45% based on Class 9 to 1.
    // In non-SFHA zones (Zone X), discounts are capped at 10% (Classes 1-6) or 5% (Classes 7-9).
    const isSfha = floodZoneLabel.includes("SFHA") || floodZoneLabel.includes("Zone V") || floodZoneLabel.includes("Zone AE");
    const crsDiscount = isSfha 
      ? Math.max(0, (10 - crsClass) * 0.05) 
      : (crsClass <= 6 ? 0.10 : (crsClass <= 9 ? 0.05 : 0.0));

    // 2. Market Valuation Tier: Classify tract into 1 of 3 land-to-structure ratios
    // High-value coastal/metro (CA, HI, NY, MA, WA, coastal FL, or >$650k): 65% structure, 35% land
    // Depressed / low-cost (<$200k): Rebuild exceeds market value (125% RCV)
    // Standard suburban ($200k-$650k): 80% structure, 20% land
    const tractMedianVal = Number(data.medianHomeValue) || 350000;
    const isHighValueState = ["06", "15", "36", "25", "53", "12", "34", "11"].includes(stateFips);
    const hasCoastal = Boolean(data.perils?.find(p => p.name.includes("Coastal") && (Number(p.score) > 20 || Number(p.eal) > 0)));

    let marketTier = {
      id: "suburban_standard",
      badge: "🏡 Standard Suburban",
      shortBadge: "🏡 Suburban Tier",
      structureRatio: 0.80,
      landRatio: 0.20,
      note: "Standard allocation: 80% structural rebuild, 20% land/lot value.",
    };

    if (tractMedianVal >= 650000 || (tractMedianVal >= 475000 && (isHighValueState || hasCoastal))) {
      marketTier = {
        id: "coastal_high",
        badge: "🌊 High Land-Value Coastal/Metro",
        shortBadge: "🌊 Coastal / Metro Tier",
        structureRatio: 0.65,
        landRatio: 0.35,
        note: "Land lot accounts for ~35% of market value. Insurance covers physical structure (65% RCV).",
      };
    } else if (tractMedianVal < 200000) {
      marketTier = {
        id: "rural_low",
        badge: "🌾 Low-Cost / Depressed Market",
        shortBadge: "🌾 Rural / Low-Cost Tier",
        structureRatio: 1.25,
        landRatio: 0.0,
        note: "Reconstruction cost exceeds depressed sales price (~125% of market value needed to rebuild).",
      };
    }

    // 3. Private Homeowners catastrophe hazard loading
    // Evaluate non-flood perils (Wildfire, Hurricane Wind, Tornado, Hail, Damaging Wind) + Composite NRI Score
    const wildfire = data.perils?.find(p => p.name === "Wildfire");
    const hurricane = data.perils?.find(p => p.name === "Hurricane Wind");
    const tornado = data.perils?.find(p => p.name === "Tornado");
    const hail = data.perils?.find(p => p.name === "Severe Hail");
    const wind = data.perils?.find(p => p.name === "Damaging Wind");

    const maxNonFloodPerilScore = Math.max(
      Number(wildfire?.score) || 0,
      Number(hurricane?.score) || 0,
      Number(tornado?.score) || 0,
      Number(hail?.score) || 0,
      Number(wind?.score) || 0
    );

    const overallNriScore = Number.isFinite(Number(data.overallScore)) ? Number(data.overallScore) : 50;
    const effectiveHazardScore = Math.max(overallNriScore, maxNonFloodPerilScore);

    // Hazard Factor curves from 0.70x (very low hazard) to 2.40x (severe wildfire/storm hazard)
    let hazardFactor = 1.0;
    let hazardTierLabel = "Moderate Regional Hazard";
    let hazardTierShort = "Moderate Risk";

    if (effectiveHazardScore >= 80) {
      hazardFactor = 2.40;
      hazardTierLabel = "Very High Catastrophe Risk (Surplus / High-Risk Pool tier)";
      hazardTierShort = "Very High Risk";
    } else if (effectiveHazardScore >= 65) {
      hazardFactor = 1.75;
      hazardTierLabel = "Relatively High Catastrophe Risk";
      hazardTierShort = "Elevated Risk";
    } else if (effectiveHazardScore >= 45) {
      hazardFactor = 1.15;
      hazardTierLabel = "Moderate Catastrophe Risk";
      hazardTierShort = "Moderate Risk";
    } else if (effectiveHazardScore >= 25) {
      hazardFactor = 0.88;
      hazardTierLabel = "Relatively Low Catastrophe Risk";
      hazardTierShort = "Low Risk Tier";
    } else {
      hazardFactor = 0.72;
      hazardTierLabel = "Very Low Catastrophe Risk (Preferred Low-Risk credit)";
      hazardTierShort = "Preferred Low Risk";
    }

    const baseHoRate = Number((stateBaseHoRate * hazardFactor).toFixed(2));

    // Deductible factor
    const ded = Number(inputs.deductible) || 1000;
    const hoDedFactor = ded >= 5000 ? 0.84 : (ded >= 2500 ? 0.92 : 1.0);
    const floodDedFactor = ded >= 5000 ? 0.88 : (ded >= 2500 ? 0.95 : 1.0);

    // Multipliers for claims
    let userFloodClaimMult = 1.0;
    let userHoClaimMult = inputs.claimCount === 0 ? 0.90 : 1.0;
    let hoClaimSurchargeLabel = "None (Claims-Free Credit Applied)";
    let floodClaimSurchargeLabel = "None (Standard Actuarial Tier)";

    if (inputs.claimCount === 1) {
      if (inputs.claimType === "flood") {
        userFloodClaimMult = 1.25;
        floodClaimSurchargeLabel = "+25% Surcharge (Prior flood claim history)";
        userHoClaimMult = 1.0;
        hoClaimSurchargeLabel = "Unaffected (Private policy excludes flood perils)";
      } else if (inputs.claimType === "water") {
        userHoClaimMult = 1.35;
        hoClaimSurchargeLabel = "+35% Surcharge (Interior plumbing leak history)";
        userFloodClaimMult = 1.0;
        floodClaimSurchargeLabel = "Unaffected (FEMA NFIP excludes interior plumbing)";
      } else if (inputs.claimType === "wind") {
        userHoClaimMult = 1.18;
        hoClaimSurchargeLabel = "+18% Surcharge (Wind / hail weather claim)";
        userFloodClaimMult = 1.0;
        floodClaimSurchargeLabel = "Unaffected (FEMA NFIP excludes windstorm claims)";
      } else if (inputs.claimType === "fire") {
        userHoClaimMult = 1.30;
        hoClaimSurchargeLabel = "+30% Surcharge (Fire / structural claim)";
        userFloodClaimMult = 1.0;
        floodClaimSurchargeLabel = "Unaffected (FEMA NFIP excludes non-flood perils)";
      }
    } else if (inputs.claimCount >= 2) {
      if (inputs.claimType === "flood") {
        userFloodClaimMult = 1.65;
        floodClaimSurchargeLabel = "+65% Severe Penalty (Repetitive Loss Status)";
        userHoClaimMult = 1.0;
        hoClaimSurchargeLabel = "Unaffected (Private policy excludes flood perils)";
      } else if (inputs.claimType === "water") {
        userHoClaimMult = 2.10;
        hoClaimSurchargeLabel = "+110% Critical Surcharge (Repeat water/plumbing claims)";
        userFloodClaimMult = 1.0;
        floodClaimSurchargeLabel = "Unaffected (FEMA NFIP excludes interior plumbing)";
      } else if (inputs.claimType === "fire") {
        userHoClaimMult = 1.90;
        hoClaimSurchargeLabel = "+90% Severe Surcharge (Repeat fire/structural claims)";
        userFloodClaimMult = 1.0;
        floodClaimSurchargeLabel = "Unaffected (FEMA NFIP excludes non-flood perils)";
      } else if (inputs.claimType === "wind") {
        userHoClaimMult = 1.60;
        hoClaimSurchargeLabel = "+60% Surcharge (Repeat wind/storm weather losses)";
        userFloodClaimMult = 1.0;
        floodClaimSurchargeLabel = "Unaffected (FEMA NFIP excludes windstorm claims)";
      }
    }

    // Vintage / Era Factor (Structural age, plumbing materials, electrical, and building code vintage)
    function getVintageProfile(year) {
      const y = Number(year) || 1990;
      if (y < 1970) {
        return {
          factor: 1.22,
          badge: "Pre-1970 (+22%)",
          label: "Pre-1970 Vintage (+22% Cast Iron & Wiring Risk)",
          rateDeltaPct: 22,
        };
      }
      if (y < 1980) {
        return {
          factor: 1.16,
          badge: "1970–1979 (+16%)",
          label: "1970–1979 Era (+16% Unreinforced Framing)",
          rateDeltaPct: 16,
        };
      }
      if (y < 1995) {
        return {
          factor: 1.05,
          badge: "1980–1994 (+5%)",
          label: "1980–1994 Era (+5% Aging Infrastructure)",
          rateDeltaPct: 5,
        };
      }
      if (y <= 2001) {
        return {
          factor: 1.00,
          badge: "1995–2001 (Baseline)",
          label: "1995–2001 Standard Baseline (1.0x)",
          rateDeltaPct: 0,
        };
      }
      if (y <= 2012) {
        return {
          factor: 0.92,
          badge: "2002–2012 (-8%)",
          label: "2002–2012 Modern IBC Code (-8% Credit)",
          rateDeltaPct: -8,
        };
      }
      return {
        factor: 0.86,
        badge: "Post-2012 (-14%)",
        label: "Post-2012 Enhanced Code (-14% Credit)",
        rateDeltaPct: -14,
      };
    }

    const neighborYear = Math.round(Number(data.medianYearBuilt) || 1990);
    const userYear = Math.round(Number(inputs.yearBuilt) || neighborYear);
    const userVintage = getVintageProfile(userYear);
    const neighborVintage = getVintageProfile(neighborYear);

    // Physical Property Mitigation Discounter (Actionable Verified Retrofits)
    const mitWindMult = inputs.mitWind ? 0.80 : 1.0;
    const mitFireMult = inputs.mitFire ? 0.88 : 1.0;
    const userHoMitMult = mitWindMult * mitFireMult;
    const userFloodMitMult = inputs.mitFlood ? 0.75 : 1.0;

    const neighborVal = Math.max(100000, Number(data.medianHomeValue) || 350000);
    const userVal = Math.max(50000, Number(inputs.valuation) || neighborVal);

    const isCondo = inputs.propertyType === "condo";

    // FEMA Flood Insurance (Building coverage capped at $250k for SFH; Unit owners contents/additions policy for condos)
    const condoFloodMult = isCondo ? 0.45 : 1.0;
    const userFloodCapVal = Math.min(250000, userVal);
    const neighborFloodCapVal = Math.min(250000, neighborVal);
    
    const userFloodBase = floodBaseRate * (0.6 + 0.4 * (userFloodCapVal / 250000)) * condoFloodMult;
    const neighborFloodBase = floodBaseRate * (0.6 + 0.4 * (neighborFloodCapVal / 250000)) * condoFloodMult;

    const userFloodUnmitigated = userFloodBase * (1 - crsDiscount) * userFloodClaimMult * floodDedFactor;
    const userFloodPremium = Math.round(userFloodUnmitigated * userFloodMitMult + (isCondo ? 45 : 75));
    const neighborFloodPremium = Math.round(neighborFloodBase * (1 - crsDiscount) * 1.0 * 1.0 * 1.0 + (isCondo ? 45 : 75));
    const floodMitSavings = inputs.mitFlood ? Math.max(0, Math.round(userFloodUnmitigated * 0.25)) : 0;

    // Private Homeowners Insurance (Scales with physical structural replacement cost RCV, excluding dirt/land)
    // For single-family homes: covers whole building rebuild (65%-80% of valuation).
    // For condos: HO-6 "walls-in" policy covers interior improvements, fixtures, cabinetry, flooring, and appliances (~22% of valuation).
    // The HOA master policy covers the exterior building structure and common elements.
    const condoStructureRatio = 0.22;
    const activeStructureRatio = isCondo ? condoStructureRatio : marketTier.structureRatio;
    const userStructuralRcv = Math.round(userVal * activeStructureRatio);
    const neighborStructuralRcv = Math.round(neighborVal * activeStructureRatio);
    const userLandVal = isCondo ? 0 : Math.max(0, Math.round(userVal * marketTier.landRatio));

    // HO-6 policies carry a slightly favorable rate modifier on interior-only exposure
    const condoHoRateMult = isCondo ? 0.90 : 1.0;
    const effectiveHoRate = Number((baseHoRate * condoHoRateMult).toFixed(2));
    const userHoBase = (userStructuralRcv / 1000) * effectiveHoRate;
    const neighborHoBase = (neighborStructuralRcv / 1000) * effectiveHoRate;

    // Ground-truth empirical baseline from Census ACS Table B25141 (mortgaged homeowners median)
    // Note: ACS B25141 includes ALL owner-occupied mortgaged units (both single-family and condos).
    const hasEmpiricalHo = Number.isFinite(Number(data.medianHomeownersInsurance)) && Number(data.medianHomeownersInsurance) > 100;
    const empiricalHoVal = hasEmpiricalHo ? Math.round(Number(data.medianHomeownersInsurance)) : null;

    let neighborHoPremium;
    let userHoUnmitigated;
    let hoBaselineSource;
    let hoBaselineShort;

    if (hasEmpiricalHo) {
      // If condo, scale the tract baseline to an actuarial HO-6 equivalent (interior RCV share vs whole structure)
      const condoBenchRatio = isCondo ? (condoStructureRatio / marketTier.structureRatio) : 1.0;
      neighborHoPremium = Math.round(empiricalHoVal * condoBenchRatio);

      // Proportional scaling for property structural replacement value and building vintage era
      const rcvRatio = neighborStructuralRcv > 0 ? (userStructuralRcv / neighborStructuralRcv) : 1.0;
      const vintageRatio = neighborVintage.factor > 0 ? (userVintage.factor / neighborVintage.factor) : 1.0;
      userHoUnmitigated = neighborHoPremium * rcvRatio * vintageRatio * userHoClaimMult * hoDedFactor;
      hoBaselineSource = isCondo
        ? (data.geographyType === "Census Tract" ? "Census ACS B25141 Tract Median (Condo HO-6 Calibrated)" : "Census ACS B25141 County Median (Condo HO-6 Calibrated)")
        : (data.geographyType === "Census Tract"
          ? "Census ACS B25141 Tract Median"
          : (data.geographyType === "State" ? "Census ACS B25141 State Avg" : "Census ACS B25141 County Median"));
      hoBaselineShort = isCondo ? "ACS B25141 (HO-6)" : "Census ACS B25141";
    } else {
      neighborHoPremium = Math.round(neighborHoBase * neighborVintage.factor * 0.90 * 1.0);
      userHoUnmitigated = userHoBase * userVintage.factor * userHoClaimMult * hoDedFactor;
      hoBaselineSource = isCondo ? "FEMA NRI Pure Loss Model (Condo HO-6)" : "FEMA NRI Pure Loss Rate Model";
      hoBaselineShort = isCondo ? "Actuarial HO-6" : "Actuarial Modeled";
    }

    const userHoPremium = Math.round(userHoUnmitigated * userHoMitMult);
    const hoMitSavings = Math.max(0, Math.round(userHoUnmitigated - userHoPremium));
    const totalMitSavings = floodMitSavings + hoMitSavings;

    // Mitigation status labels for UI
    let floodMitLabel = "None (Standard Foundation)";
    if (inputs.mitFlood) {
      floodMitLabel = `Active: Certified Vents / Elevation (-25%, Saved ~$${floodMitSavings.toLocaleString()}/yr)`;
    }

    let hoMitLabel = "None Applied (Standard Construction)";
    const activeHoList = [];
    if (inputs.mitWind) activeHoList.push("Wind / Fortified Roof (-20%)");
    if (inputs.mitFire) activeHoList.push("Defensible Space (-12%)");
    if (activeHoList.length > 0) {
      hoMitLabel = `Active: ${activeHoList.join(" + ")} (Saved ~$${hoMitSavings.toLocaleString()}/yr)`;
    }

    // Totals
    const userTotal = userFloodPremium + userHoPremium;
    const neighborTotal = neighborFloodPremium + neighborHoPremium;
    const totalDelta = userTotal - neighborTotal;
    const pctDelta = neighborTotal > 0 ? (totalDelta / neighborTotal) * 100 : 0;

    // Affordability
    const medianInc = Number(data.medianIncome) || 0;
    const affordabilityPct = medianInc > 0 ? (userTotal / medianInc) * 100 : null;

    // Narrative generation
    const reasons = [];
    if (Math.abs(userVal - neighborVal) >= 15000) {
      const diffVal = Math.round(userVal - neighborVal);
      if (diffVal > 0) {
        reasons.push(`your property valuation is <strong>${formatCurrency(diffVal)} above</strong> the tract median`);
      } else {
        reasons.push(`your property valuation is <strong>${formatCurrency(Math.abs(diffVal))} below</strong> the tract median`);
      }
    }
    if (Math.abs(userYear - neighborYear) >= 3 && Math.abs(userVintage.factor - neighborVintage.factor) >= 0.03) {
      if (userVintage.factor > neighborVintage.factor) {
        reasons.push(`property vintage (${userYear}) is older than tract median (${neighborYear}), adding a structural aging surcharge`);
      } else {
        reasons.push(`modern construction vintage (${userYear}) qualifies for building code discounts vs older tract housing stock (${neighborYear})`);
      }
    }
    if (inputs.claimCount > 0) {
      if (inputs.claimType === "flood") {
        reasons.push(`prior flood claim history raised your FEMA NFIP tier (${floodClaimSurchargeLabel})`);
      } else {
        reasons.push(`prior non-flood loss triggered a private market surcharge (${hoClaimSurchargeLabel})`);
      }
    }
    if (totalMitSavings > 0) {
      const mitNames = [];
      if (inputs.mitWind) mitNames.push("wind mitigation");
      if (inputs.mitFire) mitNames.push("defensible space");
      if (inputs.mitFlood) mitNames.push("flood elevation");
      reasons.push(`verified risk mitigations (${mitNames.join(", ")}) saved a combined <strong>$${totalMitSavings.toLocaleString()}/yr</strong>`);
    }
    if (isCondo) {
      reasons.push(`rated as a <strong>Condo / Townhome (HO-6 'walls-in')</strong> where the HOA master policy covers the exterior shell & roof, reducing individual premium costs vs whole-structure single-family coverage`);
    }
    if (ded > 1000) {
      reasons.push(`higher policy deductible ($${ded.toLocaleString()}) saved approx. $${Math.round(userTotal * 0.08)}/yr`);
    }

    const narrative = reasons.length > 0
      ? `Compared to ${data.geographyType === "Census Tract" ? "tract" : "county"} neighbors, your estimate is <strong>${Math.abs(pctDelta).toFixed(1)}% ${pctDelta >= 0 ? "higher" : "lower"}</strong> primarily because ${reasons.join(", and ")}.`
      : `Your estimate is <strong>on par with the ${data.geographyType === "Census Tract" ? "tract" : "county"} baseline</strong> (${hasEmpiricalHo ? "Census ACS B25141 median" : "actuarial baseline"}) with standard claims-free discounts, matching structural vintage, and local FEMA CRS community rate credits applied.`;

    return {
      isCondo,
      propertyType: inputs.propertyType || "single_family",
      rcvPctLabel: isCondo ? "22% Walls-In" : `${Math.round(marketTier.structureRatio * 100)}% RCV`,
      userVal,
      neighborVal,
      userYear,
      neighborYear,
      userVintage,
      neighborVintage,
      userStructuralRcv,
      userLandVal,
      marketTier,
      userFloodPremium,
      neighborFloodPremium,
      userHoPremium,
      neighborHoPremium,
      userTotal,
      neighborTotal,
      totalDelta,
      pctDelta,
      affordabilityPct,
      crsDiscountPct: Math.round(crsDiscount * 100),
      crsSavings: Math.round(userFloodBase * crsDiscount),
      floodZoneLabel,
      hasEmpiricalHo,
      hoBaselineSource,
      hoBaselineShort,
      baseHoRate,
      hazardTierLabel,
      hazardTierShort,
      hoClaimSurchargeLabel,
      floodClaimSurchargeLabel,
      floodMitLabel,
      hoMitLabel,
      floodMitSavings,
      hoMitSavings,
      totalMitSavings,
      narrative,
    };
  }

function renderCardModal(data) {
    const ratingInfo = riskRatingColor(data.overallRating, data.overallScore);
    const codeAdvisory = buildingCodeAdvisory(data.medianYearBuilt);
    const isGlobal = data.geographyType === "Country";
    const crsInfo = data.crs || getCrsProfile(data.geoid, data.resilienceRating, data.resilienceScore, data.resiliencePercentile);

    // Compute Multi-Peril Loss Composition metrics
    const nonZeroLossPerils = data.perils.filter(p => Number(p.eal) > 0);
    nonZeroLossPerils.sort((a, b) => (Number(b.eal) || 0) - (Number(a.eal) || 0));

    const topPerils = nonZeroLossPerils.slice(0, 4);

    // Consolidate negligible noise perils (< 1.0% share, beyond the top 4) into an "Other Hazards" chip
    const displayPerils = [];
    let otherEal = 0;
    let otherShare = 0;

    nonZeroLossPerils.forEach((p, idx) => {
      if (p.share >= 1.0 || idx < 4) {
        displayPerils.push(p);
      } else {
        otherEal += Number(p.eal) || 0;
        otherShare += Number(p.share) || 0;
      }
    });

    if (otherEal > 0 && otherShare > 0.05) {
      displayPerils.push({
        name: "Other Minor Hazards",
        color: "#94a3b8",
        eal: otherEal,
        share: otherShare,
        lossCostRate: data.buildingExposure > 0 ? (otherEal / data.buildingExposure) * 1000 : null,
      });
    }

    const lossConcentrationText = topPerils.length >= 2
      ? (topPerils[0].share >= 50
          ? `<strong>Single-Peril Dominance:</strong> ${ctx.escapeHtml(topPerils[0].name)} drives <strong>${topPerils[0].share.toFixed(1)}%</strong> of all catastrophe risk (${topPerils[0].lossCostRate ? '$' + topPerils[0].lossCostRate.toFixed(2) : '-'} / $1k TIV) in this jurisdiction.`
          : `<strong>Multi-Peril Concentration:</strong> Top 2 perils (${ctx.escapeHtml(topPerils[0].name)} at <strong>${topPerils[0].share.toFixed(1)}%</strong> and ${ctx.escapeHtml(topPerils[1].name)} at <strong>${topPerils[1].share.toFixed(1)}%</strong>) account for <strong>${(topPerils[0].share + topPerils[1].share).toFixed(1)}%</strong> of total modeled catastrophe losses.`)
      : (topPerils.length === 1
          ? `<strong>Primary Hazard Driver:</strong> ${ctx.escapeHtml(topPerils[0].name)} accounts for <strong>${topPerils[0].share.toFixed(1)}%</strong> of modeled losses.`
          : `Multi-peril catastrophe loss distribution is balanced across regional hazard vectors.`);

    let gradientAcc = 0;
    const conicGradientStyle = displayPerils.length > 0
      ? displayPerils.map((p, idx) => {
          const start = gradientAcc;
          gradientAcc += p.share;
          const end = (idx === displayPerils.length - 1) ? 100 : gradientAcc;
          const color = p.color || getPerilColor(p.name);
          return `${color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
        }).join(", ")
      : "#94a3b8 0% 100%";

    content.innerHTML = `
      <div class="risk-card-print-header">
        <div class="print-brand">iCHARMrisk | Catastrophe Risk &amp; Underwriting Assessment Report</div>
        <div class="print-meta">Evaluation Vintage: ${data.year} • Report Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
      </div>

      <div class="risk-card-header">
        <div class="risk-card-title-wrap">
          <div class="risk-card-eyebrow">${data.geographyType.toUpperCase()} PROPERTY UNDERWRITING DOSSIER</div>
          <h2 id="riskCardTitle" class="risk-card-title">${ctx.escapeHtml(data.locationName)}</h2>
          <div class="risk-card-meta">
            <span><strong>GEOID / FIPS:</strong> ${ctx.escapeHtml(data.geoid)}</span>
            <span>•</span>
            <span><strong>Evaluation Year:</strong> ${data.year}</span>
            <span>•</span>
            <span><strong>Sources:</strong> ${isGlobal ? "UN OCHA, World Bank, ND-GAIN, WRI" : "FEMA NRI &amp; U.S. Census ACS"}</span>
          </div>
        </div>

        <div class="risk-card-header-right">
          <div class="risk-card-rating-badge ${ratingInfo.badge}">
            <span class="badge-dot"></span>
            <span class="badge-text">${ratingInfo.label} Risk</span>
            ${Number.isFinite(Number(data.overallScore)) ? `<span class="badge-score">${Number(data.overallScore).toFixed(1)}/100</span>` : ""}
          </div>
          <button type="button" id="riskCardCloseBtn" class="risk-card-close-btn" aria-label="Close Risk Card">&times;</button>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="risk-card-actions">
        <button type="button" id="riskCardPrintBtn" class="risk-card-btn print-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Download PDF / Print
        </button>
        <button type="button" id="riskCardCsvBtn" class="risk-card-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Download CSV
        </button>
        <button type="button" id="riskCardJsonBtn" class="risk-card-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Download JSON
        </button>
        <button type="button" id="riskCardCopyBtn" class="risk-card-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Brief
        </button>
      </div>

      <!-- KPI Executive Metrics Grid -->
      <div class="risk-card-kpi-grid">
        ${!isGlobal ? `
          <div class="kpi-box highlight">
            <div class="kpi-label">Indicative Loss Cost Rate</div>
            <div class="kpi-value">${data.lossCostRate ? `$${data.lossCostRate.toFixed(2)}` : "-"}</div>
            <div class="kpi-sub">Pure loss cost per $1,000 building value</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Total Expected Annual Loss</div>
            <div class="kpi-value">${formatCurrency(data.totalEal)}</div>
            <div class="kpi-sub">${formatCurrencyFull(data.totalEal)} / year</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Social Vulnerability</div>
            <div class="kpi-value">${Number.isFinite(Number(data.socialVulnScore)) ? Number(data.socialVulnScore).toFixed(1) : "-"}</div>
            <div class="kpi-sub">Rating: ${ctx.escapeHtml(data.socialVulnRating)}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Community Resilience</div>
            <div class="kpi-value">${Number.isFinite(Number(data.resilienceScore)) ? Number(data.resilienceScore).toFixed(1) : "-"}</div>
            <div class="kpi-sub">Rating: ${ctx.escapeHtml(data.resilienceRating)}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Median Property Value</div>
            <div class="kpi-value">${data.medianHomeValue ? formatCurrency(data.medianHomeValue) : "-"}</div>
            <div class="kpi-sub">Census ACS median owner-occupied</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Housing Stock Vintage</div>
            <div class="kpi-value">${data.medianYearBuilt ? Math.round(data.medianYearBuilt) : "-"}</div>
            <div class="kpi-sub">${codeAdvisory.era}</div>
          </div>
        ` : `
          <div class="kpi-box highlight">
            <div class="kpi-label">INFORM Crisis Risk</div>
            <div class="kpi-value">${Number.isFinite(Number(data.overallScore)) ? (Number(data.overallScore) / 10).toFixed(1) : "-"} / 10</div>
            <div class="kpi-sub">UN OCHA Multi-Hazard Index</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">GDP Per Capita</div>
            <div class="kpi-value">${data.gdpPerCapita ? formatCurrency(data.gdpPerCapita) : "-"}</div>
            <div class="kpi-sub">Economic buffer capacity</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Safely Managed Water</div>
            <div class="kpi-value">${formatPct(data.drinkingWaterPct)}</div>
            <div class="kpi-sub">Resilience to water-borne disease</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Electricity Access</div>
            <div class="kpi-value">${formatPct(data.electricityPct)}</div>
            <div class="kpi-sub">Emergency response baseline</div>
          </div>
        `}
      </div>

      ${!isGlobal ? `
        <!-- Building Code & Structural Era Advisory -->
        <div class="risk-code-alert ${codeAdvisory.alertClass}">
          <span class="code-alert-icon">${codeAdvisory.icon}</span>
          <div class="code-alert-text">
            <strong>Building Code Era Analysis (Median Build Year ${data.medianYearBuilt ? Math.round(data.medianYearBuilt) : "Unknown"}):</strong>
            ${codeAdvisory.note}
          </div>
        </div>
      ` : ""}

      <!-- Multi-Peril Loss Composition & Hazard Matrix -->
      <div class="risk-card-section">
        <div class="section-header">
          <h3>Multi-Peril Catastrophe Hazard Scorecard</h3>
          <span class="section-sub">Actuarial loss composition, pure loss cost rate per $1,000 TIV, and historical event frequencies.</span>
        </div>

        ${!isGlobal && nonZeroLossPerils.length > 0 ? `
          <!-- Multi-Peril Loss Composition Pie Chart -->
          <div class="loss-comp-container">
            <div class="loss-comp-header">
              <div>
                <span class="loss-comp-title">Average Annual Loss (AAL) Disaster Composition</span>
                <span class="loss-comp-subtitle">Modeled catastrophe loss distribution across peril vectors</span>
              </div>
              <div class="loss-comp-total-badge">
                <strong>Total AAL: ${formatCurrency(data.totalEal)}/yr</strong>
                ${data.lossCostRate ? `<span class="loss-comp-total-rate"> • $${data.lossCostRate.toFixed(2)} / $1k TIV</span>` : ""}
              </div>
            </div>

            <div class="loss-pie-layout">
              <!-- Visual Donut / Pie Chart -->
              <div class="loss-donut-wrap">
                <div class="loss-donut-chart" style="background: conic-gradient(${conicGradientStyle});">
                  <div class="loss-donut-center">
                    <span class="loss-donut-center-lbl">TOTAL AAL</span>
                    <strong class="loss-donut-center-val">${formatCurrency(data.totalEal)}</strong>
                    ${data.lossCostRate ? `<span class="loss-donut-center-sub">$${data.lossCostRate.toFixed(2)} / $1k</span>` : ""}
                  </div>
                </div>
              </div>

              <!-- Loss Breakdown Chips -->
              <div class="loss-pie-breakdown">
                <div class="loss-pie-grid">
                  ${displayPerils.map(p => `
                    <div class="loss-pie-chip" title="${ctx.escapeHtml(p.name)}: ${p.share.toFixed(1)}% (${formatCurrency(p.eal)}/yr)">
                      <div class="loss-chip-top">
                        <div class="loss-chip-title">
                          <span class="loss-comp-dot" style="background: ${p.color || getPerilColor(p.name)};"></span>
                          <span class="loss-comp-name">${ctx.escapeHtml(p.name)}</span>
                        </div>
                        <span class="loss-chip-pct">${p.share >= 0.1 ? p.share.toFixed(1) + '%' : '<0.1%'}</span>
                      </div>
                      <div class="loss-chip-bottom">
                        <div class="loss-chip-dollars">
                          <strong>${formatCurrency(p.eal)}</strong><span class="loss-chip-sub">/yr</span>
                        </div>
                        <span class="loss-chip-rate">${p.lossCostRate != null ? (p.lossCostRate >= 0.01 ? '$' + p.lossCostRate.toFixed(2) : '<$0.01') + '/$1k' : '-'}</span>
                      </div>
                    </div>
                  `).join("")}
                </div>

                <div class="loss-comp-insight">
                  ${lossConcentrationText}
                </div>
              </div>
            </div>
          </div>
        ` : ""}

        <div class="risk-table-wrap">
          <table class="risk-card-table">
            <thead>
              <tr>
                <th>Hazard / Peril</th>
                <th>Hazard Tier</th>
                <th>Risk Score (0–100)</th>
                ${!isGlobal ? `
                  <th title="Percentage of total Expected Annual Loss generated by this peril">Loss Share (%)</th>
                  <th title="Indicative pure loss cost in dollars per $1,000 of insurable structural value">Loss Cost / $1k TIV</th>
                ` : ""}
                <th>Expected Annual Loss ($/yr)</th>
                ${!isGlobal ? `<th>Annual Event Freq.</th>` : ""}
              </tr>
            </thead>
            <tbody>
              ${data.perils.map((peril) => {
                const pColor = riskRatingColor(peril.rating, peril.score);
                const scoreNum = Number(peril.score);
                const scorePercent = Number.isFinite(scoreNum) ? Math.min(100, Math.max(0, scoreNum)) : 0;
                return `
                  <tr>
                    <td>
                      <div class="peril-name-cell">
                        <span class="peril-icon">${peril.icon || "⚠️"}</span>
                        <strong>${ctx.escapeHtml(peril.name)}</strong>
                      </div>
                    </td>
                    <td>
                      <span class="peril-badge ${pColor.badge}">${pColor.label}</span>
                    </td>
                    <td>
                      <div class="score-cell">
                        <div class="score-bar-wrap">
                          <div class="score-bar-fill" style="width: ${scorePercent}%; background: ${pColor.border};"></div>
                        </div>
                        <span class="score-num">${Number.isFinite(scoreNum) ? scoreNum.toFixed(1) : "-"}</span>
                      </div>
                    </td>
                    ${!isGlobal ? `
                      <td class="numeric-cell">
                        <span class="loss-share-pill" style="border-left: 3px solid ${getPerilColor(peril.name)};">
                          ${peril.share >= 0.1 ? peril.share.toFixed(1) + "%" : (peril.share > 0 ? "<0.1%" : "0.0%")}
                        </span>
                      </td>
                      <td class="numeric-cell loss-cost-val">
                        ${peril.lossCostRate != null ? (peril.lossCostRate >= 0.01 ? '$' + peril.lossCostRate.toFixed(2) : (peril.lossCostRate > 0 ? '<$0.01' : '$0.00')) : '-'}
                      </td>
                    ` : ""}
                    <td class="numeric-cell">
                      <strong>${formatCurrency(peril.eal)}</strong>
                      ${peril.eal ? `<span class="numeric-sub">${formatCurrencyFull(peril.eal)}</span>` : ""}
                    </td>
                    ${!isGlobal ? `
                      <td class="numeric-cell">
                        ${peril.frequency ? `${Number(peril.frequency).toFixed(2)} / yr` : "-"}
                      </td>
                    ` : ""}
                  </tr>
                `;
              }).join("")}
            </tbody>
            ${!isGlobal && data.totalEal ? `
              <tfoot>
                <tr class="risk-table-total-row">
                  <td colspan="3"><strong>COMPOSITE PORTFOLIO TOTAL</strong></td>
                  <td class="numeric-cell"><strong>100.0%</strong></td>
                  <td class="numeric-cell loss-cost-val"><strong>${data.lossCostRate ? '$' + data.lossCostRate.toFixed(2) : '-'}</strong></td>
                  <td class="numeric-cell">
                    <strong>${formatCurrency(data.totalEal)}</strong>
                    <span class="numeric-sub">${formatCurrencyFull(data.totalEal)} / yr</span>
                  </td>
                  <td class="numeric-cell"><strong>-</strong></td>
                </tr>
              </tfoot>
            ` : ""}
          </table>
        </div>
      </div>

      ${!isGlobal ? `
        <!-- FEMA Community Rating System (CRS) & Flood Mitigation Profile -->
        <div class="risk-card-section">
          <div class="section-header">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
              <div>
                <h3>FEMA Community Rating System (CRS) &amp; Flood Mitigation Profile</h3>
                <span class="section-sub">NFIP community classification, policyholder premium mitigation discounts, and municipal resilience benchmarks.</span>
              </div>
              <span class="crs-badge">
                🛡️ CRS Class ${crsInfo.class} (${crsInfo.discount} SFHA Discount)
              </span>
            </div>
          </div>

          <div class="crs-container">
            <div class="crs-hero-grid">
              <div class="crs-hero-item">
                <span class="crs-hero-label">FEMA CRS Classification</span>
                <span class="crs-hero-val">Class ${crsInfo.class}</span>
                <span class="crs-hero-sub">${crsInfo.type}</span>
              </div>
              <div class="crs-hero-item">
                <span class="crs-hero-label">SFHA Flood Premium Discount</span>
                <span class="crs-hero-val" style="color: #16a34a;">-${crsInfo.discount}</span>
                <span class="crs-hero-sub">Special Flood Hazard Area</span>
              </div>
              <div class="crs-hero-item">
                <span class="crs-hero-label">Non-SFHA Flood Discount</span>
                <span class="crs-hero-val" style="color: #2563eb;">-${crsInfo.nonSfhaDiscount}</span>
                <span class="crs-hero-sub">Standard X-Zones</span>
              </div>
              <div class="crs-hero-item">
                <span class="crs-hero-label">Community Resilience Baseline</span>
                <span class="crs-hero-val">${data.resilienceScore ? Number(data.resilienceScore).toFixed(1) : "-"}</span>
                <span class="crs-hero-sub">${data.resilienceRating || "Rating: Baseline"}</span>
              </div>
            </div>

            <!-- 10-Class CRS Ladder -->
            <div class="crs-ladder-wrap">
              <div class="crs-ladder-label">National Flood Insurance Program (NFIP) 10-Class Discount Ladder</div>
              <div class="crs-ladder">
                ${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(lvl => {
                  const disc = (10 - lvl) * 5;
                  const isActive = lvl === crsInfo.class;
                  return `
                    <div class="crs-step ${isActive ? "active" : ""}" title="Class ${lvl}: ${disc}% NFIP discount">
                      <span class="crs-step-num">Class ${lvl}</span>
                      <span class="crs-step-disc">${disc > 0 ? '-' + disc + '%' : '0%'}</span>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="crs-advisory-note">
              <strong>Actuarial Underwriting Value:</strong> Under FEMA's Community Rating System, municipalities earning credit points for exceeding minimum NFIP standards (such as mandatory freeboard elevation, stormwater detention, and open-space preservation) pass direct 5% to 45% premium discounts to all policyholders. Communities in higher CRS classes demonstrate significantly lower structural flood claims and reduced residual loss volatility.
            </div>
          </div>
        </div>

        <!-- Interactive Property Underwriting & Insurance Premium Estimator -->
        <div class="risk-card-section insurance-calc-section">
          <div class="section-header">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
              <div>
                <h3>🧮 Interactive Property Insurance &amp; Risk Premium Calculator</h3>
                <span class="section-sub">Actuarial projection comparing your property against the ${ctx.escapeHtml(data.geographyType)} baseline.</span>
              </div>
              <span class="calc-status-badge" id="calcEngineBadge">Dual-Engine: FEMA NFIP + Private HO-3</span>
            </div>
          </div>

          <!-- Controls Grid -->
          <div class="calc-controls-grid">
            <div class="calc-control-group calc-full-width">
              <label class="calc-control-label">
                <span>Property Type &amp; Policy Scope</span>
                <span class="calc-control-hint">HO-6 (Condo) covers interior "walls-in"; HOA master policy covers building shell</span>
              </label>
              <div class="calc-pills-row" id="propertyTypeRow">
                <button type="button" class="calc-pill active" data-prop="single_family" id="propTypeSfBtn">
                  <span style="margin-right: 6px;">🏡</span> Single-Family Home (HO-3 / HO-5)
                </button>
                <button type="button" class="calc-pill" data-prop="condo" id="propTypeCondoBtn">
                  <span style="margin-right: 6px;">🏢</span> Condominium / Townhome (HO-6 Walls-In)
                </button>
              </div>
            </div>

            <div class="calc-control-group">
              <label for="propValInput" class="calc-control-label">
                <span>Property Market Value</span>
              </label>
              <div class="calc-input-wrap">
                <span class="calc-input-prefix">$</span>
                <input type="number" id="propValInput" class="calc-num-input" value="${Math.round(data.medianHomeValue || 350000)}" step="5000" min="50000" max="10000000">
              </div>
              <div class="calc-rcv-subtext" id="calcRcvSubtext">
                Calculating insurable structural rebuild cost (RCV)...
              </div>
            </div>

            <div class="calc-control-group">
              <label for="yearBuiltInput" class="calc-control-label">
                <span>Year Built</span>
                <span class="calc-control-hint" id="yearBuiltHint">Tract: ${data.medianYearBuilt ? Math.round(data.medianYearBuilt) : "1985"}</span>
              </label>
              <div class="calc-input-wrap">
                <input type="number" id="yearBuiltInput" class="calc-num-input" style="padding-left: 12px;" value="${data.medianYearBuilt ? Math.round(data.medianYearBuilt) : 1985}" step="1" min="1850" max="2026">
              </div>
              <div class="calc-rcv-subtext" id="calcYearBuiltSubtext">
                Building code &amp; infrastructure era
              </div>
            </div>

            <div class="calc-control-group">
              <label for="deductibleSelect" class="calc-control-label">
                <span>Policy Deductible</span>
              </label>
              <select id="deductibleSelect" class="calc-select-input">
                <option value="1000" selected>$1,000 Standard</option>
                <option value="2500">$2,500 High-Deductible (~8% savings)</option>
                <option value="5000">$5,000 Catastrophe-Only (~16% savings)</option>
              </select>
              <div class="calc-rcv-subtext">
                Higher deductible lowers annual premium
              </div>
            </div>

            <div class="calc-control-group calc-full-width">
              <label class="calc-control-label">
                <span>Previous Property Claims (Past 5 Years)</span>
                <span class="calc-control-hint">Frequency is the primary underwriting rating factor</span>
              </label>
              <div class="calc-pills-row" id="claimCountRow">
                <button type="button" class="calc-pill active" data-count="0">0 Claims (Clean Record)</button>
                <button type="button" class="calc-pill" data-count="1">1 Prior Claim</button>
                <button type="button" class="calc-pill" data-count="2">2+ Prior Claims (Repetitive)</button>
              </div>
            </div>

            <div class="calc-control-group calc-full-width hidden" id="claimTypeGroup">
              <label class="calc-control-label">
                <span>Primary Cause of Prior Claim</span>
                <span class="calc-control-hint">Peril type determines whether FEMA (Flood) or Private (Homeowners) penalizes</span>
              </label>
              <div class="calc-pills-row" id="claimTypeRow">
                <button type="button" class="calc-pill active" data-type="water">💧 Plumbing / Water</button>
                <button type="button" class="calc-pill" data-type="flood">🌊 Flood / Surge</button>
                <button type="button" class="calc-pill" data-type="wind">🌪️ Wind / Storm</button>
                <button type="button" class="calc-pill" data-type="fire">🔥 Fire / Structural</button>
              </div>
            </div>

            <div class="calc-control-group calc-full-width">
              <label class="calc-control-label">
                <span>Actionable Risk Mitigations (Verified Retrofits)</span>
                <span class="calc-control-hint" id="mitigationSavingsHint">Click to simulate certified physical loss reduction discounts</span>
              </label>
              <div class="calc-mitigation-row" id="mitigationRow">
                <button type="button" class="calc-mitigation-pill" id="mitWindBtn" data-mit="wind" title="Wind Mitigation: Impact-rated roof, hurricane clips, opening protection">
                  <span class="mit-icon">🌪️</span>
                  <div class="mit-text">
                    <strong>Wind Mitigation</strong>
                    <small>-20% HO-3 Premium</small>
                  </div>
                  <span class="mit-check">✓</span>
                </button>
                <button type="button" class="calc-mitigation-pill" id="mitFireBtn" data-mit="fire" title="Defensible Space: Firewise certified perimeter & Class A fire-rated roof">
                  <span class="mit-icon">🔥</span>
                  <div class="mit-text">
                    <strong>Defensible Space</strong>
                    <small>-12% HO-3 Premium</small>
                  </div>
                  <span class="mit-check">✓</span>
                </button>
                <button type="button" class="calc-mitigation-pill" id="mitFloodBtn" data-mit="flood" title="Flood Mitigation: Certified freeboard & automatic hydrostatic flood vents">
                  <span class="mit-icon">🌊</span>
                  <div class="mit-text">
                    <strong>Elevated / Flood Vents</strong>
                    <small>-25% Flood Premium</small>
                  </div>
                  <span class="mit-check">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Dual Side-by-Side Insurance Cards -->
          <div class="calc-dual-grid">
            <!-- FEMA Flood Card -->
            <div class="calc-card flood-card">
              <div class="calc-card-header">
                <div class="calc-card-title">
                  <span class="calc-card-icon">🌊</span>
                  <div>
                    <h4>FEMA Flood Insurance (NFIP)</h4>
                    <span class="calc-card-sub">Federally Backed • Risk Rating 2.0</span>
                  </div>
                </div>
                <span class="calc-card-gov-badge">Gov / NFIP</span>
              </div>

              <div class="calc-card-body">
                <div class="calc-price-row">
                  <div class="calc-user-price">
                    <span class="calc-price-label">Your Estimated Premium</span>
                    <div class="calc-price-num" id="userFloodPrice">$0 / yr</div>
                    <span class="calc-price-monthly" id="userFloodMonthly">$0 / mo</span>
                  </div>
                  <div class="calc-neighbor-benchmark">
                    <span class="calc-bench-label">Tract Average Baseline</span>
                    <div class="calc-bench-num" id="neighborFloodPrice">$0 / yr</div>
                    <span class="calc-bench-sub" id="floodDeltaTag">On Par</span>
                  </div>
                </div>

                <div class="calc-feature-list">
                  <div class="calc-feature-item">
                    <span>Coverage Limit:</span>
                    <strong id="floodCoverageLimit">$250k Bldg • $100k Contents</strong>
                  </div>
                  <div class="calc-feature-item">
                    <span>Base Flood Risk:</span>
                    <strong id="floodZoneTag">-</strong>
                  </div>
                  <div class="calc-feature-item">
                    <span>FEMA CRS Discount:</span>
                    <strong style="color: #16a34a;" id="crsDiscountTag">-</strong>
                  </div>
                  <div class="calc-feature-item">
                    <span>Flood Mitigation:</span>
                    <span id="floodMitTag">Standard Foundation</span>
                  </div>
                  <div class="calc-feature-item">
                    <span>Prior Claim Impact:</span>
                    <span id="floodClaimImpactTag">-</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Private Homeowners Card -->
            <div class="calc-card ho-card">
              <div class="calc-card-header">
                <div class="calc-card-title">
                  <span class="calc-card-icon" id="hoCardIcon">🏡</span>
                  <div>
                    <h4 id="hoCardTitle">Homeowners / Hazard (HO-3)</h4>
                    <span class="calc-card-sub" id="hoCardSub">State Regulated • Private Market</span>
                  </div>
                </div>
                <span class="calc-card-pvt-badge" id="hoCardBadge">Private Market</span>
              </div>

              <div class="calc-card-body">
                <div class="calc-price-row">
                  <div class="calc-user-price">
                    <span class="calc-price-label">Your Estimated Premium</span>
                    <div class="calc-price-num" id="userHoPrice">$0 / yr</div>
                    <span class="calc-price-monthly" id="userHoMonthly">$0 / mo</span>
                  </div>
                  <div class="calc-neighbor-benchmark">
                    <span class="calc-bench-label" id="hoBenchLabel">Tract Median Baseline</span>
                    <div class="calc-bench-num" id="neighborHoPrice">$0 / yr</div>
                    <span class="calc-bench-sub" id="hoDeltaTag">On Par</span>
                  </div>
                </div>

                <div class="calc-feature-list">
                  <div class="calc-feature-item">
                    <span id="hoCoverageLabel">Structure Value (RCV):</span>
                    <strong id="hoCoverageLimit">$0</strong>
                  </div>
                  <div class="calc-feature-item">
                    <span>Home Vintage Tier:</span>
                    <span id="hoVintageTag">-</span>
                  </div>
                  <div class="calc-feature-item">
                    <span>Baseline Source:</span>
                    <strong id="hoBaselineSourceTag" style="color: #6366f1;">Census ACS B25141</strong>
                  </div>
                  <div class="calc-feature-item">
                    <span>Hazard Loss Rate:</span>
                    <strong id="hoRateTag">-</strong>
                  </div>
                  <div class="calc-feature-item">
                    <span>Mitigation Credits:</span>
                    <span id="hoMitTag">None Applied</span>
                  </div>
                  <div class="calc-feature-item">
                    <span>Prior Claim Impact:</span>
                    <span id="hoClaimImpactTag">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Summary & Comparison Banner -->
          <div class="calc-summary-banner">
            <div class="calc-summary-top">
              <div class="calc-summary-stat">
                <span class="calc-stat-lbl">Combined Annual Insurance</span>
                <div class="calc-stat-val" id="combinedUserPrice">$0 / yr</div>
                <span class="calc-stat-sub" id="combinedUserMonthly">$0 / month in escrow</span>
              </div>
              <div class="calc-summary-stat">
                <span class="calc-stat-lbl">Tract Baseline (Avg Neighbor)</span>
                <div class="calc-stat-val" id="combinedNeighborPrice">$0 / yr</div>
                <span class="calc-stat-sub" id="combinedNeighborMonthly">$0 / month</span>
              </div>
              <div class="calc-summary-stat highlight">
                <span class="calc-stat-lbl">Neighbor Comparison Delta</span>
                <div class="calc-stat-val" id="combinedDeltaVal">0%</div>
                <span class="calc-stat-sub" id="combinedDeltaSub">Relative to tract norm</span>
              </div>
              ${data.medianIncome ? `
                <div class="calc-summary-stat">
                  <span class="calc-stat-lbl">Insurance Affordability Ratio</span>
                  <div class="calc-stat-val" id="affordabilityVal">0%</div>
                  <span class="calc-stat-sub">of Tract Median Income</span>
                </div>
              ` : ""}
            </div>

            <!-- Dynamic AI / Actuarial Risk Narrative -->
            <div class="calc-narrative-box" id="calcNarrative">
              Calculating variance...
            </div>
          </div>
        </div>

        <!-- Community Exposure & Demographics -->
        <div class="risk-card-section">
          <div class="section-header">
            <h3>Community Exposure &amp; Vulnerability Profile</h3>
            <span class="section-sub">Asset values, population distribution, and evacuation vulnerability baselines.</span>
          </div>

          <div class="exposure-grid">
            <div class="exposure-item">
              <span class="exp-label">Total Population</span>
              <span class="exp-val">${data.totalPopulation ? Math.round(data.totalPopulation).toLocaleString() : "-"}</span>
            </div>
            <div class="exposure-item">
              <span class="exp-label">Total Housing Units</span>
              <span class="exp-val">${data.housingUnits ? Math.round(data.housingUnits).toLocaleString() : "-"}</span>
            </div>
            <div class="exposure-item">
              <span class="exp-label">Homeownership Rate</span>
              <span class="exp-val">${formatPct(data.ownerOccupiedPct)}</span>
            </div>
            <div class="exposure-item">
              <span class="exp-label">Median Household Income</span>
              <span class="exp-val">${data.medianIncome ? formatCurrencyFull(data.medianIncome) : "-"}</span>
            </div>
            <div class="exposure-item">
              <span class="exp-label">Poverty Rate</span>
              <span class="exp-val">${formatPct(data.povertyRate)}</span>
            </div>
            <div class="exposure-item">
              <span class="exp-label">Households without Vehicle</span>
              <span class="exp-val">${formatPct(data.noVehiclePct)}</span>
            </div>
          </div>
        </div>
      ` : ""}

      <div class="risk-card-footer">
        <div class="footer-note">
          <strong>Underwriting Advisory:</strong> This risk profile compiles data from FEMA's National Risk Index (NRI) and the U.S. Census Bureau American Community Survey. Expected Annual Loss (EAL) represents modeled average annualized direct damage before reinsurance recoveries and policy deductibles.
        </div>
        <div class="footer-stamp">SDSU SCIL Dashboard • iCHARMrisk Insurance Suite</div>
      </div>
    `;

    // Initialize interactive insurance calculator for US geographies
    if (!isGlobal) {
      initInsuranceCalculator(data);
    }

    // Wire up buttons
    document.getElementById("riskCardCloseBtn")?.addEventListener("click", close);
    document.getElementById("riskCardPrintBtn")?.addEventListener("click", () => window.print());
    document.getElementById("riskCardCsvBtn")?.addEventListener("click", () => exportCsv(data));
    document.getElementById("riskCardJsonBtn")?.addEventListener("click", () => exportJson(data));
    document.getElementById("riskCardCopyBtn")?.addEventListener("click", () => copyBrief(data));
  }

  function initInsuranceCalculator(data) {
    const valInput = document.getElementById("propValInput");
    const yearInput = document.getElementById("yearBuiltInput");
    const dedSelect = document.getElementById("deductibleSelect");
    const countRow = document.getElementById("claimCountRow");
    const typeGroup = document.getElementById("claimTypeGroup");
    const typeRow = document.getElementById("claimTypeRow");
    const mitWindBtn = document.getElementById("mitWindBtn");
    const mitFireBtn = document.getElementById("mitFireBtn");
    const mitFloodBtn = document.getElementById("mitFloodBtn");

    if (!valInput || !dedSelect || !countRow) return;

    let propertyType = "single_family";
    let claimCount = 0;
    let claimType = "water";
    let mitWind = false;
    let mitFire = false;
    let mitFlood = false;

    function update() {
      const inputs = {
        propertyType,
        valuation: Number(valInput.value) || 0,
        yearBuilt: Number(yearInput?.value) || Number(data.medianYearBuilt) || 1990,
        deductible: Number(dedSelect.value) || 1000,
        claimCount,
        claimType,
        mitWind,
        mitFire,
        mitFlood,
      };

      const res = calculateInsuranceModel(inputs, data);

      // Property type header badge & card headers
      const calcEngineBadgeEl = document.getElementById("calcEngineBadge");
      const hoCardIconEl = document.getElementById("hoCardIcon");
      const hoCardTitleEl = document.getElementById("hoCardTitle");
      const hoCardSubEl = document.getElementById("hoCardSub");
      const hoCardBadgeEl = document.getElementById("hoCardBadge");
      const hoCoverageLabelEl = document.getElementById("hoCoverageLabel");
      const floodCoverageLimitEl = document.getElementById("floodCoverageLimit");

      if (calcEngineBadgeEl) {
        calcEngineBadgeEl.textContent = res.isCondo
          ? "Dual-Engine: FEMA NFIP + Condo HO-6"
          : "Dual-Engine: FEMA NFIP + Private HO-3";
      }
      if (hoCardIconEl) hoCardIconEl.textContent = res.isCondo ? "🏢" : "🏡";
      if (hoCardTitleEl) {
        hoCardTitleEl.textContent = res.isCondo
          ? "Condo Unit-Owners (HO-6)"
          : "Homeowners / Hazard (HO-3)";
      }
      if (hoCardSubEl) {
        hoCardSubEl.textContent = res.isCondo
          ? "Interior Walls-In • HOA Master Covers Structure"
          : "State Regulated • Private Market";
      }
      if (hoCardBadgeEl) {
        hoCardBadgeEl.textContent = res.isCondo ? "Condo HO-6" : "Private Market";
      }
      if (hoCoverageLabelEl) {
        hoCoverageLabelEl.textContent = res.isCondo ? "Interior Buildout (RCV):" : "Structure Value (RCV):";
      }
      if (floodCoverageLimitEl) {
        floodCoverageLimitEl.textContent = res.isCondo
          ? "$100k Contents • $25k Additions (Unit Owner)"
          : "$250k Bldg • $100k Contents";
      }

      // Flood card DOM
      const userFloodPriceEl = document.getElementById("userFloodPrice");
      const userFloodMonthlyEl = document.getElementById("userFloodMonthly");
      const neighborFloodPriceEl = document.getElementById("neighborFloodPrice");
      const floodDeltaTagEl = document.getElementById("floodDeltaTag");
      const floodZoneTagEl = document.getElementById("floodZoneTag");
      const crsDiscountTagEl = document.getElementById("crsDiscountTag");
      const floodMitTagEl = document.getElementById("floodMitTag");
      const floodClaimImpactTagEl = document.getElementById("floodClaimImpactTag");

      if (userFloodPriceEl) userFloodPriceEl.textContent = `$${res.userFloodPremium.toLocaleString()} / yr`;
      if (userFloodMonthlyEl) userFloodMonthlyEl.textContent = `$${Math.round(res.userFloodPremium / 12).toLocaleString()} / mo`;
      if (neighborFloodPriceEl) neighborFloodPriceEl.textContent = `$${res.neighborFloodPremium.toLocaleString()} / yr`;

      const floodDiff = res.userFloodPremium - res.neighborFloodPremium;
      if (floodDeltaTagEl) {
        if (Math.abs(floodDiff) < 15) {
          floodDeltaTagEl.textContent = "On Par";
          floodDeltaTagEl.className = "calc-bench-sub bench-neutral";
        } else if (floodDiff > 0) {
          floodDeltaTagEl.textContent = `+$${floodDiff.toLocaleString()} / yr`;
          floodDeltaTagEl.className = "calc-bench-sub bench-warn";
        } else {
          floodDeltaTagEl.textContent = `-$${Math.abs(floodDiff).toLocaleString()} / yr`;
          floodDeltaTagEl.className = "calc-bench-sub bench-good";
        }
      }

      if (floodZoneTagEl) floodZoneTagEl.textContent = res.floodZoneLabel;
      if (crsDiscountTagEl) {
        if (res.crsDiscountPct > 0) {
          crsDiscountTagEl.textContent = `-${res.crsDiscountPct}% (Saved ~$${res.crsSavings.toLocaleString()}/yr)`;
          crsDiscountTagEl.style.color = "#16a34a";
        } else {
          crsDiscountTagEl.textContent = "0% (Class 10 Standard Tier)";
          crsDiscountTagEl.style.color = "";
        }
      }
      if (floodMitTagEl) {
        if (inputs.mitFlood) {
          floodMitTagEl.textContent = `Certified Vents (-25%, -$${res.floodMitSavings.toLocaleString()}/yr)`;
          floodMitTagEl.className = "calc-impact-clean";
        } else {
          floodMitTagEl.textContent = "None (Standard Foundation)";
          floodMitTagEl.className = "";
        }
      }
      if (floodClaimImpactTagEl) {
        if (inputs.claimCount === 0) {
          floodClaimImpactTagEl.textContent = "None (Clean Record)";
          floodClaimImpactTagEl.className = "calc-impact-clean";
        } else {
          floodClaimImpactTagEl.textContent = res.floodClaimSurchargeLabel;
          floodClaimImpactTagEl.className = res.floodClaimSurchargeLabel.includes("+") ? "calc-impact-alert" : "calc-impact-clean";
        }
      }

      // Homeowners card DOM
      const userHoPriceEl = document.getElementById("userHoPrice");
      const userHoMonthlyEl = document.getElementById("userHoMonthly");
      const neighborHoPriceEl = document.getElementById("neighborHoPrice");
      const hoDeltaTagEl = document.getElementById("hoDeltaTag");
      const hoCoverageLimitEl = document.getElementById("hoCoverageLimit");
      const hoVintageTagEl = document.getElementById("hoVintageTag");
      const hoRateTagEl = document.getElementById("hoRateTag");
      const hoMitTagEl = document.getElementById("hoMitTag");
      const hoClaimImpactTagEl = document.getElementById("hoClaimImpactTag");

      if (userHoPriceEl) userHoPriceEl.textContent = `$${res.userHoPremium.toLocaleString()} / yr`;
      if (userHoMonthlyEl) userHoMonthlyEl.textContent = `$${Math.round(res.userHoPremium / 12).toLocaleString()} / mo`;
      if (neighborHoPriceEl) neighborHoPriceEl.textContent = `$${res.neighborHoPremium.toLocaleString()} / yr`;

      const hoDiff = res.userHoPremium - res.neighborHoPremium;
      if (hoDeltaTagEl) {
        if (Math.abs(hoDiff) < 15) {
          hoDeltaTagEl.textContent = "On Par";
          hoDeltaTagEl.className = "calc-bench-sub bench-neutral";
        } else if (hoDiff > 0) {
          hoDeltaTagEl.textContent = `+$${hoDiff.toLocaleString()} / yr`;
          hoDeltaTagEl.className = "calc-bench-sub bench-warn";
        } else {
          hoDeltaTagEl.textContent = `-$${Math.abs(hoDiff).toLocaleString()} / yr`;
          hoDeltaTagEl.className = "calc-bench-sub bench-good";
        }
      }

      const calcRcvSubtextEl = document.getElementById("calcRcvSubtext");
      const calcYearBuiltSubtextEl = document.getElementById("calcYearBuiltSubtext");
      const mitigationSavingsHintEl = document.getElementById("mitigationSavingsHint");

      if (calcRcvSubtextEl) {
        if (res.isCondo) {
          calcRcvSubtextEl.innerHTML = `<span class="calc-tier-tag">🏢 Condo HO-6</span> Interior Finishes (RCV): <strong>$${res.userStructuralRcv.toLocaleString()}</strong> (22% Walls-In) &bull; Exterior &amp; Roof: HOA Master Policy`;
        } else if (res.userLandVal > 0) {
          calcRcvSubtextEl.innerHTML = `<span class="calc-tier-tag">${res.marketTier.shortBadge}</span> Rebuild (RCV): <strong>$${res.userStructuralRcv.toLocaleString()}</strong> (${Math.round(res.marketTier.structureRatio * 100)}%) &bull; Land: $${res.userLandVal.toLocaleString()}`;
        } else {
          calcRcvSubtextEl.innerHTML = `<span class="calc-tier-tag">${res.marketTier.shortBadge}</span> Rebuild (RCV): <strong>$${res.userStructuralRcv.toLocaleString()}</strong> (${Math.round(res.marketTier.structureRatio * 100)}%)`;
        }
      }

      if (calcYearBuiltSubtextEl) {
        calcYearBuiltSubtextEl.textContent = res.userVintage.label;
      }

      if (mitigationSavingsHintEl) {
        if (res.totalMitSavings > 0) {
          mitigationSavingsHintEl.innerHTML = `<span style="color: #16a34a; font-weight: 700;">-$${res.totalMitSavings.toLocaleString()}/yr active verified savings applied</span>`;
        } else {
          mitigationSavingsHintEl.textContent = "Click to simulate certified physical loss reduction discounts";
        }
      }

      const hoBenchLabelEl = document.getElementById("hoBenchLabel");
      if (hoBenchLabelEl) {
        hoBenchLabelEl.textContent = data.geographyType === "Census Tract" ? "Tract Median Baseline" : "County Median Baseline";
      }
      const hoBaselineSourceTagEl = document.getElementById("hoBaselineSourceTag");
      if (hoBaselineSourceTagEl) {
        hoBaselineSourceTagEl.textContent = res.hoBaselineShort;
        hoBaselineSourceTagEl.title = res.hoBaselineSource;
      }

      if (hoCoverageLimitEl) hoCoverageLimitEl.textContent = `$${res.userStructuralRcv.toLocaleString()} (${res.rcvPctLabel})`;
      if (hoVintageTagEl) {
        if (res.userVintage.rateDeltaPct > 0) {
          hoVintageTagEl.textContent = `${res.userYear} (+${res.userVintage.rateDeltaPct}% Era Surcharge)`;
          hoVintageTagEl.className = "calc-impact-alert";
        } else if (res.userVintage.rateDeltaPct < 0) {
          hoVintageTagEl.textContent = `${res.userYear} (${res.userVintage.rateDeltaPct}% Code Credit)`;
          hoVintageTagEl.className = "calc-impact-clean";
        } else {
          hoVintageTagEl.textContent = `${res.userYear} (Standard Baseline)`;
          hoVintageTagEl.className = "";
        }
      }
      if (hoRateTagEl) hoRateTagEl.textContent = `$${res.baseHoRate.toFixed(2)} / $1k (${res.hazardTierShort})`;
      if (hoMitTagEl) {
        const activeHo = [];
        if (inputs.mitWind) activeHo.push("Wind (-20%)");
        if (inputs.mitFire) activeHo.push("Defensible Space (-12%)");
        if (activeHo.length > 0) {
          hoMitTagEl.textContent = `${activeHo.join(" • ")} (-$${res.hoMitSavings.toLocaleString()}/yr)`;
          hoMitTagEl.className = "calc-impact-clean";
        } else {
          hoMitTagEl.textContent = "None Applied";
          hoMitTagEl.className = "";
        }
      }
      if (hoClaimImpactTagEl) {
        hoClaimImpactTagEl.textContent = res.hoClaimSurchargeLabel;
        hoClaimImpactTagEl.className = res.hoClaimSurchargeLabel.includes("+") ? "calc-impact-alert" : "calc-impact-clean";
      }

      // Summary Banner DOM
      const combinedUserPriceEl = document.getElementById("combinedUserPrice");
      const combinedUserMonthlyEl = document.getElementById("combinedUserMonthly");
      const combinedNeighborPriceEl = document.getElementById("combinedNeighborPrice");
      const combinedNeighborMonthlyEl = document.getElementById("combinedNeighborMonthly");
      const combinedDeltaValEl = document.getElementById("combinedDeltaVal");
      const combinedDeltaSubEl = document.getElementById("combinedDeltaSub");
      const affordabilityValEl = document.getElementById("affordabilityVal");
      const calcNarrativeEl = document.getElementById("calcNarrative");

      if (combinedUserPriceEl) combinedUserPriceEl.textContent = `$${res.userTotal.toLocaleString()} / yr`;
      if (combinedUserMonthlyEl) combinedUserMonthlyEl.textContent = `~$${Math.round(res.userTotal / 12).toLocaleString()} / month total escrow`;
      if (combinedNeighborPriceEl) combinedNeighborPriceEl.textContent = `$${res.neighborTotal.toLocaleString()} / yr`;
      if (combinedNeighborMonthlyEl) combinedNeighborMonthlyEl.textContent = `~$${Math.round(res.neighborTotal / 12).toLocaleString()} / month`;

      if (combinedDeltaValEl) {
        const sign = res.totalDelta > 0 ? "+" : "";
        combinedDeltaValEl.textContent = `${sign}${res.pctDelta.toFixed(1)}%`;
        combinedDeltaValEl.style.color = res.pctDelta > 5 ? "#dc2626" : (res.pctDelta < -5 ? "#16a34a" : "#2563eb");
      }
      if (combinedDeltaSubEl) {
        const sign = res.totalDelta > 0 ? "+" : "";
        const benchWord = data.geographyType === "Census Tract" ? "Tract Median" : "County Median";
        combinedDeltaSubEl.textContent = `${sign}$${Math.round(res.totalDelta).toLocaleString()} / yr vs ${benchWord}`;
      }

      if (affordabilityValEl && res.affordabilityPct != null) {
        affordabilityValEl.textContent = `${res.affordabilityPct.toFixed(1)}%`;
        affordabilityValEl.style.color = res.affordabilityPct > 5.0 ? "#dc2626" : (res.affordabilityPct > 2.5 ? "#d97706" : "#16a34a");
      }

      if (calcNarrativeEl) {
        calcNarrativeEl.innerHTML = `<strong>Actuarial Risk Assessment:</strong> ${res.narrative}`;
      }
    }

    const propTypeRow = document.getElementById("propertyTypeRow");
    propTypeRow?.querySelectorAll(".calc-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        propTypeRow.querySelectorAll(".calc-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        propertyType = btn.dataset.prop || "single_family";
        update();
      });
    });

    valInput.addEventListener("input", update);
    yearInput?.addEventListener("input", update);
    dedSelect.addEventListener("change", update);

    countRow.querySelectorAll(".calc-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        countRow.querySelectorAll(".calc-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        claimCount = Number(btn.dataset.count) || 0;
        if (claimCount > 0) {
          typeGroup?.classList.remove("hidden");
        } else {
          typeGroup?.classList.add("hidden");
        }
        update();
      });
    });

    typeRow?.querySelectorAll(".calc-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        typeRow.querySelectorAll(".calc-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        claimType = btn.dataset.type || "water";
        update();
      });
    });

    mitWindBtn?.addEventListener("click", () => {
      mitWind = !mitWind;
      mitWindBtn.classList.toggle("active", mitWind);
      update();
    });

    mitFireBtn?.addEventListener("click", () => {
      mitFire = !mitFire;
      mitFireBtn.classList.toggle("active", mitFire);
      update();
    });

    mitFloodBtn?.addEventListener("click", () => {
      mitFlood = !mitFlood;
      mitFloodBtn.classList.toggle("active", mitFlood);
      update();
    });

    update();
  }

  function exportCsv(data) {
    const isGlobal = data.geographyType === "Country";
    const rows = [
      ["Location", data.locationName],
      ["GEOID", data.geoid],
      ["Geography Level", data.geographyType],
      ["Evaluation Year", data.year],
      ["Overall Hazard Rating", data.overallRating],
      ["Overall Risk Score", data.overallScore ?? ""],
      ["Total Expected Annual Loss (USD/yr)", data.totalEal ?? ""],
      ["Indicative Pure Loss Cost Rate ($ per $1k Value)", data.lossCostRate ? data.lossCostRate.toFixed(3) : ""],
      ["Social Vulnerability Score", data.socialVulnScore ?? ""],
      ["Social Vulnerability Rating", data.socialVulnRating ?? ""],
      ["Community Resilience Score", data.resilienceScore ?? ""],
      ["Community Resilience Rating", data.resilienceRating ?? ""],
      ["Median Home Value (USD)", data.medianHomeValue ?? ""],
      ["Housing Stock Median Year Built", data.medianYearBuilt ?? ""],
      ["Total Population", data.totalPopulation ?? ""],
      ["Housing Units", data.housingUnits ?? ""],
      ["Median Household Income (USD)", data.medianIncome ?? ""],
      ["Poverty Rate (%)", data.povertyRate ?? ""],
      ["Households No Vehicle (%)", data.noVehiclePct ?? ""],
      ["FEMA CRS Classification", data.crs ? `Class ${data.crs.class}` : ""],
      ["SFHA Flood Mitigation Discount", data.crs ? data.crs.discount : ""],
      ["Non-SFHA Flood Mitigation Discount", data.crs ? data.crs.nonSfhaDiscount : ""],
      ["CRS Classification Status", data.crs ? data.crs.type : ""],
      [],
      ["Peril Name", "Hazard Tier", "NRI Score (0-100)", "Loss Share (%)", "Indicative Loss Cost ($/1k TIV)", "Expected Annual Loss ($/yr)", "Annual Frequency (events/yr)"],
      ...data.perils.map(p => [
        p.name,
        p.rating || "",
        p.score ?? "",
        p.share != null ? `${p.share.toFixed(1)}%` : "",
        p.lossCostRate != null ? `$${p.lossCostRate.toFixed(2)}` : "",
        p.eal ?? "",
        p.frequency ?? ""
      ])
    ];

    const csvContent = rows
      .map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    downloadFile(csvContent, `underwriting_dossier_${data.geoid}_${data.year}.csv`, "text/csv;charset=utf-8;");
  }

  function exportJson(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    downloadFile(jsonStr, `underwriting_dossier_${data.geoid}_${data.year}.json`, "application/json;charset=utf-8;");
  }

  function copyBrief(data) {
    const codeAdvisory = buildingCodeAdvisory(data.medianYearBuilt);
    const topPerils = data.perils
      .slice(0, 5)
      .map(p => `  • ${p.name}: ${p.rating || "Rated"} | Loss Share: ${p.share ? p.share.toFixed(1) + '%' : '-'} | Rate: ${p.lossCostRate ? '$' + p.lossCostRate.toFixed(2) + '/$1k' : '-'} | EAL: ${formatCurrency(p.eal)}`)
      .join("\n");

    const topLossSummary = data.perils
      .filter(p => Number(p.share) > 0)
      .slice(0, 3)
      .map(p => `${p.name} ${p.share.toFixed(1)}% (${p.lossCostRate ? '$' + p.lossCostRate.toFixed(2) : '$0.00'}/$1k)`)
      .join(", ");

    const text = [
      `=== PROPERTY UNDERWRITING & CATASTROPHE RISK DOSSIER ===`,
      `Location: ${data.locationName} (${data.geographyType} GEOID: ${data.geoid})`,
      `Evaluation Year: ${data.year} | Source: FEMA NRI & US Census ACS`,
      `Overall Hazard Risk: ${data.overallRating} (NRI Score: ${data.overallScore ? Number(data.overallScore).toFixed(1) : "-"} / 100)`,
      data.lossCostRate ? `Indicative Pure Loss Cost Rate: $${data.lossCostRate.toFixed(2)} per $1,000 asset value` : null,
      data.totalEal ? `Total Expected Annual Loss (EAL): ${formatCurrency(data.totalEal)} / year` : null,
      topLossSummary ? `Primary Loss Cost Drivers: ${topLossSummary}` : null,
      data.crs ? `FEMA Flood Mitigation: CRS Class ${data.crs.class} (${data.crs.discount} SFHA Premium Discount • ${data.crs.type})` : null,
      data.medianYearBuilt ? `Housing Stock Vintage: Built ~${Math.round(data.medianYearBuilt)} (${codeAdvisory.era})` : null,
      `Social Vulnerability: ${data.socialVulnRating} (${data.socialVulnScore ? Number(data.socialVulnScore).toFixed(1) : "-"})`,
      `Community Resilience: ${data.resilienceRating} (${data.resilienceScore ? Number(data.resilienceScore).toFixed(1) : "-"})`,
      ``,
      `Top Hazard Perils:`,
      topPerils,
      ``,
      `Community Profile:`,
      `  • Population: ${data.totalPopulation ? Math.round(data.totalPopulation).toLocaleString() : "-"}`,
      `  • Median Property Value: ${data.medianHomeValue ? formatCurrencyFull(data.medianHomeValue) : "-"}`,
      `  • Median Household Income: ${data.medianIncome ? formatCurrencyFull(data.medianIncome) : "-"}`,
      `  • Households with No Vehicle: ${formatPct(data.noVehiclePct)}`,
      `========================================================`
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(text).then(() => {
      const copyBtn = document.getElementById("riskCardCopyBtn");
      if (copyBtn) {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = `✅ Copied to Clipboard!`;
        setTimeout(() => { copyBtn.innerHTML = orig; }, 2200);
      }
    }).catch(err => {
      console.error("Failed to copy clipboard text", err);
    });
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return { open, close };
}

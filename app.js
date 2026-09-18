import * as maplibregl from "https://cdn.jsdelivr.net/npm/maplibre-gl@latest/+esm";
import { Protocol } from "https://cdn.jsdelivr.net/npm/pmtiles@latest/+esm";
import centroid from "https://cdn.jsdelivr.net/npm/@turf/centroid@7.2.0/+esm";
import booleanPointInPolygon from "https://cdn.jsdelivr.net/npm/@turf/boolean-point-in-polygon@7.2.0/+esm";

const pmtilesProtocol = new Protocol();
maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile);
window.mapboxgl = maplibregl;
const { default: MapboxDraw } = await import(
  "https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-draw@1.5.0/+esm"
);
Object.assign(MapboxDraw.constants.classes, {
  CANVAS: "maplibregl-canvas",
  CONTROL_BASE: "maplibregl-ctrl",
  CONTROL_PREFIX: "maplibregl-ctrl-",
  CONTROL_GROUP: "maplibregl-ctrl-group",
  ATTRIBUTION: "maplibregl-ctrl-attrib",
});

const US_TRACTS_PMTILES_URLS = {
  2010: new URL("data/tiles/us-tracts-2010.pmtiles", import.meta.url).href,
  2020: new URL("data/tiles/us-tracts.pmtiles", import.meta.url).href,
};

const GEOGRAPHY_CONFIG = {
  county: {
    label: "County",
    plural: "Counties",
    dataUrl: "data/acs_county_year_fema_flood_risk.parquet",
    geojsonUrl: "data/us_counties_geojson.json",
    featureIdKey: "id",
    geoidLength: 5,
  },
  state: {
    label: "State",
    plural: "States",
    dataUrl: "data/acs_state_year_fema_flood_risk.parquet",
    geojsonUrl: "data/us_states_geojson.json",
    featureIdKey: "properties.GEOID",
    geoidLength: 2,
  },
  tract: {
    label: "Census Tract",
    plural: "Census Tracts",
    dataUrl: (stateFips) => `data/by_state/acs_tract_year_fema_state_${stateFips}.parquet`,
    geojsonUrl: (stateFips) => `data/by_state/us_tracts_2022_state_${stateFips}.geojson`,
    featureIdKey: "properties.GEOID",
    geoidLength: 11,
  },
};

const TRACT_STATES = {
  "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota", "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico", "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio", "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington", "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming", "72": "Puerto Rico",
};

const HYPARQUET_URL = "https://cdn.jsdelivr.net/npm/hyparquet@latest/+esm";
const EVENT_VARIABLE_SUFFIXES = [
  "claim_count",
  "claims_per_1000_residents",
  "total_claim_payments",
  "claim_payments_per_capita",
  "average_payment_per_claim",
  "building_payments",
  "contents_payments",
  "icc_payments",
];
const EVENT_CONFIGS = {
  harvey: { name: "Hurricane Harvey", year: 2017, states: ["Louisiana", "Texas"], boundaryVintage: "2010", kind: "nfip" },
  ida: { name: "Hurricane Ida", year: 2021, states: ["Louisiana"], boundaryVintage: "2020", kind: "nfip" },
  ian: { name: "Hurricane Ian", year: 2022, states: ["Florida"], boundaryVintage: "2020", kind: "nfip" },
  sandy: { name: "Hurricane Sandy", year: 2012, states: ["New Jersey", "New York"], boundaryVintage: "2010", kind: "nfip" },
  florence: { name: "Hurricane Florence", year: 2018, states: ["North Carolina", "South Carolina"], boundaryVintage: "2010", kind: "nfip" },
  michael: { name: "Hurricane Michael", year: 2018, states: ["Florida"], boundaryVintage: "2010", kind: "nfip" },
  louisiana_floods_2016: { name: "2016 Louisiana Floods", year: 2016, states: ["Louisiana"], boundaryVintage: "2010", kind: "nfip" },
  tennessee_flooding_2021: { name: "2021 Tennessee Flooding", year: 2021, states: ["Tennessee"], boundaryVintage: "2020", kind: "nfip" },
  eastern_kentucky_flooding_2022: { name: "2022 Eastern Kentucky Flooding", year: 2022, states: ["Kentucky"], boundaryVintage: "2020", kind: "nfip" },
  camp_fire: {
    name: "Camp Fire",
    year: 2018,
    states: ["California"],
    boundaryVintage: "2010",
    kind: "wildfire",
    dataUrl: "data/events/camp_fire_damage_by_tract.csv",
    prefix: "camp_fire_",
    variables: [
      "camp_fire_structures_destroyed",
      "camp_fire_destroyed_structures_per_1000_residents",
      "camp_fire_structures_damaged_or_destroyed",
      "camp_fire_damaged_or_destroyed_structures_per_1000_residents",
      "camp_fire_residential_structures_destroyed",
      "camp_fire_structures_inspected",
      "camp_fire_destruction_rate_pct",
    ],
    initialVariable: "camp_fire_structures_destroyed",
  },
};
Object.entries(EVENT_CONFIGS).forEach(([id, event]) => {
  event.id = id;
  if (event.kind === "nfip") {
    event.dataUrl = `data/events/${id}_nfip_by_tract.csv`;
    event.prefix = `${id}_nfip_`;
    event.variables = EVENT_VARIABLE_SUFFIXES.map((suffix) => `${event.prefix}${suffix}`);
    event.initialVariable = `${event.prefix}claim_count`;
  }
});

function currentEventConfig() {
  return EVENT_CONFIGS[state.dataMode] || null;
}

function eventConfigFromVariable(variable) {
  const name = String(variable || "");
  return Object.values(EVENT_CONFIGS).find((event) => name.startsWith(event.prefix)) || null;
}

const labels = {
  total_population: "Total Population",
  median_age: "Median Age",
  under_18_population: "Population Under 18",
  under_18_pct: "Population Under 18 (%)",
  age_65_plus_population: "Population Age 65+",
  age_65_plus_pct: "Population Age 65+ (%)",
  employment_rate: "Employment Rate",
  employment_population_ratio: "Employment-to-Population Ratio",
  labor_force_participation_rate: "Labor Force Participation Rate",
  unemployment_rate: "Unemployment Rate",
  median_household_income: "Median Household Income",
  per_capita_income: "Per Capita Income",
  poverty_rate: "Poverty Rate",
  gini_index: "Gini Index",
  less_than_high_school_pct: "Less Than High School (%)",
  median_home_value: "Median Home Value",
  median_gross_rent: "Median Gross Rent",
  median_year_built: "Median Year Built",
  vacancy_rate: "Vacancy Rate",
  owner_occupied_pct: "Homeownership Rate",
  renter_occupied_pct: "Renter Occupancy Rate",
  no_vehicle_pct: "Households Without a Vehicle (%)",
  fema_risk_score: "FEMA Overall Risk Score",
  fema_expected_annual_loss: "FEMA Expected Annual Loss",
  fema_eal_score: "FEMA Expected Annual Loss Score",
  fema_social_vulnerability_score: "FEMA Social Vulnerability",
  fema_resilience_score: "FEMA Community Resilience",
  fema_flood_max_risk_score: "Combined Flood Risk Score",
  fema_flood_expected_annual_loss: "Combined Flood Expected Annual Loss",
  fema_flood_max_eal_score: "Combined Flood EAL Score",
  fema_coastal_flood_risk_score: "Coastal Flood Risk Score",
  fema_coastal_flood_expected_annual_loss: "Coastal Flood Expected Annual Loss",
  fema_coastal_flood_eal_score: "Coastal Flood EAL Score",
  fema_inland_flood_risk_score: "Inland Flood Risk Score",
  fema_inland_flood_expected_annual_loss: "Inland Flood Expected Annual Loss",
  fema_inland_flood_eal_score: "Inland Flood EAL Score",
  fema_wildfire_risk_score: "Wildfire Risk Score",
  fema_wildfire_expected_annual_loss: "Wildfire Expected Annual Loss",
  fema_wildfire_eal_score: "Wildfire EAL Score",
  fema_wildfire_total_exposure: "Wildfire Total Exposure",
  fema_wildfire_annual_frequency: "Wildfire Annual Frequency",
  fema_wildfire_risk_value: "Wildfire Risk Value",
  fema_hurricane_risk_score: "Hurricane Risk Score",
  fema_hurricane_expected_annual_loss: "Hurricane Expected Annual Loss",
  fema_hurricane_eal_score: "Hurricane EAL Score",
  fema_hurricane_annual_frequency: "Hurricane Annual Frequency",
  fema_earthquake_risk_score: "Earthquake Risk Score",
  fema_earthquake_expected_annual_loss: "Earthquake Expected Annual Loss",
  fema_earthquake_eal_score: "Earthquake EAL Score",
  fema_earthquake_annual_frequency: "Earthquake Annual Frequency",
  fema_tornado_risk_score: "Tornado Risk Score",
  fema_tornado_expected_annual_loss: "Tornado Expected Annual Loss",
  fema_tornado_eal_score: "Tornado EAL Score",
  fema_tornado_annual_frequency: "Tornado Annual Frequency",
  fema_hail_risk_score: "Hail Risk Score",
  fema_hail_expected_annual_loss: "Hail Expected Annual Loss",
  fema_hail_eal_score: "Hail EAL Score",
  fema_hail_annual_frequency: "Hail Annual Frequency",
  fema_strong_wind_risk_score: "Strong Wind Risk Score",
  fema_strong_wind_expected_annual_loss: "Strong Wind Expected Annual Loss",
  fema_strong_wind_eal_score: "Strong Wind EAL Score",
  fema_strong_wind_annual_frequency: "Strong Wind Annual Frequency",
  fema_drought_risk_score: "Drought Risk Score",
  fema_drought_expected_annual_loss: "Drought Expected Annual Loss",
  fema_drought_eal_score: "Drought EAL Score",
  fema_drought_annual_frequency: "Drought Annual Frequency",
  fema_heat_wave_risk_score: "Heat Wave Risk Score",
  fema_heat_wave_expected_annual_loss: "Heat Wave Expected Annual Loss",
  fema_heat_wave_eal_score: "Heat Wave EAL Score",
  fema_heat_wave_annual_frequency: "Heat Wave Annual Frequency",
};

Object.entries(EVENT_CONFIGS).forEach(([id, event]) => {
  if (event.kind !== "nfip") return;
  const prefix = event.prefix;
  labels[`${prefix}claim_count`] = `${event.name} NFIP Claim Count`;
  labels[`${prefix}claims_per_1000_residents`] = `${event.name} NFIP Claims per 1,000 Residents`;
  labels[`${prefix}total_claim_payments`] = `${event.name} Total Claim Payments`;
  labels[`${prefix}claim_payments_per_capita`] = `${event.name} NFIP Claim Payments per Capita`;
  labels[`${prefix}average_payment_per_claim`] = `${event.name} Average Payment per Claim`;
  labels[`${prefix}building_payments`] = `${event.name} Building Payments`;
  labels[`${prefix}contents_payments`] = `${event.name} Contents Payments`;
  labels[`${prefix}icc_payments`] = `${event.name} Compliance Payments`;
});

Object.assign(labels, {
  camp_fire_structures_destroyed: "Camp Fire Structures Destroyed",
  camp_fire_destroyed_structures_per_1000_residents: "Camp Fire Destroyed Structures per 1,000 Residents",
  camp_fire_structures_damaged_or_destroyed: "Camp Fire Structures Damaged or Destroyed",
  camp_fire_damaged_or_destroyed_structures_per_1000_residents: "Camp Fire Damaged or Destroyed Structures per 1,000 Residents",
  camp_fire_residential_structures_destroyed: "Camp Fire Residential Structures Destroyed",
  camp_fire_structures_inspected: "Camp Fire Structures Inspected",
  camp_fire_destruction_rate_pct: "Camp Fire Destruction Rate (%)",
});

const ID_COLUMNS = new Set([
  "NAME",
  "county_name",
  "state_name",
  "state",
  "county",
  "year",
  "GEOID",
]);

const REGION_PRESETS = {
  "Northeast": [
    "Connecticut",
    "Maine",
    "Massachusetts",
    "New Hampshire",
    "Rhode Island",
    "Vermont",
    "New Jersey",
    "New York",
    "Pennsylvania",
  ],

  "Midwest": [
    "Illinois",
    "Indiana",
    "Michigan",
    "Ohio",
    "Wisconsin",
    "Iowa",
    "Kansas",
    "Minnesota",
    "Missouri",
    "Nebraska",
    "North Dakota",
    "South Dakota",
  ],

  "South": [
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Maryland",
    "North Carolina",
    "South Carolina",
    "Virginia",
    "West Virginia",
    "Alabama",
    "Kentucky",
    "Mississippi",
    "Tennessee",
    "Arkansas",
    "Louisiana",
    "Oklahoma",
    "Texas",
  ],

  "West": [
    "Arizona",
    "Colorado",
    "Idaho",
    "Montana",
    "Nevada",
    "New Mexico",
    "Utah",
    "Wyoming",
    "Alaska",
    "California",
    "Hawaii",
    "Oregon",
    "Washington",
  ],

  "Pacific": [
    "Alaska",
    "California",
    "Hawaii",
    "Oregon",
    "Washington",
  ],

  "Mountain": [
    "Arizona",
    "Colorado",
    "Idaho",
    "Montana",
    "Nevada",
    "New Mexico",
    "Utah",
    "Wyoming",
  ],

  "East Coast": [
    "Maine",
    "New Hampshire",
    "Massachusetts",
    "Rhode Island",
    "Connecticut",
    "New York",
    "New Jersey",
    "Delaware",
    "Maryland",
    "District of Columbia",
    "Virginia",
    "North Carolina",
    "South Carolina",
    "Georgia",
    "Florida",
  ],

  "Gulf Coast": [
    "Texas",
    "Louisiana",
    "Mississippi",
    "Alabama",
    "Florida",
  ],

  "Ohio River Valley": [
    "Pennsylvania",
    "Ohio",
    "West Virginia",
    "Kentucky",
    "Indiana",
    "Illinois",
  ],

  "Tennessee River Valley": [
    "Tennessee",
    "Alabama",
    "Mississippi",
    "Kentucky",
    "Georgia",
    "North Carolina",
    "Virginia",
  ],
};


const els = Object.fromEntries(
  [
    "dataModeSelect",
    "geographySelect",
    "variableSelect",
    "stateSelect",
    "statePicker",
    "statePickerButton",
    "statePickerText",
    "stateMenu",
    "stateOptions",
    "stateChips",
    "clearStatesButton",
    "colorScaleSelect",
    "scaleModeSelect",
    "filters",
    "resetButton",
    "status",
    "dashboardTitle",
    "dashboardMeta",
    "mapSection",
    "trendSection",
    "statsSection",
    "dashboardTabs",
    "mapChart",
    "trendChart",
    "summaryCards",
    "topTable",
    "bottomTable",
    "topTableTitle",
    "bottomTableTitle",
    "statsSubtitle",
    "themeToggle",
    "themeToggleText",
    "variableMetadata",
    "metadataTitle",
    "metadataDefinition",
    "metadataUnit",
    "metadataInterpretation",
    "metadataSource",
    "yearSlider",
    "yearDisplay",
    "yearStartLabel",
    "yearEndLabel",
    "yearPlayButton",
    "yearAnimationHelp",
    "countyPicker",
    "countyPickerButton",
    "countyPickerText",
    "countyMenu",
    "countySearch",
    "countyOptions",
    "countySelect",
    "tractStateSelect",
    "mapChart",
    "tractMap",
    "drawSelectionNotice",
    "trendChart",
  ].map((id) => [id, document.getElementById(id)]),
);

let tractMap = null;
let mapDraw = null;
let tractLegend = null;
let tractHoverPopup = null;
let tractCountyBoundaries = null;
let countyLookup = null;
let adminMapRows = new Map();
let pendingAdminData = null;
let lastAdminFitKey = null;
let lastTractStateFitKey = null;
let activeTractBoundaryVintage = null;
const tractRowsByState = new Map();
const tractMetadataByState = new Map();
const tractVariableRowsCache = new Map();
const tractLoadPromises = new Map();
const nationwideTractLoadPromises = new Map();
let activeNationwideTractVariable = null;
const TRACT_DOWNLOAD_CONCURRENCY = 6;
let drawnAreaActive = false;
let drawnGeoids = new Set();
let rows = [];
let geojson = null;
let variables = [];
let state = {
  dataMode: "annual",
  geography: "county",
  variable: null,
  year: null,
  selectedStates: [],
  countyKey: "All counties",
  tractStateFips: "06",
  colorScale: "Viridis",
  scaleMode: "robust",
  activeTab: "map",
};
let availableYears = [];
let yearAnimationTimer = null;

const YEAR_ANIMATION_INTERVAL = 900;
const DEFAULT_MAP_CENTER = [-90, 39.8];
const MAP_FIT_PADDING = { top: 45, bottom: 45, left: 45, right: 135 };

const titleCase = (value) =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const variableLabel = (variable) => labels[variable] || titleCase(variable);

function geographyConfig() {
  return GEOGRAPHY_CONFIG[state.geography];
}

function geographyLabel() {
  return geographyConfig().label;
}

function geographyPlural() {
  return geographyConfig().plural;
}

function isMobile() {
  if (typeof window.matchMedia === "function") {
    const narrowPortrait = window.matchMedia("(max-width: 800px)").matches;
    const shortLandscape = window.matchMedia(
      "(max-width: 1000px) and (max-height: 500px)",
    ).matches;

    return narrowPortrait || shortLandscape;
  }

  const widths = [
    window.innerWidth,
    document.documentElement.clientWidth,
    window.visualViewport?.width,
    window.screen?.width,
  ].filter((value) => Number.isFinite(value) && value > 0);

  return Math.min(...widths) <= 800;
}
function defaultMetadata(variable) {
  const label = variableLabel(variable);

  const meta = {
    definition: label,
    unit: "Value",
    interpretation: "Higher values indicate a larger measured value.",
    source: variable.startsWith("fema_")
      ? "FEMA National Risk Index"
      : "U.S. Census Bureau American Community Survey",
  };

  if (variable === "median_year_built") {
    meta.definition = "Median year in which occupied housing units were built.";
    meta.unit = "Year";
    meta.interpretation =
      "Higher values indicate a newer housing stock.";
  } else if (/_risk_score$/.test(variable) || variable === "fema_risk_score") {
    meta.definition = `${label} calculated as part of FEMA's National Risk Index.`;
    meta.unit = "Risk score";
    meta.interpretation =
      "Higher scores indicate greater modeled hazard risk.";
  } else if (/_expected_annual_loss$/.test(variable)) {
    const hazard = label.replace(" Expected Annual Loss", "");

    meta.definition =
      `Estimated average economic loss from ${hazard.toLowerCase()} expected each year.`;
    meta.unit = "USD/year";
    meta.interpretation =
      "Higher values indicate greater expected annual economic loss.";
  } else if (/_population_exposure$/.test(variable)) {
    const hazard = label.replace(" Population Exposure", "");

    meta.definition =
      `Estimated number of people exposed to ${hazard.toLowerCase()}.`;
    meta.unit = "People";
    meta.interpretation =
      "Higher values indicate that more people are exposed.";
  } else if (/_total_exposure$/.test(variable)) {
    const hazard = label.replace(" Total Exposure", "");

    meta.definition =
      `Estimated total assets or property exposed to ${hazard.toLowerCase()}.`;
    meta.unit = "Exposure value";
    meta.interpretation =
      "Higher values indicate more exposed assets or property.";
  } else if (/_annual_frequency$/.test(variable)) {
  const hazard = label.replace(" Annual Frequency", "");

  meta.definition =
    `Estimated annual frequency of ${hazard.toLowerCase()} hazard conditions.`;

  if (/heat_wave|drought/.test(variable)) {
    meta.unit = "Days/year";
    meta.interpretation =
      "Higher values indicate more days each year with this hazard.";
  } else if (/earthquake/.test(variable)) {
      meta.unit = "Probability/year";
      meta.interpretation =
        "Higher values indicate a greater annual probability of a damaging earthquake event.";
    } else {
      meta.unit = "Events/year";
      meta.interpretation =
        "Higher values indicate more hazard events each year.";
    }
  } else if (/_exposed_area$/.test(variable)) {
    const hazard = label.replace(" Exposed Area", "");

    meta.definition =
      `Estimated land area exposed to ${hazard.toLowerCase()}.`;
    meta.unit = "Area";
    meta.interpretation =
      `This measure is strongly influenced by ${geographyLabel().toLowerCase()} size and should be used cautiously when comparing ${geographyPlural().toLowerCase()}.`;
  } else if (/_risk_value$/.test(variable)) {
    meta.definition = `${label} estimated by FEMA.`;
    meta.unit = "Risk value";
    meta.interpretation =
      "Higher values indicate a larger modeled risk value.";
  } else if (/income|rent|home_value/.test(variable)) {
    meta.definition = label;
    meta.unit = "USD";
    meta.interpretation =
      "Higher values indicate a larger dollar amount.";
  } else if (/population/.test(variable)) {
    meta.definition = label;
    meta.unit = "People";
    meta.interpretation =
      "Higher values indicate more people.";
  } else if (/pct|rate/.test(variable)) {
    meta.definition = label;
    meta.unit = "%";
    meta.interpretation =
      "Higher values indicate a larger percentage.";
  } else if (/score|index/.test(variable)) {
    meta.definition = label;
    meta.unit = "Score";
    meta.interpretation =
      "Higher values indicate a higher score.";
  }

  return meta;
}

const variableMetadataOverrides = {
  harvey_nfip_claim_count: {
    definition:
      "Number of National Flood Insurance Program claims associated with Hurricane Harvey and assigned to this census tract.",
    unit: "Claims",
    interpretation:
      "Higher values indicate more NFIP-insured properties filed flood claims. This does not include uninsured damage.",
    source: "FEMA OpenFEMA NFIP Redacted Claims v3",
  },
  harvey_nfip_claims_per_1000_residents: {
    definition:
      "Number of Hurricane Harvey NFIP claims per 1,000 residents, using the 2017 ACS 5-year census tract population as the denominator.",
    unit: "Claims per 1,000 residents",
    interpretation:
      "Higher values indicate more NFIP claims relative to the tract population. This is a population-normalized claim measure, not the percentage of residents or properties that filed a claim.",
    source:
      "FEMA OpenFEMA NFIP Redacted Claims v3 and U.S. Census Bureau 2017 ACS 5-year estimates",
  },
  harvey_nfip_total_claim_payments: {
    definition:
      "Total NFIP building, contents, and Increased Cost of Compliance payments associated with Hurricane Harvey in this census tract.",
    unit: "USD",
    interpretation:
      "Higher values indicate larger paid insured flood losses. This is not a comprehensive estimate of all Hurricane Harvey damage.",
    source: "FEMA OpenFEMA NFIP Redacted Claims v3",
  },
  harvey_nfip_claim_payments_per_capita: {
    definition:
      "Total Hurricane Harvey NFIP claim payments divided by the 2017 ACS 5-year census tract population.",
    unit: "USD per resident",
    interpretation:
      "Higher values indicate larger NFIP payments relative to the tract population. This is not a comprehensive measure of all Hurricane Harvey losses.",
    source:
      "FEMA OpenFEMA NFIP Redacted Claims v3 and U.S. Census Bureau 2017 ACS 5-year estimates",
  },
  harvey_nfip_average_payment_per_claim: {
    definition:
      "Average total NFIP payment per Hurricane Harvey claim in this census tract.",
    unit: "USD per claim",
    interpretation:
      "Higher values indicate a larger average paid amount among NFIP claims in the tract.",
    source: "FEMA OpenFEMA NFIP Redacted Claims v3",
  },
  harvey_nfip_building_payments: {
    definition: "Total NFIP payments for insured building damage associated with Hurricane Harvey.",
    unit: "USD",
    interpretation: "Higher values indicate larger paid building-loss claims.",
    source: "FEMA OpenFEMA NFIP Redacted Claims v3",
  },
  harvey_nfip_contents_payments: {
    definition: "Total NFIP payments for insured contents damage associated with Hurricane Harvey.",
    unit: "USD",
    interpretation: "Higher values indicate larger paid contents-loss claims.",
    source: "FEMA OpenFEMA NFIP Redacted Claims v3",
  },
  harvey_nfip_icc_payments: {
    definition:
      "Total NFIP Increased Cost of Compliance payments associated with Hurricane Harvey.",
    unit: "USD",
    interpretation:
      "Higher values indicate more payments for qualifying flood-risk reduction and code-compliance work.",
    source: "FEMA OpenFEMA NFIP Redacted Claims v3",
  },
  fema_risk_score: {
    definition:
      "Composite FEMA National Risk Index score summarizing expected annual loss, social vulnerability, and community resilience.",
    unit: "Risk score",
    interpretation:
      "Higher values indicate greater overall natural hazard risk.",
  },

  fema_expected_annual_loss: {
    definition:
      "Estimated average economic loss from all modeled natural hazards expected each year.",
    unit: "USD/year",
    interpretation:
      "Higher values indicate greater expected annual economic loss.",
  },

  fema_social_vulnerability_score: {
    definition:
      "FEMA score representing characteristics that may make a community more vulnerable to hazard impacts.",
    unit: "Score",
    interpretation:
      "Higher values indicate greater social vulnerability.",
  },

  fema_resilience_score: {
    definition:
      "FEMA score representing a community's ability to prepare for, adapt to, and recover from hazards.",
    unit: "Score",
    interpretation:
      "Higher values indicate greater community resilience.",
  },

  fema_earthquake_annual_frequency: {
    definition:
      "Estimated annual frequency of damaging earthquake ground-shaking conditions.",
    unit: "Per year",
    interpretation:
      "A value of 0.03 represents approximately 0.03 modeled occurrences per year, or about one occurrence every 33 years on average.",
    source: "USGS / FEMA National Risk Index",
  },

  fema_hail_exposed_area: {
    interpretation:
      "This measure is strongly affected by county size and may not be useful for direct comparisons between counties.",
  },
};

Object.entries(EVENT_CONFIGS).forEach(([id, event]) => {
  if (id === "harvey" || event.kind !== "nfip") return;
  const prefix = event.prefix;
  const geographyNote =
    "FEMA block-group GEOIDs were aligned to 2020 census tracts using the dominant land-area overlap in the official Census Bureau 2010–2020 relationship file.";
  const femaSource = "FEMA OpenFEMA NFIP Redacted Claims v3";
  const combinedSource = `${femaSource}, U.S. Census Bureau ${event.year} ACS 5-year estimates, and Census Bureau 2010–2020 geographic relationship files`;
  variableMetadataOverrides[`${prefix}claim_count`] = {
    definition: `Number of National Flood Insurance Program claims associated with ${event.name} and assigned to this census tract. ${geographyNote}`,
    unit: "Claims",
    interpretation: "Higher values indicate more NFIP-insured properties filed flood claims. This does not include uninsured damage.",
    source: femaSource,
  };
  variableMetadataOverrides[`${prefix}claims_per_1000_residents`] = {
    definition: `Number of ${event.name} NFIP claims per 1,000 residents, using the ${event.year} ACS 5-year census tract population as the denominator. ${geographyNote}`,
    unit: "Claims per 1,000 residents",
    interpretation: "Higher values indicate more NFIP claims relative to the tract population. This is not the percentage of residents or properties that filed a claim.",
    source: combinedSource,
  };
  variableMetadataOverrides[`${prefix}total_claim_payments`] = {
    definition: `Total NFIP building, contents, and Increased Cost of Compliance payments associated with ${event.name} in this census tract. ${geographyNote}`,
    unit: "USD",
    interpretation: `Higher values indicate larger paid insured flood losses. This is not a comprehensive estimate of all ${event.name} damage.`,
    source: femaSource,
  };
  variableMetadataOverrides[`${prefix}claim_payments_per_capita`] = {
    definition: `Total ${event.name} NFIP claim payments divided by the ${event.year} ACS 5-year census tract population. ${geographyNote}`,
    unit: "USD per resident",
    interpretation: `Higher values indicate larger NFIP payments relative to the tract population. This is not a comprehensive measure of all ${event.name} losses.`,
    source: combinedSource,
  };
  variableMetadataOverrides[`${prefix}average_payment_per_claim`] = {
    definition: `Average total NFIP payment per ${event.name} claim in this census tract.`,
    unit: "USD per claim",
    interpretation: "Higher values indicate a larger average paid amount among NFIP claims in the tract.",
    source: femaSource,
  };
  variableMetadataOverrides[`${prefix}building_payments`] = {
    definition: `Total NFIP payments for insured building damage associated with ${event.name}.`,
    unit: "USD",
    interpretation: "Higher values indicate larger paid building-loss claims.",
    source: femaSource,
  };
  variableMetadataOverrides[`${prefix}contents_payments`] = {
    definition: `Total NFIP payments for insured contents damage associated with ${event.name}.`,
    unit: "USD",
    interpretation: "Higher values indicate larger paid contents-loss claims.",
    source: femaSource,
  };
  variableMetadataOverrides[`${prefix}icc_payments`] = {
    definition: `Total NFIP Increased Cost of Compliance payments associated with ${event.name}.`,
    unit: "USD",
    interpretation: "Higher values indicate more payments for qualifying flood-risk reduction and code-compliance work.",
    source: femaSource,
  };
});

const campFireSource = "CAL FIRE Damage Inspection (DINS) Data";
const campFireCombinedSource = `${campFireSource} and U.S. Census Bureau 2018 ACS 5-year estimates`;
Object.assign(variableMetadataOverrides, {
  camp_fire_structures_destroyed: {
    definition: "Number of structures classified by CAL FIRE inspectors as destroyed (>50% damage) during the 2018 Camp Fire.",
    unit: "Structures",
    interpretation: "Higher values indicate more destroyed structures. The database reflects structures documented through the damage-inspection process.",
    source: campFireSource,
  },
  camp_fire_destroyed_structures_per_1000_residents: {
    definition: "Camp Fire structures classified as destroyed per 1,000 residents, using the 2018 ACS 5-year tract population.",
    unit: "Destroyed structures per 1,000 residents",
    interpretation: "Higher values indicate more destroyed structures relative to the tract population. This is not the percentage of residents who lost a home.",
    source: campFireCombinedSource,
  },
  camp_fire_structures_damaged_or_destroyed: {
    definition: "Number of Camp Fire structures classified as affected, minor damage, major damage, or destroyed by CAL FIRE inspectors.",
    unit: "Structures",
    interpretation: "Higher values indicate a larger number of documented structures with fire damage.",
    source: campFireSource,
  },
  camp_fire_damaged_or_destroyed_structures_per_1000_residents: {
    definition: "Camp Fire structures with any documented damage per 1,000 residents, using the 2018 ACS 5-year tract population.",
    unit: "Damaged structures per 1,000 residents",
    interpretation: "Higher values indicate more damaged or destroyed structures relative to the tract population.",
    source: campFireCombinedSource,
  },
  camp_fire_residential_structures_destroyed: {
    definition: "Number of destroyed structures identified as residential in the CAL FIRE damage-inspection data.",
    unit: "Structures",
    interpretation: "Higher values indicate more destroyed residential structures; this is a structure count rather than a household or resident count.",
    source: campFireSource,
  },
  camp_fire_structures_inspected: {
    definition: "Number of structures documented by the CAL FIRE Camp Fire damage-inspection process, including structures with no recorded damage.",
    unit: "Structures",
    interpretation: "Higher values indicate more inspected structures and may partly reflect settlement density and inspection coverage.",
    source: campFireSource,
  },
  camp_fire_destruction_rate_pct: {
    definition: "Percentage of inspected Camp Fire structures classified as destroyed (>50% damage).",
    unit: "% of inspected structures",
    interpretation: "Higher values indicate that a larger share of inspected structures in the tract was destroyed.",
    source: campFireSource,
  },
});

const VARIABLE_GROUP_ORDER = [
  "Specific Event — Hurricane Harvey",
  "Specific Event — Hurricane Ida",
  "Specific Event — Hurricane Ian",
  "Specific Event — Camp Fire",
  "Specific Event — Hurricane Sandy",
  "Specific Event — Hurricane Florence",
  "Specific Event — Hurricane Michael",
  "Specific Event — 2016 Louisiana Floods",
  "Specific Event — 2021 Tennessee Flooding",
  "Specific Event — 2022 Eastern Kentucky Flooding",
  "Census — Demographics",
  "Census — Employment",
  "Census — Income & Poverty",
  "Census — Education",
  "Census — Housing & Transportation",

  "FEMA — Overall Risk",
  "FEMA — Flood",
  "FEMA — Wildfire",
  "FEMA — Hurricanes",
  "FEMA — Earthquakes",
  "FEMA — Tornadoes",
  "FEMA — Strong Wind",
  "FEMA — Hail",
  "FEMA — Heat Wave",
  "FEMA — Drought",

  "FEMA — Other Hazards",
  "Other",
];

function variableGroup(variable) {
  const name = String(variable).toLowerCase();

  const event = eventConfigFromVariable(name);
  if (event) return `Specific Event — ${event.name}`;

  if (!name.startsWith("fema_")) {
    if (/population|median_age|under_18|age_65|race|ethnicity|sex|gender/.test(name)) {
      return "Census — Demographics";
    }

    if (/employment|labor_force|unemployment|employed/.test(name)) {
      return "Census — Employment";
    }

    if (/income|poverty|gini|earnings|wage|salary/.test(name)) {
      return "Census — Income & Poverty";
    }

    if (/school|education|bachelor|graduate|degree/.test(name)) {
      return "Census — Education";
    }

    if (/home|housing|rent|vacancy|owner|renter|vehicle|units|year_built/.test(name)) {
      return "Census — Housing & Transportation";
    }

    return "Other";
  }

  // Check hazard-specific groups first.
  if (/wildfire/.test(name)) {
    return "FEMA — Wildfire";
  }

  if (/flood|coastal|inland/.test(name)) {
    return "FEMA — Flood";
  }

  if (/hurricane/.test(name)) {
    return "FEMA — Hurricanes";
  }

  if (/earthquake/.test(name)) {
    return "FEMA — Earthquakes";
  }

  if (/tornado/.test(name)) {
    return "FEMA — Tornadoes";
  }

  if (/strong_wind/.test(name)) {
    return "FEMA — Strong Wind";
  }

  if (/hail/.test(name)) {
    return "FEMA — Hail";
  }

  if (/heat_wave/.test(name)) {
    return "FEMA — Heat Wave";
  }

  if (/drought/.test(name)) {
    return "FEMA — Drought";
  }

  if (
    [
      "fema_risk_score",
      "fema_expected_annual_loss",
      "fema_social_vulnerability_score",
      "fema_resilience_score",
    ].includes(name)
  ) {
    return "FEMA — Overall Risk";
  }

  return "FEMA — Other Hazards";
}



function setGroupedVariableOptions(element, values, selected) {
  const groups = new Map(VARIABLE_GROUP_ORDER.map((group) => [group, []]));

  values.forEach((variable) => {
    const group = variableGroup(variable);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(variable);
  });

  element.innerHTML = VARIABLE_GROUP_ORDER
    .filter((group) => groups.get(group)?.length)
    .map((group) => {
      const options = groups
        .get(group)
        .sort((a, b) => variableLabel(a).localeCompare(variableLabel(b)))
        .map((variable) => {
          const safeValue = String(variable).replaceAll('"', "&quot;");
          const isSelected = variable === selected ? "selected" : "";
          return `<option value="${safeValue}" ${isSelected}>${variableLabel(variable)}</option>`;
        })
        .join("");

      return `<optgroup label="${group}">${options}</optgroup>`;
    })
    .join("");
}

function toPlainValue(value) {
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
}

function toNumber(value) {
  const plain = toPlainValue(value);
  if (plain === null || plain === undefined || plain === "") {
    return NaN;
  }
  return Number(plain);
}

function validNumber(value) {
  const number = toNumber(value);
  return Number.isFinite(number) && number > -1_000_000;
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const remainder = position - base;
  return sorted[base + 1] === undefined
    ? sorted[base]
    : sorted[base] + remainder * (sorted[base + 1] - sorted[base]);
}

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const median = (values) => quantile([...values].sort((a, b) => a - b), 0.5);
const stddev = (values) => {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
      (values.length - 1),
  );
};

function valueKind(variable) {
  if (variable === "median_year_built") return "year";
  if (/rate|pct|percent/.test(variable)) return "percent";
  if (/income|rent|home_value|expected_annual_loss|wage|salary|earnings|payments|payment_per_claim/.test(variable)) {
    return "dollar";
  }
  if (/population|units|households|labor_force|employed|unemployed|exposure|claim_count|structures|assessment_locations$|assessments_110_plus_mph$/.test(variable)) {
    return "count";
  }
  if (/score|index|frequency|percentile|loss_rate/.test(variable)) return "score";
  return "number";
}

function formatValue(value, variable) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return "—";

  const kind = valueKind(variable);
  if (kind === "year") return String(Math.round(number));
  if (kind === "percent") {
    return `${number.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  }
  if (kind === "dollar") {
    return number.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  if (kind === "count") {
    return number.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  if (kind === "score") {
    return number.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function tractNoDataLabel() {
  const event = currentEventConfig();
  if (event) return event.noDataLabel || (event.kind === "nfip" ? "No NFIP claim data" : "No structure damage data");
  return "No data loaded";
}

function normalizeRow(row) {
  const name = String(row.NAME ?? "");
  const nameParts = name.split(",").map((part) => part.trim());
  const config = geographyConfig();
  const normalizedGeoid = String(toPlainValue(row.GEOID) ?? "").padStart(
    config.geoidLength,
    "0",
  );

  if (state.geography === "state") {
    return {
      ...row,
      year: toNumber(row.year),
      GEOID: normalizedGeoid,
      state_name: row.state_name || row.NAME || "Unknown state",
      county_name: null,
    };
  }

  if (state.geography === "tract") {
    return {
      ...row,
      year: toNumber(row.year),
      GEOID: normalizedGeoid,
      tract_name: row.tract_name || row.NAME || "Unknown tract",
      county_name: row.fema_county || row.county_name || "Unknown county",
      state_name: row.fema_state || row.state_name || "Unknown state",
    };
  }

  return {
    ...row,
    year: toNumber(row.year),
    GEOID: normalizedGeoid,
    county_name: row.county_name || nameParts[0] || "Unknown county",
    state_name: row.state_name || nameParts.at(-1) || "Unknown state",
  };
}

function countySelectionKey(row) {
  return state.geography === "tract"
    ? `${String(row.state).padStart(2, "0")}${String(row.county).padStart(3, "0")}`
    : row.GEOID;
}

function setOptions(element, values, selected, formatter = variableLabel) {
  element.innerHTML = values
    .map((value) => {
      const safeValue = String(value).replaceAll('"', "&quot;");
      const isSelected = String(value) === String(selected) ? "selected" : "";
      return `<option value="${safeValue}" ${isSelected}>${formatter(value)}</option>`;
    })
    .join("");
}

function selectedStateNames() {
  return state.selectedStates.length ? state.selectedStates : null;
}

function rowMatchesStates(row) {
  const states = selectedStateNames();
  return !states || states.includes(row.state_name);
}

function rowMatchesDrawnArea(row) {
  return !drawnAreaActive || drawnGeoids.has(String(row.GEOID).padStart(
    geographyConfig().geoidLength,
    "0",
  ));
}

function filtered({ includeYear = true, includeCounty = true } = {}) {
  const sourceRows = state.geography === "tract"
    ? [...tractRowsByState.values()].flat()
    : rows;

  return sourceRows
    .filter(
      (row) =>
        (!includeYear || Number(row.year) === Number(state.year)) &&
        rowMatchesStates(row) &&
        rowMatchesDrawnArea(row) &&
        (state.geography === "state" ||
          !includeCounty ||
          state.countyKey === "All counties" ||
          countySelectionKey(row) === state.countyKey) &&
        validNumber(row[state.variable]),
    )
    .map((row) => ({ ...row, value: toNumber(row[state.variable]) }));
}

function getSelectedValues(select) {
  return [...select.selectedOptions].map((option) => option.value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderStatePicker() {
  const selected = new Set(state.selectedStates);

  [...els.stateSelect.options].forEach((option) => {
    option.selected = selected.has(option.value);
  });

  els.stateOptions.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = selected.has(checkbox.value);
  });

  els.statePickerText.textContent = selected.size
    ? `${selected.size} state${selected.size === 1 ? "" : "s"} selected`
    : "All states";

  els.stateChips.innerHTML = state.selectedStates
    .map(
      (stateName) =>
        `<button type="button" class="state-chip" data-state="${escapeHtml(stateName)}" title="Remove ${escapeHtml(stateName)}">` +
        `<span>${escapeHtml(stateName)}</span><span aria-hidden="true">×</span></button>`,
    )
    .join("");
}

function isFemaVariable(variable = state.variable) {
  return String(variable || "").startsWith("fema_") || Boolean(eventConfigFromVariable(variable));
}

function yearsForVariable(variable) {
  const years = [
    ...new Set(
      rows
        .filter((row) => validNumber(row[variable]))
        .map((row) => Number(row.year))
        .filter(Number.isFinite),
    ),
  ].sort((a, b) => a - b);

  if (isFemaVariable(variable) && years.length) {
    return [years.at(-1)];
  }

  return years;
}

function currentYearIndex() {
  return Math.max(0, availableYears.indexOf(Number(state.year)));
}

function syncYearAnimationControls({
  preserveYear = true,
} = {}) {
  stopYearAnimation();

  availableYears = yearsForVariable(state.variable);

  if (!availableYears.length) {
    state.year = null;

    els.yearSlider.min = "0";
    els.yearSlider.max = "0";
    els.yearSlider.value = "0";
    els.yearSlider.disabled = true;

    els.yearPlayButton.disabled = true;
    els.yearDisplay.textContent = "No years";
    els.yearStartLabel.textContent = "—";
    els.yearEndLabel.textContent = "—";
    els.yearAnimationHelp.textContent =
      "No year data is available for this variable.";

    return;
  }

  const previousYear = Number(state.year);

  if (
    preserveYear &&
    availableYears.includes(previousYear)
  ) {
    state.year = previousYear;
  } else {
    state.year = availableYears.at(-1);
  }

  const index = currentYearIndex();
  const hasMultipleYears = availableYears.length > 1;
  const femaVariable = isFemaVariable();

  const animationEnabled =
    hasMultipleYears && !femaVariable;

  els.yearSlider.min = "0";
  els.yearSlider.max = String(
    Math.max(availableYears.length - 1, 0),
  );
  els.yearSlider.value = String(index);
  els.yearSlider.disabled = !animationEnabled;

  els.yearPlayButton.disabled = !animationEnabled;
  els.yearPlayButton.textContent = "▶ Play";
  els.yearPlayButton.setAttribute(
    "aria-label",
    "Play year animation",
  );

  els.yearDisplay.textContent = String(state.year);
  els.yearStartLabel.textContent = String(availableYears[0]);
  els.yearEndLabel.textContent = String(
    availableYears.at(-1),
  );

  if (femaVariable) {
    els.yearAnimationHelp.textContent =
      `Year animation is unavailable for FEMA variables. Showing ${state.year}.`;
  } else if (!hasMultipleYears) {
    els.yearAnimationHelp.textContent =
      `Only ${state.year} is available for this variable.`;
  } else {
    els.yearAnimationHelp.textContent =
      "Drag the slider or press Play to move through available years.";
  }
}

function updateYearFromSlider({ renderDashboard = true } = {}) {
  const index = Number(els.yearSlider.value);
  const nextYear = availableYears[index];

  if (!Number.isFinite(nextYear)) return;

  state.year = nextYear;
  els.yearDisplay.textContent = String(nextYear);

  if (renderDashboard) {
    render();
  }
}

function startYearAnimation() {
  if (availableYears.length < 2) return;

  stopYearAnimation();

  els.yearPlayButton.textContent = "❚❚ Pause";
  els.yearPlayButton.setAttribute(
    "aria-label",
    "Pause year animation",
  );

  yearAnimationTimer = window.setInterval(() => {
    let nextIndex = currentYearIndex() + 1;

    if (nextIndex >= availableYears.length) {
      nextIndex = 0;
    }

    els.yearSlider.value = String(nextIndex);
    updateYearFromSlider();
  }, YEAR_ANIMATION_INTERVAL);
}

function stopYearAnimation() {
  if (yearAnimationTimer !== null) {
    window.clearInterval(yearAnimationTimer);
    yearAnimationTimer = null;
  }

  if (els.yearPlayButton) {
    els.yearPlayButton.textContent = "▶ Play";
    els.yearPlayButton.setAttribute(
      "aria-label",
      "Play year animation",
    );
  }
}

function toggleYearAnimation() {
  if (yearAnimationTimer === null) {
    startYearAnimation();
  } else {
    stopYearAnimation();
  }
}



function setMultiSelectOptions(element, values, selectedValues) {
  const selected = new Set(selectedValues);
  const availableStates = new Set(values);

  element.innerHTML = values
    .map((value) => {
      const safeValue = escapeHtml(value);
      const isSelected = selected.has(value) ? "selected" : "";

      return `
        <option value="${safeValue}" ${isSelected}>
          ${safeValue}
        </option>
      `;
    })
    .join("");

  const regionButtons = Object.entries(REGION_PRESETS)
    .map(([regionName, regionStates]) => {
      const matchingStates = regionStates.filter((stateName) =>
        availableStates.has(stateName),
      );

      if (!matchingStates.length) return "";

      return `
        <button
          type="button"
          class="region-preset"
          data-region="${escapeHtml(regionName)}"
          title="Select ${escapeHtml(regionName)}"
        >
          ${escapeHtml(regionName)}
        </button>
      `;
    })
    .join("");

  const stateCheckboxes = values
    .map((value) => {
      const safeValue = escapeHtml(value);
      const checked = selected.has(value) ? "checked" : "";

      return `
        <label class="state-option">
          <input
            type="checkbox"
            value="${safeValue}"
            ${checked}
          >
          <span>${safeValue}</span>
        </label>
      `;
    })
    .join("");

  els.stateOptions.innerHTML = `
    <div class="region-presets">
      <div class="region-presets-label">Select a region</div>

      <div class="region-preset-grid">
        ${regionButtons}
      </div>
    </div>

    <div class="state-options-label">Or select individual states</div>

    <div class="state-checkbox-list">
      ${stateCheckboxes}
    </div>
  `;

  renderStatePicker();
}

function setSelectedStates(nextStates) {
  state.selectedStates = [...new Set(nextStates)].sort((a, b) => a.localeCompare(b));
  state.countyKey = "All counties";
  renderStatePicker();
  syncCountyOptions();
}

function syncGeographyControls() {
  const countyField = document.querySelector(".county-filter-field");
  const stateField = document.querySelector(".state-filter-field");
  const tractStateField = document.querySelector(".tract-state-field");
  const isDetailGeography = state.geography !== "state";

  tractStateField.hidden = true;
  stateField.hidden = false;

  countyField?.classList.toggle("hidden", !isDetailGeography);
  stateField?.classList.remove("hidden");
  tractStateField?.classList.toggle("hidden", true);

  if (state.geography === "tract") {
    setOptions(
      els.tractStateSelect,
      Object.keys(TRACT_STATES),
      state.tractStateFips,
      (fips) => TRACT_STATES[fips],
    );
  }

  if (!isDetailGeography) {
    state.countyKey = "All counties";
    els.countyMenu.classList.add("hidden");
    els.countyPickerButton.setAttribute("aria-expanded", "false");
  }

  els.topTableTitle.textContent = `Top 10 ${geographyPlural()}`;
  els.bottomTableTitle.textContent = `Bottom 10 ${geographyPlural()}`;
  els.statsSubtitle.textContent =
    `Summary values and ${geographyLabel().toLowerCase()} rankings for the selected map year.`;
}

function syncCountyOptions() {
  if (state.geography === "tract" && countyLookup) {
    const counties = countyLookup
      .filter((county) => {
        if (!state.selectedStates.length) return true;
        const geoid = String(county.geoid).padStart(5, "0");
        return state.selectedStates.includes(TRACT_STATES[geoid.slice(0, 2)]);
      })
      .map((county) => {
        const geoid = String(county.geoid).padStart(5, "0");
        const stateName = TRACT_STATES[geoid.slice(0, 2)] || "Unknown state";
        return [geoid, `${county.name}, ${stateName}`];
      })
      .sort((a, b) => a[1].localeCompare(b[1]));
    els.countySelect.innerHTML = [
      '<option value="All counties">All counties</option>',
      ...counties.map(([geoid, name]) => `<option value="${escapeHtml(geoid)}">${escapeHtml(name)}</option>`),
    ].join("");
    els.countyOptions.innerHTML = [
      '<button type="button" class="county-option selected" data-county-key="All counties">All counties</button>',
      ...counties.map(([geoid, name]) => `<button type="button" class="county-option" data-county-key="${escapeHtml(geoid)}">${escapeHtml(name)}</button>`),
    ].join("");
    els.countyPickerText.textContent = "All counties";
    return;
  }
  if (state.geography === "state") {
    state.countyKey = "All counties";
    els.countySelect.innerHTML =
      `<option value="All counties">All counties</option>`;
    els.countySelect.value = "All counties";
    els.countyPickerText.textContent = "All counties";
    els.countyOptions.innerHTML = "";
    return;
  }

  const countyRows = rows
    .filter(rowMatchesStates)
    .filter((row) => row.GEOID && row.county_name);

  const countyMap = new Map();

  countyRows.forEach((row) => {
    countyMap.set(
      countySelectionKey(row),
      `${row.county_name}, ${row.state_name}`,
    );
  });

  const counties = [...countyMap.entries()].sort((a, b) =>
    a[1].localeCompare(b[1]),
  );

  if (
    state.countyKey !== "All counties" &&
    !countyMap.has(state.countyKey)
  ) {
    state.countyKey = "All counties";
  }

  // Keep hidden select synchronized.
  els.countySelect.innerHTML = [
    `<option value="All counties">All counties</option>`,
    ...counties.map(
      ([geoid, label]) =>
        `<option value="${escapeHtml(geoid)}">${escapeHtml(label)}</option>`,
    ),
  ].join("");

  els.countySelect.value = state.countyKey;

  // Build visible searchable dropdown.
  els.countyOptions.innerHTML = [
    `
      <button
        type="button"
        class="county-option"
        data-county-key="All counties"
      >
        All counties
      </button>
    `,
    ...counties.map(
      ([geoid, label]) => `
        <button
          type="button"
          class="county-option"
          data-county-key="${escapeHtml(geoid)}"
        >
          ${escapeHtml(label)}
        </button>
      `,
    ),
  ].join("");

  const selectedLabel =
    state.countyKey === "All counties"
      ? "All counties"
      : countyMap.get(state.countyKey) || "All counties";

  els.countyPickerText.textContent = selectedLabel;
  els.countySearch.value = "";

  filterCountyOptions("");
}

function filterCountyOptions(searchText) {
  const query = String(searchText).trim().toLowerCase();

  els.countyOptions
    .querySelectorAll(".county-option")
    .forEach((option) => {
      const matches =
        !query ||
        option.textContent.toLowerCase().includes(query);

      option.hidden = !matches;
    });
}

function unitLabel(variable) {
  const kind = valueKind(variable);
  if (kind === "percent") return "%";
  if (kind === "dollar") return "USD";
  if (kind === "year") return "year";
  if (kind === "count") {
    if (/population|exposure/.test(variable)) return "people";
    if (/households/.test(variable)) return "households";
    if (/units/.test(variable)) return "housing units";
    return "count";
  }
  if (/frequency/.test(variable)) return "annual frequency";
  if (/score/.test(variable)) return "score";
  if (/index/.test(variable)) return "index";
  return "value";
}

function axisTitle(variable) {
  const unit = unitLabel(variable);
  const label = variableLabel(variable);
  return unit === "value" ? label : `${label} (${unit})`;
}

function colorRange(values, mode = "robust") {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!finite.length) return [0, 1];

  let low;
  let high;

  if (mode === "robust" && finite.length >= 20) {
    low = quantile(finite, 0.05);
    high = quantile(finite, 0.95);
  } else {
    low = finite[0];
    high = finite.at(-1);
  }

  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    low = finite[0];
    high = finite.at(-1);
  }

  if (low === high) {
    const buffer = Math.abs(low) * 0.03 || 1;
    low -= buffer;
    high += buffer;
  }

  return [low, high];
}

function colorbarTickFormat(variable) {
  const kind = valueKind(variable);
  if (kind === "dollar") return "$,.3s";
  if (kind === "percent") return ".1f";
  if (kind === "year") return "d";
  if (kind === "count") return ",.3s";
  return ".3g";
}

const VALID_COLOR_SCALES = new Set([
  "Viridis",
  "Plasma",
  "Cividis",
  "RdBu",
  "Blues",
  "Reds",
  "YlOrRd",
  "Jet",
]);

function isDarkMode() {
  return document.documentElement.dataset.theme === "dark";
}

function plotTheme() {
  const dark = isDarkMode();

  return {
    paper_bgcolor: dark ? "#111827" : "#ffffff",
    plot_bgcolor: dark ? "#111827" : "#ffffff",
    font: {
      color: dark ? "#e5e7eb" : "#111827",
    },
  };
}

function setTheme(theme, { save = true, rerender = true } = {}) {
  const dark = theme === "dark";

  document.documentElement.dataset.theme = dark ? "dark" : "light";

  els.themeToggle.setAttribute("aria-pressed", String(dark));
  els.themeToggleText.textContent = dark ? "Light Mode" : "Dark Mode";

  if (save) {
    localStorage.setItem("dashboard-theme", dark ? "dark" : "light");
  }

  if (rerender && rows.length && state.variable) {
    render();
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("dashboard-theme");

  const preferredTheme =
    savedTheme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");

  setTheme(preferredTheme, {
    save: false,
    rerender: false,
  });
}

let lastMapWasMobile = null;

function renderMap(data) {
  const mobile = isMobile();

  // County and state maps now use the same MapLibre instance and basemap as
  // Census tracts. The remaining Plotly code is retained below only as a
  // fallback and is bypassed for every current geography option.
  if (state.geography !== "tract") {
    renderAdminMap(data);
    return;
  }

  // Plotly.react() doesn't reliably clear the old colorbar's DOM when its
  // orientation changes (vertical <-> horizontal) — it can leave a stale
  // copy behind. Force a full purge/rebuild whenever we cross the
  // mobile/desktop boundary so there's never a leftover bar on screen.
  if (lastMapWasMobile !== null && lastMapWasMobile !== mobile) {
    Plotly.purge(els.mapChart);
  }

  els.mapChart.classList.remove("hidden");
  els.tractMap.classList.add("hidden");

  lastMapWasMobile = mobile;


    if (state.geography === "tract") {
    // Hide Plotly map, show MapLibre map.
    // Do not fetch a tract GeoJSON.
    renderTractMap();
    return;
  }

  // Existing Plotly county/state code remains unchanged.

  const values = data.map((row) => row.value);
  const [cmin, cmax] = mapColorRange();

  let colorscale;

  if (state.colorScale === "Plasma") {
    colorscale = [
      [0.00, "#0d0887"],
      [0.20, "#5b02a3"],
      [0.40, "#9a179b"],
      [0.60, "#cb4679"],
      [0.80, "#ed7953"],
      [1.00, "#f0f921"],
    ];
  } else if (state.colorScale === "RdBu") {
    colorscale = "RdBu";
  } else if (state.colorScale === "Jet") {
    colorscale = "Jet";
  } else {
    colorscale = VALID_COLOR_SCALES.has(state.colorScale)
      ? state.colorScale
      : "Viridis";
  }

  const includesInsetState = data.some(
    (row) =>
      row.state_name === "Alaska" ||
      row.state_name === "Hawaii",
  );

  const shouldFitBounds =
    (state.selectedStates.length > 0 ||
      (state.geography !== "state" && state.countyKey !== "All counties")) &&
    !includesInsetState;

  const dark = isDarkMode();

  const trace = {
    type: "choropleth",
    geojson,
    locations: data.map((row) => row.GEOID),
    z: values,
    featureidkey: geographyConfig().featureIdKey,

    colorscale,
    autocolorscale: false,
    reversescale: false,
    zmin: cmin,
    zmax: cmax,

    marker: {
      line: {
        color: dark ? "#cbd5e1" : "#ffffff",
        width: dark ? 0.4 : 0.25,
      },
    },

    customdata: data.map((row) => [
      state.geography === "state"
        ? row.state_name
        : state.geography === "tract"
          ? `${row.tract_name}, ${row.county_name}, ${row.state_name}`
          : `${row.county_name}, ${row.state_name}`,
      row.year,
      formatValue(row.value, state.variable),
    ]),

    hovertemplate:
      "<b>%{customdata[0]}</b><br>" +
      "Year: %{customdata[1]}<br>" +
      `${variableLabel(state.variable)}: %{customdata[2]}` +
      "<extra></extra>",

colorbar: {
  title: {
    text: mobile ? "" : axisTitle(state.variable),
    side: "right",
    font: {
      size: mobile ? 11 : 16,
      color: dark ? "#e5e7eb" : "#111827",
    },
  },

  tickfont: {
    size: mobile ? 10 : 15,
    color: dark ? "#d1d5db" : "#374151",
  },

  tickformat: colorbarTickFormat(state.variable),

  ticksuffix:
    valueKind(state.variable) === "percent"
      ? "%"
      : "",

  // Mobile = horizontal color bar below map
  orientation: mobile ? "h" : "v",

  x: mobile ? 0.5 : 1.02,
  xanchor: mobile ? "center" : "left",

  // Move the mobile colorbar underneath the map
  y: mobile ? -0.12 : 0.5,
  yanchor: mobile ? "top" : "middle",

  len: mobile ? 0.82 : 0.75,
  thickness: mobile ? 12 : 70,
},
};

Plotly.react(
  els.mapChart,
  [trace],
  {
    ...plotTheme(),

      geo: {
        scope: "usa",

        projection: {
          type: "albers usa",
        },

        fitbounds: shouldFitBounds
          ? "locations"
          : false,

        visible: false,

        bgcolor: dark
          ? "#111827"
          : "#ffffff",

        showland: true,

        landcolor: dark
          ? "#1f2937"
          : "#f3f4f6",

        showlakes: true,

        lakecolor: dark
          ? "#111827"
          : "#ffffff",
      },

      margin: {
        l: mobile ? 5 : 10,
        r: mobile ? 5 : 80,
        t: mobile ? 5 : 10,
        b: mobile ? 70 : 20,
      },

      height: mobile ? 450 : 650,

      hoverlabel: {
        bgcolor: dark
          ? "#1f2937"
          : "#ffffff",

        bordercolor: dark
          ? "#4b5563"
          : "#d1d5db",

        font: {
          color: dark
            ? "#f3f4f6"
            : "#111827",
        },
      },

      uirevision: [
        state.geography,
        state.variable,
        state.selectedStates.join(","),
        state.countyKey,
        state.colorScale,
        state.scaleMode,
        dark ? "dark" : "light",
        mobile ? "mobile" : "desktop",
      ].join("|"),
    },
    {
      responsive: true,
      displaylogo: false,
    },
  );
}

function renderTrend() {
  const data = filtered({ includeYear: false, includeCounty: true });
  const selectedStates = selectedStateNames();
  const traces = [];

  if (state.geography === "county" && state.countyKey !== "All counties") {
    const byYear = new Map();
    data.forEach((row) => byYear.set(Number(row.year), row.value));
    const years = [...byYear.keys()].sort((a, b) => a - b);
    const countyRow = rows.find((row) => row.GEOID === state.countyKey);
    const name = countyRow
      ? `${countyRow.county_name}, ${countyRow.state_name}`
      : "Selected county";

    traces.push({
      type: "scatter",
      mode: "lines+markers",
      x: years,
      y: years.map((year) => byYear.get(year)),
      name,
      hovertemplate: "Year: %{x}<br>Value: %{y}<extra></extra>",
    });
  } else if (selectedStates && selectedStates.length <= 10) {
    selectedStates.forEach((stateName) => {
      const byYear = new Map();
      data
        .filter((row) => row.state_name === stateName)
        .forEach((row) => {
          const year = Number(row.year);
          if (!byYear.has(year)) byYear.set(year, []);
          byYear.get(year).push(row.value);
        });

      const years = [...byYear.keys()].sort((a, b) => a - b);
      traces.push({
        type: "scatter",
        mode: "lines+markers",
        x: years,
        y: years.map((year) => mean(byYear.get(year))),
        name: stateName,
        hovertemplate: `${stateName}<br>Year: %{x}<br>Average: %{y}<extra></extra>`,
      });
    });
  } else {
    const byYear = new Map();
    data.forEach((row) => {
      const year = Number(row.year);
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(row.value);
    });
    const years = [...byYear.keys()].sort((a, b) => a - b);
    traces.push({
      type: "scatter",
      mode: "lines+markers",
      x: years,
      y: years.map((year) => mean(byYear.get(year))),
      name: selectedStates ? `${selectedStates.length} selected states` : "United States",
      hovertemplate: "Year: %{x}<br>Average: %{y}<extra></extra>",
    });
  }

    traces.forEach((trace) => {
      trace.line = {
        ...(trace.line || {}),
        width: 5,
      };

      trace.marker = {
        ...(trace.marker || {}),
        size: 9,
      };
    });

    Plotly.react(
      els.trendChart,
      traces,
      {
        ...plotTheme(),

      title: {
        text: `${variableLabel(state.variable)} Over Time`,
        x: 0.01,
        font: {
          size: isMobile() ? 18 : 28,
        },
      },

      legend: {
        orientation: "h",
        y: -0.4,
        font: {
          size: 16,
        },
      },

    xaxis: {
      title: {
        text: "Year",
        font: {
          size: isMobile() ? 14 : 20,
        },
      },

      tickfont: {
        size: isMobile() ? 11 : 16,
      },

      dtick: 1,

      gridcolor: isDarkMode() ? "#374151" : "#e5e7eb",
      zerolinecolor: isDarkMode() ? "#4b5563" : "#d1d5db",
    },

    yaxis: {
      title: {
        text: axisTitle(state.variable),
        font: {
          size: isMobile() ? 14 : 20,
        } ,
        standoff: 28,
      },

      tickfont: {
        size: isMobile() ? 11 : 16,
      },

      automargin: true,
      tickformat: colorbarTickFormat(state.variable),

      gridcolor: isDarkMode() ? "#374151" : "#e5e7eb",
      zerolinecolor: isDarkMode() ? "#4b5563" : "#d1d5db",
    },
        hovermode: "x unified",

    margin: {
      l: isMobile() ? 50 : 65,
      r: 10,
      t: isMobile() ? 45 : 60,
      b: isMobile() ? 70 : 90,
    },

    height: isMobile() ? 380 : 460,

      },
      {
        responsive: true,
        displaylogo: false,
      },
    );
}

function tableHtml(data) {
  if (state.geography === "state") {
    return `<table class="dash-table"><thead><tr><th>State</th><th>Value</th></tr></thead><tbody>${data
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.state_name)}</td><td>${formatValue(
            row.value,
            state.variable,
          )}</td></tr>`,
      )
      .join("")}</tbody></table>`;
  }

  if (state.geography === "tract") {
    return `<table class="dash-table"><thead><tr><th>Census Tract</th><th>County</th><th>State</th><th>Value</th></tr></thead><tbody>${data
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.tract_name)}</td><td>${escapeHtml(row.county_name)}</td><td>${escapeHtml(row.state_name)}</td><td>${formatValue(row.value, state.variable)}</td></tr>`,
      )
      .join("")}</tbody></table>`;
  }

  return `<table class="dash-table"><thead><tr><th>County</th><th>State</th><th>Value</th></tr></thead><tbody>${data
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.county_name)}</td><td>${escapeHtml(
          row.state_name,
        )}</td><td>${formatValue(row.value, state.variable)}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

function renderStats(data) {
  const values = data.map((row) => row.value);
  const hasValues = values.length > 0;
  const cards = [
    [geographyPlural(), values.length.toLocaleString()],
    ["Average", hasValues ? formatValue(mean(values), state.variable) : "—"],
    ["Median", hasValues ? formatValue(median(values), state.variable) : "—"],
    ["Minimum", hasValues ? formatValue(Math.min(...values), state.variable) : "—"],
    ["Maximum", hasValues ? formatValue(Math.max(...values), state.variable) : "—"],
    ["Std. Dev.", hasValues ? formatValue(stddev(values), state.variable) : "—"],
  ];

  els.summaryCards.innerHTML = cards
    .map(
      ([label, value]) =>
        `<div class="summary-card"><div class="summary-label">${label}</div><div class="summary-value">${value}</div></div>`,
    )
    .join("");

  const ranked = [...data].sort((a, b) => b.value - a.value);
  els.topTable.innerHTML = tableHtml(ranked.slice(0, 10));
  els.bottomTable.innerHTML = tableHtml(ranked.slice(-10).reverse());
}

function renderVariableMetadata() {
  const defaults = defaultMetadata(state.variable);
  const overrides = variableMetadataOverrides[state.variable] || {};

  const meta = {
    ...defaults,
    ...overrides,
  };

  els.metadataTitle.textContent = variableLabel(state.variable);
  els.metadataDefinition.textContent = meta.definition;
  els.metadataUnit.textContent = meta.unit;
  els.metadataInterpretation.textContent = meta.interpretation;
  els.metadataSource.textContent = meta.source;

  els.variableMetadata.classList.remove("hidden");
}

function renderVisibility() {
  const sections = {
    map: els.mapSection,
    trend: els.trendSection,
    stats: els.statsSection,
  };

  Object.entries(sections).forEach(([name, element]) => {
    element.classList.toggle("hidden", state.activeTab !== name);
  });

  document.querySelectorAll(".dashboard-tab").forEach((button) => {
    const active = button.dataset.tab === state.activeTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function updateTabAvailability() {
  const hasNoTimeSeries = isFemaVariable(state.variable);
  const trendButton = document.querySelector(
    '.dashboard-tab[data-tab="trend"]',
  );

  trendButton.disabled = hasNoTimeSeries;
  trendButton.setAttribute("aria-disabled", String(hasNoTimeSeries));

  trendButton.title = hasNoTimeSeries
    ? "Time-series data is unavailable for this variable."
    : "";

  if (hasNoTimeSeries && state.activeTab === "trend") {
    state.activeTab = "map";
  }
}

function mapColorRange() {
  const allYearData = filtered({
    includeYear: false,
    includeCounty: true,
  });

  const values = allYearData.map((row) => row.value);

  return colorRange(values, state.scaleMode);
}

function render() {
  updateTabAvailability();
  renderVariableMetadata();
  const data = filtered();
  const selectedStates = selectedStateNames();
  const countyRow =
    state.geography === "county" && state.countyKey !== "All counties"
      ? rows.find((row) => row.GEOID === state.countyKey)
      : null;
  const area = countyRow
    ? `${countyRow.county_name}, ${countyRow.state_name}`
    : drawnAreaActive
      ? "Custom drawn area"
    : selectedStates
      ? selectedStates.length === 1
        ? selectedStates[0]
        : `${selectedStates.length} selected states`
      : "United States";

  els.dashboardTitle.textContent = `${variableLabel(state.variable)} in ${area} (${state.year})`;
  els.dashboardMeta.innerHTML =
    `<b>Variable:</b> ${variableLabel(state.variable)} &nbsp; | &nbsp; ` +
    `<b>Year:</b> ${state.year} &nbsp; | &nbsp; ` +
    `<b>Geography:</b> ${geographyLabel()} &nbsp; | &nbsp; ` +
    `<b>Area:</b> ${area} &nbsp; | &nbsp; ` +
    `<b>Rows:</b> ${data.length.toLocaleString()}`;

  renderVisibility();

  if (state.geography === "tract") {
    const loadedTractRows = [...tractRowsByState.values()].reduce(
      (total, stateRows) =>
        total + stateRows.filter(
          (row) =>
            Number(row.year) === Number(state.year) &&
            rowMatchesStates(row) &&
            rowMatchesDrawnArea(row) &&
            validNumber(row[state.variable]),
        ).length,
      0,
    );

    els.dashboardMeta.innerHTML =
      `<b>Variable:</b> ${variableLabel(state.variable)} &nbsp; | &nbsp; ` +
      `<b>Year:</b> ${state.year} &nbsp; | &nbsp; ` +
      `<b>Geography:</b> Census Tract &nbsp; | &nbsp; ` +
      `<b>Area:</b> ${area} &nbsp; | &nbsp; ` +
      `<b>Rows:</b> ${loadedTractRows.toLocaleString()}`;

    if (!data.length) {
      els.status.textContent = tractLoadPromises.size
        ? "Loading census tract data for the selected states…"
        : "No census tract data matches these filters.";
    }

    if (state.activeTab === "map") renderMap(data);
    if (state.activeTab === "trend") renderTrend();
    if (state.activeTab === "stats") renderStats(data);
    return;
  }

  if (!data.length) {
    els.status.innerHTML = '<div class="error">No data matches these filters.</div>';
    Plotly.purge(els.mapChart);
    Plotly.purge(els.trendChart);
    els.summaryCards.innerHTML = "";
    els.topTable.innerHTML = "";
    els.bottomTable.innerHTML = "";
    return;
  }

  els.status.textContent =
    `Showing ${data.length.toLocaleString()} ${geographyLabel().toLowerCase()} records.`;
  if (state.activeTab === "map") renderMap(data);
  if (state.activeTab === "trend") renderTrend();
  if (state.activeTab === "stats") renderStats(data);
}

function readForm() {
  const previousVariable = state.variable;

  state.variable = els.variableSelect.value;
  state.selectedStates = getSelectedValues(els.stateSelect);
  state.countyKey =
    state.geography !== "state"
      ? els.countySelect.value
      : "All counties";
  state.colorScale = els.colorScaleSelect.value;
  state.scaleMode = els.scaleModeSelect.value;

  if (state.variable !== previousVariable) {
    syncYearAnimationControls({
      preserveYear: true,
    });
  } else {
    updateYearFromSlider({
      renderDashboard: false,
    });
  }
}

async function loadParquet(dataUrl) {
  els.status.textContent =
    `Downloading ${geographyLabel().toLowerCase()} Parquet data…`;

  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(
      `Could not load ${dataUrl}. Put the Parquet file inside the dashboard data folder.`,
    );
  }

  const parquetBuffer = await response.arrayBuffer();
  els.status.textContent = "Reading Parquet data in the browser…";

  const { parquetReadObjects } = await import(HYPARQUET_URL);
  return parquetReadObjects({ file: parquetBuffer });
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];

  const parseLine = (line) => {
    const values = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"' && quoted) {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === "," && !quoted) {
        values.push(value);
        value = "";
      } else {
        value += character;
      }
    }
    values.push(value);
    return values;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

async function loadSpecificEvent(eventId) {
  const event = EVENT_CONFIGS[eventId];
  if (!event) throw new Error(`Unknown event: ${eventId}`);
  const prefix = event.prefix;
  stopYearAnimation();
  state.dataMode = eventId;
  state.geography = "tract";
  state.selectedStates = [...event.states];
  state.countyKey = "All counties";
  state.activeTab = "map";
  state.year = event.year;

  els.dataModeSelect.value = eventId;
  els.geographySelect.value = "tract";
  els.geographySelect.disabled = true;
  const eventLoadingLabel = event.loadingLabel || (event.kind === "nfip" ? "NFIP claims" : "damage inspections");
  els.status.textContent = `Loading ${event.name} ${eventLoadingLabel} by census tract…`;

  await loadCountyLookup();
  const response = await fetch(event.dataUrl);
  if (!response.ok) {
    throw new Error(
      `Could not load ${event.dataUrl}. Put ${event.dataUrl.split("/").at(-1)} inside the dashboard data folder.`,
    );
  }

  const countyNames = new Map(
    countyLookup.map((county) => [
      String(county.geoid).padStart(5, "0"),
      county.name,
    ]),
  );

  rows = parseCsv(await response.text()).map((row) => {
    const geoid = String(row.GEOID).padStart(11, "0");
    const eventValues = event.kind === "nfip"
      ? {
          [`${prefix}claim_count`]: row.claim_count,
          [`${prefix}claims_per_1000_residents`]: row.claims_per_1000_residents,
          [`${prefix}total_claim_payments`]: row.total_claim_payments,
          [`${prefix}claim_payments_per_capita`]: row.claim_payments_per_capita,
          [`${prefix}average_payment_per_claim`]: row.average_payment_per_claim,
          [`${prefix}building_payments`]: row.building_payments,
          [`${prefix}contents_payments`]: row.contents_payments,
          [`${prefix}icc_payments`]: row.icc_payments,
        }
      : Object.fromEntries(event.variables.map((variable) => [
          variable,
          row[variable.replace(prefix, "")],
        ]));
    return normalizeRow({
      GEOID: geoid,
      year: event.year,
      state: geoid.slice(0, 2),
      county: geoid.slice(2, 5),
      state_name: TRACT_STATES[geoid.slice(0, 2)] || "Unknown state",
      county_name: countyNames.get(geoid.slice(0, 5)) || "Unknown county",
      tract_name: `Census Tract ${geoid.slice(5)}`,
      ...eventValues,
    });
  });

  tractRowsByState.clear();
  activeNationwideTractVariable = null;
  rows.forEach((row) => {
    const stateFips = row.GEOID.slice(0, 2);
    if (!tractRowsByState.has(stateFips)) tractRowsByState.set(stateFips, []);
    tractRowsByState.get(stateFips).push(row);
  });

  variables = [...event.variables];
  state.variable = event.initialVariable;
  setGroupedVariableOptions(els.variableSelect, variables, state.variable);
  setMultiSelectOptions(
    els.stateSelect,
    event.states,
    state.selectedStates,
  );
  syncYearAnimationControls({ preserveYear: true });
  syncGeographyControls();
  syncCountyOptions();
  renderStatePicker();

  lastTractStateFitKey = null;
  tractMap?.removeFeatureState({ source: "us-tracts", sourceLayer: "tracts" });
  render();
}

async function loadGeography({ preserveVariable = true } = {}) {
  stopYearAnimation();

  const config = geographyConfig();
  const previousVariable = state.variable;

  // Census tracts are rendered from the nationwide PMTiles archive while
  // attribute values are loaded from the state-level Parquet files.
  if (state.geography === "tract") {
    state.selectedStates = [];
    state.countyKey = "All counties";
    state.activeTab = "map";
    await loadCountyLookup();
    setMultiSelectOptions(
      els.stateSelect,
      Object.values(TRACT_STATES).sort((a, b) => a.localeCompare(b)),
      state.selectedStates,
    );
    syncGeographyControls();
    syncCountyOptions();
    if (mapDraw) updateDrawSelection({ rerender: false });
    els.status.textContent = "Loading Census tract data by state…";
    Plotly.purge(els.mapChart);
    lastMapWasMobile = null;
    render();
    return;
  }

  els.status.textContent = `Loading ${config.label.toLowerCase()} data…`;

  const dataUrl = typeof config.dataUrl === "function"
    ? config.dataUrl(state.tractStateFips)
    : config.dataUrl;
  const geojsonUrl = typeof config.geojsonUrl === "function"
    ? config.geojsonUrl(state.tractStateFips)
    : config.geojsonUrl;

  const [parquetRows, geoResponse] = await Promise.all([
    loadParquet(dataUrl),
    fetch(geojsonUrl),
  ]);

  if (!geoResponse.ok) {
    throw new Error(
      `Could not load ${geojsonUrl}. Put the GeoJSON file inside the dashboard data folder.`,
    );
  }

  geojson = await geoResponse.json();
  rows = parquetRows.map(normalizeRow);

  if (!rows.length) {
    throw new Error(`${config.label} Parquet loaded but contained no rows.`);
  }

  variables = Object.keys(labels)
    .filter((column) =>
      Object.prototype.hasOwnProperty.call(rows[0], column),
    )
    .filter((column) => rows.some((row) => validNumber(row[column])))
    .sort((a, b) => variableLabel(a).localeCompare(variableLabel(b)));

  if (!variables.length) {
    throw new Error(
      `No numeric dashboard variables were found for ${config.label}.`,
    );
  }

  if (preserveVariable && variables.includes(previousVariable)) {
    state.variable = previousVariable;
  } else {
    state.variable = variables.includes("total_population")
      ? "total_population"
      : variables[0];
  }

  state.selectedStates = [];
  state.countyKey = "All counties";
  state.activeTab = "map";

  const states = [
    ...new Set(rows.map((row) => row.state_name).filter(Boolean)),
  ].sort();

  setGroupedVariableOptions(els.variableSelect, variables, state.variable);
  setMultiSelectOptions(els.stateSelect, states, state.selectedStates);

  syncYearAnimationControls({ preserveYear: false });
  syncGeographyControls();
  syncCountyOptions();
  if (mapDraw) updateDrawSelection({ rerender: false });

  Plotly.purge(els.mapChart);
  Plotly.purge(els.trendChart);
  lastMapWasMobile = null;

  render();
}

async function init() {
  try {
    state.geography = "county";
    state.dataMode = "annual";
    els.dataModeSelect.value = state.dataMode;
    els.geographySelect.value = state.geography;
    state.colorScale = "Viridis";
    state.scaleMode = "robust";
    state.activeTab = "map";

    await loadGeography({ preserveVariable: false });
  } catch (error) {
    els.status.innerHTML =
      `<div class="error">${escapeHtml(error.message)}</div>`;
    console.error(error);
  }
}

els.countyPickerButton.addEventListener("click", () => {
  const willOpen = els.countyMenu.classList.contains("hidden");

  els.countyMenu.classList.toggle("hidden", !willOpen);
  els.countyPickerButton.setAttribute(
    "aria-expanded",
    String(willOpen),
  );

  if (willOpen) {
    els.countySearch.value = "";
    filterCountyOptions("");

    window.setTimeout(() => {
      els.countySearch.focus();
    }, 0);
  }
});

els.countySearch.addEventListener("input", () => {
  filterCountyOptions(els.countySearch.value);
});

els.countyOptions.addEventListener("click", (event) => {
  const option = event.target.closest(".county-option");
  if (!option) return;

  state.countyKey = option.dataset.countyKey;
  els.countySelect.value = state.countyKey;
  els.countyPickerText.textContent =
    option.textContent.trim();

  els.countyMenu.classList.add("hidden");
  els.countyPickerButton.setAttribute(
    "aria-expanded",
    "false",
  );

  if (state.geography === "tract" && state.countyKey !== "All counties") {
    zoomToTractCounty(state.countyKey);
  } else if (state.geography === "tract") {
    tractMap?.getSource("selected-county")?.setData({
      type: "FeatureCollection",
      features: [],
    });
  }
});

function zoomToTractCounty(countyGeoid) {
  if (!tractMap?.getSource("us-tracts")) return;

  const lookupCounty = countyLookup?.find((county) => county.geoid === countyGeoid);
  if (lookupCounty) {
    const [west, south, east, north] = lookupCounty.bounds;
    tractMap.fitBounds(
      [[west, south], [east, north]],
      { padding: MAP_FIT_PADDING, maxZoom: 11, duration: 700 },
    );
    highlightTractCounty(countyGeoid);
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  const extendCoordinates = (coordinates) => {
    if (typeof coordinates[0] === "number") {
      bounds.extend(coordinates);
      return;
    }
    coordinates.forEach(extendCoordinates);
  };

  tractMap
    .querySourceFeatures("us-tracts", { sourceLayer: "tracts" })
    .filter((feature) => String(feature.id).padStart(11, "0").slice(0, 5) === countyGeoid)
    .forEach((feature) => extendCoordinates(feature.geometry.coordinates));

  if (!bounds.isEmpty()) {
    tractMap.fitBounds(bounds, { padding: MAP_FIT_PADDING, maxZoom: 11, duration: 700 });
  }

  highlightTractCounty(countyGeoid);
}

async function loadCountyLookup() {
  if (countyLookup) return countyLookup;
  const response = await fetch("data/county_lookup.json");
  if (!response.ok) throw new Error("Could not load the county lookup file.");
  countyLookup = await response.json();
  return countyLookup;
}

async function highlightTractCounty(countyGeoid) {
  if (!tractMap?.getSource("selected-county")) return;
  if (!tractCountyBoundaries) {
    const response = await fetch("data/us_counties_geojson.json");
    if (!response.ok) return;
    tractCountyBoundaries = await response.json();
  }
  const features = tractCountyBoundaries.features.filter((feature) =>
    String(feature.id || feature.properties?.GEOID || "").padStart(5, "0") === countyGeoid,
  );
  tractMap.getSource("selected-county").setData({ type: "FeatureCollection", features });
}


els.dataModeSelect.addEventListener("change", async () => {
  try {
    if (EVENT_CONFIGS[els.dataModeSelect.value]) {
      await loadSpecificEvent(els.dataModeSelect.value);
      return;
    }

    stopYearAnimation();
    state.dataMode = "annual";
    state.geography = "county";
    state.selectedStates = [];
    state.countyKey = "All counties";
    els.dataModeSelect.value = "annual";
    els.geographySelect.disabled = false;
    els.geographySelect.value = "county";
    tractRowsByState.clear();
    activeNationwideTractVariable = null;
    tractMap?.removeFeatureState({ source: "us-tracts", sourceLayer: "tracts" });
    await loadGeography({ preserveVariable: false });
  } catch (error) {
    els.status.innerHTML =
      `<div class="error">${escapeHtml(error.message)}</div>`;
    console.error(error);
  }
});

els.geographySelect.addEventListener("change", async () => {
  try {
    stopYearAnimation();
    state.geography = els.geographySelect.value;
    state.selectedStates = [];
    state.countyKey = "All counties";

    await loadGeography({ preserveVariable: true });
  } catch (error) {
    els.status.innerHTML =
      `<div class="error">${escapeHtml(error.message)}</div>`;
    console.error(error);
  }
});

els.tractStateSelect.addEventListener("change", async () => {
  state.tractStateFips = els.tractStateSelect.value;
  state.countyKey = "All counties";
  await loadGeography({ preserveVariable: true });
});

els.filters.addEventListener("submit", (event) => {
  event.preventDefault();

  stopYearAnimation();
  readForm();
  syncCountyOptions();
  if (state.geography !== "state") {
    state.countyKey = els.countySelect.value;
  }
  render();
});

els.yearSlider.addEventListener("input", () => {
  stopYearAnimation();
  updateYearFromSlider();
});

els.yearPlayButton.addEventListener("click", () => {
  toggleYearAnimation();
});

els.statePickerButton.addEventListener("click", () => {
  const willOpen = els.stateMenu.classList.contains("hidden");
  els.stateMenu.classList.toggle("hidden", !willOpen);
  els.statePickerButton.setAttribute("aria-expanded", String(willOpen));
});

els.stateOptions.addEventListener("change", (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (!checkbox) return;

  const next = new Set(state.selectedStates);
  if (checkbox.checked) next.add(checkbox.value);
  else next.delete(checkbox.value);
  setSelectedStates([...next]);
});

els.stateOptions.addEventListener("click", (event) => {
  const regionButton = event.target.closest(".region-preset");
  if (!regionButton) return;

  const regionName = regionButton.dataset.region;
  const regionStates = REGION_PRESETS[regionName] || [];

  const availableStates = new Set(
    [...els.stateSelect.options].map((option) => option.value),
  );

  const matchingStates = regionStates.filter((stateName) =>
    availableStates.has(stateName),
  );

  setSelectedStates(matchingStates);
});

els.stateChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".state-chip");
  if (!chip) return;
  setSelectedStates(state.selectedStates.filter((name) => name !== chip.dataset.state));
});

els.clearStatesButton.addEventListener("click", () => {
  setSelectedStates([]);
});

document.addEventListener("click", (event) => {
  if (!els.statePicker.contains(event.target)) {
    els.stateMenu.classList.add("hidden");
    els.statePickerButton.setAttribute(
      "aria-expanded",
      "false",
    );
  }

  if (!els.countyPicker.contains(event.target)) {
    els.countyMenu.classList.add("hidden");
    els.countyPickerButton.setAttribute(
      "aria-expanded",
      "false",
    );
  }
});
els.dashboardTabs.addEventListener("click", (event) => {
  const button = event.target.closest(".dashboard-tab");

  if (!button || button.disabled) return;

  stopYearAnimation();
  state.activeTab = button.dataset.tab;
  render();
});

els.resetButton.addEventListener("click", () => {
  stopYearAnimation();

  state.variable = variables.includes("total_population")
    ? "total_population"
    : variables[0];

  state.selectedStates = [];
  state.countyKey = "All counties";
  state.colorScale = "Viridis";
  state.scaleMode = "robust";
  state.activeTab = "map";
  mapDraw?.deleteAll();
  updateDrawSelection({ rerender: false });

  setGroupedVariableOptions(
    els.variableSelect,
    variables,
    state.variable,
  );

  syncYearAnimationControls({
    preserveYear: false,
  });

  renderStatePicker();

  els.geographySelect.value = state.geography;
  els.colorScaleSelect.value = state.colorScale;
  els.scaleModeSelect.value = state.scaleMode;

  syncGeographyControls();
  syncCountyOptions();
  render();
});

els.themeToggle.addEventListener("click", () => {
  setTheme(isDarkMode() ? "light" : "dark");
});

let resizeTimer = null;
let lastRenderWasMobile = isMobile();

function handleViewportResize() {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    if (!rows.length || !state.variable) return;

    // Only force a full re-render (recomputes thickness/margins/height)
    // when we've actually crossed the mobile/desktop breakpoint, or when
    // the map is the visible tab, so we don't over-render on every pixel
    // of a drag-resize.
    const nowMobile = isMobile();

    if (nowMobile !== lastRenderWasMobile || state.activeTab === "map") {
      lastRenderWasMobile = nowMobile;
      render();
    } else {
      lastRenderWasMobile = nowMobile;
    }
  }, 150);
}

function desiredTractBoundaryVintage() {
  return currentEventConfig()?.boundaryVintage || (Number(state.year) < 2020 ? "2010" : "2020");
}

function addTractBoundarySource(vintage) {
  const firstLabelLayerId = tractMap
    .getStyle()
    .layers.find((layer) => layer.type === "symbol")?.id;

  tractMap.addSource("us-tracts", {
    type: "vector",
    url: `pmtiles://${US_TRACTS_PMTILES_URLS[vintage]}`,
    ...(vintage === "2010" ? { promoteId: "GEOID" } : {}),
  });

  tractMap.addLayer({
    id: "tract-fill",
    type: "fill",
    source: "us-tracts",
    "source-layer": "tracts",
    paint: {
      "fill-color": "#94a3b8",
      "fill-opacity": 0.82,
    },
  }, firstLabelLayerId);

  tractMap.addLayer({
    id: "tract-outline",
    type: "line",
    source: "us-tracts",
    "source-layer": "tracts",
    paint: {
      "line-color": "#334155",
      "line-width": 0.4,
    },
  }, firstLabelLayerId);

  activeTractBoundaryVintage = vintage;
}

function ensureTractBoundaryVintage() {
  if (!tractMap?.isStyleLoaded()) return;

  const vintage = desiredTractBoundaryVintage();
  if (activeTractBoundaryVintage === vintage && tractMap.getSource("us-tracts")) {
    return;
  }

  tractHoverPopup?.remove();
  if (tractMap.getLayer("tract-outline")) tractMap.removeLayer("tract-outline");
  if (tractMap.getLayer("tract-fill")) tractMap.removeLayer("tract-fill");
  if (tractMap.getSource("us-tracts")) tractMap.removeSource("us-tracts");

  addTractBoundarySource(vintage);
}

function drawnPolygon() {
  return mapDraw?.getAll()?.features?.find((feature) =>
    feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon"
  ) || null;
}

function centroidInsideDrawnPolygon(feature, polygon) {
  try {
    const geojsonFeature = typeof feature?.toJSON === "function"
      ? feature.toJSON()
      : feature;
    return Boolean(
      geojsonFeature?.geometry &&
      booleanPointInPolygon(centroid(geojsonFeature), polygon),
    );
  } catch (error) {
    console.warn("Could not test a feature centroid against the drawn polygon.", error);
    return false;
  }
}

function updateDrawSelection({ rerender = true } = {}) {
  const polygon = drawnPolygon();
  drawnGeoids = new Set();
  drawnAreaActive = Boolean(polygon);

  if (polygon && state.geography === "tract" && tractMap?.getSource("us-tracts")) {
    tractMap
      .querySourceFeatures("us-tracts", { sourceLayer: "tracts" })
      .forEach((feature) => {
        if (!centroidInsideDrawnPolygon(feature, polygon)) return;
        drawnGeoids.add(String(feature.id).padStart(11, "0"));
      });
  } else if (polygon && geojson?.features) {
    geojson.features.forEach((feature) => {
      if (!centroidInsideDrawnPolygon(feature, polygon)) return;
      drawnGeoids.add(adminFeatureId(feature));
    });
  }

  if (drawnAreaActive) {
    els.drawSelectionNotice.textContent = drawnGeoids.size
      ? `Custom area active: ${drawnGeoids.size.toLocaleString()} ${geographyPlural().toLowerCase()} selected. Time Series and Statistics are filtered.`
      : `Custom area active: no ${geographyPlural().toLowerCase()} intersect the shape at the current map view.`;
    els.drawSelectionNotice.classList.add("active");
  } else {
    els.drawSelectionNotice.textContent =
      "Use the polygon tool to select areas whose centroids fall inside the shape. Time Series and Statistics update automatically.";
    els.drawSelectionNotice.classList.remove("active");
  }

  if (rerender && state.variable) {
    refreshTractMapValues();
    render();
  }
}

function handleDrawCreate(event) {
  const newestId = event.features?.[0]?.id;
  const olderIds = mapDraw
    .getAll()
    .features
    .map((feature) => feature.id)
    .filter((id) => id !== newestId);
  if (olderIds.length) mapDraw.delete(olderIds);
  updateDrawSelection();
}

function initTractMap() {
  if (tractMap) return;

  tractMap = new maplibregl.Map({
    container: "tractMap",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    center: DEFAULT_MAP_CENTER,
    zoom: 3.5,
  });

  window.debugMap = tractMap;

  tractMap.addControl(new maplibregl.NavigationControl(), "top-right");

  mapDraw = new MapboxDraw({
    displayControlsDefault: false,
    controls: { polygon: true, trash: true },
  });
  tractMap.addControl(mapDraw, "top-left");
  tractMap.on("draw.create", handleDrawCreate);
  tractMap.on("draw.update", () => updateDrawSelection());
  tractMap.on("draw.delete", () => updateDrawSelection());

  tractMap.on("load", () => {
    // Insert dashboard polygons below the CARTO symbol layers so city and
    // place-name labels remain visible above every geography layer.
    const firstLabelLayerId = tractMap
      .getStyle()
      .layers.find((layer) => layer.type === "symbol")?.id;

    addTractBoundarySource(desiredTractBoundaryVintage());

    tractMap.addSource("admin-areas", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    tractMap.addLayer({
      id: "admin-fill",
      type: "fill",
      source: "admin-areas",
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#94a3b8",
        "fill-opacity": 0.82,
      },
    }, firstLabelLayerId);

    tractMap.addLayer({
      id: "admin-outline",
      type: "line",
      source: "admin-areas",
      layout: { visibility: "none" },
      paint: {
        "line-color": "#cbd5e1",
        "line-width": 0.65,
      },
    }, firstLabelLayerId);

    addTractLegend();

    tractMap.addSource("selected-county", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    tractMap.addLayer({
      id: "selected-county-outline",
      type: "line",
      source: "selected-county",
      paint: { "line-color": "#f8fafc", "line-width": 3.5, "line-opacity": 0.95 },
    }, firstLabelLayerId);

    tractMap.on("mouseenter", "tract-fill", () => {
      tractMap.getCanvas().style.cursor = "pointer";
    });

    tractMap.on("mouseleave", "tract-fill", () => {
      tractMap.getCanvas().style.cursor = "";
      tractHoverPopup?.remove();
    });

    tractMap.on("mouseenter", "admin-fill", () => {
      tractMap.getCanvas().style.cursor = "pointer";
    });

    tractMap.on("mouseleave", "admin-fill", () => {
      tractMap.getCanvas().style.cursor = "";
      tractHoverPopup?.remove();
    });

    tractMap.on("mousemove", "admin-fill", (event) => {
      const feature = event.features?.[0];
      // MapLibre may expose numeric GeoJSON ids without their leading zero.
      // Normalize them back to their state/county FIPS width before lookup.
      const featureId = feature
        ? String(feature.id).padStart(state.geography === "state" ? 2 : 5, "0")
        : "";
      const row = adminMapRows.get(featureId);
      if (!row) return;

      if (!tractHoverPopup) {
        tractHoverPopup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
        });
      }

      const areaName = state.geography === "state"
        ? row.state_name
        : `${row.county_name}, ${row.state_name}`;

      tractHoverPopup
        .setLngLat(event.lngLat)
        .setHTML(
          `<strong>${escapeHtml(areaName)}</strong><br>` +
          `<strong>Year:</strong> ${escapeHtml(row.year)}<br>` +
          `<strong>${escapeHtml(variableLabel(state.variable))}:</strong> ` +
          `${escapeHtml(formatValue(row.value, state.variable))}`,
        )
        .addTo(tractMap);

      styleMapPopup();
    });

    tractMap.on("mousemove", "tract-fill", (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const geoid = String(feature.id).padStart(11, "0");
      const { value } = tractMap.getFeatureState({
        source: "us-tracts",
        sourceLayer: "tracts",
        // Use the same numeric ID used by refreshTractMapValues(). The 2010
        // PMTiles source can expose promoted GEOIDs as strings (for example,
        // "06007002200"), while feature state is stored under Number(GEOID).
        id: Number(geoid),
      });

      if (!tractHoverPopup) {
        tractHoverPopup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
        });
      }

      tractHoverPopup
        .setLngLat(event.lngLat)
        .setHTML(
          `<strong>GEOID:</strong> ${escapeHtml(geoid)}<br>` +
          `<strong>${escapeHtml(variableLabel(state.variable))}:</strong> ` +
          `${Number.isFinite(value) ? escapeHtml(formatValue(value, state.variable)) : escapeHtml(tractNoDataLabel())}`,
        )
        .addTo(tractMap);

      const popupContent = tractHoverPopup.getElement()?.querySelector(
        ".maplibregl-popup-content",
      );
      if (popupContent) {
        popupContent.style.background = "#0f172a";
        popupContent.style.color = "#f8fafc";
        popupContent.style.border = "1px solid #2563eb";
        popupContent.style.borderRadius = "8px";
        popupContent.style.boxShadow = "0 8px 22px rgba(0, 0, 0, 0.45)";
        popupContent.style.padding = "10px 12px";
        popupContent.style.fontSize = "13px";
      }
    });

    tractMap.on("moveend", loadVisibleTractStateData);
    tractMap.on("moveend", () => {
      if (drawnAreaActive) updateDrawSelection();
    });
    tractMap.on("idle", loadVisibleTractStateData);

    if (pendingAdminData && state.geography !== "tract") {
      renderAdminMap(pendingAdminData);
    }
  });
}

function renderTractMap() {
  pendingAdminData = null;
  initTractMap();

  els.mapChart.classList.add("hidden");
  els.tractMap.classList.remove("hidden");

  // MapLibre was hidden when initialized, so it needs one resize after showing.
  requestAnimationFrame(() => {
    tractMap.resize();
    ensureTractBoundaryVintage();
    setMapLayerVisibility(true);
    fitTractStateSelection();
    loadVisibleTractStateData();
    refreshTractMapValues();
  });
}

function fitTractStateSelection() {
  if (!tractMap || !countyLookup || state.countyKey !== "All counties") return;

  const fitKey = state.selectedStates.join("|");
  if (fitKey === lastTractStateFitKey) return;

  if (!state.selectedStates.length) {
    tractMap.jumpTo({ center: DEFAULT_MAP_CENTER, zoom: 3.5 });
    lastTractStateFitKey = fitKey;
    return;
  }

  const selected = new Set(state.selectedStates);
  const bounds = new maplibregl.LngLatBounds();

  countyLookup.forEach((county) => {
    const geoid = String(county.geoid).padStart(5, "0");
    const stateName = TRACT_STATES[geoid.slice(0, 2)];
    if (!selected.has(stateName) || !Array.isArray(county.bounds)) return;

    const [west, south, east, north] = county.bounds;
    bounds.extend([west, south]);
    bounds.extend([east, north]);
  });

  if (!bounds.isEmpty()) {
    tractMap.fitBounds(bounds, { padding: MAP_FIT_PADDING, maxZoom: 8, duration: 650 });
  }
  lastTractStateFitKey = fitKey;
}

function styleMapPopup() {
  const popupContent = tractHoverPopup?.getElement()?.querySelector(
    ".maplibregl-popup-content",
  );
  if (!popupContent) return;

  popupContent.style.background = "#0f172a";
  popupContent.style.color = "#f8fafc";
  popupContent.style.border = "1px solid #2563eb";
  popupContent.style.borderRadius = "8px";
  popupContent.style.boxShadow = "0 8px 22px rgba(0, 0, 0, 0.45)";
  popupContent.style.padding = "10px 12px";
  popupContent.style.fontSize = "13px";
}

function setMapLayerVisibility(showTracts) {
  if (!tractMap?.getSource("us-tracts")) return;

  ["tract-fill", "tract-outline"].forEach((layerId) => {
    if (tractMap.getLayer(layerId)) {
      tractMap.setLayoutProperty(layerId, "visibility", showTracts ? "visible" : "none");
    }
  });

  ["admin-fill", "admin-outline"].forEach((layerId) => {
    if (tractMap.getLayer(layerId)) {
      tractMap.setLayoutProperty(layerId, "visibility", showTracts ? "none" : "visible");
    }
  });
}

function adminFeatureId(feature) {
  const rawId = feature.properties?.GEOID ?? feature.id ?? "";
  return String(rawId).padStart(state.geography === "state" ? 2 : 5, "0");
}

function extendMapBounds(coordinates, bounds) {
  if (!Array.isArray(coordinates)) return;
  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    bounds.extend(coordinates);
    return;
  }
  coordinates.forEach((coordinate) => extendMapBounds(coordinate, bounds));
}

function renderAdminMap(data) {
  pendingAdminData = data;
  initTractMap();

  els.mapChart.classList.add("hidden");
  els.tractMap.classList.remove("hidden");

  requestAnimationFrame(() => tractMap.resize());

  const source = tractMap?.getSource("admin-areas");
  if (!source || !geojson) return;

  setMapLayerVisibility(false);
  tractMap.getSource("selected-county")?.setData({
    type: "FeatureCollection",
    features: [],
  });

  const mapGeojson = {
    ...geojson,
    features: geojson.features.map((feature) => ({
      ...feature,
      id: adminFeatureId(feature),
    })),
  };

  source.setData(mapGeojson);
  tractMap.removeFeatureState({ source: "admin-areas" });

  adminMapRows = new Map(data.map((row) => [String(row.GEOID), row]));
  data.forEach((row) => {
    tractMap.setFeatureState(
      { source: "admin-areas", id: String(row.GEOID) },
      { value: row.value },
    );
  });

  const values = data.map((row) => row.value).filter(Number.isFinite);
  if (!values.length) return;

  let [cmin, cmax] = mapColorRange();
  if (cmin === cmax) cmax = cmin + 1;

  const [start, low, middle, high, end] = tractColorRamp();
  const midpoint = cmin + (cmax - cmin) / 2;

  tractMap.setPaintProperty("admin-fill", "fill-color", [
    "interpolate",
    ["linear"],
    ["coalesce", ["feature-state", "value"], -1],
    -1, "#94a3b8",
    cmin, start,
    cmin + (cmax - cmin) * 0.25, low,
    midpoint, middle,
    cmin + (cmax - cmin) * 0.75, high,
    cmax, end,
  ]);

  addTractLegend();
  updateTractLegend(cmin, midpoint, cmax, [start, low, middle, high, end]);

  const fitKey = [
    state.geography,
    state.selectedStates.join(","),
    state.countyKey,
  ].join("|");

  if (fitKey !== lastAdminFitKey) {
    if (state.selectedStates.length || state.countyKey !== "All counties") {
      const visibleIds = new Set(data.map((row) => String(row.GEOID)));
      const bounds = new maplibregl.LngLatBounds();
      mapGeojson.features
        .filter((feature) => visibleIds.has(String(feature.id)))
        .forEach((feature) => extendMapBounds(feature.geometry?.coordinates, bounds));

      if (!bounds.isEmpty()) {
        tractMap.fitBounds(bounds, { padding: MAP_FIT_PADDING, maxZoom: 9, duration: 650 });
      }
    } else {
      tractMap.jumpTo({ center: DEFAULT_MAP_CENTER, zoom: 3.5 });
    }
    lastAdminFitKey = fitKey;
  }
}

function visibleTractStateFips() {
  if (!tractMap?.getSource("us-tracts")) return [];

  return [...new Set(
    tractMap
      .querySourceFeatures("us-tracts", { sourceLayer: "tracts" })
      .map((feature) => String(feature.id).padStart(11, "0").slice(0, 2))
      .filter(Boolean),
  )];
}

async function loadVisibleTractStateData() {
  if (state.geography !== "tract" || currentEventConfig()) return;

  const variable = state.variable;
  if (activeNationwideTractVariable === variable) return;
  if (nationwideTractLoadPromises.has(variable)) {
    return nationwideTractLoadPromises.get(variable);
  }

  const stateFipsList = Object.keys(TRACT_STATES);
  const nationwideLoad = (async () => {
    let completed = 0;

    for (
      let start = 0;
      start < stateFipsList.length;
      start += TRACT_DOWNLOAD_CONCURRENCY
    ) {
      const batch = stateFipsList.slice(
        start,
        start + TRACT_DOWNLOAD_CONCURRENCY,
      );
      await Promise.all(batch.map((stateFips) =>
        loadTractStateData(stateFips, { variable, updateUi: false })
      ));
      completed += batch.length;

      if (
        state.dataMode === "annual" &&
        state.geography === "tract" &&
        state.variable === variable
      ) {
        refreshTractMapValues();
        render();
        els.status.textContent =
          `Loading ${variableLabel(variable)} nationwide… ${completed} of ${stateFipsList.length} states loaded.`;
      }
    }

    if (
      state.dataMode === "annual" &&
      state.geography === "tract" &&
      state.variable === variable
    ) {
      activeNationwideTractVariable = variable;
      refreshTractMapValues();
      render();
    }
  })().finally(() => {
    nationwideTractLoadPromises.delete(variable);
  });

  nationwideTractLoadPromises.set(variable, nationwideLoad);
  return nationwideLoad;
}

async function loadTractStateData(
  stateFips,
  { variable = state.variable, updateUi = true } = {},
) {
  if (currentEventConfig()) return;
  const cacheKey = `${stateFips}|${variable}`;

  if (tractVariableRowsCache.has(cacheKey)) {
    tractRowsByState.set(stateFips, tractVariableRowsCache.get(cacheKey));
    if (updateUi) refreshTractMapValues();
    return;
  }
  if (tractLoadPromises.has(cacheKey)) return tractLoadPromises.get(cacheKey);

  const loadPromise = (async () => {
    try {
      if (updateUi) {
        els.status.textContent =
          `Loading ${variableLabel(variable)} for ${TRACT_STATES[stateFips] || "the selected state"} census tracts…`;
      }
      const [metadata, valueRows] = await Promise.all([
        loadTractMetadata(stateFips),
        loadParquet(`data/tract_variables/${stateFips}/${variable}.parquet`),
      ]);
      const normalizedRows = valueRows.map((row) => {
        const geoid = String(row.GEOID ?? "").padStart(11, "0");
        return normalizeRow({
          ...(metadata.get(geoid) || {}),
          GEOID: geoid,
          year: row.year,
          [variable]: row.value,
        });
      });

      tractVariableRowsCache.set(cacheKey, normalizedRows);
      if (state.dataMode === "annual" && state.variable === variable) {
        tractRowsByState.set(stateFips, normalizedRows);
        if (updateUi) {
          refreshTractMapValues();
          render();
        }
      }
      return normalizedRows;
    } catch (error) {
      console.error(`Could not load ${variable} tract data for state ${stateFips}.`, error);
      if (updateUi && state.dataMode === "annual" && state.variable === variable) {
        els.status.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
      }
      return [];
    } finally {
      tractLoadPromises.delete(cacheKey);
    }
  })();

  tractLoadPromises.set(cacheKey, loadPromise);
  return loadPromise;
}

async function loadTractMetadata(stateFips) {
  if (tractMetadataByState.has(stateFips)) {
    return tractMetadataByState.get(stateFips);
  }

  const rows = await loadParquet(
    `data/tract_variables/${stateFips}/metadata.parquet`,
  );
  const metadata = new Map(rows.map((row) => {
    const geoid = String(row.GEOID ?? "").padStart(11, "0");
    return [geoid, { ...row, GEOID: geoid }];
  }));
  tractMetadataByState.set(stateFips, metadata);
  return metadata;
}

function tractColorRamp() {
  const ramps = {
    Viridis: ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"],
    Plasma: ["#0d0887", "#7e03a8", "#cc4778", "#f89540", "#f0f921"],
    RdBu: ["#b2182b", "#ef8a62", "#f7f7f7", "#67a9cf", "#2166ac"],
    Cividis: ["#00204c", "#424e6c", "#7a7c78", "#b7b96a", "#fee838"],
    Blues: ["#eff6ff", "#bfdbfe", "#60a5fa", "#2563eb", "#172554"],
    Reds: ["#fff1f2", "#fecdd3", "#fb7185", "#dc2626", "#7f1d1d"],
    YlOrRd: ["#ffffcc", "#fed976", "#fd8d3c", "#e31a1c", "#800026"],
    Jet: ["#00007f", "#007fff", "#7fff7f", "#ff7f00", "#7f0000"],
  };

  return ramps[state.colorScale] || ramps.Viridis;
}

function refreshTractMapValues() {
  if (!tractMap?.getSource("us-tracts") || state.geography !== "tract") return;

  const values = [];

  // Feature state persists in MapLibre. Clear every tract we have previously
  // loaded before applying the newly selected variable/year, otherwise a tract
  // with no value can incorrectly keep a value from the previous variable.
  const loadedGeoids = new Set();
  tractMetadataByState.forEach((metadata) => {
    metadata.forEach((row, geoid) => loadedGeoids.add(geoid));
  });
  tractRowsByState.forEach((stateRows) => {
    stateRows.forEach((row) => loadedGeoids.add(String(row.GEOID).padStart(11, "0")));
  });
  loadedGeoids.forEach((geoid) => {
      tractMap.setFeatureState(
        {
          source: "us-tracts",
          sourceLayer: "tracts",
          id: Number(geoid),
        },
        { value: null },
      );
  });

  tractRowsByState.forEach((stateRows) => {
    const currentRows = stateRows.filter(
      (row) =>
        Number(row.year) === Number(state.year) &&
        rowMatchesStates(row) &&
        rowMatchesDrawnArea(row) &&
        validNumber(row[state.variable]),
    );

    currentRows.forEach((row) => {
      const value = toNumber(row[state.variable]);
      const geoid = String(row.GEOID).padStart(11, "0");

      tractMap.setFeatureState(
        {
          source: "us-tracts",
          sourceLayer: "tracts",
          id: Number(geoid),
        },
        { value },
      );

      values.push(value);
    });
  });

  if (!values.length) return;

  let [cmin, cmax] = colorRange(values, state.scaleMode);
  if (cmin === cmax) cmax = cmin + 1;

  const [start, low, middle, high, end] = tractColorRamp();
  const midpoint = cmin + (cmax - cmin) / 2;

  tractMap.setPaintProperty("tract-fill", "fill-color", [
    "interpolate",
    ["linear"],
    ["coalesce", ["feature-state", "value"], -1],
    -1, "#94a3b8",
    cmin, start,
    cmin + (cmax - cmin) * 0.25, low,
    midpoint, middle,
    cmin + (cmax - cmin) * 0.75, high,
    cmax, end,
  ]);

  updateTractLegend(cmin, midpoint, cmax, [start, low, middle, high, end]);

  const event = currentEventConfig();
  els.status.textContent = event
    ? `Showing ${event.name} ${event.loadingLabel || (event.kind === "nfip" ? "NFIP claims" : "structure damage")} for ${values.length.toLocaleString()} census tracts.`
    : `Loaded tract data for ${tractRowsByState.size} state${tractRowsByState.size === 1 ? "" : "s"}.`;
}

function addTractLegend() {
  if (tractLegend) return;

  tractLegend = document.createElement("div");
  tractLegend.style.cssText = [
    "min-width: 205px",
    "padding: 11px 10px",
    "border-radius: 6px",
    "background: rgba(15, 23, 42, 0.78)",
    "color: #e5e7eb",
    "font: 12px/1.35 system-ui, sans-serif",
    "box-shadow: 0 2px 10px rgba(0,0,0,.35)",
  ].join(";");

  tractMap.getContainer().appendChild(tractLegend);
  tractLegend.style.position = "absolute";
  tractLegend.style.right = "12px";
  tractLegend.style.bottom = "50px";
  tractLegend.style.zIndex = "2";
}

function updateTractLegend(minimum, midpoint, maximum, colors) {
  if (!tractLegend) return;

  tractLegend.innerHTML = `
    <strong style="display:block;margin-bottom:9px;font-size:22px;">${escapeHtml(variableLabel(state.variable))}</strong>
    <div style="display:flex;align-items:stretch;gap:10px;">
      <div style="width:70px;height:390px;border:1px solid rgba(255,255,255,.55);border-radius:3px;background:linear-gradient(to top, ${colors.join(", ")});"></div>
      <div style="height:390px;display:flex;flex-direction:column;justify-content:space-between;font-size:18px;font-weight:600;">        <span>${escapeHtml(formatValue(maximum, state.variable))}</span>
        <span>${escapeHtml(formatValue((maximum + midpoint) / 2, state.variable))}</span>
        <span>${escapeHtml(formatValue(midpoint, state.variable))}</span>
        <span>${escapeHtml(formatValue((minimum + midpoint) / 2, state.variable))}</span>
        <span>${escapeHtml(formatValue(minimum, state.variable))}</span>
      </div>
    </div>`;
}

window.addEventListener("resize", handleViewportResize);
window.addEventListener("orientationchange", handleViewportResize);

initializeTheme();
init();

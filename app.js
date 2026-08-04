const DATA_URL = "data/acs_county_year_fema_flood_risk.parquet";
const GEOJSON_URL = "data/us_counties_geojson.json";
const HYPARQUET_URL = "https://cdn.jsdelivr.net/npm/hyparquet@latest/+esm";

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
  high_school_grad_pct: "High School Graduate (%)",
  bachelors_or_higher_pct: "Bachelor's Degree or Higher (%)",
  median_home_value: "Median Home Value",
  median_gross_rent: "Median Gross Rent",
  median_year_built: "Median Year Built",
  vacancy_rate: "Vacancy Rate",
  owner_occupied_pct: "Homeownership Rate",
  renter_occupied_pct: "Renter Occupancy Rate",
  no_vehicle_pct: "Households Without a Vehicle (%)",
  fema_risk_score: "FEMA Overall Risk Score",
  fema_expected_annual_loss: "FEMA Expected Annual Loss",
  fema_social_vulnerability_score: "FEMA Social Vulnerability",
  fema_resilience_score: "FEMA Community Resilience",
  fema_flood_max_risk_score: "Combined Flood Risk Score",
  fema_flood_expected_annual_loss: "Combined Flood Expected Annual Loss",
  fema_coastal_flood_risk_score: "Coastal Flood Risk Score",
  fema_coastal_flood_expected_annual_loss: "Coastal Flood Expected Annual Loss",
  fema_inland_flood_risk_score: "Inland Flood Risk Score",
  fema_inland_flood_expected_annual_loss: "Inland Flood Expected Annual Loss",
  fema_wildfire_risk_score: "Wildfire Risk Score",
  fema_wildfire_expected_annual_loss: "Wildfire Expected Annual Loss",
  fema_wildfire_total_exposure: "Wildfire Total Exposure",
  fema_wildfire_annual_frequency: "Wildfire Annual Frequency",
  fema_wildfire_risk_value: "Wildfire Risk Value",
  fema_hurricane_risk_score: "Hurricane Risk Score",
  fema_hurricane_expected_annual_loss: "Hurricane Expected Annual Loss",
  fema_hurricane_annual_frequency: "Hurricane Annual Frequency",
  fema_earthquake_risk_score: "Earthquake Risk Score",
  fema_earthquake_expected_annual_loss: "Earthquake Expected Annual Loss",
  fema_earthquake_annual_frequency: "Earthquake Annual Frequency",
  fema_tornado_risk_score: "Tornado Risk Score",
  fema_tornado_expected_annual_loss: "Tornado Expected Annual Loss",
  fema_tornado_annual_frequency: "Tornado Annual Frequency",
  fema_hail_risk_score: "Hail Risk Score",
  fema_hail_expected_annual_loss: "Hail Expected Annual Loss",
  fema_hail_annual_frequency: "Hail Annual Frequency",
  fema_strong_wind_risk_score: "Strong Wind Risk Score",
  fema_strong_wind_expected_annual_loss: "Strong Wind Expected Annual Loss",
  fema_strong_wind_annual_frequency: "Strong Wind Annual Frequency",
  fema_drought_risk_score: "Drought Risk Score",
  fema_drought_expected_annual_loss: "Drought Expected Annual Loss",
  fema_drought_annual_frequency: "Drought Annual Frequency",
  fema_heat_wave_risk_score: "Heat Wave Risk Score",
  fema_heat_wave_expected_annual_loss: "Heat Wave Expected Annual Loss",
  fema_heat_wave_annual_frequency: "Heat Wave Annual Frequency",
};

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
    "themeToggle",
    "themeToggleIcon",
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
  ].map((id) => [id, document.getElementById(id)]),
);

let rows = [];
let geojson = null;
let variables = [];
let state = {
  variable: null,
  year: null,
  selectedStates: [],
  countyKey: "All counties",
  colorScale: "Viridis",
  scaleMode: "robust",
  activeTab: "map",
};
let availableYears = [];
let yearAnimationTimer = null;

const YEAR_ANIMATION_INTERVAL = 900;

const titleCase = (value) =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const variableLabel = (variable) => labels[variable] || titleCase(variable);

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
      "This measure is strongly influenced by county size and should be used cautiously when comparing counties.";
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

const VARIABLE_GROUP_ORDER = [
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
  if (/income|rent|home_value|expected_annual_loss|wage|salary|earnings/.test(variable)) {
    return "dollar";
  }
  if (/population|units|households|labor_force|employed|unemployed|exposure/.test(variable)) {
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

function normalizeRow(row) {
  const name = String(row.NAME ?? "");
  const nameParts = name.split(",").map((part) => part.trim());

  return {
    ...row,
    year: toNumber(row.year),
    GEOID: String(toPlainValue(row.GEOID) ?? "").padStart(5, "0"),
    county_name: row.county_name || nameParts[0] || "Unknown county",
    state_name: row.state_name || nameParts.at(-1) || "Unknown state",
  };
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

function filtered({ includeYear = true, includeCounty = true } = {}) {
  return rows
    .filter(
      (row) =>
        (!includeYear || Number(row.year) === Number(state.year)) &&
        rowMatchesStates(row) &&
        (!includeCounty ||
          state.countyKey === "All counties" ||
          row.GEOID === state.countyKey) &&
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
  return String(variable || "").startsWith("fema_");
}

function yearsForVariable(variable) {
  return [...new Set(
    rows
      .filter((row) => validNumber(row[variable]))
      .map((row) => Number(row.year))
      .filter(Number.isFinite),
  )].sort((a, b) => a - b);
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

function syncCountyOptions() {
  const countyRows = rows
    .filter(rowMatchesStates)
    .filter((row) => row.GEOID && row.county_name);

  const countyMap = new Map();

  countyRows.forEach((row) => {
    countyMap.set(
      row.GEOID,
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

function renderMap(data) {
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
      state.countyKey !== "All counties") &&
    !includesInsetState;

  const dark = isDarkMode();

  const trace = {
    type: "choropleth",
    geojson,
    locations: data.map((row) => row.GEOID),
    z: values,
    featureidkey: "id",

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
      row.county_name,
      row.state_name,
      row.year,
      formatValue(row.value, state.variable),
    ]),

    hovertemplate:
      "<b>%{customdata[0]}, %{customdata[1]}</b><br>" +
      "Year: %{customdata[2]}<br>" +
      `${variableLabel(state.variable)}: %{customdata[3]}` +
      "<extra></extra>",

    colorbar: {
      title: {
        text: axisTitle(state.variable),
        side: "right",
        font: {
          color: dark ? "#e5e7eb" : "#111827",
        },
      },

      tickfont: {
        color: dark ? "#d1d5db" : "#374151",
      },

      tickformat: colorbarTickFormat(state.variable),

      ticksuffix:
        valueKind(state.variable) === "percent"
          ? "%"
          : "",

      exponentformat: "SI",
      separatethousands: true,
      thickness: 18,
      len: 0.75,

      outlinecolor: dark ? "#4b5563" : "#d1d5db",
    },
  };

  Plotly.react(
    els.mapChart,
    [trace],
    {
      ...plotTheme(),

      title: {
        text: `${variableLabel(state.variable)} by County`,
        x: 0.01,

        font: {
          color: dark ? "#f3f4f6" : "#111827",
        },
      },

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
        l: 10,
        r: 10,
        t: 60,
        b: 10,
      },

      height: 650,

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
        state.variable,
        state.year,
        state.selectedStates.join(","),
        state.countyKey,
        state.colorScale,
        state.scaleMode,
        dark ? "dark" : "light",
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

  if (state.countyKey !== "All counties") {
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
          size: 28,
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
          size: 20,
        },
      },

      tickfont: {
        size: 16,
      },

      dtick: 1,

      gridcolor: isDarkMode() ? "#374151" : "#e5e7eb",
      zerolinecolor: isDarkMode() ? "#4b5563" : "#d1d5db",
    },

    yaxis: {
      title: {
        text: axisTitle(state.variable),
        font: {
          size: 20,
        },
        standoff: 28,
      },

      tickfont: {
        size: 16,
      },

      automargin: true,
      tickformat: colorbarTickFormat(state.variable),

      gridcolor: isDarkMode() ? "#374151" : "#e5e7eb",
      zerolinecolor: isDarkMode() ? "#4b5563" : "#d1d5db",
    },
        hovermode: "x unified",

        margin: {
          l: 65,
          r: 20,
          t: 60,
          b: 90,
        },

        height: 460,
      },
      {
        responsive: true,
        displaylogo: false,
      },
    );
}

function tableHtml(data) {
  return `<table class="dash-table"><thead><tr><th>County</th><th>State</th><th>Value</th></tr></thead><tbody>${data
    .map(
      (row) =>
        `<tr><td>${row.county_name}</td><td>${row.state_name}</td><td>${formatValue(
          row.value,
          state.variable,
        )}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

function renderStats(data) {
  const values = data.map((row) => row.value);
  const cards = [
    ["Counties", values.length.toLocaleString()],
    ["Average", formatValue(mean(values), state.variable)],
    ["Median", formatValue(median(values), state.variable)],
    ["Minimum", formatValue(Math.min(...values), state.variable)],
    ["Maximum", formatValue(Math.max(...values), state.variable)],
    ["Std. Dev.", formatValue(stddev(values), state.variable)],
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
  const isFemaVariable = state.variable?.startsWith("fema_");
  const trendButton = document.querySelector(
    '.dashboard-tab[data-tab="trend"]',
  );

  trendButton.disabled = isFemaVariable;
  trendButton.setAttribute("aria-disabled", String(isFemaVariable));

  trendButton.title = isFemaVariable
    ? "Time-series data is unavailable for FEMA variables."
    : "";

  if (isFemaVariable && state.activeTab === "trend") {
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
    state.countyKey === "All counties"
      ? null
      : rows.find((row) => row.GEOID === state.countyKey);
  const area = countyRow
    ? `${countyRow.county_name}, ${countyRow.state_name}`
    : selectedStates
      ? selectedStates.length === 1
        ? selectedStates[0]
        : `${selectedStates.length} selected states`
      : "United States";

  els.dashboardTitle.textContent = `${variableLabel(state.variable)} in ${area} (${state.year})`;
  els.dashboardMeta.innerHTML =
    `<b>Variable:</b> ${variableLabel(state.variable)} &nbsp; | &nbsp; ` +
    `<b>Year:</b> ${state.year} &nbsp; | &nbsp; ` +
    `<b>Area:</b> ${area} &nbsp; | &nbsp; ` +
    `<b>Rows:</b> ${data.length.toLocaleString()}`;

  renderVisibility();

  if (!data.length) {
    els.status.innerHTML = '<div class="error">No data matches these filters.</div>';
    Plotly.purge(els.mapChart);
    Plotly.purge(els.trendChart);
    els.summaryCards.innerHTML = "";
    els.topTable.innerHTML = "";
    els.bottomTable.innerHTML = "";
    return;
  }

  els.status.textContent = `Showing ${data.length.toLocaleString()} county records.`;
  if (state.activeTab === "map") renderMap(data);
  if (state.activeTab === "trend") renderTrend();
  if (state.activeTab === "stats") renderStats(data);
}

function readForm() {
  const previousVariable = state.variable;

  state.variable = els.variableSelect.value;
  state.selectedStates = getSelectedValues(els.stateSelect);
  state.countyKey = els.countySelect.value;
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

async function loadParquet() {
  els.status.textContent = "Downloading Parquet data…";

  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(
      `Could not load ${DATA_URL}. Put the Parquet file inside the dashboard data folder.`,
    );
  }

  const parquetBuffer = await response.arrayBuffer();
  els.status.textContent = "Reading Parquet data in the browser…";

  const { parquetReadObjects } = await import(HYPARQUET_URL);
  return parquetReadObjects({ file: parquetBuffer });
}

async function init() {
  try {
    const [parquetRows, geoResponse] = await Promise.all([
      loadParquet(),
      fetch(GEOJSON_URL),
    ]);

    if (!geoResponse.ok) {
      throw new Error(
        `Could not load ${GEOJSON_URL}. Put the GeoJSON file inside the dashboard data folder.`,
      );
    }

    geojson = await geoResponse.json();
    rows = parquetRows.map(normalizeRow);

    if (!rows.length) {
      throw new Error("The Parquet file loaded, but it contained no rows.");
    }

    variables = Object.keys(labels)
      .filter((column) =>
        Object.prototype.hasOwnProperty.call(rows[0], column),
      )
      .filter((column) =>
        rows.some((row) => validNumber(row[column])),
      )
      .sort((a, b) =>
        variableLabel(a).localeCompare(variableLabel(b)),
      );

    const states = [
      ...new Set(
        rows
          .map((row) => row.state_name)
          .filter(Boolean),
      ),
    ].sort();

    if (!variables.length) {
      throw new Error(
        "No numeric dashboard variables were found in the Parquet file.",
      );
    }

    state.variable = variables.includes("total_population")
      ? "total_population"
      : variables[0];

    state.selectedStates = [];
    state.countyKey = "All counties";
    state.colorScale = "Viridis";
    state.scaleMode = "robust";
    state.activeTab = "map";

    setGroupedVariableOptions(
      els.variableSelect,
      variables,
      state.variable,
    );

    setMultiSelectOptions(
      els.stateSelect,
      states,
      state.selectedStates,
    );

    syncYearAnimationControls({
      preserveYear: false,
    });

    syncCountyOptions();
    render();
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
});


els.filters.addEventListener("submit", (event) => {
  event.preventDefault();

  stopYearAnimation();
  readForm();
  syncCountyOptions();
  state.countyKey = els.countySelect.value;
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

  setGroupedVariableOptions(
    els.variableSelect,
    variables,
    state.variable,
  );

  syncYearAnimationControls({
    preserveYear: false,
  });

  renderStatePicker();

  els.colorScaleSelect.value = state.colorScale;
  els.scaleModeSelect.value = state.scaleMode;

  syncCountyOptions();
  render();
});

els.themeToggle.addEventListener("click", () => {
  setTheme(isDarkMode() ? "light" : "dark");
});

initializeTheme();
init();

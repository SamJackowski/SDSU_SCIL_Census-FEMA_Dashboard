/* =====================================================================
   stats-explorer.js
   Interactive analytics for the Statistics tab:
     - Distribution explorer (histogram, percentiles, concentration, threshold)
     - Sortable / filterable data table with CSV export
     - Event comparison (NFIP claims across events, optional constant dollars)

   The top half of this file is pure functions (no DOM) so they can be unit
   tested in Node. The bottom half wires them to the page.
   ===================================================================== */

/* ---------------------------------------------------------------------
   Pure statistics helpers
   --------------------------------------------------------------------- */

export const finiteNumbers = (values) =>
  values.filter((value) => typeof value === "number" && Number.isFinite(value));

export const sumOf = (values) => values.reduce((total, value) => total + value, 0);

/** Min and max without spreading (spreading very large arrays can overflow the call stack). */
export function extent(values) {
  let low = Infinity;
  let high = -Infinity;
  for (const value of values) {
    if (value < low) low = value;
    if (value > high) high = value;
  }
  return [low, high];
}

export function quantileSorted(sorted, q) {
  if (!sorted.length) return NaN;
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const remainder = position - base;
  return sorted[base + 1] === undefined
    ? sorted[base]
    : sorted[base] + remainder * (sorted[base + 1] - sorted[base]);
}

export function medianOf(values) {
  return quantileSorted([...values].sort((a, b) => a - b), 0.5);
}

/** Gini coefficient for non-negative values. 0 = perfectly even, ->1 = one location holds everything. */
export function giniCoefficient(values) {
  const sorted = finiteNumbers(values).filter((value) => value >= 0).sort((a, b) => a - b);
  const count = sorted.length;
  const total = sumOf(sorted);
  if (count < 2 || total <= 0) return NaN;
  let weighted = 0;
  sorted.forEach((value, index) => {
    weighted += (index + 1) * value;
  });
  return (2 * weighted) / (count * total) - (count + 1) / count;
}

/** Lorenz curve points (cumulative share of locations vs. cumulative share of total), downsampled. */
export function lorenzPoints(values, maxPoints = 200) {
  const sorted = finiteNumbers(values).filter((value) => value >= 0).sort((a, b) => a - b);
  const count = sorted.length;
  const total = sumOf(sorted);
  if (!count || total <= 0) return { x: [], y: [] };
  const step = Math.max(1, Math.ceil(count / maxPoints));
  const x = [0];
  const y = [0];
  let cumulative = 0;
  sorted.forEach((value, index) => {
    cumulative += value;
    if ((index + 1) % step === 0 || index === count - 1) {
      x.push(((index + 1) / count) * 100);
      y.push((cumulative / total) * 100);
    }
  });
  return { x, y };
}

/** Share of the total (0-100) held by the largest `fraction` of locations (at least one location). */
export function topShare(values, fraction) {
  const sorted = finiteNumbers(values).filter((value) => value >= 0).sort((a, b) => b - a);
  const total = sumOf(sorted);
  if (!sorted.length || total <= 0) return NaN;
  const take = Math.min(sorted.length, Math.max(1, Math.ceil(sorted.length * fraction)));
  return (sumOf(sorted.slice(0, take)) / total) * 100;
}

export function topNShare(values, n) {
  const sorted = finiteNumbers(values).filter((value) => value >= 0).sort((a, b) => b - a);
  const total = sumOf(sorted);
  if (!sorted.length || total <= 0) return NaN;
  return (sumOf(sorted.slice(0, n)) / total) * 100;
}

export function skewness(values) {
  const count = values.length;
  if (count < 3) return NaN;
  const average = sumOf(values) / count;
  const variance = sumOf(values.map((value) => (value - average) ** 2)) / (count - 1);
  const deviation = Math.sqrt(variance);
  if (!deviation) return 0;
  const cubed = sumOf(values.map((value) => ((value - average) / deviation) ** 3));
  return (count / ((count - 1) * (count - 2))) * cubed;
}

export const PERCENTILE_LEVELS = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99];

/** Full descriptive summary of an array of numbers. */
export function describe(rawValues) {
  const values = finiteNumbers(rawValues);
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  if (!count) return { n: 0 };

  const total = sumOf(sorted);
  const average = total / count;
  const deviation = count > 1
    ? Math.sqrt(sumOf(sorted.map((value) => (value - average) ** 2)) / (count - 1))
    : 0;
  const q1 = quantileSorted(sorted, 0.25);
  const q3 = quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const upperFence = q3 + 1.5 * iqr;
  const lowerFence = q1 - 1.5 * iqr;

  return {
    n: count,
    sum: total,
    mean: average,
    median: quantileSorted(sorted, 0.5),
    sd: deviation,
    cv: average ? deviation / Math.abs(average) : NaN,
    skew: skewness(sorted),
    min: sorted[0],
    max: sorted[count - 1],
    q1,
    q3,
    iqr,
    upperFence,
    lowerFence,
    upperOutliers: sorted.filter((value) => value > upperFence).length,
    lowerOutliers: sorted.filter((value) => value < lowerFence).length,
    zeros: sorted.filter((value) => value === 0).length,
    nonNegative: sorted[0] >= 0,
    percentiles: PERCENTILE_LEVELS.map((level) => ({
      level,
      value: quantileSorted(sorted, level),
    })),
  };
}

/** How many values exceed a threshold and what share of the total they hold. */
export function thresholdSummary(rawValues, threshold) {
  const values = finiteNumbers(rawValues);
  const above = values.filter((value) => value > threshold);
  const total = sumOf(values);
  return {
    n: values.length,
    countAbove: above.length,
    pctAbove: values.length ? (above.length / values.length) * 100 : NaN,
    shareOfTotal:
      values.length && values.every((value) => value >= 0) && total > 0
        ? (sumOf(above) / total) * 100
        : NaN,
  };
}

/* ---------------------------------------------------------------------
   Event comparison helpers
   --------------------------------------------------------------------- */

/** CPI-U, U.S. city average, annual averages (1982-84 = 100). Edit here if you want another index. */
export const CPI_U_ANNUAL = {
  2012: 229.594,
  2016: 240.007,
  2017: 245.12,
  2018: 251.107,
  2019: 255.657,
  2020: 258.811,
  2021: 270.97,
  2022: 292.655,
};
export const CONSTANT_DOLLAR_YEAR = 2022;

export function inflationFactor(year, baseYear = CONSTANT_DOLLAR_YEAR) {
  const from = CPI_U_ANNUAL[year];
  const to = CPI_U_ANNUAL[baseYear];
  return from && to ? to / from : 1;
}

const finiteOrZero = (value) => (Number.isFinite(value) ? value : 0);

/**
 * Summarise one event's tract-level NFIP rows.
 * rows: [{ geoid, claims, paid, avgPay, perThousand, perCapita, building, contents, icc }] (plain numbers)
 * opts.minClaims: only tracts with at least this many claims are included
 * opts.factor: multiplier applied to every dollar field (inflation adjustment)
 */
export function summarizeEvent(rows, { minClaims = 1, factor = 1 } = {}) {
  const kept = rows.filter(
    (row) => Number.isFinite(row.claims) && row.claims >= minClaims && Number.isFinite(row.paid),
  );

  const paid = kept.map((row) => row.paid * factor);
  const totalPaid = sumOf(paid);
  const totalClaims = sumOf(kept.map((row) => row.claims));
  const building = sumOf(kept.map((row) => finiteOrZero(row.building) * factor));
  const contents = sumOf(kept.map((row) => finiteOrZero(row.contents) * factor));
  const icc = sumOf(kept.map((row) => finiteOrZero(row.icc) * factor));
  const components = building + contents + icc;
  const pct = (part) => (components > 0 ? (part / components) * 100 : NaN);

  const severities = kept
    .filter((row) => Number.isFinite(row.avgPay) && row.avgPay > 0)
    .map((row) => row.avgPay * factor);
  const perThousand = finiteNumbers(kept.map((row) => row.perThousand));
  const perCapita = finiteNumbers(kept.map((row) => row.perCapita * factor));
  const sortedPaid = [...paid].filter((value) => value >= 0).sort((a, b) => a - b);

  let largest = null;
  kept.forEach((row) => {
    if (!largest || row.paid > largest.paid) largest = row;
  });

  return {
    tracts: kept.length,
    totalClaims,
    totalPaid,
    avgPayment: totalClaims ? totalPaid / totalClaims : NaN,
    medianTractSeverity: severities.length ? medianOf(severities) : NaN,
    medianClaimsPer1000: perThousand.length ? medianOf(perThousand) : NaN,
    medianPaidPerCapita: perCapita.length ? medianOf(perCapita) : NaN,
    p90Paid: quantileSorted(sortedPaid, 0.9),
    p99Paid: quantileSorted(sortedPaid, 0.99),
    top10Share: topNShare(paid, 10),
    top1PctShare: topShare(paid, 0.01),
    gini: giniCoefficient(paid),
    buildingPct: pct(building),
    contentsPct: pct(contents),
    iccPct: pct(icc),
    largestTract: largest ? { geoid: largest.geoid, paid: largest.paid * factor } : null,
    severities,
    lorenz: lorenzPoints(paid),
  };
}

/* ---------------------------------------------------------------------
   CSV helpers
   --------------------------------------------------------------------- */

export function csvCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(headers, tableRows) {
  return [headers, ...tableRows].map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const safeFilePart = (text) => String(text).replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");

/* ---------------------------------------------------------------------
   Page wiring
   ---------------------------------------------------------------------
   ctx supplies everything that lives in app.js:
     getState, getVariables, variableLabel, formatValue, escapeHtml,
     isDarkMode, plotTheme, geographyPlural, eventConfigs, parseCsv,
     getCountyNames, tractStates, isMobile
*/

const EVENT_PALETTE = [
  "#2563eb", "#f59e0b", "#14b8a6", "#ef4444", "#8b5cf6",
  "#84cc16", "#ec4899", "#0ea5e9", "#f97316",
];

const currencyFull = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const currencyCompact = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatByKind(kind, value) {
  if (!Number.isFinite(value)) return "—";
  switch (kind) {
    case "dollar": return currencyFull.format(value);
    case "dollarBig": return currencyCompact.format(value);
    case "count": return Math.round(value).toLocaleString();
    case "percent": return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
    case "score": return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
    default: return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

const EVENT_METRICS = [
  { key: "totalPaid", label: "Total paid losses", kind: "dollarBig" },
  { key: "totalClaims", label: "Total claims", kind: "count" },
  { key: "avgPayment", label: "Avg. payment per claim", kind: "dollar" },
  { key: "tracts", label: "Tracts with claims", kind: "count" },
  { key: "medianTractSeverity", label: "Median tract avg. payment", kind: "dollar" },
  { key: "medianClaimsPer1000", label: "Median claims per 1,000 residents", kind: "number" },
  { key: "medianPaidPerCapita", label: "Median paid per capita", kind: "dollar" },
  { key: "p90Paid", label: "90th percentile tract paid loss", kind: "dollarBig" },
  { key: "p99Paid", label: "99th percentile tract paid loss", kind: "dollarBig" },
  { key: "top10Share", label: "Top-10 tract share of losses", kind: "percent" },
  { key: "top1PctShare", label: "Top 1% of tracts' share of losses", kind: "percent" },
  { key: "gini", label: "Gini (loss concentration)", kind: "score" },
  { key: "buildingPct", label: "Building share of payments", kind: "percent" },
  { key: "contentsPct", label: "Contents share of payments", kind: "percent" },
  { key: "iccPct", label: "ICC share of payments", kind: "percent" },
];

export function createStatsExplorer(ctx) {
  const $ = (id) => document.getElementById(id);
  const Plot = () => window.Plotly;

  const summaryCardsHtml = (cards) =>
    cards
      .map(
        ([label, value]) =>
          `<div class="summary-card"><div class="summary-label">${ctx.escapeHtml(label)}</div><div class="summary-value">${value}</div></div>`,
      )
      .join("");

  function axisBase() {
    const dark = ctx.isDarkMode();
    return {
      automargin: true,
      gridcolor: dark ? "#374151" : "#e5e7eb",
      zerolinecolor: dark ? "#4b5563" : "#d1d5db",
    };
  }

  const plotConfig = { responsive: true, displaylogo: false };

  /* ============================ Distribution ============================ */

  let lastDistributionData = [];

  function renderDistribution(data = lastDistributionData) {
    lastDistributionData = data;
    const state = ctx.getState();
    const variable = state.variable;
    const fmt = (value) => ctx.formatValue(value, variable);
    const values = data.map((row) => row.value).filter(Number.isFinite);

    $("distBinsValue").textContent = $("distBins").value;

    if (!values.length) {
      $("distSummary").innerHTML = "";
      $("distPercentiles").innerHTML = "";
      $("distConcentration").innerHTML = "";
      $("distThresholdResult").textContent = "";
      $("distNote").textContent = "No values match the current filters.";
      Plot().purge($("distChart"));
      return;
    }

    const stats = describe(values);
    $("distSummary").innerHTML = summaryCardsHtml([
      ["Observations", stats.n.toLocaleString()],
      ["Mean", fmt(stats.mean)],
      ["Median", fmt(stats.median)],
      ["Std. dev.", fmt(stats.sd)],
      ["Coeff. of variation", Number.isFinite(stats.cv) ? stats.cv.toFixed(2) : "—"],
      ["Skewness", Number.isFinite(stats.skew) ? stats.skew.toFixed(2) : "—"],
      ["IQR", fmt(stats.iqr)],
      [
        "Upper outliers",
        `${stats.upperOutliers.toLocaleString()} <span class="summary-sub">(${((stats.upperOutliers / stats.n) * 100).toFixed(1)}%)</span>`,
      ],
    ]);

    // Histogram
    const wantLog = $("distScale").value === "log";
    const trim = $("distRange").value === "trim";
    const bins = Number($("distBins").value) || 30;
    const notes = [];

    let plotValues = values;
    const useLog = wantLog && values.some((value) => value > 0);
    if (useLog) {
      const dropped = values.filter((value) => value <= 0).length;
      plotValues = values.filter((value) => value > 0);
      if (dropped) notes.push(`${dropped.toLocaleString()} zero or negative values are not shown on the log scale.`);
    } else if (wantLog) {
      notes.push("Log scale needs positive values; showing a linear scale instead.");
    }
    if (trim && plotValues.length > 20) {
      const sorted = [...plotValues].sort((a, b) => a - b);
      const low = quantileSorted(sorted, 0.01);
      const high = quantileSorted(sorted, 0.99);
      const before = plotValues.length;
      plotValues = plotValues.filter((value) => value >= low && value <= high);
      notes.push(`Histogram trimmed to the 1st–99th percentile (${(before - plotValues.length).toLocaleString()} values hidden). Statistics use all values.`);
    }

    const transform = useLog ? Math.log10 : (value) => value;
    const xValues = plotValues.map(transform);
    const dark = ctx.isDarkMode();
    const lineColor = dark ? "#e5e7eb" : "#111827";
    const [xLow, xHigh] = extent(xValues);
    const inRange = (value) => {
      if (!plotValues.length) return false;
      const t = transform(value);
      return Number.isFinite(t) && t >= xLow && t <= xHigh;
    };

    const shapes = [];
    const annotations = [];
    [["Median", stats.median, "#f59e0b"], ["Mean", stats.mean, "#ef4444"]].forEach(([name, value, color], index) => {
      if (!inRange(value)) return;
      const x = transform(value);
      shapes.push({
        type: "line", x0: x, x1: x, yref: "paper", y0: 0, y1: 1,
        line: { color, width: 2, dash: "dash" },
      });
      annotations.push({
        x, yref: "paper", y: 1 - index * 0.07, text: `${name}: ${fmt(value)}`,
        showarrow: false, xanchor: "left", font: { color, size: 12 }, bgcolor: dark ? "#111827" : "#ffffff",
      });
    });

    const xaxis = { ...axisBase(), title: { text: ctx.axisTitle(variable) } };
    if (useLog && xValues.length) {
      const low = Math.floor(xLow);
      const high = Math.ceil(xHigh);
      const tickvals = [];
      for (let power = low; power <= high; power += 1) tickvals.push(power);
      xaxis.tickvals = tickvals;
      xaxis.ticktext = tickvals.map((power) => fmt(10 ** power));
      xaxis.title = { text: `${ctx.axisTitle(variable)} (log scale)` };
    }

    Plot().react(
      $("distChart"),
      [{
        type: "histogram",
        x: xValues,
        nbinsx: bins,
        marker: { color: "#2563eb", line: { color: dark ? "#111827" : "#ffffff", width: 1 } },
        hovertemplate: useLog ? "Count: %{y}<extra></extra>" : "Range: %{x}<br>Count: %{y}<extra></extra>",
      }],
      {
        ...ctx.plotTheme(),
        title: { text: `Distribution of ${ctx.variableLabel(variable)}`, x: 0.01, font: { size: ctx.isMobile() ? 16 : 20 } },
        xaxis,
        yaxis: { ...axisBase(), title: { text: `Number of ${ctx.geographyPlural().toLowerCase()}` } },
        shapes,
        annotations,
        margin: { l: 70, r: 20, t: 60, b: 70 },
        height: ctx.isMobile() ? 380 : 450,
        bargap: 0.02,
      },
      plotConfig,
    );
    $("distNote").textContent = notes.join(" ");

    // Percentiles
    $("distPercentiles").innerHTML =
      `<table class="dash-table"><thead><tr><th>Percentile</th><th>Value</th></tr></thead><tbody>` +
      stats.percentiles
        .map((p) => `<tr><td>${Math.round(p.level * 100)}th</td><td>${fmt(p.value)}</td></tr>`)
        .join("") +
      `<tr><td>Min</td><td>${fmt(stats.min)}</td></tr><tr><td>Max</td><td>${fmt(stats.max)}</td></tr>` +
      `</tbody></table>`;

    // Concentration
    const plural = ctx.geographyPlural().toLowerCase();
    if (stats.nonNegative && stats.sum > 0) {
      const gini = giniCoefficient(values);
      $("distConcentration").innerHTML =
        `<table class="dash-table"><thead><tr><th>Group</th><th>Share of total</th></tr></thead><tbody>` +
        [0.01, 0.05, 0.1, 0.25]
          .map((fraction) => `<tr><td>Top ${Math.round(fraction * 100)}% of ${ctx.escapeHtml(plural)}</td><td>${topShare(values, fraction).toFixed(1)}%</td></tr>`)
          .join("") +
        `<tr><td>Gini coefficient</td><td>${Number.isFinite(gini) ? gini.toFixed(3) : "—"}</td></tr></tbody></table>` +
        `<div class="subtle small-note">Higher shares in the top groups mean the total is driven by a few ${ctx.escapeHtml(plural)}. Gini runs from 0 (even) to 1 (one location holds it all).</div>`;
    } else {
      $("distConcentration").innerHTML =
        `<div class="subtle">Concentration measures are shown only for variables with no negative values and a positive total.</div>`;
    }

    renderThreshold();
  }

  function renderThreshold() {
    const state = ctx.getState();
    const raw = $("distThreshold").value.trim();
    const target = $("distThresholdResult");
    if (!raw) {
      target.textContent = "Enter a value to see how many locations exceed it.";
      return;
    }
    const threshold = Number(raw.replaceAll(",", ""));
    if (!Number.isFinite(threshold)) {
      target.textContent = "Enter a number, for example 50000.";
      return;
    }
    const values = lastDistributionData.map((row) => row.value).filter(Number.isFinite);
    const result = thresholdSummary(values, threshold);
    const plural = ctx.geographyPlural().toLowerCase();
    let text = `${result.countAbove.toLocaleString()} of ${result.n.toLocaleString()} ${plural} (${result.pctAbove.toFixed(1)}%) are above ${ctx.formatValue(threshold, state.variable)}.`;
    if (Number.isFinite(result.shareOfTotal)) text += ` Together they account for ${result.shareOfTotal.toFixed(1)}% of the total.`;
    target.textContent = text;
  }

  /* ============================== Data table ============================== */

  const table = {
    search: "",
    min: "",
    max: "",
    page: 0,
    pageSize: 25,
    sortKey: "value",
    sortDir: -1,
    extra: [],
  };
  let lastTableData = [];

  function tableColumns() {
    const state = ctx.getState();
    let location;
    if (state.geography === "state") {
      location = [{ key: "state_name", label: "State" }];
    } else if (state.geography === "tract") {
      location = [
        { key: "tract_name", label: "Census tract" },
        { key: "county_name", label: "County" },
        { key: "state_name", label: "State" },
      ];
    } else {
      location = [
        { key: "county_name", label: "County" },
        { key: "state_name", label: "State" },
      ];
    }
    return [
      ...location,
      { key: "GEOID", label: "GEOID" },
      { key: "value", label: ctx.variableLabel(state.variable), numeric: true, variable: state.variable },
      ...table.extra.map((variable) => ({
        key: variable, label: ctx.variableLabel(variable), numeric: true, variable, removable: true,
      })),
    ];
  }

  function tableRows(data, columns) {
    const search = table.search.trim().toLowerCase();
    const min = table.min === "" ? -Infinity : Number(table.min);
    const max = table.max === "" ? Infinity : Number(table.max);
    const textKeys = columns.filter((column) => !column.numeric).map((column) => column.key);

    const filteredRows = data.filter((row) => {
      if (row.value < min || row.value > max) return false;
      if (!search) return true;
      return textKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(search));
    });

    const sortColumn = columns.find((column) => column.key === table.sortKey) || columns.find((c) => c.key === "value");
    const direction = table.sortDir;
    const numericValue = (row) => {
      const number = Number(row[sortColumn.key]);
      return Number.isFinite(number) ? number : null;
    };
    return filteredRows.sort((a, b) => {
      if (sortColumn.numeric) {
        const av = numericValue(a);
        const bv = numericValue(b);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return (av - bv) * direction;
      }
      return String(a[sortColumn.key] ?? "").localeCompare(String(b[sortColumn.key] ?? ""), undefined, { numeric: true }) * direction;
    });
  }

  function syncExtraColumnOptions(data) {
    const select = $("tableAddColumn");
    const state = ctx.getState();
    const available = new Set(ctx.getVariables());
    table.extra = table.extra.filter((variable) => available.has(variable) && variable !== state.variable);

    const sample = data[0] || {};
    const candidates = ctx.getVariables()
      .filter((variable) => variable !== state.variable && !table.extra.includes(variable) && variable in sample)
      .sort((a, b) => ctx.variableLabel(a).localeCompare(ctx.variableLabel(b)));

    select.innerHTML =
      `<option value="">${candidates.length ? "Add a column…" : "No other variables loaded"}</option>` +
      candidates.map((variable) => `<option value="${ctx.escapeHtml(variable)}">${ctx.escapeHtml(ctx.variableLabel(variable))}</option>`).join("");
    select.disabled = !candidates.length;

    $("tableColumnChips").innerHTML = table.extra
      .map(
        (variable) =>
          `<button type="button" class="state-chip" data-remove-column="${ctx.escapeHtml(variable)}" title="Remove column">${ctx.escapeHtml(ctx.variableLabel(variable))} ×</button>`,
      )
      .join("");
  }

  function renderTable(data = lastTableData) {
    lastTableData = data;
    const state = ctx.getState();
    syncExtraColumnOptions(data);

    const columns = tableColumns();
    const sorted = tableRows(data, columns);
    const pages = Math.max(1, Math.ceil(sorted.length / table.pageSize));
    table.page = Math.min(table.page, pages - 1);
    const start = table.page * table.pageSize;
    const pageRows = sorted.slice(start, start + table.pageSize);

    const head = columns
      .map((column) => {
        const active = column.key === table.sortKey;
        const arrow = active ? (table.sortDir > 0 ? "▲" : "▼") : "";
        const ariaSort = active ? (table.sortDir > 0 ? "ascending" : "descending") : "none";
        return `<th class="sortable${column.numeric ? " num" : ""}" data-sort="${ctx.escapeHtml(column.key)}" aria-sort="${ariaSort}">${ctx.escapeHtml(column.label)} <span class="sort-arrow">${arrow}</span></th>`;
      })
      .join("");

    const body = pageRows
      .map(
        (row) =>
          `<tr>${columns
            .map((column) =>
              column.numeric
                ? `<td class="num">${ctx.formatValue(row[column.key], column.variable)}</td>`
                : `<td>${ctx.escapeHtml(row[column.key] ?? "")}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");

    $("tableWrap").innerHTML = pageRows.length
      ? `<table class="dash-table explorer-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
      : `<div class="subtle">No rows match these filters.</div>`;

    $("tableCount").textContent =
      `${sorted.length.toLocaleString()} of ${data.length.toLocaleString()} ${ctx.geographyPlural().toLowerCase()}`;
    $("tablePageLabel").textContent = `Page ${table.page + 1} of ${pages.toLocaleString()}`;
    $("tablePrev").disabled = table.page === 0;
    $("tableNext").disabled = table.page >= pages - 1;
    $("tableExport").dataset.rows = String(sorted.length);
    $("tableExport").disabled = !sorted.length;

    // Keep the current variable label fresh in the min/max placeholders.
    $("tableMin").placeholder = `Min ${ctx.variableLabel(state.variable)}`;
    $("tableMax").placeholder = `Max ${ctx.variableLabel(state.variable)}`;
  }

  function exportTable() {
    const state = ctx.getState();
    const columns = tableColumns();
    const sorted = tableRows(lastTableData, columns);
    const csv = toCsv(
      columns.map((column) => column.label),
      sorted.map((row) =>
        columns.map((column) => (column.numeric ? Number(row[column.key]) : row[column.key])),
      ),
    );
    downloadCsv(`${safeFilePart(state.variable)}_${state.year}_${state.geography}.csv`, csv);
  }

  /* ============================ Event comparison ============================ */

  const eventState = {
    built: false,
    sortKey: "totalPaid",
    sortDir: -1,
  };
  const eventDataCache = new Map();
  let eventRenderToken = 0;
  let lastEventSummaries = [];

  const nfipEvents = () =>
    Object.values(ctx.eventConfigs)
      .filter((event) => event.kind === "nfip")
      .sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));

  const eventLabel = (event) => `${event.name} (${event.year})`;
  const eventColor = (event) => EVENT_PALETTE[nfipEvents().findIndex((e) => e.id === event.id) % EVENT_PALETTE.length];

  function buildEventControls() {
    if (eventState.built) return;
    eventState.built = true;

    const current = ctx.getState().dataMode;
    const defaults = new Set(["sandy", "harvey", "ian"]);
    if (ctx.eventConfigs[current]?.kind === "nfip") defaults.add(current);

    $("eventChecks").innerHTML = nfipEvents()
      .map(
        (event) =>
          `<label class="event-check"><input type="checkbox" value="${event.id}" ${defaults.has(event.id) ? "checked" : ""}><span class="event-swatch" style="background:${eventColor(event)}"></span>${ctx.escapeHtml(eventLabel(event))}</label>`,
      )
      .join("");

    $("eventMetric").innerHTML = EVENT_METRICS.map(
      (metric) => `<option value="${metric.key}">${ctx.escapeHtml(metric.label)}</option>`,
    ).join("");
    $("eventDollarNote").textContent =
      `Constant dollars use CPI-U annual averages, restated in ${CONSTANT_DOLLAR_YEAR} dollars, so events from different years are comparable.`;
  }

  function parseEventRows(text) {
    const number = (value) => {
      if (value === undefined || value === null || value === "") return NaN;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : NaN;
    };
    return ctx.parseCsv(text).map((row) => ({
      geoid: String(row.GEOID ?? "").padStart(11, "0"),
      claims: number(row.claim_count),
      perThousand: number(row.claims_per_1000_residents),
      paid: number(row.total_claim_payments),
      perCapita: number(row.claim_payments_per_capita),
      avgPay: number(row.average_payment_per_claim),
      building: number(row.building_payments),
      contents: number(row.contents_payments),
      icc: number(row.icc_payments),
    }));
  }

  function loadEventRows(event) {
    if (!eventDataCache.has(event.id)) {
      const promise = fetch(event.dataUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`Could not load ${event.dataUrl}`);
          return response.text();
        })
        .then(parseEventRows);
      eventDataCache.set(event.id, promise);
      promise.catch(() => eventDataCache.delete(event.id));
    }
    return eventDataCache.get(event.id);
  }

  function selectedEvents() {
    const checked = new Set([...document.querySelectorAll("#eventChecks input:checked")].map((input) => input.value));
    return nfipEvents().filter((event) => checked.has(event.id));
  }

  function purgeEventCharts() {
    ["eventBarChart", "eventMixChart", "eventLorenzChart", "eventSeverityChart"].forEach((id) => Plot().purge($(id)));
  }

  async function renderEvents() {
    buildEventControls();
    const token = ++eventRenderToken;
    const message = $("eventMessage");
    const events = selectedEvents();

    if (!events.length) {
      message.textContent = "Select at least one event to compare.";
      message.classList.remove("hidden");
      $("eventCompareTable").innerHTML = "";
      purgeEventCharts();
      return;
    }

    message.textContent = "Loading event data…";
    message.classList.remove("hidden");

    const settled = await Promise.allSettled(events.map(loadEventRows));
    if (token !== eventRenderToken) return;
    const state = ctx.getState();
    if (state.activeTab !== "stats" || state.statsView !== "events") return;

    const failed = [];
    const loaded = [];
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") loaded.push({ event: events[index], rows: result.value });
      else failed.push(events[index]);
    });

    let countyNames = new Map();
    try {
      countyNames = await ctx.getCountyNames();
    } catch {
      // County names are a nicety; carry on without them.
    }
    if (token !== eventRenderToken) return;

    const constant = $("eventDollars").value === "constant";
    const minClaims = Math.max(1, Number($("eventMinClaims").value) || 1);

    lastEventSummaries = loaded.map(({ event, rows }) => {
      const summary = summarizeEvent(rows, { minClaims, factor: constant ? inflationFactor(event.year) : 1 });
      const largest = summary.largestTract;
      return {
        event,
        label: eventLabel(event),
        ...summary,
        largestTractLabel: largest
          ? `${countyNames.get(largest.geoid.slice(0, 5)) || "Unknown county"} · Tract ${largest.geoid.slice(5)} (${currencyCompact.format(largest.paid)})`
          : "—",
      };
    });

    const notes = [];
    if (failed.length) notes.push(`Could not load data for: ${failed.map(eventLabel).join(", ")}. Check that the CSV is in data/events/.`);
    notes.push(constant ? `Dollar amounts are in ${CONSTANT_DOLLAR_YEAR} dollars.` : "Dollar amounts are nominal (as paid, not inflation-adjusted).");
    if (minClaims > 1) notes.push(`Only tracts with at least ${minClaims} claims are included.`);
    message.textContent = notes.join(" ");
    message.classList.toggle("hidden", !notes.length);

    if (!lastEventSummaries.length) {
      $("eventCompareTable").innerHTML = "";
      purgeEventCharts();
      return;
    }

    drawEventTable();
    drawEventCharts(constant);
  }

  function drawEventTable() {
    const columns = [
      { key: "label", label: "Event", text: true },
      ...EVENT_METRICS.filter((metric) =>
        ["totalPaid", "totalClaims", "avgPayment", "tracts", "medianClaimsPer1000", "p99Paid", "top10Share", "top1PctShare", "gini", "buildingPct", "contentsPct", "iccPct"].includes(metric.key)),
      { key: "largestTractLabel", label: "Highest-paid tract", text: true },
    ];

    const rows = [...lastEventSummaries].sort((a, b) => {
      const av = a[eventState.sortKey];
      const bv = b[eventState.sortKey];
      if (typeof av === "string" || typeof bv === "string") {
        return String(av).localeCompare(String(bv), undefined, { numeric: true }) * eventState.sortDir;
      }
      const aOk = Number.isFinite(av);
      const bOk = Number.isFinite(bv);
      if (!aOk && !bOk) return 0;
      if (!aOk) return 1;
      if (!bOk) return -1;
      return (av - bv) * eventState.sortDir;
    });

    const head = columns
      .map((column) => {
        const active = column.key === eventState.sortKey;
        const arrow = active ? (eventState.sortDir > 0 ? "▲" : "▼") : "";
        return `<th class="sortable${column.text ? "" : " num"}" data-event-sort="${column.key}">${ctx.escapeHtml(column.label)} <span class="sort-arrow">${arrow}</span></th>`;
      })
      .join("");

    const body = rows
      .map(
        (row) =>
          `<tr>${columns
            .map((column) => {
              if (column.key === "label") {
                return `<td><span class="event-swatch" style="background:${eventColor(row.event)}"></span>${ctx.escapeHtml(row.label)}</td>`;
              }
              if (column.text) return `<td>${ctx.escapeHtml(row[column.key])}</td>`;
              return `<td class="num">${formatByKind(column.kind, row[column.key])}</td>`;
            })
            .join("")}</tr>`,
      )
      .join("");

    $("eventCompareTable").innerHTML =
      `<table class="dash-table explorer-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function drawEventCharts(constant) {
    const dark = ctx.isDarkMode();
    const theme = ctx.plotTheme();
    const mobile = ctx.isMobile();
    const summaries = lastEventSummaries;
    const metric = EVENT_METRICS.find((item) => item.key === $("eventMetric").value) || EVENT_METRICS[0];
    const dollarSuffix = constant ? ` (${CONSTANT_DOLLAR_YEAR} $)` : "";
    const isMoney = metric.kind === "dollar" || metric.kind === "dollarBig";

    // 1. Selected metric by event
    Plot().react(
      $("eventBarChart"),
      [{
        type: "bar",
        x: summaries.map((item) => item.label),
        y: summaries.map((item) => item[metric.key]),
        marker: { color: summaries.map((item) => eventColor(item.event)) },
        text: summaries.map((item) => formatByKind(metric.kind, item[metric.key])),
        textposition: "outside",
        cliponaxis: false,
        hovertemplate: "%{x}<br>%{text}<extra></extra>",
      }],
      {
        ...theme,
        title: { text: `${metric.label}${isMoney ? dollarSuffix : ""}`, x: 0.01, font: { size: mobile ? 16 : 20 } },
        xaxis: { ...axisBase(), tickangle: summaries.length > 4 ? -25 : 0 },
        yaxis: { ...axisBase(), tickprefix: isMoney ? "$" : "", ticksuffix: metric.kind === "percent" ? "%" : "", separatethousands: true },
        margin: { l: 80, r: 20, t: 70, b: 90 },
        height: mobile ? 380 : 430,
        showlegend: false,
      },
      plotConfig,
    );

    // 2. Payment mix
    const mixTrace = (name, key, color) => ({
      type: "bar",
      orientation: "h",
      name,
      y: summaries.map((item) => item.label),
      x: summaries.map((item) => item[key]),
      marker: { color },
      hovertemplate: `%{y}<br>${name}: %{x:.1f}%<extra></extra>`,
    });
    Plot().react(
      $("eventMixChart"),
      [
        mixTrace("Building", "buildingPct", "#2563eb"),
        mixTrace("Contents", "contentsPct", "#14b8a6"),
        mixTrace("ICC", "iccPct", "#f59e0b"),
      ],
      {
        ...theme,
        title: { text: "Payment mix", x: 0.01, font: { size: mobile ? 16 : 20 } },
        barmode: "stack",
        xaxis: { ...axisBase(), range: [0, 100], ticksuffix: "%" },
        yaxis: { ...axisBase(), autorange: "reversed" },
        legend: { orientation: "h", y: -0.2 },
        margin: { l: mobile ? 130 : 210, r: 20, t: 60, b: 70 },
        height: Math.max(300, 120 + summaries.length * 46),
      },
      plotConfig,
    );

    // 3. Lorenz curves
    const lorenzTraces = summaries.map((item) => ({
      type: "scatter",
      mode: "lines",
      name: `${item.label} · Gini ${Number.isFinite(item.gini) ? item.gini.toFixed(2) : "—"}`,
      x: item.lorenz.x,
      y: item.lorenz.y,
      line: { color: eventColor(item.event), width: 2.5 },
      hovertemplate: `${item.label}<br>Bottom %{x:.0f}% of tracts hold %{y:.1f}% of losses<extra></extra>`,
    }));
    lorenzTraces.push({
      type: "scatter",
      mode: "lines",
      name: "Perfect equality",
      x: [0, 100],
      y: [0, 100],
      line: { color: dark ? "#6b7280" : "#9ca3af", dash: "dash", width: 1.5 },
      hoverinfo: "skip",
    });
    Plot().react(
      $("eventLorenzChart"),
      lorenzTraces,
      {
        ...theme,
        title: { text: "How concentrated are paid losses?", x: 0.01, font: { size: mobile ? 16 : 20 } },
        xaxis: { ...axisBase(), title: { text: "Cumulative % of tracts (lowest to highest loss)" }, range: [0, 100], ticksuffix: "%" },
        yaxis: { ...axisBase(), title: { text: "Cumulative % of paid losses" }, range: [0, 100], ticksuffix: "%" },
        legend: { orientation: "h", y: -0.32 },
        margin: { l: 70, r: 20, t: 60, b: 110 },
        height: mobile ? 460 : 500,
      },
      plotConfig,
    );

    // 4. Severity distribution
    Plot().react(
      $("eventSeverityChart"),
      summaries.map((item) => ({
        type: "box",
        name: item.label,
        y: item.severities,
        boxpoints: false,
        boxmean: true,
        marker: { color: eventColor(item.event) },
        line: { color: eventColor(item.event) },
        hovertemplate: `${item.label}<br>%{y:$,.0f}<extra></extra>`,
      })),
      {
        ...theme,
        title: { text: `Tract-level average payment per claim${dollarSuffix}`, x: 0.01, font: { size: mobile ? 16 : 20 } },
        yaxis: { ...axisBase(), type: "log", tickprefix: "$", title: { text: "Avg. payment per claim (log scale)" } },
        xaxis: { ...axisBase(), tickangle: summaries.length > 4 ? -25 : 0 },
        showlegend: false,
        margin: { l: 80, r: 20, t: 60, b: 90 },
        height: mobile ? 400 : 450,
      },
      plotConfig,
    );
  }

  function exportEvents() {
    if (!lastEventSummaries.length) return;
    const headers = ["Event", "Year", ...EVENT_METRICS.map((metric) => metric.label), "Highest-paid tract"];
    const csv = toCsv(
      headers,
      lastEventSummaries.map((item) => [
        item.event.name,
        item.event.year,
        ...EVENT_METRICS.map((metric) => item[metric.key]),
        item.largestTractLabel,
      ]),
    );
    downloadCsv("event_comparison.csv", csv);
  }

  /* ============================== Bind controls ============================== */

  function bind() {
    // Distribution
    ["distBins", "distScale", "distRange"].forEach((id) => {
      $(id).addEventListener("input", () => renderDistribution());
    });
    $("distThreshold").addEventListener("input", renderThreshold);

    // Table
    $("tableSearch").addEventListener("input", (event) => {
      table.search = event.target.value;
      table.page = 0;
      renderTable();
    });
    ["tableMin", "tableMax"].forEach((id) => {
      $(id).addEventListener("input", (event) => {
        table[id === "tableMin" ? "min" : "max"] = event.target.value.trim();
        table.page = 0;
        renderTable();
      });
    });
    $("tablePageSize").addEventListener("change", (event) => {
      table.pageSize = Number(event.target.value) || 25;
      table.page = 0;
      renderTable();
    });
    $("tableAddColumn").addEventListener("change", (event) => {
      const variable = event.target.value;
      if (variable && !table.extra.includes(variable)) table.extra.push(variable);
      renderTable();
    });
    $("tableColumnChips").addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-column]");
      if (!button) return;
      table.extra = table.extra.filter((variable) => variable !== button.dataset.removeColumn);
      if (table.sortKey === button.dataset.removeColumn) table.sortKey = "value";
      renderTable();
    });
    $("tableWrap").addEventListener("click", (event) => {
      const header = event.target.closest("[data-sort]");
      if (!header) return;
      const key = header.dataset.sort;
      if (table.sortKey === key) table.sortDir *= -1;
      else {
        table.sortKey = key;
        table.sortDir = key === "value" || table.extra.includes(key) ? -1 : 1;
      }
      renderTable();
    });
    $("tablePrev").addEventListener("click", () => {
      table.page = Math.max(0, table.page - 1);
      renderTable();
    });
    $("tableNext").addEventListener("click", () => {
      table.page += 1;
      renderTable();
    });
    $("tableExport").addEventListener("click", exportTable);

    // Events
    $("eventChecks").addEventListener("change", () => renderEvents());
    ["eventDollars", "eventMinClaims"].forEach((id) => $(id).addEventListener("change", () => renderEvents()));
    $("eventMetric").addEventListener("change", () => {
      if (lastEventSummaries.length) drawEventCharts($("eventDollars").value === "constant");
    });
    $("eventCompareTable").addEventListener("click", (event) => {
      const header = event.target.closest("[data-event-sort]");
      if (!header) return;
      const key = header.dataset.eventSort;
      if (eventState.sortKey === key) eventState.sortDir *= -1;
      else {
        eventState.sortKey = key;
        eventState.sortDir = key === "label" || key === "largestTractLabel" ? 1 : -1;
      }
      drawEventTable();
    });
    $("eventExport").addEventListener("click", exportEvents);
  }

  bind();

  return { renderDistribution, renderTable, renderEvents };
}

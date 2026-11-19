/**
 * Bivariate Choropleth Mapping Module for SDSU SCIL Census-FEMA Dashboard (iCHARMrisk)
 *
 * Simultaneously visualizes two variables on every county, state, or census tract
 * using a 2D 3x3 color matrix (Hazard / Impact on X-axis vs. Vulnerability / Capacity on Y-axis).
 */

export function createBivariateMap(options) {
  const {
    getTractMap,
    getState,
    isDarkMode,
    variableLabel,
    formatValue,
    getAdminMapRows,
    getAdminGeojson,
    getTractRowsByState,
    getAllVariables,
    variableGroup,
    VARIABLE_GROUP_ORDER,
    isZeroIgnoredVariable,
    toNumber,
    applySingleClassification,
    updateInteractiveColorbar,
    getMapCompare,
    ensureTractVariableLoaded,
  } = options;

  let isBivariateActive = false;
  let bivariateYVariable = "median_household_income";
  let selectedCell = null; // null = all 9 cells active, 0..8 = highlight single cell

  let cachedTertilesX = [0, 1];
  let cachedTertilesY = [0, 1];

  // Joshua Stevens / CDC SVI standard Teal-Magenta 3x3 Bivariate Palette
  // Low X -> High X, Low Y -> High Y
  const BIVARIATE_PALETTE = [
    "#e8e8e8", "#ace4e4", "#5ac8c8", // Y=0 (Low):  X=Low, X=Med, X=High
    "#dfb0d6", "#a5add3", "#5677aa", // Y=1 (Med):  X=Low, X=Med, X=High
    "#be64ac", "#8c62aa", "#3b4994", // Y=2 (High): X=Low, X=Med, X=High
  ];

  const BIVARIATE_CELL_TITLES = [
    "Low X / Low Y (Low Risk, Stable)",
    "Moderate X / Low Y",
    "High X / Low Y (Hazard Exposure, High Resilience)",
    "Low X / Moderate Y",
    "Moderate X / Moderate Y",
    "High X / Moderate Y",
    "Low X / High Y (High Vulnerability)",
    "Moderate X / High Y",
    "High X / High Y (CRITICAL: High Hazard & High Vulnerability)",
  ];

  // DOM Elements
  const toggleBtn = document.getElementById("toggleBivariateBtn");
  const toggleBtnText = document.getElementById("toggleBivariateBtnText");
  const controlBarEl = document.getElementById("compareControlBar");
  const leftLabelEl = document.getElementById("compareLeftVarLabel");
  const rightSelectEl = document.getElementById("compareRightVarSelect");
  const leftBadgeEl = document.getElementById("compareLeftBadge");
  const rightBadgeEl = document.getElementById("compareRightBadge");
  const dividerEl = document.getElementById("comparePillDivider");
  const interactiveColorbarEl = document.getElementById("interactiveColorbar");
  const bivariateContainer = document.getElementById("bivariateLegendContainer");
  const matrixEl = document.getElementById("bivariateMatrix");
  const resetBtn = document.getElementById("bivariateResetFilterBtn");
  const axisXLabel = document.getElementById("bivariateAxisXLabel");
  const axisYLabel = document.getElementById("bivariateAxisYLabel");
  const inspectorSwatch = document.getElementById("bivInspectorSwatch");
  const inspectorTitle = document.getElementById("bivInspectorTitle");
  const inspectorDesc = document.getElementById("bivInspectorDesc");
  const scaleNameX = document.getElementById("bivScaleNameX");
  const rangeX0 = document.getElementById("bivRangeX0");
  const rangeX1 = document.getElementById("bivRangeX1");
  const rangeX2 = document.getElementById("bivRangeX2");
  const scaleNameY = document.getElementById("bivScaleNameY");
  const rangeY0 = document.getElementById("bivRangeY0");
  const rangeY1 = document.getElementById("bivRangeY1");
  const rangeY2 = document.getElementById("bivRangeY2");

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function quantile(arr, p) {
    if (!arr.length) return 0;
    const idx = (arr.length - 1) * p;
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    if (low === high) return arr[low];
    return arr[low] + (arr[high] - arr[low]) * (idx - low);
  }

  function getTertiles(values) {
    const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (sorted.length < 3) return [0, 1];
    const t1 = quantile(sorted, 1 / 3);
    const t2 = quantile(sorted, 2 / 3);
    if (t1 === t2) return [t1 - 1, t2 + 1];
    return [t1, t2];
  }

  function getTier(val, [t1, t2]) {
    if (!Number.isFinite(val)) return -1;
    if (val < t1) return 0;
    if (val < t2) return 1;
    return 2;
  }

  function getDefaultYVariable(primaryVar) {
    const allVars = typeof getAllVariables === "function" ? getAllVariables() : [];
    const available = allVars.filter((v) => v !== primaryVar);
    if (!available.length) return primaryVar;

    if (primaryVar === "total_population") {
      if (available.includes("median_household_income")) return "median_household_income";
      if (available.includes("poverty_rate")) return "poverty_rate";
    }
    if (primaryVar === "median_household_income") {
      if (available.includes("poverty_rate")) return "poverty_rate";
      if (available.includes("total_population")) return "total_population";
    }
    if (primaryVar.includes("flood") || primaryVar.includes("fema") || primaryVar.includes("hazard")) {
      if (available.includes("median_household_income")) return "median_household_income";
      if (available.includes("poverty_rate")) return "poverty_rate";
    }
    return available[0];
  }

  function buildBivariateFillExpression(palette, activeCell = null) {
    const matchArms = [];
    for (let c = 0; c < 9; c++) {
      matchArms.push(c);
      if (activeCell !== null && activeCell !== undefined) {
        matchArms.push(c === activeCell ? palette[c] : "rgba(51, 65, 85, 0.2)");
      } else {
        matchArms.push(palette[c]);
      }
    }
    return [
      "match",
      ["coalesce", ["feature-state", "bivariateClass"], -1],
      ...matchArms,
      "#334155", // default/null color
    ];
  }

  function applyBivariateClassification() {
    const tractMap = getTractMap ? getTractMap() : null;
    if (!isBivariateActive || !tractMap) return;

    const varX = getState().variable;
    const varY = bivariateYVariable;
    const isTract = getState().geography === "tract";

    const valuesX = [];
    const valuesY = [];

    if (isTract) {
      const tractRows = getTractRowsByState ? getTractRowsByState() : null;
      if (tractRows) {
        tractRows.forEach((rows) => {
          rows.forEach((row) => {
            if (Number(row.year) === Number(getState().year)) {
              const rx = row[varX];
              const ry = row[varY];
              const vx = rx !== undefined && rx !== null ? toNumber(rx) : null;
              const vy = ry !== undefined && ry !== null ? toNumber(ry) : null;
              if (Number.isFinite(vx)) valuesX.push(vx);
              if (Number.isFinite(vy)) valuesY.push(vy);
            }
          });
        });
      }
    } else {
      const adminRows = getAdminMapRows ? getAdminMapRows() : null;
      const rawGeo = getAdminGeojson ? getAdminGeojson() : null;
      if (rawGeo && rawGeo.features && adminRows) {
        const idLen = getState().geography === "state" ? 2 : 5;
        rawGeo.features.forEach((feature) => {
          const rawId = getState().geography === "global"
            ? (feature.properties?.ISO_A3 ?? feature.properties?.iso_a3 ?? feature.id ?? "")
            : (feature.properties?.GEOID ?? feature.id ?? "");
          const fid = getState().geography === "global"
            ? String(rawId).toUpperCase()
            : String(rawId).padStart(idLen, "0");
          const row = adminRows.get(fid);
          if (row) {
            const rx = row[varX];
            const ry = row[varY];
            const vx = rx !== undefined && rx !== null ? toNumber(rx) : null;
            const vy = ry !== undefined && ry !== null ? toNumber(ry) : null;
            if (Number.isFinite(vx)) valuesX.push(vx);
            if (Number.isFinite(vy)) valuesY.push(vy);
          }
        });
      }
    }

    cachedTertilesX = getTertiles(valuesX);
    cachedTertilesY = getTertiles(valuesY);

    // Apply feature states
    if (isTract) {
      const tractRows = getTractRowsByState ? getTractRowsByState() : null;
      if (tractRows) {
        tractRows.forEach((rows) => {
          rows.forEach((row) => {
            if (Number(row.year) === Number(getState().year)) {
              const geoid = String(row.GEOID).padStart(11, "0");
              const rx = row[varX];
              const ry = row[varY];
              const vx = rx !== undefined && rx !== null ? toNumber(rx) : null;
              const vy = ry !== undefined && ry !== null ? toNumber(ry) : null;
              const tierX = getTier(vx, cachedTertilesX);
              const tierY = getTier(vy, cachedTertilesY);
              const bClass = tierX >= 0 && tierY >= 0 ? tierX + 3 * tierY : -1;

              try {
                tractMap.setFeatureState(
                  { source: "us-tracts", sourceLayer: "tracts", id: Number(geoid) },
                  { bivariateClass: bClass, valX: vx, valY: vy, tierX, tierY }
                );
              } catch {}
            }
          });
        });
      }
    } else {
      const adminRows = getAdminMapRows ? getAdminMapRows() : null;
      const rawGeo = getAdminGeojson ? getAdminGeojson() : null;
      if (rawGeo && rawGeo.features && adminRows) {
        const idLen = getState().geography === "state" ? 2 : 5;
        rawGeo.features.forEach((feature) => {
          const rawId = getState().geography === "global"
            ? (feature.properties?.ISO_A3 ?? feature.properties?.iso_a3 ?? feature.id ?? "")
            : (feature.properties?.GEOID ?? feature.id ?? "");
          const fid = getState().geography === "global"
            ? String(rawId).toUpperCase()
            : String(rawId).padStart(idLen, "0");
          const row = adminRows.get(fid);
          const rx = row ? row[varX] : null;
          const ry = row ? row[varY] : null;
          const vx = rx !== undefined && rx !== null ? toNumber(rx) : null;
          const vy = ry !== undefined && ry !== null ? toNumber(ry) : null;
          const tierX = getTier(vx, cachedTertilesX);
          const tierY = getTier(vy, cachedTertilesY);
          const bClass = tierX >= 0 && tierY >= 0 ? tierX + 3 * tierY : -1;

          try {
            tractMap.setFeatureState(
              { source: "admin-areas", id: fid },
              { bivariateClass: bClass, valX: vx, valY: vy, tierX, tierY }
            );
          } catch {}
        });
      }
    }

    // Set Map Paint Expression
    const fillExpr = buildBivariateFillExpression(BIVARIATE_PALETTE, selectedCell);
    try {
      if (tractMap.getLayer("admin-fill")) {
        tractMap.setPaintProperty("admin-fill", "fill-color", fillExpr);
      }
    } catch {}
    try {
      if (tractMap.getLayer("tract-fill")) {
        tractMap.setPaintProperty("tract-fill", "fill-color", fillExpr);
      }
    } catch {}

    updateLegend();
  }

  function updateLegend() {
    if (!isBivariateActive) return;

    const varX = getState().variable;
    const varY = bivariateYVariable;

    // Title
    const titleEl = document.getElementById("colorbarTitle");
    if (titleEl) {
      const leftName = variableLabel(varX);
      const rightName = variableLabel(varY);
      titleEl.innerHTML = `<div class="split-title-line"><span class="compare-pill-badge left-badge">X</span><span class="split-cb-name" title="${escapeHtml(leftName)}">${escapeHtml(leftName)}</span></div><div class="split-title-line"><span class="compare-pill-badge right-badge">Y</span><span class="split-cb-name" title="${escapeHtml(rightName)}">${escapeHtml(rightName)}</span></div>`;
    }

    if (axisXLabel) {
      axisXLabel.textContent = `${variableLabel(varX)} ▶`;
      axisXLabel.title = `Horizontal Axis: ${variableLabel(varX)}`;
    }
    if (axisYLabel) {
      axisYLabel.textContent = `▲ ${variableLabel(varY)}`;
      axisYLabel.title = `Vertical Axis: ${variableLabel(varY)}`;
    }

    const [tX1, tX2] = cachedTertilesX;
    const [tY1, tY2] = cachedTertilesY;

    // X Scale Card
    if (scaleNameX) {
      scaleNameX.textContent = variableLabel(varX);
      scaleNameX.title = variableLabel(varX);
    }
    if (rangeX0) rangeX0.textContent = `< ${formatValue(tX1, varX)}`;
    if (rangeX1) rangeX1.textContent = `${formatValue(tX1, varX)} – ${formatValue(tX2, varX)}`;
    if (rangeX2) rangeX2.textContent = `> ${formatValue(tX2, varX)}`;

    // Y Scale Card
    if (scaleNameY) {
      scaleNameY.textContent = variableLabel(varY);
      scaleNameY.title = variableLabel(varY);
    }
    if (rangeY0) rangeY0.textContent = `< ${formatValue(tY1, varY)}`;
    if (rangeY1) rangeY1.textContent = `${formatValue(tY1, varY)} – ${formatValue(tY2, varY)}`;
    if (rangeY2) rangeY2.textContent = `> ${formatValue(tY2, varY)}`;

    // Color matrix cells
    const cells = matrixEl ? matrixEl.querySelectorAll(".bivariate-cell") : [];
    cells.forEach((cell) => {
      const cellIdx = Number(cell.dataset.cell);
      cell.style.backgroundColor = BIVARIATE_PALETTE[cellIdx];
      cell.title = `${BIVARIATE_CELL_TITLES[cellIdx]} (Click to filter)`;

      if (selectedCell !== null) {
        cell.classList.toggle("is-selected", cellIdx === selectedCell);
        cell.classList.toggle("is-dimmed", cellIdx !== selectedCell);
      } else {
        cell.classList.remove("is-selected", "is-dimmed");
      }
    });

    if (resetBtn) {
      resetBtn.classList.toggle("hidden", selectedCell === null);
    }

    updateInspectorDefault();
  }

  function updateInspectorDefault() {
    if (!inspectorTitle) return;
    if (selectedCell !== null) {
      const cellColor = BIVARIATE_PALETTE[selectedCell];
      if (inspectorSwatch) {
        inspectorSwatch.style.background = cellColor;
        inspectorSwatch.style.borderColor = "#ffffff";
      }
      inspectorTitle.textContent = `Filtered: ${BIVARIATE_CELL_TITLES[selectedCell]}`;
      if (inspectorDesc) {
        inspectorDesc.textContent = "Click tile or 'Reset' to show all";
      }
    } else {
      if (inspectorSwatch) {
        inspectorSwatch.style.background = "linear-gradient(135deg, #5ac8c8 0%, #be64ac 50%, #3b4994 100%)";
        inspectorSwatch.style.borderColor = "rgba(255,255,255,0.4)";
      }
      inspectorTitle.textContent = "Showing all 9 risk groups";
      if (inspectorDesc) {
        inspectorDesc.textContent = "Hover a tile to inspect scale | Click to filter";
      }
    }
  }

  function setInspectorHover(cellIdx) {
    if (!inspectorTitle) return;
    const varX = getState().variable;
    const varY = bivariateYVariable;
    const [tX1, tX2] = cachedTertilesX;
    const [tY1, tY2] = cachedTertilesY;

    const tierX = cellIdx % 3;
    const tierY = Math.floor(cellIdx / 3);
    const tierNames = ["Low", "Med", "High"];

    let rangeXText = "";
    if (tierX === 0) rangeXText = `< ${formatValue(tX1, varX)}`;
    else if (tierX === 1) rangeXText = `${formatValue(tX1, varX)} – ${formatValue(tX2, varX)}`;
    else rangeXText = `> ${formatValue(tX2, varX)}`;

    let rangeYText = "";
    if (tierY === 0) rangeYText = `< ${formatValue(tY1, varY)}`;
    else if (tierY === 1) rangeYText = `${formatValue(tY1, varY)} – ${formatValue(tY2, varY)}`;
    else rangeYText = `> ${formatValue(tY2, varY)}`;

    const cellColor = BIVARIATE_PALETTE[cellIdx];
    if (inspectorSwatch) {
      inspectorSwatch.style.background = cellColor;
      inspectorSwatch.style.borderColor = "#ffffff";
    }
    inspectorTitle.textContent = `${tierNames[tierX]} X + ${tierNames[tierY]} Y (${BIVARIATE_CELL_TITLES[cellIdx]})`;
    if (inspectorDesc) {
      inspectorDesc.innerHTML = `<span style="color:#38bdf8;font-weight:600;">X: ${escapeHtml(rangeXText)}</span> &bull; <span style="color:#e879f9;font-weight:600;">Y: ${escapeHtml(rangeYText)}</span>`;
    }
  }

  function populateControlBar() {
    if (!rightSelectEl) return;
    const varX = getState().variable;
    if (!bivariateYVariable || bivariateYVariable === varX) {
      bivariateYVariable = getDefaultYVariable(varX);
    }

    const allVars = typeof getAllVariables === "function" ? getAllVariables() : [];
    rightSelectEl.innerHTML = "";

    const groups = new Map(VARIABLE_GROUP_ORDER ? VARIABLE_GROUP_ORDER.map((g) => [g, []]) : []);
    allVars.forEach((v) => {
      const g = variableGroup ? variableGroup(v) : "Variables";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(v);
    });

    groups.forEach((groupVars, groupName) => {
      if (!groupVars.length) return;
      const optgroup = document.createElement("optgroup");
      optgroup.label = groupName;
      groupVars.forEach((v) => {
        const option = document.createElement("option");
        option.value = v;
        option.textContent = variableLabel ? variableLabel(v) : v;
        if (v === varX) option.disabled = true;
        optgroup.appendChild(option);
      });
      rightSelectEl.appendChild(optgroup);
    });

    rightSelectEl.value = bivariateYVariable;
    rightSelectEl.title = variableLabel(bivariateYVariable);

    if (leftLabelEl) {
      leftLabelEl.textContent = variableLabel(varX);
      leftLabelEl.title = variableLabel(varX);
    }
    if (leftBadgeEl) leftBadgeEl.textContent = "X Axis";
    if (rightBadgeEl) rightBadgeEl.textContent = "Y Axis";
    if (dividerEl) dividerEl.textContent = "✕";
  }

  async function enableBivariate(targetYVar) {
    isBivariateActive = true;
    selectedCell = null;
    toggleBtn?.classList.add("active");
    if (toggleBtnText) toggleBtnText.textContent = "Exit Bivariate";

    // Disable split mode if running
    const mapCompare = getMapCompare ? getMapCompare() : null;
    if (mapCompare && mapCompare.isActive()) {
      mapCompare.disable(true);
    }

    if (targetYVar) {
      bivariateYVariable = targetYVar;
    } else if (!bivariateYVariable || bivariateYVariable === getState().variable) {
      bivariateYVariable = getDefaultYVariable(getState().variable);
    }

    populateControlBar();
    controlBarEl?.classList.remove("hidden");

    // Activate Bivariate layout on Colorbar
    if (interactiveColorbarEl) {
      interactiveColorbarEl.classList.remove("split-active");
      interactiveColorbarEl.classList.add("bivariate-active");
      bivariateContainer?.classList.remove("hidden");
    }

    if (getState().geography === "tract" && typeof ensureTractVariableLoaded === "function") {
      await ensureTractVariableLoaded(bivariateYVariable);
    }

    applyBivariateClassification();
  }

  function disableBivariate() {
    isBivariateActive = false;
    selectedCell = null;
    toggleBtn?.classList.remove("active");
    if (toggleBtnText) toggleBtnText.textContent = "Bivariate";

    if (interactiveColorbarEl) {
      interactiveColorbarEl.classList.remove("bivariate-active");
      bivariateContainer?.classList.add("hidden");
      if (scaleBreakdownEl) {
        scaleBreakdownEl.classList.remove("is-expanded");
        toggleDetailsBtn?.classList.remove("is-expanded");
        const textEl = toggleDetailsBtn?.querySelector(".biv-toggle-text");
        const chevEl = toggleDetailsBtn?.querySelector(".biv-toggle-chevron");
        if (textEl) textEl.textContent = "Scale Cutoffs";
        if (chevEl) chevEl.textContent = "▾";
      }
      const titleEl = document.getElementById("colorbarTitle");
      if (titleEl) {
        titleEl.textContent = variableLabel(getState().variable);
      }
    }

    const mapCompare = getMapCompare ? getMapCompare() : null;
    if (!mapCompare || !mapCompare.isActive()) {
      controlBarEl?.classList.add("hidden");
    }

    if (typeof applySingleClassification === "function") {
      applySingleClassification();
    }
    if (typeof updateInteractiveColorbar === "function") {
      updateInteractiveColorbar();
    }
  }

  async function toggleBivariate() {
    if (isBivariateActive) {
      disableBivariate();
    } else {
      await enableBivariate();
    }
  }

  // Cell hover and click-to-filter event listeners
  if (matrixEl) {
    matrixEl.addEventListener("mouseover", (e) => {
      const btn = e.target.closest(".bivariate-cell");
      if (btn) {
        setInspectorHover(Number(btn.dataset.cell));
      }
    });

    matrixEl.addEventListener("mouseleave", () => {
      updateInspectorDefault();
    });

    matrixEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".bivariate-cell");
      if (!btn) return;
      const cellIdx = Number(btn.dataset.cell);
      selectedCell = selectedCell === cellIdx ? null : cellIdx;
      applyBivariateClassification();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      selectedCell = null;
      applyBivariateClassification();
    });
  }

  const toggleDetailsBtn = document.getElementById("bivariateToggleDetailsBtn");
  const scaleBreakdownEl = document.getElementById("bivariateScaleBreakdown");
  if (toggleDetailsBtn && scaleBreakdownEl) {
    toggleDetailsBtn.addEventListener("click", () => {
      const isExpanded = scaleBreakdownEl.classList.toggle("is-expanded");
      toggleDetailsBtn.classList.toggle("is-expanded", isExpanded);
      const textEl = toggleDetailsBtn.querySelector(".biv-toggle-text");
      const chevEl = toggleDetailsBtn.querySelector(".biv-toggle-chevron");
      if (textEl) textEl.textContent = isExpanded ? "Hide Cutoffs" : "Scale Cutoffs";
      if (chevEl) chevEl.textContent = isExpanded ? "▴" : "▾";
    });
  }

  toggleBtn?.addEventListener("click", toggleBivariate);

  // Hover popup builder for bivariate mode
  function renderHoverPopup(event, featureId, row, popup) {
    const tractMap = getTractMap ? getTractMap() : null;
    if (!popup || !tractMap || !isBivariateActive) return;

    const fState = tractMap.getFeatureState({
      source: getState().geography === "tract" ? "us-tracts" : "admin-areas",
      ...(getState().geography === "tract" ? { sourceLayer: "tracts" } : {}),
      id: getState().geography === "tract" ? Number(featureId) : featureId,
    });

    const bClass = fState?.bivariateClass !== undefined ? fState.bivariateClass : -1;
    const varX = getState().variable;
    const varY = bivariateYVariable;

    const valX = fState?.valX !== undefined ? fState.valX : (row ? toNumber(row[varX]) : null);
    const valY = fState?.valY !== undefined ? fState.valY : (row ? toNumber(row[varY]) : null);

    const tierNames = ["Low", "Medium", "High"];
    const tierXName = fState?.tierX >= 0 ? tierNames[fState.tierX] : "—";
    const tierYName = fState?.tierY >= 0 ? tierNames[fState.tierY] : "—";

    const color = bClass >= 0 && bClass < 9 ? BIVARIATE_PALETTE[bClass] : "#64748b";
    const catTitle = bClass >= 0 && bClass < 9 ? BIVARIATE_CELL_TITLES[bClass] : "No Data";

    const areaName = getState().geography === "state"
      ? (row?.state_name || featureId)
      : (getState().geography === "global"
          ? (row?.country_name || row?.NAME || featureId)
          : (row ? `${row.county_name}, ${row.state_name}` : `Census Tract ${featureId}`));

    popup
      .setLngLat(event.lngLat)
      .setHTML(
        `<strong>${escapeHtml(areaName)}</strong>` +
        (row?.year ? `<br><strong>Year:</strong> ${escapeHtml(row.year)}` : "") +
        `<div style="margin:6px 0;padding:6px 8px;background:rgba(255,255,255,0.06);border-radius:6px;border:1px solid rgba(255,255,255,0.12);">` +
          `<div style="margin-bottom:3px;"><span class="compare-pill-badge left-badge" style="font-size:9px;padding:1px 4px;margin-right:4px;">X</span><strong>${escapeHtml(variableLabel(varX))}:</strong> ${Number.isFinite(valX) ? escapeHtml(formatValue(valX, varX)) : "—"} <span style="font-size:10px;color:#94a3b8;">(${tierXName})</span></div>` +
          `<div><span class="compare-pill-badge right-badge" style="font-size:9px;padding:1px 4px;margin-right:4px;">Y</span><strong>${escapeHtml(variableLabel(varY))}:</strong> ${Number.isFinite(valY) ? escapeHtml(formatValue(valY, varY)) : "—"} <span style="font-size:10px;color:#94a3b8;">(${tierYName})</span></div>` +
        `</div>` +
        `<div style="display:flex;align-items:center;gap:6px;margin-top:5px;">` +
          `<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${color};border:1px solid rgba(255,255,255,0.6);flex-shrink:0;"></span>` +
          `<span style="font-weight:700;font-size:11px;color:${color};">${escapeHtml(catTitle)}</span>` +
        `</div>` +
        `<div style="margin-top:6px;font-size:11px;color:#2563eb;font-weight:700;">Click to view Underwriting Data Card &rarr;</div>`
      )
      .addTo(tractMap);

    const popupContent = popup.getElement()?.querySelector(".maplibregl-popup-content");
    if (popupContent) {
      popupContent.style.background = isDarkMode() ? "#0f172a" : "#ffffff";
      popupContent.style.color = isDarkMode() ? "#f8fafc" : "#0f172a";
      popupContent.style.border = isDarkMode() ? "1px solid #7c3aed" : "1px solid #cbd5e1";
      popupContent.style.borderRadius = "8px";
      popupContent.style.boxShadow = "0 8px 22px rgba(0, 0, 0, 0.45)";
      popupContent.style.padding = "10px 12px";
      popupContent.style.fontSize = "12px";
    }
  }

  // Public API
  return {
    isActive: () => isBivariateActive,
    getYVariable: () => bivariateYVariable,
    setYVariable: async (newVar) => {
      bivariateYVariable = newVar;
      if (rightSelectEl) rightSelectEl.value = newVar;
      if (isBivariateActive) {
        if (getState().geography === "tract" && typeof ensureTractVariableLoaded === "function") {
          await ensureTractVariableLoaded(newVar);
        }
        applyBivariateClassification();
      }
    },
    enable: enableBivariate,
    disable: disableBivariate,
    toggle: toggleBivariate,
    applyClassification: applyBivariateClassification,
    update: async () => {
      if (isBivariateActive) {
        populateControlBar();
        if (getState().geography === "tract" && typeof ensureTractVariableLoaded === "function") {
          await ensureTractVariableLoaded(bivariateYVariable);
        }
        applyBivariateClassification();
      }
    },
    updateLegend: () => updateLegend(),
    renderHoverPopup,
  };
}

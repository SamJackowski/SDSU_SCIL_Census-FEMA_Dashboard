/**
 * SDSU SCIL Census-FEMA Dashboard
 * Map Split / Compare View (Swiper) Module
 * Dual-Track Split Longways Colorbar
 */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function quantile(arr, p) {
  if (!arr.length) return 0;
  const idx = (arr.length - 1) * p;
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return arr[low];
  return arr[low] + (arr[high] - arr[low]) * (idx - low);
}

export function createMapCompare(ctx) {
  const {
    maplibregl,
    getTractMap,
    getState,
    isDarkMode,
    variableLabel,
    formatValue,
    colorRange,
    tractColorRamp,
    getTractRowsByState,
    getAdminMapRows,
    getAdminGeojson,
    US_TRACTS_PMTILES_URLS,
    desiredTractBoundaryVintage,
    toNumber,
    getAllVariables,
    allVariables,
    variableGroup,
    VARIABLE_GROUP_ORDER,
    isZeroIgnoredVariable,
    mapColorRange,
    applySingleClassification,
    updateInteractiveColorbar,
    ensureTractVariableLoaded,
  } = ctx;

  let isCompareActive = false;
  let compareMap = null;
  let splitFraction = 0.5; // 50% split by default
  let isDragging = false;
  let syncLock = false;
  let compareVariable = null;
  let compareHoverPopup = null;
  let cachedRightMin = 0;
  let cachedRightMax = 1;

  // Compute Right Variable stats synchronously from available memory rows
  function computeRightDataStats(variable = compareVariable) {
    if (!variable) return { values: [], min: 0, max: 1 };
    const isTract = getState().geography === "tract";
    let values = [];

    if (isTract) {
      const tractRows = getTractRowsByState();
      if (tractRows) {
        tractRows.forEach((rows) => {
          rows.forEach((row) => {
            if (Number(row.year) === Number(getState().year)) {
              const rawVal = row[variable];
              const val = rawVal !== undefined && rawVal !== null ? toNumber(rawVal) : null;
              if (Number.isFinite(val)) values.push(val);
            }
          });
        });
      }
    } else {
      const adminRows = getAdminMapRows();
      if (adminRows && adminRows.size) {
        adminRows.forEach((row) => {
          const rawVal = row ? row[variable] : null;
          const val = rawVal !== undefined && rawVal !== null ? toNumber(rawVal) : null;
          if (Number.isFinite(val)) values.push(val);
        });
      }
    }

    if (typeof isZeroIgnoredVariable === "function" && isZeroIgnoredVariable(variable)) {
      values = values.filter((v) => v > 0);
    }

    let min = 0;
    let max = 1;
    if (values.length) {
      [min, max] = colorRange(values, getState().scaleMode);
      if (min === max) max = min + 1;
    }
    return { values, min, max };
  }

  // DOM Elements
  const toggleBtn = document.getElementById("toggleCompareBtn");
  const toggleBtnText = document.getElementById("toggleCompareBtnText");
  const closeBtn = document.getElementById("closeCompareBtn");
  const wrapEl = document.getElementById("mapComparisonWrap");
  const compareMapEl = document.getElementById("compareMap");
  const swiperEl = document.getElementById("compareSwiper");
  const controlBarEl = document.getElementById("compareControlBar");
  const leftLabelEl = document.getElementById("compareLeftVarLabel");
  const rightSelectEl = document.getElementById("compareRightVarSelect");
  const leftBadgeEl = document.getElementById("compareLeftBadge");
  const rightBadgeEl = document.getElementById("compareRightBadge");
  const dividerEl = document.getElementById("comparePillDivider");
  let bivariateMapRef = null;
  const interactiveColorbarEl = document.getElementById("interactiveColorbar");
  const splitLeftCol = document.getElementById("colorbarSplitLeft");
  const splitRightCol = document.getElementById("colorbarSplitRight");
  const rightTrackEl = document.getElementById("colorbarTrackRight");
  const rightEqualBtn = document.getElementById("splitRightEqualBtn");
  const rightQuantBtn = document.getElementById("splitRightQuantBtn");

  if (!toggleBtn || !compareMapEl || !swiperEl || !controlBarEl) {
    console.warn("Map compare elements not found in DOM");
    return {
      isActive: () => false,
      getCompareVariable: () => null,
      toggle: () => {},
      update: () => {},
      updateColorbar: () => {},
      applyClassification: () => {},
    };
  }

  function getAvailableVariables() {
    if (typeof getAllVariables === "function") {
      const res = getAllVariables();
      if (Array.isArray(res) && res.length) return res;
    }
    if (Array.isArray(allVariables) && allVariables.length) return allVariables;
    return [];
  }

  // Choose a sensible default comparison variable from available variables
  function getDefaultCompareVariable(primaryVar) {
    const vars = getAvailableVariables();
    const available = vars.filter((v) => v !== primaryVar);
    if (!available.length) return primaryVar;

    if (primaryVar === "total_population") {
      if (available.includes("median_household_income")) return "median_household_income";
      if (available.includes("poverty_rate")) return "poverty_rate";
    }
    if (primaryVar === "median_household_income") {
      if (available.includes("poverty_rate")) return "poverty_rate";
      if (available.includes("total_population")) return "total_population";
    }
    if (primaryVar === "total_eal" || primaryVar === "fema_risk_score") {
      if (available.includes("sovi_score")) return "sovi_score";
      if (available.includes("fld_eal")) return "fld_eal";
      if (available.includes("median_household_income")) return "median_household_income";
    }

    return available[0];
  }

  // Populate Right Variable dropdown
  function populateCompareOptions() {
    if (!rightSelectEl) return;
    const currentVal = compareVariable || getDefaultCompareVariable(getState().variable);
    rightSelectEl.innerHTML = "";

    const vars = getAvailableVariables();
    const groups = new Map(VARIABLE_GROUP_ORDER ? VARIABLE_GROUP_ORDER.map((g) => [g, []]) : []);
    vars.forEach((v) => {
      const g = variableGroup ? variableGroup(v) : "Variables";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(v);
    });

    groups.forEach((groupVars, groupName) => {
      if (!groupVars.length) return;
      const optgroup = document.createElement("optgroup");
      optgroup.label = groupName;
      groupVars.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = variableLabel ? variableLabel(v) : v;
        if (v === currentVal) opt.selected = true;
        optgroup.appendChild(opt);
      });
      rightSelectEl.appendChild(optgroup);
    });

    if (currentVal) {
      rightSelectEl.value = currentVal;
      compareVariable = currentVal;
      rightSelectEl.title = variableLabel ? variableLabel(currentVal) : currentVal;
    }
  }

  // Build step fill expression for compare variable using independent compareBandFractions
  function buildStepFillExpression(cmin, cmax, variable) {
    const range = cmax - cmin;
    const colors = tractColorRamp();
    const fractions = getState().compareBandFractions || [0.2, 0.4, 0.6, 0.8];
    const [t0, t1, t2, t3] = fractions.map((f) => cmin + f * range);
    const valExpr = ["coalesce", ["feature-state", "value"], ["get", "value"]];
    const stepExpr = [
      "step",
      valExpr,
      colors[0],
      t0, colors[1],
      t1, colors[2],
      t2, colors[3],
      t3, colors[4],
    ];

    const filterPositive = typeof isZeroIgnoredVariable === "function" ? isZeroIgnoredVariable(variable) : false;
    return filterPositive
      ? [
          "case",
          ["==", valExpr, null], "#94a3b8",
          ["<=", valExpr, 0], "#94a3b8",
          stepExpr,
        ]
      : [
          "case",
          ["==", valExpr, null], "#94a3b8",
          stepExpr,
        ];
  }

  // Update swiper position & CSS clip-path
  function applySplitPosition(fraction) {
    splitFraction = Math.max(0.05, Math.min(0.95, fraction));
    const percent = splitFraction * 100;

    swiperEl.style.left = `${percent}%`;
    compareMapEl.style.clipPath = `polygon(${percent}% 0%, 100% 0%, 100% 100%, ${percent}% 100%)`;
  }

  // 2-Way Viewport Synchronization
  function syncViewports(source, target) {
    if (syncLock || !source || !target) return;
    syncLock = true;
    target.jumpTo({
      center: source.getCenter(),
      zoom: source.getZoom(),
      bearing: source.getBearing(),
      pitch: source.getPitch(),
    });
    syncLock = false;
  }

  // Setup Compare Map Instance
  function ensureCompareMap() {
    const tractMap = getTractMap();
    if (!tractMap) return;

    if (!compareMap) {
      const styleUrl = isDarkMode()
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

      compareMap = new maplibregl.Map({
        container: "compareMap",
        style: styleUrl,
        center: tractMap.getCenter(),
        zoom: tractMap.getZoom(),
        bearing: tractMap.getBearing(),
        pitch: tractMap.getPitch(),
        clickTolerance: 10,
        attributionControl: false,
        preserveDrawingBuffer: true,
      });

      const onMapReady = () => {
        setupCompareLayers();
        refreshCompareMapValues();
        applyCompareClassification();
      };

      compareMap.on("load", onMapReady);
      compareMap.on("styledata", () => {
        if (isCompareActive) {
          setupCompareLayers();
          applyCompareClassification();
        }
      });

      tractMap.on("move", () => {
        if (isCompareActive) syncViewports(tractMap, compareMap);
      });
      compareMap.on("move", () => {
        if (isCompareActive) syncViewports(compareMap, tractMap);
      });

      compareHoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
      });

      compareMap.on("mousemove", "compare-tract-fill", handleCompareHover);
      compareMap.on("mouseleave", "compare-tract-fill", () => compareHoverPopup?.remove());

      compareMap.on("mousemove", "compare-admin-fill", handleCompareHoverAdmin);
      compareMap.on("mouseleave", "compare-admin-fill", () => compareHoverPopup?.remove());
    } else {
      syncViewports(tractMap, compareMap);
      setupCompareLayers();
      refreshCompareMapValues();
      applyCompareClassification();
    }
  }

  function setupCompareLayers() {
    if (!compareMap) return;

    const vintage = desiredTractBoundaryVintage ? desiredTractBoundaryVintage() : 2020;
    const firstLabel = compareMap
      .getStyle()
      ?.layers?.find((l) => l.type === "symbol")?.id;

    const { min, max } = computeRightDataStats(compareVariable);
    const initialFillExpr = buildStepFillExpression(cachedRightMin || min, cachedRightMax || max, compareVariable);

    // 1. PMTiles Tracts
    if (!compareMap.getSource("us-tracts") && US_TRACTS_PMTILES_URLS) {
      compareMap.addSource("us-tracts", {
        type: "vector",
        url: `pmtiles://${US_TRACTS_PMTILES_URLS[vintage]}`,
      });
    }

    if (!compareMap.getLayer("compare-tract-fill") && compareMap.getSource("us-tracts")) {
      compareMap.addLayer(
        {
          id: "compare-tract-fill",
          type: "fill",
          source: "us-tracts",
          "source-layer": "tracts",
          paint: {
            "fill-color": initialFillExpr,
            "fill-opacity": 0.82,
          },
        },
        firstLabel
      );
    }

    if (!compareMap.getLayer("compare-tract-outline") && compareMap.getSource("us-tracts")) {
      compareMap.addLayer(
        {
          id: "compare-tract-outline",
          type: "line",
          source: "us-tracts",
          "source-layer": "tracts",
          paint: {
            "line-color": "#334155",
            "line-width": 0.4,
          },
        },
        firstLabel
      );
    }

    // 2. Admin Areas (County / State GeoJSON)
    const adminGeo = getAdminGeojson();
    if (!compareMap.getSource("admin-areas")) {
      compareMap.addSource("admin-areas", {
        type: "geojson",
        data: adminGeo || { type: "FeatureCollection", features: [] },
        promoteId: "id",
      });
    }

    if (!compareMap.getLayer("compare-admin-fill")) {
      compareMap.addLayer(
        {
          id: "compare-admin-fill",
          type: "fill",
          source: "admin-areas",
          paint: {
            "fill-color": initialFillExpr,
            "fill-opacity": 0.82,
          },
        },
        firstLabel
      );
    }

    // Match tractMap admin-outline exactly with #cbd5e1 and width 0.65
    if (!compareMap.getLayer("compare-admin-outline")) {
      compareMap.addLayer(
        {
          id: "compare-admin-outline",
          type: "line",
          source: "admin-areas",
          paint: {
            "line-color": "#cbd5e1",
            "line-width": 0.65,
          },
        },
        firstLabel
      );
    }

    // Layer visibility sync based on geography
    const isTract = getState().geography === "tract";
    if (compareMap.getLayer("compare-tract-fill")) {
      compareMap.setLayoutProperty("compare-tract-fill", "visibility", isTract ? "visible" : "none");
    }
    if (compareMap.getLayer("compare-tract-outline")) {
      compareMap.setLayoutProperty("compare-tract-outline", "visibility", isTract ? "visible" : "none");
    }
    if (compareMap.getLayer("compare-admin-fill")) {
      compareMap.setLayoutProperty("compare-admin-fill", "visibility", isTract ? "none" : "visible");
    }
    if (compareMap.getLayer("compare-admin-outline")) {
      compareMap.setLayoutProperty("compare-admin-outline", "visibility", isTract ? "none" : "visible");
    }
  }

  // Live color classification update for compareMap
  function applyCompareClassification() {
    if (!isCompareActive || !compareMap) return;

    let cmin = cachedRightMin;
    let cmax = cachedRightMax;
    if (cmin === cmax) cmax = cmin + 1;

    const fillExpr = buildStepFillExpression(cmin, cmax, compareVariable);

    try {
      if (compareMap.getLayer("compare-tract-fill")) {
        compareMap.setPaintProperty("compare-tract-fill", "fill-color", fillExpr);
      }
    } catch {}
    try {
      if (compareMap.getLayer("compare-admin-fill")) {
        compareMap.setPaintProperty("compare-admin-fill", "fill-color", fillExpr);
      }
    } catch {}
  }

  // Render Right Track (bands, handles, limits, tags)
  function renderRightTrackAndHandles() {
    if (!isCompareActive) return;

    let fractions = getState().compareBandFractions;
    if (!fractions || fractions.length !== 4 || (fractions[3] - fractions[0] < 0.12) || fractions.some((f) => !Number.isFinite(f))) {
      fractions = [0.20, 0.40, 0.60, 0.80];
      getState().compareBandFractions = fractions;
    }
    const [rf0, rf1, rf2, rf3] = fractions;
    const rightMin = cachedRightMin;
    const rightMax = cachedRightMax;
    const rightRange = rightMax - rightMin || 1;

    // 1. Right color bands
    const rBands = [0, 1, 2, 3, 4].map((i) => document.getElementById(`compareBand${i}`));
    const colors = tractColorRamp();
    rBands.forEach((b, i) => {
      if (b) {
        b.style.background = colors[i];
        b.style.width = "100%";
      }
    });

    if (rBands[0]) rBands[0].style.height = `${rf0 * 100}%`;
    if (rBands[1]) rBands[1].style.height = `${(rf1 - rf0) * 100}%`;
    if (rBands[2]) rBands[2].style.height = `${(rf2 - rf1) * 100}%`;
    if (rBands[3]) rBands[3].style.height = `${(rf3 - rf2) * 100}%`;
    if (rBands[4]) rBands[4].style.height = `${(1.0 - rf3) * 100}%`;

    // 2. Right handles
    fractions.forEach((f, idx) => {
      const handle = document.getElementById(`compareHandle${idx}`);
      if (handle) {
        if (!isCompareActive) {
          handle.classList.add("hidden");
          handle.style.removeProperty("display");
          handle.style.removeProperty("bottom");
          handle.style.removeProperty("top");
          handle.style.removeProperty("left");
          handle.style.display = "none";
          return;
        }
        handle.classList.remove("hidden");
        handle.style.setProperty("bottom", `${f * 100}%`, "important");
        handle.style.setProperty("top", "auto", "important");
        handle.style.setProperty("display", "flex", "important");
        handle.style.left = "";
      }
    });

    // 3. Right tags
    const rightTags = [
      document.getElementById("splitRightTag0"),
      document.getElementById("splitRightTag1"),
      document.getElementById("splitRightTag2"),
      document.getElementById("splitRightTag3"),
    ];
    fractions.forEach((f, idx) => {
      const tag = rightTags[idx];
      if (tag) {
        tag.style.bottom = `${f * 100}%`;
        const val = rightMin + f * rightRange;
        tag.textContent = formatValue(val, compareVariable);
      }
    });

    // 4. Right limits
    const rightMaxEl = document.getElementById("splitRightMax");
    const rightMinEl = document.getElementById("splitRightMin");
    if (rightMaxEl) rightMaxEl.textContent = formatValue(rightMax, compareVariable);
    if (rightMinEl) rightMinEl.textContent = formatValue(rightMin, compareVariable);

    // 5. Tooltips on Right bands
    const rt0 = rightMin + rf0 * rightRange;
    const rt1 = rightMin + rf1 * rightRange;
    const rt2 = rightMin + rf2 * rightRange;
    const rt3 = rightMin + rf3 * rightRange;
    const rVar = compareVariable;
    if (rBands[0]) rBands[0].title = `Right Band 1: ${formatValue(rightMin, rVar)} – ${formatValue(rt0, rVar)}`;
    if (rBands[1]) rBands[1].title = `Right Band 2: ${formatValue(rt0, rVar)} – ${formatValue(rt1, rVar)}`;
    if (rBands[2]) rBands[2].title = `Right Band 3: ${formatValue(rt1, rVar)} – ${formatValue(rt2, rVar)}`;
    if (rBands[3]) rBands[3].title = `Right Band 4: ${formatValue(rt2, rVar)} – ${formatValue(rt3, rVar)}`;
    if (rBands[4]) rBands[4].title = `Right Band 5: ${formatValue(rt3, rVar)} – ${formatValue(rightMax, rVar)}`;
  }

  // Unified Single Colorbar: Render Left and Right values flanking the dual track
  function renderUnifiedSplitColorbar(cmin_right, cmax_right) {
    if (!isCompareActive || !interactiveColorbarEl) return;

    if (cmin_right !== undefined && cmax_right !== undefined) {
      cachedRightMin = cmin_right;
      cachedRightMax = cmax_right;
    }

    // Left range from primary map
    let leftMin = 0;
    let leftMax = 1;
    if (typeof mapColorRange === "function") {
      [leftMin, leftMax] = mapColorRange();
    }
    if (leftMin === leftMax) leftMax = leftMin + 1;
    const leftRange = leftMax - leftMin;

    let leftFractions = getState().bandFractions;
    if (!leftFractions || leftFractions.length !== 4 || (leftFractions[3] - leftFractions[0] < 0.12) || leftFractions.some((f) => !Number.isFinite(f))) {
      leftFractions = [0.20, 0.40, 0.60, 0.80];
      getState().bandFractions = leftFractions;
    }
    const [lf0, lf1, lf2, lf3] = leftFractions;

    // 1. Update Header Title
    const titleEl = document.getElementById("colorbarTitle");
    if (titleEl) {
      const leftName = variableLabel(getState().variable);
      const rightName = variableLabel(compareVariable);
      titleEl.innerHTML = `<div class="split-title-line"><span class="compare-pill-badge left-badge">Left</span><span class="split-cb-name" title="${escapeHtml(leftName)}">${escapeHtml(leftName)}</span></div><div class="split-title-line"><span class="compare-pill-badge right-badge">Right</span><span class="split-cb-name" title="${escapeHtml(rightName)}">${escapeHtml(rightName)}</span></div>`;
    }

    // 2. Left Values Column
    const leftMaxEl = document.getElementById("splitLeftMax");
    const leftMinEl = document.getElementById("splitLeftMin");
    const leftTags = [
      document.getElementById("splitLeftTag0"),
      document.getElementById("splitLeftTag1"),
      document.getElementById("splitLeftTag2"),
      document.getElementById("splitLeftTag3"),
    ];

    if (leftMaxEl) leftMaxEl.textContent = formatValue(leftMax, getState().variable);
    if (leftMinEl) leftMinEl.textContent = formatValue(leftMin, getState().variable);

    leftFractions.forEach((f, idx) => {
      const tag = leftTags[idx];
      if (tag) {
        tag.style.bottom = `${f * 100}%`;
        const val = leftMin + f * leftRange;
        tag.textContent = formatValue(val, getState().variable);
      }
    });

    // 3. Left Track Bands and Handles
    const lBands = [0, 1, 2, 3, 4].map((i) => document.getElementById(`colorBand${i}`));
    const colors = tractColorRamp();
    lBands.forEach((b, i) => {
      if (b) {
        b.style.backgroundColor = colors[i];
        b.style.width = "100%";
      }
    });

    if (lBands[0]) lBands[0].style.height = `${lf0 * 100}%`;
    if (lBands[1]) lBands[1].style.height = `${(lf1 - lf0) * 100}%`;
    if (lBands[2]) lBands[2].style.height = `${(lf2 - lf1) * 100}%`;
    if (lBands[3]) lBands[3].style.height = `${(lf3 - lf2) * 100}%`;
    if (lBands[4]) lBands[4].style.height = `${(1.0 - lf3) * 100}%`;

    leftFractions.forEach((f, idx) => {
      const handle = document.getElementById(`colorbarHandle${idx}`);
      if (handle) {
        handle.classList.remove("hidden");
        handle.style.setProperty("bottom", `${f * 100}%`, "important");
        handle.style.setProperty("top", "auto", "important");
        handle.style.setProperty("display", "flex", "important");
        handle.style.left = "";
      }
    });

    const lt0 = leftMin + lf0 * leftRange;
    const lt1 = leftMin + lf1 * leftRange;
    const lt2 = leftMin + lf2 * leftRange;
    const lt3 = leftMin + lf3 * leftRange;
    const lVar = getState().variable;
    if (lBands[0]) lBands[0].title = `Left Band 1: ${formatValue(leftMin, lVar)} – ${formatValue(lt0, lVar)}`;
    if (lBands[1]) lBands[1].title = `Left Band 2: ${formatValue(lt0, lVar)} – ${formatValue(lt1, lVar)}`;
    if (lBands[2]) lBands[2].title = `Left Band 3: ${formatValue(lt1, lVar)} – ${formatValue(lt2, lVar)}`;
    if (lBands[3]) lBands[3].title = `Left Band 4: ${formatValue(lt2, lVar)} – ${formatValue(lt3, lVar)}`;
    if (lBands[4]) lBands[4].title = `Left Band 5: ${formatValue(lt3, lVar)} – ${formatValue(leftMax, lVar)}`;

    // 4. Render Right Track & Handles
    renderRightTrackAndHandles();

    // 5. Apply Paint Property to Compare Map
    applyCompareClassification();
  }

  // Populate data and compute color expression for compareMap
  function refreshCompareMapValues() {
    if (!isCompareActive || !compareMap) return;

    setupCompareLayers();

    const isTract = getState().geography === "tract";
    const values = [];

    if (isTract) {
      const tractRows = getTractRowsByState();
      if (compareMap.getSource("us-tracts")) {
        try {
          compareMap.removeFeatureState({ source: "us-tracts", sourceLayer: "tracts" });
        } catch {}
      }
      if (tractRows) {
        tractRows.forEach((rows) => {
          rows.forEach((row) => {
            if (Number(row.year) === Number(getState().year)) {
              const rawVal = row[compareVariable];
              const val = rawVal !== undefined && rawVal !== null ? toNumber(rawVal) : null;
              const geoid = String(row.GEOID).padStart(11, "0");

              try {
                compareMap.setFeatureState(
                  {
                    source: "us-tracts",
                    sourceLayer: "tracts",
                    id: Number(geoid),
                  },
                  { value: val }
                );
              } catch {}

              if (Number.isFinite(val)) values.push(val);
            }
          });
        });

        if (values.length) {
          let [cmin, cmax] = colorRange(values, getState().scaleMode);
          if (cmin === cmax) cmax = cmin + 1;
          cachedRightMin = cmin;
          cachedRightMax = cmax;
          renderUnifiedSplitColorbar(cmin, cmax);
          applyCompareClassification();
        }
      }
    } else {
      const rawGeo = getAdminGeojson();
      const adminRows = getAdminMapRows();
      const adminSource = compareMap.getSource("admin-areas");

      if (rawGeo && rawGeo.features) {
        const idLen = getState().geography === "state" ? 2 : 5;
        const compareGeojson = {
          ...rawGeo,
          features: rawGeo.features.map((feature) => {
            const rawId = getState().geography === "global"
              ? (feature.properties?.ISO_A3 ?? feature.properties?.iso_a3 ?? feature.id ?? "")
              : (feature.properties?.GEOID ?? feature.id ?? "");
            const fid = getState().geography === "global"
              ? String(rawId).toUpperCase()
              : String(rawId).padStart(idLen, "0");
            const row = adminRows ? adminRows.get(fid) : null;
            const rawVal = row ? row[compareVariable] : null;
            const val = rawVal !== undefined && rawVal !== null ? toNumber(rawVal) : null;
            if (Number.isFinite(val)) values.push(val);
            return {
              ...feature,
              id: fid,
              properties: {
                ...feature.properties,
                id: fid,
                value: val,
              },
            };
          }),
        };

        if (adminSource) {
          adminSource.setData(compareGeojson);
          try {
            compareMap.removeFeatureState({ source: "admin-areas" });
          } catch {}

          if (adminRows) {
            compareGeojson.features.forEach((feature) => {
              const fid = feature.id;
              const val = feature.properties.value;
              try {
                compareMap.setFeatureState(
                  { source: "admin-areas", id: fid },
                  { value: val }
                );
              } catch {}
            });
          }

          // When tile worker completes setData, ensure classification paint is applied
          compareMap.once("idle", () => {
            if (isCompareActive) {
              applyCompareClassification();
            }
          });
        }

        if (values.length) {
          let [cmin, cmax] = colorRange(values, getState().scaleMode);
          if (cmin === cmax) cmax = cmin + 1;
          cachedRightMin = cmin;
          cachedRightMax = cmax;
          renderUnifiedSplitColorbar(cmin, cmax);
          applyCompareClassification();
        }
      }
    }
  }

  // Calculate Quantiles for Right Variable
  function computeRightQuantiles() {
    let { values, min, max } = computeRightDataStats(compareVariable);
    if (!values.length) return;

    values.sort((a, b) => a - b);
    if (values.length >= 5) {
      let cmin = cachedRightMin || min;
      let cmax = cachedRightMax || max;
      if (cmin === cmax) cmax = cmin + 1;
      const range = cmax - cmin || 1;

      const q0 = quantile(values, 0.20);
      const q1 = quantile(values, 0.40);
      const q2 = quantile(values, 0.60);
      const q3 = quantile(values, 0.80);

      let f0 = Math.max(0.04, Math.min(0.82, (q0 - cmin) / range));
      let f1 = Math.max(f0 + 0.05, Math.min(0.87, (q1 - cmin) / range));
      let f2 = Math.max(f1 + 0.05, Math.min(0.92, (q2 - cmin) / range));
      let f3 = Math.max(f2 + 0.05, Math.min(0.97, (q3 - cmin) / range));

      getState().compareBandFractions = [f0, f1, f2, f3];
      renderRightTrackAndHandles();
      applyCompareClassification();
    }
  }

  // Reset Right Equal Intervals
  function resetRightEqual() {
    getState().compareBandFractions = [0.20, 0.40, 0.60, 0.80];
    renderRightTrackAndHandles();
    applyCompareClassification();
  }

  function styleComparePopup() {
    const el = compareHoverPopup?.getElement();
    if (!el) return;
    const popupContent = el.querySelector(".maplibregl-popup-content");
    if (popupContent) {
      popupContent.style.background = isDarkMode() ? "#0f172a" : "#ffffff";
      popupContent.style.color = isDarkMode() ? "#f8fafc" : "#0f172a";
      popupContent.style.border = isDarkMode() ? "1px solid #16a34a" : "1px solid #cbd5e1";
      popupContent.style.borderRadius = "8px";
      popupContent.style.boxShadow = "0 8px 22px rgba(0, 0, 0, 0.45)";
      popupContent.style.padding = "10px 12px";
      popupContent.style.fontSize = "13px";
    }
    const tip = el.querySelector(".maplibregl-popup-tip");
    if (tip) {
      tip.style.borderTopColor = isDarkMode() ? "#0f172a" : "#ffffff";
      tip.style.borderBottomColor = isDarkMode() ? "#0f172a" : "#ffffff";
      tip.style.borderLeftColor = isDarkMode() ? "#0f172a" : "#ffffff";
      tip.style.borderRightColor = isDarkMode() ? "#0f172a" : "#ffffff";
    }
  }

  function handleCompareHover(event) {
    if (!event.features?.length) return;
    const feat = event.features[0];
    const geoid = String(feat.id).padStart(11, "0");
    const val = feat.state?.value;

    compareHoverPopup
      .setLngLat(event.lngLat)
      .setHTML(
        `<strong>Census Tract:</strong> ${escapeHtml(geoid)}<br>` +
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;margin-right:4px;"></span>` +
        `<strong>Right (${escapeHtml(variableLabel(compareVariable))}):</strong> ` +
        `${Number.isFinite(val) ? formatValue(val, compareVariable) : "No data"}`
      )
      .addTo(compareMap);

    styleComparePopup();
  }

  function handleCompareHoverAdmin(event) {
    if (!event.features?.length) return;
    const feat = event.features[0];
    const name = feat.properties?.NAME || feat.properties?.county_name || feat.id;
    const val = feat.properties?.value ?? feat.state?.value;

    compareHoverPopup
      .setLngLat(event.lngLat)
      .setHTML(
        `<strong>${escapeHtml(name)}</strong><br>` +
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;margin-right:4px;"></span>` +
        `<strong>Right (${escapeHtml(variableLabel(compareVariable))}):</strong> ` +
        `${Number.isFinite(val) ? formatValue(val, compareVariable) : "No data"}`
      )
      .addTo(compareMap);

    styleComparePopup();
  }

  // Pointer dragging on swiper handle
  swiperEl.addEventListener("pointerdown", (e) => {
    isDragging = true;
    swiperEl.classList.add("is-dragging");
    swiperEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  swiperEl.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const rect = wrapEl.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    applySplitPosition(fraction);
  });

  swiperEl.addEventListener("pointerup", () => {
    isDragging = false;
    swiperEl.classList.remove("is-dragging");
  });

  swiperEl.addEventListener("pointercancel", () => {
    isDragging = false;
    swiperEl.classList.remove("is-dragging");
  });

  // Pointer dragging on Right Colorbar Handles (compareHandle0..3) with smart touch disambiguation
  let activeRightHandle = null;
  let activeRightTrackRect = null;
  let rightDragRafId = null;

  const onRightPointerMove = (e) => {
    if (activeRightHandle === null || !activeRightTrackRect) return;
    try { e.preventDefault(); } catch {}

    const dist = activeRightTrackRect.bottom - e.clientY;
    const raw = dist / activeRightTrackRect.height;

    const MIN_BOUND = 0.03;
    const MAX_BOUND = 0.97;
    const MIN_GAP = 0.05;

    const i = activeRightHandle;
    const minPossible = MIN_BOUND + i * MIN_GAP;
    const maxPossible = MAX_BOUND - (3 - i) * MIN_GAP;

    const fractions = getState().compareBandFractions || [0.2, 0.4, 0.6, 0.8];
    fractions[i] = Math.max(minPossible, Math.min(maxPossible, raw));

    for (let k = i + 1; k < 4; k++) {
      if (fractions[k] < fractions[k - 1] + MIN_GAP) {
        fractions[k] = fractions[k - 1] + MIN_GAP;
      }
    }
    for (let k = i - 1; k >= 0; k--) {
      if (fractions[k] > fractions[k + 1] - MIN_GAP) {
        fractions[k] = fractions[k + 1] - MIN_GAP;
      }
    }
    getState().compareBandFractions = fractions;

    if (!rightDragRafId) {
      rightDragRafId = requestAnimationFrame(() => {
        rightDragRafId = null;
        renderRightTrackAndHandles();
        applyCompareClassification();
      });
    }
  };

  const onRightPointerUp = (e) => {
    if (activeRightHandle !== null) {
      const idx = activeRightHandle;
      const h = document.getElementById(`compareHandle${idx}`);
      window.removeEventListener("pointermove", onRightPointerMove);
      window.removeEventListener("pointerup", onRightPointerUp);
      window.removeEventListener("pointercancel", onRightPointerUp);
      if (h) {
        h.removeEventListener("pointermove", onRightPointerMove);
        try { h.releasePointerCapture(e.pointerId); } catch {}
        h.classList.remove("dragging");
        h.style.zIndex = "";
      }
      const tag = document.getElementById(`splitRightTag${idx}`);
      if (tag) tag.classList.remove("dragging");

      if (rightDragRafId) {
        cancelAnimationFrame(rightDragRafId);
        rightDragRafId = null;
      }
      activeRightHandle = null;
      activeRightTrackRect = null;
      interactiveColorbarEl?.classList.remove("is-dragging");
      renderRightTrackAndHandles();
      applyCompareClassification();
    }
  };

  function startRightDrag(idx, e) {
    const targetHandle = document.getElementById(`compareHandle${idx}`);
    if (!targetHandle) return;
    try { targetHandle.setPointerCapture(e.pointerId); } catch {}
    activeRightHandle = idx;
    targetHandle.classList.add("dragging");
    targetHandle.style.zIndex = "50";
    interactiveColorbarEl?.classList.add("is-dragging");

    const track = document.getElementById("colorbarTrackRight") || document.getElementById("colorbarTrack");
    if (track) {
      activeRightTrackRect = track.getBoundingClientRect();
    }

    const tag = document.getElementById(`splitRightTag${idx}`);
    if (tag) tag.classList.add("dragging");

    window.addEventListener("pointermove", onRightPointerMove, { passive: false });
    window.addEventListener("pointerup", onRightPointerUp);
    window.addEventListener("pointercancel", onRightPointerUp);
    targetHandle.addEventListener("pointermove", onRightPointerMove, { passive: false });
  }

  for (let i = 0; i < 4; i++) {
    const handle = document.getElementById(`compareHandle${i}`);
    if (handle) {
      handle.addEventListener("pointerdown", (e) => {
        if (!isCompareActive) return;
        e.preventDefault();
        e.stopPropagation();
        const track = document.getElementById("colorbarTrackRight") || document.getElementById("colorbarTrack");
        if (track) activeRightTrackRect = track.getBoundingClientRect();
        if (activeRightTrackRect) {
          const dist = activeRightTrackRect.bottom - e.clientY;
          const touchFraction = Math.max(0, Math.min(1, dist / activeRightTrackRect.height));
          const fractions = getState().compareBandFractions || [0.2, 0.4, 0.6, 0.8];
          let targetIdx = i;
          let minDist = Math.abs(fractions[i] - touchFraction);
          for (let j = 0; j < 4; j++) {
            const d = Math.abs(fractions[j] - touchFraction);
            if (d < minDist) {
              minDist = d;
              targetIdx = j;
            }
          }
          startRightDrag(targetIdx, e);
        } else {
          startRightDrag(i, e);
        }
      });
    }

    const tag = document.getElementById(`splitRightTag${i}`);
    if (tag) {
      tag.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startRightDrag(i, e);
      });
    }
  }

  const rightTrackDom = document.getElementById("colorbarTrackRight");
  if (rightTrackDom) {
    rightTrackDom.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      activeRightTrackRect = rightTrackDom.getBoundingClientRect();
      const dist = activeRightTrackRect.bottom - e.clientY;
      const touchFraction = Math.max(0, Math.min(1, dist / activeRightTrackRect.height));
      const fractions = getState().compareBandFractions || [0.2, 0.4, 0.6, 0.8];
      let targetIdx = 0;
      let minDist = Math.abs(fractions[0] - touchFraction);
      for (let j = 1; j < 4; j++) {
        const d = Math.abs(fractions[j] - touchFraction);
        if (d < minDist) {
          minDist = d;
          targetIdx = j;
        }
      }
      startRightDrag(targetIdx, e);
    });
  }

  // Mini Action Buttons
  rightEqualBtn?.addEventListener("click", resetRightEqual);
  rightQuantBtn?.addEventListener("click", computeRightQuantiles);

  // Toggle Compare Mode
  async function enableCompare() {
    isCompareActive = true;
    toggleBtn.classList.add("active");
    if (toggleBtnText) toggleBtnText.textContent = "Exit Split";

    if (bivariateMapRef && bivariateMapRef.isActive()) {
      bivariateMapRef.disable();
    }

    if (!compareVariable || compareVariable === getState().variable) {
      compareVariable = getDefaultCompareVariable(getState().variable);
    }

    // Ensure both Left and Right fractions are valid, separated, and not clustered
    let lFrac = getState().bandFractions;
    if (!lFrac || lFrac.length !== 4 || (lFrac[3] - lFrac[0] < 0.12) || lFrac.some((f) => !Number.isFinite(f))) {
      getState().bandFractions = [0.20, 0.40, 0.60, 0.80];
    }
    let rFrac = getState().compareBandFractions;
    if (!rFrac || rFrac.length !== 4 || (rFrac[3] - rFrac[0] < 0.12) || rFrac.some((f) => !Number.isFinite(f))) {
      getState().compareBandFractions = [0.20, 0.40, 0.60, 0.80];
    }

    populateCompareOptions();

    if (leftLabelEl) {
      leftLabelEl.textContent = variableLabel(getState().variable);
      leftLabelEl.title = variableLabel(getState().variable);
    }
    if (leftBadgeEl) leftBadgeEl.textContent = "Left";
    if (rightBadgeEl) rightBadgeEl.textContent = "Right";
    if (dividerEl) dividerEl.textContent = "vs";
    if (rightSelectEl) {
      rightSelectEl.value = compareVariable;
      rightSelectEl.title = variableLabel(compareVariable);
    }

    if (getState().geography === "tract" && typeof ensureTractVariableLoaded === "function") {
      await ensureTractVariableLoaded(compareVariable);
    }

    // Pre-calculate right variable stats so colorbar never initializes with 0-1
    const { min, max } = computeRightDataStats(compareVariable);
    cachedRightMin = min;
    cachedRightMax = max;

    // Unified Dual-Track: activate split mode layout
    if (interactiveColorbarEl) {
      interactiveColorbarEl.classList.add("split-active");
      if (splitLeftCol) splitLeftCol.classList.remove("hidden");
      if (splitRightCol) splitRightCol.classList.remove("hidden");
      if (rightTrackEl) rightTrackEl.classList.remove("hidden");
      for (let i = 0; i < 4; i++) {
        const lh = document.getElementById(`colorbarHandle${i}`);
        if (lh) {
          lh.classList.remove("hidden");
          lh.style.setProperty("bottom", `${getState().bandFractions[i] * 100}%`, "important");
          lh.style.setProperty("top", "auto", "important");
          lh.style.setProperty("display", "flex", "important");
          lh.style.left = "";
        }
        const rh = document.getElementById(`compareHandle${i}`);
        if (rh) {
          rh.classList.remove("hidden");
          rh.style.setProperty("bottom", `${getState().compareBandFractions[i] * 100}%`, "important");
          rh.style.setProperty("top", "auto", "important");
          rh.style.setProperty("display", "flex", "important");
          rh.style.left = "";
        }
      }
      renderUnifiedSplitColorbar(min, max);
    }

    compareMapEl.classList.remove("hidden");
    swiperEl.classList.remove("hidden");
    controlBarEl.classList.remove("hidden");

    applySplitPosition(splitFraction);
    ensureCompareMap();
    refreshCompareMapValues();
    applyCompareClassification();

    requestAnimationFrame(() => {
      compareMap?.resize();
      getTractMap()?.resize();
    });
  }

  function disableCompare(keepControlBar = false) {
    isCompareActive = false;
    toggleBtn.classList.remove("active");
    if (toggleBtnText) toggleBtnText.textContent = "Split Map";

    // Restore single-variable colorbar layout
    if (interactiveColorbarEl) {
      interactiveColorbarEl.classList.remove("split-active");
      if (splitLeftCol) splitLeftCol.classList.add("hidden");
      if (splitRightCol) splitRightCol.classList.add("hidden");
      if (rightTrackEl) rightTrackEl.classList.add("hidden");
      for (let i = 0; i < 4; i++) {
        const rh = document.getElementById(`compareHandle${i}`);
        if (rh) {
          rh.classList.add("hidden");
          rh.style.removeProperty("display");
          rh.style.removeProperty("bottom");
          rh.style.removeProperty("top");
          rh.style.removeProperty("left");
          rh.style.display = "none";
        }
        const lh = document.getElementById(`colorbarHandle${i}`);
        if (lh) {
          lh.style.removeProperty("display");
          lh.style.removeProperty("bottom");
          lh.style.removeProperty("top");
          lh.style.removeProperty("left");
        }
      }
      const titleEl = document.getElementById("colorbarTitle");
      if (titleEl) {
        titleEl.textContent = variableLabel(getState().variable);
      }
    }

    compareMapEl.classList.add("hidden");
    compareMapEl.style.clipPath = "";
    swiperEl.classList.add("hidden");
    if (!keepControlBar && !(bivariateMapRef && bivariateMapRef.isActive())) {
      controlBarEl.classList.add("hidden");
    }
    compareHoverPopup?.remove();

    // Re-apply single classification to tractMap immediately upon exit
    if (typeof applySingleClassification === "function") {
      applySingleClassification();
    }

    requestAnimationFrame(() => {
      getTractMap()?.resize();
      if (typeof updateInteractiveColorbar === "function") {
        updateInteractiveColorbar();
      }
      if (typeof applySingleClassification === "function") {
        applySingleClassification();
      }
    });
  }

  async function toggleCompare() {
    if (isCompareActive) {
      disableCompare();
    } else {
      await enableCompare();
    }
  }

  toggleBtn.addEventListener("click", toggleCompare);
  closeBtn?.addEventListener("click", () => {
    if (bivariateMapRef && bivariateMapRef.isActive()) {
      bivariateMapRef.disable();
    }
    disableCompare();
  });

  rightSelectEl?.addEventListener("change", async (e) => {
    compareVariable = e.target.value;
    rightSelectEl.title = variableLabel(compareVariable);
    if (bivariateMapRef && bivariateMapRef.isActive()) {
      bivariateMapRef.setYVariable(compareVariable);
      return;
    }
    if (getState().geography === "tract" && typeof ensureTractVariableLoaded === "function") {
      await ensureTractVariableLoaded(compareVariable);
    }
    getState().compareBandFractions = [0.20, 0.40, 0.60, 0.80];
    const { min, max } = computeRightDataStats(compareVariable);
    cachedRightMin = min;
    cachedRightMax = max;
    renderUnifiedSplitColorbar(min, max);
    refreshCompareMapValues();
    applyCompareClassification();
  });

  // Public API
  return {
    isActive: () => isCompareActive,
    getCompareMap: () => compareMap,
    getSplitFraction: () => splitFraction,
    getCompareVariable: () => compareVariable,
    toggle: toggleCompare,
    enable: enableCompare,
    disable: disableCompare,
    update: async () => {
      if (leftLabelEl) {
        leftLabelEl.textContent = variableLabel(getState().variable);
        leftLabelEl.title = variableLabel(getState().variable);
      }
      if (isCompareActive) {
        populateCompareOptions();
        if (getState().geography === "tract" && typeof ensureTractVariableLoaded === "function") {
          await ensureTractVariableLoaded(compareVariable);
          const { min, max } = computeRightDataStats(compareVariable);
          cachedRightMin = min;
          cachedRightMax = max;
          if (interactiveColorbarEl) {
            renderUnifiedSplitColorbar(min, max);
          }
        }
        refreshCompareMapValues();
        applyCompareClassification();
      }
    },
    updateColorbar: (cmin_left, cmax_left) => {
      if (isCompareActive) {
        renderUnifiedSplitColorbar();
        applyCompareClassification();
      }
    },
    applyClassification: applyCompareClassification,
    resize: () => {
      if (isCompareActive && compareMap) {
        compareMap.resize();
      }
    },
    setBivariateMap: (bm) => {
      bivariateMapRef = bm;
    },
    getBivariateMap: () => bivariateMapRef,
  };
}

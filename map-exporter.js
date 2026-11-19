/* =====================================================================
   map-exporter.js
   High-Resolution Map & Report Exporter for iCHARMrisk
   Supports:
     - Standard Choropleth, Split Map Swiper, and Bivariate 2D Matrix
     - Publication Layout (Title, Metadata, HUD Legend, Attribution)
     - Clean Full-Bleed Map Export
     - High-Res 2x (300 DPI) and Standard 1x
     - Direct PNG Download & Copy-to-Clipboard
   ===================================================================== */

export function initMapExporter({
  getTractMap,
  getMapCompare,
  getBivariateMap,
  getState,
  isDarkMode,
  variableLabel,
  formatValue,
}) {
  // DOM References
  const triggerBtn = document.getElementById("exportMapBtn");
  const modalBackdrop = document.getElementById("exportModalBackdrop");
  const closeBtn = document.getElementById("exportModalCloseBtn");
  const previewCanvas = document.getElementById("exportPreviewCanvas");
  const previewWrapper = document.getElementById("exportPreviewWrapper");
  const loadingSpinner = document.getElementById("exportLoadingSpinner");
  const dimensionBadge = document.getElementById("exportDimensionBadge");
  const downloadBtn = document.getElementById("exportDownloadBtn");
  const copyBtn = document.getElementById("exportCopyBtn");
  const copyBtnText = document.getElementById("exportCopyBtnText");

  // Options State
  let activeLayout = "figure"; // "figure" | "clean"
  let activeResolution = 2;   // 2 (High-Res 300 DPI) | 1 (Standard)
  let activeTheme = "dark";    // "dark" | "light"
  let isGenerating = false;
  let cachedCompositeCanvas = null;

  if (!modalBackdrop || !previewCanvas) {
    console.warn("[MapExporter] Modal elements not found in DOM");
    return { open: openModal, close: closeModal };
  }

  // --- Helper: Get Active Mode ---
  function getActiveMode() {
    const compare = getMapCompare ? getMapCompare() : null;
    if (compare && compare.isActive()) return "split";
    const bivariate = getBivariateMap ? getBivariateMap() : null;
    if (bivariate && bivariate.isActive()) return "bivariate";
    return "single";
  }

  // --- Helper: Force Map Repaint & Capture Canvas ---
  async function prepareMapCanvas(map) {
    if (!map) return null;
    const canvas = map.getCanvas();
    if (!canvas) return null;

    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        map.off("idle", done);
        resolve(canvas);
      };

      map.once("idle", done);
      map.triggerRepaint();
      setTimeout(done, 300);
    });
  }

  // --- Helper: Draw Rounded Rectangle ---
  function drawRoundRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // --- Composite Canvas Generator ---
  async function generateComposite({ layout = "figure", resolution = 2, theme = "dark" }) {
    const tractMap = getTractMap ? getTractMap() : null;
    if (!tractMap) return null;

    const mode = getActiveMode();
    const tractCanvas = await prepareMapCanvas(tractMap);
    if (!tractCanvas) return null;

    let compareCanvas = null;
    let splitFraction = 0.5;

    if (mode === "split") {
      const compare = getMapCompare ? getMapCompare() : null;
      const compareMap = compare && compare.getCompareMap ? compare.getCompareMap() : null;
      if (compareMap) {
        compareCanvas = await prepareMapCanvas(compareMap);
      }
      if (compare && compare.getSplitFraction) {
        splitFraction = compare.getSplitFraction();
      }
    }

    const mapW = tractCanvas.width;
    const mapH = tractCanvas.height;

    // Fast-path: Clean Map Only
    if (layout === "clean") {
      const outCanvas = document.createElement("canvas");
      outCanvas.width = mapW;
      outCanvas.height = mapH;
      const ctx = outCanvas.getContext("2d");

      // Draw left/base map
      ctx.drawImage(tractCanvas, 0, 0);

      // If split mode, draw right clipped map
      if (mode === "split" && compareCanvas) {
        const splitX = Math.round(mapW * splitFraction);
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, mapW - splitX, mapH);
        ctx.clip();
        ctx.drawImage(compareCanvas, 0, 0);
        ctx.restore();

        // Divider Line
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, mapH);
        ctx.stroke();

        // Center Swiper Handle
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(splitX, mapH / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("◀ ▶", splitX, mapH / 2);
      }

      return outCanvas;
    }

    // Publication Figure Layout
    const resScale = Math.max(0.85, (mapW / 1400) * (resolution === 2 ? 1.15 : 0.9));
    const padX = Math.round(26 * resScale);
    const padTop = Math.round(112 * resScale);
    const padBottom = Math.round(52 * resScale);

    const outW = mapW + padX * 2;
    const outH = mapH + padTop + padBottom;

    const outCanvas = document.createElement("canvas");
    outCanvas.width = outW;
    outCanvas.height = outH;
    const ctx = outCanvas.getContext("2d");

    const isDark = theme === "dark";

    // 1. Canvas Background
    if (isDark) {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, outH);
      bgGrad.addColorStop(0, "#0a0f1d");
      bgGrad.addColorStop(1, "#0d1527");
      ctx.fillStyle = bgGrad;
    } else {
      ctx.fillStyle = "#f8fafc";
    }
    ctx.fillRect(0, 0, outW, outH);

    // Outer subtle border
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, outW, outH);

    // 2. Header: Logo & Branding
    const brandX = padX;
    const brandY = Math.round(28 * resScale);

    // Brand Name: iCHARM (sky) + risk (amber)
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `bold ${Math.round(22 * resScale)}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#38bdf8"; // Sky blue
    ctx.fillText("iCHARM", brandX, brandY);
    const icharmWidth = ctx.measureText("iCHARM").width;

    ctx.fillStyle = "#f59e0b"; // Amber
    ctx.fillText("risk", brandX + icharmWidth, brandY);
    const riskWidth = ctx.measureText("risk").width;

    // Sub-brand badge
    const badgeX = brandX + icharmWidth + riskWidth + Math.round(12 * resScale);
    const badgeY = brandY + Math.round(2 * resScale);
    ctx.font = `500 ${Math.round(11 * resScale)}px system-ui, sans-serif`;
    ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
    drawRoundRect(ctx, badgeX, badgeY, Math.round(175 * resScale), Math.round(22 * resScale), 4 * resScale);
    ctx.fill();

    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.textBaseline = "middle";
    ctx.fillText("SDSU SCIL Geospatial Analytics", badgeX + Math.round(8 * resScale), badgeY + Math.round(11 * resScale));

    // 3. Header: Main Title
    const titleY = brandY + Math.round(30 * resScale);
    ctx.font = `bold ${Math.round(20 * resScale)}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
    ctx.textBaseline = "top";

    let mainTitle = document.getElementById("dashboardTitle")?.textContent || "Geographic Dashboard";
    if (mode === "bivariate") {
      const varX = document.getElementById("bivScaleNameX")?.textContent || "Variable X";
      const varY = document.getElementById("bivScaleNameY")?.textContent || "Variable Y";
      mainTitle = `${varX} × ${varY}`;
    } else if (mode === "split") {
      const varLeft = document.getElementById("splitLeftLabel")?.textContent || "Left Variable";
      const varRight = document.getElementById("splitRightLabel")?.textContent || "Right Variable";
      mainTitle = `${varLeft}  vs  ${varRight}`;
    }
    // Truncate title if too wide
    const maxTitleW = outW - padX * 2 - Math.round(200 * resScale);
    if (ctx.measureText(mainTitle).width > maxTitleW) {
      while (mainTitle.length > 10 && ctx.measureText(mainTitle + "…").width > maxTitleW) {
        mainTitle = mainTitle.slice(0, -1);
      }
      mainTitle += "…";
    }
    ctx.fillText(mainTitle, brandX, titleY);

    // 4. Header: Metadata Line
    const metaY = titleY + Math.round(26 * resScale);
    ctx.font = `400 ${Math.round(12 * resScale)}px system-ui, sans-serif`;
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";

    const stateObj = getState ? getState() : {};
    const geoText = (stateObj.geography || "County").toUpperCase();
    const yearText = stateObj.year || "2024";
    const modeTag = mode === "bivariate" ? "Bivariate 2D Matrix" : mode === "split" ? "Split Map Swiper" : "Choropleth";
    const metaText = `Year: ${yearText}   •   Geography: ${geoText}   •   Analysis: ${modeTag}   •   Data: U.S. Census Bureau (ACS) & FEMA NRI`;
    ctx.fillText(metaText, brandX, metaY);

    // 5. Map Viewport (Rounded Frame)
    const mapBoxX = padX;
    const mapBoxY = padTop;
    const mapRadius = Math.round(10 * resScale);

    ctx.save();
    drawRoundRect(ctx, mapBoxX, mapBoxY, mapW, mapH, mapRadius);
    ctx.clip();

    // Draw Base Map
    ctx.drawImage(tractCanvas, mapBoxX, mapBoxY);

    // If Split Mode: Clip and draw secondary compare map
    if (mode === "split" && compareCanvas) {
      const splitX = Math.round(mapW * splitFraction);
      ctx.save();
      ctx.beginPath();
      ctx.rect(mapBoxX + splitX, mapBoxY, mapW - splitX, mapH);
      ctx.clip();
      ctx.drawImage(compareCanvas, mapBoxX, mapBoxY);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = Math.round(3 * resScale);
      ctx.beginPath();
      ctx.moveTo(mapBoxX + splitX, mapBoxY);
      ctx.lineTo(mapBoxX + splitX, mapBoxY + mapH);
      ctx.stroke();

      // Center Swiper Pill Handle
      const handleW = Math.round(44 * resScale);
      const handleH = Math.round(28 * resScale);
      const handleX = mapBoxX + splitX - handleW / 2;
      const handleY = mapBoxY + mapH / 2 - handleH / 2;

      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = Math.round(2 * resScale);
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = Math.round(8 * resScale);
      drawRoundRect(ctx, handleX, handleY, handleW, handleH, Math.round(14 * resScale));
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(11 * resScale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("◀ ▶", mapBoxX + splitX, mapBoxY + mapH / 2);
    }

    ctx.restore();

    // Map Border Stroke
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, mapBoxX, mapBoxY, mapW, mapH, mapRadius);
    ctx.stroke();

    // 6. Embedded Legend HUD (Overlaid on Bottom-Right of Map)
    renderEmbeddedLegend(ctx, {
      mode,
      mapBoxX,
      mapBoxY,
      mapW,
      mapH,
      resScale,
      isDark,
      stateObj,
    });

    // 7. Footer: Citations & Attribution
    const footerY = outH - padBottom + Math.round(18 * resScale);
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, outH - padBottom);
    ctx.lineTo(outW - padX, outH - padBottom);
    ctx.stroke();

    // Left footer: SDSU SCIL
    ctx.font = `500 ${Math.round(11 * resScale)}px system-ui, sans-serif`;
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("San Diego State University — Center for Complex Human-Environmental Systems (SCIL) | iCHARMrisk", padX, footerY);

    // Right footer: Date & Source
    ctx.textAlign = "right";
    const today = new Date().toISOString().split("T")[0];
    ctx.fillText(`Sources: U.S. Census Bureau (ACS), FEMA NRI • Exported: ${today}`, outW - padX, footerY);

    return outCanvas;
  }

  // --- Helper: Render Embedded HUD Legend on Map ---
  function renderEmbeddedLegend(ctx, { mode, mapBoxX, mapBoxY, mapW, mapH, resScale, isDark, stateObj }) {
    ctx.save();

    if (mode === "bivariate") {
      // 3x3 Bivariate Matrix HUD
      const cardW = Math.round(280 * resScale);
      const cardH = Math.round(220 * resScale);
      const cardX = mapBoxX + mapW - cardW - Math.round(18 * resScale);
      const cardY = mapBoxY + mapH - cardH - Math.round(18 * resScale);

      // Card Background
      ctx.fillStyle = isDark ? "rgba(11, 17, 30, 0.88)" : "rgba(255, 255, 255, 0.92)";
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)";
      ctx.lineWidth = 1;
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, Math.round(8 * resScale));
      ctx.fill();
      ctx.stroke();

      // Header
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round(12 * resScale)}px sans-serif`;
      ctx.fillStyle = isDark ? "#f1f5f9" : "#0f172a";
      ctx.fillText("BIVARIATE 2D MATRIX", cardX + Math.round(14 * resScale), cardY + Math.round(12 * resScale));

      // 3x3 Matrix Grid
      const matrixX = cardX + Math.round(50 * resScale);
      const matrixY = cardY + Math.round(36 * resScale);
      const cellSize = Math.round(26 * resScale);
      const gap = Math.round(3 * resScale);

      const cellNodes = document.querySelectorAll("#bivariateMatrix .bivariate-cell");
      // Map DOM cells (indices 0..8) to grid rows/cols
      // In bivariate-map: cell 6..8 top row, 3..5 mid row, 0..2 bot row
      const cellMap = [
        [6, 7, 8],
        [3, 4, 5],
        [0, 1, 2],
      ];

      cellMap.forEach((row, rIdx) => {
        row.forEach((cellIdx, cIdx) => {
          const cx = matrixX + cIdx * (cellSize + gap);
          const cy = matrixY + rIdx * (cellSize + gap);
          const domCell = cellNodes[cellIdx] || document.querySelector(`[data-cell="${cellIdx}"]`);
          const fillCol = domCell ? window.getComputedStyle(domCell).backgroundColor : "#64748b";

          ctx.fillStyle = fillCol;
          drawRoundRect(ctx, cx, cy, cellSize, cellSize, Math.round(3 * resScale));
          ctx.fill();
        });
      });

      // Y-Axis Labels (Left of matrix)
      ctx.font = `600 ${Math.round(9 * resScale)}px sans-serif`;
      ctx.fillStyle = isDark ? "#cbd5e1" : "#475569";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const yLabels = ["High", "Med", "Low"];
      yLabels.forEach((lbl, idx) => {
        const cy = matrixY + idx * (cellSize + gap) + cellSize / 2;
        ctx.fillText(lbl, matrixX - Math.round(6 * resScale), cy);
      });

      // Vertical Y Variable Label
      ctx.save();
      ctx.translate(cardX + Math.round(14 * resScale), matrixY + (cellSize * 3 + gap * 2) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.round(9 * resScale)}px sans-serif`;
      ctx.fillStyle = "#ec4899"; // Pink
      let varYName = document.getElementById("bivScaleNameY")?.textContent || "Var Y";
      if (varYName.length > 18) varYName = varYName.slice(0, 16) + "…";
      ctx.fillText(`▲ ${varYName}`, 0, 0);
      ctx.restore();

      // X-Axis Labels (Below matrix)
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const xLabels = ["Low", "Med", "High"];
      xLabels.forEach((lbl, idx) => {
        const cx = matrixX + idx * (cellSize + gap) + cellSize / 2;
        ctx.fillText(lbl, cx, matrixY + 3 * (cellSize + gap) + Math.round(3 * resScale));
      });

      // Horizontal X Variable Label
      ctx.font = `bold ${Math.round(9 * resScale)}px sans-serif`;
      ctx.fillStyle = "#06b6d4"; // Cyan
      let varXName = document.getElementById("bivScaleNameX")?.textContent || "Var X";
      if (varXName.length > 24) varXName = varXName.slice(0, 22) + "…";
      const xCenter = matrixX + (cellSize * 3 + gap * 2) / 2;
      ctx.fillText(`${varXName} ▶`, xCenter, matrixY + 3 * (cellSize + gap) + Math.round(18 * resScale));

      // Cutoffs Summary Pill Row at Bottom
      const cutoffY = cardY + cardH - Math.round(42 * resScale);
      ctx.font = `400 ${Math.round(8 * resScale)}px monospace`;
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.textAlign = "left";

      const xRange0 = document.getElementById("bivRangeX0")?.textContent?.trim() || "-";
      const xRange2 = document.getElementById("bivRangeX2")?.textContent?.trim() || "-";
      const yRange0 = document.getElementById("bivRangeY0")?.textContent?.trim() || "-";
      const yRange2 = document.getElementById("bivRangeY2")?.textContent?.trim() || "-";

      ctx.fillText(`X Cutoffs: ${xRange0} | ${xRange2}`, cardX + Math.round(14 * resScale), cutoffY);
      ctx.fillText(`Y Cutoffs: ${yRange0} | ${yRange2}`, cardX + Math.round(14 * resScale), cutoffY + Math.round(14 * resScale));

    } else if (mode === "split") {
      // Split Comparison Dual-Track Legend
      const cardW = Math.round(340 * resScale);
      const cardH = Math.round(120 * resScale);
      const cardX = mapBoxX + mapW - cardW - Math.round(18 * resScale);
      const cardY = mapBoxY + mapH - cardH - Math.round(18 * resScale);

      ctx.fillStyle = isDark ? "rgba(11, 17, 30, 0.88)" : "rgba(255, 255, 255, 0.92)";
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)";
      ctx.lineWidth = 1;
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, Math.round(8 * resScale));
      ctx.fill();
      ctx.stroke();

      // Left Variable Row
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round(11 * resScale)}px sans-serif`;
      ctx.fillStyle = "#3b82f6"; // Blue
      ctx.fillText("[LEFT]", cardX + Math.round(12 * resScale), cardY + Math.round(12 * resScale));

      let leftName = document.getElementById("splitLeftLabel")?.textContent || "Left Variable";
      if (leftName.length > 24) leftName = leftName.slice(0, 22) + "…";
      ctx.fillStyle = isDark ? "#f1f5f9" : "#0f172a";
      ctx.fillText(leftName, cardX + Math.round(58 * resScale), cardY + Math.round(12 * resScale));

      // Left 5 Bands
      const bandW = Math.round(48 * resScale);
      const bandH = Math.round(10 * resScale);
      const bandStartX = cardX + Math.round(58 * resScale);
      const bandStartY = cardY + Math.round(30 * resScale);

      for (let i = 0; i < 5; i++) {
        const bandEl = document.getElementById(`colorBand${i}`);
        ctx.fillStyle = bandEl ? window.getComputedStyle(bandEl).backgroundColor : "#3b82f6";
        ctx.fillRect(bandStartX + i * bandW, bandStartY, bandW - 1, bandH);
      }

      ctx.font = `400 ${Math.round(9 * resScale)}px sans-serif`;
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.fillText(document.getElementById("splitLeftMin")?.textContent || "Min", bandStartX, bandStartY + bandH + Math.round(3 * resScale));
      ctx.textAlign = "right";
      ctx.fillText(document.getElementById("splitLeftMax")?.textContent || "Max", bandStartX + 5 * bandW, bandStartY + bandH + Math.round(3 * resScale));

      // Right Variable Row
      const rightRowY = cardY + Math.round(65 * resScale);
      ctx.textAlign = "left";
      ctx.font = `bold ${Math.round(11 * resScale)}px sans-serif`;
      ctx.fillStyle = "#10b981"; // Green
      ctx.fillText("[RIGHT]", cardX + Math.round(12 * resScale), rightRowY);

      let rightName = document.getElementById("splitRightLabel")?.textContent || "Right Variable";
      if (rightName.length > 24) rightName = rightName.slice(0, 22) + "…";
      ctx.fillStyle = isDark ? "#f1f5f9" : "#0f172a";
      ctx.fillText(rightName, cardX + Math.round(58 * resScale), rightRowY);

      // Right 5 Bands
      const rightBandStartY = rightRowY + Math.round(18 * resScale);
      for (let i = 0; i < 5; i++) {
        const bandEl = document.getElementById(`colorBandRight${i}`) || document.getElementById(`colorBand${i}`);
        ctx.fillStyle = bandEl ? window.getComputedStyle(bandEl).backgroundColor : "#10b981";
        ctx.fillRect(bandStartX + i * bandW, rightBandStartY, bandW - 1, bandH);
      }

      ctx.font = `400 ${Math.round(9 * resScale)}px sans-serif`;
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.fillText(document.getElementById("splitRightMin")?.textContent || "Min", bandStartX, rightBandStartY + bandH + Math.round(3 * resScale));
      ctx.textAlign = "right";
      ctx.fillText(document.getElementById("splitRightMax")?.textContent || "Max", bandStartX + 5 * bandW, rightBandStartY + bandH + Math.round(3 * resScale));

    } else {
      // Standard Single-Variable Choropleth Legend
      const cardW = Math.round(280 * resScale);
      const cardH = Math.round(82 * resScale);
      const cardX = mapBoxX + mapW - cardW - Math.round(18 * resScale);
      const cardY = mapBoxY + mapH - cardH - Math.round(18 * resScale);

      ctx.fillStyle = isDark ? "rgba(11, 17, 30, 0.88)" : "rgba(255, 255, 255, 0.92)";
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)";
      ctx.lineWidth = 1;
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, Math.round(8 * resScale));
      ctx.fill();
      ctx.stroke();

      // Title & Classification
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round(11 * resScale)}px sans-serif`;
      ctx.fillStyle = isDark ? "#f1f5f9" : "#0f172a";

      let varTitle = document.getElementById("colorbarTitle")?.textContent || "Variable Scale";
      if (varTitle.length > 28) varTitle = varTitle.slice(0, 26) + "…";
      ctx.fillText(varTitle, cardX + Math.round(14 * resScale), cardY + Math.round(12 * resScale));

      // 5 Horizontal Color Bands
      const bandW = Math.round(50 * resScale);
      const bandH = Math.round(14 * resScale);
      const startX = cardX + Math.round(14 * resScale);
      const startY = cardY + Math.round(32 * resScale);

      for (let i = 0; i < 5; i++) {
        const bandEl = document.getElementById(`colorBand${i}`);
        ctx.fillStyle = bandEl ? window.getComputedStyle(bandEl).backgroundColor : "#3b82f6";
        drawRoundRect(ctx, startX + i * bandW, startY, bandW - 2, bandH, Math.round(2 * resScale));
        ctx.fill();
      }

      // Min and Max values
      ctx.font = `500 ${Math.round(9 * resScale)}px sans-serif`;
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.textAlign = "left";
      ctx.fillText(document.getElementById("colorbarLimitMin")?.textContent || "Min", startX, startY + bandH + Math.round(4 * resScale));

      ctx.textAlign = "right";
      ctx.fillText(document.getElementById("colorbarLimitMax")?.textContent || "Max", startX + 5 * bandW - 2, startY + bandH + Math.round(4 * resScale));
    }

    ctx.restore();
  }

  // --- Modal Live Preview Updater ---
  async function updatePreview() {
    if (isGenerating) return;
    isGenerating = true;

    if (loadingSpinner) loadingSpinner.classList.remove("hidden");

    try {
      // Generate preview using resolution 1 for instantaneous feedback
      const previewComp = await generateComposite({
        layout: activeLayout,
        resolution: 1,
        theme: activeTheme,
      });

      if (previewComp) {
        cachedCompositeCanvas = previewComp;
        previewCanvas.width = previewComp.width;
        previewCanvas.height = previewComp.height;

        const ctx = previewCanvas.getContext("2d");
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.drawImage(previewComp, 0, 0);

        // Update badge with full output dimension estimate
        const mult = activeResolution === 2 ? (activeLayout === "figure" ? 1.25 : 1) : 1;
        const outW = Math.round(previewComp.width * mult);
        const outH = Math.round(previewComp.height * mult);
        if (dimensionBadge) {
          dimensionBadge.textContent = `${outW} × ${outH} px ${activeResolution === 2 ? "(300 DPI High-Res)" : "(Standard)"}`;
        }
      }
    } catch (err) {
      console.error("[MapExporter] Failed to render preview:", err);
    } finally {
      if (loadingSpinner) loadingSpinner.classList.add("hidden");
      isGenerating = false;
    }
  }

  // --- File Download Handler ---
  async function handleDownload() {
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.style.opacity = "0.7";
    }

    try {
      const fullCanvas = await generateComposite({
        layout: activeLayout,
        resolution: activeResolution,
        theme: activeTheme,
      });

      if (!fullCanvas) throw new Error("Could not generate export canvas");

      fullCanvas.toBlob((blob) => {
        if (!blob) return;

        const stateObj = getState ? getState() : {};
        const varName = (stateObj.variable || "map").replace(/[^a-zA-Z0-9_-]/g, "_");
        const year = stateObj.year || "2024";
        const mode = getActiveMode();
        const filename = `iCHARMrisk_${mode}_${varName}_${year}.png`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    } catch (err) {
      console.error("[MapExporter] Download failed:", err);
      alert("Failed to export image: " + err.message);
    } finally {
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.style.opacity = "1";
      }
    }
  }

  // --- Copy to Clipboard Handler ---
  async function handleCopy() {
    if (!navigator.clipboard || !window.ClipboardItem) {
      alert("Clipboard image copy is not supported in this browser. Please use 'Download PNG Image'.");
      return;
    }

    if (copyBtn) {
      copyBtn.disabled = true;
    }

    try {
      const fullCanvas = await generateComposite({
        layout: activeLayout,
        resolution: activeResolution,
        theme: activeTheme,
      });

      if (!fullCanvas) throw new Error("Could not generate export canvas");

      fullCanvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

          if (copyBtnText) copyBtnText.textContent = "✓ Copied to Clipboard!";
          if (copyBtn) copyBtn.classList.add("copied-success");

          setTimeout(() => {
            if (copyBtnText) copyBtnText.textContent = "Copy to Clipboard";
            if (copyBtn) copyBtn.classList.remove("copied-success");
          }, 2500);
        } catch (clipErr) {
          console.warn("[MapExporter] Clipboard write failed, falling back to download:", clipErr);
          alert("Clipboard write permission was denied. Downloading image instead.");
          handleDownload();
        }
      }, "image/png");
    } catch (err) {
      console.error("[MapExporter] Copy failed:", err);
    } finally {
      if (copyBtn) copyBtn.disabled = false;
    }
  }

  // --- Open / Close Modal ---
  function openModal() {
    // Auto-detect current dashboard theme
    if (typeof isDarkMode === "function") {
      activeTheme = isDarkMode() ? "dark" : "light";
    } else {
      activeTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    }

    // Sync Theme radio inputs
    const themeRadio = document.querySelector(`input[name="exportTheme"][value="${activeTheme}"]`);
    if (themeRadio) themeRadio.checked = true;

    modalBackdrop.classList.remove("hidden");
    modalBackdrop.removeAttribute("hidden");
    document.body.style.overflow = "hidden";

    updatePreview();
  }

  function closeModal() {
    modalBackdrop.classList.add("hidden");
    modalBackdrop.setAttribute("hidden", "true");
    document.body.style.overflow = "";
  }

  // --- Wire Event Listeners ---
  if (triggerBtn) {
    triggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalBackdrop.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Layout Segmented Control
  const layoutBtns = document.querySelectorAll(".export-segment-btn");
  layoutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      layoutBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeLayout = btn.getAttribute("data-layout") || "figure";
      updatePreview();
    });
  });

  // Resolution Radio Inputs
  const resInputs = document.querySelectorAll('input[name="exportResolution"]');
  resInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      activeResolution = parseInt(e.target.value, 10) || 2;
      updatePreview();
    });
  });

  // Theme Radio Inputs
  const themeInputs = document.querySelectorAll('input[name="exportTheme"]');
  themeInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      activeTheme = e.target.value || "dark";
      updatePreview();
    });
  });

  // Download & Copy Buttons
  if (downloadBtn) {
    downloadBtn.addEventListener("click", handleDownload);
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", handleCopy);
  }

  return {
    open: openModal,
    close: closeModal,
    generateComposite,
  };
}

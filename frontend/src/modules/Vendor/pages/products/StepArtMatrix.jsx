import React, { useState, useMemo } from "react";
import { FiCheck, FiPlus, FiTrash2, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";

const DEFAULT_DIMENSIONS = ["8x10", "12x16", "16x20", "20x30", "24x36", "30x40"];
const DEFAULT_CANVAS_TYPES = ["Rolled Canvas", "Stretched Canvas", "Canvas Print", "Fine Art Paper"];
const DEFAULT_FRAME_TYPES = ["Frameless", "Wooden Frame", "Black Frame", "White Frame", "Oak Frame", "Gold Metal Frame"];

export default function StepArtMatrix({ formData, onChange }) {
  const [customDimension, setCustomDimension] = useState("");
  const [customCanvas, setCustomCanvas] = useState("");
  const [customFrame, setCustomFrame] = useState("");

  const variants = formData.variants || {};

  // Extract SI Unit & 1x1 pricing inputs from formData
  const pricingUnit = formData.pricingUnit || "inches";
  const unitBasePrice = formData.unitBasePrice || "";
  const canvasModifiers = formData.canvasModifiers || {};
  const frameModifiers = formData.frameModifiers || {};

  const unitLabel = pricingUnit === "cm" ? "cm"
    : pricingUnit === "feet" ? "ft"
    : pricingUnit === "meter" ? "m"
    : "in";

  // Extract currently selected attributes or default to empty lists
  const selectedDimensions = useMemo(() => {
    const attr = (variants.attributes || []).find(a => a.name === "Dimension");
    return attr ? attr.values : [];
  }, [variants.attributes]);

  const selectedCanvasTypes = useMemo(() => {
    const attr = (variants.attributes || []).find(a => a.name === "Canvas");
    return attr ? attr.values : [];
  }, [variants.attributes]);

  const selectedFrames = useMemo(() => {
    const attr = (variants.attributes || []).find(a => a.name === "Frame");
    return attr ? attr.values : [];
  }, [variants.attributes]);

  // Combined attributes update helper
  const updateAttributes = (dims, canvases, frames) => {
    const attributes = [];
    if (dims.length > 0) attributes.push({ name: "Dimension", values: dims });
    if (canvases.length > 0) attributes.push({ name: "Canvas", values: canvases });
    if (frames.length > 0) attributes.push({ name: "Frame", values: frames });

    onChange({
      variants: {
        ...variants,
        attributes
      }
    });
  };

  const toggleDimension = (dim) => {
    const next = selectedDimensions.includes(dim)
      ? selectedDimensions.filter(d => d !== dim)
      : [...selectedDimensions, dim];
    updateAttributes(next, selectedCanvasTypes, selectedFrames);
  };

  const toggleCanvas = (canvas) => {
    const next = selectedCanvasTypes.includes(canvas)
      ? selectedCanvasTypes.filter(c => c !== canvas)
      : [...selectedCanvasTypes, canvas];
    updateAttributes(selectedDimensions, next, selectedFrames);
  };

  const toggleFrame = (frame) => {
    const next = selectedFrames.includes(frame)
      ? selectedFrames.filter(f => f !== frame)
      : [...selectedFrames, frame];
    updateAttributes(selectedDimensions, selectedCanvasTypes, next);
  };

  const addCustomDimension = () => {
    const val = customDimension.trim();
    if (!val) return;
    if (selectedDimensions.includes(val)) {
      toast.error("Dimension already selected");
      return;
    }
    toggleDimension(val);
    setCustomDimension("");
  };

  const addCustomCanvas = () => {
    const val = customCanvas.trim();
    if (!val) return;
    if (selectedCanvasTypes.includes(val)) {
      toast.error("Canvas Type already selected");
      return;
    }
    toggleCanvas(val);
    setCustomCanvas("");
  };

  const addCustomFrame = () => {
    const val = customFrame.trim();
    if (!val) return;
    if (selectedFrames.includes(val)) {
      toast.error("Frame Type already selected");
      return;
    }
    toggleFrame(val);
    setCustomFrame("");
  };

  const hasDim = selectedDimensions.length > 0;
  const hasCanvas = selectedCanvasTypes.length > 0;
  const hasFrame = selectedFrames.length > 0;

  // Grid Combinations Resolvers
  const rows = useMemo(() => {
    if (hasDim) return selectedDimensions;
    if (hasCanvas) return selectedCanvasTypes;
    if (hasFrame) return selectedFrames;
    return ["Default Size"];
  }, [selectedDimensions, selectedCanvasTypes, selectedFrames, hasDim, hasCanvas, hasFrame]);

  const columns = useMemo(() => {
    if (hasDim && hasCanvas && hasFrame) {
      const cols = [];
      selectedCanvasTypes.forEach(c => {
        selectedFrames.forEach(f => {
          cols.push({ canvas: c, frame: f, label: `${c} + ${f}`, key: `${c}|${f}` });
        });
      });
      return cols;
    }

    if (hasDim && hasCanvas && !hasFrame) {
      return selectedCanvasTypes.map(c => ({ canvas: c, frame: null, label: c, key: c }));
    }

    if (hasDim && !hasCanvas && hasFrame) {
      return selectedFrames.map(f => ({ canvas: null, frame: f, label: f, key: f }));
    }

    if (!hasDim && hasCanvas && hasFrame) {
      return selectedFrames.map(f => ({ canvas: null, frame: f, label: f, key: f }));
    }

    return [{ canvas: null, frame: null, label: "Default Attribute", key: "default" }];
  }, [selectedDimensions, selectedCanvasTypes, selectedFrames, hasDim, hasCanvas, hasFrame]);

  // Key generator matching backend key signature format
  const getCellBackendKey = (rowVal, col) => {
    if (rowVal === "Default Size" && col.key === "default") {
      return "";
    }
    const parts = [];
    
    if (hasDim) {
      parts.push(`dimension=${rowVal.toLowerCase().replace(/\s+/g, '_')}`);
    } else if (hasCanvas) {
      parts.push(`canvas=${rowVal.toLowerCase().replace(/\s+/g, '_')}`);
    } else if (hasFrame) {
      parts.push(`frame=${rowVal.toLowerCase().replace(/\s+/g, '_')}`);
    }

    if (hasDim && hasCanvas && hasFrame) {
      parts.push(`canvas=${col.canvas.toLowerCase().replace(/\s+/g, '_')}`);
      parts.push(`frame=${col.frame.toLowerCase().replace(/\s+/g, '_')}`);
    } else if (hasDim && hasCanvas && !hasFrame) {
      parts.push(`canvas=${col.canvas.toLowerCase().replace(/\s+/g, '_')}`);
    } else if (hasDim && !hasCanvas && hasFrame) {
      parts.push(`frame=${col.frame.toLowerCase().replace(/\s+/g, '_')}`);
    } else if (!hasDim && hasCanvas && hasFrame) {
      parts.push(`frame=${col.frame.toLowerCase().replace(/\s+/g, '_')}`);
    }

    return parts.sort((a, b) => a.localeCompare(b)).join("|");
  };

  const handleCellChange = (dim, col, field, value) => {
    const backendKey = getCellBackendKey(dim, col);
    const prices = { ...(variants.prices || {}) };
    const stockMap = { ...(variants.stockMap || {}) };
    const inactive = { ...(variants.inactive || {}) };

    if (field === "price") {
      prices[backendKey] = value === "" ? "" : Number(value);
    } else if (field === "stock") {
      stockMap[backendKey] = value === "" ? "" : Number(value);
    } else if (field === "active") {
      if (value === false) {
        inactive[backendKey] = true;
      } else {
        delete inactive[backendKey];
      }
    }

    onChange({
      variants: {
        ...variants,
        prices,
        stockMap,
        inactive
      }
    });
  };

  const bulkSetColumnPrice = (col, price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice) || price === null || price === "") return;
    
    const prices = { ...(variants.prices || {}) };
    rows.forEach(dim => {
      const backendKey = getCellBackendKey(dim, col);
      prices[backendKey] = numPrice;
    });

    onChange({
      variants: {
        ...variants,
        prices
      }
    });
  };

  const bulkSetColumnStock = (col, stock) => {
    const numStock = Number(stock);
    if (isNaN(numStock) || stock === null || stock === "") return;
    
    const stockMap = { ...(variants.stockMap || {}) };
    rows.forEach(dim => {
      const backendKey = getCellBackendKey(dim, col);
      stockMap[backendKey] = numStock;
    });

    onChange({
      variants: {
        ...variants,
        stockMap
      }
    });
  };

  // ─── 1x1 Price Formula Engine ─────────────────────────────────────
  const computeVariantPrices = () => {
    const baseVal = parseFloat(unitBasePrice) || 0;
    if (!baseVal && baseVal !== 0) {
      toast.error("Please enter a Base Price per 1x1 unit first.");
      return;
    }

    const parseDim = (dimStr) => {
      const m = dimStr.match(/(\d+(?:\.\d+)?)\s*[xX×*]\s*(\d+(?:\.\d+)?)/i);
      return m ? { w: parseFloat(m[1]), h: parseFloat(m[2]) } : { w: 1, h: 1 };
    };

    const newPrices = { ...(variants.prices || {}) };
    let count = 0;

    rows.forEach(dimVal => {
      const { w, h } = parseDim(dimVal);
      const area = (w * h) || 1;

      columns.forEach(col => {
        const canvasName = col.canvas || (hasCanvas ? dimVal : null);
        const frameName = col.frame || (hasFrame ? dimVal : null);

        const canvasMod = parseFloat(canvasModifiers[canvasName]) || 0;
        const frameMod = parseFloat(frameModifiers[frameName]) || 0;

        const computedPrice = Math.round(area * (baseVal + canvasMod + frameMod));
        const backendKey = getCellBackendKey(dimVal, col);

        newPrices[backendKey] = computedPrice;
        count++;
      });
    });

    onChange({
      pricingUnit,
      unitBasePrice,
      canvasModifiers,
      frameModifiers,
      variants: {
        ...variants,
        prices: newPrices
      }
    });

    toast.success(`Calculated prices for ${count} variant combinations!`);
  };

  const isCanvasDisabled = selectedFrames.length > 0;
  const isFrameDisabled = selectedCanvasTypes.length > 0;

  return (
    <div className="space-y-6">
      {/* Configuration Selections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Dimensions Configuration */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Dimensions</h3>
            <p className="text-xs text-gray-400">Select all artwork dimensions offered.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_DIMENSIONS.map(dim => {
              const isChecked = selectedDimensions.includes(dim);
              return (
                <button
                  key={dim}
                  type="button"
                  onClick={() => toggleDimension(dim)}
                  className={`text-xs px-3 py-2 rounded-xl font-bold border transition-colors flex items-center gap-2 ${
                    isChecked
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    isChecked ? "border-white bg-white" : "border-gray-300"
                  }`}>
                    {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                  </span>
                  {dim} {unitLabel}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Custom e.g. 10x12"
              value={customDimension}
              onChange={e => setCustomDimension(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
            />
            <button
              type="button"
              onClick={addCustomDimension}
              className="p-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-600 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Types Configuration */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Canvas / Paper Types</h3>
            <p className="text-xs text-gray-400">Select physical canvas structures.</p>
            {isCanvasDisabled && (
              <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ Disabled: Frame option is already selected</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CANVAS_TYPES.map(can => {
              const isChecked = selectedCanvasTypes.includes(can);
              return (
                <button
                  key={can}
                  type="button"
                  disabled={isCanvasDisabled && !isChecked}
                  onClick={() => toggleCanvas(can)}
                  className={`text-xs px-3 py-2 rounded-xl font-bold border transition-colors flex items-center gap-2 ${
                    isChecked
                      ? "bg-primary-600 border-primary-600 text-white"
                      : isCanvasDisabled
                        ? "bg-gray-100 text-gray-400 border-gray-150 cursor-not-allowed opacity-50"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    isChecked ? "border-white bg-white" : "border-gray-300"
                  }`}>
                    {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                  </span>
                  {can}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isCanvasDisabled ? "Disabled" : "Custom canvas type..."}
              disabled={isCanvasDisabled}
              value={customCanvas}
              onChange={e => setCustomCanvas(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              type="button"
              disabled={isCanvasDisabled}
              onClick={addCustomCanvas}
              className="p-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Frame Types Configuration */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Frame Options</h3>
            <p className="text-xs text-gray-400">Select framing structures.</p>
            {isFrameDisabled && (
              <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ Disabled: Canvas option is already selected</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_FRAME_TYPES.map(frame => {
              const isChecked = selectedFrames.includes(frame);
              return (
                <button
                  key={frame}
                  type="button"
                  disabled={isFrameDisabled && !isChecked}
                  onClick={() => toggleFrame(frame)}
                  className={`text-xs px-3 py-2 rounded-xl font-bold border transition-colors flex items-center gap-2 ${
                    isChecked
                      ? "bg-primary-600 border-primary-600 text-white"
                      : isFrameDisabled
                        ? "bg-gray-100 text-gray-400 border-gray-150 cursor-not-allowed opacity-50"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    isChecked ? "border-white bg-white" : "border-gray-300"
                  }`}>
                    {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                  </span>
                  {frame}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isFrameDisabled ? "Disabled" : "Custom frame option..."}
              disabled={isFrameDisabled}
              value={customFrame}
              onChange={e => setCustomFrame(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              type="button"
              disabled={isFrameDisabled}
              onClick={addCustomFrame}
              className="p-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ─── SI UNIT & 1x1 AREA PRICING CONFIGURATION CARD ───────────────── */}
      {(hasDim || hasCanvas || hasFrame) && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl space-y-5">
          <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-indigo-700/50">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                📐 SI Unit & 1×1 Area Pricing Rules
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Set your 1×1 unit base cost, material cost, and frame cost. Prices for all size combinations will be calculated automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={computeVariantPrices}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <FiRefreshCw className="w-4 h-4" />
              ⚡ Calculate All Matrix Prices
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SI Unit Dropdown */}
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs space-y-2">
              <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Select SI Size Unit *
              </label>
              <select
                value={pricingUnit}
                onChange={e => onChange({ pricingUnit: e.target.value })}
                className="w-full px-3 py-2 bg-indigo-950 text-white font-bold text-sm border border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="inches">Inches (in)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="feet">Feet (ft)</option>
                <option value="meter">Meters (m)</option>
              </select>
              <p className="text-[10px] text-indigo-300">Dimensions are computed in sq {unitLabel}.</p>
            </div>

            {/* Base Price per 1x1 */}
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs space-y-2">
              <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Base Price per 1{unitLabel} × 1{unitLabel} (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitBasePrice}
                  onChange={e => onChange({ unitBasePrice: e.target.value })}
                  placeholder="e.g. 2.50"
                  className="w-full pl-7 pr-3 py-2 bg-indigo-950 text-white font-bold text-sm border border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <p className="text-[10px] text-indigo-300">Base artwork rate per sq {unitLabel}.</p>
            </div>

            {/* Formula Preview */}
            <div className="bg-amber-400/10 p-4 rounded-xl border border-amber-400/30 backdrop-blur-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider block mb-1">📐 Dynamic Price Formula</span>
                <p className="text-xs text-amber-100 font-mono">
                  Price = W × H × (Base + Material + Frame)
                </p>
              </div>
              <p className="text-[10px] text-amber-200/80 mt-2">
                e.g. 8×10 ({80} sq {unitLabel}) @ ₹{unitBasePrice || "2.50"} = ₹{Math.round(80 * (parseFloat(unitBasePrice) || 2.5))} base.
              </p>
            </div>
          </div>

          {/* Canvas & Frame 1x1 Cost Modifiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-indigo-700/50">
            {/* Canvas Modifiers */}
            {hasCanvas && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  Material Cost per 1{unitLabel} × 1{unitLabel} (₹)
                </label>
                <div className="space-y-2">
                  {selectedCanvasTypes.map(can => (
                    <div key={can} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-xs font-bold text-white flex-1 truncate">{can}</span>
                      <span className="text-xs text-indigo-300">+ ₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={canvasModifiers[can] || ""}
                        onChange={e => onChange({
                          canvasModifiers: { ...canvasModifiers, [can]: e.target.value }
                        })}
                        placeholder="0.00"
                        className="w-24 px-2 py-1 bg-indigo-950 text-white font-bold text-xs border border-indigo-600 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Frame Modifiers */}
            {hasFrame && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  Frame Cost per 1{unitLabel} × 1{unitLabel} (₹)
                </label>
                <div className="space-y-2">
                  {selectedFrames.map(frame => (
                    <div key={frame} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-xs font-bold text-white flex-1 truncate">{frame}</span>
                      <span className="text-xs text-indigo-300">+ ₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={frameModifiers[frame] || ""}
                        onChange={e => onChange({
                          frameModifiers: { ...frameModifiers, [frame]: e.target.value }
                        })}
                        placeholder="0.00"
                        className="w-24 px-2 py-1 bg-indigo-950 text-white font-bold text-xs border border-indigo-600 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Matrix Table Grid */}
      {selectedDimensions.length === 0 && selectedCanvasTypes.length === 0 && selectedFrames.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-amber-800 font-bold text-sm">
            ⚠️ Please select at least one option (Dimension, Canvas, or Frame) to generate the pricing table.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 overflow-hidden">
          <div className="flex flex-wrap justify-between items-start mb-4 gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900">Pricing & Inventory Matrix Grid</h2>
              <p className="text-xs text-gray-400 mt-0.5">Rows and columns dynamically represent your selected options.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 select-none border-b border-gray-200">
                  <th className="py-3 px-4 font-bold border-r border-gray-200 bg-gray-100 sticky left-0 z-10 w-40">
                    {hasDim ? "Dimension / Size" : hasCanvas ? "Canvas Type" : hasFrame ? "Frame Option" : "Size"}
                  </th>
                  {columns.map(col => (
                    <th key={col.key} className="py-2.5 px-3 border-r border-gray-200 font-bold text-center align-top min-w-[200px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-800 font-black">{col.label}</span>
                        <div className="flex flex-wrap gap-1 justify-center mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const val = prompt(`Set selling price for ALL rows under "${col.label}":`);
                              bulkSetColumnPrice(col, val);
                            }}
                            className="text-[9px] text-primary-600 hover:text-primary-700 font-extrabold bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100 transition-colors"
                          >
                            ⚡ Price
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const val = prompt(`Set stock quantity for ALL rows under "${col.label}":`);
                              bulkSetColumnStock(col, val);
                            }}
                            className="text-[9px] text-emerald-600 hover:text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 transition-colors"
                          >
                            ⚡ Stock
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(dim => (
                  <tr key={dim} className="hover:bg-gray-50/50 border-b border-gray-100 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 border-r border-gray-200 bg-gray-50/50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      {dim} {hasDim ? unitLabel : ""}
                    </td>
                    {columns.map(col => {
                      const key = getCellBackendKey(dim, col);
                      const price = variants.prices?.[key] ?? "";
                      const stock = variants.stockMap?.[key] ?? "";
                      const isActive = !(variants.inactive?.[key]);

                      return (
                        <td key={col.key} className="py-2 px-3 border-r border-gray-200 align-middle">
                          <div className={`flex flex-col gap-1.5 p-2 rounded-xl border shadow-inner transition-all ${
                            isActive 
                              ? "bg-gray-50 border-gray-150" 
                              : "bg-red-50/10 border-red-100 opacity-60 grayscale-[40%]"
                          }`}>
                            
                            {/* Active Toggle Checkbox */}
                            <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-0.5">
                              <span className="text-[10px] font-black text-gray-400">Offer option?</span>
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={e => handleCellChange(dim, col, 'active', e.target.checked)}
                                className="w-3.5 h-3.5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
                              />
                            </div>

                            {/* Computed Selling Price */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-gray-500 w-10 text-right">Price:</span>
                              <div className="relative flex-1">
                                <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={price}
                                  disabled={!isActive}
                                  onChange={e => handleCellChange(dim, col, 'price', e.target.value)}
                                  className={`w-full pl-4 pr-1.5 py-1 text-[11px] font-semibold border rounded-md focus:ring-1 focus:ring-primary-400 outline-none ${
                                    !isActive 
                                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                                      : !price 
                                        ? "border-red-200 bg-red-50/40" 
                                        : "border-gray-300 bg-white"
                                  }`}
                                  placeholder={isActive ? "Auto" : "Disabled"}
                                />
                              </div>
                            </div>

                            {/* Stock */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-gray-500 w-10 text-right">Stock:</span>
                              <input
                                type="number"
                                min="0"
                                value={stock}
                                disabled={!isActive}
                                onChange={e => handleCellChange(dim, col, 'stock', e.target.value)}
                                className={`flex-1 px-1.5 py-1 text-[11px] border rounded-md focus:ring-1 focus:ring-primary-400 outline-none font-medium ${
                                  !isActive 
                                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                                    : "border-gray-300 bg-white"
                                }`}
                                placeholder={isActive ? "0" : "Disabled"}
                              />
                            </div>

                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

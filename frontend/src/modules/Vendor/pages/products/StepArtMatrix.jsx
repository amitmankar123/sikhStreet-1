import React, { useState, useMemo } from "react";
import { FiCheck, FiPlus, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

const DEFAULT_DIMENSIONS = ["8x10", "12x16", "16x20", "20x30", "24x36", "30x40"];
const DEFAULT_CANVAS_TYPES = ["Rolled Canvas", "Stretched Canvas", "Canvas Print", "Fine Art Paper"];
const DEFAULT_FRAME_TYPES = ["Frameless", "Wooden Frame", "Black Frame", "White Frame", "Oak Frame", "Gold Metal Frame"];

export default function StepArtMatrix({ formData, onChange }) {
  const [customDimension, setCustomDimension] = useState("");
  const [customCanvas, setCustomCanvas] = useState("");
  const [customFrame, setCustomFrame] = useState("");

  const variants = formData.variants || {};
  
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

  // Grid Combinations Resolvers
  const rows = selectedDimensions.length > 0 ? selectedDimensions : ["Default Size"];
  
  const columns = useMemo(() => {
    const canvases = selectedCanvasTypes.length > 0 ? selectedCanvasTypes : ["Default Canvas"];
    const frames = selectedFrames.length > 0 ? selectedFrames : ["Default Frame"];
    
    const cols = [];
    canvases.forEach(c => {
      frames.forEach(f => {
        cols.push({ canvas: c, frame: f, key: `${c}|${f}` });
      });
    });
    return cols;
  }, [selectedCanvasTypes, selectedFrames]);

  // Key generator matching backend key signature format
  const getBackendKey = (dim, canvas, frame) => {
    const parts = [];
    if (dim !== "Default Size") {
      parts.push(`dimension=${dim.toLowerCase().replace(/\s+/g, '_')}`);
    }
    if (canvas !== "Default Canvas") {
      parts.push(`canvas=${canvas.toLowerCase().replace(/\s+/g, '_')}`);
    }
    if (frame !== "Default Frame") {
      parts.push(`frame=${frame.toLowerCase().replace(/\s+/g, '_')}`);
    }
    return parts.sort((a, b) => a.localeCompare(b)).join("|");
  };

  const handleCellChange = (dim, col, field, value) => {
    const backendKey = getBackendKey(dim, col.canvas, col.frame);
    const prices = { ...(variants.prices || {}) };
    const stockMap = { ...(variants.stockMap || {}) };
    const skuMap = { ...(variants.skuMap || {}) };

    if (field === "price") {
      prices[backendKey] = value === "" ? "" : Number(value);
    } else if (field === "stock") {
      stockMap[backendKey] = value === "" ? "" : Number(value);
    } else if (field === "sku") {
      skuMap[backendKey] = value;
    }

    onChange({
      variants: {
        ...variants,
        prices,
        stockMap,
        skuMap
      }
    });
  };

  const bulkSetColumnPrice = (col, price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice) || price === null || price === "") return;
    
    const prices = { ...(variants.prices || {}) };
    rows.forEach(dim => {
      const backendKey = getBackendKey(dim, col.canvas, col.frame);
      prices[backendKey] = numPrice;
    });

    onChange({
      variants: {
        ...variants,
        prices
      }
    });
  };

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
            {DEFAULT_DIMENSIONS.map(dim => (
              <button
                key={dim}
                type="button"
                onClick={() => toggleDimension(dim)}
                className={`text-xs px-3 py-2 rounded-xl font-bold border transition-colors ${
                  selectedDimensions.includes(dim)
                    ? "bg-primary-600 border-primary-600 text-white"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {dim}
              </button>
            ))}
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
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CANVAS_TYPES.map(can => (
              <button
                key={can}
                type="button"
                onClick={() => toggleCanvas(can)}
                className={`text-xs px-3 py-2 rounded-xl font-bold border transition-colors ${
                  selectedCanvasTypes.includes(can)
                    ? "bg-primary-600 border-primary-600 text-white"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {can}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Custom canvas type..."
              value={customCanvas}
              onChange={e => setCustomCanvas(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
            />
            <button
              type="button"
              onClick={addCustomCanvas}
              className="p-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-600 transition-colors"
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
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_FRAME_TYPES.map(frame => (
              <button
                key={frame}
                type="button"
                onClick={() => toggleFrame(frame)}
                className={`text-xs px-3 py-2 rounded-xl font-bold border transition-colors ${
                  selectedFrames.includes(frame)
                    ? "bg-primary-600 border-primary-600 text-white"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {frame}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Custom frame option..."
              value={customFrame}
              onChange={e => setCustomFrame(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
            />
            <button
              type="button"
              onClick={addCustomFrame}
              className="p-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-600 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Pricing Matrix Table Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 overflow-hidden">
        <div className="flex flex-wrap justify-between items-start mb-4 gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">Pricing & Inventory Matrix Grid</h2>
            <p className="text-xs text-gray-400 mt-0.5">Rows represent Dimensions, Columns represent Canvas/Frame coordinates.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 text-gray-700 select-none border-b border-gray-200">
                <th className="py-3 px-4 font-bold border-r border-gray-200 bg-gray-100 sticky left-0 z-10 w-40">
                  Dimension / Size
                </th>
                {columns.map(col => (
                  <th key={col.key} className="py-2.5 px-3 border-r border-gray-200 font-bold text-center align-top min-w-[200px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-800 font-black">{col.canvas}</span>
                      <span className="text-gray-500 text-[10px]">{col.frame}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const val = prompt(`Set selling price for ALL rows under "${col.canvas} - ${col.frame}":`);
                          bulkSetColumnPrice(col, val);
                        }}
                        className="text-[10px] text-primary-600 hover:text-primary-700 font-extrabold hover:underline mt-1 bg-primary-50 px-1 py-0.5 rounded border border-primary-100"
                      >
                        ⚡ Bulk Price
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(dim => (
                <tr key={dim} className="hover:bg-gray-50/50 border-b border-gray-100 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-900 border-r border-gray-200 bg-gray-50/50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    {dim}
                  </td>
                  {columns.map(col => {
                    const key = getBackendKey(dim, col.canvas, col.frame);
                    const price = variants.prices?.[key] ?? "";
                    const stock = variants.stockMap?.[key] ?? "";
                    const sku = variants.skuMap?.[key] ?? "";

                    return (
                      <td key={col.key} className="py-2 px-3 border-r border-gray-200 align-middle">
                        <div className="flex flex-col gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-150 shadow-inner">
                          
                          {/* Price */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-gray-500 w-9 text-right">Price:</span>
                            <div className="relative flex-1">
                              <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={price}
                                onChange={e => handleCellChange(dim, col, 'price', e.target.value)}
                                className={`w-full pl-4 pr-1.5 py-1 text-[11px] font-semibold border rounded-md focus:ring-1 focus:ring-primary-400 outline-none ${
                                  !price ? "border-red-200 bg-red-50/40" : "border-gray-300 bg-white"
                                }`}
                                placeholder="Req *"
                              />
                            </div>
                          </div>

                          {/* Stock */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-gray-500 w-9 text-right">Stock:</span>
                            <input
                              type="number"
                              min="0"
                              value={stock}
                              onChange={e => handleCellChange(dim, col, 'stock', e.target.value)}
                              className="flex-1 px-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-400 outline-none bg-white font-medium"
                              placeholder="0"
                            />
                          </div>

                          {/* SKU */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-gray-500 w-9 text-right">SKU:</span>
                            <input
                              type="text"
                              value={sku}
                              onChange={e => handleCellChange(dim, col, 'sku', e.target.value)}
                              className="flex-1 px-1.5 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-400 outline-none bg-white font-mono"
                              placeholder="Optional"
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
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiSave, FiUpload, FiX, FiCheckCircle } from "react-icons/fi";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { useBrandStore } from "../../../../shared/store/brandStore";
import { useVendorProductStore } from "../../store/vendorProductStore";
import { uploadVendorImage, uploadVendorImages, uploadVendorVideo, uploadVendorDigitalFile } from "../../services/vendorService";
import toast from "react-hot-toast";
import api from "../../../../shared/utils/api";

// Import step components
import StepProductType from "./StepProductType";
import StepCategorySelect from "./StepCategorySelect";
import StepArtMatrix from "./StepArtMatrix";
import StepDigitalUpload from "./StepDigitalUpload";

const FABRIC_TYPES = ["Voil", "Ruby", "Mix (Rub & Voil)"];

const TurbanFabricSection = ({ fabrics = [], onChange }) => {
  const [otherName, setOtherName] = useState("");
  const [otherPrice, setOtherPrice] = useState("");

  const toggleFabric = (type) => {
    const existing = fabrics.find((f) => f.type === type);
    if (existing) {
      onChange(fabrics.filter((f) => f.type !== type));
    } else {
      onChange([...fabrics, { type, price: "" }]);
    }
  };

  const updateFabricPrice = (type, price) => {
    onChange(fabrics.map((f) => f.type === type ? { ...f, price: price === "" ? "" : Number(price) } : f));
  };

  const addOtherFabric = () => {
    const trimmed = otherName.trim();
    if (!trimmed) { toast.error("Enter a fabric name"); return; }
    if (!otherPrice) { toast.error("Enter price for this fabric"); return; }
    if (fabrics.find((f) => f.type.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This fabric already exists"); return;
    }
    onChange([...fabrics, { type: trimmed, price: Number(otherPrice), isCustom: true }]);
    setOtherName(""); setOtherPrice("");
  };

  const removeFabric = (type) => {
    onChange(fabrics.filter((f) => f.type !== type));
  };

  return (
    <div className="border border-amber-250 rounded-xl p-4 bg-amber-50/60 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
        <h3 className="text-sm font-bold text-amber-805">Fabric Options Setup</h3>
        <span className="text-xs text-amber-600">(Select available fabrics and set price/meter)</span>
      </div>

      <div className="space-y-2">
        {FABRIC_TYPES.map((type) => {
          const selected = fabrics.find((f) => f.type === type);
          return (
            <div key={type} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-amber-100">
              <input
                type="checkbox"
                id={`fabric-${type}`}
                checked={!!selected}
                onChange={() => toggleFabric(type)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <label htmlFor={`fabric-${type}`} className="text-xs font-semibold text-gray-700 flex-1 cursor-pointer">{type}</label>
              {selected && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selected.price}
                    onChange={(e) => updateFabricPrice(type, e.target.value)}
                    placeholder="Price/meter *"
                    className="w-28 px-2 py-1 border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Custom fabric rows */}
        {fabrics.filter((f) => f.isCustom).map((f) => (
          <div key={f.type} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-amber-200">
            <span className="text-xs font-semibold text-gray-700 flex-1">{f.type} <span className="text-amber-600 text-[10px]">(Custom)</span></span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={f.price}
                onChange={(e) => updateFabricPrice(f.type, e.target.value)}
                placeholder="Price/meter *"
                className="w-28 px-2 py-1 border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white"
              />
            </div>
            <button type="button" onClick={() => removeFabric(f.type)} className="p-1 text-red-450 hover:text-red-650 hover:bg-red-50 rounded transition-colors text-xs font-bold">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add Other Fabric */}
      <div className="border-t border-amber-200 pt-3">
        <p className="text-xs font-semibold text-amber-700 mb-2">+ Add Other Fabric Type</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
            placeholder="Fabric name (e.g. Silk)"
            className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs bg-white"
          />
          <input
            type="number"
            value={otherPrice}
            onChange={(e) => setOtherPrice(e.target.value)}
            placeholder="₹ Price/meter *"
            className="w-32 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs bg-white"
          />
          <button type="button" onClick={addOtherFabric} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-750 transition-colors shadow-sm whitespace-nowrap">
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const TurbanAdvancedConfig = ({ config = {}, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const update = (key, val) => onChange({ ...config, [key]: { ...config[key], ...val } });

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors border-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-sm font-bold text-indigo-805">Services Add-Ons</span>
          {(config.embroidery?.enabled || config.giftWrap?.enabled) && (
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              {[config.embroidery?.enabled && 'Embroidery', config.giftWrap?.enabled && 'Gift Wrap'].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        <span className="text-xs text-indigo-600 font-bold">{isOpen ? "Hide Options" : "Show Options"}</span>
      </button>

      {isOpen && (
        <div className="bg-white p-4 space-y-4 border-t border-indigo-100">
          {/* Embroidery */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.embroidery?.enabled || false}
                onChange={(e) => update('embroidery', { enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-800">Embroidery Service</span>
                <p className="text-[11px] text-gray-500">Enable custom embroidery on this turban</p>
              </div>
            </label>
            {config.embroidery?.enabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">Embroidery Service Surcharge (₹) *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.embroidery?.price || ""}
                  onChange={(e) => update('embroidery', { price: e.target.value === "" ? "" : Number(e.target.value) })}
                  placeholder="e.g. 250"
                  className="w-36 px-2.5 py-1.5 border border-red-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white"
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Gift Wrapper */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.giftWrap?.enabled || false}
                onChange={(e) => update('giftWrap', { enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-800">Premium Gift Wrapping</span>
                <p className="text-[11px] text-gray-500">Offer gift packaging option for checkout</p>
              </div>
            </label>
            {config.giftWrap?.enabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">Gift Wrapping Surcharge (₹) *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.giftWrap?.price || ""}
                  onChange={(e) => update('giftWrap', { price: e.target.value === "" ? "" : Number(e.target.value) })}
                  placeholder="e.g. 50"
                  className="w-36 px-2.5 py-1.5 border border-red-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TurbanColorPanel = ({ colors = [], colorHexMap = {}, imageMap = {}, onChange }) => {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [photo, setPhoto] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const response = await uploadVendorImage(file);
      const data = response.data || response;
      if (data?.url) {
        setPhoto(data.url);
        toast.success("Color photo uploaded");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddColor = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Color name is required");
      return;
    }
    if (!photo) {
      toast.error("Color photo is required");
      return;
    }

    const nextColors = [...colors, trimmedName];
    const nextHex = { ...colorHexMap, [trimmedName]: hex };
    const nextImages = { ...imageMap, [trimmedName]: photo };

    onChange(nextColors, nextHex, nextImages, photo);
    setName("");
    setHex("#000000");
    setPhoto("");
  };

  const handleRemoveColor = (c) => {
    const nextColors = colors.filter(x => x !== c);
    const nextHex = { ...colorHexMap };
    delete nextHex[c];
    const nextImages = { ...imageMap };
    delete nextImages[c];
    onChange(nextColors, nextHex, nextImages);
  };

  return (
    <div className="border border-indigo-150 rounded-xl p-4 bg-indigo-50/10 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Turban Colors & Showcase Photos</h3>
        <p className="text-xs text-gray-400">Configure catalog colors. Every color option requires a custom photo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border items-center">
        <input
          type="text"
          placeholder="Color Name (e.g. Royal Blue)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 outline-none"
        />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0 bg-white"
          />
          <span className="text-xs font-mono font-bold text-gray-650">{hex}</span>
        </div>
        <div className="flex items-center gap-2">
          {photo ? (
            <div className="relative w-8 h-8 rounded overflow-hidden border">
              <img src={photo} alt="color-preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <label className="flex-1 flex items-center justify-center border border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 text-[10px] font-bold py-2 px-1 bg-white text-indigo-750">
              {isUploading ? "Uploading..." : "Upload Photo"}
              <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*, image/avif, .avif" />
            </label>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddColor}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          Add Color
        </button>
      </div>

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-2">
          {colors.map((c) => (
            <div key={c} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-150 rounded-xl text-xs font-semibold shadow-sm">
              <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: colorHexMap[c] }} />
              <span className="text-gray-700 font-bold">{c}</span>
              {imageMap[c] && (
                <img src={imageMap[c]} alt="color" className="w-6 h-6 rounded object-cover border" />
              )}
              <button
                type="button"
                onClick={() => handleRemoveColor(c)}
                className="text-red-500 hover:text-red-750 font-bold ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BookFormatMatrixSection = ({ field, specifications = {}, onChange }) => {
  const [isUploading, setIsUploading] = useState({});

  const selectedFormats = Array.isArray(specifications.book_format)
    ? specifications.book_format
    : (typeof specifications.book_format === "string" && specifications.book_format.trim()
      ? specifications.book_format.split(",").map(s => s.trim())
      : []);

  const bookConfig = specifications.bookConfig || { formatOptions: [] };
  const formatOptions = bookConfig.formatOptions || [];

  const toggleFormat = (formatLabel) => {
    const isChecked = selectedFormats.includes(formatLabel);
    let nextFormats;
    let nextOptions;

    if (isChecked) {
      nextFormats = selectedFormats.filter((f) => f !== formatLabel);
      nextOptions = formatOptions.filter((opt) => opt.label !== formatLabel);
    } else {
      nextFormats = [...selectedFormats, formatLabel];
      const id = formatLabel.toLowerCase().replace(/\s+/g, "_");
      nextOptions = [
        ...formatOptions,
        { id, label: formatLabel, price: "", originalPrice: "", stock: "" }
      ];
    }

    onChange({
      ...specifications,
      book_format: nextFormats,
      bookConfig: {
        ...bookConfig,
        formatOptions: nextOptions
      }
    });
  };

  const updateFormatOption = (formatLabel, updates) => {
    const nextOptions = formatOptions.map((opt) => {
      if (opt.label === formatLabel) {
        const updated = { ...opt, ...updates };
        if (updates.price !== undefined) updated.price = updates.price === "" ? "" : Number(updates.price);
        if (updates.originalPrice !== undefined) updated.originalPrice = updates.originalPrice === "" ? "" : Number(updates.originalPrice);
        if (updates.stock !== undefined) updated.stock = updates.stock === "" ? "" : Number(updates.stock);
        return updated;
      }
      return opt;
    });

    onChange({
      ...specifications,
      bookConfig: {
        ...bookConfig,
        formatOptions: nextOptions
      }
    });
  };

  const handleFileUpload = async (formatLabel, file) => {
    if (!file) return;
    setIsUploading((prev) => ({ ...prev, [formatLabel]: true }));
    try {
      const response = await uploadVendorDigitalFile(file);
      const data = response.data || response;
      if (data?.url) {
        updateFormatOption(formatLabel, { fileUrl: data.url });
        toast.success(`${formatLabel} file uploaded successfully`);
      } else {
        toast.error("Upload failed: No URL returned");
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setIsUploading((prev) => ({ ...prev, [formatLabel]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 bg-slate-50 p-3 rounded-lg border border-gray-200">
        {field.options?.map((opt) => {
          const isChecked = selectedFormats.includes(opt);
          return (
            <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleFormat(opt)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-gray-700">{opt}</span>
            </label>
          );
        })}
      </div>

      {selectedFormats.length > 0 && (
        <div className="border border-gray-250 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-250 text-[10px] font-bold text-gray-500 uppercase">
                  <th className="p-3">Format</th>
                  <th className="p-3">Selling Price (₹) *</th>
                  <th className="p-3">Original M.R.P. (₹)</th>
                  <th className="p-3">Stock Quantity</th>
                  <th className="p-3">Configuration / File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-gray-700">
                {selectedFormats.map((fmt) => {
                  const opt = formatOptions.find((o) => o.label === fmt) || {
                    label: fmt,
                    price: "",
                    originalPrice: "",
                    stock: ""
                  };

                  const isEbook = fmt.toLowerCase().includes("ebook") || fmt.toLowerCase().includes("e-book");

                  return (
                    <tr key={fmt} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-gray-900">{fmt}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={opt.price}
                          onChange={(e) => updateFormatOption(fmt, { price: e.target.value })}
                          placeholder="Price *"
                          className="w-24 px-2 py-1.5 border border-red-200 rounded focus:ring-1 focus:ring-primary-500 outline-none text-xs bg-white"
                          required
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={opt.originalPrice}
                          onChange={(e) => updateFormatOption(fmt, { originalPrice: e.target.value })}
                          placeholder="MRP"
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none text-xs bg-white"
                        />
                      </td>
                      <td className="p-3">
                        {isEbook ? (
                          <span className="text-gray-450 font-semibold italic text-[11px]">Unlimited Digital</span>
                        ) : (
                          <input
                            type="number"
                            value={opt.stock}
                            onChange={(e) => updateFormatOption(fmt, { stock: e.target.value })}
                            placeholder="Qty"
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none text-xs bg-white"
                          />
                        )}
                      </td>
                      <td className="p-3">
                        {isEbook ? (
                          <div className="flex items-center gap-2">
                            {opt.fileUrl ? (
                              <div className="flex items-center gap-1.5 bg-green-50 text-green-800 border border-green-200 px-2 py-1 rounded text-[10px] font-bold">
                                <span>File Ready</span>
                                <button
                                  type="button"
                                  onClick={() => updateFormatOption(fmt, { fileUrl: "" })}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center border border-dashed border-primary-300 rounded-lg cursor-pointer hover:bg-primary-50 text-[10px] font-bold py-1.5 px-2 bg-white text-primary-750">
                                {isUploading[fmt] ? "Uploading..." : "Upload EPUB/PDF"}
                                <input
                                  type="file"
                                  onChange={(e) => handleFileUpload(fmt, e.target.files?.[0])}
                                  className="hidden"
                                  accept=".epub, .pdf, .mobi"
                                  disabled={isUploading[fmt]}
                                />
                              </label>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Physical Shipping</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Dimension Input Component ────────────────────────────────────────────
const DimensionInput = ({ field, value, onChange, extraOptions = [] }) => {
  const [unit, setUnit] = useState("in");
  const [customDim, setCustomDim] = useState("");

  // Parse existing values: ["18x24 in", "60x90 cm"]
  const selectedValues = Array.isArray(value)
    ? value
    : (typeof value === 'string' && value.trim() ? value.split(",").map(s => s.trim()).filter(Boolean) : []);

  const allOptions = [...(field.options || []), ...extraOptions];

  const toggleSize = (size) => {
    const formatted = `${size} ${unit}`;
    const exists = selectedValues.includes(formatted);
    if (exists) {
      onChange(selectedValues.filter(v => v !== formatted));
    } else {
      onChange([...selectedValues, formatted]);
    }
  };

  const handleCustomAdd = () => {
    const trimmed = customDim.trim();
    if (!trimmed) { toast.error("Enter dimensions (e.g. 18x24)"); return; }
    // Validate A×B format
    const dimRegex = /^\d+(\.\d+)?\s*[xX×]\s*\d+(\.\d+)?$/;
    if (!dimRegex.test(trimmed)) {
      toast.error("Use format: AxB (e.g. 18x24 or 18×24)");
      return;
    }
    const formatted = `${trimmed.replace(/\s*[xX×]\s*/g, 'x')} ${unit}`;
    if (selectedValues.includes(formatted)) {
      toast.error("This size is already added");
      return;
    }
    onChange([...selectedValues, formatted]);
    setCustomDim("");
    toast.success(`Added ${formatted}`);
  };

  const removeSize = (size) => {
    onChange(selectedValues.filter(v => v !== size));
  };

  return (
    <div className="space-y-3">
      {/* Unit Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-gray-700">Unit:</label>
        <select
          value={unit}
          onChange={e => setUnit(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-primary-500 outline-none"
        >
          <option value="in">Inches (in)</option>
          <option value="cm">Centimeters (cm)</option>
          <option value="ft">Feet (ft)</option>
        </select>
      </div>

      {/* Common Sizes Chips */}
      {allOptions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Common Sizes</p>
          <div className="flex flex-wrap gap-2">
            {allOptions.map(size => {
              const formatted = `${size} ${unit}`;
              const isSelected = selectedValues.includes(formatted);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isSelected
                      ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                >
                  {size} {unit}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Dimension Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customDim}
          onChange={e => setCustomDim(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCustomAdd())}
          placeholder="e.g. 18x24"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none bg-white"
        />
        <button
          type="button"
          onClick={handleCustomAdd}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Selected Sizes Display */}
      {selectedValues.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Selected Sizes ({selectedValues.length})</p>
          <div className="flex flex-wrap gap-2">
            {selectedValues.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 border border-primary-200 rounded-lg text-xs font-medium text-primary-700">
                {s}
                <button
                  type="button"
                  onClick={() => removeSize(s)}
                  className="text-red-400 hover:text-red-600 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DynamicProductWizard({ isEdit = false, productId = null }) {
  const navigate = useNavigate();
  const { categories, initialize: initCategories } = useCategoryStore();
  const { brands, initialize: initBrands } = useBrandStore();
  const { addProduct, editProduct, fetchProductById } = useVendorProductStore();

  const [activeStepIndex, setActiveStepIndex] = useState(isEdit ? 2 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);

  // Unified Form State
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    price: "",
    originalPrice: "",
    image: "",
    images: [],
    video: "",
    categoryId: null,
    subcategoryId: null,
    topicId: null,
    topic: "",
    brandId: null,
    stock: "in_stock",
    stockQuantity: "",
    totalAllowedQuantity: "",
    minimumOrderQuantity: "",
    warrantyPeriod: "",
    guaranteePeriod: "",
    hsnCode: "",
    flashSale: false,
    isNewArrival: false,
    isFeatured: false,
    isVisible: true,
    codAllowed: true,
    returnable: true,
    cancelable: true,
    taxIncluded: false,
    description: "",
    tags: [],
    deliveryRegion: "domestic", // Default shipping region scope
    shippingCarriers: ["fedex", "delhivery", "bluedart", "dhl"], // Enabled shipping carriers
    variants: {
      sizes: [],
      colors: [],
      materials: [],
      attributes: [],
      prices: {},
      stockMap: {},
      imageMap: {},
      skuMap: {},
      defaultVariant: {},
      defaultSelection: {},
    },
    seoTitle: "",
    seoDescription: "",
    relatedProducts: [],
    faqs: [],
    turbanConfig: {
      fabric: [],
      embroidery: { enabled: false, price: "" },
      giftWrap: { enabled: false, price: "" },
    },
    productType: "physical",
    digitalConfig: {
      digitalFile: "",
      previewFile: "",
      license: "personal",
      fileSize: "",
      fileType: "",
      downloadLimit: "",
      version: "1.0.0"
    },
    specifications: {}
  });

  // Load Categories and Brands
  useEffect(() => {
    initCategories();
    initBrands();
  }, []);

  const [resolvedSchema, setResolvedSchema] = useState(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [customOptionInputs, setCustomOptionInputs] = useState({});
  const [extraFieldOptions, setExtraFieldOptions] = useState({});

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".multi-select-dropdown-container")) {
        setOpenDropdowns({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLeafCategoryId = useMemo(() => {
    return formData.topicId || formData.subcategoryId || formData.categoryId || null;
  }, [formData.topicId, formData.subcategoryId, formData.categoryId]);

  useEffect(() => {
    if (!selectedLeafCategoryId) {
      setResolvedSchema(null);
      return;
    }
    const fetchSchema = async () => {
      setIsLoadingSchema(true);
      try {
        const response = await api.get(`/admin/marketplace-config/resolve/${selectedLeafCategoryId}`);
        console.log('[Wizard] Resolved schema:', response.data);
        if (response.data?.steps) {
          console.log('[Wizard] Steps:', JSON.stringify(response.data.steps, null, 2));
        }
        setResolvedSchema(response.data || null);
      } catch (err) {
        setResolvedSchema(null);
      } finally {
        setIsLoadingSchema(false);
      }
    };
    fetchSchema();
  }, [selectedLeafCategoryId]);

  // If in edit mode, fetch product details
  useEffect(() => {
    if (isEdit && productId) {
      setLoadingProduct(true);
      fetchProductById(productId)
        .then((res) => {
          const product = res?.data || res;
          if (product) {
            setFormData({
              name: product.name || "",
              unit: product.unit || "",
              price: product.price || "",
              originalPrice: product.originalPrice || "",
              image: product.image || "",
              images: product.images || [],
              video: product.video || "",
              categoryId: product.categoryId?.id || product.categoryId?._id || product.categoryId || null,
              subcategoryId: product.subcategoryId?.id || product.subcategoryId?._id || product.subcategoryId || null,
              topicId: product.topicId || null,
              topic: product.topic || "",
              brandId: product.brandId?.id || product.brandId?._id || product.brandId || null,
              stock: product.stock || "in_stock",
              stockQuantity: product.stockQuantity || "",
              totalAllowedQuantity: product.totalAllowedQuantity || "",
              minimumOrderQuantity: product.minimumOrderQuantity || "",
              warrantyPeriod: product.warrantyPeriod || "",
              guaranteePeriod: product.guaranteePeriod || "",
              hsnCode: product.hsnCode || "",
              flashSale: !!product.flashSale,
              isNewArrival: !!product.isNewArrival,
              isFeatured: !!product.isFeatured,
              isVisible: product.isVisible !== false,
              codAllowed: product.codAllowed !== false,
              returnable: product.returnable !== false,
              cancelable: product.cancelable !== false,
              taxIncluded: !!product.taxIncluded,
              description: product.description || "",
              tags: product.tags || [],
              variants: product.variants || {
                sizes: [],
                colors: [],
                materials: [],
                attributes: [],
                prices: {},
                stockMap: {},
                imageMap: {},
                skuMap: {},
                defaultVariant: {},
                defaultSelection: {},
              },
              seoTitle: product.seoTitle || "",
              seoDescription: product.seoDescription || "",
              relatedProducts: product.relatedProducts || [],
              faqs: product.faqs || [],
              turbanConfig: product.turbanConfig || {
                fabric: [],
                embroidery: { enabled: false, price: "" },
                giftWrap: { enabled: false, price: "" },
              },
              productType: product.productType || "physical",
              digitalConfig: product.digitalConfig || {
                digitalFile: "",
                previewFile: "",
                license: "personal",
                fileSize: "",
                fileType: "",
                downloadLimit: "",
                version: "1.0.0"
              },
              specifications: product.specifications || {}
            });
          }
        })
        .catch((err) => {
          toast.error("Failed to load product details");
          console.error(err);
        })
        .finally(() => {
          setLoadingProduct(false);
        });
    }
  }, [isEdit, productId]);

  // Resolve parent, subcategory and topic from DB categoryId once categories load
  useEffect(() => {
    if (categories && categories.length > 0 && formData.categoryId && !formData.subcategoryId && !formData.topicId) {
      const matchedCat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));
      if (matchedCat && matchedCat.parentId) {
        const pId = typeof matchedCat.parentId === 'object'
          ? (matchedCat.parentId.id || matchedCat.parentId._id)
          : matchedCat.parentId;
        const parentCat = categories.find(c => String(c.id || c._id) === String(pId));
        const gpId = parentCat && parentCat.parentId
          ? (typeof parentCat.parentId === 'object' ? (parentCat.parentId.id || parentCat.parentId._id) : parentCat.parentId)
          : null;
        if (gpId) {
          // 3-level
          setFormData(prev => ({
            ...prev,
            categoryId: gpId,
            subcategoryId: pId,
            topicId: prev.categoryId,
            topic: matchedCat.name
          }));
        } else {
          // 2-level
          setFormData(prev => ({
            ...prev,
            categoryId: pId,
            subcategoryId: prev.categoryId
          }));
        }
      }
    }
  }, [categories, formData.categoryId, formData.subcategoryId, formData.topicId]);

  // Industry detection helpers
  const isTurban = useMemo(() => {
    if (!categories || categories.length === 0) return false;
    const cat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));
    const sub = categories.find(c => String(c.id || c._id) === String(formData.subcategoryId));
    return (
      (cat && cat.name.toLowerCase().includes("turban")) ||
      (sub && sub.name.toLowerCase().includes("turban"))
    );
  }, [categories, formData.categoryId, formData.subcategoryId]);

  const isKada = useMemo(() => {
    if (!categories || categories.length === 0) return false;
    const cat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));
    const sub = categories.find(c => String(c.id || c._id) === String(formData.subcategoryId));
    return (
      (cat && (cat.name.toLowerCase().includes("kada") || cat.name.toLowerCase().includes("bangle"))) ||
      (sub && (sub.name.toLowerCase().includes("kada") || sub.name.toLowerCase().includes("bangle"))) ||
      formData.name.toLowerCase().includes("kada")
    );
  }, [categories, formData.categoryId, formData.subcategoryId, formData.name]);

  // Detect Books & Literature category (same pattern as isTurban / isKada)
  const isBookCategory = useMemo(() => {
    if (!categories || categories.length === 0) return false;
    const cat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));
    const sub = categories.find(c => String(c.id || c._id) === String(formData.subcategoryId));
    const topic = categories.find(c => String(c.id || c._id) === String(formData.topicId));
    const names = [cat, sub, topic]
      .filter(Boolean)
      .map(c => (c.name || "").toLowerCase());
    return names.some(n => n.includes("book") || n.includes("literature") || n.includes("scripture") || n.includes("nitnem"));
  }, [categories, formData.categoryId, formData.subcategoryId, formData.topicId]);

  // True when at least one book format has a valid price entered
  const bookFormatsHavePrices = useMemo(() => {
    if (!isBookCategory) return false;
    const formatOptions = formData.specifications?.bookConfig?.formatOptions || [];
    return formatOptions.length > 0 && formatOptions.every(opt => opt.price && Number(opt.price) > 0);
  }, [isBookCategory, formData.specifications]);

  useEffect(() => {
    if (isTurban) {
      setFormData((prev) => ({ ...prev, unit: "Meter" }));
    } else if (isKada) {
      setFormData((prev) => ({ ...prev, unit: "Diameter" }));
    }
  }, [isTurban, isKada]);

  // When book formats have prices and stocks, auto-populate formData.price, originalPrice, stock, and stockQuantity
  // so sorting, listing, and inventory tracking still work platform-wide
  useEffect(() => {
    if (!isBookCategory) return;
    const formatOptions = formData.specifications?.bookConfig?.formatOptions || [];

    // Auto-calculate prices
    const prices = formatOptions.map(o => Number(o.price)).filter(p => p > 0);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : "";

    const mrps = formatOptions.map(o => Number(o.originalPrice || o.price)).filter(p => p > 0);
    const lowestMrp = mrps.length > 0 ? Math.min(...mrps) : "";

    // Auto-calculate stock sums
    const totalStock = formatOptions.reduce((sum, opt) => sum + (Number(opt.stock) || 0), 0);
    const stockStatus = totalStock > 0 ? "in_stock" : "out_of_stock";

    setFormData(prev => {
      // Prevent redundant state updates & infinite loops
      if (
        prev.price === String(lowestPrice) &&
        prev.originalPrice === String(lowestMrp) &&
        prev.stockQuantity === String(totalStock) &&
        prev.stock === stockStatus
      ) {
        return prev;
      }
      return {
        ...prev,
        price: String(lowestPrice),
        originalPrice: String(lowestMrp),
        stockQuantity: String(totalStock),
        stock: stockStatus,
      };
    });
  }, [isBookCategory, formData.specifications]);

  // Detect if current category or template is for Art
  const isArtCategory = useMemo(() => {
    const targetCat = categories?.find(c => String(c.id || c._id) === String(formData.subcategoryId || formData.categoryId));
    const parentCat = categories?.find(c => String(c.id || c._id) === String(formData.categoryId));
    const catName = String(targetCat?.name || parentCat?.name || "").toLowerCase();
    const schemaName = String(resolvedSchema?.name || "").toLowerCase();
    return catName.includes("art") || schemaName.includes("art") || Boolean(resolvedSchema?.pricingConfig?.supportsUnitAreaPricing);
  }, [formData.categoryId, formData.subcategoryId, categories, resolvedSchema]);

  // Dynamic step assembly
  const steps = useMemo(() => {
    const defaultSteps = ["product_type", "category_select"];
    if (!formData.categoryId || !categories) return defaultSteps;

    if (resolvedSchema) {
      const activeWorkflowSteps = resolvedSchema.workflowSteps || ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"];
      const customTemplateSteps = Array.isArray(resolvedSchema.steps) ? resolvedSchema.steps.map(s => s.name) : [];
      const standardSteps = [];

      if (activeWorkflowSteps.includes("pricing")) standardSteps.push("pricing");
      if (activeWorkflowSteps.includes("inventory")) standardSteps.push("inventory");
      if (activeWorkflowSteps.includes("shipping")) standardSteps.push("shipping");
      if (activeWorkflowSteps.includes("seo")) standardSteps.push("seo");

      const hasBasicInfo = activeWorkflowSteps.includes("basic_info");

      const resolvedSteps = [
        ...defaultSteps,
        ...(hasBasicInfo ? ["basic_info"] : []),
        ...customTemplateSteps,
        ...standardSteps,
        "preview",
        "publish"
      ];
      // Filter out SEO step for templates
      return resolvedSteps.filter(s => s !== "seo");
    }

    const leafId = formData.topicId || formData.subcategoryId || formData.categoryId;
    const leaf = categories.find(c => String(c.id || c._id) === String(leafId));

    if (isTurban) {
      return [...defaultSteps, "basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"];
    }

    const targetCategoryId = formData.subcategoryId || formData.categoryId;
    const targetCat = categories.find(c => String(c.id || c._id) === String(targetCategoryId));
    const parentCat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));

    let resolvedSteps = [];

    // Assemble steps according to the category/subcategory config
    if (targetCat && Array.isArray(targetCat.workflowSteps) && targetCat.workflowSteps.length > 0) {
      const customSteps = [];
      let hasArtMatrix = false;
      let hasDigitalUpload = false;

      targetCat.workflowSteps.forEach(step => {
        if (["art_dimensions", "art_canvas_types", "art_frame_types", "pricing_matrix"].includes(step)) {
          if (!hasArtMatrix) {
            customSteps.push("art_matrix");
            hasArtMatrix = true;
          }
        } else if (["upload_files", "license"].includes(step)) {
          if (!hasDigitalUpload) {
            customSteps.push("digital_upload");
            hasDigitalUpload = true;
          }
        } else {
          customSteps.push(step);
        }
      });
      resolvedSteps = [...defaultSteps, ...customSteps];
    } else {
      // Default Fallback flow if no config is declared
      if (isArtCategory) {
        resolvedSteps = [...defaultSteps, "basic_info", "art_matrix", "shipping", "seo", "preview", "publish"];
      } else if (formData.productType === "digital") {
        resolvedSteps = [...defaultSteps, "basic_info", "digital_upload", "pricing", "seo", "preview", "publish"];
      } else {
        resolvedSteps = [...defaultSteps, "basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"];
      }
    }

    // Filter out SEO step for all fallbacks
    resolvedSteps = resolvedSteps.filter(s => s !== "seo");

    // Filter steps based on product type choice (Physical vs Digital)
    if (formData.productType === "physical") {
      resolvedSteps = resolvedSteps.filter(s => s !== "digital_upload" && s !== "upload_files" && s !== "license");
    } else if (formData.productType === "digital") {
      resolvedSteps = resolvedSteps.filter(s => s !== "shipping" && s !== "art_matrix");
    }

    if (isTurban) {
      resolvedSteps = resolvedSteps.filter(s => s !== "shipping");
    }

    // Option A: Remove the pricing and inventory steps for Books & Literature
    // Both pricing and stock levels are already collected per-format inside BookFormatMatrixSection.
    // The fields are auto-populated dynamically (see useEffect above).
    if (isBookCategory) {
      resolvedSteps = resolvedSteps.filter(s => s !== "pricing" && s !== "inventory");
    }

    return resolvedSteps;
  }, [formData.productType, formData.categoryId, formData.subcategoryId, formData.topicId, categories, isTurban, isBookCategory]);

  const activeStep = steps[activeStepIndex] || "product_type";

  // ── Price Matrix Computation ───────────────────────────────────────
  const matrixConfig = resolvedSchema?.matrixConfig;
  const matrixEnabled = matrixConfig?.enabled === true;

  const variantAttributeNames = useMemo(() => {
    return matrixConfig?.allowedAttributes || [];
  }, [matrixConfig?.allowedAttributes]);

  const variantValues = useMemo(() => {
    return variantAttributeNames.map(name => {
      const raw = formData.specifications?.[name];
      const values = Array.isArray(raw)
        ? raw.filter(Boolean)
        : (typeof raw === 'string' && raw.trim() ? raw.split(",").map(s => s.trim()).filter(Boolean) : []);
      return { name, values };
    }).filter(v => v.values.length > 0);
  }, [variantAttributeNames, formData.specifications]);

  const matrixCombinations = useMemo(() => {
    if (variantValues.length === 0) return [];
    return variantValues.reduce((combos, attr) => {
      const next = [];
      combos.forEach(c => attr.values.forEach(v => next.push({ ...c, [attr.name]: v })));
      return next;
    }, [{}]);
  }, [variantValues]);

  const makeComboKey = (combo) => {
    return Object.entries(combo || {})
      .map(([k, v]) => `${String(k).toLowerCase().replace(/\s+/g, '_')}=${String(v).trim().toLowerCase()}`)
      .sort()
      .join('|');
  };

  // ─── Area Pricing Formula Engine for Template Matrix ───────────────
  const computeAreaPricingForMatrix = () => {
    const baseVal = parseFloat(formData.unitBasePrice) || 0;
    if (!baseVal && baseVal !== 0) {
      toast.error("Please enter a Base Price per 1x1 unit first.");
      return;
    }

    const parseDim = (dimStr) => {
      if (!dimStr) return { w: 1, h: 1 };
      const m = String(dimStr).match(/(\d+(?:\.\d+)?)\s*[xX×*]\s*(\d+(?:\.\d+)?)/i);
      return m ? { w: parseFloat(m[1]), h: parseFloat(m[2]) } : { w: 1, h: 1 };
    };

    const canvasMods = formData.canvasModifiers || {};
    const frameMods = formData.frameModifiers || {};
    const newPrices = { ...(formData.variants?.prices || {}) };
    let count = 0;

    const computedValues = [];
    matrixCombinations.forEach(combo => {
      // Find size value from combo keys
      const sizeVal = combo.size || combo.dimension || combo.Size || combo.Dimension || Object.values(combo)[0];
      const { w, h } = parseDim(sizeVal);
      const area = (w * h) || 1;

      // Find material / canvas value from combo keys
      const matVal = combo.material || combo.canvas || combo.canvas_type || combo.Material || combo.Canvas || "";
      const matMod = parseFloat(canvasMods[matVal]) || 0;

      // Find frame value from combo keys
      const frameVal = combo.frame || combo.frame_type || combo.Frame || "";
      const frameMod = parseFloat(frameMods[frameVal]) || 0;

      const computedPrice = Math.round(area * (baseVal + matMod + frameMod));
      const key = makeComboKey(combo);
      newPrices[key] = computedPrice;
      if (computedPrice > 0) computedValues.push(computedPrice);
      count++;
    });

    const minComputedPrice = computedValues.length > 0 ? Math.min(...computedValues) : (Number(formData.price) || 0);

    setFormData(prev => ({
      ...prev,
      price: minComputedPrice > 0 ? String(minComputedPrice) : prev.price,
      specifications: {
        ...(prev.specifications || {}),
        pricingConfig: {
          pricingUnit: formData.pricingUnit || "inches",
          unitBasePrice: formData.unitBasePrice || "",
          canvasModifiers: formData.canvasModifiers || {},
          frameModifiers: formData.frameModifiers || {}
        }
      },
      variants: {
        ...(prev.variants || {}),
        attributes: variantValues.map(v => ({
          name: v.name,
          axisKey: String(v.name).toLowerCase().replace(/\s+/g, '_'),
          values: [...v.values]
        })),
        prices: newPrices
      }
    }));

    toast.success(`Calculated prices for ${count} combinations! Base price set to ₹${minComputedPrice}`);
  };

  // Sync combinations & attributes to formData.variants when variantValues or combinations change
  useEffect(() => {
    if (!matrixEnabled || matrixCombinations.length === 0) return;
    const attributes = variantValues.map(v => ({
      name: v.name,
      axisKey: String(v.name).toLowerCase().replace(/\s+/g, '_'),
      values: [...v.values]
    }));
    const existingPrices = formData.variants?.prices || {};
    const newPrices = { ...existingPrices };
    matrixCombinations.forEach(combo => {
      const key = makeComboKey(combo);
      if (newPrices[key] === undefined) {
        newPrices[key] = Number(formData.price) || 0;
      }
    });
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        attributes,
        prices: newPrices
      }
    }));
  }, [JSON.stringify(variantValues), matrixCombinations.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-calculate base price as minimum of matrix prices
  const matrixMinPrice = useMemo(() => {
    if (!matrixEnabled) return null;
    const prices = Object.values(formData.variants?.prices || {});
    const valid = prices.filter(p => typeof p === 'number' && p > 0);
    return valid.length > 0 ? Math.min(...valid) : null;
  }, [matrixEnabled, formData.variants?.prices]);

  // Auto-sync minimum matrix price to formData.price for platform display
  useEffect(() => {
    if (matrixEnabled && matrixMinPrice !== null && matrixMinPrice !== Number(formData.price)) {
      setFormData(prev => ({ ...prev, price: matrixMinPrice }));
    }
  }, [matrixMinPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Form State Mutator helper
  const updateForm = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    // Basic validations
    if (activeStep === "product_type" && !formData.productType) {
      toast.error("Please select product type");
      return;
    }
    if (activeStep === "category_select") {
      if (!formData.categoryId) {
        toast.error("Please select category");
        return;
      }
      // Check if this category has subcategories
      const getPid = (cat) => {
        if (!cat || !cat.parentId) return "";
        if (typeof cat.parentId === 'object') return String(cat.parentId.id || cat.parentId._id || "");
        return String(cat.parentId);
      };
      const hasSubs = categories.some(cat => getPid(cat) === String(formData.categoryId) && cat.isActive !== false);
      if (hasSubs && !formData.subcategoryId) {
        toast.error("Please select subcategory");
        return;
      }
    }

    if (activeStep === "basic_info") {
      if (!formData.name.trim()) { toast.error("Product name is required"); return; }
      if (!formData.image) { toast.error("Main product image is required"); return; }
    }
    if (activeStep === "digital_upload") {
      if (!formData.digitalConfig.digitalFile) { toast.error("Please upload the digital file asset"); return; }
    }
    if (activeStep === "pricing" && !isBookCategory) {
      if (matrixEnabled) {
        const hasPrice = Object.values(formData.variants?.prices || {}).some(p => typeof p === 'number' && p > 0);
        if (!hasPrice) { toast.error("Please set prices for at least one variant combination"); return; }
      } else {
        if (!formData.price || Number(formData.price) <= 0) { toast.error("Please enter a valid price"); return; }
      }
    }
    if (activeStep === "shipping") {
      if (!formData.shippingCarriers || formData.shippingCarriers.length === 0) {
        toast.error("Please select at least one delivery partner");
        return;
      }
    }

    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    const minIndex = isEdit ? 2 : 0;
    if (activeStepIndex > minIndex) {
      setActiveStepIndex(prev => prev - 1);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const response = await uploadVendorImage(file);
      const data = response.data || response;
      if (data?.url) {
        updateForm({ image: data.url });
        toast.success("Main image uploaded");
      }
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingMedia(true);
    try {
      const response = await uploadVendorImages(files);
      const data = response.data || response;
      const urls = Array.isArray(data) ? data.map(u => u.url) : [data.url];
      updateForm({ images: [...formData.images, ...urls] });
      toast.success("Gallery images added");
    } catch {
      toast.error("Gallery upload failed");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Calculate minimum non-zero variant price if base price is empty or 0
      const validVariantPrices = Object.values(formData.variants?.prices || {})
        .map(Number)
        .filter(p => Number.isFinite(p) && p > 0);
      const minVariantPrice = validVariantPrices.length > 0 ? Math.min(...validVariantPrices) : 0;
      const finalBasePrice = Number(formData.price) > 0 ? Number(formData.price) : minVariantPrice;

      const specificationsPayload = {
        ...(formData.specifications || {}),
        pricingConfig: {
          pricingUnit: formData.pricingUnit || "inches",
          unitBasePrice: formData.unitBasePrice || "",
          canvasModifiers: formData.canvasModifiers || {},
          frameModifiers: formData.frameModifiers || {}
        }
      };

      // Build sanitized payload matching Joi validation expectations on the backend
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        price: finalBasePrice,
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        unit: formData.unit || "Piece",
        categoryId: formData.topicId ?? formData.subcategoryId ?? formData.categoryId,
        subcategoryId: formData.subcategoryId || undefined,
        topicId: formData.topicId || undefined,
        topic: formData.topic || undefined,
        brandId: (typeof formData.brandId === 'object' && formData.brandId !== null
          ? (formData.brandId.id || formData.brandId._id)
          : formData.brandId) || undefined,
        stock: formData.stock,
        stockQuantity: formData.stockQuantity !== "" ? Number(formData.stockQuantity) : undefined,
        totalAllowedQuantity: formData.totalAllowedQuantity !== "" ? Number(formData.totalAllowedQuantity) : undefined,
        minimumOrderQuantity: formData.minimumOrderQuantity !== "" ? Number(formData.minimumOrderQuantity) : undefined,
        warrantyPeriod: formData.warrantyPeriod || undefined,
        guaranteePeriod: formData.guaranteePeriod || undefined,
        hsnCode: formData.hsnCode || undefined,
        flashSale: !!formData.flashSale,
        isNewArrival: !!formData.isNewArrival,
        isFeatured: !!formData.isFeatured,
        isVisible: !!formData.isVisible,
        codAllowed: !!formData.codAllowed,
        returnable: !!formData.returnable,
        cancelable: !!formData.cancelable,
        taxIncluded: !!formData.taxIncluded,
        image: formData.image || undefined,
        images: formData.images || [],
        video: formData.video || undefined,
        tags: formData.tags || [],
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        faqs: formData.faqs || [],
        productType: formData.productType || "physical",
        specifications: specificationsPayload,
      };

      const attributesPayload = variantValues.map(v => ({
        name: v.name,
        axisKey: String(v.name).toLowerCase().replace(/\s+/g, '_'),
        values: [...v.values]
      }));

      const finalVariants = {
        ...(formData.variants || {}),
        attributes: attributesPayload.length > 0 ? attributesPayload : (formData.variants?.attributes || []),
        prices: formData.variants?.prices || {},
        stockMap: formData.variants?.stockMap || {},
      };

      if (formData.productType === "physical") {
        payload.variants = finalVariants;
        if (isTurban) {
          payload.turbanConfig = formData.turbanConfig;
        }
      } else {
        payload.digitalConfig = formData.digitalConfig;
      }

      payload.isActive = !isDraft;
      payload.isVisible = !isDraft;

      if (isEdit) {
        await editProduct(productId, payload);
        toast.success(isDraft ? "Draft saved successfully" : "Product updated successfully");
      } else {
        await addProduct(payload);
        toast.success(isDraft ? "Draft created successfully" : "Product published successfully");
      }
      navigate("/vendor/products");
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.message || "Submission failed";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldValue = (fieldName) => {
    const standardKeys = [
      'name', 'description', 'price', 'originalPrice', 'stockQuantity',
      'lowStockThreshold', 'image', 'images', 'seoTitle', 'seoDescription', 'productType'
    ];
    if (standardKeys.includes(fieldName)) {
      return formData[fieldName] ?? "";
    }
    return (formData.specifications || {})[fieldName] ?? "";
  };

  const setFieldValue = (fieldName, value) => {
    const standardKeys = [
      'name', 'description', 'price', 'originalPrice', 'stockQuantity',
      'lowStockThreshold', 'image', 'images', 'seoTitle', 'seoDescription', 'productType'
    ];
    if (standardKeys.includes(fieldName)) {
      updateForm({ [fieldName]: value });
    } else {
      updateForm({
        specifications: {
          ...(formData.specifications || {}),
          [fieldName]: value
        }
      });
    }
  };

  const addCustomOption = (field) => {
    const inputVal = (customOptionInputs[field.name] || "").trim();
    if (!inputVal) { toast.error("Enter a value"); return; }
    const allOptions = [...(field.options || []), ...(extraFieldOptions[field.name] || [])];
    if (allOptions.some(o => o.toLowerCase() === inputVal.toLowerCase())) {
      toast.error("This option already exists"); return;
    }
    setExtraFieldOptions(prev => ({ ...prev, [field.name]: [...(prev[field.name] || []), inputVal] }));
    setCustomOptionInputs(prev => ({ ...prev, [field.name]: "" }));
    // Auto-select the new custom option
    const currentVal = getFieldValue(field.name);
    if (field.allowMultiple || field.type === "multi_select" || field.type === "checkbox_group") {
      const currentArray = Array.isArray(currentVal) ? currentVal : (currentVal ? currentVal.split(",").map(s => s.trim()) : []);
      setFieldValue(field.name, [...currentArray, inputVal]);
    } else {
      setFieldValue(field.name, inputVal);
    }
    toast.success(`Added "${inputVal}"`);
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Step Tracker Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-serif">
            {isEdit ? "Edit Product Listing" : "Create New Product Listing"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Dynamic Listing Wizard Engine</p>
        </div>

        {/* Steps Progress Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isActive = idx === activeStepIndex;
            return (
              <div
                key={step}
                className={`h-2.5 rounded-full transition-all duration-300 ${isActive
                  ? "w-8 bg-primary-600"
                  : isCompleted
                    ? "w-4 bg-green-500"
                    : "w-2.5 bg-gray-200"
                  }`}
                title={`Step ${idx + 1}: ${step}`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Step Render Container */}
      <div className="min-h-[350px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeStep === "product_type" && (
              <StepProductType
                value={formData.productType}
                onChange={(val) => updateForm({ productType: val })}
                isEdit={isEdit}
              />
            )}

            {activeStep === "category_select" && (
              <StepCategorySelect
                formData={formData}
                onChange={updateForm}
                isEdit={isEdit}
              />
            )}

            {resolvedSchema && !["product_type", "category_select", "basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish", "art_matrix", "digital_upload"].includes(activeStep) && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                {(() => {
                  const stepData = resolvedSchema.steps?.find(s => s.name === activeStep);
                  if (!stepData) {
                    return <div className="text-gray-400">Step details not found in template.</div>;
                  }
                  return (
                    <div className="space-y-6 font-serif">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">{stepData.name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5 font-sans">Provide the details below for this listing section.</p>
                      </div>

                      {stepData.sections?.map((section, secIdx) => (
                        <div key={secIdx} className="space-y-4 border-b border-dashed border-gray-150 pb-4 last:border-0 last:pb-0">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">{section.name}</h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                            {section.fields?.filter(field => {
                              // Exclude static region specifications from Book details step
                              if (isBookCategory && (field.name === "region" || field.name === "book_region" || field.name === "publishing_region")) {
                                return false;
                              }
                              return true;
                            }).map((field, fieldIdx) => {
                              const value = getFieldValue(field.name);
                              console.log(`[Wizard] Rendering field: ${field.name}, type: ${field.type}, allowMultiple: ${field.allowMultiple}, isVariant: ${field.isVariant}`);
                              // Auto-detect: dropdowns inside an "Attributes" section should be multi-select
                              const isAttributesSection = String(section.name || "").toLowerCase().includes("attribute");
                              const shouldForceMultiSelect = isAttributesSection && (field.type === "dropdown" || field.type === "select") && Array.isArray(field.options) && field.options.length > 0;
                              return (
                                <div key={fieldIdx} className={`space-y-1 ${field.name === "book_format" ? "md:col-span-2" : ""}`}>
                                  <label className="block text-xs font-bold text-gray-750">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                  </label>

                                  {field.name === "book_format" ? (
                                    <BookFormatMatrixSection
                                      field={field}
                                      specifications={formData.specifications || {}}
                                      onChange={(specs) => updateForm({ specifications: specs })}
                                    />
                                  ) : field.type === "dimension" ? (
                                    <DimensionInput
                                      field={field}
                                      value={value}
                                      onChange={(val) => setFieldValue(field.name, val)}
                                      extraOptions={extraFieldOptions[field.name] || []}
                                    />
                                  ) : field.type === "textarea" ? (
                                    <textarea
                                      value={value}
                                      onChange={(e) => setFieldValue(field.name, e.target.value)}
                                      placeholder={field.placeholder}
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-slate-50/20 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                  ) : (field.type === "dropdown" || field.type === "select") && !field.allowMultiple && !field.isVariant && !variantAttributeNames.includes(field.name) && !shouldForceMultiSelect ? (
                                    <div className="space-y-1.5">
                                      <select
                                        value={value}
                                        onChange={(e) => setFieldValue(field.name, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                                      >
                                        <option value="">-- Choose Option --</option>
                                        {[...(field.options || []), ...(extraFieldOptions[field.name] || [])].map((opt) => (
                                          <option key={opt} value={opt}>{opt}{extraFieldOptions[field.name]?.includes(opt) ? " (custom)" : ""}</option>
                                        ))}
                                      </select>
                                      {field.vendorCanAddOptions && (
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            value={customOptionInputs[field.name] || ""}
                                            onChange={e => setCustomOptionInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomOption(field))}
                                            placeholder="Add custom value..."
                                            className="flex-1 px-2 py-1 border border-blue-200 rounded text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => addCustomOption(field)}
                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shrink-0"
                                          >
                                            + Add
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : field.type === "multi_select" || field.type === "checkbox_group" || field.allowMultiple ? (
                                    <div className="relative multi-select-dropdown-container">
                                      {/* Trigger Button */}
                                      <button
                                        type="button"
                                        onClick={() => setOpenDropdowns(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                                        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none text-left"
                                      >
                                        <span className="truncate text-gray-700">
                                          {(() => {
                                            const currentArray = Array.isArray(value)
                                              ? value
                                              : (typeof value === 'string' && value.trim() !== '' ? value.split(',').map(s => s.trim()) : []);
                                            return currentArray.length > 0
                                              ? currentArray.join(', ')
                                              : (field.placeholder || "-- Select Options --");
                                          })()}
                                        </span>
                                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>

                                      {/* Dropdown Menu */}
                                      {openDropdowns[field.name] && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto p-2.5 space-y-2">
                                          {[...(field.options || []), ...(extraFieldOptions[field.name] || [])].map((opt) => {
                                            const currentArray = Array.isArray(value)
                                              ? value
                                              : (typeof value === 'string' && value.trim() !== '' ? value.split(',').map(s => s.trim()) : []);
                                            const isChecked = currentArray.includes(opt);
                                            const isCustom = extraFieldOptions[field.name]?.includes(opt);
                                            const handleCheckboxChange = (e) => {
                                              let newArray;
                                              if (e.target.checked) {
                                                newArray = [...currentArray, opt];
                                              } else {
                                                newArray = currentArray.filter(v => v !== opt);
                                              }
                                              setFieldValue(field.name, newArray);
                                            };
                                            return (
                                              <label key={opt} className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 hover:text-black py-1 px-1.5 hover:bg-gray-50 rounded transition-colors select-none">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={handleCheckboxChange}
                                                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                                />
                                                <span>{opt}{isCustom && <span className="text-[9px] text-blue-500 ml-1">(custom)</span>}</span>
                                              </label>
                                            );
                                          })}
                                          {field.vendorCanAddOptions && (
                                            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                                              <input
                                                type="text"
                                                value={customOptionInputs[field.name] || ""}
                                                onChange={e => setCustomOptionInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomOption(field))}
                                                placeholder="Add custom value..."
                                                className="flex-1 px-2 py-1 border border-blue-200 rounded text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => addCustomOption(field)}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shrink-0"
                                              >
                                                + Add
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : field.type === "toggle" || field.type === "checkbox" ? (
                                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                                      <input
                                        type="checkbox"
                                        checked={!!value}
                                        onChange={(e) => setFieldValue(field.name, e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded"
                                      />
                                      <span className="text-xs font-semibold text-gray-650">{field.placeholder || "Enable"}</span>
                                    </label>
                                  ) : (
                                    <input
                                      type={field.type === "number" ? "number" : "text"}
                                      value={value}
                                      onChange={(e) => setFieldValue(field.name, e.target.value)}
                                      placeholder={field.placeholder}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-slate-50/20 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                  )}
                                  {field.helpText && <p className="text-[10px] text-gray-400 mt-0.5">{field.helpText}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {!resolvedSchema && activeStep === "art_matrix" && (
              <StepArtMatrix
                formData={formData}
                onChange={updateForm}
              />
            )}

            {!resolvedSchema && activeStep === "digital_upload" && (
              <StepDigitalUpload
                formData={formData}
                onChange={updateForm}
              />
            )}

            {activeStep === "basic_info" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Basic Product Details</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Enter product title, tags, and display media assets.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => updateForm({ name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="e.g. Printed Silk Turban"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Brand / Manufacturer
                    </label>
                    <select
                      value={formData.brandId || ""}
                      onChange={e => updateForm({ brandId: e.target.value || null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="">No Brand Selected</option>
                      {brands.map(b => (
                        <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Main Media Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Main Showcase Image *
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.image ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                          <img src={formData.image} alt="main" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateForm({ image: "" })}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <FiUpload className="w-6 h-6 text-gray-400" />
                          <span className="text-[10px] text-gray-500 mt-1 font-bold">Upload</span>
                          <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*, image/avif, .avif" />
                        </label>
                      )}
                      <p className="text-xs text-gray-400 leading-relaxed">
                        This is the primary display image that users will see first in lists and cards. Max file size: 5MB.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Gallery Images
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                          <img src={img} alt="gallery" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateForm({ images: formData.images.filter((_, i) => i !== index) })}
                            className="absolute top-0.5 right-0.5 bg-red-650 text-white rounded-full p-0.5 hover:bg-red-750 transition-colors"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <FiUpload className="w-4 h-4 text-gray-400" />
                        <span className="text-[9px] text-gray-500 font-bold">Add</span>
                        <input type="file" multiple onChange={handleGalleryUpload} className="hidden" accept="image/*, image/avif, .avif" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => updateForm({ description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    placeholder="Enter detailed description..."
                  />
                </div>

                {isTurban && (
                  <div className="space-y-5 border-t border-gray-100 pt-5 mt-5">
                    <TurbanFabricSection
                      fabrics={formData.turbanConfig?.fabric || []}
                      onChange={(fabric) => updateForm({ turbanConfig: { ...formData.turbanConfig, fabric } })}
                    />
                    <TurbanColorPanel
                      colors={formData.variants?.colors || []}
                      colorHexMap={formData.variants?.colorHexMap || {}}
                      imageMap={formData.variants?.imageMap || {}}
                      onChange={(colors, colorHexMap, imageMap, newPhoto) => {
                        const updates = {
                          variants: {
                            ...formData.variants,
                            colors,
                            colorHexMap,
                            imageMap
                          }
                        };
                        if (newPhoto && !formData.images.includes(newPhoto)) {
                          updates.images = [...formData.images, newPhoto];
                        }
                        updateForm(updates);
                      }}
                    />
                    <TurbanAdvancedConfig
                      config={formData.turbanConfig}
                      onChange={(updates) => updateForm({ turbanConfig: updates })}
                    />
                  </div>
                )}
              </div>
            )}

            {activeStep === "pricing" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                {/* Option B: Books & Literature — show read-only format price summary instead of generic price inputs */}
                {isBookCategory ? (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pricing Summary</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Format-wise pricing was collected in the previous step. Review your prices below.
                    </p>
                    <div className="mt-4 space-y-3">
                      {(formData.specifications?.bookConfig?.formatOptions || []).length === 0 ? (
                        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                          ⚠️ No formats selected. Go back and select at least one format with a price.
                        </div>
                      ) : (
                        (formData.specifications?.bookConfig?.formatOptions || []).map((opt) => (
                          <div key={opt.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
                            <div className="flex items-center gap-4">
                              {opt.originalPrice && Number(opt.originalPrice) > Number(opt.price) && (
                                <span className="text-xs text-gray-400 line-through">₹{opt.originalPrice}</span>
                              )}
                              <span className="text-sm font-bold text-primary-600">₹{opt.price || "—"}</span>
                              <span className="text-xs text-gray-400">Stock: {opt.stock || "—"}</span>
                            </div>
                          </div>
                        ))
                      )}
                      {formData.price && (
                        <p className="text-xs text-gray-400 mt-2 px-1">
                          Platform display price auto-set to lowest format: <strong>{formData.price}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                ) : matrixEnabled ? (
                  /* Price Matrix for templates with variant matrix enabled */
                  <div>
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Variant Price Matrix</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {isArtCategory
                            ? "Set prices per 1×1 unit area or override prices per variant combination."
                            : "Set price, stock, and SKU for each attribute combination."}
                        </p>
                      </div>

                      {isArtCategory && (
                        <button
                          type="button"
                          onClick={computeAreaPricingForMatrix}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          ⚡ Calculate All Matrix Prices
                        </button>
                      )}
                    </div>

                    {/* ── SI Unit & 1x1 Area Pricing Rules Card for Artwork Templates ── */}
                    {isArtCategory && (
                      <div className="mb-6 p-5 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white shadow-lg space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-4 pb-3 border-b border-indigo-700/50">
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            📐 SI Unit & 1×1 Area Pricing Rules
                          </h3>
                          <span className="text-[11px] text-indigo-300">
                            Formula: Price = W × H × (Base + Material + Frame)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* SI Size Unit Dropdown */}
                          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                            <label className="block text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-1">
                              SI Size Unit *
                            </label>
                            <select
                              value={formData.pricingUnit || "inches"}
                              onChange={e => updateForm({ pricingUnit: e.target.value })}
                              className="w-full px-3 py-1.5 bg-indigo-950 text-white font-bold text-xs border border-indigo-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
                            >
                              <option value="inches">Inches (in)</option>
                              <option value="cm">Centimeters (cm)</option>
                              <option value="feet">Feet (ft)</option>
                              <option value="meter">Meters (m)</option>
                            </select>
                          </div>

                          {/* Base Price per 1x1 */}
                          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                            <label className="block text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-1">
                              Base Price per 1×1 (₹) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-300 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.unitBasePrice || ""}
                                onChange={e => updateForm({ unitBasePrice: e.target.value })}
                                placeholder="e.g. 2.50"
                                className="w-full pl-6 pr-2 py-1.5 bg-indigo-950 text-white font-bold text-xs border border-indigo-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
                              />
                            </div>
                          </div>

                          {/* Quick Compute Banner */}
                          <div className="bg-amber-400/10 p-3 rounded-xl border border-amber-400/30 flex items-center justify-between col-span-1 sm:col-span-2 lg:col-span-1">
                            <div>
                              <span className="text-[10px] font-bold text-amber-300 uppercase block">1×1 Unit Area Rate</span>
                              <span className="text-xs font-black text-amber-100">
                                ₹{formData.unitBasePrice || "0.00"} / sq {formData.pricingUnit === "cm" ? "cm" : formData.pricingUnit === "feet" ? "ft" : formData.pricingUnit === "meter" ? "m" : "in"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={computeAreaPricingForMatrix}
                              className="px-3 py-1.5 bg-amber-400 text-indigo-950 font-black text-[11px] rounded-lg shadow-sm hover:bg-amber-300 transition-colors"
                            >
                              Compute All
                            </button>
                          </div>
                        </div>

                        {/* Material & Frame 1x1 Cost Modifiers */}
                        {variantValues.some(v => ["material", "canvas", "canvas_type", "frame", "frame_type"].includes(v.name.toLowerCase())) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-indigo-700/50 text-xs">
                            {/* Material Modifiers */}
                            {variantValues.filter(v => ["material", "canvas", "canvas_type"].includes(v.name.toLowerCase())).map(attr => (
                              <div key={attr.name} className="space-y-2">
                                <label className="block text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                                  {attr.name} Cost per 1×1 (₹)
                                </label>
                                {attr.values.map(val => (
                                  <div key={val} className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
                                    <span className="font-bold text-white text-[11px] flex-1 truncate">{val}</span>
                                    <span className="text-[11px] text-indigo-300">+ ₹</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={formData.canvasModifiers?.[val] || ""}
                                      onChange={e => updateForm({
                                        canvasModifiers: { ...(formData.canvasModifiers || {}), [val]: e.target.value }
                                      })}
                                      placeholder="0.00"
                                      className="w-20 px-2 py-1 bg-indigo-950 text-white font-bold text-xs border border-indigo-600 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                                    />
                                  </div>
                                ))}
                              </div>
                            ))}

                            {/* Frame Modifiers */}
                            {variantValues.filter(v => ["frame", "frame_type"].includes(v.name.toLowerCase())).map(attr => (
                              <div key={attr.name} className="space-y-2">
                                <label className="block text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                                  {attr.name} Cost per 1×1 (₹)
                                </label>
                                {attr.values.map(val => (
                                  <div key={val} className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
                                    <span className="font-bold text-white text-[11px] flex-1 truncate">{val}</span>
                                    <span className="text-[11px] text-indigo-300">+ ₹</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={formData.frameModifiers?.[val] || ""}
                                      onChange={e => updateForm({
                                        frameModifiers: { ...(formData.frameModifiers || {}), [val]: e.target.value }
                                      })}
                                      placeholder="0.00"
                                      className="w-20 px-2 py-1 bg-indigo-950 text-white font-bold text-xs border border-indigo-600 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                                    />
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {matrixCombinations.length === 0 ? (
                      <div className="mt-5 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        Go back and select values for variant attributes ({variantAttributeNames.join(", ")}) to generate the price matrix.
                      </div>
                    ) : (
                      <div className="mt-5 space-y-4">
                        {/* Summary Bar */}
                        <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-primary-50 border border-primary-100 rounded-lg text-xs">
                          <span className="font-bold text-primary-700">{matrixCombinations.length} combination{matrixCombinations.length !== 1 ? "s" : ""}</span>
                          {matrixMinPrice && <span className="text-gray-600">Price range: <strong className="text-primary-700">₹{matrixMinPrice}</strong> – <strong className="text-primary-700">₹{Math.max(...Object.values(formData.variants?.prices || {}).filter(p => typeof p === 'number' && p > 0))}</strong></span>}
                          <span className="text-gray-400 ml-auto">Base display price auto-set to lowest: ₹{matrixMinPrice || "—"}</span>
                        </div>

                        {/* Matrix Table */}
                        <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
                          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {variantValues.map(v => <th key={v.name} className="p-3 whitespace-nowrap">{v.name}</th>)}
                                {matrixConfig?.affectsPrice && <th className="p-3 w-28">Price (₹) *</th>}
                                {matrixConfig?.affectsInventory && <th className="p-3 w-24">Stock</th>}
                                {matrixConfig?.affectsSKU && !isArtCategory && <th className="p-3 w-28">SKU</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {matrixCombinations.map((combo, cIdx) => {
                                const key = makeComboKey(combo);
                                const price = formData.variants?.prices?.[key] ?? "";
                                const stock = formData.variants?.stockMap?.[key] ?? "";
                                const sku = formData.variants?.skuMap?.[key] ?? "";
                                return (
                                  <tr key={cIdx} className="hover:bg-slate-50 transition-colors">
                                    {variantValues.map(v => (
                                      <td key={v.name} className="p-3 font-medium text-gray-700 whitespace-nowrap">{combo[v.name]}</td>
                                    ))}
                                    {matrixConfig?.affectsPrice && (
                                      <td className="p-2">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={price}
                                          onChange={e => {
                                            const val = e.target.value === "" ? "" : Number(e.target.value);
                                            setFormData(prev => ({
                                              ...prev,
                                              variants: { ...prev.variants, prices: { ...(prev.variants?.prices || {}), [key]: val } }
                                            }));
                                          }}
                                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none bg-white font-semibold"
                                          placeholder="0.00"
                                        />
                                      </td>
                                    )}
                                    {matrixConfig?.affectsInventory && (
                                      <td className="p-2">
                                        <input
                                          type="number"
                                          min="0"
                                          value={stock}
                                          onChange={e => {
                                            const val = e.target.value === "" ? "" : Number(e.target.value);
                                            setFormData(prev => ({
                                              ...prev,
                                              variants: { ...prev.variants, stockMap: { ...(prev.variants?.stockMap || {}), [key]: val } }
                                            }));
                                          }}
                                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                                          placeholder="0"
                                        />
                                      </td>
                                    )}
                                    {matrixConfig?.affectsSKU && !isArtCategory && (
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={sku}
                                          onChange={e => {
                                            setFormData(prev => ({
                                              ...prev,
                                              variants: { ...prev.variants, skuMap: { ...(prev.variants?.skuMap || {}), [key]: e.target.value } }
                                            }));
                                          }}
                                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none bg-white font-mono"
                                          placeholder="SKU"
                                        />
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Original / MRP field still available */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-gray-100">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                              Original Price / M.R.P (₹)
                            </label>
                            <input
                              type="number"
                              value={formData.originalPrice}
                              onChange={e => updateForm({ originalPrice: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                              placeholder="Leave empty if no discount"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard pricing for all other categories */
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pricing Setup</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Configure base pricing, taxes, and discounts.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={e => updateForm({ price: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          placeholder="e.g. 1500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Original Price (M.R.P) (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.originalPrice}
                          onChange={e => updateForm({ originalPrice: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          placeholder="Leave empty if no discount"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeStep === "inventory" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                {isBookCategory ? (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Stock & Inventory Summary</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Format-wise stock levels were collected in the previous step. Review your inventory below.
                    </p>
                    <div className="mt-4 space-y-3">
                      {(formData.specifications?.bookConfig?.formatOptions || []).length === 0 ? (
                        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                          ⚠️ No formats selected. Go back and select at least one format with stock levels.
                        </div>
                      ) : (
                        (formData.specifications?.bookConfig?.formatOptions || []).map((opt) => (
                          <div key={opt.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
                            <span className="text-sm font-bold text-gray-900">Stock: {opt.stock || "0"}</span>
                          </div>
                        ))
                      )}
                      {formData.stockQuantity && (
                        <p className="text-xs text-gray-400 mt-2 px-1">
                          Total Platform Stock: <strong>{formData.stockQuantity}</strong> ({formData.stock === "in_stock" ? "In Stock" : "Out of Stock"})
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard inventory for other categories */
                  <div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight">Stock & Inventory</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Manage stock levels, purchase limits, and thresholds.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Stock Status
                        </label>
                        <select
                          value={formData.stock}
                          onChange={e => updateForm({ stock: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          value={formData.stockQuantity}
                          onChange={e => updateForm({ stockQuantity: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          placeholder="e.g. 50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Minimum Order Qty
                        </label>
                        <input
                          type="number"
                          value={formData.minimumOrderQuantity}
                          onChange={e => updateForm({ minimumOrderQuantity: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          placeholder="1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeStep === "shipping" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Shipping Settings</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Determine product weight & delivery properties.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={isBookCategory ? "md:col-span-2" : ""}>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Delivery Region Scope *
                    </label>
                    <select
                      value={formData.deliveryRegion || "domestic"}
                      onChange={e => updateForm({ deliveryRegion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                    >
                      <option value="domestic">Domestic Shipping Only (India-wide)</option>
                      <option value="worldwide">Worldwide Shipping (International + Domestic)</option>
                      <option value="local">Regional/Local Shipping Only</option>
                    </select>
                  </div>

                  {!isBookCategory && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Warranty Period
                        </label>
                        <input
                          type="text"
                          value={formData.warrantyPeriod}
                          onChange={e => updateForm({ warrantyPeriod: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          placeholder="e.g. 6 Months"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Guarantee Period
                        </label>
                        <input
                          type="text"
                          value={formData.guaranteePeriod}
                          onChange={e => updateForm({ guaranteePeriod: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          placeholder="e.g. 1 Year"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-gray-150 pt-6 mt-6">
                  <label className="block text-xs font-bold text-gray-750 uppercase tracking-wider mb-3">
                    Available Delivery Partners / Carriers *
                  </label>
                  <p className="text-xs text-gray-500 mb-4 font-sans">Select which active couriers can service this product shipment.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-sans">
                    {[
                      { id: "fedex", name: "FedEx Express", desc: "Express courier delivery" },
                      { id: "delhivery", name: "Delhivery Logistics", desc: "E-commerce logistics" },
                      { id: "bluedart", name: "Blue Dart Express", desc: "Priority cargo delivery" },
                      { id: "dhl", name: "DHL Worldwide", desc: "International shipping" }
                    ].map(carrier => {
                      const isChecked = (formData.shippingCarriers || []).includes(carrier.id);
                      return (
                        <label
                          key={carrier.id}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isChecked
                              ? "border-primary-600 bg-primary-50/20 ring-2 ring-primary-500/10"
                              : "border-gray-250 hover:border-primary-250 bg-white"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const nextCarriers = isChecked
                                ? (formData.shippingCarriers || []).filter(id => id !== carrier.id)
                                : [...(formData.shippingCarriers || []), carrier.id];
                              updateForm({ shippingCarriers: nextCarriers });
                            }}
                            className="mt-0.5 rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-805">{carrier.name}</p>
                            <p className="text-[10px] text-gray-400">{carrier.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeStep === "seo" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">SEO optimization</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Improve search ranking configurations for Google.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      SEO Title Tag
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={e => updateForm({ seoTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="Search engine optimized title"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      SEO Description Tag
                    </label>
                    <textarea
                      value={formData.seoDescription}
                      onChange={e => updateForm({ seoDescription: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="Search engine optimized description"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStep === "preview" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Listing Preview</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Verify your details before final launch submission.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl">
                  <div className="w-full h-48 rounded-xl overflow-hidden border bg-white">
                    <img src={formData.image || "/placeholder.png"} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="text-lg font-black text-gray-800">{formData.name || "Untitled Product"}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      Type: <span className="text-primary-600 font-bold capitalize">{formData.productType}</span>
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed max-h-24 overflow-y-auto">
                      {formData.description || "No description provided."}
                    </p>
                    <div className="flex gap-4 items-center">
                      <span className="text-xl font-black text-gray-900">₹{formData.price || "0.00"}</span>
                      {formData.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">₹{formData.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === "publish" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 text-center space-y-6">
                <div className="flex justify-center">
                  <FiCheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ready to Publish!</h2>
                  <p className="text-sm text-gray-500 mt-1.5">
                    Your listing is complete and ready. Select below to save as draft or publish to marketplace.
                  </p>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-gray-350 hover:bg-gray-100 rounded-xl font-bold text-sm text-gray-700 transition-colors shadow-sm"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm hover:bg-primary-700 transition-all shadow-md"
                  >
                    {isSubmitting ? "Submitting..." : "Publish Product"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons Footer */}
      {activeStep !== "publish" && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeStepIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl font-semibold text-xs text-gray-700 transition-colors ${activeStepIndex === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
              }`}
          >
            <FiArrowLeft className="w-4 h-4" /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl text-xs hover:bg-primary-700 transition-colors shadow-sm"
          >
            Next <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

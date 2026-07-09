import { useState, useEffect, useMemo } from "react";
import { FiCheck } from "react-icons/fi";
import { formatPrice } from "../../utils/helpers";
import KadaMeasurementTool from "./KadaMeasurementTool";
import { getVariantSignature, resolveVariantPrice } from "../../utils/variant";
const normalizeAxisName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const toEntries = (value) => {
  if (!value) return [];
  if (value instanceof Map) return Array.from(value.entries());
  if (typeof value === "object") return Object.entries(value);
  return [];
};

const VariantSelector = ({ variants, onVariantChange, currentPrice, isKada }) => {
  const [selectedVariant, setSelectedVariant] = useState({});

  const [isMeasurementToolOpen, setIsMeasurementToolOpen] = useState(false);

  const handleKadaSizeConfirm = (recommendedSize) => {
    // Try to auto-select the best match for the recommended size
    const sizeAxis = axes.find(a => a.key === 'size' || a.key === 'sizes');
    if (sizeAxis) {
      let match = null;
      // Try exact match with the inner size first (e.g., "2.6")
      match = sizeAxis.values.find(v => String(v) === recommendedSize.inner);

      if (!match) {
        // Try fuzzy match with the letter size (e.g., "Medium", "M")
        match = sizeAxis.values.find(v => {
          const s = String(v).toLowerCase();
          const target = recommendedSize.size.toLowerCase();
          return s === target || s === target[0];
        });
      }

      if (!match && sizeAxis.values.length > 0) {
        // If no match but there are sizes, just pick the first one and let them adjust
        match = sizeAxis.values[0];
      }

      if (match) {
        handleOptionSelect(sizeAxis.key, match);
      }
    }
    setIsMeasurementToolOpen(false);
  };


  const axes = useMemo(() => {
    const dynamicAxes = Array.isArray(variants?.attributes)
      ? variants.attributes
        .map((attr) => ({
          label: String(attr?.name || "").trim(),
          key: normalizeAxisName(attr?.name),
          values: Array.isArray(attr?.values) ? attr.values : [],
        }))
        .filter((attr) => attr.label && attr.key && attr.values.length > 0)
      : [];
    if (dynamicAxes.length) return dynamicAxes;

    const fallback = [];
    const sizes = Array.isArray(variants?.sizes) ? variants.sizes : [];
    const colors = Array.isArray(variants?.colors) ? variants.colors : [];
    if (sizes.length) fallback.push({ label: "Size", key: "size", values: sizes });
    if (colors.length) fallback.push({ label: "Color", key: "color", values: colors });
    return fallback;
  }, [variants]);

  const getVariantStockValue = (selection) => {
    const entries = toEntries(variants?.stockMap);
    if (!entries.length) return null;
    const key = getVariantSignature(selection);
    if (!key) return null;

    const exact = entries.find(([rawKey]) => String(rawKey).trim() === key);
    if (exact) {
      const parsed = Number(exact[1]);
      if (Number.isFinite(parsed)) return parsed;
    }
    const normalized = entries.find(
      ([rawKey]) => String(rawKey).trim().toLowerCase() === key.toLowerCase()
    );
    if (normalized) {
      const parsed = Number(normalized[1]);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  useEffect(() => {
    const nextSelection = {};
    const defaultSelection = variants?.defaultSelection && typeof variants.defaultSelection === "object"
      ? variants.defaultSelection
      : {};
    axes.forEach((axis) => {
      const directDefault = String(defaultSelection?.[axis.key] || "").trim();
      const legacyDefault = axis.key === "size"
        ? String(variants?.defaultVariant?.size || "").trim()
        : axis.key === "color"
          ? String(variants?.defaultVariant?.color || "").trim()
          : "";
      let selected = directDefault || legacyDefault;

      // Auto-select the first option if none is selected, to improve user experience
      if (!selected && axis.values.length > 0) {
        selected = axis.values[0];
      }

      if (selected) nextSelection[axis.key] = selected;
    });
    setSelectedVariant(nextSelection);
  }, [axes, variants]);

  useEffect(() => {
    onVariantChange?.(selectedVariant || {});
  }, [selectedVariant, onVariantChange]);

  if (!axes.length) return null;

  const handleOptionSelect = (axisKey, value) => {
    setSelectedVariant((prev) => {
      const isSame = String(prev?.[axisKey] || "") === String(value || "");
      const next = { ...(prev || {}) };
      if (isSame) {
        delete next[axisKey];
      } else {
        next[axisKey] = value;
      }
      return next;
    });
  };

  const isOptionAvailable = (axisKey, value) => {
    const previewSelection = { ...(selectedVariant || {}), [axisKey]: value };
    const stock = getVariantStockValue(previewSelection);
    return stock === null ? true : stock > 0;
  };

  const getVariantPrice = () => {
    return resolveVariantPrice({ price: currentPrice, variants }, selectedVariant);
  };

  return (
    <div className="space-y-6">
      {axes.map((axis) => (
        <div key={axis.key}>

          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span>{axis.label}:</span>
              <span className="font-normal text-gray-600">
                {selectedVariant?.[axis.key] || `Select ${axis.label.toLowerCase()}`}
              </span>
              {isKada && (axis.key === 'size' || axis.key === 'sizes') && (
                <button
                  type="button"
                  onClick={() => setIsMeasurementToolOpen(true)}
                  className="ml-2 text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 px-2 py-1.5 rounded-lg border border-primary-100 transition-colors shadow-sm"
                >
                  📏 Measure Size
                </button>
              )}
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            {axis.values.map((option) => {
              const isSelected = selectedVariant?.[axis.key] === option;
              const isAvailable = isOptionAvailable(axis.key, option);
              const isColor = axis.key === "color" || axis.label.toLowerCase() === "color";

              if (isColor) {
                const colorHex = variants?.colorHexMap?.[option] || "";
                const comboKey = `${axis.key}=${String(option).trim().toLowerCase()}`;
                const colorImg = variants?.imageMap?.[comboKey] || "";
                const optionPrice = variants?.prices?.[comboKey];

                return (
                  <button
                    key={`${axis.key}-${option}`}
                    onClick={() => handleOptionSelect(axis.key, option)}
                    disabled={!isAvailable}
                    className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold border-2 transition-all duration-300 ${isSelected
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : isAvailable
                        ? "border-gray-200 hover:border-primary-400 bg-white text-gray-700"
                        : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                  >
                    {colorImg && (
                      <img
                        src={colorImg}
                        alt={option}
                        className="w-7 h-7 rounded-lg object-cover border border-gray-200 shadow-sm flex-shrink-0"
                      />
                    )}
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 inline-block"
                      style={{ backgroundColor: colorHex || option }}
                      title={colorHex || option}
                    />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs">{option}</span>
                      {optionPrice !== undefined && optionPrice !== "" && (
                        <span className="text-[10px] text-gray-500 font-normal">
                          ₹{Number(optionPrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <FiCheck className="text-white text-xs" />
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={`${axis.key}-${option}`}
                  onClick={() => handleOptionSelect(axis.key, option)}
                  disabled={!isAvailable}
                  className={`relative px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-300 ${isSelected
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : isAvailable
                      ? "border-gray-200 hover:border-primary-400 bg-white text-gray-700"
                      : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                    }`}
                >
                  {option}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <FiCheck className="text-white text-xs" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}



      {getVariantPrice() !== Number(currentPrice || 0) && (
        <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
          <p className="text-sm text-gray-600 mb-1">Selected variant price:</p>
          <p className="text-xl font-bold text-primary-700">{formatPrice(getVariantPrice())}</p>
        </div>
      )}
      {isKada && (
        <KadaMeasurementTool
          isOpen={isMeasurementToolOpen}
          onClose={() => setIsMeasurementToolOpen(false)}
          onConfirm={handleKadaSizeConfirm}
        />
      )}
    </div>
  );
};

export default VariantSelector;

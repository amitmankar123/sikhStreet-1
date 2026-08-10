import React, { useMemo } from "react";
import { FiDollarSign, FiPackage } from "react-icons/fi";

/**
 * VariantPricingMatrix
 *
 * Renders a per-option pricing table for any field marked as `isPricingAxis: true`.
 *
 * How it works:
 *  - Admin marks a field (e.g. "Book Format", "Size", "Dimension") as a pricing axis
 *  - This component renders a table where each option has:
 *      → a checkbox to select if vendor offers that option
 *      → Selling Price input
 *      → Original MRP input
 *      → Stock Quantity input
 *  - Data is stored under: formData.variants.pricingMatrix[field.name][optionValue]
 *
 * Examples:
 *   Books   → Book Format [Hardcover, Paperback, Binding] → price+stock per format
 *   Fashion → Size [S, M, L, XL] → price+stock per size
 *   Art     → Dimension [8x10, 12x16, 20x30] → price per dimension
 */
export default function VariantPricingMatrix({ field, formData, onChange }) {
  const options = Array.isArray(field.options) ? field.options : [];
  const matrixKey = field.name;

  // Current matrix data: { [option]: { enabled, price, originalPrice, stock } }
  const matrix = useMemo(() => {
    return formData?.variants?.pricingMatrix?.[matrixKey] || {};
  }, [formData?.variants?.pricingMatrix, matrixKey]);

  const updateMatrix = (option, updates) => {
    const currentMatrix = formData?.variants?.pricingMatrix || {};
    const currentEntry = currentMatrix[matrixKey]?.[option] || { enabled: false, price: "", originalPrice: "", stock: "" };
    const updatedMatrix = {
      ...currentMatrix,
      [matrixKey]: {
        ...(currentMatrix[matrixKey] || {}),
        [option]: { ...currentEntry, ...updates }
      }
    };
    onChange({
      variants: {
        ...(formData.variants || {}),
        pricingMatrix: updatedMatrix
      }
    });
  };

  const toggleOption = (option) => {
    const isEnabled = !!matrix[option]?.enabled;
    updateMatrix(option, {
      enabled: !isEnabled,
      price: matrix[option]?.price || "",
      originalPrice: matrix[option]?.originalPrice || "",
      stock: matrix[option]?.stock || ""
    });
  };

  const enabledCount = options.filter(opt => matrix[opt]?.enabled).length;

  if (options.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 font-semibold">
        ⚠ No options defined for "{field.label}". Ask admin to add options to this field.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-gray-800">
            {field.pricingAxisLabel || `Set Price & Stock per ${field.label}`}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Select the options you offer and set pricing for each.
            {enabledCount > 0 && (
              <span className="ml-1 text-green-600 font-semibold">
                {enabledCount} option{enabledCount > 1 ? "s" : ""} selected.
              </span>
            )}
          </p>
        </div>
        {field.required && (
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded shrink-0">
            At least 1 required
          </span>
        )}
      </div>

      {/* Pricing Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                <th className="p-3 w-8"></th>
                <th className="p-3">{field.label}</th>
                <th className="p-3">
                  <div className="flex items-center gap-1">
                    <FiDollarSign className="text-green-600" />
                    Selling Price (₹) *
                  </div>
                </th>
                <th className="p-3">Original MRP (₹)</th>
                <th className="p-3">
                  <div className="flex items-center gap-1">
                    <FiPackage className="text-blue-500" />
                    Stock Qty
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {options.map((option) => {
                const entry = matrix[option] || {};
                const isEnabled = !!entry.enabled;
                return (
                  <tr
                    key={option}
                    className={`transition-colors ${isEnabled ? "bg-white" : "bg-gray-50/60 opacity-70"}`}
                  >
                    {/* Checkbox */}
                    <td className="p-3">
                      <input
                        type="checkbox"
                        id={`pricing-axis-${matrixKey}-${option}`}
                        checked={isEnabled}
                        onChange={() => toggleOption(option)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                      />
                    </td>

                    {/* Option Label */}
                    <td className="p-3">
                      <label
                        htmlFor={`pricing-axis-${matrixKey}-${option}`}
                        className={`font-semibold cursor-pointer ${isEnabled ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {option}
                      </label>
                    </td>

                    {/* Selling Price */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!isEnabled}
                          value={entry.price || ""}
                          onChange={(e) =>
                            updateMatrix(option, {
                              price: e.target.value === "" ? "" : Number(e.target.value)
                            })
                          }
                          placeholder={isEnabled ? "e.g. 499" : "—"}
                          className="w-28 px-2 py-1.5 border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs bg-white disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed"
                        />
                      </div>
                    </td>

                    {/* Original MRP */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!isEnabled}
                          value={entry.originalPrice || ""}
                          onChange={(e) =>
                            updateMatrix(option, {
                              originalPrice: e.target.value === "" ? "" : Number(e.target.value)
                            })
                          }
                          placeholder={isEnabled ? "e.g. 599" : "—"}
                          className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs bg-white disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed"
                        />
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={!isEnabled}
                        value={entry.stock || ""}
                        onChange={(e) =>
                          updateMatrix(option, {
                            stock: e.target.value === "" ? "" : Number(e.target.value)
                          })
                        }
                        placeholder={isEnabled ? "e.g. 100" : "—"}
                        className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs bg-white disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary chips of selected options */}
      {enabledCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options
            .filter((opt) => matrix[opt]?.enabled)
            .map((opt) => (
              <span
                key={opt}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 text-green-800 rounded-full text-xs font-semibold"
              >
                ✓ {opt}
                {matrix[opt]?.price ? ` · ₹${matrix[opt].price}` : ""}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

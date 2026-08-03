import React, { useState, useEffect } from "react";
import { FiEye, FiSettings, FiArrowRight, FiArrowLeft, FiLayers } from "react-icons/fi";
import toast from "react-hot-toast";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { resolveCategorySchema } from "../../services/adminService";
import AnimatedSelect from "../../components/AnimatedSelect";

export default function CategoryPreview() {
  const { categories, initialize: initCategories } = useCategoryStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [resolvedTemplate, setResolvedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated Form State & Wizards
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [mockProductData, setMockProductData] = useState({});

  useEffect(() => {
    initCategories();
  }, []);

  const handleCategoryChange = async (e) => {
    const value = e.target.value;
    setSelectedCategoryId(value);
    setResolvedTemplate(null);
    setActiveStepIdx(0);
    setMockProductData({});

    if (!value) return;

    setIsLoading(true);
    try {
      const response = await resolveCategorySchema(value);
      setResolvedTemplate(response.data || null);
      toast.success("Resolved category template schema!");
    } catch (error) {
      toast.error("Failed to resolve template for category.");
    } finally {
      setIsLoading(false);
    }
  };

  const getParentId = (cat) => {
    if (!cat.parentId) return null;
    if (typeof cat.parentId === 'object') {
      return cat.parentId.id || cat.parentId._id || null;
    }
    return cat.parentId;
  };

  const getCategoryDepth = (cat) => {
    const parentId = getParentId(cat);
    if (!parentId) return 1;
    const parent = categories.find(c => String(c.id || c._id) === String(parentId));
    if (!parent) return 2;
    const gpId = getParentId(parent);
    if (!gpId) return 2;
    return 3;
  };

  const handleInputChange = (fieldName, value) => {
    setMockProductData({
      ...mockProductData,
      [fieldName]: value
    });
  };

  const currentStep = resolvedTemplate?.steps?.[activeStepIdx] || null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dynamic Category Preview Sandbox</h1>
        <p className="text-sm text-gray-500">
          Select any category from the directory tree to inspect its dynamically-assembled product listing wizard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Sidebar */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 h-fit">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Category</label>
            <select
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose Category --</option>
              {categories
                .sort((a, b) => getCategoryDepth(a) - getCategoryDepth(b))
                .map((cat) => {
                  const depth = getCategoryDepth(cat);
                  return (
                    <option key={cat.id || cat._id} value={cat.id || cat._id}>
                      {"—".repeat(depth - 1)} {cat.name}
                    </option>
                  );
                })}
            </select>
          </div>

          {resolvedTemplate && (
            <div className="border-t border-gray-150 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <FiLayers className="text-primary-600" />
                <span className="text-sm font-bold text-gray-800">Assigned Template Details</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1 bg-slate-50 p-3 rounded-lg border border-gray-100">
                <p><span className="font-bold">Template:</span> {resolvedTemplate.name || "Default"}</p>
                <p><span className="font-bold">Wizard Steps:</span> {resolvedTemplate.steps?.length || 0} Steps</p>
                <p>
                  <span className="font-bold">Product Types:</span>{" "}
                  {resolvedTemplate.supportedProductTypes?.join(", ") || "Physical"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Simulator Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center gap-2">
            <FiEye className="text-gray-500" />
            <span className="text-sm font-bold text-gray-700">Dynamic Wizard Simulator (Interactive Preview)</span>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">Resolving category schema...</div>
          ) : !resolvedTemplate ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <FiSettings className="text-4xl text-gray-300 mb-3 animate-spin" style={{ animationDuration: "3s" }} />
              <p className="text-sm font-semibold">Select a category on the left to start the dynamic form simulation.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between p-6">
              {/* Wizard Step Navigation Tracker */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-4 overflow-x-auto scrollbar-admin">
                {resolvedTemplate.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                      activeStepIdx === idx
                        ? "bg-primary-600 text-white shadow-sm"
                        : "bg-slate-100 text-gray-600"
                    }`}
                  >
                    {idx + 1}. {step.name}
                  </div>
                ))}
              </div>

              {/* Dynamic Inputs Builder */}
              <div className="flex-1 py-6 space-y-6">
                {currentStep ? (
                  <div className="space-y-6">
                    <h3 className="text-base font-bold text-gray-800 border-l-4 border-primary-600 pl-2">
                      Step fields: {currentStep.name}
                    </h3>
                    
                    {currentStep.sections?.map((section, secIdx) => (
                      <div key={secIdx} className="space-y-4 border-b border-dashed border-gray-100 pb-4 last:border-0 last:pb-0">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{section.name}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {section.fields?.map((field, fieldIdx) => {
                            const value = mockProductData[field.name] ?? "";
                            return (
                              <div key={fieldIdx} className="space-y-1">
                                <label className="block text-xs font-bold text-gray-700">
                                  {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                
                                {field.type === "textarea" ? (
                                  <textarea
                                    value={value}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-slate-50/30 focus:ring-2 focus:ring-primary-500 outline-none"
                                  />
                                ) : field.type === "dropdown" || field.type === "select" ? (
                                  <select
                                    value={value}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                                  >
                                    <option value="">-- Choose Option --</option>
                                    {field.options?.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : field.type === "toggle" || field.type === "checkbox" ? (
                                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                                    <input
                                      type="checkbox"
                                      checked={!!value}
                                      onChange={(e) => handleInputChange(field.name, e.target.checked)}
                                      className="w-4 h-4 text-primary-600 rounded"
                                    />
                                    <span className="text-xs font-semibold text-gray-650">{field.placeholder || "Enable Option"}</span>
                                  </label>
                                ) : (
                                  <input
                                    type={field.type === "number" ? "number" : "text"}
                                    value={value}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-slate-50/30 focus:ring-2 focus:ring-primary-500 outline-none"
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
                ) : (
                  <p className="text-sm text-gray-400 italic">No fields in this step configuration.</p>
                )}
              </div>

              {/* Back / Next actions */}
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center bg-slate-50/50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setActiveStepIdx(prev => Math.max(0, prev - 1))}
                  disabled={activeStepIdx === 0}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-40"
                >
                  <FiArrowLeft /> Back
                </button>

                {activeStepIdx < resolvedTemplate.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStepIdx(prev => prev + 1)}
                    className="flex items-center gap-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow"
                  >
                    Next <FiArrowRight />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Mock product listing submitted:", mockProductData);
                      toast.success("Simulated listing validation checks passed successfully!");
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow"
                  >
                    Finish & Publish (Simulated)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

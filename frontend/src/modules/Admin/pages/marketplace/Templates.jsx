import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiLayers, FiList, FiCheckSquare, FiPlusCircle, FiMove } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Button from "../../components/Button";
import {
  getProductTemplates,
  createProductTemplate,
  updateProductTemplate,
  deleteProductTemplate,
  getAdditionalFields
} from "../../services/adminService";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [libraryFields, setLibraryFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Template Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    supportedProductTypes: ["physical"],
    steps: []
  });

  // Active step in builder UI
  const [selectedStepIdx, setSelectedStepIdx] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resTemplates, resFields] = await Promise.all([
        getProductTemplates(),
        getAdditionalFields()
      ]);
      setTemplates(resTemplates.data || []);
      setLibraryFields(resFields.data || []);
    } catch (error) {
      toast.error("Failed to load templates or library fields.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      supportedProductTypes: ["physical"],
      workflowSteps: ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"],
      steps: [
        {
          name: "Basic Information",
          sections: [
            {
              name: "General Details",
              fields: [
                { name: "name", label: "Product Name", type: "text", required: true },
                { name: "description", label: "Description", type: "textarea", required: false }
              ]
            }
          ]
        },
        {
          name: "Pricing",
          sections: [
            {
              name: "Pricing Matrix",
              fields: [
                { name: "price", label: "Retail Price", type: "number", required: true },
                { name: "originalPrice", label: "Original Price", type: "number", required: false }
              ]
            }
          ]
        }
      ]
    });
    setSelectedStepIdx(0);
    setShowModal(true);
  };

  const handleOpenEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || "",
      description: template.description || "",
      supportedProductTypes: template.supportedProductTypes || ["physical"],
      workflowSteps: template.workflowSteps || ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"],
      steps: template.steps || []
    });
    setSelectedStepIdx(0);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product template? Categories using it will fallback to the default listing form.")) {
      try {
        await deleteProductTemplate(id);
        toast.success("Template deleted.");
        loadData();
      } catch (error) {
        toast.error("Failed to delete template.");
      }
    }
  };

  // Step operations in builder
  const addStep = () => {
    const stepName = window.prompt("Enter step name:");
    if (!stepName?.trim()) return;
    const newSteps = [...formData.steps, { name: stepName.trim(), sections: [] }];
    setFormData({ ...formData, steps: newSteps });
    setSelectedStepIdx(newSteps.length - 1);
  };

  const removeStep = (idx) => {
    if (formData.steps.length <= 1) {
      toast.error("A template must contain at least one wizard step.");
      return;
    }
    if (window.confirm(`Delete the step "${formData.steps[idx].name}" and all its sections?`)) {
      const newSteps = formData.steps.filter((_, i) => i !== idx);
      setFormData({ ...formData, steps: newSteps });
      setSelectedStepIdx(0);
    }
  };

  // Section operations inside selected step
  const addSection = () => {
    const secName = window.prompt("Enter section name:");
    if (!secName?.trim()) return;
    const updatedSteps = [...formData.steps];
    updatedSteps[selectedStepIdx].sections.push({ name: secName.trim(), fields: [] });
    setFormData({ ...formData, steps: updatedSteps });
  };

  const removeSection = (secIdx) => {
    const updatedSteps = [...formData.steps];
    const secName = updatedSteps[selectedStepIdx].sections[secIdx].name;
    if (window.confirm(`Delete the section "${secName}"?`)) {
      updatedSteps[selectedStepIdx].sections.splice(secIdx, 1);
      setFormData({ ...formData, steps: updatedSteps });
    }
  };

  // Field operations inside selected section
  const addFieldToSection = (secIdx, field) => {
    const updatedSteps = [...formData.steps];
    const section = updatedSteps[selectedStepIdx].sections[secIdx];
    
    // Avoid duplicates
    if (section.fields.some((f) => f.name === field.name)) {
      toast.error("This field is already added to the section.");
      return;
    }

    section.fields.push({
      name: field.name,
      label: field.label,
      type: field.type,
      placeholder: field.placeholder || "",
      required: !!field.required,
      options: field.options || []
    });

    setFormData({ ...formData, steps: updatedSteps });
    toast.success(`Added ${field.label} to section.`);
  };

  const addCustomFieldToSection = (secIdx) => {
    const label = window.prompt("Enter field label (e.g. Edition):");
    if (!label?.trim()) return;
    const name = label.trim().toLowerCase().replace(/\s+/g, "_");
    
    const updatedSteps = [...formData.steps];
    const section = updatedSteps[selectedStepIdx].sections[secIdx];

    section.fields.push({
      name,
      label: label.trim(),
      type: "text",
      placeholder: "",
      required: false,
      options: []
    });

    setFormData({ ...formData, steps: updatedSteps });
  };

  const removeFieldFromSection = (secIdx, fieldIdx) => {
    const updatedSteps = [...formData.steps];
    updatedSteps[selectedStepIdx].sections[secIdx].fields.splice(fieldIdx, 1);
    setFormData({ ...formData, steps: updatedSteps });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    try {
      if (editingTemplate) {
        await updateProductTemplate(editingTemplate.id || editingTemplate._id, formData);
        toast.success("Product template updated.");
      } else {
        await createProductTemplate(formData);
        toast.success("Product template created.");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error("Failed to save template.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Templates</h1>
          <p className="text-sm text-gray-500">Configure multi-step creation wizards for categories dynamically.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold text-sm shadow"
        >
          <FiPlus />
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 col-span-full">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500 col-span-full">No templates created yet. Click Create Template to begin.</div>
        ) : (
          templates.map((tpl) => (
            <div key={tpl.id || tpl._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiLayers className="text-primary-650 text-xl" />
                  <h3 className="font-bold text-gray-800 text-lg">{tpl.name}</h3>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{tpl.description || "No description provided."}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tpl.supportedProductTypes?.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-semibold capitalize">{t}</span>
                  ))}
                  <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded font-semibold">{tpl.steps?.length || 0} Steps</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-5 border-t border-gray-100 mt-5">
                <Button onClick={() => handleOpenEdit(tpl)} variant="secondary" size="sm" icon={FiEdit}>Edit Builder</Button>
                <Button onClick={() => handleDelete(tpl.id || tpl._id)} variant="danger" size="sm" icon={FiTrash2}>Delete</Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingTemplate ? "Edit Product Template Builder" : "Create Product Template"}
                </h2>
                <p className="text-xs text-gray-400">Build steps, sections, and fields for listing products in this layout.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Body - Left Sidebar (Metadata/Steps) + Center Form (Builder) + Right Sidebar (Fields Library) */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column - Steps & Metadata */}
              <div className="w-1/4 border-r border-gray-200 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Books Template"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Brief description..."
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700 uppercase">Wizard Steps</span>
                    <button type="button" onClick={addStep} className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1">+ Add</button>
                  </div>
                  <div className="space-y-1.5">
                    {formData.steps?.map((step, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedStepIdx(idx)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
                          selectedStepIdx === idx
                            ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span className="truncate">{step.name}</span>
                        {formData.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStep(idx);
                            }}
                            className={`text-xs ml-2 hover:scale-115 transition-transform ${selectedStepIdx === idx ? "text-white" : "text-red-500"}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <span className="text-xs font-bold text-gray-700 uppercase block mb-1">Listing Workflow Steps</span>
                  <p className="text-[10px] text-gray-400 mb-2">Check the standard steps to active in the listing wizard:</p>
                  <div className="space-y-2">
                    {[
                      { key: "pricing", label: "Pricing Details" },
                      { key: "inventory", label: "Inventory Rules" },
                      { key: "shipping", label: "Shipping Settings" },
                      { key: "seo", label: "SEO Config" }
                    ].map(({ key, label }) => {
                      const isChecked = formData.workflowSteps?.includes(key);
                      return (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let steps = [...(formData.workflowSteps || ["basic_info", "preview", "publish"])];
                              if (e.target.checked) {
                                if (!steps.includes(key)) steps.push(key);
                              } else {
                                steps = steps.filter((s) => s !== key);
                              }
                              setFormData({ ...formData, workflowSteps: steps });
                            }}
                            className="w-4 h-4 text-primary-650 rounded border-gray-300 focus:ring-primary-500"
                          />
                          <span className="text-xs font-semibold text-gray-650">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Center Column - Current Step Sections Builder */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {formData.steps[selectedStepIdx] ? (
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        Step: <span className="text-primary-650">{formData.steps[selectedStepIdx].name}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={addSection}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                      >
                        + Add Section
                      </button>
                    </div>

                    {formData.steps[selectedStepIdx].sections?.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-sm">No sections created in this step yet. Click Add Section to begin.</div>
                    ) : (
                      <div className="space-y-5">
                        {formData.steps[selectedStepIdx].sections?.map((sec, secIdx) => (
                          <div key={secIdx} className="border border-gray-250 bg-slate-50/30 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-700 text-sm uppercase">{sec.name}</h4>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => addCustomFieldToSection(secIdx)}
                                  className="text-xs text-primary-600 hover:text-primary-700 font-bold"
                                >
                                  + Custom Field
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSection(secIdx)}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                                >
                                  Delete Section
                                </button>
                              </div>
                            </div>

                            {/* Section Fields list */}
                            <div className="space-y-2">
                              {sec.fields?.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Drag/Add fields from library or click Custom Field.</p>
                              ) : (
                                sec.fields.map((f, fieldIdx) => (
                                  <div key={fieldIdx} className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg text-xs">
                                    <div className="space-y-0.5">
                                      <p className="font-bold text-gray-800">{f.label}</p>
                                      <p className="text-[10px] text-gray-400 font-mono">ID: {f.name} · Type: {f.type}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeFieldFromSection(secIdx, fieldIdx)}
                                      className="text-red-500 hover:text-red-700 font-bold text-xs"
                                    >
                                      ✕ Remove
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">Select or create a step.</div>
                )}
              </div>

              {/* Right Column - Fields Library Panel */}
              <div className="w-1/4 border-l border-gray-200 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Fields Library (Library)</h4>
                  <p className="text-[11px] text-gray-400 mb-3">Add reusable fields directly to active step section.</p>
                  
                  {formData.steps[selectedStepIdx]?.sections?.length > 0 ? (
                    <div className="space-y-2">
                      {libraryFields.map((f) => (
                        <div key={f.id || f._id} className="p-3 bg-white border border-gray-200 rounded-xl flex flex-col gap-2 hover:border-primary-300 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-gray-800">{f.label}</p>
                              <p className="text-[9px] text-gray-400 font-mono">{f.name}</p>
                            </div>
                            <span className="text-[9px] bg-primary-50 text-primary-650 px-1.5 py-0.5 rounded font-bold uppercase">{f.type}</span>
                          </div>

                          <div className="flex gap-1.5 pt-1.5 border-t border-gray-100 mt-1">
                            <span className="text-[10px] text-gray-500 font-semibold flex-1">Add to:</span>
                            {formData.steps[selectedStepIdx].sections.map((sec, secIdx) => (
                              <button
                                key={secIdx}
                                type="button"
                                onClick={() => addFieldToSection(secIdx, f)}
                                className="px-1.5 py-0.5 bg-primary-600 hover:bg-primary-750 text-white rounded text-[9px] font-bold"
                              >
                                {sec.name.split(" ")[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Create a section first to assign library fields.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 bg-slate-50">
              <Button type="button" onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
              <Button type="button" onClick={handleSubmit} variant="primary" icon={FiSave}>
                Save Template Schema
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

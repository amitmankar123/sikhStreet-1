import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiLayers, FiArrowUp, FiArrowDown, FiGlobe, FiEyeOff } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Button from "../../components/Button";
import {
  getProductTemplates,
  createProductTemplate,
  updateProductTemplate,
  deleteProductTemplate,
  publishProductTemplate,
  unpublishProductTemplate,
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
  const [editingFieldKeys, setEditingFieldKeys] = useState(null);
  const [activeBuilderTab, setActiveBuilderTab] = useState("fields");

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

  const handleCreateArtWorkTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "Art Work Template",
      description: "Template for art prints with size, frame, material, and orientation variants — uses SI unit area pricing",
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
                { name: "artistName", label: "Artist Name", type: "text", required: false },
                { name: "collectionName", label: "Collection Name", type: "text", required: false },
                { name: "description", label: "Description", type: "textarea", required: false }
              ]
            },
            {
              name: "Artwork Characteristics",
              fields: [
                {
                  name: "medium",
                  label: "Medium",
                  type: "dropdown",
                  attributeType: "specification",
                  isVariant: false,
                  affectsPrice: false,
                  required: false,
                  options: ["Oil", "Acrylic", "Watercolor", "Mixed Media", "Charcoal", "Ink", "Digital"]
                },
                {
                  name: "style",
                  label: "Style",
                  type: "dropdown",
                  attributeType: "specification",
                  isVariant: false,
                  affectsPrice: false,
                  required: false,
                  options: ["Abstract", "Modern", "Landscape", "Portrait", "Minimal", "Pop Art", "Contemporary"]
                },
                {
                  name: "orientation",
                  label: "Orientation",
                  type: "dropdown",
                  attributeType: "specification",
                  isVariant: false,
                  affectsPrice: false,
                  required: false,
                  options: ["Portrait", "Landscape", "Square"]
                },
                {
                  name: "yearCreated",
                  label: "Year Created",
                  type: "text",
                  attributeType: "specification",
                  isVariant: false,
                  affectsPrice: false,
                  required: false
                }
              ]
            }
          ]
        },
        {
          name: "Configuration",
          sections: [
            {
              // ── SI Unit — drives the pricing formula ──
              name: "SI Unit",
              fields: [{
                name: "pricingUnit",
                label: "Artwork Size Unit",
                type: "si_unit",
                attributeType: "pricing",
                isVariant: false,
                affectsPrice: true,
                required: true,
                options: [
                  { value: "inches", label: "Inches (in)" },
                  { value: "cm",     label: "Centimeters (cm)" },
                  { value: "feet",   label: "Feet (ft)" },
                  { value: "meter",  label: "Meters (m)" }
                ],
                defaultValue: "inches",
                description: "Unit used to calculate price per area. Formula: W × H × (base + modifier)"
              }]
            },
            {
              name: "Dimensions",
              fields: [{
                name: "size",
                label: "Size",
                type: "dimension",
                attributeType: "variant",
                isVariant: true,
                affectsPrice: true,
                required: true,
                allowMultiple: true,
                vendorCanAddOptions: true,
                // Aligned with DIMENSION_OPTIONS in ArtListingWizard
                options: ["8x10", "12x16", "16x20", "20x30", "24x36", "30x40"],
                placeholder: "Select or enter custom size (e.g. 100x20)"
              }]
            },
            {
              name: "Canvas / Material",
              fields: [{
                name: "canvas_type",
                label: "Canvas / Material",
                type: "dropdown",
                attributeType: "variant",
                isVariant: true,
                affectsPrice: true,
                required: false,
                allowMultiple: true,
                vendorCanAddOptions: true,
                // Aligned with CANVAS_OPTIONS in ArtListingWizard
                options: ["Rolled Canvas", "Stretched Canvas", "Canvas Print", "Fine Art Paper"],
                placeholder: "Select canvas or material"
              }]
            },
            {
              name: "Frame Type",
              fields: [{
                name: "frame_type",
                label: "Frame Type",
                type: "dropdown",
                attributeType: "variant",
                isVariant: true,
                affectsPrice: true,
                required: false,
                allowMultiple: true,
                vendorCanAddOptions: true,
                // Aligned with FRAME_OPTIONS in ArtListingWizard
                options: ["Frameless", "Wooden Frame", "Black Frame", "White Frame", "Oak Frame", "Gold Metal Frame"],
                placeholder: "Select frame type"
              }]
            }
          ]
        }
      ],
      matrixConfig: {
        enabled: true,
        // orientation removed — it's a spec field, not a variant
        allowedAttributes: ["size", "canvas_type", "frame_type"],
        affectsPrice: true,
        affectsSKU: true,
        affectsInventory: false,   // Global inventory only
        affectsShipping: false
      },
      pricingConfig: {
        supportsBasePrice: false,
        supportsVariantPrice: true,
        supportsAttributeAdjustments: true,
        supportsUnitAreaPricing: true,   // ← new flag: tells wizard to use W×H formula
        adjustments: []
      }
    });
    setSelectedStepIdx(0);
    setActiveBuilderTab("fields");
    setShowModal(true);
  };

  const handleOpenEdit = (template) => {
    setEditingTemplate(template);
    let loadedSteps = template.steps || [];
    const isArt = (template.name || "").toLowerCase().includes("art");

    if (isArt) {
      // Ensure SI Unit field exists in steps
      const hasSIUnit = loadedSteps.some(step =>
        step.sections?.some(sec =>
          sec.fields?.some(f => f.name === "pricingUnit" || f.type === "si_unit")
        )
      );
      if (!hasSIUnit) {
        // Find step index for specifications/attributes (usually step 1)
        const targetStepIdx = loadedSteps.length > 1 ? 1 : 0;
        const updatedSteps = JSON.parse(JSON.stringify(loadedSteps));
        const targetStep = updatedSteps[targetStepIdx] || { name: "Art Specifications", sections: [] };

        const siUnitSection = {
          name: "SI Unit & Size Config",
          fields: [
            {
              name: "pricingUnit",
              label: "Size Unit (SI Unit)",
              type: "si_unit",
              attributeType: "pricing",
              isVariant: false,
              affectsPrice: true,
              required: true,
              options: ["inches", "cm", "feet", "meter"],
              defaultValue: "inches",
              description: "Unit used to calculate price per area (Inches, Centimeters, Feet, Meters)"
            }
          ]
        };

        targetStep.sections = [siUnitSection, ...(targetStep.sections || [])];
        updatedSteps[targetStepIdx] = targetStep;
        loadedSteps = updatedSteps;
      }
    }

    setFormData({
      name: template.name || "",
      description: template.description || "",
      supportedProductTypes: template.supportedProductTypes || ["physical"],
      workflowSteps: template.workflowSteps || ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"],
      steps: loadedSteps,
      matrixConfig: template.matrixConfig || { enabled: false, allowedAttributes: [], affectsPrice: true, affectsSKU: true, affectsInventory: true, affectsShipping: true },
      pricingConfig: template.pricingConfig || { supportsBasePrice: true, supportsVariantPrice: true, supportsAttributeAdjustments: false, adjustments: [] }
    });
    setEditingFieldKeys(null);
    setActiveBuilderTab("fields");
    setSelectedStepIdx(0);
    setShowModal(true);
  };

  const handlePublish = async () => {
    if (!editingTemplate) return;
    try {
      await publishProductTemplate(editingTemplate.id || editingTemplate._id);
      toast.success("Template published! Vendors can now use it.");
      setEditingTemplate(prev => ({ ...prev, status: "published" }));
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to publish template.");
    }
  };

  const handleUnpublish = async () => {
    if (!editingTemplate) return;
    try {
      await unpublishProductTemplate(editingTemplate.id || editingTemplate._id);
      toast.success("Template moved back to Draft.");
      setEditingTemplate(prev => ({ ...prev, status: "draft" }));
      loadData();
    } catch (err) {
      toast.error("Failed to unpublish template.");
    }
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
    const newSteps = [...formData.steps, { name: stepName.trim(), enabled: true, required: true, order: formData.steps.length + 1, sections: [] }];
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

  const moveStep = (idx, direction) => {
    const newSteps = [...formData.steps];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= newSteps.length) return;
    [newSteps[idx], newSteps[targetIdx]] = [newSteps[targetIdx], newSteps[idx]];
    setFormData({ ...formData, steps: newSteps });
    setSelectedStepIdx(targetIdx);
  };

  const updateStepProp = (idx, key, val) => {
    const newSteps = [...formData.steps];
    newSteps[idx] = { ...newSteps[idx], [key]: val };
    setFormData({ ...formData, steps: newSteps });
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
      attributeType: field.attributeType || "descriptive",
      isVariant: field.isVariant || false,
      affectsPrice: field.affectsPrice || false,
      allowMultiple: field.allowMultiple || false,
      vendorCanAddOptions: field.vendorCanAddOptions || false,
      placeholder: field.placeholder || "",
      required: !!field.required,
      options: field.options || [],
      helpText: field.helpText || ""
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

  const addSIUnitFieldToSection = (secIdx) => {
    const updatedSteps = [...formData.steps];
    const section = updatedSteps[selectedStepIdx].sections[secIdx];
    if (section.fields.some(f => f.name === "pricingUnit" || f.type === "si_unit")) {
      toast.error("SI Unit field already exists in this section.");
      return;
    }
    section.fields.unshift({
      name: "pricingUnit",
      label: "Size Unit (SI Unit)",
      type: "si_unit",
      attributeType: "pricing",
      isVariant: false,
      affectsPrice: true,
      required: true,
      options: ["inches", "cm", "feet", "meter"],
      defaultValue: "inches",
      description: "Unit used to calculate price per area (Inches, Centimeters, Feet, Meters)"
    });
    setFormData({ ...formData, steps: updatedSteps });
    toast.success("Added SI Unit field to section.");
  };

  const removeFieldFromSection = (secIdx, fieldIdx) => {
    const updatedSteps = [...formData.steps];
    updatedSteps[selectedStepIdx].sections[secIdx].fields.splice(fieldIdx, 1);
    setFormData({ ...formData, steps: updatedSteps });
  };

  // ── Variant / Matrix helpers (used in Tab 2 & 3) ──────────────────────
  const variantFields = [];
  formData.steps?.forEach(step => {
    step.sections?.forEach(section => {
      section.fields?.forEach(field => {
        if (field.isVariant || field.attributeType === "variant" || field.affectsPrice || field.attributeType === "price-affecting") {
          variantFields.push(field);
        }
      });
    });
  });

  const activeAllowedAttributes = variantFields.filter(f => (formData.matrixConfig?.allowedAttributes || []).includes(f.name));

  const generateCartesian = (fieldsList) => {
    if (fieldsList.length === 0) return [];
    let results = [[]];
    fieldsList.forEach(field => {
      const options = field.options || [];
      if (options.length === 0) return;
      const temp = [];
      results.forEach(acc => {
        options.forEach(opt => {
          temp.push([...acc, { fieldName: field.name, fieldLabel: field.label, value: opt }]);
        });
      });
      results = temp;
    });
    return results;
  };

  const combinations = generateCartesian(activeAllowedAttributes);
  // ──────────────────────────────────────────────────────────────────────

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
        <button
          onClick={handleCreateArtWorkTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold text-sm shadow"
        >
          <FiLayers />
          <span>Create Art Work Template</span>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiLayers className="text-primary-650 text-xl" />
                    <h3 className="font-bold text-gray-800 text-lg">{tpl.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    tpl.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {tpl.status === "published" ? "● Published" : "◌ Draft"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{tpl.description || "No description provided."}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tpl.supportedProductTypes?.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-semibold capitalize">{t}</span>
                  ))}
                  <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded font-semibold">{tpl.steps?.length || 0} Steps</span>
                  {tpl.matrixConfig?.enabled && <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-xs rounded font-semibold">Matrix</span>}
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
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {editingTemplate ? editingTemplate.name : "Create Product Template"}
                  </h2>
                  <p className="text-xs text-gray-400">Build steps, sections, and fields for listing products in this layout.</p>
                </div>
                {editingTemplate && (
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                    editingTemplate.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {editingTemplate.status === "published" ? "● Published" : "◌ Draft"}
                  </span>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 p-1">
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
                      <div key={idx} className={`rounded-lg border text-xs transition-all ${
                        selectedStepIdx === idx
                          ? "bg-primary-600 border-primary-600 shadow-sm"
                          : step.enabled === false
                          ? "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-white border-gray-200"
                      }`}>
                        {/* Step row — clickable to select */}
                        <div
                          onClick={() => setSelectedStepIdx(idx)}
                          className="flex items-center justify-between p-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`font-bold truncate ${ selectedStepIdx === idx ? "text-white" : "text-gray-700" }`}>
                              {idx + 1}. {step.name}
                            </span>
                            {step.required !== false && (
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${selectedStepIdx === idx ? "bg-white/20 text-white" : "bg-red-50 text-red-500"}`}>REQ</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                              className={`p-0.5 rounded disabled:opacity-30 ${ selectedStepIdx === idx ? "text-white hover:bg-white/20" : "text-gray-400 hover:text-gray-600" }`}>
                              <FiArrowUp size={11} />
                            </button>
                            <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === formData.steps.length - 1}
                              className={`p-0.5 rounded disabled:opacity-30 ${ selectedStepIdx === idx ? "text-white hover:bg-white/20" : "text-gray-400 hover:text-gray-600" }`}>
                              <FiArrowDown size={11} />
                            </button>
                            {formData.steps.length > 1 && (
                              <button type="button" onClick={() => removeStep(idx)}
                                className={`p-0.5 rounded ${ selectedStepIdx === idx ? "text-white hover:bg-white/20" : "text-red-400 hover:text-red-600" }`}>
                                <FiX size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Step sub-controls */}
                        <div className={`flex items-center gap-3 px-2 pb-1.5 border-t ${ selectedStepIdx === idx ? "border-white/20" : "border-gray-100" }`}
                          onClick={e => e.stopPropagation()}>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={step.enabled !== false}
                              onChange={e => updateStepProp(idx, "enabled", e.target.checked)}
                              className="w-3 h-3 rounded" />
                            <span className={`text-[9px] font-semibold ${ selectedStepIdx === idx ? "text-white/80" : "text-gray-500" }`}>Enabled</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={step.required !== false}
                              onChange={e => updateStepProp(idx, "required", e.target.checked)}
                              className="w-3 h-3 rounded" />
                            <span className={`text-[9px] font-semibold ${ selectedStepIdx === idx ? "text-white/80" : "text-gray-500" }`}>Required</span>
                          </label>
                        </div>
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

              {/* Center Column - Tabbed Builder */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tab Bar */}
                <div className="flex border-b border-gray-200 px-6 pt-4 gap-1 shrink-0 bg-white">
                  {[
                    { key: "fields", label: "1. Form Fields" },
                    { key: "matrix", label: "2. Variant Matrix" },
                    { key: "pricing", label: "3. Pricing Rules" }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveBuilderTab(key)}
                      className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
                        activeBuilderTab === key
                          ? "border-primary-600 text-primary-650 bg-primary-50"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                  {/* ── TAB 1: Form Fields Builder ── */}
                  {activeBuilderTab === "fields" && (
                    formData.steps[selectedStepIdx] ? (
                      <div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                          <h3 className="text-base font-bold text-gray-800">
                            Step: <span className="text-primary-650">{formData.steps[selectedStepIdx].name}</span>
                          </h3>
                          <button type="button" onClick={addSection} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">+ Add Section</button>
                        </div>

                        {formData.steps[selectedStepIdx].sections?.length === 0 ? (
                          <div className="text-center py-12 text-gray-400 text-sm">No sections yet. Click Add Section to begin.</div>
                        ) : (
                          <div className="space-y-5">
                            {formData.steps[selectedStepIdx].sections?.map((sec, secIdx) => (
                              <div key={secIdx} className="border border-gray-200 bg-slate-50/30 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-gray-700 text-sm uppercase">{sec.name}</h4>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => addSIUnitFieldToSection(secIdx)} className="text-xs text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">+ Add SI Unit</button>
                                    <button type="button" onClick={() => addCustomFieldToSection(secIdx)} className="text-xs text-primary-600 hover:text-primary-700 font-bold">+ Custom Field</button>
                                    <button type="button" onClick={() => removeSection(secIdx)} className="text-xs text-red-500 hover:text-red-700 font-bold">Delete Section</button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {sec.fields?.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">Add fields from library or click Custom Field.</p>
                                  ) : (
                                    sec.fields.map((f, fieldIdx) => {
                                      const isEditing = editingFieldKeys?.secIdx === secIdx && editingFieldKeys?.fieldIdx === fieldIdx;
                                      const updateField = (key, val) => {
                                        const s = [...formData.steps];
                                        s[selectedStepIdx].sections[secIdx].fields[fieldIdx][key] = val;
                                        setFormData({ ...formData, steps: s });
                                      };
                                      return (
                                        <div key={fieldIdx} className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
                                          <div className="flex items-center justify-between p-3 bg-gray-50/60 text-xs">
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="font-bold text-gray-800">{f.label}</p>
                                                {f.isVariant && <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-[9px] text-amber-700 font-bold rounded">Variant</span>}
                                                {f.affectsPrice && <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-700 font-bold rounded">Affects Price</span>}
                                                {f.required && <span className="px-1.5 py-0.5 bg-red-50 border border-red-200 text-[9px] text-red-600 font-bold rounded">Required</span>}
                                                {f.vendorCanAddOptions && <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-[9px] text-blue-600 font-bold rounded">Vendor Adds</span>}
                                              </div>
                                              <p className="text-[10px] text-gray-400 font-mono">ID: {f.name} · Type: {f.type} · Class: {f.attributeType || "descriptive"}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button type="button" onClick={() => setEditingFieldKeys(isEditing ? null : { secIdx, fieldIdx })} className="text-primary-600 hover:text-primary-800 font-bold text-[11px]">{isEditing ? "Done" : "Configure"}</button>
                                              <button type="button" onClick={() => removeFieldFromSection(secIdx, fieldIdx)} className="text-red-500 hover:text-red-700 font-bold text-[11px]">Remove</button>
                                            </div>
                                          </div>

                                          {isEditing && (
                                            <div className="p-3 border-t border-gray-150 bg-white space-y-3 text-xs">
                                              {/* Row 1: Label + Type */}
                                              <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Field Label</label>
                                                  <input type="text" value={f.label} onChange={e => updateField("label", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500" />
                                                </div>
                                                <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Field Type</label>
                                                  <select value={f.type} onChange={e => updateField("type", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-primary-500">
                                                    <option value="text">Text Input</option>
                                                    <option value="textarea">Textarea</option>
                                                    <option value="number">Number</option>
                                                    <option value="dropdown">Dropdown Select</option>
                                                    <option value="radio">Radio Group</option>
                                                    <option value="checkbox">Checkbox</option>
                                                    <option value="multi_select">Multi-Select</option>
                                                    <option value="dimension">Dimension (A×B with Unit)</option>
                                                    <option value="si_unit">📐 SI Unit Selector (inches/cm/ft/m)</option>
                                                  </select>
                                                </div>
                                              </div>

                                              {/* Row 2: Attribute Class */}
                                              <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Attribute Class</label>
                                                <select
                                                  value={f.attributeType || "descriptive"}
                                                  onChange={e => {
                                                    const val = e.target.value;
                                                    const s = [...formData.steps];
                                                    const fld = s[selectedStepIdx].sections[secIdx].fields[fieldIdx];
                                                    fld.attributeType = val;
                                                    fld.isVariant = val === "variant";
                                                    fld.affectsPrice = val === "variant" || val === "price-affecting";
                                                    setFormData({ ...formData, steps: s });
                                                  }}
                                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-primary-500"
                                                >
                                                  <option value="descriptive">Descriptive — info only, no variant impact</option>
                                                  <option value="specification">Specification — product metadata</option>
                                                  <option value="variant">Variant Attribute — generates combinations</option>
                                                  <option value="price-affecting">Price-Affecting — adjusts price per option</option>
                                                  <option value="pricing">Pricing Config — drives pricing formula</option>
                                                </select>
                                              </div>

                                              {/* Row 3: Placeholder + Help Text */}
                                              <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Placeholder</label>
                                                  <input type="text" value={f.placeholder || ""} onChange={e => updateField("placeholder", e.target.value)} placeholder="e.g. Enter size..." className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500" />
                                                </div>
                                                <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Help Text</label>
                                                  <input type="text" value={f.helpText || ""} onChange={e => updateField("helpText", e.target.value)} placeholder="Tooltip shown below the field..." className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500" />
                                                </div>
                                              </div>

                                              {/* Row 4: Options (if applicable) */}
                                              {f.type === "si_unit" && (
                                                <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SI Unit Options (Fixed)</label>
                                                  <div className="flex gap-2 flex-wrap mt-1">
                                                    {["inches (in)", "cm", "feet (ft)", "meter (m)"].map(u => (
                                                      <span key={u} className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-full">{u}</span>
                                                    ))}
                                                  </div>
                                                  <p className="text-[10px] text-gray-400 mt-1">These options are fixed and drive the area pricing formula.</p>
                                                </div>
                                              )}
                                              {(f.type === "dropdown" || f.type === "radio" || f.type === "multi_select" || f.type === "dimension") && (
                                                <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Options (comma-separated)</label>
                                                  <input
                                                    type="text"
                                                    value={Array.isArray(f.options) && f.options.length > 0 && typeof f.options[0] === 'object'
                                                      ? f.options.map(o => o.label || o.value).join(", ")
                                                      : f.options?.join(", ") || ""}
                                                    onChange={e => updateField("options", e.target.value.split(",").map(o => o.trim()).filter(Boolean))}
                                                    placeholder="e.g. No Frame, Wooden Frame, Premium Frame"
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500"
                                                  />
                                                </div>
                                              )}

                                              {/* Row 5: Checkboxes */}
                                              <div className="flex flex-wrap gap-4 pt-1.5 border-t border-gray-100">
                                                {[
                                                  { key: "isVariant", label: "Is Variant" },
                                                  { key: "affectsPrice", label: "Affects Price" },
                                                  { key: "required", label: "Required" },
                                                  { key: "allowMultiple", label: "Allow Multiple" }
                                                ].map(({ key, label }) => (
                                                  <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="checkbox" checked={!!f[key]} onChange={e => updateField(key, e.target.checked)} className="w-3.5 h-3.5 rounded text-primary-650 border-gray-300" />
                                                    <span className="text-[10px] font-semibold text-gray-600">{label}</span>
                                                  </label>
                                                ))}
                                                {(f.type === "dropdown" || f.type === "radio" || f.type === "multi_select" || f.type === "dimension") && (
                                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="checkbox" checked={!!f.vendorCanAddOptions} onChange={e => updateField("vendorCanAddOptions", e.target.checked)} className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300" />
                                                    <span className="text-[10px] font-semibold text-blue-700">Vendor Can Add Own Values</span>
                                                  </label>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">Select or create a step.</div>
                    )
                  )}

                  {/* ── TAB 2: Variant Matrix Config ── */}
                  {activeBuilderTab === "matrix" && (
                    <div className="space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-base font-bold text-gray-800">Variant Matrix Builder</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Configure which attribute combinations define product variants.</p>
                      </div>

                      <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!formData.matrixConfig?.enabled}
                            onChange={e => setFormData({ ...formData, matrixConfig: { ...(formData.matrixConfig || {}), enabled: e.target.checked } })}
                            className="w-4 h-4 rounded text-primary-650 border-gray-300"
                          />
                          <div>
                            <span className="text-sm font-bold text-gray-700">Enable Variant Pricing Matrix</span>
                            <p className="text-xs text-gray-400">Generate multi-attribute variant matrix for vendors using this template.</p>
                          </div>
                        </label>

                        {formData.matrixConfig?.enabled && (
                          <div className="space-y-4 pt-3 border-t border-gray-200">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Participating Variant Attributes</label>
                              {variantFields.filter(f => f.isVariant).length === 0 ? (
                                <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-200 font-semibold">
                                  ⚠ No variant fields defined yet. Go to Form Fields tab → Configure a field → set Attribute Class to "Variant Attribute".
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {variantFields.filter(f => f.isVariant).map(f => {
                                    const checked = (formData.matrixConfig?.allowedAttributes || []).includes(f.name);
                                    return (
                                      <button
                                        key={f.name}
                                        type="button"
                                        onClick={() => {
                                          const curr = formData.matrixConfig?.allowedAttributes || [];
                                          const next = curr.includes(f.name) ? curr.filter(n => n !== f.name) : [...curr, f.name];
                                          setFormData({ ...formData, matrixConfig: { ...(formData.matrixConfig || {}), allowedAttributes: next } });
                                        }}
                                        className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${checked ? "bg-primary-600 border-primary-600 text-white" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-250"}`}
                                      >
                                        {f.label} ({f.options?.length || 0} opts) {f.vendorCanAddOptions ? "📝" : ""}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { key: "affectsPrice", label: "Affects Price" },
                                { key: "affectsSKU", label: "Affects SKU" },
                                { key: "affectsInventory", label: "Affects Inventory" },
                                { key: "affectsShipping", label: "Affects Shipping" }
                              ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-gray-200">
                                  <input
                                    type="checkbox"
                                    checked={!!formData.matrixConfig?.[key]}
                                    onChange={e => setFormData({ ...formData, matrixConfig: { ...(formData.matrixConfig || {}), [key]: e.target.checked } })}
                                    className="w-3.5 h-3.5 text-primary-650 rounded border-gray-300"
                                  />
                                  <span className="text-xs font-semibold text-gray-600">{label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {formData.matrixConfig?.enabled && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-gray-700">Combinations Preview ({combinations.length})</h4>
                          {combinations.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No combinations yet. Select variant attributes with options above.</p>
                          ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                                    {activeAllowedAttributes.map(f => <th key={f.name} className="p-3">{f.label}</th>)}
                                    {formData.matrixConfig?.affectsPrice && <th className="p-3">Price</th>}
                                    {formData.matrixConfig?.affectsSKU && <th className="p-3">SKU Suffix</th>}
                                    {formData.matrixConfig?.affectsInventory && <th className="p-3">Inventory</th>}
                                    {formData.matrixConfig?.affectsShipping && <th className="p-3">Shipping</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {combinations.slice(0, 10).map((comb, cIdx) => (
                                    <tr key={cIdx} className="hover:bg-slate-50">
                                      {comb.map((item, i) => <td key={i} className="p-3 font-medium text-gray-700">{item.value}</td>)}
                                      {formData.matrixConfig?.affectsPrice && <td className="p-3 text-gray-400 text-[10px] font-mono">Vendor fills ₹</td>}
                                      {formData.matrixConfig?.affectsSKU && <td className="p-3 text-gray-400 text-[10px] font-mono uppercase">{comb.map(c => c.value.substring(0, 3).replace(/\s+/g, '')).join('-')}</td>}
                                      {formData.matrixConfig?.affectsInventory && <td className="p-3 text-gray-400 text-[10px] font-mono">Per variant</td>}
                                      {formData.matrixConfig?.affectsShipping && <td className="p-3 text-gray-400 text-[10px] font-mono">Override allowed</td>}
                                    </tr>
                                  ))}
                                  {combinations.length > 10 && (
                                    <tr><td colSpan={10} className="p-2.5 bg-slate-50 text-center text-[10px] text-gray-400 italic">Showing 10 of {combinations.length} combinations</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB 3: Pricing Rules ── */}
                  {activeBuilderTab === "pricing" && (
                    <div className="space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-base font-bold text-gray-800">Pricing Rule Configuration</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Define which pricing features vendors can use with this template.</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { key: "supportsBasePrice", label: "Base Price", desc: "Vendors set a starting price for the product." },
                            { key: "supportsVariantPrice", label: "Variant-Specific Price", desc: "Override price per combination row." },
                            { key: "supportsAttributeAdjustments", label: "Attribute Adjustments", desc: "Apply +Amount or +% per option (e.g. Wood Frame +500)." }
                          ].map(({ key, label, desc }) => (
                            <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-150 hover:bg-slate-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={!!formData.pricingConfig?.[key]}
                                onChange={e => setFormData({ ...formData, pricingConfig: { ...(formData.pricingConfig || {}), [key]: e.target.checked } })}
                                className="w-4 h-4 rounded text-primary-650 border-gray-300 mt-0.5"
                              />
                              <div>
                                <span className="text-xs font-bold text-gray-700 block">{label}</span>
                                <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>

                        {formData.pricingConfig?.supportsAttributeAdjustments && (
                          <div className="space-y-3 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Price Adjustment Rules</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  const adjs = [...(formData.pricingConfig?.adjustments || [])];
                                  adjs.push({ attributeName: variantFields[0]?.name || "", optionValue: variantFields[0]?.options?.[0] || "", adjustmentType: "fixed", adjustmentValue: 0 });
                                  setFormData({ ...formData, pricingConfig: { ...(formData.pricingConfig || {}), adjustments: adjs } });
                                }}
                                className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-bold"
                              >
                                + Add Rule
                              </button>
                            </div>

                            {variantFields.length === 0 ? (
                              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-200 font-semibold">⚠ No variant/price-affecting fields found. Define them in Form Fields first.</p>
                            ) : (formData.pricingConfig?.adjustments || []).length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No rules yet. Click Add Rule above.</p>
                            ) : (
                              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                {formData.pricingConfig.adjustments.map((adj, aIdx) => {
                                  const matchField = variantFields.find(f => f.name === adj.attributeName) || variantFields[0];
                                  return (
                                    <div key={aIdx} className="flex flex-wrap sm:flex-nowrap items-end gap-2 p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs">
                                      <div className="flex-1 min-w-[120px]">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Attribute</label>
                                        <select value={adj.attributeName} onChange={e => {
                                          const next = [...formData.pricingConfig.adjustments];
                                          const nf = variantFields.find(f => f.name === e.target.value);
                                          next[aIdx] = { ...next[aIdx], attributeName: e.target.value, optionValue: nf?.options?.[0] || "" };
                                          setFormData({ ...formData, pricingConfig: { ...formData.pricingConfig, adjustments: next } });
                                        }} className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                                          {variantFields.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                                        </select>
                                      </div>
                                      <div className="flex-1 min-w-[100px]">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Option</label>
                                        <select value={adj.optionValue} onChange={e => {
                                          const next = [...formData.pricingConfig.adjustments];
                                          next[aIdx].optionValue = e.target.value;
                                          setFormData({ ...formData, pricingConfig: { ...formData.pricingConfig, adjustments: next } });
                                        }} className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                                          {(matchField?.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                      </div>
                                      <div className="w-20">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Type</label>
                                        <select value={adj.adjustmentType} onChange={e => {
                                          const next = [...formData.pricingConfig.adjustments];
                                          next[aIdx].adjustmentType = e.target.value;
                                          setFormData({ ...formData, pricingConfig: { ...formData.pricingConfig, adjustments: next } });
                                        }} className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                                          <option value="fixed">Fixed ₹</option>
                                          <option value="percentage">% Off</option>
                                        </select>
                                      </div>
                                      <div className="w-24">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Value</label>
                                        <input type="number" value={adj.adjustmentValue} onChange={e => {
                                          const next = [...formData.pricingConfig.adjustments];
                                          next[aIdx].adjustmentValue = Number(e.target.value) || 0;
                                          setFormData({ ...formData, pricingConfig: { ...formData.pricingConfig, adjustments: next } });
                                        }} className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs" />
                                      </div>
                                      <button type="button" onClick={() => {
                                        const next = formData.pricingConfig.adjustments.filter((_, i) => i !== aIdx);
                                        setFormData({ ...formData, pricingConfig: { ...formData.pricingConfig, adjustments: next } });
                                      }} className="text-red-500 hover:text-red-700 font-bold text-[11px] pb-1">Delete</button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
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
            <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2">
                {editingTemplate && editingTemplate.status !== "published" && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <FiGlobe size={13} /> Publish Template
                  </button>
                )}
                {editingTemplate && editingTemplate.status === "published" && (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <FiEyeOff size={13} /> Move to Draft
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
                <Button type="button" onClick={handleSubmit} variant="primary" icon={FiSave}>
                  Save Draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

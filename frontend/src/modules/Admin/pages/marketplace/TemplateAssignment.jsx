import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiSave, FiX, FiLayers, FiList, FiPlusCircle, FiLink } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Button from "../../components/Button";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import {
  getProductTemplates,
  getAdditionalFields,
  updateCategory
} from "../../services/adminService";

export default function TemplateAssignment() {
  const { categories, initialize: initCategories } = useCategoryStore();
  const [templates, setTemplates] = useState([]);
  const [libraryFields, setLibraryFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Assignment Form State
  const [assignedTemplateId, setAssignedTemplateId] = useState("");
  const [categoryFields, setCategoryFields] = useState([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await initCategories();
      const [resTemplates, resFields] = await Promise.all([
        getProductTemplates(),
        getAdditionalFields()
      ]);
      setTemplates(resTemplates.data || []);
      setLibraryFields(resFields.data || []);
    } catch (error) {
      toast.error("Failed to load templates or custom fields.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const getInheritedTemplate = (parentId) => {
    let currentId = parentId;
    const visited = new Set();
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const cat = categories.find(c => String(c.id || c._id) === String(currentId));
      if (!cat) break;
      if (cat.assignedTemplateId) {
        const tpl = templates.find((t) => String(t.id || t._id) === String(cat.assignedTemplateId));
        return { template: tpl, categoryName: cat.name };
      }
      currentId = getParentId(cat);
    }
    return null;
  };

  const handleOpenAssign = (cat) => {
    setSelectedCategory(cat);
    setAssignedTemplateId(cat.assignedTemplateId || "");
    setCategoryFields(Array.isArray(cat.additionalFields) ? [...cat.additionalFields] : []);
    setShowModal(true);
  };

  const addFieldFromLibrary = (field) => {
    if (categoryFields.some((f) => f.name === field.name)) {
      toast.error("This field is already added to this category.");
      return;
    }
    setCategoryFields([
      ...categoryFields,
      {
        name: field.name,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || "",
        required: !!field.required,
        options: field.options || []
      }
    ]);
    toast.success(`Attached field "${field.label}"`);
  };

  const removeCategoryField = (idx) => {
    setCategoryFields(categoryFields.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedCategory) return;
    const categoryId = selectedCategory.id || selectedCategory._id;

    try {
      await updateCategory(categoryId, {
        assignedTemplateId: assignedTemplateId || null,
        additionalFields: categoryFields
      });
      toast.success("Assignments updated successfully.");
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error("Failed to update assignments.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Template Assignment</h1>
        <p className="text-sm text-gray-500">
          Assign layout templates and attach category-specific overrides (Module 6) to categories.
        </p>
      </div>

      {/* Categories Table View */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading categories data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Assigned Template</th>
                  <th className="p-4">Inherited Template</th>
                  <th className="p-4">Custom Fields Attached</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
                {categories
                  .sort((a, b) => getCategoryDepth(a) - getCategoryDepth(b))
                  .map((cat) => {
                    const depth = getCategoryDepth(cat);
                    const directTpl = cat.assignedTemplateId
                      ? templates.find((t) => String(t.id || t._id) === String(cat.assignedTemplateId))
                      : null;
                    const parentId = getParentId(cat);
                    const inherited = !directTpl && parentId ? getInheritedTemplate(parentId) : null;

                    return (
                      <tr key={cat.id || cat._id} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {depth > 1 && (
                              <span className="text-gray-300 font-mono text-xs">
                                {"—".repeat(depth - 1)}
                              </span>
                            )}
                            <span className="font-semibold text-gray-900">{cat.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold">
                            Level {depth}
                          </span>
                        </td>
                        <td className="p-4">
                          {directTpl ? (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-750 font-bold flex items-center gap-1.5 w-fit">
                              <FiLayers /> {directTpl.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {inherited ? (
                            <span className="text-xs text-gray-500 italic flex items-center gap-1">
                              <FiLink className="text-[10px]" /> {inherited.template?.name}{" "}
                              <span className="text-[10px] text-gray-400">(via {inherited.categoryName})</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-650 rounded-full">
                            {cat.additionalFields?.length || 0} Fields
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            onClick={() => handleOpenAssign(cat)}
                            variant="primary"
                            size="sm"
                            icon={FiEdit}
                          >
                            Assign / Configure
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Assign Template & Custom Fields: <span className="text-primary-650">{selectedCategory.name}</span>
                </h2>
                <p className="text-xs text-gray-400">Configure template inheritance and add overrides specifically for this category.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Split Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Template Selection & Attached Fields */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Assign Product Template</label>
                  <select
                    value={assignedTemplateId}
                    onChange={(e) => setAssignedTemplateId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Inherited or Default Listing Form --</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id || tpl._id} value={tpl.id || tpl._id}>{tpl.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    If left blank, this category will inherit templates from its parent category chain.
                  </p>
                </div>

                {/* Additional Attached Fields */}
                <div className="border-t border-gray-150 pt-5 space-y-3">
                  <h4 className="font-bold text-gray-800 text-sm uppercase">Category Custom Specification Fields (Module 6)</h4>
                  <p className="text-xs text-gray-400">These fields are merged into the template for products in this category.</p>
                  
                  <div className="space-y-2">
                    {categoryFields.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-xs italic bg-slate-50 border border-dashed rounded-lg">
                        No custom fields attached. Add fields from the registry panel on the right.
                      </div>
                    ) : (
                      categoryFields.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/20 border border-indigo-150 rounded-xl text-xs">
                          <div>
                            <p className="font-bold text-gray-800">{f.label}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {f.name} · Type: {f.type} {f.required && "· Mandatory"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCategoryField(idx)}
                            className="text-red-500 hover:text-red-750 font-bold"
                          >
                            ✕ Detach
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Library Selector */}
              <div className="w-1/3 border-l border-gray-200 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Fields Registry Library</h4>
                  <p className="text-[10px] text-gray-400 mb-3">Attach fields from the central repository library to this category.</p>
                  
                  <div className="space-y-2">
                    {libraryFields.map((f) => (
                      <div key={f.id || f._id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between hover:border-indigo-350 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{f.label}</p>
                          <p className="text-[9px] text-gray-400 font-mono">{f.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addFieldFromLibrary(f)}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold"
                        >
                          + Attach
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 bg-slate-50">
              <Button type="button" onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
              <Button type="button" onClick={handleSave} variant="primary" icon={FiSave}>
                Save Assignments
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

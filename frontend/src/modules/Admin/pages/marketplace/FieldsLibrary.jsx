import React, { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiSave, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Button from "../../components/Button";
import {
  getAdditionalFields,
  createAdditionalField,
  updateAdditionalField,
  deleteAdditionalField
} from "../../services/adminService";

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "rich_text", label: "Rich Text Editor" },
  { value: "number", label: "Number Input" },
  { value: "decimal", label: "Decimal Input" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date Picker" },
  { value: "time", label: "Time Picker" },
  { value: "checkbox", label: "Checkbox Group" },
  { value: "radio", label: "Radio Button Group" },
  { value: "toggle", label: "Toggle Switch" },
  { value: "dropdown", label: "Dropdown Select" },
  { value: "multi_select", label: "Multi-Select Dropdown" },
  { value: "image_upload", label: "Image Upload" },
  { value: "video_upload", label: "Video Upload" },
  { value: "document_upload", label: "Document Upload" },
  { value: "color_picker", label: "Color Picker" },
  { value: "dimension", label: "Dimensions Input" },
  { value: "weight", label: "Weight Input" },
  { value: "sku", label: "SKU field" },
  { value: "barcode", label: "Barcode field" },
  { value: "url", label: "URL Input" },
  { value: "email", label: "Email Input" },
  { value: "phone", label: "Phone Input" }
];

export default function FieldsLibrary() {
  const [fields, setFields] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    type: "text",
    placeholder: "",
    helpText: "",
    required: false,
    options: "",
    displayOrder: 0,
    isPricingAxis: false,
    pricingAxisLabel: ""
  });

  const loadFields = async () => {
    setIsLoading(true);
    try {
      const response = await getAdditionalFields();
      setFields(response.data || []);
    } catch (error) {
      toast.error("Failed to load fields library.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleOpenCreate = () => {
    setEditingField(null);
    setFormData({
      name: "",
      label: "",
      type: "text",
      placeholder: "",
      helpText: "",
      required: false,
      options: "",
      displayOrder: 0,
      isPricingAxis: false,
      pricingAxisLabel: ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (field) => {
    setEditingField(field);
    setFormData({
      name: field.name || "",
      label: field.label || "",
      type: field.type || "text",
      placeholder: field.placeholder || "",
      helpText: field.helpText || "",
      required: !!field.required,
      options: Array.isArray(field.options) ? field.options.join(", ") : "",
      displayOrder: field.displayOrder || 0,
      isPricingAxis: !!field.isPricingAxis,
      pricingAxisLabel: field.pricingAxisLabel || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this library field? It will be removed from all future category listings.")) {
      try {
        await deleteAdditionalField(id);
        toast.success("Field deleted from library.");
        loadFields();
      } catch (error) {
        toast.error("Failed to delete field.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Field ID (Name) is required.");
      return;
    }
    if (!formData.label.trim()) {
      toast.error("Label is required.");
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim().toLowerCase().replace(/\s+/g, "_"),
      label: formData.label.trim(),
      options: formData.options
        ? formData.options.split(",").map((opt) => opt.trim()).filter(Boolean)
        : []
    };

    try {
      if (editingField) {
        await updateAdditionalField(editingField.id || editingField._id, payload);
        toast.success("Field updated successfully.");
      } else {
        await createAdditionalField(payload);
        toast.success("Field created successfully.");
      }
      setShowModal(false);
      loadFields();
    } catch (error) {
      const msg = error.response?.data?.message || "Operation failed.";
      toast.error(msg);
    }
  };

  const filteredFields = fields.filter((f) =>
    f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Additional Fields Library</h1>
          <p className="text-sm text-gray-500">Manage reusable custom attributes configuration in the central repository.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold text-sm shadow"
        >
          <FiPlus />
          <span>Create New Field</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
        <FiSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Search fields library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none text-gray-700"
        />
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading fields library...</div>
        ) : filteredFields.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No custom fields created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-4">Label</th>
                  <th className="p-4">Field ID (Name)</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Options</th>
                  <th className="p-4 text-center">Required</th>
                  <th className="p-4 text-center">Pricing Axis</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
                {filteredFields.map((field) => (
                  <tr key={field.id || field._id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{field.label}</td>
                    <td className="p-4 font-mono text-xs">{field.name}</td>
                    <td className="p-4 uppercase text-xs font-bold text-primary-650 bg-primary-50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
                    </td>
                    <td className="p-4 max-w-xs truncate text-gray-500">
                      {Array.isArray(field.options) && field.options.length > 0 ? field.options.join(", ") : "-"}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${field.required ? "bg-red-50 text-red-650" : "bg-gray-100 text-gray-505"}`}>
                        {field.required ? "YES" : "NO"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {field.isPricingAxis ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ₹ AXIS
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => handleOpenEdit(field)} variant="iconBlue" icon={FiEdit} title="Edit Field" />
                        <Button onClick={() => handleDelete(field.id || field._id)} variant="iconRed" icon={FiTrash2} title="Delete Field" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingField ? "Edit Library Field" : "Create Reusable Field"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Field Label *</label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g. Century"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Field ID (Name) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingField}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. century"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Field Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {["dropdown", "multi_select", "checkbox", "radio"].includes(formData.type) && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Options (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="e.g. Option 1, Option 2, Option 3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Placeholder</label>
                  <input
                    type="text"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    placeholder="Field placeholder text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Help Text / Description</label>
                <input
                  type="text"
                  value={formData.helpText}
                  onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                  placeholder="Appears underneath the input"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-bold text-gray-700">Make this field mandatory (Required)</span>
                </label>

                {/* Pricing Axis toggle — only shown for option-based fields */}
                {["dropdown", "multi_select", "checkbox", "radio"].includes(formData.type) && (
                  <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/60 space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.isPricingAxis}
                        onChange={(e) => setFormData({ ...formData, isPricingAxis: e.target.checked, pricingAxisLabel: e.target.checked ? formData.pricingAxisLabel : "" })}
                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-sm font-bold text-amber-800">This field drives variant pricing</span>
                        <p className="text-xs text-amber-600 mt-0.5">Vendor will set a separate price &amp; stock for each option (e.g. Hardcover ₹499, Paperback ₹299)</p>
                      </div>
                    </label>
                    {formData.isPricingAxis && (
                      <div>
                        <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Pricing Matrix Label</label>
                        <input
                          type="text"
                          value={formData.pricingAxisLabel}
                          onChange={(e) => setFormData({ ...formData, pricingAxisLabel: e.target.value })}
                          placeholder="e.g. Select formats and set price per format"
                          className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
                <Button type="submit" variant="primary" icon={FiSave}>
                  {editingField ? "Update Field" : "Save to Library"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

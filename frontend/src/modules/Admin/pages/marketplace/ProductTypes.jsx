import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiCheckSquare } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Button from "../../components/Button";
import {
  getProductTypes,
  createProductType,
  updateProductType,
  deleteProductType
} from "../../services/adminService";

export default function ProductTypes() {
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    controls: {
      inventory: false,
      shipping: false,
      downloads: false,
      licensing: false,
      media: true,
      variants: false
    }
  });

  const loadTypes = async () => {
    setIsLoading(true);
    try {
      const response = await getProductTypes();
      setTypes(response.data || []);
    } catch (error) {
      toast.error("Failed to load product types.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormData({
      name: "",
      label: "",
      controls: {
        inventory: false,
        shipping: false,
        downloads: false,
        licensing: false,
        media: true,
        variants: false
      }
    });
    setShowModal(true);
  };

  const handleOpenEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || "",
      label: type.label || "",
      controls: type.controls || {
        inventory: false,
        shipping: false,
        downloads: false,
        licensing: false,
        media: true,
        variants: false
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product type? It cannot be undone.")) {
      try {
        await deleteProductType(id);
        toast.success("Product type deleted.");
        loadTypes();
      } catch (error) {
        toast.error("Failed to delete product type.");
      }
    }
  };

  const toggleControl = (key) => {
    setFormData({
      ...formData,
      controls: {
        ...formData.controls,
        [key]: !formData.controls[key]
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product type identifier (Name) is required.");
      return;
    }
    if (!formData.label.trim()) {
      toast.error("Product type Label is required.");
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim().toLowerCase().replace(/\s+/g, "_")
    };

    try {
      if (editingType) {
        await updateProductType(editingType.id || editingType._id, payload);
        toast.success("Product type updated successfully.");
      } else {
        await createProductType(payload);
        toast.success("Product type created successfully.");
      }
      setShowModal(false);
      loadTypes();
    } catch (error) {
      const msg = error.response?.data?.message || "Operation failed.";
      toast.error(msg);
    }
  };

  // Seed default product types if library is empty
  const seedDefaults = async () => {
    const defaults = [
      {
        name: "physical",
        label: "Physical Product",
        controls: { inventory: true, shipping: true, downloads: false, licensing: false, media: true, variants: true }
      },
      {
        name: "digital",
        label: "Digital Product",
        controls: { inventory: false, shipping: false, downloads: true, licensing: true, media: true, variants: false }
      },
      {
        name: "both",
        label: "Both (Bundles)",
        controls: { inventory: true, shipping: true, downloads: true, licensing: true, media: true, variants: true }
      }
    ];

    try {
      for (const item of defaults) {
        if (!types.some((t) => t.name === item.name)) {
          await createProductType(item);
        }
      }
      toast.success("Default product types seeded.");
      loadTypes();
    } catch (err) {
      // Catch duplicate keys or other errors silently
      loadTypes();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Types Configuration</h1>
          <p className="text-sm text-gray-500">Configure marketplace behavior controls dynamically for product listing categories.</p>
        </div>
        <div className="flex gap-2">
          {types.length === 0 && (
            <button
              onClick={seedDefaults}
              className="px-4 py-2 border border-primary-500 text-primary-650 rounded-lg font-semibold text-sm hover:bg-primary-50 transition-colors"
            >
              Seed Default Types
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold text-sm shadow"
          >
            <FiPlus />
            <span>Create Product Type</span>
          </button>
        </div>
      </div>

      {/* Grid Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 col-span-full">Loading product types...</div>
        ) : types.length === 0 ? (
          <div className="text-center py-12 text-gray-500 col-span-full">
            No custom product types configured. Click Seed Default Types to import initial settings.
          </div>
        ) : (
          types.map((type) => (
            <div key={type.id || type._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-gray-150 pb-2">
                  <h3 className="font-bold text-gray-800 text-lg">{type.label}</h3>
                  <span className="font-mono text-xs text-gray-400">ID: {type.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-650">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type.controls?.inventory ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>Inventory Tracking: {type.controls?.inventory ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type.controls?.shipping ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>Shipping Setup: {type.controls?.shipping ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type.controls?.downloads ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>Downloads: {type.controls?.downloads ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type.controls?.licensing ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>Licensing Info: {type.controls?.licensing ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type.controls?.media ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>Media Uploads: {type.controls?.media ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type.controls?.variants ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>Variants/Pricing: {type.controls?.variants ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-5">
                <Button onClick={() => handleOpenEdit(type)} variant="secondary" size="sm" icon={FiEdit}>Edit</Button>
                {/* Prevent deleting base standard types */}
                {!["physical", "digital", "both"].includes(type.name) && (
                  <Button onClick={() => handleDelete(type.id || type._id)} variant="danger" size="sm" icon={FiTrash2}>Delete</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingType ? "Edit Product Type Controls" : "Configure Product Type"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Type Label *</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. Virtual Reality Asset"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type ID Name *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingType}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. virtual_reality"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
              </div>

              {/* Behavior Control Toggles */}
              <div className="border-t border-gray-250 pt-4 mt-2 space-y-3">
                <span className="text-xs font-bold text-gray-700 uppercase block mb-1">Marketplace behavior controls</span>
                
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.controls.inventory}
                      onChange={() => toggleControl("inventory")}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800">Track inventory / stock</span>
                      <p className="text-[10px] text-gray-400">Enable stock alerts, warehouse limits, low-stock notifications.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.controls.shipping}
                      onChange={() => toggleControl("shipping")}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800">Require shipping logistics</span>
                      <p className="text-[10px] text-gray-400">Calculate weight, dimensions, pickup locations, courier rates.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.controls.downloads}
                      onChange={() => toggleControl("downloads")}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800">Support file downloads</span>
                      <p className="text-[10px] text-gray-400">Attach secure audio, video, PDF, or software assets.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.controls.licensing}
                      onChange={() => toggleControl("licensing")}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800">Enable activation keys / licensing</span>
                      <p className="text-[10px] text-gray-400">Define software subscription, licensing agreements, or terms of use.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.controls.variants}
                      onChange={() => toggleControl("variants")}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800">Variants (Size, Colors, Attributes)</span>
                      <p className="text-[10px] text-gray-400">Enable creation of pricing matrices for size/color variations.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
                <Button type="button" onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
                <Button type="submit" variant="primary" icon={FiSave}>
                  Save Configuration
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

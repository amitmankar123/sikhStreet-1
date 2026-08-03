import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { FiX, FiSave, FiUpload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import toast from "react-hot-toast";
import Button from "../Button";
import { uploadAdminImage, getProductTemplates, getAdditionalFields } from "../../services/adminService";



const CategoryForm = ({ category, onClose, onSave, parentId, restrictParentLevel }) => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app");
  const { createCategory, updateCategory, deleteCategory, categories } = useCategoryStore();
  const isEdit = !!category;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedBaseType, setSelectedBaseType] = useState("physical");
  const [subCatBaseType, setSubCatBaseType] = useState("physical");
  const [templates, setTemplates] = useState([]);
  const [libraryFields, setLibraryFields] = useState([]);
  const [selectedHeaderId, setSelectedHeaderId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    parentId: null,
    isActive: true,
    order: 0,
    metaTitle: "",
    metaDescription: "",
    productType: "physical",
    workflowSteps: ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"],
    assignedTemplateId: "",
    additionalFields: []
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [resTemplates, resFields] = await Promise.all([
          getProductTemplates(),
          getAdditionalFields()
        ]);
        setTemplates(resTemplates.data || []);
        setLibraryFields(resFields.data || []);
      } catch (err) {
        // Suppress or handle error
      }
    };
    fetchMetadata();
  }, []);

  const [subCategories, setSubCategories] = useState([]);

  const getCategoryDepth = (catId) => {
    if (!catId) return 1;
    const cat = categories.find(c => String(c.id || c._id) === String(catId));
    if (!cat) return 1;
    const pId = cat.parentId && typeof cat.parentId === 'object'
      ? (cat.parentId.id || cat.parentId._id)
      : cat.parentId;
    if (!pId) return 2;
    return 3;
  };

  const parentIdToUse = formData.parentId || parentId;
  const parentDepth = getCategoryDepth(parentIdToUse);
  const isLevel3 = restrictParentLevel === 2 || (parentIdToUse && parentDepth === 2);
  const isLevel2 = restrictParentLevel === 1 || (parentIdToUse && parentDepth === 1);
  const isLevel1 = !isLevel2 && !isLevel3;
  const isSubcategory = !isLevel1;
  const canHaveSubcategories = !isSubcategory || (category && getCategoryDepth(category.id) === 2);
  const parentCat = categories.find(c => String(c.id || c._id) === String(parentIdToUse));
  const isArtCategory = String(formData.name || "").toLowerCase().includes("art") || 
                        (parentCat && String(parentCat.name || "").toLowerCase().includes("art"));

  const parentOptions = useMemo(() => {
    if (!restrictParentLevel) return [];
    if (restrictParentLevel === 1) {
      // Header Categories: parentId is null
      return categories.filter(c => {
        const pid = c.parentId && typeof c.parentId === 'object' ? (c.parentId.id || c.parentId._id) : c.parentId;
        return !pid && String(c.id || c._id) !== String(category?.id || category?._id || '');
      });
    }
    if (restrictParentLevel === 2) {
      // Main Categories: parent is a Header category
      return categories.filter(c => {
        const pid = c.parentId && typeof c.parentId === 'object' ? (c.parentId.id || c.parentId._id) : c.parentId;
        if (!pid) return false;
        const parent = categories.find(p => String(p.id || p._id) === String(pid));
        const gpId = parent ? (parent.parentId && typeof parent.parentId === 'object' ? (parent.parentId.id || parent.parentId._id) : parent.parentId) : null;
        return !gpId && String(c.id || c._id) !== String(category?.id || category?._id || '');
      });
    }
    return [];
  }, [categories, restrictParentLevel, category]);

  const headerOptions = useMemo(() => {
    return categories.filter(c => {
      const pid = c.parentId && typeof c.parentId === 'object' ? (c.parentId.id || c.parentId._id) : c.parentId;
      return !pid;
    });
  }, [categories]);

  const filteredMainOptions = useMemo(() => {
    if (!selectedHeaderId) return [];
    return categories.filter(c => {
      const pid = c.parentId && typeof c.parentId === 'object' ? (c.parentId.id || c.parentId._id) : c.parentId;
      return pid && String(pid) === String(selectedHeaderId) && String(c.id || c._id) !== String(category?.id || category?._id || '');
    });
  }, [categories, selectedHeaderId, category]);

  useEffect(() => {
    if (category) {
      const type = category.productType || "physical";
      const actualParentId = category.parentId && typeof category.parentId === 'object'
        ? (category.parentId.id || category.parentId._id)
        : category.parentId || null;

      setFormData({
        name: category.name || "",
        description: category.description || "",
        image: category.image || "",
        parentId: actualParentId,
        group: category.group || "",
        isActive: category.isActive !== undefined ? category.isActive : true,
        order: category.order || 0,
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
        productType: type,
        workflowSteps: Array.isArray(category.workflowSteps) ? category.workflowSteps : [],
        assignedTemplateId: category.assignedTemplateId || "",
        additionalFields: Array.isArray(category.additionalFields) ? category.additionalFields : []
      });
      setSelectedBaseType(type === "all" ? "physical" : type);

      // Initialize selectedHeaderId for Level 3 category
      if (actualParentId) {
        const parent = categories.find(c => String(c.id || c._id) === String(actualParentId));
        if (parent) {
          const gpId = parent.parentId && typeof parent.parentId === 'object'
            ? (parent.parentId.id || parent.parentId._id)
            : parent.parentId || null;
          if (gpId) {
            setSelectedHeaderId(String(gpId));
          } else {
            // Parent has no parent (Level 1 Header), so this category itself is Level 2 (Main Category)
            setSelectedHeaderId(String(actualParentId));
          }
        }
      }

      // Load existing subcategories from the store categories
      const children = categories.filter((cat) => {
        const catParentId = cat.parentId && typeof cat.parentId === 'object'
          ? (cat.parentId.id || cat.parentId._id)
          : cat.parentId;
        return String(catParentId || '') === String(category.id || '');
      }).map(cat => ({
        id: cat.id,
        name: cat.name,
        image: cat.image || "",
        productType: cat.productType || "physical",
        workflowSteps: Array.isArray(cat.workflowSteps) ? cat.workflowSteps : [],
        group: cat.group || "",
        isExisting: true
      }));
      setSubCategories(children);
    } else {
      setFormData({
        name: "",
        description: "",
        image: "",
        parentId: parentId || null,
        group: "",
        isActive: true,
        order: 0,
        metaTitle: "",
        metaDescription: "",
        productType: "physical",
        workflowSteps: ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"],
        assignedTemplateId: "",
        additionalFields: []
      });
      setSelectedBaseType("physical");
      setSubCategories([]);

      // Initialize selectedHeaderId if parentId is passed (creating new Subcategory under a main parent category)
      if (parentId) {
        const parent = categories.find(c => String(c.id || c._id) === String(parentId));
        if (parent) {
          const gpId = parent.parentId && typeof parent.parentId === 'object'
            ? (parent.parentId.id || parent.parentId._id)
            : parent.parentId || null;
          if (gpId) {
            setSelectedHeaderId(String(gpId));
          }
        }
      } else {
        setSelectedHeaderId("");
      }
    }
  }, [category, parentId, categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value === "" ? null : value,
    });
  };



  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await uploadAdminImage(file, "categories");
      const imageUrl = response?.data?.url;
      if (!imageUrl) {
        toast.error("Image upload failed");
        return;
      }
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      toast.success("Image uploaded");
    } catch (error) {
      // Error toast handled by api interceptor
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleAttachField = (field) => {
    if ((formData.additionalFields || []).some(f => f.name === field.name)) {
      toast.error("This field is already attached.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      additionalFields: [...(prev.additionalFields || []), {
        name: field.name,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || "",
        required: !!field.required,
        options: field.options || []
      }]
    }));
    toast.success(`Attached "${field.label}" field.`);
  };

  const handleDetachField = (idx) => {
    setFormData(prev => ({
      ...prev,
      additionalFields: (prev.additionalFields || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const actualParentId = formData.parentId || parentId;
    if (!actualParentId && !formData.assignedTemplateId) {
      toast.error("Header category must be associated with a Product Template");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let masterCategoryId = category?.id;

      const payloadToSubmit = { ...formData };

      if (isEdit) {
        await updateCategory(category.id, payloadToSubmit);
      } else {
        const newCat = await createCategory(payloadToSubmit);
        masterCategoryId = newCat.id; // Or whatever property holds the ID
      }

      // Create/Update subcategories
      if (subCategories.length > 0 && masterCategoryId) {
        for (const sub of subCategories) {
          if (sub.isExisting) {
            await updateCategory(sub.id, {
              name: sub.name,
              description: "",
              image: sub.image,
              parentId: masterCategoryId,
              isActive: true,
              order: 0,
              metaTitle: "",
              metaDescription: "",
              productType: sub.productType || "physical",
              workflowSteps: sub.workflowSteps || [],
              group: sub.group || ""
            });
          } else {
            await createCategory({
              name: sub.name,
              description: "",
              image: sub.image,
              parentId: masterCategoryId,
              isActive: true,
              order: 0,
              metaTitle: "",
              metaDescription: "",
              productType: sub.productType || "physical",
              workflowSteps: sub.workflowSteps || [],
              group: sub.group || ""
            });
          }
        }
      }

      onSave?.();
      onClose();
    } catch (error) {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-[10000]"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[10000] flex ${isAppRoute ? "items-start pt-[10px]" : "items-end"
            } sm:items-center justify-center p-4 pointer-events-none`}>
          <motion.div
            variants={{
              hidden: {
                y: isAppRoute ? "-100%" : "100%",
                scale: 0.95,
                opacity: 0,
              },
              visible: {
                y: 0,
                scale: 1,
                opacity: 1,
                transition: {
                  type: "spring",
                  damping: 22,
                  stiffness: 350,
                  mass: 0.7,
                },
              },
              exit: {
                y: isAppRoute ? "-100%" : "100%",
                scale: 0.95,
                opacity: 0,
                transition: {
                  type: "spring",
                  damping: 30,
                  stiffness: 400,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`bg-white ${isAppRoute ? "rounded-b-3xl" : "rounded-t-3xl"
              } sm:rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-admin pointer-events-auto`}
            style={{ willChange: "transform" }}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEdit
                    ? (isLevel3 ? "Edit Subcategory" : isLevel2 ? "Edit Main Category" : "Edit Header Category")
                    : (isLevel3 ? "Create Subcategory" : isLevel2 ? "Create Main Category" : "Create Header Category")}
                </h2>
              </div>
              <Button
                onClick={onClose}
                variant="icon"
                icon={FiX}
                className="text-gray-600"
              />
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {isLevel3 ? "Subcategory Details" : isLevel2 ? "Main Category Details" : "Header Category Details"}
                </h3>
                <div className="space-y-4">
                  {restrictParentLevel === 1 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Parent Header Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="parentId"
                        value={formData.parentId || ""}
                        onChange={(e) => {
                          const pVal = e.target.value || null;
                          setFormData(prev => ({ ...prev, parentId: pVal }));
                        }}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                      >
                        <option value="">-- Choose Header Category --</option>
                        {parentOptions.map(p => (
                          <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {restrictParentLevel === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Parent Header Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedHeaderId}
                          onChange={(e) => {
                            const hVal = e.target.value || "";
                            setSelectedHeaderId(hVal);
                            setFormData(prev => ({ ...prev, parentId: "" }));
                          }}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                        >
                          <option value="">-- Choose Header Category --</option>
                          {headerOptions.map(h => (
                            <option key={h.id || h._id} value={h.id || h._id}>{h.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Parent Main Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="parentId"
                          value={formData.parentId || ""}
                          onChange={(e) => {
                            const pVal = e.target.value || null;
                            setFormData(prev => ({ ...prev, parentId: pVal }));
                          }}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                          disabled={!selectedHeaderId}
                        >
                          <option value="">
                            {selectedHeaderId ? "-- Choose Main Category --" : "-- Choose Header Category First --"}
                          </option>
                          {filteredMainOptions.map(p => (
                            <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {isLevel3 ? "Subcategory Name" : isLevel2 ? "Main Category Name" : "Header Category Name"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={isLevel3 ? "e.g., Summer Collection" : isLevel2 ? "e.g., Clothing, Electronics" : "e.g., Home Favourites"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-2">
                      Generated Slug (Auto-created)
                    </label>
                    <input
                      type="text"
                      value={formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : ""}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-450 cursor-not-allowed text-sm"
                      placeholder="slug-will-appear-here"
                    />
                  </div>

                  {/* Category Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {isLevel3 ? "Subcategory Image" : isLevel2 ? "Main Category Image" : "Header Category Image"}
                    </label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                      placeholder="Image URL or upload..."
                    />
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm font-semibold">
                        <FiUpload />
                        {isUploadingImage ? "Uploading..." : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*, image/avif, .avif"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                    {formData.image && (
                      <div className="mt-4">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200 bg-gray-50 p-1"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Product Template & Custom Fields Assignment */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 font-serif">
                  Product Template Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assign Reusable Product Template {!parentIdToUse && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      name="assignedTemplateId"
                      value={formData.assignedTemplateId || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedTemplateId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                    >
                      {parentIdToUse ? (
                        <option value="">-- No Direct Template Assigned (Inherits from Parent) --</option>
                      ) : (
                        <option value="">-- Choose Required Product Template --</option>
                      )}
                      {templates.map((tpl) => (
                        <option key={tpl.id || tpl._id} value={tpl.id || tpl._id}>{tpl.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Additional Fields Override Management */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category Custom Specification Fields (Module 6)
                    </label>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      {/* List Attached Fields */}
                      {(formData.additionalFields || []).length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No custom fields attached to this category level.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {(formData.additionalFields || []).map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50/20 border border-indigo-150 rounded text-xs">
                              <span><strong className="text-gray-800">{f.label}</strong> ({f.name} · {f.type})</span>
                              <button
                                type="button"
                                onClick={() => handleDetachField(idx)}
                                className="text-red-500 hover:text-red-750 font-bold"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Attach Field from Library Selector */}
                      <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const selected = libraryFields.find(f => String(f.id || f._id) === String(val));
                              if (selected) {
                                handleAttachField(selected);
                              }
                              e.target.value = "";
                            }
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs bg-white"
                        >
                          <option value="">-- Attach Field from Registry Library --</option>
                          {libraryFields.map((f) => (
                            <option key={f.id || f._id} value={f.id || f._id}>{f.label} ({f.name})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  SEO Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="SEO Title (e.g., Best Electronics Online)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Brief description for search engines..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <Button type="button" onClick={onClose} variant="secondary">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={FiSave}
                  disabled={isSubmitting}>
                  {isEdit
                    ? (isLevel3 ? "Update Subcategory" : isLevel2 ? "Update Main Category" : "Update Header Category")
                    : (isLevel3 ? "Save Subcategory" : isLevel2 ? "Save Main Category" : "Save Header Category")}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default CategoryForm;

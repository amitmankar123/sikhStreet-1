import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FiX, FiSave, FiPlus, FiTrash2, FiUpload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import toast from "react-hot-toast";
import Button from "../Button";
import { uploadAdminImage } from "../../services/adminService";

const WORKFLOW_STEPS_OPTIONS = [
  { value: "basic_info", label: "Basic Info (Standard)" },
  { value: "basic_info_art", label: "Basic Info (Art Specialized)" },
  { value: "art_dimensions", label: "Art Dimensions Selection" },
  { value: "art_canvas_types", label: "Art Canvas Types Selection" },
  { value: "art_frame_types", label: "Art Frame Types Selection" },
  { value: "pricing_matrix", label: "Art Pricing Matrix" },
  { value: "upload_files", label: "Digital File Upload" },
  { value: "license", label: "Digital License Details" },
  { value: "pricing", label: "Standard Pricing" },
  { value: "inventory", label: "Inventory / Stock" },
  { value: "shipping", label: "Shipping & Logistics" },
  { value: "seo", label: "SEO Settings" },
  { value: "preview", label: "Preview" },
  { value: "publish", label: "Publish" },
];

const CategoryForm = ({ category, onClose, onSave, parentId }) => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app");
  const { createCategory, updateCategory, deleteCategory, categories } = useCategoryStore();
  const isEdit = !!category;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedBaseType, setSelectedBaseType] = useState("physical");
  const [subCatBaseType, setSubCatBaseType] = useState("physical");

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
    workflowSteps: ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"]
  });

  const [subCategories, setSubCategories] = useState([]);
  const [subCatName, setSubCatName] = useState("");
  const [subCatImage, setSubCatImage] = useState("");
  const [subCatType, setSubCatType] = useState("physical");
  const [subCatGroup, setSubCatGroup] = useState("");
  const [isUploadingSubImage, setIsUploadingSubImage] = useState(false);

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
  const isLevel3 = parentIdToUse && parentDepth === 2;
  const isLevel2 = parentIdToUse && parentDepth === 1;
  const isSubcategory = !!parentIdToUse;
  const canHaveSubcategories = !isSubcategory || (category && getCategoryDepth(category.id) === 2);
  const parentCat = categories.find(c => String(c.id || c._id) === String(parentIdToUse));
  const isArtCategory = String(formData.name || "").toLowerCase().includes("art") || 
                        (parentCat && String(parentCat.name || "").toLowerCase().includes("art"));

  useEffect(() => {
    if (category) {
      const type = category.productType || "physical";
      setFormData({
        name: category.name || "",
        description: category.description || "",
        image: category.image || "",
        parentId: category.parentId || null,
        group: category.group || "",
        isActive: category.isActive !== undefined ? category.isActive : true,
        order: category.order || 0,
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
        productType: type,
        workflowSteps: Array.isArray(category.workflowSteps) ? category.workflowSteps : [],
      });
      setSelectedBaseType(type === "all" ? "physical" : type);

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
        workflowSteps: ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"]
      });
      setSelectedBaseType("physical");
      setSubCategories([]);
    }
  }, [category, parentId, categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value === "" ? null : value,
    });
  };

  const handleSubCatImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setIsUploadingSubImage(true);
    try {
      const response = await uploadAdminImage(file, "categories");
      const imageUrl = response?.data?.url;
      if (!imageUrl) {
        toast.error("Image upload failed");
        return;
      }
      setSubCatImage(imageUrl);
      toast.success("Subcategory image uploaded");
    } catch (error) {
      // Error handled by api interceptor
    } finally {
      setIsUploadingSubImage(false);
      e.target.value = "";
    }
  };

  const handleAddSubcategory = () => {
    if (!subCatName.trim()) {
      toast.error(isLevel2 ? "Topic name is required" : "Subcategory name is required");
      return;
    }
    const defaultSteps = subCatType === 'digital'
      ? ["basic_info", "upload_files", "license", "pricing", "seo", "preview", "publish"]
      : subCatType === 'all'
      ? ["basic_info", "upload_files", "license", "pricing", "inventory", "shipping", "seo", "preview", "publish"]
      : ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"];

    setSubCategories([
      ...subCategories,
      {
        name: subCatName.trim(),
        image: subCatImage,
        productType: subCatType,
        workflowSteps: defaultSteps,
        group: isLevel2 ? subCatGroup.trim() : undefined
      }
    ]);
    setSubCatName("");
    setSubCatImage("");
    setSubCatType("physical");
    setSubCatBaseType("physical");
    setSubCatGroup("");
  };

  const handleRemoveSubcategory = (index) => {
    setSubCategories(subCategories.filter((_, i) => i !== index));
  };

  const handleUpdateSubCatField = (index, field, value) => {
    const updated = [...subCategories];
    updated[index] = { ...updated[index], [field]: value };
    setSubCategories(updated);
  };

  const handleSubCatListItemImageUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      const response = await uploadAdminImage(file, "categories");
      const imageUrl = response?.data?.url;
      if (!imageUrl) {
        toast.error("Image upload failed");
        return;
      }
      handleUpdateSubCatField(index, "image", imageUrl);
      toast.success("Subcategory image updated");
    } catch (error) {
      // Error handled by api interceptor
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveOrDeleteSubcategory = async (sub, index) => {
    if (sub.isExisting) {
      if (window.confirm(`Are you sure you want to permanently delete "${sub.name}" subcategory? This cannot be undone.`)) {
        try {
          const success = await deleteCategory(sub.id);
          if (success) {
            setSubCategories(subCategories.filter((_, i) => i !== index));
          }
        } catch (error) {
          // Error handled in store
        }
      }
    } else {
      setSubCategories(subCategories.filter((_, i) => i !== index));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
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
                    ? (isSubcategory ? "Edit Subcategory" : "Edit Category")
                    : (isSubcategory ? "Create Subcategory" : "Create Category")}
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
                  {isSubcategory ? "Subcategory Details" : "Master Category Details"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {isSubcategory ? (isLevel3 ? "Topic Name" : "Subcategory Name") : "Category Name"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={isSubcategory ? "e.g., Summer Dresses, Running Shoes" : "e.g., Clothing, Electronics"}
                    />
                  </div>

                  {isLevel3 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Topic Group Name (e.g. "Sikhism", "History", "Biographies")
                      </label>
                      <input
                        type="text"
                        name="group"
                        value={formData.group || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter topic group name..."
                      />
                    </div>
                  )}

                  {/* Category Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {isSubcategory ? "Subcategory Image" : "Category Image"}
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

              {/* Product Type & Dynamic Workflow Configuration */}
              <div className="pt-4 border-t border-gray-100 bg-gray-50/50 p-4 rounded-xl border border-gray-200/50">
                <h3 className="text-base font-bold text-gray-800 mb-4 font-serif">
                  Listing Workflow Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Type
                    </label>
                    <select
                      name="productType"
                      value={selectedBaseType}
                      onChange={(e) => {
                        const type = e.target.value;
                        setSelectedBaseType(type);
                        const defaultSteps = type === 'digital'
                          ? ["basic_info", "upload_files", "license", "pricing", "seo", "preview", "publish"]
                          : ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"];
                        setFormData(prev => ({
                          ...prev,
                          productType: type,
                          workflowSteps: defaultSteps
                        }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                    >
                      <option value="physical">Physical Product</option>
                      <option value="digital">Digital Product</option>
                    </select>

                    {/* Digital toggle — shown after Physical is chosen */}
                    {selectedBaseType === 'physical' && (
                      <div className="mt-3 rounded-xl border border-dashed border-primary-200 bg-primary-50/60 p-3">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <div
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              productType: prev.productType === 'all' ? 'physical' : 'all',
                              workflowSteps: prev.productType === 'all'
                                ? ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"]
                                : ["basic_info", "upload_files", "license", "pricing", "inventory", "shipping", "seo", "preview", "publish"]
                            }))}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                              formData.productType === 'all' ? 'bg-primary-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                              formData.productType === 'all' ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary-700">Also enable digital listing</p>
                            <p className="text-[11px] text-primary-500 mt-0.5">Adds digital file upload & license steps to this category&apos;s workflow</p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Physical toggle — shown after Digital is chosen */}
                    {selectedBaseType === 'digital' && (
                      <div className="mt-3 rounded-xl border border-dashed border-purple-200 bg-purple-50/60 p-3">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <div
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              productType: prev.productType === 'all' ? 'digital' : 'all',
                              workflowSteps: prev.productType === 'all'
                                ? ["basic_info", "upload_files", "license", "pricing", "seo", "preview", "publish"]
                                : ["basic_info", "upload_files", "license", "pricing", "inventory", "shipping", "seo", "preview", "publish"]
                            }))}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                              formData.productType === 'all' ? 'bg-purple-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                              formData.productType === 'all' ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-purple-900">Also enable physical listing</p>
                            <p className="text-[11px] text-purple-500 mt-0.5">Adds physical shipping & inventory steps to this category&apos;s workflow</p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Active Steps in Listing Workflow
                    </label>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                      {WORKFLOW_STEPS_OPTIONS.map((step) => {
                        const isChecked = (formData.workflowSteps || []).includes(step.value);
                        return (
                          <label key={step.value} className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-gray-100 rounded transition-colors text-xs font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const current = formData.workflowSteps || [];
                                const next = current.includes(step.value)
                                  ? current.filter(s => s !== step.value)
                                  : [...current, step.value];
                                setFormData(prev => ({ ...prev, workflowSteps: next }));
                              }}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span>{step.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {isArtCategory && formData.productType !== 'digital' && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            workflowSteps: ["basic_info_art", "art_dimensions", "art_canvas_types", "art_frame_types", "pricing_matrix", "inventory", "shipping", "seo", "preview", "publish"]
                          }))}
                          className="text-xs text-primary-600 hover:text-primary-700 font-bold bg-primary-50 px-2.5 py-1.5 rounded border border-primary-200"
                        >
                          Physical Art Preset
                        </button>
                      )}
                      {formData.productType !== 'digital' && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            workflowSteps: ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"]
                          }))}
                          className="text-xs text-gray-600 hover:text-gray-700 font-bold bg-gray-100 px-2.5 py-1.5 rounded border border-gray-300"
                        >
                          Standard Physical Preset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subcategories Section */}
              {canHaveSubcategories && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 font-serif">
                    {isLevel2 ? "Add Topics / Sub-subcategories" : "Add Subcategories"}
                  </h3>

                  {/* Add Subcategory Inputs */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4 mb-4">
                    <p className="text-xs font-semibold text-gray-500">
                      {isLevel2
                        ? "Stage topics to create along with this subcategory"
                        : "Stage subcategories to create along with this parent category"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          {isLevel2 ? "Topic Name" : "Subcategory Name"}
                        </label>
                        <input
                          type="text"
                          value={subCatName}
                          onChange={(e) => setSubCatName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={isLevel2 ? "e.g. Picture Books" : "e.g., Summer Collection"}
                        />
                      </div>

                      {isLevel2 ? (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">
                            Topic Group Name
                          </label>
                          <input
                            type="text"
                            value={subCatGroup}
                            onChange={(e) => setSubCatGroup(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g. Sikhism, History"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">
                            Subcategory Product Type
                          </label>
                          <select
                            value={subCatBaseType}
                            onChange={(e) => {
                              const type = e.target.value;
                              setSubCatBaseType(type);
                              setSubCatType(type);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          >
                            <option value="physical">Physical Product</option>
                            <option value="digital">Digital Product</option>
                          </select>
                          {subCatBaseType === 'physical' && (
                            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                              <div
                                onClick={() => setSubCatType(prev => prev === 'all' ? 'physical' : 'all')}
                                className={`relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                                  subCatType === 'all' ? 'bg-primary-600' : 'bg-gray-300'
                                }`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${
                                  subCatType === 'all' ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </div>
                              <span className="text-[11px] font-semibold text-primary-600">Also enable digital</span>
                            </label>
                          )}
                          {subCatBaseType === 'digital' && (
                            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                              <div
                                onClick={() => setSubCatType(prev => prev === 'all' ? 'digital' : 'all')}
                                className={`relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                                  subCatType === 'all' ? 'bg-purple-600' : 'bg-gray-300'
                                }`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${
                                  subCatType === 'all' ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </div>
                              <span className="text-[11px] font-semibold text-purple-600">Also enable physical</span>
                            </label>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Subcategory Image
                        </label>
                        <label className={`flex items-center justify-center gap-2 w-full h-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            isUploadingSubImage
                              ? 'border-primary-300 bg-primary-50 text-primary-500'
                              : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600'
                          }`}>
                            <FiUpload className="w-4 h-4" />
                            <span className="text-xs font-semibold">
                              {isUploadingSubImage ? 'Uploading...' : subCatImage ? 'Change Image' : 'Upload Image'}
                            </span>
                            <input
                              type="file"
                              accept="image/*, image/avif, .avif"
                              onChange={handleSubCatImageUpload}
                              className="hidden"
                              disabled={isUploadingSubImage}
                            />
                        </label>
                        {subCatImage && (
                          <div className="mt-2 flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-gray-200">
                             <img src={subCatImage} alt="Preview" className="w-8 h-8 object-cover rounded" />
                             <button type="button" onClick={() => setSubCatImage('')} className="text-[10px] text-red-500 font-bold uppercase">Remove</button>
                          </div>
                        )}
                      </div>
                    </div>



                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-xs"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      {isLevel2 ? "Add Topic" : "Add Subcategory"}
                    </button>
                  </div>

                  {/* List of staged subcategories */}
                  {subCategories.length > 0 && (
                    <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-admin pr-1 mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {isLevel2 ? "Topics List" : "Subcategories List"}
                      </p>
                      {subCategories.map((sub, index) => (
                        <div
                          key={sub.id || index}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1.5 items-center">
                              <span className="text-xs font-semibold px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                                {sub.isExisting
                                  ? (isLevel2 ? "Existing Topic" : "Existing Subcategory")
                                  : (isLevel2 ? "New Topic" : "New Subcategory")}
                              </span>
                              {!isLevel2 && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  sub.productType === 'digital'
                                    ? 'bg-purple-100 text-purple-700'
                                    : sub.productType === 'all'
                                      ? 'bg-teal-100 text-teal-700'
                                      : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {sub.productType === 'digital' ? 'Digital' : sub.productType === 'all' ? 'Physical & Digital' : 'Physical'}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOrDeleteSubcategory(sub, index)}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                              title="Delete Item"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <input
                                type="text"
                                value={sub.name}
                                onChange={(e) => handleUpdateSubCatField(index, "name", e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder={isLevel2 ? "Topic Name" : "Subcategory Name"}
                                required
                              />
                            </div>

                            {isLevel2 ? (
                              <div>
                                <input
                                  type="text"
                                  value={sub.group || ""}
                                  onChange={(e) => handleUpdateSubCatField(index, "group", e.target.value)}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  placeholder="Topic Group"
                                />
                              </div>
                            ) : (
                              <div />
                            )}

                             <div className="flex flex-col gap-1.5">
                               {sub.image ? (
                                 <div className="flex items-center gap-2">
                                   <img
                                     src={sub.image}
                                     alt="Preview"
                                     className="w-10 h-10 object-cover rounded-lg border border-gray-200 bg-white flex-shrink-0"
                                     onError={(e) => { e.target.style.display = 'none'; }}
                                   />
                                   <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-xs font-semibold border border-gray-200">
                                     <FiUpload className="w-3 h-3" /> Change
                                     <input
                                       type="file"
                                       accept="image/*, image/avif, .avif"
                                       onChange={(e) => handleSubCatListItemImageUpload(index, e)}
                                       className="hidden"
                                     />
                                   </label>
                                   <button
                                     type="button"
                                     onClick={() => handleUpdateSubCatField(index, 'image', '')}
                                     className="text-xs text-red-500 font-semibold hover:underline"
                                   >
                                     Remove
                                   </button>
                                 </div>
                               ) : (
                                 <label className="flex items-center justify-center gap-1.5 w-full h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                                   <FiUpload className="w-3.5 h-3.5" />
                                   <span className="text-xs font-semibold">Upload Image</span>
                                   <input
                                     type="file"
                                     accept="image/*, image/avif, .avif"
                                     onChange={(e) => handleSubCatListItemImageUpload(index, e)}
                                     className="hidden"
                                   />
                                 </label>
                               )}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                    ? (isSubcategory ? "Update Subcategory" : "Update Category")
                    : (isSubcategory ? "Save Subcategory" : "Save Category")}
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

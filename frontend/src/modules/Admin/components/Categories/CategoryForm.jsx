import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FiX, FiSave, FiPlus, FiTrash2, FiUpload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import toast from "react-hot-toast";
import Button from "../Button";
import { uploadAdminImage } from "../../services/adminService";

const CategoryForm = ({ category, onClose, onSave, parentId }) => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app");
  const { createCategory, updateCategory, deleteCategory, categories } = useCategoryStore();
  const isEdit = !!category;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "", 
    parentId: null,
    isActive: true,
    order: 0, 
    metaTitle: "",
    metaDescription: "",
  });

  const [subCategories, setSubCategories] = useState([]);
  const [subCatName, setSubCatName] = useState("");
  const [subCatImage, setSubCatImage] = useState("");
  const [isUploadingSubImage, setIsUploadingSubImage] = useState(false);

  const isSubcategory = !!formData.parentId;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        image: category.image || "",
        parentId: category.parentId || null,
        isActive: category.isActive !== undefined ? category.isActive : true,
        order: category.order || 0,
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
      });

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
        isExisting: true
      }));
      setSubCategories(children);
    } else {
      setFormData({
        name: "",
        description: "",
        image: "",
        parentId: parentId || null,
        isActive: true,
        order: 0,
        metaTitle: "",
        metaDescription: "",
      });
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
      toast.error("Subcategory name is required");
      return;
    }
    setSubCategories([
      ...subCategories,
      { name: subCatName.trim(), image: subCatImage }
    ]);
    setSubCatName("");
    setSubCatImage("");
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
              metaDescription: ""
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
              metaDescription: ""
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
          className={`fixed inset-0 z-[10000] flex ${
            isAppRoute ? "items-start pt-[10px]" : "items-end"
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
            className={`bg-white ${
              isAppRoute ? "rounded-b-3xl" : "rounded-t-3xl"
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
                      {isSubcategory ? "Subcategory Name" : "Category Name"} <span className="text-red-500">*</span>
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
                          accept="image/*"
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

              {/* Subcategories Section (Only for Master Categories) */}
              {!isSubcategory && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 font-serif">
                    Add Subcategories
                  </h3>
                  
                  {/* Add Subcategory Inputs */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4 mb-4">
                    <p className="text-xs font-semibold text-gray-500">Stage subcategories to create along with this parent category</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Subcategory Name
                        </label>
                        <input
                          type="text"
                          value={subCatName}
                          onChange={(e) => setSubCatName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g., Summer Collection"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Subcategory Image
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={subCatImage}
                            onChange={(e) => setSubCatImage(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Image URL or upload..."
                          />
                          <label className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm font-semibold border border-gray-300">
                            <FiUpload className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSubCatImageUpload}
                              className="hidden"
                              disabled={isUploadingSubImage}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {subCatImage && (
                      <div className="flex items-center gap-3">
                        <img 
                          src={subCatImage} 
                          alt="Sub Preview" 
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200 bg-white p-0.5"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setSubCatImage("")}
                          className="text-xs text-red-500 font-semibold hover:underline"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-xs"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      Add Subcategory
                    </button>
                  </div>
                  
                  {/* List of staged subcategories */}
                  {subCategories.length > 0 && (
                    <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-admin pr-1 mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subcategories List</p>
                      {subCategories.map((sub, index) => (
                        <div 
                          key={sub.id || index}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                              {sub.isExisting ? "Existing Subcategory" : "New Subcategory"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOrDeleteSubcategory(sub, index)}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                              title="Delete Subcategory"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <input
                                type="text"
                                value={sub.name}
                                onChange={(e) => handleUpdateSubCatField(index, "name", e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Subcategory Name"
                                required
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={sub.image}
                                onChange={(e) => handleUpdateSubCatField(index, "image", e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Image URL or upload..."
                              />
                              <label className="flex-shrink-0 inline-flex items-center justify-center p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer border border-gray-300">
                                <FiUpload className="w-4 h-4" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSubCatListItemImageUpload(index, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                          
                          {sub.image && (
                            <img 
                              src={sub.image} 
                              alt="Sub Preview" 
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 bg-white"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
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

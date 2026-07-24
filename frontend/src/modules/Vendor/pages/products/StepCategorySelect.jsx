import React, { useMemo } from "react";
import AnimatedSelect from "../../../Admin/components/AnimatedSelect";
import { useCategoryStore } from "../../../../shared/store/categoryStore";

export default function StepCategorySelect({ formData, onChange, isEdit }) {
  const { categories } = useCategoryStore();
  const productType = formData.productType || "physical";

  const getParentId = (cat) => {
    if (!cat || !cat.parentId) return "";
    if (typeof cat.parentId === 'object') {
      return cat.parentId.id || cat.parentId._id || "";
    }
    return String(cat.parentId);
  };

  // Filtered Main Categories based on selected Product Type
  const filteredMainCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    // Get all root categories (no parentId)
    const roots = categories.filter((cat) => !getParentId(cat) && cat.isActive !== false);

    return roots.filter((root) => {
      // Find subcategories of this root
      const subs = categories.filter(
        (cat) => getParentId(cat) === String(root.id || root._id || "") && cat.isActive !== false
      );

      // If root has no subcategories, show if root productType matches or isn't restricted
      if (subs.length === 0) {
        return !root.productType || root.productType === "all" || root.productType === productType;
      }

      // Show root if root itself matches OR any subcategory matches productType or isn't restricted
      return (
        !root.productType ||
        root.productType === "all" ||
        root.productType === productType ||
        subs.some((sub) => !sub.productType || sub.productType === "all" || sub.productType === productType)
      );
    });
  }, [categories, productType]);

  // Filtered Subcategories based on selected Main Category and Product Type
  const filteredSubcategories = useMemo(() => {
    if (!categories || !formData.categoryId) return [];

    return categories.filter(
      (cat) =>
        getParentId(cat) === String(formData.categoryId) &&
        cat.isActive !== false &&
        (!cat.productType || cat.productType === "all" || cat.productType === productType)
    );
  }, [categories, formData.categoryId, productType]);

  // Filtered Topics (Level 3) based on selected Subcategory
  const filteredTopics = useMemo(() => {
    if (!categories || !formData.subcategoryId) return [];

    return categories.filter(
      (cat) =>
        getParentId(cat) === String(formData.subcategoryId) &&
        cat.isActive !== false
    );
  }, [categories, formData.subcategoryId]);

  const handleMainCategoryChange = (e) => {
    const value = e.target.value || null;
    onChange({
      categoryId: value,
      subcategoryId: null, // reset subcategory on parent change
      topicId: null, // reset topic
      topic: ""
    });
  };

  const handleSubcategoryChange = (e) => {
    const value = e.target.value || null;
    onChange({
      subcategoryId: value,
      topicId: null, // reset topic on subcategory change
      topic: ""
    });
  };

  const handleTopicChange = (e) => {
    const value = e.target.value || null;
    const topicCat = (categories || []).find((c) => String(c.id || c._id) === String(value));
    onChange({
      topicId: value,
      topic: topicCat ? topicCat.name : ""
    });
  };

  const hasSubcategories = filteredSubcategories.length > 0;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Category Selection</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Select the industry and type details for your product listing.
        </p>
      </div>

      <div className={filteredTopics.length > 0 ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {/* Main Category */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Main Category <span className="text-red-500">*</span>
          </label>
          <AnimatedSelect
            name="categoryId"
            value={formData.categoryId || ""}
            onChange={handleMainCategoryChange}
            disabled={isEdit}
            placeholder="Select Main Category"
            options={filteredMainCategories.map((cat) => ({
              value: String(cat.id || cat._id),
              label: cat.name
            }))}
          />
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Subcategory {hasSubcategories && <span className="text-red-500">*</span>}
          </label>
          <AnimatedSelect
            name="subcategoryId"
            value={formData.subcategoryId || ""}
            onChange={handleSubcategoryChange}
            disabled={!formData.categoryId || !hasSubcategories || isEdit}
            placeholder={
              !formData.categoryId
                ? "First choose main category"
                : hasSubcategories
                ? "Select Subcategory"
                : "No subcategories (Optional)"
            }
            options={filteredSubcategories.map((cat) => ({
              value: String(cat.id || cat._id),
              label: cat.name
            }))}
          />
        </div>


        {/* Topic / Sub-subcategory (For any category that has sub-subcategories/topics available) */}
        {filteredTopics.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Topic / Sub-subcategory
            </label>
            <AnimatedSelect
              name="topicId"
              value={formData.topicId || ""}
              onChange={handleTopicChange}
              disabled={!formData.subcategoryId || isEdit}
              placeholder={
                !formData.subcategoryId
                  ? "First choose subcategory"
                  : "Select Topic"
              }
              options={filteredTopics.map((cat) => ({
                value: String(cat.id || cat._id),
                label: cat.name
              }))}
            />
          </div>
        )}
      </div>

      {isEdit && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-2.5 rounded-lg font-semibold">
          Note: Categories are locked during edits to maintain variant and attributes integrity.
        </p>
      )}
    </div>
  );
}

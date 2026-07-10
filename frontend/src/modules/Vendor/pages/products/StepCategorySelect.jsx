import React, { useMemo } from "react";
import AnimatedSelect from "../../../Admin/components/AnimatedSelect";
import { useCategoryStore } from "../../../../shared/store/categoryStore";

export default function StepCategorySelect({ formData, onChange, isEdit }) {
  const { categories } = useCategoryStore();
  const productType = formData.productType || "physical";

  // Filtered Main Categories based on selected Product Type
  const filteredMainCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    // Get all root categories (no parentId)
    const roots = categories.filter((cat) => !cat.parentId);
    
    return roots.filter((root) => {
      // Find subcategories of this root
      const subs = categories.filter(
        (cat) => String(cat.parentId || "") === String(root.id || root._id || "")
      );
      
      // If root has no subcategories, show it if its type matches (fallback)
      if (subs.length === 0) {
        return (root.productType || "physical") === productType;
      }
      
      // Show root if it contains at least one subcategory with the selected product type
      return subs.some((sub) => (sub.productType || "physical") === productType);
    });
  }, [categories, productType]);

  // Filtered Subcategories based on selected Main Category and Product Type
  const filteredSubcategories = useMemo(() => {
    if (!categories || !formData.categoryId) return [];
    
    return categories.filter(
      (cat) =>
        String(cat.parentId || "") === String(formData.categoryId) &&
        (cat.productType || "physical") === productType &&
        cat.isActive !== false
    );
  }, [categories, formData.categoryId, productType]);

  const handleMainCategoryChange = (e) => {
    const value = e.target.value || null;
    onChange({
      categoryId: value,
      subcategoryId: null // reset subcategory on parent change
    });
  };

  const handleSubcategoryChange = (e) => {
    const value = e.target.value || null;
    onChange({ subcategoryId: value });
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Category Selection</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Select the industry and type details for your product listing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            Subcategory <span className="text-red-500">*</span>
          </label>
          <AnimatedSelect
            name="subcategoryId"
            value={formData.subcategoryId || ""}
            onChange={handleSubcategoryChange}
            disabled={!formData.categoryId || isEdit}
            placeholder={
              !formData.categoryId 
                ? "First choose main category" 
                : "Select Subcategory"
            }
            options={filteredSubcategories.map((cat) => ({
              value: String(cat.id || cat._id),
              label: cat.name
            }))}
          />
        </div>
      </div>

      {isEdit && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-2.5 rounded-lg font-semibold">
          Note: Categories are locked during edits to maintain variant and attributes integrity.
        </p>
      )}
    </div>
  );
}

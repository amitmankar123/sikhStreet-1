import React, { useState, useEffect, useMemo } from "react";
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiEyeOff, FiFolder } from "react-icons/fi";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import CategoryForm from "../../components/Categories/CategoryForm";
import toast from "react-hot-toast";
import Button from "../../components/Button";

export default function MainCategories() {
  const { categories, initialize, deleteCategory, updateCategory } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const getParentId = (cat) => {
    if (!cat.parentId) return null;
    if (typeof cat.parentId === 'object') {
      return cat.parentId._id || cat.parentId.id || null;
    }
    return cat.parentId;
  };

  const getCategoryDepth = (catId) => {
    if (!catId) return 1;
    const cat = categories.find(c => String(c.id || c._id) === String(catId));
    if (!cat) return 1;
    const pId = getParentId(cat);
    if (!pId) return 1;
    
    const parent = categories.find(c => String(c.id || c._id) === String(pId));
    if (!parent) return 2;
    const gpId = getParentId(parent);
    if (!gpId) return 2;
    return 3;
  };

  // Filter for Level 2 categories (parent is a Level 1 category)
  const mainCategories = useMemo(() => {
    return categories.filter((cat) => {
      const pid = getParentId(cat);
      if (!pid) return false;

      // The parent category must have parentId as null (meaning parent is Level 1)
      const parent = categories.find(c => String(c.id || c._id) === String(pid));
      if (!parent || getParentId(parent)) return false;

      return !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [categories, searchQuery]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Main category? All subcategories mapped under it will be deleted.")) {
      try {
        await deleteCategory(id);
        toast.success("Main category deleted.");
      } catch (err) {
        toast.error("Failed to delete category.");
      }
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      const currentId = category.id || category._id;
      await updateCategory(currentId, { isActive: !category.isActive });
      toast.success(`Category ${category.isActive ? "disabled" : "enabled"}`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const resolveParentName = (cat) => {
    const pid = getParentId(cat);
    if (!pid) return "Unknown Header";
    const parent = categories.find(c => String(c.id || c._id) === String(pid));
    return parent ? parent.name : "Unknown Header";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Main Categories (Level 2)</h1>
          <p className="text-xs text-gray-500">Configure child level categories. These are nested under root header categories.</p>
        </div>
        <Button onClick={handleOpenCreate} icon={FiPlus} size="sm">Create Main Category</Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-md focus-within:ring-2 focus-within:ring-primary-500">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search main categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-xs text-gray-700 w-full"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-4 w-16">Image</th>
              <th className="p-4">Name</th>
              <th className="p-4">Parent Header</th>
              <th className="p-4">Slug</th>
              <th className="p-4 w-28">Status</th>
              <th className="p-4 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 text-gray-700">
            {mainCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 italic">No main categories found.</td>
              </tr>
            ) : (
              mainCategories.map((cat) => (
                <tr key={cat.id || cat._id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border">
                        <FiFolder className="text-gray-400 text-base" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-gray-800">{cat.name}</td>
                  <td className="p-4 text-primary-650 font-bold">{resolveParentName(cat)}</td>
                  <td className="p-4 font-semibold text-gray-400">{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      cat.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    <button onClick={() => handleToggleStatus(cat)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Toggle status">
                      {cat.isActive ? <FiEye /> : <FiEyeOff className="text-red-500" />}
                    </button>
                    <button onClick={() => handleOpenEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded text-primary-650" title="Edit main">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(cat.id || cat._id)} className="p-1.5 hover:bg-gray-100 rounded text-red-500" title="Delete main">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CategoryForm
          category={editingCategory}
          restrictParentLevel={1}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); initialize(); }}
        />
      )}
    </div>
  );
}

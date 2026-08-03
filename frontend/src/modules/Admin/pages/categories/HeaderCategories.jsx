import React, { useState, useEffect, useMemo } from "react";
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiEyeOff, FiFolder } from "react-icons/fi";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import CategoryForm from "../../components/Categories/CategoryForm";
import toast from "react-hot-toast";
import Button from "../../components/Button";

export default function HeaderCategories() {
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
      return cat.parentId.id || cat.parentId._id || null;
    }
    return cat.parentId;
  };

  // Filter for Level 1 categories (parentId is null)
  const headerCategories = useMemo(() => {
    return categories.filter((cat) => {
      const pid = getParentId(cat);
      if (pid) return false;
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
    if (window.confirm("Are you sure you want to delete this Header category? All subcategories mapped under it will be deleted.")) {
      try {
        await deleteCategory(id);
        toast.success("Header category deleted.");
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Header Categories (Level 1)</h1>
          <p className="text-xs text-gray-500">Configure root level headers. A product template is mandatory at this level.</p>
        </div>
        <Button onClick={handleOpenCreate} icon={FiPlus} size="sm">Create Header Category</Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-md focus-within:ring-2 focus-within:ring-primary-500">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search header categories..."
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
              <th className="p-4">Slug</th>
              <th className="p-4">Template ID</th>
              <th className="p-4 w-28">Status</th>
              <th className="p-4 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 text-gray-700">
            {headerCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 italic">No header categories found.</td>
              </tr>
            ) : (
              headerCategories.map((cat) => (
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
                  <td className="p-4 font-semibold text-gray-400">{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}</td>
                  <td className="p-4 font-mono text-gray-500">{cat.assignedTemplateId || "Not assigned"}</td>
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
                    <button onClick={() => handleOpenEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded text-primary-650" title="Edit header">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(cat.id || cat._id)} className="p-1.5 hover:bg-gray-100 rounded text-red-500" title="Delete header">
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
          parentId={null}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); initialize(); }}
        />
      )}
    </div>
  );
}

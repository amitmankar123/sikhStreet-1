import React, { useState, useEffect, useMemo } from "react";
import { FiSearch, FiLayers, FiFolder, FiTag, FiGrid, FiChevronRight } from "react-icons/fi";
import { motion } from "framer-motion";
import { useCategoryStore } from "../../../shared/store/categoryStore";

export default function Categories() {
  const { categories, initialize, getCategoriesByParent } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Active selections for drill-down columns
  const [selectedHeaderId, setSelectedHeaderId] = useState(null);
  const [selectedMainId, setSelectedMainId] = useState(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSelectHeader = (id) => {
    setSelectedHeaderId(id);
    setSelectedMainId(null);
  };

  const handleSelectMain = (id) => {
    setSelectedMainId(id);
  };

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

  // ─── Summary Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const headers = categories.filter(c => !getParentId(c)).length;

    // Level 2 (Main)
    const mains = categories.filter(c => {
      const pid = getParentId(c);
      if (!pid) return false;
      const parent = categories.find(parentCat => String(parentCat.id || parentCat._id) === String(pid));
      return parent && !getParentId(parent);
    }).length;

    // Level 3 (Sub)
    const subs = categories.filter(c => {
      const pid = getParentId(c);
      if (!pid) return false;
      const parent = categories.find(parentCat => String(parentCat.id || parentCat._id) === String(pid));
      if (!parent) return false;
      const gpid = getParentId(parent);
      return gpid;
    }).length;

    return {
      headers,
      mains,
      subs,
      total: categories.length
    };
  }, [categories]);

  // ─── Filtered Lists ────────────────────────────────────────────────
  const headerCategories = useMemo(() => {
    return categories.filter((cat) => {
      const pid = getParentId(cat);
      if (pid) return false;

      const matchesSearch =
        !searchQuery ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && cat.isActive) ||
        (selectedStatus === "inactive" && !cat.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, selectedStatus]);

  const mainCategories = useMemo(() => {
    if (!selectedHeaderId) return [];
    return getCategoriesByParent(selectedHeaderId);
  }, [categories, selectedHeaderId, getCategoriesByParent]);

  const subCategories = useMemo(() => {
    if (!selectedMainId) return [];
    return getCategoriesByParent(selectedMainId);
  }, [categories, selectedMainId, getCategoriesByParent]);

  return (
    <div className="p-6 h-[calc(100vh-104px)] flex flex-col space-y-6">

      {/* Category Hierarchy Explorer Stats Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FiLayers className="text-primary-650 text-xl" />
            <h1 className="text-xl font-bold text-gray-800">Category Hierarchy Explorer</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visual overview of your catalog structure ({stats.total} items)
          </p>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 border border-gray-150 px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-650">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Headers:</span>
            <span className="font-bold text-gray-800 text-sm">{stats.headers}</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Level 2:</span>
            <span className="font-bold text-gray-850 text-sm">{stats.mains}</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Subcategories:</span>
            <span className="font-bold text-gray-800 text-sm">{stats.subs}</span>
          </div>
        </div>
      </div>

      {/* Three-Column Drilling Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Column 1: Header Categories (Level 1) */}
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiGrid className="text-gray-500 text-lg" />
              <h3 className="font-bold text-gray-850 text-sm">Header Categories</h3>
              <span className="px-2 py-0.5 bg-gray-200 text-gray-650 text-[10px] font-bold rounded-full">
                {headerCategories.length}
              </span>
            </div>
          </div>

          {/* Inline Filter and Search */}
          <div className="p-3 border-b border-gray-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 w-full focus-within:ring-2 focus-within:ring-primary-500">
              <FiSearch className="text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-xs text-gray-700 w-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 px-1">
              <span>FILTER STATUS:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded bg-white text-[10px] text-gray-650 outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-admin">
            {headerCategories.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center pt-8">No header categories found.</p>
            ) : (
              headerCategories.map((cat) => {
                const isSelected = String(selectedHeaderId || '') === String(cat.id || cat._id);
                return (
                  <motion.div
                    key={cat.id || cat._id}
                    onClick={() => handleSelectHeader(cat.id || cat._id)}
                    whileHover={{ scale: 1.012 }}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 group relative ${isSelected
                        ? "border-primary-500 bg-white shadow-sm ring-1 ring-primary-500"
                        : "border-gray-200 hover:bg-gray-50/50 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-11 h-11 object-cover rounded-lg border flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border">
                          <FiFolder className="text-gray-400 text-lg" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-805 truncate">{cat.name}</p>
                        <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider">{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}</p>
                      </div>
                    </div>

                    <FiChevronRight className={`text-base transition-colors ${isSelected ? "text-primary-650 font-bold" : "text-gray-350 group-hover:text-gray-600"
                      }`} />
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Main Categories (Level 2) */}
        <div className={`bg-white border border-gray-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden transition-all ${selectedHeaderId ? "border-l-4 border-l-primary-500" : ""
          }`}>
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFolder className="text-gray-500 text-lg" />
              <h3 className="font-bold text-gray-850 text-sm">Level 2 Categories</h3>
              {selectedHeaderId && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-650 text-[10px] font-bold rounded-full">
                  {mainCategories.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-admin">
            {!selectedHeaderId ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
                <FiLayers className="text-3xl text-gray-300 mb-2" />
                <p className="text-xs font-semibold">Select a Header Category in Column 1 to inspect Main Categories.</p>
              </div>
            ) : mainCategories.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center pt-8">No main categories mapped under this header.</p>
            ) : (
              mainCategories.map((cat) => {
                const isSelected = String(selectedMainId || '') === String(cat.id || cat._id);
                return (
                  <motion.div
                    key={cat.id || cat._id}
                    onClick={() => handleSelectMain(cat.id || cat._id)}
                    whileHover={{ scale: 1.012 }}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 group relative ${isSelected
                        ? "border-primary-500 bg-white shadow-sm ring-1 ring-primary-500"
                        : "border-gray-200 hover:bg-gray-50/50 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-11 h-11 object-cover rounded-lg border flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border">
                          <FiFolder className="text-gray-400 text-lg" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-850 truncate">{cat.name}</p>
                        <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider">{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}</p>
                      </div>
                    </div>

                    <FiChevronRight className={`text-base transition-colors ${isSelected ? "text-primary-650 font-bold" : "text-gray-355 group-hover:text-gray-600"
                      }`} />
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Subcategories (Level 3 Topics) */}
        <div className={`bg-white border border-gray-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden transition-all ${selectedMainId ? "border-l-4 border-l-primary-500" : ""
          }`}>
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiTag className="text-gray-500 text-lg" />
              <h3 className="font-bold text-gray-850 text-sm">Subcategories</h3>
              {selectedMainId && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-650 text-[10px] font-bold rounded-full">
                  {subCategories.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-admin">
            {!selectedMainId ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
                <FiLayers className="text-3xl text-gray-300 mb-2" />
                <p className="text-xs font-semibold">Select a Main Category in Column 2 to inspect Subcategories/Topics.</p>
              </div>
            ) : subCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
                <p className="text-sm font-semibold text-gray-500 mb-1">No subcategories in</p>
                <p className="text-xs font-bold text-gray-700">&quot;{categories.find(c => String(c.id || c._id) === String(selectedMainId))?.name}&quot;</p>
              </div>
            ) : (
              subCategories.map((cat) => {
                return (
                  <motion.div
                    key={cat.id || cat._id}
                    whileHover={{ scale: 1.012 }}
                    className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50/50 hover:border-gray-300 flex items-center justify-between text-gray-700 group relative transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-11 h-11 object-cover rounded-lg border flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border">
                          <FiTag className="text-gray-400 text-lg" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-850 truncate">{cat.name}</p>
                        <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider">{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

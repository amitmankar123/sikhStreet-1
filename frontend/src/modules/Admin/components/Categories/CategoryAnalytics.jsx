import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiBox, FiUsers, FiTrendingUp, FiEye } from "react-icons/fi";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { formatCurrency } from "../../utils/adminHelpers";

const CategoryAnalytics = () => {
  const { fetchCategoryAnalytics, analytics, isLoading } = useCategoryStore();
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      const res = await fetchCategoryAnalytics();
      setData(res);
    };
    loadAnalytics();
  }, [fetchCategoryAnalytics]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { productStats, vendorStats, mostViewed, trending } = data;

  const totalProducts = Object.values(productStats).reduce((a, b) => a + b, 0);
  const totalVendors = Object.values(vendorStats).reduce((a, b) => a + b, 0); // Note: vendors might overlap categories, but this gives a rough sum or we can just show stats per category

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Assigned Products</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalProducts}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <FiBox className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Active Vendors</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalVendors}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Viewed Categories */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <FiEye className="text-gray-500" />
            <h3 className="font-semibold text-gray-800">Most Viewed Categories</h3>
          </div>
          <div className="p-4">
            {mostViewed && mostViewed.length > 0 ? (
              <ul className="space-y-3">
                {mostViewed.map((cat, index) => (
                  <li key={cat.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-bold text-gray-400">#{index + 1}</span>
                      <span className="font-medium text-gray-800">{cat.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {cat.viewCount} views
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No view data available yet.</p>
            )}
          </div>
        </div>

        {/* Category Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <FiTrendingUp className="text-gray-500" />
            <h3 className="font-semibold text-gray-800">Products & Vendors per Category</h3>
          </div>
          <div className="p-4 overflow-y-auto max-h-64 scrollbar-admin">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Category ID</th>
                  <th className="px-4 py-2 text-right">Products</th>
                  <th className="px-4 py-2 text-right">Vendors</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(productStats).map(catId => (
                  <tr key={catId} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[150px]" title={catId}>
                      {catId}
                    </td>
                    <td className="px-4 py-3 text-right">{productStats[catId] || 0}</td>
                    <td className="px-4 py-3 text-right">{vendorStats[catId] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalytics;

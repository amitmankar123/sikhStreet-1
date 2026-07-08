import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { categories as fallbackCategories } from "../../../../data/categories";
import LazyImage from "../../../../shared/components/LazyImage";
import { useCategoryStore } from "../../../../shared/store/categoryStore";

const normalizeId = (value) => String(value ?? "").trim();

const MobileCategoryGrid = () => {
  const { categories, initialize, getRootCategories } = useCategoryStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const displayCategories = useMemo(() => {
    const roots = getRootCategories().filter((cat) => cat.isActive !== false);
    if (!roots.length) return fallbackCategories;

    return roots.map((cat) => {
      const fallbackCat = fallbackCategories.find(
        (fc) =>
          normalizeId(fc.id) === normalizeId(cat.id) ||
          fc.name?.toLowerCase() === cat.name?.toLowerCase()
      );
      return {
        ...(fallbackCat || {}),
        ...cat,
        image: cat.image || fallbackCat?.image || "",
      };
    });
  }, [categories, getRootCategories]);

  return (
    <div className="px-4 py-4">
      <h2 className="text-2xl md:text-3xl font-black font-heading text-brand-navy tracking-tight mb-4 leading-tight">
        Shop by Category
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:grid md:grid-cols-6 lg:grid-cols-8 md:gap-6 md:mx-0 md:px-0">
        {/* For You Custom Category */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0 }}
          className="flex-shrink-0">
          <Link
            to="/search"
            className="flex flex-col items-center gap-2 w-20 group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-orange-50 border border-[#D4AF37]/20">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">✨</span>
            </div>
            <span className="text-xs font-semibold text-brand-text text-center line-clamp-2">
              For You
            </span>
          </Link>
        </motion.div>

        {displayCategories.slice(0, 4).map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (index + 1) * 0.05 }}
            className="flex-shrink-0">
            <Link
              to={`/category/${category.id}`}
              className="flex flex-col items-center gap-2 w-20 group">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-card shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                <LazyImage
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/64x64?text=Category";
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-brand-text text-center line-clamp-2">
                {category.name}
              </span>
            </Link>
          </motion.div>
        ))}

        {/* See All Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 5 * 0.05 }}
          className="flex-shrink-0">
          <Link
            to="/categories"
            className="flex flex-col items-center gap-2 w-20 group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-card shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
              <span className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity">➡️</span>
            </div>
            <span className="text-xs font-semibold text-brand-text text-center line-clamp-2">
              See All
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileCategoryGrid;

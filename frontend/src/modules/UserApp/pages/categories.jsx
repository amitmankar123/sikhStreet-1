import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/Layout/MobileLayout";
import { categories } from "../../../data/categories";
import { useCategoryStore } from "../../../shared/store/categoryStore";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { categories: storeCategories, initialize: initCategories } = useCategoryStore();

  useEffect(() => {
    initCategories();
  }, [initCategories]);

  // Filter only root categories (those without a parentId)
  const rootCategories = (storeCategories.length > 0 ? storeCategories : categories).filter((cat) => {
    const parent = typeof cat.parentId === 'object' ? (cat.parentId?._id || cat.parentId?.id) : cat.parentId;
    return !parent;
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <MobileLayout hideBottomNav={false} showCartBar={true}>
      <div className="bg-[#fff8f5] min-h-screen w-full">
        {/* Header Section */}
        <section className="px-4 md:px-8 pt-6 pb-6 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#231a13] mb-3 leading-tight drop-shadow-sm">
            Explore Collections
          </h1>
          <p className="text-[#554336] text-base md:text-lg leading-relaxed max-w-2xl">
            Discover centuries of global craftsmanship, curated for the modern connoisseur.
          </p>
        </section>

        {/* Categories Grid */}
        <section className="px-4 md:px-8 pb-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {rootCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => navigate(`/category/${category.id}`)}
                className="group cursor-pointer flex flex-col w-full"
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-[#f2dfd3] shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-[#8d4b00]/10 border border-transparent group-hover:border-[#e9d7cb]">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>
                <span className="text-sm md:text-base font-semibold tracking-wide text-[#231a13] group-hover:text-[#8d4b00] transition-colors duration-300 text-left">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}

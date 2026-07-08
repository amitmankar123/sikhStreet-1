import { useState, useRef, useMemo, useEffect, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shirt, Laptop, LampFloor, LayoutTemplate, Flag, Gem, Sword, Book } from "lucide-react";

import { useCategoryStore } from "../../../../shared/store/categoryStore";

const MobileCategoryIcons = () => {
  const location = useLocation();
  const containerRef = useRef(null);
  const { categories, initialize, getRootCategories } = useCategoryStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const displayCategories = useMemo(() => {
    const roots = getRootCategories().filter((cat) => cat.isActive !== false);
    
    const mappedRoots = roots.map((cat) => {
      let icon = LayoutTemplate;
      const nameLower = String(cat.name || '').toLowerCase();
      
      if (nameLower.includes('turban') || nameLower.includes('dumala') || nameLower.includes('clothing') || nameLower.includes('wear') || nameLower.includes('pagri') || nameLower.includes('dastar')) {
        icon = Shirt;
      } else if (nameLower.includes('kakaar') || nameLower.includes('sword') || nameLower.includes('kirpan') || nameLower.includes('shaster')) {
        icon = Sword;
      } else if (nameLower.includes('accessory') || nameLower.includes('gem') || nameLower.includes('jewelry') || nameLower.includes('kara')) {
        icon = Gem;
      } else if (nameLower.includes('flag') || nameLower.includes('nishan')) {
        icon = Flag;
      } else if (nameLower.includes('book') || nameLower.includes('stationary') || nameLower.includes('sainchi')) {
        icon = Book;
      } else if (nameLower.includes('electronics') || nameLower.includes('gadget')) {
        icon = Laptop;
      } else if (nameLower.includes('home') || nameLower.includes('decor')) {
        icon = LampFloor;
      }

      return {
        id: cat.id || cat._id,
        name: cat.name,
        icon: icon
      };
    });

    return [
      { id: "for-you", name: "For You", icon: LayoutTemplate },
      ...mappedRoots
    ];
  }, [categories, getRootCategories]);

  const isActiveCategory = (categoryId) => {
    if (categoryId === "for-you") return location.pathname === "/home" || location.pathname === "/";
    if (location.pathname.includes(`/category/${categoryId}`)) return true;
    return false;
  };

  useLayoutEffect(() => {
    const container = containerRef.current?.querySelector('.overflow-x-auto');
    if (!container) return;

    const restoreScroll = () => {
      const savedScrollPos = sessionStorage.getItem('categoryNavScrollPos');
      if (savedScrollPos !== null) {
        container.scrollLeft = parseInt(savedScrollPos, 10);
      }
    };

    restoreScroll();
    const timerId = setTimeout(restoreScroll, 50);

    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        sessionStorage.setItem('categoryNavScrollPos', container.scrollLeft.toString());
      }, 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timerId);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const activeCategoryId = displayCategories.find(c => isActiveCategory(c.id))?.id;

  return (
    <div className="relative w-full" ref={containerRef}>
      <motion.div
        className="flex gap-2 overflow-x-auto scrollbar-hide px-2 items-start justify-start"
        style={{
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}>
        {displayCategories.map((category) => {
          const IconComponent = category.icon;
          const isActive = isActiveCategory(category.id);

          return (
            <div
              key={category.id}
              className="flex-shrink-0">
              <Link
                to={category.id === "for-you" ? "/home" : `/category/${category.id}`}
                className="flex flex-col items-center gap-1 w-14 relative"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? "bg-brand-saffron/10 shadow-sm" : "bg-slate-50 hover:bg-slate-100"}`}>
                  <IconComponent strokeWidth={1.8} size={18} className={isActive ? "text-brand-saffron" : "text-slate-600"} />
                </div>
                <span className={`text-[10px] font-bold text-center leading-tight mt-1 transition-colors ${isActive ? "text-brand-saffron" : "text-slate-500"}`}>
                  {category.name}
                </span>
              </Link>
            </div>
          );
        })}
      </motion.div>


    </div>
  );
};

export default MobileCategoryIcons;

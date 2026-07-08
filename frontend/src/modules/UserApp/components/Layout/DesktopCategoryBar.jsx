import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

const DesktopCategoryBar = () => {
    const { categories, initialize, getRootCategories } = useCategoryStore();
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const displayCategories = useMemo(() => {
        const roots = getRootCategories().filter((cat) => cat.isActive !== false);
        return roots;
    }, [categories, getRootCategories]);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (displayCategories.length === 0) return null;

    return (
        <div className="hidden md:block w-full bg-white text-slate-800 border-b border-slate-200 shadow-sm relative z-[998]">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-center relative">
                <div className="relative flex items-center overflow-hidden w-full max-w-4xl mx-auto">
                    {/* Left Scroll Button */}
                    <button 
                        onClick={() => scroll('left')}
                        className="absolute left-0 z-10 p-1 bg-gradient-to-r from-white via-white to-transparent hover:text-brand-saffron flex-shrink-0 transition-colors h-full flex items-center opacity-70 hover:opacity-100 pr-4"
                    >
                        <ChevronLeft size={22} strokeWidth={2.5} />
                    </button>

                    {/* Scroller */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 flex items-center justify-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide px-8 py-3 whitespace-nowrap scroll-smooth"
                        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                    >
                        {displayCategories.map((category) => (
                            <Link 
                                key={category.id} 
                                to={`/category/${category.id}`}
                                className="text-base font-black text-slate-800 hover:text-brand-saffron transition-colors flex-shrink-0 px-2 py-1 rounded-full hover:bg-slate-100"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right Scroll Button */}
                    <button 
                        onClick={() => scroll('right')}
                        className="absolute right-0 z-10 p-1 bg-gradient-to-l from-white via-white to-transparent hover:text-brand-saffron flex-shrink-0 transition-colors h-full flex items-center opacity-70 hover:opacity-100 pl-4"
                    >
                        <ChevronRight size={22} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DesktopCategoryBar;

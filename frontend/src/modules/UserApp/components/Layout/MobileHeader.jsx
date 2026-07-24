import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, X, User, Heart, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "../../../../data/categories";
import { useCartStore, useUIStore } from "../../../../shared/store/useStore";
import { useWishlistStore } from "../../../../shared/store/wishlistStore";
import { appLogo } from "../../../../data/logos";

const MobileHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("fashion");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsCategoryMenuOpen(false);
  }, [location]);

  const rootCategories = categories.filter((cat) => !cat.parentId);
  const activeCategory = rootCategories.find((c) => c.id === activeCategoryId) || rootCategories[0];
  const subcats = categories.filter((c) => c.parentId === activeCategory?.id);
  const displaySubcats = subcats.length > 0 ? subcats : [
    { id: activeCategory?.id, name: `Browse ${activeCategory?.name}`, image: activeCategory?.image }
  ];
  
  // Close search popover on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  const toggleCart = useUIStore((state) => state.toggleCart);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerContent = (
    <header
      className={`w-full bg-white border-b border-[#e8e8e8] transition-all duration-300 ${
        isScrolled ? "shadow-sm py-2" : "py-4"
      }`}
    >
      <div className="flex flex-col gap-3 px-6 md:px-12 w-full max-w-7xl mx-auto relative">
        {/* Row 1: Logo, Search Bar, and Action Icons */}
        <div className="flex justify-between items-center w-full gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform">
              <div className="flex items-center justify-center">
                <img
                  className="w-[140px] sm:w-[160px] h-auto object-contain mix-blend-multiply"
                  alt="Sikh Street logo"
                  src={appLogo.src}
                />
              </div>
            </Link>

            {/* Categories Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-sm font-semibold select-none ${
                  isCategoryMenuOpen 
                    ? "bg-[#F5A623]/10 text-[#F5A623] shadow-sm" 
                    : "text-neutral-700 hover:bg-gray-50 active:scale-95"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <span>Categories</span>
              </button>

              {/* Mega Dropdown Menu Overlay */}
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px]"
                      onClick={() => setIsCategoryMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-full left-0 mt-2 w-[560px] bg-white rounded-[2px] border border-neutral-200 shadow-2xl flex h-[360px] z-50 text-left overflow-hidden"
                    >
                      {/* Upward Caret pointing to the Categories button */}
                      <div className="absolute bottom-full left-[32px] w-3 h-3 bg-white border-t border-l border-neutral-200/80 transform rotate-45 translate-y-[7px] z-50" />

                      {/* Left Column: Categories List */}
                      <div className="w-[180px] flex-shrink-0 border-r border-neutral-100 bg-[#fcfbfa] py-2 overflow-y-auto hide-scrollbar">
                        {rootCategories.map((cat) => {
                          const isActive = activeCategoryId === cat.id;
                          return (
                            <div
                              key={cat.id}
                              onMouseEnter={() => setActiveCategoryId(cat.id)}
                              onClick={() => {
                                navigate(`/category/${cat.id}`);
                                setIsCategoryMenuOpen(false);
                              }}
                              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-xs font-semibold tracking-wide transition-all ${
                                isActive
                                  ? "bg-white text-black font-bold border-l-[3px] border-[#F5A623] pl-[13px] shadow-sm"
                                  : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
                              }`}
                            >
                              <span>{cat.name}</span>
                              <ChevronRight
                                size={12}
                                className={`transition-colors ${isActive ? "text-[#F5A623] stroke-[3]" : "text-neutral-400"}`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column: Subcategories Panel */}
                      <div className="flex-1 p-4 overflow-y-auto bg-white flex flex-col hide-scrollbar">
                        {activeCategory && (
                          <>
                            {/* Panel Header */}
                            <Link
                              to={`/category/${activeCategory.id}`}
                              onClick={() => setIsCategoryMenuOpen(false)}
                              className="text-xs font-bold text-neutral-800 hover:text-[#F5A623] inline-flex items-center gap-1.5 mb-4 group/all"
                            >
                              <span>All {activeCategory.name}</span>
                              <span className="transition-transform group-hover/all:translate-x-1 font-sans">&rarr;</span>
                            </Link>

                            {/* Subcategories Grid */}
                            <div className="grid grid-cols-3 gap-y-4 gap-x-3">
                              {displaySubcats.map((sub) => (
                                <div
                                  key={sub.id}
                                  onClick={() => {
                                    navigate(`/category/${sub.id}`);
                                    setIsCategoryMenuOpen(false);
                                  }}
                                  className="group cursor-pointer flex flex-col items-center text-center"
                                >
                                  <div className="w-[84px] h-[84px] rounded-none overflow-hidden mb-1.5 bg-[#fcfbfa] border border-neutral-100 shadow-sm transition-all duration-300 group-hover:scale-102 group-hover:shadow">
                                    <img
                                      src={sub.image}
                                      alt={sub.name}
                                      className="w-full h-full object-cover rounded-none"
                                      onError={(e) => {
                                        e.target.src = "https://placehold.co/100x100?text=" + encodeURIComponent(sub.name);
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-semibold text-neutral-800 leading-snug group-hover:text-[#F5A623] group-hover:underline transition-colors block px-0.5 text-center max-w-[84px]">
                                    {sub.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Search Bar (Inline Etsy Style) */}
          <div className="hidden md:flex flex-1 max-w-2xl relative items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
              placeholder="Search for anything"
              className="w-full bg-white border-2 border-gray-900 rounded-full py-2.5 pl-5 pr-14 text-sm outline-none transition-all placeholder-gray-500 font-sans shadow-sm"
            />
            <button
              onClick={() => searchQuery.trim() && navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
              className="absolute right-1 w-9 h-9 bg-[#F1641E] hover:bg-[#D54B0E] rounded-full flex items-center justify-center text-white transition-colors active:scale-95 shadow-sm"
            >
              <Search size={18} className="stroke-[2.5]" />
            </button>
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden z-50 text-left"
                >
                  <div className="p-3">
                    <h3 className="px-3 py-1.5 text-xs font-bold text-black">
                      Gifts as special as they are
                    </h3>
                    <div className="flex flex-col">
                      {categories.slice(0, 5).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            navigate(`/category/${cat.id}`);
                          }}
                          className="flex items-center gap-4 px-4 py-2 hover:bg-white rounded-xl transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-[#e9d7cb]">
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-medium text-black">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 relative flex-shrink-0">
            {/* Mobile Search Button */}
            <div className="block md:hidden">
              <button
                onClick={() => navigate("/search")}
                className="text-black hover:text-[#F5A623] flex items-center justify-center p-2 rounded-full hover:bg-[#F5A623]/10 hover:text-[#F5A623] transition-all active:scale-95"
              >
                <Search size={22} />
              </button>
            </div>

            {/* Wishlist Button */}
            <Link
              to="/wishlist"
              className="relative text-black hover:text-[#F5A623] flex items-center justify-center p-2 rounded-full hover:bg-[#F5A623]/10 hover:text-[#F5A623] transition-all active:scale-95"
              title="Wishlist"
            >
              <Heart size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Profile Button (Desktop Only) */}
            <button
              onClick={() => navigate("/profile")}
              className="hidden md:flex relative text-black hover:text-[#F5A623] items-center justify-center p-2 rounded-full hover:bg-[#F5A623]/10 hover:text-[#F5A623] transition-all active:scale-95"
            >
              <User size={22} />
            </button>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative text-black hover:text-[#F5A623] flex items-center justify-center p-2 rounded-full hover:bg-[#F5A623]/10 hover:text-[#F5A623] transition-all active:scale-95"
            >
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Desktop Navigation Links (Below Search) */}
        <nav className="hidden md:flex gap-8 items-center justify-start border-t border-gray-200/50 pt-2.5 w-full pl-12">
          <Link className="text-[11px] uppercase tracking-wider font-semibold text-black transition-colors hover:text-[#F5A623]" to="/category/books">
            Book & Literature
          </Link>
          <Link className="text-[11px] uppercase tracking-wider font-semibold text-black transition-colors hover:text-[#F5A623]" to="/home-favourites">
            Home Favourites
          </Link>
          <Link className="text-[11px] uppercase tracking-wider font-semibold text-black transition-colors hover:text-[#F5A623]" to="/category/fashion">
            Fashion Finds
          </Link>
          <Link className="text-[11px] uppercase tracking-wider font-semibold text-black transition-colors hover:text-[#F5A623]" to="/our-story">
            Our Story
          </Link>
        </nav>

      </div>
    </header>
  );

  return headerContent;
};

export default MobileHeader;

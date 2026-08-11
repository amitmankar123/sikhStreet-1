import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, X, User, Heart, ChevronRight, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "../../../../data/categories";
import { useCartStore, useUIStore } from "../../../../shared/store/useStore";
import { useWishlistStore } from "../../../../shared/store/wishlistStore";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { appLogo } from "../../../../data/logos";

// Mega menu layouts are dynamically built from the database/fallback categories

const MobileHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("fashion");
  const [hoveredNavId, setHoveredNavId] = useState(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { categories: storeCategories } = useCategoryStore();

  useEffect(() => {
    setIsCategoryMenuOpen(false);
    setHoveredNavId(null);
  }, [location]);

  const categoriesToUse = storeCategories && storeCategories.length > 0 ? storeCategories : categories;
  const rootCategories = categoriesToUse.filter((cat) => !cat.parentId);
  const activeCategory = rootCategories.find((c) => c.id === activeCategoryId) || rootCategories[0];
  const subcats = categoriesToUse.filter((c) => c.parentId === activeCategory?.id);
  const displaySubcats = subcats.length > 0 ? subcats : [
    { id: activeCategory?.id, name: `Browse ${activeCategory?.name}`, image: activeCategory?.image }
  ];

  const navItems = [
    { name: "Book & Literature", to: "/category/books", categoryId: "books" },
    { name: "Home Favourites", to: "/home-favourites" },
    { name: "Fashion Finds", to: "/category/fashion", categoryId: "fashion" },
    { name: "Our Story", to: "/our-story" }
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
      className={`w-full bg-white border-b border-[#e8e8e8] transition-all duration-300 ${isScrolled ? "shadow-sm py-2" : "py-4"
        }`}
    >
      <div className="flex flex-col gap-3 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative">
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
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className="block md:hidden text-black hover:text-[#F5A623] flex items-center justify-center p-2 rounded-full hover:bg-[#F5A623]/10 transition-all active:scale-95"
            >
              <Menu size={24} />
            </button>

            {/* Wishlist Button (Desktop Only) */}
            <Link
              to="/wishlist"
              className="hidden md:flex relative text-black hover:text-[#F5A623] items-center justify-center p-2 rounded-full hover:bg-[#F5A623]/10 transition-all active:scale-95"
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
              className="hidden md:flex relative text-black hover:text-[#F5A623] items-center justify-center p-2 rounded-full hover:bg-[#F5A623]/10 transition-all active:scale-95"
            >
              <User size={22} />
            </button>

            {/* Cart Button (Desktop Only) */}
            <button
              onClick={toggleCart}
              className="hidden md:flex relative text-black hover:text-[#F5A623] flex items-center justify-center p-2 rounded-full hover:bg-[#F5A623]/10 hover:text-[#F5A623] transition-all active:scale-95"
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
        <nav className="hidden md:flex gap-[3%] items-center justify-start border-t border-gray-200/50 pt-2.5 w-full pl-3.5">
          {navItems.map((item) => {
            const itemSubcategories = item.categoryId
              ? categoriesToUse.filter((cat) => {
                const normalizedParent = typeof cat.parentId === 'object'
                  ? (cat.parentId?._id ?? cat.parentId?.id ?? null)
                  : cat.parentId;
                return String(normalizedParent) === String(item.categoryId) && cat.isActive !== false;
              })
              : [];

            // Dynamically construct megaMenuLayout if there are sub-subcategories (topics)
            const megaMenuLayout = (() => {
              if (!item.categoryId) return null;
              
              // 1. Get all subcategories of the active category
              const subs = categoriesToUse.filter((cat) => {
                const normalizedParent = typeof cat.parentId === 'object'
                  ? (cat.parentId?._id ?? cat.parentId?.id ?? null)
                  : cat.parentId;
                return String(normalizedParent) === String(item.categoryId) && cat.isActive !== false;
              });

              // 2. Check if any subcategory has active child categories (Level 3 topics)
              const hasLevel3 = subs.some((sub) =>
                categoriesToUse.some((cat) => {
                  const normalizedParent = typeof cat.parentId === 'object'
                    ? (cat.parentId?._id ?? cat.parentId?.id ?? null)
                    : cat.parentId;
                  return String(normalizedParent) === String(sub.id || sub._id) && cat.isActive !== false;
                })
              );

              // 3. If there are level 3 child categories or it is the fashion category, dynamically build a 5-column layout
              if (hasLevel3 || item.categoryId === "fashion") {
                const sections = subs.map((sub) => {
                  let topics = categoriesToUse
                    .filter((cat) => {
                      const normalizedParent = typeof cat.parentId === 'object'
                        ? (cat.parentId?._id ?? cat.parentId?.id ?? null)
                        : cat.parentId;
                      return String(normalizedParent) === String(sub.id || sub._id) && cat.isActive !== false;
                    })
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((cat) => cat.name);

                  // Fallback topics for fashion if none in DB to match books mega menu look
                  if (topics.length === 0 && item.categoryId === "fashion") {
                    const fallbackMap = {
                      "patkas": ["Single Patka", "Double Patka", "Kids Patka", "Premium Voile"],
                      "dastar-accessories": ["Turban Pins", "Fifty", "Salai / Baaj", "Baaj Needle"],
                      "sikh-inspired-clothing": ["Graphic Tees", "Sweatshirts", "Kids Tees", "Gurmat Quotes"],
                      "hoodies": ["Winter Hoodies", "Pullover", "Zip-up", "Oversized"],
                      "t-shirts": ["Casual Tees", "Printed T-shirts", "Polo Shirts", "V-Neck"],
                      "jackets": ["Windbreakers", "Winter Jackets", "Coats", "Bomber Jackets"],
                      "scarves": ["Dupatta", "Shawls", "Chunri", "Rumal"],
                      "children's-clothing": ["Kids Patkas", "Kids Tees", "Infant Rompers", "Frock Patkas"]
                    };
                    const subIdString = String(sub.id || sub._id || "");
                    topics = fallbackMap[subIdString] || [];
                  }

                  return {
                    title: sub.name,
                    id: sub.id || sub._id,
                    topics: topics
                  };
                });

                // Distribute sections across 5 columns
                const numCols = 5;
                const cols = Array.from({ length: numCols }, () => []);
                sections.forEach((section, index) => {
                  cols[index % numCols].push(section);
                });
                return cols;
              }
              return null;
            })();

            const isHovered = hoveredNavId === item.name;

            return (
              <div
                key={item.name}
                className={`py-1 ${megaMenuLayout ? "" : "relative"}`}
                onMouseEnter={() => setHoveredNavId(item.name)}
                onMouseLeave={() => setHoveredNavId(null)}
              >
                <Link
                  className={`text-[11px] uppercase tracking-wider font-semibold transition-colors duration-200 ${isHovered ? "text-[#F5A623]" : "text-black"
                    }`}
                  to={item.to}
                >
                  {item.name}
                </Link>

                <AnimatePresence>
                  {isHovered && (
                    <>
                      {megaMenuLayout ? (
                        /* Myntra-style full-width mega menu dropdown */
                        <div className="absolute left-16 right-8 top-full pt-1.5 z-[1000]">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="w-full bg-white border border-neutral-200 shadow-xl px-8 py-6 grid grid-cols-5 gap-6 text-left rounded-none font-sans"
                          >
                            {megaMenuLayout.map((column, colIdx) => (
                              <div key={colIdx} className="flex flex-col gap-6">
                                {column.map((section) => (
                                  <div key={section.id}>
                                    {/* Header: Subcategory */}
                                    <Link
                                      to={`/category/${section.id}`}
                                      onClick={() => setHoveredNavId(null)}
                                      className="text-[#F5A623] hover:text-[#d48817] font-bold text-xs uppercase tracking-wider mb-2.5 block transition-colors duration-150"
                                    >
                                      {section.title}
                                    </Link>
                                    {/* List: Topics */}
                                    <div className="flex flex-col gap-0.5">
                                      {section.topics && section.topics.map((topic) => (
                                        <Link
                                          key={topic}
                                          to={`/category/${section.id}?topic=${encodeURIComponent(topic)}`}
                                          onClick={() => setHoveredNavId(null)}
                                          className="text-neutral-600 hover:text-black font-medium text-[11px] py-1 block transition-colors duration-150 cursor-pointer"
                                        >
                                          {topic}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </motion.div>
                        </div>
                      ) : (
                        itemSubcategories.length > 0 && (
                          /* Standard dropdown for other categories */
                          <div className="absolute left-0 top-full pt-2 z-[1000]">
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="w-[440px] bg-white border border-neutral-200 shadow-xl rounded-none p-4 relative grid grid-cols-2 gap-2 text-left"
                            >

                              {itemSubcategories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  to={`/category/${sub.id}`}
                                  onClick={() => setHoveredNavId(null)}
                                  className="group/sub flex items-center gap-3 p-2 border border-transparent hover:border-neutral-100 hover:bg-neutral-50 transition-all duration-200"
                                >
                                  <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center rounded-none">
                                    <img
                                      src={sub.image}
                                      alt={sub.name}
                                      className="w-full h-full object-cover rounded-none"
                                      onError={(e) => {
                                        e.target.src = "https://placehold.co/40x40?text=" + encodeURIComponent(sub.name);
                                      }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-bold tracking-wide text-neutral-800 group-hover/sub:text-[#F5A623] transition-colors line-clamp-2">
                                    {sub.name}
                                  </span>
                                </Link>
                              ))}
                            </motion.div>
                          </div>
                        )
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

      </div>
    </header>
  );

  return (
    <>
      {headerContent}
      {createPortal(
        <AnimatePresence>
          {isCategoryMenuOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1999] bg-black/50 backdrop-blur-sm"
                onClick={() => setIsCategoryMenuOpen(false)}
              />
              {/* Sliding Drawer Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
                className="fixed top-0 right-0 h-full w-[310px] sm:w-[360px] bg-white z-[2000] shadow-2xl flex flex-col text-left font-sans"
              >
                {/* Drawer Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-neutral-100">
                  <span className="text-base font-bold text-neutral-800">Menu</span>
                  <button
                    onClick={() => setIsCategoryMenuOpen(false)}
                    className="text-neutral-500 hover:text-black p-1 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* 1. Quick Navigation Links */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Quick Links</span>
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/"
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="text-sm font-semibold text-neutral-700 hover:text-[#F5A623] py-1 transition-colors"
                      >
                        Home
                      </Link>
                      {navItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.to}
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="text-sm font-semibold text-neutral-700 hover:text-[#F5A623] py-1 transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* 2. Shop Categories (Accordion style) */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Shop By Category</span>
                    <div className="flex flex-col">
                      {rootCategories
                        .filter((cat) => {
                          const idStr = String(cat.id || cat._id || "").toLowerCase();
                          return !navItems.some(
                            (item) => item.categoryId && String(item.categoryId).toLowerCase() === idStr
                          );
                        })
                        .map((cat) => {
                          const isExpanded = expandedCategoryId === cat.id;
                          const itemSubcats = categoriesToUse.filter((c) => c.parentId === cat.id);
                        return (
                          <div key={cat.id} className="border-b border-neutral-100/70 last:border-0 py-2.5">
                            <div
                              onClick={() => {
                                if (itemSubcats.length > 0) {
                                  setExpandedCategoryId(isExpanded ? null : cat.id);
                                } else {
                                  navigate(`/category/${cat.id}`);
                                  setIsCategoryMenuOpen(false);
                                }
                              }}
                              className="flex justify-between items-center cursor-pointer py-1 select-none"
                            >
                              <span className="text-sm font-medium text-neutral-800 hover:text-[#F5A623] transition-colors">
                                {cat.name}
                              </span>
                              {itemSubcats.length > 0 && (
                                <ChevronRight
                                  size={16}
                                  className={`text-neutral-400 transition-transform duration-200 ${
                                    isExpanded ? "rotate-90 text-[#F5A623]" : ""
                                  }`}
                                />
                              )}
                            </div>
                            
                            {/* Expandable subcategories */}
                            {isExpanded && itemSubcats.length > 0 && (
                              <div className="overflow-hidden pl-4 mt-2 flex flex-col gap-2 border-l-2 border-[#F5A623]/20">
                                {itemSubcats.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    to={`/category/${sub.id}`}
                                    onClick={() => setIsCategoryMenuOpen(false)}
                                    className="text-xs text-neutral-600 hover:text-black py-1 transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Account / User Actions */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-neutral-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Account</span>
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="text-sm font-semibold text-neutral-700 hover:text-[#F5A623] py-1 transition-colors flex items-center gap-2"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="text-sm font-semibold text-neutral-700 hover:text-[#F5A623] py-1 transition-colors flex items-center justify-between"
                      >
                        <span>Wishlist</span>
                        {wishlistCount > 0 && (
                          <span className="bg-[#F5A623]/10 text-[#F5A623] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>
                      <button
                        onClick={() => {
                          setIsCategoryMenuOpen(false);
                          toggleCart();
                        }}
                        className="text-sm font-semibold text-neutral-700 hover:text-[#F5A623] py-1 transition-colors flex items-center justify-between w-full text-left"
                      >
                        <span>Cart</span>
                        {itemCount > 0 && (
                          <span className="bg-[#F5A623]/10 text-[#F5A623] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {itemCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-5 border-t border-neutral-100 bg-neutral-50 text-center">
                  <span className="text-[10px] text-neutral-400 font-medium tracking-wide">
                    © {new Date().getFullYear()} SikhStreet. All rights reserved.
                  </span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default MobileHeader;

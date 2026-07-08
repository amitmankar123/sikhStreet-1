import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "../../../../data/categories";
import { useCartStore, useUIStore } from "../../../../shared/store/useStore";

const MobileHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Close search popover on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const itemCount = useCartStore((state) => state.getItemCount());
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
      className={`fixed top-0 w-full z-50 bg-[#fff8f5]/85 backdrop-blur-lg border-b border-[#e8e8e8] transition-all duration-300 ${isScrolled ? "shadow-sm py-2" : "py-4"
        }`}
    >
      <div className="flex justify-between items-center px-6 md:px-12 w-full max-w-7xl mx-auto">
        {/* Left Side: Logo and Title */}
        <Link to="/home" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-[#8d4b00]/10 p-1">
            <img
              className="w-full h-full object-contain"
              alt="Sikh Street logo"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_QtluDyTyyTERMfRfd830u3RcIkF7aJHRbM37FYnRFNCY01_N74tx3WAK0zGIr3PEXlqhIdcITnhHLXC5x87LHZKdO0BvuQbZI88UlL9d0hYbgyyGowhWYN-gBgtlmM2Rr0o6e4YSkF9e4x6vS7jZY4SqZ65AXuXlAHqSnNDUs613UTccW7ylV1CyRVm_9MFrt9ceJxGerEQ2cFT2rZUFNVaq3a900_TuKdoUrotAgb_cjLr3F4-CNsxx4qut7UFp75j3KGaXtxvHxG8"
            />
          </div>
          <span className="text-xl font-bold text-[#8d4b00] tracking-wide ml-1">
            Sikh Street
          </span>
        </Link>

        {/* Center: Desktop Navigation links */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link className="text-sm font-semibold text-[#8d4b00] transition-colors hover:text-[#6e3900]" to="/home">
            Home
          </Link>
          <Link className="text-sm font-semibold text-[#554336] transition-colors hover:text-[#8d4b00]" to="/categories">
            Collections
          </Link>
          <button
            onClick={() => {
              const makerSection = document.getElementById("maker-section");
              if (makerSection) {
                makerSection.scrollIntoView({ behavior: "smooth" });
              } else {
                navigate("/home");
                setTimeout(() => {
                  const sect = document.getElementById("maker-section");
                  if (sect) sect.scrollIntoView({ behavior: "smooth" });
                }, 200);
              }
            }}
            className="text-sm font-semibold text-[#554336] transition-colors hover:text-[#8d4b00] outline-none"
          >
            Artisans
          </button>
          <Link className="text-sm font-semibold text-[#554336] transition-colors hover:text-[#8d4b00]" to="/brand/heritage-forge">
            Our Story
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4 relative">
          {/* Search Button */}
          <div className={location.pathname === "/search" ? "hidden md:block" : "block"}>
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  navigate("/search");
                } else {
                  setIsSearchOpen((prev) => !prev);
                }
              }}
              className="text-[#554336] hover:text-[#8d4b00] flex items-center justify-center p-2 rounded-full hover:bg-[#8d4b00]/5 transition-all active:scale-95"
            >
              {isSearchOpen ? <X size={22} /> : <Search size={22} />}
            </button>
          </div>

          {/* Desktop Search Popover (Etsy Style) */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-4 w-[450px] bg-white rounded-2xl shadow-2xl border border-[#e9d7cb] overflow-hidden hidden md:block"
              >
                <div className="p-4 border-b border-[#e9d7cb]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          setIsSearchOpen(false);
                          navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                        }
                      }}
                      placeholder="Search for anything"
                      className="w-full bg-[#f8f8f8] border border-transparent focus:border-[#8d4b00] focus:bg-white rounded-full py-3 pl-10 pr-4 text-sm outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="p-2">
                  <h3 className="px-4 py-2 text-sm font-bold text-[#231a13]">
                    Gifts as special as they are
                  </h3>
                  <div className="flex flex-col">
                    {categories.slice(0, 5).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/category/${cat.id}`);
                        }}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-[#fff8f5] rounded-xl transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#e9d7cb]">
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-[#554336]">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Button (Desktop Only) */}
          <button
            onClick={() => navigate("/profile")}
            className="hidden md:flex relative text-[#554336] hover:text-[#8d4b00] items-center justify-center p-2 rounded-full hover:bg-[#8d4b00]/5 transition-all active:scale-95"
          >
            <User size={22} />
          </button>

          {/* Cart Button */}
          <button
            onClick={toggleCart}
            className="relative text-[#554336] hover:text-[#8d4b00] flex items-center justify-center p-2 rounded-full hover:bg-[#8d4b00]/5 transition-all active:scale-95"
          >
            <ShoppingCart size={22} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#8d4b00] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <>
      {typeof document !== "undefined" &&
        createPortal(headerContent, document.body)}
    </>
  );
};

export default MobileHeader;

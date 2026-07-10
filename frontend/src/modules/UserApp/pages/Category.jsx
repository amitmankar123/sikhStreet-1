import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiFilter, FiArrowLeft, FiGrid, FiList, FiX, FiSearch, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import MobileLayout from "../components/Layout/MobileLayout";
import ProductCard from "../../../shared/components/ProductCard";
import ProductListItem from "../components/Mobile/ProductListItem";
import { getCatalogProducts } from "../data/catalogData";
import { categories as fallbackCategories } from "../../../data/categories";
import { useCategoryStore } from "../../../shared/store/categoryStore";
import PageTransition from "../../../shared/components/PageTransition";
import useInfiniteScroll from "../../../shared/hooks/useInfiniteScroll";
import LazyImage from "../../../shared/components/LazyImage";
import { getPlaceholderImage } from "../../../shared/utils/helpers";
import api from "../../../shared/utils/api";
import TurbanLoader from "../../../shared/components/loaderanimation/TurbanLoader";

const normalizeId = (value) => String(value ?? "").trim();

const getParentId = (category) => {
  const parent = category?.parentId;
  if (!parent) return null;
  if (typeof parent === "object") {
    return normalizeId(parent?._id ?? parent?.id ?? "");
  }
  return normalizeId(parent);
};

const normalizeProduct = (raw) => {
  const vendorObj =
    raw?.vendor && typeof raw.vendor === "object"
      ? raw.vendor
      : raw?.vendorId && typeof raw.vendorId === "object"
        ? raw.vendorId
        : null;
  const brandObj =
    raw?.brand && typeof raw.brand === "object"
      ? raw.brand
      : raw?.brandId && typeof raw.brandId === "object"
        ? raw.brandId
        : null;
  const categoryObj =
    raw?.category && typeof raw.category === "object"
      ? raw.category
      : raw?.categoryId && typeof raw.categoryId === "object"
        ? raw.categoryId
        : null;

  const id = normalizeId(raw?.id || raw?._id);

  return {
    ...raw,
    id,
    _id: id,
    vendorId: normalizeId(vendorObj?._id || vendorObj?.id || raw?.vendorId),
    vendorName: raw?.vendorName || vendorObj?.storeName || vendorObj?.name || "",
    brandId: normalizeId(brandObj?._id || brandObj?.id || raw?.brandId),
    brandName: raw?.brandName || brandObj?.name || "",
    categoryId: normalizeId(categoryObj?._id || categoryObj?.id || raw?.categoryId),
    categoryName: raw?.categoryName || categoryObj?.name || "",
    image: raw?.image || raw?.images?.[0] || "",
    images: Array.isArray(raw?.images)
      ? raw.images
      : raw?.image
        ? [raw.image]
        : [],
    price: Number(raw?.price) || 0,
    rating: Number(raw?.rating) || 0,
  };
};

const CATEGORY_THEMES = {
  decor: {
    bodyBackground: "linear-gradient(135deg, #FAF5F0 0%, #F4EBE1 50%, #EAECEF 100%)",
    accentColor: "text-[#8B5E3C]",
    accentBg: "bg-[#8B5E3C]/10",
    accentBorder: "border-[#8B5E3C]/20",
    hoverBg: "hover:bg-[#8B5E3C]/10",
    primaryButton: "bg-[#8B5E3C] hover:bg-[#704B30]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#8B5E3C]/20 ring-2 ring-[#8B5E3C]/30",
    searchPlaceholder: 'Search "Paintings", "Wall Clocks", "Gurbani Frames"...',
    searchFocusBorder: "focus:border-[#8B5E3C] focus:ring-[#8B5E3C]/30",
    badgeColor: "text-[#8B5E3C] bg-[#8B5E3C]/10",
    headerBg: "bg-[#FAF5F0]/80",
    name: "Art & Decor"
  },
  turbans: {
    bodyBackground: "linear-gradient(135deg, #FFFDF9 0%, #FFF3E6 50%, #FFEAD2 100%)",
    accentColor: "text-[#E65100]",
    accentBg: "bg-[#E65100]/10",
    accentBorder: "border-[#E65100]/20",
    hoverBg: "hover:bg-[#E65100]/10",
    primaryButton: "bg-[#E65100] hover:bg-[#C84500]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#E65100]/20 ring-2 ring-[#E65100]/30",
    searchPlaceholder: 'Search "Full Voile", "Rubia", "Parna", "Double Patti"...',
    searchFocusBorder: "focus:border-[#E65100] focus:ring-[#E65100]/30",
    badgeColor: "text-[#E65100] bg-[#E65100]/10",
    headerBg: "bg-[#FFFDF9]/80",
    name: "Turbans"
  },
  sacred: {
    bodyBackground: "linear-gradient(135deg, #F0F5FA 0%, #E4EEF8 50%, #FFFFFF 100%)",
    accentColor: "text-[#1E40AF]",
    accentBg: "bg-[#1E40AF]/10",
    accentBorder: "border-[#1E40AF]/20",
    hoverBg: "hover:bg-[#1E40AF]/10",
    primaryButton: "bg-[#1E40AF] hover:bg-[#1C3D9F]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#1E40AF]/20 ring-2 ring-[#1E40AF]/30",
    searchPlaceholder: 'Search "Chandoa Sahib", "Rumala Sahib", "Degh", "Nishan Flags"...',
    searchFocusBorder: "focus:border-[#1E40AF] focus:ring-[#1E40AF]/30",
    badgeColor: "text-[#1E40AF] bg-[#1E40AF]/10",
    headerBg: "bg-[#F0F5FA]/80",
    name: "Sacred Devotional"
  },
  kakaars: {
    bodyBackground: "linear-gradient(135deg, #F1F3F5 0%, #E9ECEF 50%, #DEE2E6 100%)",
    accentColor: "text-[#495057]",
    accentBg: "bg-[#495057]/10",
    accentBorder: "border-[#495057]/20",
    hoverBg: "hover:bg-[#495057]/10",
    primaryButton: "bg-[#495057] hover:bg-[#343A40]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#495057]/20 ring-2 ring-[#495057]/30",
    searchPlaceholder: 'Search "Sarbloh Kara", "Wooden Kanga", "Kirpan", "Kachera"...',
    searchFocusBorder: "focus:border-[#495057] focus:ring-[#495057]/30",
    badgeColor: "text-[#495057] bg-[#495057]/10",
    headerBg: "bg-[#F1F3F5]/80",
    name: "Sacred Kakaars"
  },
  musical: {
    bodyBackground: "linear-gradient(135deg, #FAF6F0 0%, #F2ECE4 50%, #E6DCCF 100%)",
    accentColor: "text-[#5D4037]",
    accentBg: "bg-[#5D4037]/10",
    accentBorder: "border-[#5D4037]/20",
    hoverBg: "hover:bg-[#5D4037]/10",
    primaryButton: "bg-[#5D4037] hover:bg-[#4E342E]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#5D4037]/20 ring-2 ring-[#5D4037]/30",
    searchPlaceholder: 'Search "Harmonium", "Tabla", "Dilruba", "Jodi"...',
    searchFocusBorder: "focus:border-[#5D4037] focus:ring-[#5D4037]/30",
    badgeColor: "text-[#5D4037] bg-[#5D4037]/10",
    headerBg: "bg-[#FAF6F0]/80",
    name: "Musical Instruments"
  },
  electronics: {
    bodyBackground: "linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 50%, #F7FAFC 100%)",
    accentColor: "text-[#102A43]",
    accentBg: "bg-[#102A43]/10",
    accentBorder: "border-[#102A43]/20",
    hoverBg: "hover:bg-[#102A43]/10",
    primaryButton: "bg-[#102A43] hover:bg-[#0C1B2A]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#102A43]/20 ring-2 ring-[#102A43]/30",
    searchPlaceholder: 'Search "Speakers", "Audio Players", "Media Devices"...',
    searchFocusBorder: "focus:border-[#102A43] focus:ring-[#102A43]/30",
    badgeColor: "text-[#102A43] bg-[#102A43]/10",
    headerBg: "bg-[#F0F4F8]/80",
    name: "Electronics"
  },
  fashion: {
    bodyBackground: "linear-gradient(135deg, #FFF5F7 0%, #FFF0F3 50%, #FFE3E8 100%)",
    accentColor: "text-[#DB2777]",
    accentBg: "bg-[#DB2777]/10",
    accentBorder: "border-[#DB2777]/20",
    hoverBg: "hover:bg-[#DB2777]/10",
    primaryButton: "bg-[#DB2777] hover:bg-[#BE185D]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#DB2777]/20 ring-2 ring-[#DB2777]/30",
    searchPlaceholder: 'Search "Kurtas", "Graphic Tees", "Jackets", "Scarves"...',
    searchFocusBorder: "focus:border-[#DB2777] focus:ring-[#DB2777]/30",
    badgeColor: "text-[#DB2777] bg-[#DB2777]/10",
    headerBg: "bg-[#FFF5F7]/80",
    name: "Fashion"
  },
  langar: {
    bodyBackground: "linear-gradient(135deg, #FFF9F5 0%, #FFF4EC 50%, #FFEAD8 100%)",
    accentColor: "text-[#C92A2A]",
    accentBg: "bg-[#C92A2A]/10",
    accentBorder: "border-[#C92A2A]/20",
    hoverBg: "hover:bg-[#C92A2A]/10",
    primaryButton: "bg-[#C92A2A] hover:bg-[#A61E1E]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#C92A2A]/20 ring-2 ring-[#C92A2A]/30",
    searchPlaceholder: 'Search "Steel Plates", "Bata", "Serving Spoons", "Langar Tandoor"...',
    searchFocusBorder: "focus:border-[#C92A2A] focus:ring-[#C92A2A]/30",
    badgeColor: "text-[#C92A2A] bg-[#C92A2A]/10",
    headerBg: "bg-[#FFF9F5]/80",
    name: "Langar Hall"
  },
  default: {
    bodyBackground: "linear-gradient(135deg, #F8F9FA 0%, #FFFBF5 50%, #F1F3F5 100%)",
    accentColor: "text-[#FF7A1A]",
    accentBg: "bg-[#FF7A1A]/10",
    accentBorder: "border-[#FF7A1A]/20",
    hoverBg: "hover:bg-[#FF7A1A]/10",
    primaryButton: "bg-[#0A192F] hover:bg-[#122B4D]",
    primaryButtonText: "text-white",
    iconOutline: "shadow-[#0A192F]/20 ring-2 ring-[#0A192F]/30",
    searchPlaceholder: 'Search in this category...',
    searchFocusBorder: "focus:border-[#0A192F] focus:ring-[#0A192F]/30",
    badgeColor: "text-[#FF7A1A] bg-[#FF7A1A]/10",
    headerBg: "bg-white",
    name: "Default"
  }
};

const getCategoryTheme = (category) => {
  if (!category) return CATEGORY_THEMES.default;
  const name = (category.name || "").toLowerCase();
  const idStr = String(category.id || "").toLowerCase();
  const parentIdStr = String(category.parentId || "").toLowerCase();

  if (idStr === "6" || name.includes("decor") || name.includes("art") || name.includes("collection")) {
    return CATEGORY_THEMES.decor;
  }
  if (idStr === "turbans" || parentIdStr === "turbans" || name.includes("turban") || name.includes("dastar")) {
    return CATEGORY_THEMES.turbans;
  }
  if (
    idStr === "10" || idStr === "11" || idStr === "1" ||
    name.includes("gurudwara") || name.includes("prakash") || name.includes("sewa") || name.includes("nishan")
  ) {
    return CATEGORY_THEMES.sacred;
  }
  if (idStr === "4" || parentIdStr === "4" || name.includes("kakaar") || name.includes("kara") || name.includes("kirpan") || name.includes("kanga")) {
    return CATEGORY_THEMES.kakaars;
  }
  if (idStr === "7" || name.includes("music") || name.includes("instrument") || name.includes("dilruba") || name.includes("harmonium")) {
    return CATEGORY_THEMES.musical;
  }
  if (idStr === "electronics" || idStr === "9" || name.includes("electronic") || name.includes("digital") || name.includes("laptop")) {
    return CATEGORY_THEMES.electronics;
  }
  if (idStr === "fashion" || idStr === "3" || parentIdStr === "fashion" || name.includes("fashion") || name.includes("clothing") || name.includes("hoodie") || name.includes("shirt")) {
    return CATEGORY_THEMES.fashion;
  }
  if (idStr === "12" || name.includes("langar") || name.includes("kitchen") || name.includes("supply")) {
    return CATEGORY_THEMES.langar;
  }

  return CATEGORY_THEMES.default;
};

const MobileCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const categoryId = normalizeId(id);
  const { categories, initialize, getCategoryById } = useCategoryStore();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const prevCategoryIdRef = useRef();
  const loadStartTimeRef = useRef(0);

  // Initialize store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Get category from store or fallback
  const category = useMemo(() => {
    const cat = getCategoryById(categoryId);
    return (
      cat ||
      fallbackCategories.find((fallbackCat) => {
        const fallbackId = normalizeId(fallbackCat.id);
        return (
          fallbackId === categoryId ||
          fallbackCat.name?.toLowerCase() === categoryId.toLowerCase()
        );
      })
    );
  }, [categoryId, categories, getCategoryById]);

  const activeTheme = useMemo(() => getCategoryTheme(category), [category]);

  const isTurbanCategory = useMemo(() => {
    const name = (category?.name || "").toLowerCase();
    const idStr = String(categoryId || "").toLowerCase();
    const parentIdStr = category ? String(getParentId(category) || "").toLowerCase() : "";
    return idStr === "turbans" || parentIdStr === "turbans" || name.includes("turban") || name.includes("dastar");
  }, [category, categoryId]);

  // Apply visual category theme to the body background
  useEffect(() => {
    document.body.style.transition = "background 0.6s ease-in-out, background-color 0.6s ease-in-out";
    document.body.style.background = activeTheme.bodyBackground;

    return () => {
      document.body.style.background = "";
      document.body.style.transition = "";
    };
  }, [activeTheme]);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [categoryProductsFeed, setCategoryProductsFeed] = useState([]);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minRating: "",
    material: [],
    radius: "25",
    color: "",
    clothType: "",
    sizeInMeters: "",
    sortBy: "newest",
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipingBack, setIsSwipingBack] = useState(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubcategoryChange = (subId) => {
    if (subId === selectedSubcategoryId) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedSubcategoryId(subId);
      setIsTransitioning(false);
    }, 200);
  };

  useEffect(() => {
    setIsTransitioning(true);
    setSelectedSubcategoryId(null);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [categoryId]);

  const subcategories = useMemo(() => {
    const allCats = [...(categories || []), ...(fallbackCategories || [])].filter(Boolean);
    const uniqueCats = Array.from(new Map(allCats.map(c => [c.id, c])).values());
    return uniqueCats.filter(cat => getParentId(cat) === categoryId);
  }, [categories, categoryId]);

  const gridRef = useRef(null);

  const parentIdForSwipe = category ? getParentId(category) : null;

  useEffect(() => {
    if (!parentIdForSwipe) return;

    // Disable native pull-to-refresh
    document.body.style.overscrollBehaviorY = 'none';

    let touchStartY = 0;

    const handleTouchStart = (e) => {
      // Allow minor scroll variance
      if (window.scrollY <= 5) {
        touchStartY = e.changedTouches[0].screenY;
      } else {
        touchStartY = 0;
      }
    };

    const handleTouchMove = (e) => {
      if (touchStartY > 0 && window.scrollY <= 5) {
        const touchCurrentY = e.changedTouches[0].screenY;
        const distance = touchCurrentY - touchStartY;
        if (distance > 0) {
          // Add drag resistance
          setSwipeOffset(distance * 0.4);
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (touchStartY > 0) {
        const touchEndY = e.changedTouches[0].screenY;
        const distance = touchEndY - touchStartY;

        // If swiped down heavily
        if (distance > 120) {
          setIsSwipingBack(true);
          setSwipeOffset(window.innerHeight); // slide all the way down
          setTimeout(() => {
            navigate(`/category/${parentIdForSwipe}`);
          }, 250);
        } else {
          // Snap back
          setSwipeOffset(0);
        }
      }
      touchStartY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.body.style.overscrollBehaviorY = '';
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [parentIdForSwipe, navigate]);

  useEffect(() => {
    let cancelled = false;

    const fetchCategoryProducts = async () => {
      const isNewCategory = prevCategoryIdRef.current !== categoryId;
      if (isNewCategory) {
        setIsInitialLoading(true);
        prevCategoryIdRef.current = categoryId;
        loadStartTimeRef.current = Date.now();
      }

      // Check if it is a turban category/collection
      const isTurban = 
        categoryId === "turbans" || 
        (category && getParentId(category) === "turbans") || 
        (category?.name?.toLowerCase().includes("turban")) || 
        (category?.name?.toLowerCase().includes("dastar"));

      // 4.0s minimum display duration to showcase the stagger GSAP particles properly
      let minDelay = 0;
      if (isTurban && isInitialLoading) {
        const elapsedTime = Date.now() - loadStartTimeRef.current;
        minDelay = Math.max(0, 4000 - elapsedTime);
      }
      const minTimer = new Promise((resolve) => setTimeout(resolve, minDelay));

      if (!categoryId) {
        if (!cancelled) {
          setCategoryProductsFeed([]);
        }
        await minTimer;
        if (!cancelled) {
          setIsInitialLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/products", {
          params: {
            category: categoryId,
            page: 1,
            limit: 200,
            sort: "newest",
          },
        });
        const payload = response?.data ?? response;
        const products = Array.isArray(payload?.products) ? payload.products : [];
        if (cancelled) return;

        setCategoryProductsFeed(
          products.map(normalizeProduct).filter((product) => product.id)
        );
      } catch (err) {
        console.warn("Backend category products failed, using fallback:", err);
        if (cancelled) return;

        const fallback = getCatalogProducts().filter((product) => {
          const productCategoryId = normalizeId(product.categoryId);

          const allCats = [...(categories || []), ...(fallbackCategories || [])].filter(Boolean);
          const isDescendant = (catId, targetId) => {
            if (catId === targetId) return true;
            const cat = allCats.find(c => normalizeId(c.id) === catId);
            if (!cat) return false;
            const pId = getParentId(cat);
            if (!pId) return false;
            return isDescendant(pId, targetId);
          };

          return isDescendant(productCategoryId, categoryId);
        });

        setCategoryProductsFeed(fallback);
      } finally {
        await minTimer;
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchCategoryProducts();
    return () => {
      cancelled = true;
    };
  }, [categoryId, categories, category]);

  const rootCategories = useMemo(() => {
    const roots = categories.filter(
      (cat) => !getParentId(cat) && cat.isActive !== false
    );
    if (roots.length) return roots;
    return fallbackCategories;
  }, [categories]);

  const categoryProducts = useMemo(() => {
    if (!category) return [];
    let result = [...categoryProductsFeed];

    if (selectedSubcategoryId) {
      result = result.filter(product => product.categoryId === selectedSubcategoryId);
    }

    if (searchQuery) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.minPrice) {
      result = result.filter(
        (product) => product.price >= parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      result = result.filter(
        (product) => product.price <= parseFloat(filters.maxPrice)
      );
    }
    if (filters.minRating) {
      result = result.filter(
        (product) => product.rating >= parseFloat(filters.minRating)
      );
    }

    // Turban Filters
    if (filters.color) {
      result = result.filter((product) =>
        product.attributes?.color === filters.color || product.name.toLowerCase().includes(filters.color.toLowerCase())
      );
    }
    if (filters.clothType) {
      result = result.filter((product) =>
        product.attributes?.clothType === filters.clothType
      );
    }
    if (filters.sizeInMeters) {
      result = result.filter((product) =>
        product.attributes?.sizeInMeters === parseFloat(filters.sizeInMeters)
      );
    }

    // Sorting
    if (filters.sortBy === "price_asc") {
      result = result.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === "price_desc") {
      result = result.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === "name_asc") {
      result = result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === "name_desc") {
      result = result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (filters.sortBy === "rating") {
      result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [category, categoryProductsFeed, filters, searchQuery, selectedSubcategoryId]);

  const { displayedItems, hasMore, isLoading, loadMore, loadMoreRef } =
    useInfiniteScroll(categoryProducts, 10, 10);

  useEffect(() => {
    if (!gridRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".product-card-gsap",
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.6, ease: "power3.out", overwrite: "auto" }
      );
    }, gridRef);
    return () => ctx.revert();
  }, [displayedItems]);

  const filterButtonRef = useRef(null);

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      minRating: "",
      material: [],
      radius: "25",
      color: "",
      clothType: "",
      sizeInMeters: "",
      sortBy: "newest",
    });
    setSearchQuery("");
  };

  // Check if any filter is active
  const hasActiveFilters =
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating ||
    filters.material.length > 0 ||
    filters.radius !== "25" ||
    filters.color ||
    filters.clothType ||
    filters.sizeInMeters ||
    filters.sortBy !== "newest";

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showFilters &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target) &&
        !event.target.closest(".filter-dropdown")
      ) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showFilters]);

  if (!category) {
    return (
      <PageTransition>
        <MobileLayout showBottomNav={false} showCartBar={false}>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Category Not Found
              </h2>
              <button
                onClick={() => navigate("/")}
                className="gradient-green text-white px-6 py-3 rounded-xl font-semibold">
                Go Back Home
              </button>
            </div>
          </div>
        </MobileLayout>
      </PageTransition>
    );
  }

  // Disabled per request for now
  const showTurbanLoader = false; // isInitialLoading && isTurbanCategory;

  return (
    <PageTransition>
      {showTurbanLoader && <TurbanLoader />}
      <MobileLayout showBottomNav={true} showCartBar={true}>
        <motion.div
          className="w-full pb-24"
          animate={{
            y: swipeOffset,
            opacity: isSwipingBack ? 0 : 1 - Math.min(swipeOffset / 300, 0.5)
          }}
          transition={{
            type: isSwipingBack ? "tween" : "spring",
            bounce: 0,
            duration: isSwipingBack ? 0.25 : 0.1
          }}
        >
          {/* Animated Header */}
          <div className={`px-4 pt-6 pb-6 rounded-b-[2.5rem] shadow-sm sticky top-0 z-40 backdrop-blur-md transition-all duration-500 ${activeTheme.headerBg}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

              {/* Left Side: Back button + Category Details */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-[#0A192F] flex-shrink-0"
                >
                  <FiArrowLeft className="text-xl" />
                </button>

                <motion.div
                  className="flex items-center gap-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-[#0A192F] flex items-center justify-center shadow-lg transition-all overflow-hidden relative flex-shrink-0 ${activeTheme.iconOutline}`}>
                    {typeof category.image === 'string' && category.image.includes('<svg') ? (
                      <div dangerouslySetInnerHTML={{ __html: category.image }} className="w-9 h-9 md:w-12 md:h-12 filter brightness-0 invert" />
                    ) : (
                      <LazyImage
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getPlaceholderImage(48, 48, "Category");
                        }}
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <motion.h1
                      className="text-xl md:text-3xl font-black font-heading text-[#0A192F] tracking-tight leading-none"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {category.name}
                    </motion.h1>
                    <motion.p
                      className="text-xs md:text-sm text-gray-500 font-medium mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {category.description || `Explore everything in ${category.name}`}
                    </motion.p>
                  </div>
                </motion.div>
              </div>

              {/* Right Side: Filters & Controls */}
              <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                <div className="flex items-center bg-gray-100 rounded-xl p-1.5 h-11 shadow-sm border border-slate-200">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                    className="bg-transparent border-none text-sm font-extrabold text-[#0A192F] focus:ring-0 cursor-pointer outline-none pl-2.5 pr-1.5"
                  >
                    <option value="newest">Newest</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="price_asc">Price (Low-High)</option>
                    <option value="price_desc">Price (High-Low)</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
                <div className="flex items-center bg-gray-100 rounded-xl p-1.5 h-11 shadow-sm border border-slate-200">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-primary-600 shadow-sm" : "text-gray-600"}`}
                  >
                    <FiList className="text-xl" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-primary-600 shadow-sm" : "text-gray-600"}`}
                  >
                    <FiGrid className="text-xl" />
                  </button>
                </div>
                <div ref={filterButtonRef} className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 glass-card rounded-xl hover:bg-gray-100 transition-colors h-11 w-11 flex items-center justify-center shadow-sm border border-slate-200 ${showFilters ? "bg-gray-100" : ""}`}
                  >
                    <FiFilter className={`text-xl transition-colors ${hasActiveFilters ? "text-blue-600" : "text-[#0A192F]"}`} />
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="md:flex md:gap-6 px-4 py-6 items-start">
            {/* LEFT SIDEBAR (Desktop) */}
            {subcategories.length > 0 && (
              <div className="w-full md:w-64 flex-shrink-0 hidden md:block sticky top-24">
                <h3 className="text-xl font-bold text-[#0A192F] mb-5 uppercase tracking-wider">Categories</h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSubcategoryChange(null)}
                    className={`text-left px-4 py-3.5 rounded-xl text-base font-bold transition-all ${!selectedSubcategoryId ? `${activeTheme.primaryButton} ${activeTheme.primaryButtonText} shadow-md` : `bg-gray-50 text-gray-755 ${activeTheme.hoverBg}`}`}
                  >
                    All Items
                  </button>
                  {subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubcategoryChange(sub.id)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-bold transition-all ${selectedSubcategoryId === sub.id ? `${activeTheme.primaryButton} ${activeTheme.primaryButtonText} shadow-md` : `bg-gray-50 text-gray-700 ${activeTheme.hoverBg}`}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {typeof sub.image === 'string' && sub.image.includes('<svg') ? (
                          <div dangerouslySetInnerHTML={{ __html: sub.image }} className={`w-6 h-6 filter ${selectedSubcategoryId === sub.id ? 'invert brightness-0' : 'invert-[.5] sepia-[1] saturate-[5] hue-rotate-[10deg]'}`} />
                        ) : (
                          <LazyImage src={sub.image} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="truncate">{sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RIGHT CONTENT */}
            <div className="flex-1 min-w-0">
              {/* Mobile Categories Scroll */}
              {subcategories.length > 0 && (
                <div className="w-full md:hidden mb-6 -mx-4 px-4 overflow-x-auto hide-scrollbar">
                  <div className="flex gap-3 pb-2 w-max">
                    <button
                      onClick={() => handleSubcategoryChange(null)}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${!selectedSubcategoryId ? `${activeTheme.primaryButton} ${activeTheme.primaryButtonText} shadow-md` : "bg-white text-gray-750 border border-gray-200"}`}
                    >
                      All Items
                    </button>
                    {subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubcategoryChange(sub.id)}
                        className={`flex items-center gap-2 flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedSubcategoryId === sub.id ? `${activeTheme.primaryButton} ${activeTheme.primaryButtonText} shadow-md` : "bg-white text-gray-755 border border-gray-200"}`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="mb-6 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                <input
                  type="text"
                  placeholder={activeTheme.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-10 py-3.5 bg-white border-2 border-gray-300 rounded-2xl text-base font-semibold focus:outline-none transition-all placeholder:text-gray-400 shadow-sm ${activeTheme.searchFocusBorder}`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX className="text-base" />
                  </button>
                )}
              </div>

              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Featured Items</h2>
                <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-all ${activeTheme.badgeColor}`}>
                  {categoryProducts.length} items
                </span>
              </div>

              {/* Filter Dropdown */}
              <AnimatePresence>
                {showFilters && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowFilters(false)}
                      className="fixed inset-0 bg-black/20 z-[10000]"
                    />
                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="filter-dropdown fixed inset-y-0 right-0 w-80 bg-[#FAFAFA] shadow-[0_0_40px_rgba(10,25,47,0.15)] z-[10001] flex flex-col"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0A192F]/5 flex items-center justify-center">
                            <FiFilter className="text-[#0A192F]" />
                          </div>
                          <h3 className="text-lg font-bold text-[#0A192F] tracking-tight">
                            Refine Search
                          </h3>
                        </div>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                          <FiX size={20} />
                        </button>
                      </div>

                      {/* Filter Content */}
                      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">

                        {/* Price Range (Always show) */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-[#0A192F] text-sm uppercase tracking-wider flex items-center justify-between">
                            Price Range
                            <span className="text-xs font-normal text-gray-400 capitalize">Custom</span>
                          </h4>
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                              <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                                className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                              />
                            </div>
                            <div className="h-px w-4 bg-gray-300"></div>
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                              <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                                className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {(categoryId === "turbans" || parentIdForSwipe === "turbans") ? (
                          <>
                            {/* Turban Specific Filters */}

                            {/* Cloth Type */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-[#0A192F] text-sm uppercase tracking-wider">
                                Cloth Type
                              </h4>
                              <div className="space-y-2">
                                {['Rubia / Heavy Weight', 'Rubia Voile / Medium Weight', 'Full Voile / Light Weight'].map((type) => (
                                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.clothType === type ? 'border-[#D4AF37]' : 'border-gray-300 group-hover:border-[#D4AF37]'}`}>
                                      {filters.clothType === type && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />}
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-[#0A192F] transition-colors">{type}</span>
                                    <input
                                      type="radio"
                                      className="hidden"
                                      checked={filters.clothType === type}
                                      onChange={() => handleFilterChange("clothType", type)}
                                      onClick={() => filters.clothType === type && handleFilterChange("clothType", "")} // allow uncheck
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Color Options */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-[#0A192F] text-sm uppercase tracking-wider">
                                Color Options
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {['Yellow/Orange', 'Blue', 'Pink/Purple', 'Grey', 'Red/Maroon', 'Brown', 'White/Black', 'Green', 'Others'].map((c) => (
                                  <label key={c} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${filters.color === c ? 'bg-[#0A192F] border-[#0A192F]' : 'border-gray-300 bg-white group-hover:border-[#0A192F]'}`}>
                                      {filters.color === c && <FiX className="text-white text-xs rotate-45" />}
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-[#0A192F] transition-colors">{c}</span>
                                    <input
                                      type="radio"
                                      className="hidden"
                                      checked={filters.color === c}
                                      onChange={() => handleFilterChange("color", c)}
                                      onClick={() => filters.color === c && handleFilterChange("color", "")} // allow uncheck
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Standard Filters */}

                            {/* Location Radius */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-[#0A192F] text-sm uppercase tracking-wider flex items-center justify-between">
                                Location Radius
                                <span className="text-xs font-normal text-[#D4AF37] capitalize">{filters.radius} km</span>
                              </h4>
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={filters.radius}
                                onChange={(e) => handleFilterChange("radius", e.target.value)}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                              />
                              <div className="flex justify-between text-xs text-gray-400 font-medium">
                                <span>1 km</span>
                                <span>50 km</span>
                                <span>100 km</span>
                              </div>
                            </div>

                            {/* Material (Multi-select mock) */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-[#0A192F] text-sm uppercase tracking-wider">
                                Material
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {['Cotton', 'Silk', 'Linen', 'Wool'].map((mat) => (
                                  <label key={mat} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${filters.material.includes(mat) ? 'bg-[#0A192F] border-[#0A192F]' : 'border-gray-300 bg-white group-hover:border-[#0A192F]'}`}>
                                      {filters.material.includes(mat) && <FiX className="text-white text-xs rotate-45" />}
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-[#0A192F] transition-colors">{mat}</span>
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={filters.material.includes(mat)}
                                      onChange={(e) => {
                                        const newMats = e.target.checked
                                          ? [...filters.material, mat]
                                          : filters.material.filter(m => m !== mat);
                                        handleFilterChange("material", newMats);
                                      }}
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Rating */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-[#0A192F] text-sm uppercase tracking-wider">
                                Minimum Rating
                              </h4>
                              <div className="space-y-2">
                                {[4, 3, 2, 1].map((rating) => (
                                  <label
                                    key={rating}
                                    className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.minRating === rating.toString() ? 'border-[#D4AF37]' : 'border-gray-300 group-hover:border-[#D4AF37]'}`}>
                                      {filters.minRating === rating.toString() && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />}
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-[#0A192F] transition-colors">
                                      {rating}+ Stars
                                    </span>
                                    <input
                                      type="radio"
                                      name="minRating"
                                      value={rating}
                                      className="hidden"
                                      checked={filters.minRating === rating.toString()}
                                      onChange={(e) => handleFilterChange("minRating", e.target.value)}
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                      </div>

                      {/* Footer */}
                      <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
                        <button
                          onClick={clearFilters}
                          className="px-6 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all">
                          Reset
                        </button>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="flex-1 py-3.5 bg-[#0A192F] text-white rounded-xl font-bold text-sm hover:bg-[#0A192F]/90 shadow-[0_8px_16px_rgba(10,25,47,0.2)] hover:shadow-[0_4px_12px_rgba(10,25,47,0.15)] hover:-translate-y-0.5 transition-all">
                          Show Results
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Products List */}
              <div className={`pt-2 transition-all duration-200 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                {categoryProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl text-gray-300 mx-auto mb-4">📦</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-600">
                      There are no products available in this category at the
                      moment.
                    </p>
                  </div>
                ) : viewMode === "grid" ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" ref={gridRef}>
                      {displayedItems.map((product) => (
                        <div key={product.id} className="product-card-gsap hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(10,25,47,0.1)] transition-all duration-300 rounded-xl">
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <div
                        ref={loadMoreRef}
                        className="mt-6 flex flex-col items-center gap-4">
                        {isLoading && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-sm">
                              Loading more products...
                            </span>
                          </div>
                        )}
                        <button
                          onClick={loadMore}
                          disabled={isLoading}
                          className="px-6 py-3 gradient-green text-white rounded-xl font-semibold hover:shadow-glow-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isLoading ? "Loading..." : "Load More"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      {displayedItems.map((product, index) => (
                        <ProductListItem
                          key={product.id}
                          product={product}
                          index={index}
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <div
                        ref={loadMoreRef}
                        className="mt-6 flex flex-col items-center gap-4">
                        {isLoading && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-sm">
                              Loading more products...
                            </span>
                          </div>
                        )}
                        <button
                          onClick={loadMore}
                          disabled={isLoading}
                          className="px-6 py-3 gradient-green text-white rounded-xl font-semibold hover:shadow-glow-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isLoading ? "Loading..." : "Load More"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div> {/* End Products List */}
            </div> {/* End Right Content */}
          </div> {/* End Flex Wrapper */}
        </motion.div>
      </MobileLayout>
    </PageTransition>
  );
};

export default MobileCategory;

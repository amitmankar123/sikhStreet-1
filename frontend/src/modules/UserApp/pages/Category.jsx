import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiFilter, FiArrowLeft, FiGrid, FiList, FiX, FiSearch, FiChevronDown, FiSliders, FiInfo, FiChevronRight } from "react-icons/fi";
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

const BookProductCard = ({ product }) => {
  const navigate = useNavigate();
  const productLink = `/product/${product.id}`;
  const [isHovered, setIsHovered] = useState(false);

  const renderPrice = (val) => {
    return `CA$ ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={() => navigate(productLink)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col w-full h-full text-left bg-transparent"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-[#F4F4F4] rounded-xl overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center">
        {product.video && isHovered ? (
          <video
            src={product.video}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-all duration-300 rounded-xl"
          />
        ) : (
          <LazyImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = "https://placehold.co/300x300?text=Book+Cover";
            }}
          />
        )}

        {/* Play Button Overlay */}
        {product.hasVideo && !isHovered && (
          <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-transform hover:scale-110">
            <svg
              className="w-3.5 h-3.5 text-gray-800 fill-current ml-0.5"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Free Shipping / USPS Logo Badge overlay */}
        {product.id === 316 && (
          <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 px-1.5 py-0.5 rounded shadow-sm text-[8px] font-extrabold text-blue-800 flex items-center gap-0.5">
            🚚 FREE SHIPPING
          </div>
        )}
      </div>

      {/* Info Block */}
      <div className="flex-1 flex flex-col pt-2 pb-1">
        {/* Designer / Rating Line */}
        <div className="text-[11px] text-gray-600 flex items-center gap-1 flex-wrap">
          <span className="font-semibold text-gray-800 truncate max-w-[120px]">
            {product.vendorName || "Sikh Street"}
          </span>
          {product.rating > 0 && (
            <span className="flex items-center text-orange-500 font-bold ml-1">
              ★ {product.rating} <span className="text-gray-400 font-normal ml-0.5">({product.reviewCount})</span>
            </span>
          )}
          {product.isAd && (
            <span className="text-gray-400 text-[10px] font-medium ml-auto">Ad</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xs md:text-sm text-gray-800 font-normal mt-1 leading-snug line-clamp-2 group-hover:underline font-sans text-left">
          {product.name}
        </h3>

        {/* Price and Discount */}
        <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="font-bold text-gray-900 text-sm md:text-base">
            {renderPrice(product.price)}
          </span>
          {discountPercent > 0 && (
            <>
              <span className="text-[11px] text-gray-400 line-through font-normal">
                {renderPrice(product.originalPrice)}
              </span>
              <span className="text-green-700 text-xs font-semibold">
                ({discountPercent}% off)
              </span>
            </>
          )}
        </div>

        {/* Delivery / Badges */}
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-500">
          {product.digitalDownload ? (
            <span className="flex items-center gap-1 text-gray-500 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Digital download
            </span>
          ) : product.freeDelivery ? (
            <span className="text-gray-600 font-medium">
              Free delivery
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

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

const SHARED_CATEGORY_THEME = {
  bodyBackground: "#ffffff",
  accentColor: "text-black",
  accentBg: "bg-black/5",
  accentBorder: "border-black/10",
  hoverBg: "hover:bg-[#F5A623] hover:text-black transition-colors",
  primaryButton: "bg-black hover:bg-[#F5A623] hover:text-black transition-colors",
  primaryButtonText: "text-white",
  iconOutline: "shadow-black/10 ring-2 ring-black/10",
  searchPlaceholder: "Search in this category...",
  searchFocusBorder: "focus:border-[#F5A623] focus:ring-[#F5A623]/20",
  badgeColor: "text-black bg-black/5",
  headerBg: "bg-white/90",
  name: "Category"
};

// ── Topic group definitions ────────────────────────────────────────────────
const TG_SIKHISM      = { group: "Sikhism",                items: ["Gurus", "Gurbani Studies", "Sikh Philosophy", "Sikh Practices", "Sikh Rehat", "Sikh Theology", "Sikh Symbols"] };
const TG_HISTORY      = { group: "History",                items: ["Sikh History", "Punjab History", "Partition", "Sikh Empire", "Freedom Movement", "Military History"] };
const TG_BIOGRAPHIES  = { group: "Biographies",            items: ["Gurus", "Sikh Warriors", "Saints", "Scholars", "Modern Sikh Personalities"] };
const TG_PUNJABI_LIT  = { group: "Punjabi Literature",     items: ["Fiction", "Short Stories", "Poetry", "Classic Literature", "Contemporary Literature"] };
const TG_CHILDREN     = { group: "Children & Young Readers", items: ["Picture Books", "Early Readers", "Activity Books", "Educational Books", "Bedtime Stories", "Sikh Values", "Comics", "Historical Comics", "Graphic Novels"] };
const TG_LANGUAGE     = { group: "Language Learning",      items: ["Punjabi", "Gurmukhi", "Shahmukhi", "Dictionaries", "Grammar", "Workbooks", "Persian", "Urdu", "Sanskrit"] };
const TG_ACADEMIC     = { group: "Academic & Research",    items: ["Research Papers", "Journals", "Reference Books", "Encyclopedias", "University Texts"] };
const TG_SOCIETY      = { group: "Society & Politics",     items: ["Sikh Identity", "Politics", "Human Rights", "Diaspora", "Gender Studies"] };
const TG_ART          = { group: "Art & Culture",          items: ["Architecture", "Music", "Calligraphy", "Folk Traditions", "Photography", "Museums"] };
const TG_SKILL        = { group: "Skill Building",         items: ["Leadership", "Spiritual Growth", "Parenting", "Mental Wellness", "Motivation", "Spirituality"] };

// ── Per-subcategory topic groups (auto-updates Topics accordion) ───────────
const BOOK_SUBCATEGORY_TOPICS = {
  "sikh-history-books":          [TG_SIKHISM, TG_HISTORY],
  "childrens-books":             [TG_CHILDREN],
  "punjabi-literature":          [TG_PUNJABI_LIT],
  "poetry-collections":          [TG_PUNJABI_LIT],
  "biographies-sikh-personalities": [TG_BIOGRAPHIES],
  "comics-graphic-novels":       [TG_CHILDREN],
  "language-learning-books":     [TG_LANGUAGE],
  "e-books":                     [TG_SIKHISM, TG_HISTORY, TG_PUNJABI_LIT, TG_CHILDREN, TG_LANGUAGE, TG_ACADEMIC, TG_SOCIETY, TG_ART, TG_SKILL],
  "journals-notebooks":          [TG_ACADEMIC],
  "politics":                    [TG_SOCIETY],
  "punjab":                      [TG_HISTORY, TG_SOCIETY, TG_ART],
  "skill-building":              [TG_SKILL]
};

const CATEGORY_THEMES = {
  decor: { ...SHARED_CATEGORY_THEME, name: "Art & Decor", searchPlaceholder: 'Search "Paintings", "Wall Clocks", "Gurbani Frames"...' },
  turbans: { ...SHARED_CATEGORY_THEME, name: "Turbans", searchPlaceholder: 'Search "Full Voile", "Rubia", "Parna", "Double Patti"...' },
  sacred: { ...SHARED_CATEGORY_THEME, name: "Sacred Devotional", searchPlaceholder: 'Search "Chandoa Sahib", "Rumala Sahib", "Degh", "Nishan Flags"...' },
  kakaars: { ...SHARED_CATEGORY_THEME, name: "Sacred Kakaars", searchPlaceholder: 'Search "Sarbloh Kara", "Wooden Kanga", "Kirpan", "Kachera"...' },
  musical: { ...SHARED_CATEGORY_THEME, name: "Musical Instruments", searchPlaceholder: 'Search "Harmonium", "Tabla", "Dilruba", "Jodi"...' },
  electronics: { ...SHARED_CATEGORY_THEME, name: "Electronics", searchPlaceholder: 'Search "Speakers", "Audio Players", "Media Devices"...' },
  fashion: { ...SHARED_CATEGORY_THEME, name: "Fashion", searchPlaceholder: 'Search "Kurtas", "Graphic Tees", "Jackets", "Scarves"...' },
  langar: { ...SHARED_CATEGORY_THEME, name: "Langar Hall", searchPlaceholder: 'Search "Steel Plates", "Bata", "Serving Spoons", "Langar Tandoor"...' },
  kadda: { ...SHARED_CATEGORY_THEME, name: "Premium Sikh Kaddas", searchPlaceholder: 'Search "Sarbloh Kadda", "Sterling Silver", "Chauras Kadda"...' },
  default: { ...SHARED_CATEGORY_THEME, name: "Default" }
};

const getCategoryTheme = (category) => {
  if (!category) return CATEGORY_THEMES.default;
  const name = (category.name || "").toLowerCase();
  const idStr = String(category.id || "").toLowerCase();
  const parentIdStr = String(category.parentId || "").toLowerCase();

  if (idStr === "kadda" || name.includes("kadda") || name.includes("kada")) {
    return CATEGORY_THEMES.kadda;
  }
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

  const resolvedCategoryId = useMemo(() => {
    return category ? normalizeId(category.id) : categoryId;
  }, [category, categoryId]);

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
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sikh Street Books specific filter states
  const [etsyHandmade, setEtsyHandmade] = useState(false);
  const [etsyIncludesVideo, setEtsyIncludesVideo] = useState(false);
  const [etsyPicks, setEtsyPicks] = useState(false);
  const [etsyOriginIN, setEtsyOriginIN] = useState(false);
  const [etsyUnderCA10, setEtsyUnderCA10] = useState(false);
  const [etsyStarSeller, setEtsyStarSeller] = useState(false);
  const [etsyPaperback, setEtsyPaperback] = useState(false);
  const [etsySpiralBound, setEtsySpiralBound] = useState(false);
  const [etsyEncyclopedia, setEtsyEncyclopedia] = useState(false);
  const [etsyDigital, setEtsyDigital] = useState(false);
  const [etsySentFrom, setEtsySentFrom] = useState(""); // 'IN', 'CA', 'US' etc.
  const [etsyDelivery, setEtsyDelivery] = useState(""); // 'free', 'ready_1', 'ready_3'
  const [etsySort, setEtsySort] = useState("most_relevant");

  // Sidebar accordion open/close state
  const [openSections, setOpenSections] = useState({
    sikhStreetBest: true,
    category: false,
    specialOffers: false,
    sentFrom: true,
    itemFormat: true,
    readyToDispatch: false,
    price: true,
    colour: false,
    itemType: false,
    orderingOptions: false,
    deliverTo: false,
  });

  const toggleSection = (key) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubcategoryChange = (subId) => {
    if (subId === selectedSubcategoryId) return;
    setIsTransitioning(true);
    setSelectedTopic(""); // Reset topic when subcategory changes
    setTimeout(() => {
      setSelectedSubcategoryId(subId);
      setIsTransitioning(false);
    }, 200);
  };

  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    const params = new URLSearchParams(location.search);
    const subParam = params.get("sub");
    const topicParam = params.get("topic");

    if (subParam) {
      setSelectedSubcategoryId(subParam);
    } else if (categoryId !== "books") {
      setSelectedSubcategoryId(null);
    } else {
      setSelectedSubcategoryId(null);
    }

    setSelectedTopic(topicParam || "");

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [categoryId, location.search]);

  const subcategories = useMemo(() => {
    const allCats = [...(categories || []), ...(fallbackCategories || [])].filter(Boolean);
    const uniqueCats = Array.from(new Map(allCats.map(c => [c.id, c])).values());
    return uniqueCats.filter(cat => getParentId(cat) === resolvedCategoryId);
  }, [categories, resolvedCategoryId]);

  const subcategoryTopics = useMemo(() => {
    if (!selectedSubcategoryId) return null;
    
    // Filter categories that have parentId equal to selectedSubcategoryId
    const dbTopics = (categories || []).filter(
      (cat) => cat.parentId && String(cat.parentId) === String(selectedSubcategoryId)
    );
    
    if (dbTopics.length > 0) {
      // Group them by the 'group' field
      const groups = {};
      dbTopics.forEach((cat) => {
        const grp = cat.group || "Other Topics";
        if (!groups[grp]) {
          groups[grp] = [];
        }
        groups[grp].push(cat.name);
      });
      
      return Object.entries(groups).map(([groupName, items]) => ({
        group: groupName,
        items: items
      }));
    }
    
    // Fallback to static topics if none in the database
    return BOOK_SUBCATEGORY_TOPICS[selectedSubcategoryId] || null;
  }, [selectedSubcategoryId, categories]);

  const gridRef = useRef(null);
  const gsapCtxRef = useRef(null);

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
      }

      if (!categoryId) {
        if (!cancelled) {
          setCategoryProductsFeed([]);
          setIsInitialLoading(false);
        }
        return;
      }

      // Small delay for smooth page transition animations
      await new Promise((resolve) => setTimeout(resolve, 200));
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
        return isDescendant(productCategoryId, resolvedCategoryId);
      });

      try {
        const response = await api.get('/products', { params: { category: resolvedCategoryId, limit: 100 } });
        const apiData = response.data || response;
        const apiProducts = Array.isArray(apiData?.products)
          ? apiData.products
          : Array.isArray(apiData)
          ? apiData
          : [];

        const normalizedApiProducts = apiProducts.map(p => ({
          ...p,
          id: p.id || p._id,
          image: p.images?.[0] || p.image || getPlaceholderImage()
        }));

        const combinedMap = new Map();
        [...normalizedApiProducts, ...fallback].forEach(p => {
          if (p && (p.id || p._id)) {
            combinedMap.set(String(p.id || p._id), p);
          }
        });

        if (!cancelled) {
          setCategoryProductsFeed(Array.from(combinedMap.values()));
          setIsInitialLoading(false);
        }
      } catch (err) {
        console.warn("Failed to fetch API products, using fallback:", err);
        if (!cancelled) {
          setCategoryProductsFeed(fallback);
          setIsInitialLoading(false);
        }
      }
    };

    fetchCategoryProducts();
    return () => {
      cancelled = true;
    };
  }, [resolvedCategoryId, categories, categoryId]);


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

    const allCats = [...(categories || []), ...(fallbackCategories || [])].filter(Boolean);
    const isDescendant = (catId, targetId) => {
      if (catId === targetId) return true;
      const cat = allCats.find(c => normalizeId(c.id) === catId);
      if (!cat) return false;
      const pId = getParentId(cat);
      if (!pId) return false;
      return isDescendant(pId, targetId);
    };

    if (selectedSubcategoryId) {
      result = result.filter(product => isDescendant(normalizeId(product.categoryId), selectedSubcategoryId));
    }

    if (selectedTopic) {
      result = result.filter(product => {
        const productCategoryId = normalizeId(product.categoryId);
        const cat = allCats.find(c => normalizeId(c.id) === productCategoryId);
        const catName = cat ? cat.name : "";
        return (
          product.topic === selectedTopic ||
          product.attributes?.topic === selectedTopic ||
          String(product.categoryId).toLowerCase() === selectedTopic.toLowerCase() ||
          catName.toLowerCase() === selectedTopic.toLowerCase() ||
          product.name.toLowerCase().includes(selectedTopic.toLowerCase())
        );
      });
    }

    if (searchQuery) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryId === 'books') {
      if (etsyHandmade) result = result.filter(p => p.handmade === true);
      if (etsyIncludesVideo) result = result.filter(p => p.hasVideo === true);
      if (etsyOriginIN) result = result.filter(p => p.origin === 'IN');
      if (etsyUnderCA10) result = result.filter(p => p.price < 10);
      if (etsyStarSeller) result = result.filter(p => p.rating >= 4.8);
      if (etsyPaperback) result = result.filter(p => p.type === 'paperback');
      if (etsySpiralBound) result = result.filter(p => p.type === 'spiral_bound');
      if (etsyEncyclopedia) result = result.filter(p => p.type === 'encyclopedia');
      if (etsyDigital) result = result.filter(p => p.digitalDownload === true);
      if (etsySentFrom) result = result.filter(p => p.origin === etsySentFrom);
      if (etsyDelivery === 'free') result = result.filter(p => p.freeDelivery === true);
      if (etsyDelivery === 'digital') result = result.filter(p => p.digitalDownload === true);

      // Sorting for Books
      if (etsySort === "price_asc") {
        result = result.sort((a, b) => a.price - b.price);
      } else if (etsySort === "price_desc") {
        result = result.sort((a, b) => b.price - a.price);
      } else if (etsySort === "top_rated") {
        result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else {
        // most_relevant
        const relevantOrder = [308, 311, 312, 313, 314, 315, 316, 317];
        result = result.sort((a, b) => {
          const idxA = relevantOrder.indexOf(Number(a.id));
          const idxB = relevantOrder.indexOf(Number(b.id));
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });
      }
    } else {
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

      // Sorting (shared for books and non-books via etsySort)
      if (etsySort === "price_asc") {
        result = result.sort((a, b) => a.price - b.price);
      } else if (etsySort === "price_desc") {
        result = result.sort((a, b) => b.price - a.price);
      } else if (etsySort === "top_rated" || filters.sortBy === "rating") {
        result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === "name_asc") {
        result = result.sort((a, b) => a.name.localeCompare(b.name));
      } else if (filters.sortBy === "name_desc") {
        result = result.sort((a, b) => b.name.localeCompare(a.name));
      }
    }

    return result;
  }, [category, categoryProductsFeed, filters, searchQuery, selectedSubcategoryId, selectedTopic, etsyHandmade, etsyIncludesVideo, etsyPicks, etsyOriginIN, etsyUnderCA10, etsyStarSeller, etsyPaperback, etsySpiralBound, etsyEncyclopedia, etsyDigital, etsySentFrom, etsyDelivery, etsySort]);

  const { displayedItems, hasMore, isLoading, loadMore, loadMoreRef } =
    useInfiniteScroll(categoryProducts, 10, 10);

  // Grid stagger animation handled independently by ProductCard using framer-motion to prevent double blinking

  const filterButtonRef = useRef(null);
  const filtersScrollRef = useRef(null);
  const [showScrollRight, setShowScrollRight] = useState(false);

  const checkScroll = () => {
    const el = filtersScrollRef.current;
    if (el) {
      const canScroll = el.scrollWidth > el.clientWidth;
      const scrolledToEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
      setShowScrollRight(canScroll && !scrolledToEnd);
    }
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 300);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categoryId]);

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
    setEtsyHandmade(false);
    setEtsyIncludesVideo(false);
    setEtsyPicks(false);
    setEtsyOriginIN(false);
    setEtsyUnderCA10(false);
    setEtsyStarSeller(false);
    setEtsyPaperback(false);
    setEtsySpiralBound(false);
    setEtsyEncyclopedia(false);
    setEtsyDigital(false);
    setEtsySentFrom("");
    setEtsyDelivery("");
    setEtsySort("most_relevant");
    setSelectedTopic("");
  };

  // Check if any filter is active
  const hasActiveFilters =
    selectedTopic ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating ||
    filters.material.length > 0 ||
    filters.radius !== "25" ||
    filters.color ||
    filters.clothType ||
    filters.sizeInMeters ||
    filters.sortBy !== "newest" ||
    etsyHandmade ||
    etsyIncludesVideo ||
    etsyPicks ||
    etsyOriginIN ||
    etsyUnderCA10 ||
    etsyStarSeller ||
    etsyPaperback ||
    etsySpiralBound ||
    etsyEncyclopedia ||
    etsyDigital ||
    etsySentFrom ||
    etsyDelivery;

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
          {categoryId !== 'books' && (
            <div className={`px-4 py-3 shadow-sm sticky top-0 z-40 backdrop-blur-md transition-all duration-500 ${activeTheme.headerBg}`}>
              <div className="flex flex-row items-center justify-between gap-4">

                {/* Left Side: Back button + Category Name */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-black flex-shrink-0"
                  >
                    <FiArrowLeft className="text-xl" />
                  </button>
                  <span className="text-base md:text-lg font-bold text-gray-955 font-sans tracking-tight">
                    {category?.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="md:flex md:gap-6 px-4 py-6 items-start">


            {/* RIGHT CONTENT */}
            <div className="flex-1 min-w-0">




              {categoryId === 'books' ? (
                /* Etsy Books Specific Filter Bar & Counter */
                <div className="w-full mb-6">
                  <div className="flex items-center justify-start gap-6 border-b border-gray-200 pb-4 flex-nowrap w-full">
                    <div className="relative flex-shrink grow-0 min-w-0">
                      <div
                        ref={filtersScrollRef}
                        onScroll={checkScroll}
                        className="flex gap-3 flex-nowrap overflow-x-auto hide-scrollbar pb-1 scroll-smooth"
                      >
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 text-xs font-semibold whitespace-nowrap transition-all ${showFilters
                              ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700"
                              : "bg-[#eaeaea] text-gray-800 border-transparent hover:bg-gray-200"
                            }`}
                        >
                          <FiSliders className="text-xs" />
                          {showFilters ? "Hide filters" : "Show filters"}
                        </button>

                        {subcategories.length > 0 && (
                          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth flex-shrink-0">
                            <div className="w-[1px] h-6 bg-gray-200 self-center mx-1 flex-shrink-0" />
                            <button
                              onClick={() => handleSubcategoryChange(null)}
                              className={`px-4 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                !selectedSubcategoryId
                                  ? "bg-gray-900 text-white border-gray-900"
                                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              All Books
                            </button>
                            {subcategories.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => handleSubcategoryChange(sub.id)}
                                className={`px-4 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                  selectedSubcategoryId === sub.id
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                }`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {showScrollRight && (
                        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end pointer-events-none w-10 bg-gradient-to-l from-white via-white/80 to-transparent">
                          <button
                            onClick={() => {
                              if (filtersScrollRef.current) {
                                filtersScrollRef.current.scrollBy({ left: 150, behavior: "smooth" });
                              }
                            }}
                            className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md pointer-events-auto hover:bg-gray-50 text-gray-700 transition-colors mr-1"
                          >
                            <FiChevronRight className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 text-xs pl-2">
                      <span className="text-gray-500 font-medium whitespace-nowrap flex items-center gap-1">
                        1,000+ items with ads
                        <FiInfo className="text-xs text-gray-400 cursor-pointer hover:text-gray-600" />
                      </span>
                      <div className="relative flex items-center gap-1 cursor-pointer">
                        <select
                          value={etsySort}
                          onChange={(e) => setEtsySort(e.target.value)}
                          className="appearance-none bg-transparent pr-4 font-bold text-gray-800 focus:outline-none cursor-pointer hover:text-black transition-colors text-xs select-none"
                        >
                          <option value="most_relevant">Most relevant</option>
                          <option value="top_rated">Top rated</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                        </select>
                        <FiChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-850 pointer-events-none text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-books filter bar with Show/Hide filters pill */
                <div className="w-full mb-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4 flex-nowrap gap-3">
                    <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar scroll-smooth flex-1 min-w-0 pr-4">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${showFilters
                            ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700"
                            : "bg-[#eaeaea] text-gray-800 border-transparent hover:bg-gray-200"
                          }`}
                      >
                        <FiSliders className="text-xs" />
                        {showFilters ? "Hide filters" : "Show filters"}
                      </button>

                      {/* Subcategory buttons */}
                      {subcategories.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth flex-shrink-0">
                          <div className="w-[1px] h-6 bg-gray-200 self-center mx-1 flex-shrink-0" />
                          <button
                            onClick={() => handleSubcategoryChange(null)}
                            className={`px-4 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                              !selectedSubcategoryId
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            All Items
                          </button>
                          {subcategories.map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => handleSubcategoryChange(sub.id)}
                              className={`px-4 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                selectedSubcategoryId === sub.id
                                  ? "bg-gray-900 text-white border-gray-900"
                                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                                {sub.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                      <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">
                        {categoryProducts.length} items
                      </span>
                      <div className="relative flex items-center gap-1 cursor-pointer">
                        <select
                          value={etsySort}
                          onChange={(e) => setEtsySort(e.target.value)}
                          className="appearance-none bg-transparent pr-5 font-bold text-gray-800 focus:outline-none cursor-pointer hover:text-black transition-colors text-xs select-none"
                        >
                          <option value="most_relevant">Most relevant</option>
                          <option value="top_rated">Top rated</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                        </select>
                        <FiChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* Books: Inline sidebar + product grid layout */}
              <div className="flex gap-0 items-start w-full">

                {/* === INLINE FILTER SIDEBAR (slides in from left, pushes grid) === */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      key="filter-sidebar"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 240, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
                      className="flex-shrink-0 overflow-hidden"
                    >
                      {/* Inner panel — auto height, scrolls when content overflows viewport */}
                      <div className="w-[240px] sticky top-20 max-h-[calc(100vh-90px)] overflow-y-auto border-r border-gray-200 bg-white">
                        {/* Sidebar header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                          <div className="flex items-center gap-2">
                            <FiSliders className="text-gray-700 text-sm" />
                            <span className="text-sm font-bold text-black">Filters</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                              <button onClick={clearFilters} className="text-xs font-semibold text-[#1861bf] hover:underline">Reset</button>
                            )}
                            <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                              <FiX size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Filter sections — books or generic */}
                        <div>

                          {categoryId === 'books' ? (
                            /* ===== BOOKS-SPECIFIC FILTER SECTIONS ===== */
                            <>

                              {/* === SIKH STREET'S BEST === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('sikhStreetBest')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Sikh Street's best</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.sikhStreetBest ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.sikhStreetBest && (
                                  <div className="px-4 pb-3 space-y-2.5">
                                    {[

                                      { label: 'Includes video', info: false, state: etsyIncludesVideo, toggle: () => setEtsyIncludesVideo(!etsyIncludesVideo) },
                                      { label: "Sikh Street's Picks", info: true, state: etsyPicks, toggle: () => setEtsyPicks(!etsyPicks) },
                                      { label: 'Star Seller', info: true, state: etsyStarSeller, toggle: () => setEtsyStarSeller(!etsyStarSeller) },
                                    ].map(({ label, info, state, toggle }) => (
                                      <label key={label} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-2">
                                          <div onClick={toggle} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${state ? 'bg-[#1861bf] border-[#1861bf]' : 'border-gray-400 bg-white group-hover:border-[#1861bf]'}`}>
                                            {state && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                          </div>
                                          <span className="text-xs text-gray-700 group-hover:text-black">{label}</span>
                                        </div>
                                        {info && <FiInfo className="text-xs text-gray-400 flex-shrink-0" />}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* === SUB CATEGORIES === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('category')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Sub Categories</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.category ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.category && (
                                  <div className="px-4 pb-3 space-y-2">
                                    <label
                                      onClick={() => handleSubcategoryChange(null)}
                                      className="flex items-center gap-2 cursor-pointer group"
                                    >
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${!selectedSubcategoryId ? 'border-[#1861bf]' : 'border-gray-400 group-hover:border-[#1861bf]'}`}>
                                        {!selectedSubcategoryId && <div className="w-2 h-2 rounded-full bg-[#1861bf]" />}
                                      </div>
                                      <span className={`text-xs ${!selectedSubcategoryId ? 'text-black font-bold' : 'text-gray-700 group-hover:text-black'}`}>All Books</span>
                                    </label>
                                    {subcategories.map((sub) => (
                                      <label
                                        key={sub.id}
                                        onClick={() => handleSubcategoryChange(sub.id)}
                                        className="flex items-center gap-2 cursor-pointer group"
                                      >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedSubcategoryId === sub.id ? 'border-[#1861bf]' : 'border-gray-400 group-hover:border-[#1861bf]'}`}>
                                          {selectedSubcategoryId === sub.id && <div className="w-2 h-2 rounded-full bg-[#1861bf]" />}
                                        </div>
                                        <span className={`text-xs ${selectedSubcategoryId === sub.id ? 'text-black font-bold' : 'text-gray-700 group-hover:text-black'}`}>{sub.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* === TOPICS (DYNAMIC — updates per selected subcategory) === */}
                              {selectedSubcategoryId && subcategoryTopics && (
                                <div className="border-b border-gray-200">
                                  <button onClick={() => toggleSection('topic')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <span className="font-semibold text-sm text-gray-900">Topics</span>
                                    <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.topic !== false ? 'rotate-180' : ''}`} />
                                  </button>
                                  {openSections.topic !== false && (
                                    <div className="px-4 pb-3 max-h-72 overflow-y-auto">
                                      {/* All Topics reset option */}
                                      <label
                                        onClick={() => setSelectedTopic("")}
                                        className="flex items-center gap-2 cursor-pointer group mb-2"
                                      >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${!selectedTopic ? 'bg-[#1861bf] border-[#1861bf]' : 'border-gray-400 bg-white group-hover:border-[#1861bf]'}`}>
                                          {!selectedTopic && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <span className={`text-xs ${!selectedTopic ? 'text-black font-bold' : 'text-gray-700 group-hover:text-black'}`}>All Topics</span>
                                      </label>

                                      {/* Grouped topics — auto-updates when subcategory changes */}
                                      {subcategoryTopics.map(({ group, items }) => (
                                        <div key={group} className="mb-3">
                                          {/* Group header */}
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 py-1.5 border-t border-gray-100 mt-1">
                                            {group}
                                          </p>
                                          {/* Group items */}
                                          <div className="space-y-2">
                                            {items.map((topic) => (
                                              <label
                                                key={topic}
                                                onClick={() => setSelectedTopic(selectedTopic === topic ? "" : topic)}
                                                className="flex items-center gap-2 cursor-pointer group"
                                              >
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedTopic === topic ? 'bg-[#1861bf] border-[#1861bf]' : 'border-gray-400 bg-white group-hover:border-[#1861bf]'}`}>
                                                  {selectedTopic === topic && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                                </div>
                                                <span className={`text-xs ${selectedTopic === topic ? 'text-black font-bold' : 'text-gray-700 group-hover:text-black'}`}>{topic}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* === SPECIAL OFFERS === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('specialOffers')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Special offers</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.specialOffers ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.specialOffers && (
                                  <div className="px-4 pb-3 space-y-2.5">
                                    {[
                                      { label: 'On sale items', state: etsyUnderCA10, toggle: () => setEtsyUnderCA10(!etsyUnderCA10) },
                                      { label: 'Free shipping', state: etsyDelivery === 'free', toggle: () => setEtsyDelivery(etsyDelivery === 'free' ? '' : 'free') },
                                    ].map(({ label, state, toggle }) => (
                                      <label key={label} className="flex items-center gap-2 cursor-pointer group">
                                        <div onClick={toggle} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${state ? 'bg-[#1861bf] border-[#1861bf]' : 'border-gray-400 bg-white group-hover:border-[#1861bf]'}`}>
                                          {state && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <span className="text-xs text-gray-700 group-hover:text-black">{label}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* === SENT FROM === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('sentFrom')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Sent from</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.sentFrom ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.sentFrom && (
                                  <div className="px-4 pb-3 space-y-2">
                                    {[{ label: 'India', code: 'IN' }, { label: 'Canada', code: 'CA' }, { label: 'United Kingdom', code: 'UK' }, { label: 'United States', code: 'US' }].map(({ label, code }) => (
                                      <label key={code} className="flex items-center gap-2 cursor-pointer group">
                                        <div onClick={() => setEtsySentFrom(etsySentFrom === code ? '' : code)} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${etsySentFrom === code ? 'border-[#1861bf]' : 'border-gray-400 group-hover:border-[#1861bf]'}`}>
                                          {etsySentFrom === code && <div className="w-2 h-2 rounded-full bg-[#1861bf]" />}
                                        </div>
                                        <span className="text-xs text-gray-700 group-hover:text-black">{label}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* === ITEM FORMAT === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('itemFormat')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Item format</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.itemFormat ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.itemFormat && (
                                  <div className="px-4 pb-3 space-y-2">
                                    {[
                                      { label: 'Paperback', state: etsyPaperback, toggle: () => { setEtsyPaperback(!etsyPaperback); setEtsySpiralBound(false); setEtsyEncyclopedia(false); setEtsyDigital(false); } },
                                      { label: 'Hardcover / Encyclopedia', state: etsyEncyclopedia, toggle: () => { setEtsyEncyclopedia(!etsyEncyclopedia); setEtsyPaperback(false); setEtsySpiralBound(false); setEtsyDigital(false); } },
                                      { label: 'Spiral Bound', state: etsySpiralBound, toggle: () => { setEtsySpiralBound(!etsySpiralBound); setEtsyPaperback(false); setEtsyEncyclopedia(false); setEtsyDigital(false); } },
                                      { label: 'Digital download', state: etsyDigital, toggle: () => { setEtsyDigital(!etsyDigital); setEtsyPaperback(false); setEtsySpiralBound(false); setEtsyEncyclopedia(false); } },
                                    ].map(({ label, state, toggle }) => (
                                      <label key={label} className="flex items-center gap-2 cursor-pointer group">
                                        <div onClick={toggle} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${state ? 'bg-[#1861bf] border-[#1861bf]' : 'border-gray-400 bg-white group-hover:border-[#1861bf]'}`}>
                                          {state && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <span className="text-xs text-gray-700 group-hover:text-black">{label}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* === READY TO DISPATCH === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('readyToDispatch')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Ready to dispatch in</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.readyToDispatch ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.readyToDispatch && (
                                  <div className="px-4 pb-3 space-y-2">
                                    {[{ label: '1 business day', code: 'ready_1' }, { label: '3 business days', code: 'ready_3' }, { label: '5 business days', code: 'ready_5' }].map(({ label, code }) => (
                                      <label key={code} className="flex items-center gap-2 cursor-pointer group">
                                        <div onClick={() => setEtsyDelivery(etsyDelivery === code ? '' : code)} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${etsyDelivery === code ? 'border-[#1861bf]' : 'border-gray-400 group-hover:border-[#1861bf]'}`}>
                                          {etsyDelivery === code && <div className="w-2 h-2 rounded-full bg-[#1861bf]" />}
                                        </div>
                                        <span className="text-xs text-gray-700 group-hover:text-black">{label}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* === PRICE === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('price')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Price</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.price ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.price && (
                                  <div className="px-4 pb-4">
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="relative flex-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input type="number" placeholder="From" value={filters.minPrice} onChange={(e) => handleFilterChange("minPrice", e.target.value)} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#1861bf]" />
                                      </div>
                                      <span className="text-gray-400 text-xs">—</span>
                                      <div className="relative flex-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input type="number" placeholder="To" value={filters.maxPrice} onChange={(e) => handleFilterChange("maxPrice", e.target.value)} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#1861bf]" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* === COLOUR === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('colour')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Colour</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.colour ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.colour && (
                                  <div className="px-4 pb-3">
                                    <div className="grid grid-cols-6 gap-1.5 mt-1">
                                      {[{ label: 'Red', hex: '#c0392b' }, { label: 'Orange', hex: '#e67e22' }, { label: 'Yellow', hex: '#f1c40f' }, { label: 'Green', hex: '#27ae60' }, { label: 'Blue', hex: '#2980b9' }, { label: 'Purple', hex: '#8e44ad' }, { label: 'Pink', hex: '#e91e8c' }, { label: 'White', hex: '#f5f5f5' }, { label: 'Black', hex: '#1a1a1a' }, { label: 'Brown', hex: '#7B3F00' }, { label: 'Gold', hex: '#D4AF37' }, { label: 'Multi', hex: 'linear-gradient(135deg, red, blue, green)' }].map(({ label, hex }) => (
                                        <button key={label} title={label} onClick={() => handleFilterChange('color', filters.color === label ? '' : label)} className={`w-7 h-7 rounded-full border-2 transition-all ${filters.color === label ? 'border-[#1861bf] scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'}`} style={{ background: hex }} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* === ITEM TYPE === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('itemType')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Item type</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.itemType ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.itemType && (
                                  <div className="px-4 pb-3 space-y-2">
                                    {['Handmade', 'Vintage', 'Craft supplies'].map((type) => (
                                      <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                        <div className="w-4 h-4 rounded border-2 border-gray-400 group-hover:border-[#1861bf] flex-shrink-0 transition-all" />
                                        <span className="text-xs text-gray-700 group-hover:text-black">{type}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* === ORDERING OPTIONS === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('orderingOptions')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Ordering options</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.orderingOptions ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.orderingOptions && (
                                  <div className="px-4 pb-3 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <div className="w-4 h-4 rounded border-2 border-gray-400 group-hover:border-[#1861bf] flex-shrink-0 transition-all" />
                                      <span className="text-xs text-gray-700 group-hover:text-black">Accepts custom orders</span>
                                    </label>
                                  </div>
                                )}
                              </div>

                              {/* === DELIVER TO === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('deliverTo')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Deliver to</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.deliverTo ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.deliverTo && (
                                  <div className="px-4 pb-4">
                                    <div className="relative">
                                      <select
                                        defaultValue=""
                                        className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#1861bf] cursor-pointer"
                                      >
                                        <option value="" disabled>Select destination...</option>
                                        {['Canada', 'United States', 'United Kingdom', 'India', 'Worldwide'].map((dest) => (
                                          <option key={dest} value={dest}>{dest}</option>
                                        ))}
                                      </select>
                                      <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                                    </div>
                                  </div>
                                )}
                              </div>

                            </>) : (
                            /* ===== NON-BOOKS GENERIC FILTER SECTIONS ===== */
                            <>
                              {/* === SUBCATEGORIES === */}
                              {subcategories.length > 0 && (
                                <div className="border-b border-gray-200">
                                  <button onClick={() => toggleSection('category')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <span className="font-semibold text-sm text-gray-900">Category</span>
                                    <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.category ? 'rotate-180' : ''}`} />
                                  </button>
                                  {openSections.category && (
                                    <div className="px-4 pb-3 space-y-1">
                                      <button
                                        onClick={() => handleSubcategoryChange(null)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${!selectedSubcategoryId ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                      >
                                        All Items
                                      </button>
                                      {subcategories.map(sub => (
                                        <button
                                          key={sub.id}
                                          onClick={() => handleSubcategoryChange(sub.id)}
                                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${selectedSubcategoryId === sub.id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                          {sub.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* === PRICE RANGE === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('price')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Price</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.price ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.price && (
                                  <div className="px-4 pb-4">
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="relative flex-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input type="number" placeholder="From" value={filters.minPrice} onChange={(e) => handleFilterChange("minPrice", e.target.value)} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#1861bf]" />
                                      </div>
                                      <span className="text-gray-400 text-xs">—</span>
                                      <div className="relative flex-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input type="number" placeholder="To" value={filters.maxPrice} onChange={(e) => handleFilterChange("maxPrice", e.target.value)} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#1861bf]" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* === COLOUR === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('colour')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Colour</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.colour ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.colour && (
                                  <div className="px-4 pb-3">
                                    <div className="grid grid-cols-6 gap-1.5 mt-1">
                                      {[{ label: 'Red', hex: '#c0392b' }, { label: 'Orange', hex: '#e67e22' }, { label: 'Yellow', hex: '#f1c40f' }, { label: 'Green', hex: '#27ae60' }, { label: 'Blue', hex: '#2980b9' }, { label: 'Purple', hex: '#8e44ad' }, { label: 'Pink', hex: '#e91e8c' }, { label: 'White', hex: '#f5f5f5' }, { label: 'Black', hex: '#1a1a1a' }, { label: 'Brown', hex: '#7B3F00' }, { label: 'Gold', hex: '#D4AF37' }, { label: 'Multi', hex: 'linear-gradient(135deg, red, blue, green)' }].map(({ label, hex }) => (
                                        <button key={label} title={label} onClick={() => handleFilterChange('color', filters.color === label ? '' : label)} className={`w-7 h-7 rounded-full border-2 transition-all ${filters.color === label ? 'border-[#1861bf] scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'}`} style={{ background: hex }} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* === ITEM TYPE === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('itemType')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Item type</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.itemType ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.itemType && (
                                  <div className="px-4 pb-3 space-y-2">
                                    {['Handmade', 'Vintage', 'Craft supplies'].map((type) => (
                                      <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                        <div className="w-4 h-4 rounded border-2 border-gray-400 group-hover:border-[#1861bf] flex-shrink-0 transition-all" />
                                        <span className="text-xs text-gray-700 group-hover:text-black">{type}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* === ORDERING OPTIONS === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('orderingOptions')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Ordering options</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.orderingOptions ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.orderingOptions && (
                                  <div className="px-4 pb-3 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <div className="w-4 h-4 rounded border-2 border-gray-400 group-hover:border-[#1861bf] flex-shrink-0 transition-all" />
                                      <span className="text-xs text-gray-700 group-hover:text-black">Accepts custom orders</span>
                                    </label>
                                  </div>
                                )}
                              </div>

                              {/* === DELIVER TO === */}
                              <div className="border-b border-gray-200">
                                <button onClick={() => toggleSection('deliverTo')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <span className="font-semibold text-sm text-gray-900">Deliver to</span>
                                  <FiChevronDown className={`text-gray-500 text-xs transition-transform duration-200 ${openSections.deliverTo ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections.deliverTo && (
                                  <div className="px-4 pb-4">
                                    <div className="relative">
                                      <select defaultValue="" className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#1861bf] cursor-pointer">
                                        <option value="" disabled>Select destination...</option>
                                        {['Canada', 'United States', 'United Kingdom', 'India', 'Worldwide'].map((dest) => (
                                          <option key={dest} value={dest}>{dest}</option>
                                        ))}
                                      </select>
                                      <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>{/* end filter sections */}
                      </div>{/* end inner panel */}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* === PRODUCT GRID (shrinks when sidebar opens) === */}
                <div className="flex-1 min-w-0">

                  {/* === DYNAMIC TOPIC CHIPS (Books only — hidden when filter sidebar open) === */}
                  {categoryId === 'books' && !showFilters && selectedSubcategoryId && subcategoryTopics && (
                    <div className="mb-5 pt-2">
                      {subcategoryTopics.map(({ group, items }) => (
                        <div key={group} className="mb-3">
                          {/* Group label */}
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{group}</p>
                          {/* Topic chips */}
                          <div className="flex flex-wrap gap-2">
                            {items.map((topic) => (
                              <button
                                key={topic}
                                onClick={() => setSelectedTopic(selectedTopic === topic ? "" : topic)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                  selectedTopic === topic
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                                }`}
                              >
                                {topic}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

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
                        <div className={categoryId === 'books'
                          ? (showFilters
                            ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 w-full"
                            : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8 w-full")
                          : (showFilters
                            ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full"
                            : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6 w-full")
                        } ref={gridRef}>
                          {displayedItems.map((product) => (
                            <div key={product.id} className="product-card-gsap">
                              {categoryId === 'books' ? (
                                <BookProductCard product={product} />
                              ) : (
                                <ProductCard product={product} />
                              )}
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
                </div> {/* End Product grid flex column */}
              </div> {/* End inline sidebar + grid row */}
            </div> {/* End Right Content */}
          </div> {/* End Flex Wrapper */}
        </motion.div>
      </MobileLayout>
    </PageTransition>
  );
};

export default MobileCategory;

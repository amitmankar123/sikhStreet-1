import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiStar,
  FiHeart,
  FiShoppingBag,
  FiMinus,
  FiPlus,
  FiArrowLeft,
  FiShare2,
  FiCheckCircle,
  FiTrash2,
  FiTag,
  FiCompass,
  FiInfo,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiFlag,
  FiX,
  FiMail,
  FiMessageSquare,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, useUIStore } from "../../../shared/store/useStore";
import { useWishlistStore } from "../../../shared/store/wishlistStore";
import { useReviewsStore } from "../../../shared/store/reviewsStore";
import { useOrderStore } from "../../../shared/store/orderStore";
import { useAuthStore } from "../../../shared/store/authStore";
import { useCategoryStore } from "../../../shared/store/categoryStore";
import {
  getProductById,
  getSimilarProducts,
  getVendorById,
  getBrandById,
  getProductsByVendor,
} from "../data/catalogData";
import api from "../../../shared/utils/api";
import { formatPrice } from "../../../shared/utils/helpers";
import toast from "react-hot-toast";
import MobileLayout from "../components/Layout/MobileLayout";
import ImageGallery from "../../../shared/components/Product/ImageGallery";
import SearchBar from "../../../shared/components/SearchBar";
import VariantSelector from "../../../shared/components/Product/VariantSelector";
import ReviewForm from "../../../shared/components/Product/ReviewForm";
import ProductQA from "../components/ProductQA";
import MobileProductCard from "../components/Mobile/MobileProductCard";
import PageTransition from "../../../shared/components/PageTransition";
import Badge from "../../../shared/components/Badge";
import ProductCard from "../../../shared/components/ProductCard";
import { getVariantSignature, resolveVariantPrice } from "../../../shared/utils/variant";
import LazyImage from "../../../shared/components/LazyImage";



const isMongoId = (value) => {
  const str = String(value || "").trim();
  return /^[a-fA-F0-9]{24}$/.test(str) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(str);
};
const normalizeProduct = (raw) => {
  if (!raw) return null;

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

  const id = String(raw?.id || raw?._id || "").trim();
  if (!id) return null;

  const vendorId = String(vendorObj?._id || vendorObj?.id || raw?.vendorId || "").trim();
  const brandId = String(brandObj?._id || brandObj?.id || raw?.brandId || "").trim();
  const categoryId = String(categoryObj?._id || categoryObj?.id || raw?.categoryId || "").trim();
  const image = raw?.image || raw?.images?.[0] || "";
  const images = Array.isArray(raw?.images) ? raw.images.filter(Boolean) : image ? [image] : [];

  return {
    ...raw,
    id,
    _id: id,
    vendorId,
    brandId,
    categoryId,
    image,
    images,
    price: Number(raw?.price) || 0,
    originalPrice:
      raw?.originalPrice !== undefined && raw?.originalPrice !== null
        ? Number(raw.originalPrice)
        : undefined,
    rating: Number(raw?.rating) || 0,
    reviewCount: Number(raw?.reviewCount) || 0,
    stockQuantity: Number(raw?.stockQuantity) || 0,
    vendorName: raw?.vendorName || vendorObj?.storeName || vendorObj?.name || "",
    brandName: raw?.brandName || brandObj?.name || "",
    categoryName: raw?.categoryName || categoryObj?.name || "",
    vendor: vendorObj
      ? {
        ...vendorObj,
        id: String(vendorObj?.id || vendorObj?._id || vendorId),
      }
      : null,
    brand: brandObj
      ? {
        ...brandObj,
        id: String(brandObj?.id || brandObj?._id || brandId),
      }
      : null,
    stock:
      raw?.stock ||
      (Number(raw?.stockQuantity) > 0 ? "in_stock" : "out_of_stock"),
    description: String(raw?.description || "").trim(),
    unit: String(raw?.unit || "Piece").trim(),
  };
};

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
    <div
      onClick={() => {
        navigate(productLink);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
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
    </div>
  );
};

const SellerShopCard = ({ product }) => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(() => {
    try {
      const saved = localStorage.getItem("favorite_shops");
      const favs = saved ? JSON.parse(saved) : {};
      return !!favs[product.vendorId || "mock-book-vendor"];
    } catch {
      return false;
    }
  });

  const dbVendor = useMemo(() => {
    if (product.vendor?.id) return product.vendor;
    return getVendorById(product.vendorId);
  }, [product]);

  const resolvedVendor = useMemo(() => {
    if (dbVendor) {
      const joinYear = dbVendor.joinDate ? new Date(dbVendor.joinDate).getFullYear() : 2024;
      const currentYear = new Date().getFullYear();
      const yearsActive = Math.max(1, currentYear - joinYear);
      return {
        id: dbVendor.id || dbVendor._id,
        storeName: dbVendor.storeName || dbVendor.name || "Sikh Street Shop",
        ownerName: dbVendor.name?.split(" ")[0] || "Seller",
        rating: dbVendor.rating || 4.8,
        reviewCount: dbVendor.reviewCount || 128,
        totalSales: dbVendor.totalSales ? (dbVendor.totalSales >= 1000 ? `${(dbVendor.totalSales / 1000).toFixed(1)}k` : dbVendor.totalSales) : "1.2k",
        yearsOnPlatform: `${yearsActive} ${yearsActive === 1 ? "year" : "years"} on SikhStreet`,
        location: dbVendor.address?.country || "India",
        logo: dbVendor.storeLogo,
      };
    }

    const name = product.vendorName || "Qissa of Islam";
    const ownerName = name.replace(/^(By|Designed by)\s+/i, "").split(" ")[0] || "Muhebb";
    return {
      id: product.vendorId || "mock-book-vendor",
      storeName: name,
      ownerName: ownerName,
      rating: 4.9,
      reviewCount: 39,
      totalSales: "1.3k",
      yearsOnPlatform: "1 year on SikhStreet",
      location: "United States",
      logo: "/images/books/book_vendor_avatar.png",
    };
  }, [dbVendor, product]);

  const handleFollowToggle = (e) => {
    e.preventDefault();
    setIsFollowing(prev => {
      const next = !prev;
      try {
        const saved = localStorage.getItem("favorite_shops");
        const favs = saved ? JSON.parse(saved) : {};
        if (next) {
          favs[resolvedVendor.id] = true;
          toast.success(`Following ${resolvedVendor.storeName}!`);
        } else {
          delete favs[resolvedVendor.id];
          toast.success(`Unfollowed ${resolvedVendor.storeName}`);
        }
        localStorage.setItem("favorite_shops", JSON.stringify(favs));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const shopReviews = useMemo(() => {
    const vendorProducts = getProductsByVendor(resolvedVendor.id);
    const genericComments = [
      { user: "Amanpreet S.", comment: "Absolutely gorgeous craftsmanship! Highly recommend this shop." },
      { user: "Harpreet K.", comment: "Very fast shipping, excellent packaging, and high quality items." },
      { user: "Jaswinder S.", comment: "Fits perfectly. Beautifully made with great attention to detail." },
      { user: "Navjot S.", comment: "Top notch customer service. Very helpful and friendly seller." }
    ];

    if (vendorProducts.length > 0) {
      return genericComments.slice(0, Math.min(genericComments.length, vendorProducts.length)).map((item, idx) => {
        const prod = vendorProducts[idx % vendorProducts.length];
        return {
          id: `shop-rev-${idx}`,
          user: item.user,
          rating: 5,
          comment: item.comment,
          date: `${10 - idx} Jul, 2026`,
          productId: prod.id,
        };
      });
    }

    return [
      {
        id: "shop-rev-1",
        user: "Erum",
        rating: 5,
        comment: "Delivered to email immediately and easy to download. Great quality!",
        date: "09 Jul, 2026",
        productId: "321",
      },
      {
        id: "shop-rev-2",
        user: "Iqtidaar",
        rating: 5,
        comment: "It was a pdf sent, not a physical book. Very helpful content.",
        date: "06 Jul, 2026",
        productId: "321",
      },
      {
        id: "shop-rev-3",
        user: "Syed",
        rating: 5,
        comment: "Good book giving solid foundation of Sikh History and values.",
        date: "02 Jul, 2026",
        productId: "319",
      },
      {
        id: "shop-rev-4",
        user: "Jaspreet",
        rating: 5,
        comment: "Excellent print and clean translation. Highly recommended seller.",
        date: "28 Jun, 2026",
        productId: "319",
      }
    ];
  }, [resolvedVendor.id]);

  const resolvedReviews = useMemo(() => {
    // Try to resolve actual product image and name from getProductById fallback if available
    return shopReviews.map(rev => {
      const prod = getProductById(rev.productId);
      return {
        ...rev,
        productImage: prod?.image || "/images/books/maharani_jindan.png",
        productName: prod?.name || "Sikh History Book",
      };
    });
  }, [shopReviews]);

  const carouselRef = useRef(null);

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  return (
    <div className="border border-gray-200 rounded-[2rem] p-6 bg-white shadow-sm space-y-6 max-w-4xl text-left font-sans">
      {/* Profile Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar Container with Etsy-like shape */}
          <Link to={`/seller/${resolvedVendor.id}`} className="relative group flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <span className="text-xl font-bold text-purple-700">
                {resolvedVendor.storeName.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Flower Badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
              ✿
            </div>
          </Link>

          {/* Shop Details */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/seller/${resolvedVendor.id}`}
                className="text-lg font-bold text-gray-900 hover:underline transition-colors"
              >
                {resolvedVendor.storeName}
              </Link>
              <Link
                to={`/seller/${resolvedVendor.id}`}
                className="text-xs text-gray-500 underline hover:text-black"
              >
                {resolvedVendor.ownerName}
              </Link>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{resolvedVendor.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-600 font-medium">
              <span className="flex items-center gap-0.5 text-black font-bold">
                ★ {resolvedVendor.rating} <span className="text-gray-400 font-normal">({resolvedVendor.reviewCount})</span>
              </span>
              <span className="text-gray-300">|</span>
              <span>{resolvedVendor.totalSales} sales</span>
              <span className="text-gray-300">|</span>
              <span>{resolvedVendor.yearsOnPlatform}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleFollowToggle}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${isFollowing
                  ? "bg-gray-100 text-gray-800 border-gray-200"
                  : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                }`}
            >
              <FiHeart className={isFollowing ? "fill-red-500 text-red-500" : "text-gray-600"} />
              {isFollowing ? "Following" : "Follow shop"}
            </button>

            <Link
              to="/chat"
              className="flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold border border-black text-black hover:bg-gray-50 transition-all active:scale-95"
            >
              Message seller
            </Link>
          </div>
          <span className="text-[10px] text-gray-500 self-center sm:self-auto">Typically responds within a few hours</span>
        </div>
      </div>

      {/* Highlights Row */}
      <div className="border-t border-gray-150 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 font-medium">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mt-0.5">
            <FiMail className="text-gray-700 text-sm" />
          </div>
          <div>
            <strong className="text-gray-900 block font-bold">Speedy replies</strong>
            Has a history of replying to messages quickly.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mt-0.5">
            <FiMessageSquare className="text-gray-700 text-sm" />
          </div>
          <div>
            <strong className="text-gray-900 block font-bold">Rave reviews</strong>
            Average review rating is 4.8 or higher.
          </div>
        </div>
      </div>

      {/* Reviews Carousel Header */}
      <div className="border-t border-gray-150 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-gray-900 font-serif">
            All reviews from this shop ({resolvedVendor.reviewCount})
          </h4>
          <Link
            to={`/seller/${resolvedVendor.id}`}
            className="flex items-center justify-center rounded-full border border-black px-4 py-1.5 text-xs font-bold hover:bg-gray-50 transition-all"
          >
            Show all
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group/carousel">
          {/* Scroll Buttons */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-md hover:bg-gray-50 transition-all z-10 opacity-0 group-hover/carousel:opacity-100"
          >
            <FiChevronLeft className="text-gray-600" />
          </button>

          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-md hover:bg-gray-50 transition-all z-10 opacity-0 group-hover/carousel:opacity-100"
          >
            <FiChevronRight className="text-gray-600" />
          </button>

          {/* Horizontally scrollable list */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth scrollbar-none snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {resolvedReviews.map((rev) => (
              <div
                key={rev.id}
                className="flex-shrink-0 w-[290px] sm:w-[320px] bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 flex flex-col justify-between shadow-sm cursor-pointer transition-colors snap-start"
                onClick={() => navigate(`/product/${rev.productId}`)}
              >
                <div className="space-y-2">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`text-xs ${i < rev.rating ? "text-gray-900 fill-gray-900" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  {/* Comment */}
                  <div className="flex gap-2">
                    <p className="text-xs text-gray-700 leading-relaxed flex-1 line-clamp-3">
                      {rev.comment}
                    </p>
                    {rev.productImage && (
                      <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                        <img
                          src={rev.productImage}
                          alt={rev.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Reviewer Details */}
                <div className="mt-4 pt-3 border-t border-gray-50 space-y-1">
                  <div className="text-[10px] text-gray-400 font-medium">
                    <span className="font-semibold text-gray-600">{rev.user}</span>
                    <span className="mx-1.5">|</span>
                    <span>{rev.date}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium truncate">
                    Purchased: <span className="underline hover:text-black transition-colors">{rev.productName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MobileProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const localFallbackProduct = useMemo(() => normalizeProduct(getProductById(id)), [id]);
  const [product, setProduct] = useState(localFallbackProduct);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [embroideryEnabled, setEmbroideryEnabled] = useState(false);
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(false); // Turban only
  const [embroideryDemand, setEmbroideryDemand] = useState("");
  const [giftWrapDemand, setGiftWrapDemand] = useState("");
  const [artGiftWrapEnabled, setArtGiftWrapEnabled] = useState(false); // Art only — separate from turban
  const [personalMessage, setPersonalMessage] = useState("");
  const [isPersonalMessageOpen, setIsPersonalMessageOpen] = useState(false);
  const [selectedArtSize, setSelectedArtSize] = useState(null);
  const [selectedArtMaterial, setSelectedArtMaterial] = useState(null);

  // Book Product States
  const [selectedBookFormat, setSelectedBookFormat] = useState(null);
  const [selectedBookLanguage, setSelectedBookLanguage] = useState(null);
  const [isLookInsideOpen, setIsLookInsideOpen] = useState(false);
  const [lookInsideIndex, setLookInsideIndex] = useState(0);

  useEffect(() => {
    if (product?.turbanConfig?.fabric?.length > 0) {
      setSelectedFabric(null);
    }
  }, [product]);

  const { categories, initialize: initializeCategories } = useCategoryStore();

  useEffect(() => {
    if (!categories || categories.length === 0) {
      initializeCategories();
    }
  }, [categories, initializeCategories]);

  const breadcrumbs = useMemo(() => {
    if (!product || !categories || categories.length === 0) return [];

    const path = [];
    let currentId = product.categoryId;
    const visited = new Set();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const cat = categories.find(
        (c) => String(c.id || c._id) === String(currentId)
      );
      if (!cat) break;
      path.unshift(cat);

      const parent = cat.parentId;
      const parentId =
        parent && typeof parent === "object"
          ? parent._id || parent.id
          : parent;
      currentId = parentId;
    }

    return path;
  }, [product, categories]);


  const isKada = useMemo(() => {
    if (!product) return false;
    const nameMatch = (product.name || "").toLowerCase().includes("kada") || (product.name || "").toLowerCase().includes("kadda") || (product.name || "").toLowerCase().includes("bangle");
    const catMatch = (product.categoryName || "").toLowerCase().includes("kada") || (product.categoryName || "").toLowerCase().includes("kadda") || (product.categoryName || "").toLowerCase().includes("bangle");
    const idMatch = String(product.categoryId).toLowerCase().includes("kada") || String(product.categoryId).toLowerCase().includes("kadda");
    return nameMatch || catMatch || idMatch;
  }, [product]);

  const isTurbanProduct = useMemo(() => {
    if (!product) return false;
    const catMatch = (product.categoryName || "").toLowerCase().includes("turban");
    const hasTurbanConfig = product.turbanConfig && (
      Array.isArray(product.turbanConfig.fabric) && product.turbanConfig.fabric.length > 0 ||
      product.turbanConfig.embroidery?.enabled ||
      product.turbanConfig.giftWrap?.enabled
    );
    return catMatch || hasTurbanConfig;
  }, [product]);

  // isArtProduct: completely separate from isTurbanProduct — artConfig never mixes with turbanConfig

  const isBookProduct = useMemo(() => {
    if (!product) return false;
    const catMatch = (product.categoryName || "").toLowerCase().includes("book");
    const idMatch = String(product.categoryId).toLowerCase().includes("book");
    return catMatch || idMatch;
  }, [product]);

  const isArtProduct = useMemo(() => {
    if (!product) return false;
    const catMatch = (product.categoryName || "").toLowerCase().includes("art");
    const hasArtConfig = !!product.artConfig;
    const hasFrameVariant = Array.isArray(product.variants?.attributes) &&
      product.variants.attributes.some((a) => String(a.name || "").toLowerCase() === "frame");
    return catMatch || hasArtConfig || hasFrameVariant;
  }, [product]);

  const isFractionalUnit = useMemo(() => {
    if (isTurbanProduct) return false;
    if (!product?.unit) return false;
    const unitStr = product.unit.toLowerCase();
    return ['meter', 'meters', 'm', 'kg', 'kilogram', 'kilograms', 'gram', 'grams', 'g', 'litre', 'litres', 'l'].includes(unitStr);
  }, [product?.unit, isTurbanProduct]);

  const quantityStep = isFractionalUnit ? 0.5 : 1;
  const minQuantity = isFractionalUnit ? 0.5 : 1;

  const { items, addItem, removeItem } = useCartStore();
  const triggerCartAnimation = useUIStore(
    (state) => state.triggerCartAnimation
  );
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();
  const { fetchReviews, sortReviews, addReview } = useReviewsStore();
  const { getAllOrders, fetchUserOrders, orders } = useOrderStore();
  const { user, isAuthenticated } = useAuthStore();
  const vendor = useMemo(() => {
    if (!product) return null;
    if (product.vendor?.id) return product.vendor;
    return getVendorById(product.vendorId);
  }, [product]);
  const brand = useMemo(() => {
    if (!product) return null;
    if (product.brand?.id) return product.brand;
    return getBrandById(product.brandId);
  }, [product]);

  const isFavorite = product ? isInWishlist(product.id) : false;
  const selectedVariantSignature = getVariantSignature(selectedVariant || {});
  const isInCart = product
    ? items.some(
      (item) =>
        String(item.id) === String(product.id) &&
        getVariantSignature(item.variant || {}) === selectedVariantSignature
    )
    : false;
  const productReviews = product ? sortReviews(product.id, "newest") : [];

  useEffect(() => {
    let active = true;
    setIsLoadingProduct(true);

    const loadProductDetail = async () => {
      try {
        const [detailRes, similarRes] = await Promise.allSettled([
          api.get(`/products/${id}`),
          api.get(`/similar/${id}`),
        ]);

        const detailPayload =
          detailRes.status === "fulfilled"
            ? detailRes.value?.data ?? detailRes.value
            : null;
        const resolvedProduct = normalizeProduct(detailPayload) || localFallbackProduct;

        const similarPayload =
          similarRes.status === "fulfilled"
            ? similarRes.value?.data ?? similarRes.value
            : null;
        const resolvedSimilar = Array.isArray(similarPayload)
          ? similarPayload
            .map(normalizeProduct)
            .filter(
              (item) => item?.id && String(item.id) !== String(resolvedProduct?.id || "")
            )
            .slice(0, 5)
          : [];

        if (!active) return;

        setProduct(resolvedProduct);
        if (resolvedSimilar.length > 0) {
          setSimilarProducts(resolvedSimilar);
        } else if (resolvedProduct?.id) {
          setSimilarProducts(getSimilarProducts(resolvedProduct.id, 5));
        } else {
          setSimilarProducts([]);
        }
      } catch {
        if (!active) return;
        setProduct(localFallbackProduct);
        setSimilarProducts(
          localFallbackProduct?.id ? getSimilarProducts(localFallbackProduct.id, 5) : []
        );
      } finally {
        if (active) setIsLoadingProduct(false);
      }
    };

    loadProductDetail();
    return () => {
      active = false;
    };
  }, [id, localFallbackProduct]);

  useEffect(() => {
    if (product?.variants?.defaultSelection && typeof product.variants.defaultSelection === "object") {
      setSelectedVariant(product.variants.defaultSelection);
      return;
    }
    if (product?.variants?.defaultVariant) {
      setSelectedVariant(product.variants.defaultVariant);
      return;
    }
    setSelectedVariant({});
  }, [product]);

  useEffect(() => {
    if (product?.bookConfig) {
      if (Array.isArray(product.bookConfig.formatOptions) && product.bookConfig.formatOptions.length > 0) {
        setSelectedBookFormat(product.bookConfig.formatOptions[0]);
      } else {
        setSelectedBookFormat(null);
      }
      if (Array.isArray(product.bookConfig.languageOptions) && product.bookConfig.languageOptions.length > 0) {
        setSelectedBookLanguage(product.bookConfig.languageOptions[0]);
      } else {
        setSelectedBookLanguage(null);
      }
    } else {
      setSelectedBookFormat(null);
      setSelectedBookLanguage(null);
    }
  }, [product]);

  useEffect(() => {
    if (product?.id) {
      fetchReviews(product.id, { sort: "newest", limit: 50 });
    }
  }, [product?.id, fetchReviews]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserOrders(1, 50).catch(() => null);
    }
  }, [isAuthenticated, fetchUserOrders]);

  useEffect(() => {
    if (product?.id && (window.location.hash === "#reviews" || window.location.search.includes("write-review=true"))) {
      // Small timeout to allow DOM to render and layout to settle
      const timer = setTimeout(() => {
        const el = document.getElementById("reviews-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [product, isAuthenticated]);

  const handleAddToCart = (redirectToCheckout = false) => {
    if (!product) return;
    const attributeAxes = Array.isArray(product?.variants?.attributes)
      ? product.variants.attributes.filter((attr) => Array.isArray(attr?.values) && attr.values.length > 0)
      : [];
    const hasDynamicAxes = attributeAxes.length > 0;
    const hasSizeVariants = Array.isArray(product?.variants?.sizes) && product.variants.sizes.length > 0;
    const hasColorVariants = Array.isArray(product?.variants?.colors) && product.variants.colors.length > 0;
    const isMissingDynamicAxis = hasDynamicAxes
      ? attributeAxes.some((attr) => !String(selectedVariant?.[attr.name] || selectedVariant?.[String(attr.name || "").toLowerCase().replace(/\s+/g, "_")] || "").trim())
      : false;
    const selectedSize = String(selectedVariant?.size || "").trim();
    const selectedColor = String(selectedVariant?.color || "").trim();
    if (isMissingDynamicAxis || ((hasSizeVariants && !selectedSize) || (hasColorVariants && !selectedColor))) {
      toast.error("Please select required variant options");
      return;
    }

    if (product?.artworkConfig) {
      if (!selectedArtSize || !selectedArtMaterial) {
        toast.error("Please select both Size and Stretched/Unstretched options");
        return;
      }
    }

    let computedBaseRate = resolveVariantPrice(product, selectedVariant || {});
    if (product?.artworkConfig && selectedArtSize && selectedArtMaterial) {
      computedBaseRate = selectedArtSize.basePrice * selectedArtMaterial.priceMultiplier;
    }
    let baseRate = computedBaseRate;
    if (isBookProduct && selectedBookFormat) {
      baseRate = Number(product.price || 0) + Number(selectedBookFormat.priceOffset || 0);
    }
    const fabricRate = selectedFabric ? Number(selectedFabric.price) : 0;
    const ratePerMeter = isTurbanProduct && fabricRate > 0 ? fabricRate : baseRate;

    // Turban-specific fees
    const embroideryFee = (isTurbanProduct && embroideryEnabled && product?.turbanConfig?.embroidery?.price) ? Number(product.turbanConfig.embroidery.price) : 0;
    const giftWrapFee = (isTurbanProduct && giftWrapEnabled && product?.turbanConfig?.giftWrap?.price) ? Number(product.turbanConfig.giftWrap.price) : 0;

    // Art-specific gift wrap fee (separate from turban)
    const artGiftWrapFeeLocal = (isArtProduct && artGiftWrapEnabled && product?.artConfig?.giftWrap?.price) ? Number(product.artConfig.giftWrap.price) : 0;

    const turbanLength = isTurbanProduct ? (parseFloat(selectedVariant?.size) || 1) : 1;
    // baseRate for art already includes frame add-on price
    const finalPrice = ratePerMeter * turbanLength + embroideryFee + giftWrapFee + artGiftWrapFeeLocal;

    const cartVariant = {
      ...(selectedVariant || {}),
      ...(selectedFabric ? { fabric: selectedFabric.type } : {}),
      ...(embroideryEnabled ? { embroidery: "Yes", embroidery_demand: embroideryDemand } : {}),
      ...(giftWrapEnabled ? { gift_wrap: "Yes", gift_wrap_demand: giftWrapDemand } : {}),
      ...(artGiftWrapEnabled ? { art_gift_wrap: "Yes" } : {}),
      ...(product?.artworkConfig && selectedArtSize ? { art_size: selectedArtSize.label } : {}),
      ...(product?.artworkConfig && selectedArtMaterial ? { art_material: selectedArtMaterial.label } : {}),
      ...(personalMessage ? { personal_message: personalMessage } : {}),
      ...(isBookProduct && selectedBookFormat ? { format: selectedBookFormat.label } : {}),
      ...(isBookProduct && selectedBookLanguage ? { language: selectedBookLanguage.label } : {}),
    };

    const variantKey = getVariantSignature(selectedVariant || {});
    const variantStockValue = Number(
      product?.variants?.stockMap?.[variantKey] ??
      product?.variants?.stockMap?.get?.(variantKey)
    );
    const effectiveStock = Number.isFinite(variantStockValue)
      ? variantStockValue
      : Number(product.stockQuantity || 0);

    if (redirectToCheckout) {
      if (effectiveStock <= 0) {
        toast.error("Selected variant is out of stock");
        return;
      }
      if (quantity > effectiveStock) {
        toast.error(`Only ${effectiveStock} item(s) available for selected variant`);
        return;
      }
    }

    const addedToCart = addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image,
      quantity: quantity,
      variant: cartVariant,
      stockQuantity: effectiveStock,
      vendorId: product.vendorId,
      vendorName: vendor?.storeName || vendor?.name || product.vendorName,
      unit: isTurbanProduct ? 'Piece' : product.unit,
    }, !redirectToCheckout);
    if (!addedToCart) return;
    if (redirectToCheckout === true) {
      navigate('/checkout');
    } else {
      triggerCartAnimation();
      toast.success("Added to cart!");
    }
  };

  const handleRemoveFromCart = () => {
    if (!product) return;
    removeItem(product.id, selectedVariant || {});
    toast.success("Removed from cart!");
  };

  const handleFavorite = () => {
    if (!product) return;
    if (isFavorite) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      const addedToWishlist = addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      if (addedToWishlist) {
        toast.success("Added to wishlist");
      }
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = parseFloat((Number(quantity) + Number(change)).toFixed(2));
    const effectiveMax = 999;

    if (newQuantity >= minQuantity && newQuantity <= effectiveMax) {
      setQuantity(newQuantity);
    }
  };

  const handleQuantityInput = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= minQuantity) {
      setQuantity(val);
    }
  };

  const productImages = useMemo(() => {
    if (!product) return [];

    const selectedVariantKey = getVariantSignature(selectedVariant || {});
    const colorKey = selectedVariant?.color ? `color=${String(selectedVariant.color).trim().toLowerCase()}` : "";
    const selectedVariantImg = String(
      product?.variants?.imageMap?.[selectedVariantKey] ||
      product?.variants?.imageMap?.get?.(selectedVariantKey) ||
      product?.variants?.imageMap?.[colorKey] ||
      product?.variants?.imageMap?.get?.(colorKey) ||
      ""
    ).trim();

    const baseImages =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images.filter(Boolean)
        : product.image
          ? [product.image]
          : [];

    const allVariantImages = [];
    if (product?.variants?.imageMap) {
      const mapValues = product.variants.imageMap instanceof Map
        ? Array.from(product.variants.imageMap.values())
        : Object.values(product.variants.imageMap);
      mapValues.forEach(val => {
        if (typeof val === "string" && val.trim() && !allVariantImages.includes(val.trim())) {
          allVariantImages.push(val.trim());
        }
      });
    }

    const combined = [];
    if (selectedVariantImg) {
      combined.push(selectedVariantImg);
    }

    baseImages.forEach(img => {
      if (!combined.includes(img)) {
        combined.push(img);
      }
    });

    allVariantImages.forEach(img => {
      if (!combined.includes(img)) {
        combined.push(img);
      }
    });

    return combined;
  }, [product, selectedVariant]);

  const currentPrice = useMemo(() => {
    return resolveVariantPrice(product, selectedVariant);
  }, [product, selectedVariant]);

  const selectedAvailableStock = useMemo(() => {
    return 999;
  }, []);

  const productFaqs = useMemo(() => {
    if (!Array.isArray(product?.faqs)) return [];
    return product.faqs
      .map((faq) => ({
        question: String(faq?.question || "").trim(),
        answer: String(faq?.answer || "").trim(),
      }))
      .filter((faq) => faq.question && faq.answer);
  }, [product?.faqs]);

  const eligibleDeliveredOrderId = useMemo(() => {
    if (!isAuthenticated || !user?.id || !isMongoId(product?.id)) return null;
    const userOrders = getAllOrders(user.id) || [];
    const eligibleOrder = userOrders.find((order) => {
      if (String(order?.status || "").toLowerCase() !== "delivered") return false;
      const items = Array.isArray(order?.items) ? order.items : [];
      return items.some(
        (item) => String(item?.productId || item?.id || "") === String(product.id)
      );
    });
    return eligibleOrder?.id || eligibleOrder?._id || null;
  }, [isAuthenticated, user?.id, product?.id, orders]);

  const handleSubmitReview = async (reviewData) => {
    if (!eligibleDeliveredOrderId) {
      toast.error("You can review only after this product is delivered");
      return false;
    }

    const ok = await addReview(product.id, {
      ...reviewData,
      orderId: eligibleDeliveredOrderId,
    });
    if (!ok) {
      toast.error("Unable to submit review");
      return false;
    }

    await fetchReviews(product.id, { sort: "newest", limit: 50 });
    return true;
  };

  let baseRate = product ? resolveVariantPrice(product, selectedVariant || {}) : 0;
  if (product?.artworkConfig && selectedArtSize && selectedArtMaterial) {
    baseRate = selectedArtSize.basePrice * selectedArtMaterial.priceMultiplier;
  }
  if (isBookProduct && selectedBookFormat) {
    baseRate = Number(product.price || 0) + Number(selectedBookFormat.priceOffset || 0);
  }
  const fabricRate = selectedFabric ? Number(selectedFabric.price) : 0;
  const ratePerMeter = isTurbanProduct && fabricRate > 0 ? fabricRate : baseRate;

  // Turban-specific fees
  const embroideryFee = (isTurbanProduct && embroideryEnabled && product?.turbanConfig?.embroidery?.price) ? Number(product.turbanConfig.embroidery.price) : 0;
  const giftWrapFee = (isTurbanProduct && giftWrapEnabled && product?.turbanConfig?.giftWrap?.price) ? Number(product.turbanConfig.giftWrap.price) : 0;

  // Art-specific gift wrap fee — completely separate from turban fees
  const artGiftWrapFee = (isArtProduct && artGiftWrapEnabled && product?.artConfig?.giftWrap?.price) ? Number(product.artConfig.giftWrap.price) : 0;

  const turbanLength = isTurbanProduct ? (parseFloat(selectedVariant?.size) || 1) : 1;
  const unitPrice = ratePerMeter * turbanLength + embroideryFee + giftWrapFee + artGiftWrapFee;
  const finalCalculatedPrice = unitPrice * quantity;

  if (!product) {
    return (
      <PageTransition>
        <MobileLayout showBottomNav={false} showCartBar={false}>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center">
              {isLoadingProduct ? (
                <h2 className="text-xl font-bold text-gray-800 mb-4">Loading product...</h2>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Product Not Found
                  </h2>
                  <button
                    onClick={() => navigate("/home")}
                    className="gradient-green text-white px-6 py-3 rounded-xl font-semibold">
                    Go Back Home
                  </button>
                </>
              )}
            </div>
          </div>
        </MobileLayout>
      </PageTransition>
    );
  }

  const reviewsSection = (
    <div id="reviews-section" className="border-t border-gray-200 pt-10">
      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">
        Reviews for this item
      </h3>
      {productReviews && productReviews.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl font-bold text-gray-900">
              {product.rating ? product.rating.toFixed(1) : "5.0"}
            </span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`text-lg ${i < Math.floor(product.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">
              ({productReviews.length} reviews)
            </span>
          </div>

          <div className="space-y-6">
            {productReviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`text-sm ${i < Math.floor(review.rating) ? "text-gray-900 fill-gray-900" : "text-gray-300"}`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(review.createdAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed mb-3">{review.comment}</p>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                    {review.user.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {review.user}
                  </span>
                </div>

                {review.vendorResponse && (
                  <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white">
                        {vendor?.storeName?.charAt(0) || "V"}
                      </div>
                      <span className="text-xs font-bold text-gray-900">
                        {vendor?.storeName || "Vendor"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{review.vendorResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      )}

      {/* Write Review */}
      {isAuthenticated && isMongoId(product?.id) && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          {eligibleDeliveredOrderId ? (
            <ReviewForm
              productId={product.id}
              onSubmit={handleSubmitReview}
            />
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-600">
              Reviews are available after product delivery.
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <PageTransition>
      <MobileLayout showBottomNav={false} showCartBar={true}>
        <div className="w-full pb-4 lg:pb-8 max-w-7xl mx-auto">
          {/* Page Search Bar with bottom padding */}
          {!isBookProduct && (
            <div className="px-6 lg:px-8 pt-4 pb-6 w-full max-w-2xl">
              <SearchBar size="default" />
            </div>
          )}

          {/* Breadcrumbs */}
          <div className="hidden lg:flex px-6 pt-4 lg:pt-6 lg:px-8 items-center justify-start flex-wrap gap-1.5 text-sm md:text-base text-brand-muted font-sans">
            <Link to="/home" className="hover:text-[#F5A623] hover:underline transition-colors font-medium">
              Homepage
            </Link>
            {breadcrumbs.map((cat) => (
              <div key={cat.id || cat._id} className="flex items-center gap-1.5">
                <span className="text-brand-subtle font-light">›</span>
                <Link to={`/category/${cat.id || cat._id}`} className="hover:text-[#F5A623] hover:underline transition-colors font-medium">
                  {cat.name}
                </Link>
              </div>
            ))}
            <span className="text-brand-subtle font-light">›</span>
            <span className="text-brand-navy font-semibold truncate max-w-[150px] md:max-w-xs">
              {product.name}
            </span>
          </div>

          {/* Back Button */}
          <div className="hidden lg:block px-4 pt-2 lg:pt-4 lg:px-8 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                <FiArrowLeft className="text-xl" />
              </div>
              <span className="font-medium">Back</span>
            </button>
          </div>
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-12 lg:px-8 lg:items-start max-w-[1400px] mx-auto">
            {/* LEFT COLUMN: Image Gallery + Reviews (Spans 7 columns) */}
            <div className="lg:col-span-7 p-0 lg:p-0">
              {/* Gallery */}
              <div className="mb-8 relative">
                <ImageGallery
                  images={productImages}
                  video={product.video}
                  productName={product.name}
                  showFavorite={true}
                  isFavorite={isFavorite}
                  onFavoriteClick={handleFavorite}
                  isBestseller={product.isBestseller}
                  onLookInsideClick={isBookProduct && product.bookConfig?.previewPages?.length > 0 ? () => {
                    setLookInsideIndex(0);
                    setIsLookInsideOpen(true);
                  } : null}
                />
              </div>

              {/* Report to Etsy placeholder */}
              <div className="flex justify-end mb-12 text-sm text-gray-500 font-medium hover:underline cursor-pointer">
                <FiFlag className="inline mr-2" /> Report this item to SikhStreet
              </div>

              {/* Reviews Section (Desktop Only) */}
              <div className="hidden lg:block">
                {reviewsSection}
              </div>

              {/* Seller Shop & Reviews Section (Desktop Only, All Products) */}
              <div className="hidden lg:block mt-6 max-w-4xl">
                <SellerShopCard product={product} />
              </div>

              {/* Community Q&A (Desktop Only) */}
              <div className="hidden lg:block mt-6 max-w-4xl border-t border-gray-200 pt-6">
                <ProductQA productId={product.id} />
              </div>
            </div>

            {/* RIGHT COLUMN: Info + Configuration (Spans 5 columns) */}
            <div className="lg:col-span-5 px-4 py-4 lg:p-0 lg:sticky lg:top-24 flex flex-col gap-5">
              {/* Scarcity */}
              {isBookProduct ? (
                <p className="text-xs md:text-sm font-bold text-[#C82333] font-sans">
                  In 20+ baskets
                </p>
              ) : (
                selectedAvailableStock < 10 && selectedAvailableStock > 0 && (
                  <p className="text-sm font-bold text-red-600">In {selectedAvailableStock + 3} baskets</p>
                )
              )}

              {/* Price */}
              <div className="flex flex-col gap-1">
                {isBookProduct ? (
                  <div className="space-y-1 font-sans">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-gray-900">
                        Now {formatPrice(ratePerMeter)}
                      </span>
                    </div>
                    {product.originalPrice && (
                      <div className="text-sm text-gray-500 line-through font-medium">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}

                    {product.originalPrice && (
                      <div className="flex items-center gap-1 text-sm font-semibold text-green-700">
                        <span>{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off</span>
                        <span className="text-gray-400 font-light mx-0.5">•</span>
                        <span className="text-green-700">Sale ends on 05 August</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 font-medium mt-0.5">GST Included</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-gray-900">
                        {formatPrice(ratePerMeter)}
                      </span>
                      {isTurbanProduct && <span className="text-sm text-gray-500 font-normal">+ per meter</span>}
                    </div>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through font-medium">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                    <p className="text-xs text-gray-500 mt-1">* Seller GST included (where applicable). Additional GST may be applied at checkout.</p>
                  </>
                )}
              </div>

              {/* Title & Description */}
              <h1 className={`text-lg lg:text-xl font-normal leading-relaxed text-gray-900 font-sans mt-2`}>
                {product.name} - {product.description || "Premium quality Sikh artifact"}
              </h1>

              {/* Store Name & Rating */}
              <div className="flex items-center gap-2">
                {vendor && (
                  <Link
                    to={`/seller/${vendor.id}`}
                    className="text-sm font-medium text-gray-900 hover:underline flex items-center gap-1 group"
                  >
                    <span>{vendor.storeName || vendor.name}</span>
                    {isBookProduct ? (
                      <FiCheckCircle className="text-purple-600 text-xs" title="Star Seller" />
                    ) : vendor.isVerified && (
                      <FiCheckCircle className="text-blue-500 text-xs" title="Verified Vendor" />
                    )}
                  </Link>
                )}
                {product.rating > 0 && (
                  <div className="flex items-center gap-0.5 cursor-pointer text-gray-800">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`text-xs ${i < Math.floor(product.rating) ? "text-gray-900 fill-gray-900" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Configuration Dropdowns */}
              <div className="space-y-4 mt-2">

                {/* Book Configuration (Format & Language Selector) */}
                {isBookProduct && product?.bookConfig && (
                  <div className="space-y-4 mb-4 font-sans">
                    {/* Format Options */}
                    {Array.isArray(product.bookConfig.formatOptions) && product.bookConfig.formatOptions.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-stone-800">Format</label>
                        <div className="grid grid-cols-3 gap-2">
                          {product.bookConfig.formatOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedBookFormat(opt)}
                              className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center justify-center ${selectedBookFormat?.id === opt.id
                                ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                                : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                                }`}
                            >
                              <span className="truncate">{opt.label}</span>
                              <span className={`text-[10px] mt-0.5 ${selectedBookFormat?.id === opt.id ? "text-stone-300" : "text-stone-500"}`}>
                                {formatPrice(product.price + opt.priceOffset)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Language Options */}
                    {Array.isArray(product.bookConfig.languageOptions) && product.bookConfig.languageOptions.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Language</label>
                        <div className="relative">
                          <select
                            value={selectedBookLanguage?.id || ""}
                            onChange={(e) => {
                              const lang = product.bookConfig.languageOptions.find((l) => l.id === e.target.value);
                              if (lang) setSelectedBookLanguage(lang);
                            }}
                            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 appearance-none focus:outline-none focus:border-gray-900 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.08)] cursor-pointer shadow-sm hover:border-gray-400 transition-all"
                          >
                            {product.bookConfig.languageOptions.map((lang) => (
                              <option key={lang.id} value={lang.id}>
                                {lang.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <FiChevronDown className="text-gray-500 text-base" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Length / Sizes Selector (Turbans Only) */}
                {isTurbanProduct && (() => {
                  let sizes = product?.variants?.sizes || [];
                  if (sizes.length === 0 && Array.isArray(product?.variants?.attributes)) {
                    const sizeAttr = product.variants.attributes.find(
                      (a) => ["size", "length", "dimension"].includes(String(a.name || "").toLowerCase())
                    );
                    if (sizeAttr && Array.isArray(sizeAttr.values)) {
                      sizes = sizeAttr.values;
                    }
                  }
                  if (sizes.length === 0 && isTurbanProduct) {
                    sizes = ["5m", "5.5m", "6m", "6.5m", "7m", "7.5m", "8m"];
                  }
                  if (sizes.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Length of Fabric</label>
                        {selectedVariant?.size && (
                          <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">{selectedVariant.size}</span>
                        )}
                      </div>
                      <div className="relative">
                        <select
                          value={selectedVariant?.size || ""}
                          onChange={(e) => setSelectedVariant(prev => ({ ...prev, size: e.target.value }))}
                          className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 appearance-none focus:outline-none focus:border-gray-900 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.08)] cursor-pointer shadow-sm hover:border-gray-400 transition-all"
                        >
                          <option value="" disabled>Select an option</option>
                          {sizes.map((sizeVal) => (
                            <option key={sizeVal} value={sizeVal}>{sizeVal}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                          <FiChevronDown className="text-gray-500 text-base" />
                        </div>
                      </div>

                      {/* Custom Length Input Option */}
                      <div className="mt-2 flex items-center gap-3">
                        <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Or Custom Length:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0.5"
                            max="30"
                            step="0.1"
                            value={(() => {
                              const sizeStr = selectedVariant?.size || "";
                              const match = sizeStr.match(/^([\d.]+)/);
                              return match ? match[1] : "";
                            })()}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              if (valStr === "") {
                                setSelectedVariant(prev => ({ ...prev, size: "" }));
                              } else {
                                setSelectedVariant(prev => ({ ...prev, size: `${valStr}m` }));
                              }
                            }}
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
                          />
                          <span className="text-xs text-gray-500 font-semibold">meters</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Fabric Selector */}
                {isTurbanProduct && product?.turbanConfig?.fabric?.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Fabric Type</label>
                    <div className="relative">
                      <select
                        value={selectedFabric?.type || ""}
                        onChange={(e) => {
                          const fabric = product.turbanConfig.fabric.find(f => f.type === e.target.value);
                          if (fabric) setSelectedFabric(fabric);
                        }}
                        className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 appearance-none focus:outline-none focus:border-gray-900 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.08)] cursor-pointer shadow-sm hover:border-gray-400 transition-all"
                      >
                        <option value="" disabled>Select an option</option>
                        {product.turbanConfig.fabric.map((fabric) => (
                          <option key={fabric.type} value={fabric.type}>{fabric.type}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <FiChevronDown className="text-gray-500 text-base" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Selector (Turbans Only) */}
                {isTurbanProduct && (() => {
                  let colors = product?.variants?.colors || [];
                  if (colors.length === 0 && Array.isArray(product?.variants?.attributes)) {
                    const colorAttr = product.variants.attributes.find(
                      (a) => String(a.name || "").toLowerCase() === "color"
                    );
                    if (colorAttr && Array.isArray(colorAttr.values)) {
                      colors = colorAttr.values;
                    }
                  }
                  if (colors.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Color</label>
                        {selectedVariant?.color && (
                          <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">{selectedVariant.color}</span>
                        )}
                      </div>
                      <div className="relative">
                        <select
                          value={selectedVariant?.color || ""}
                          onChange={(e) => setSelectedVariant(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 appearance-none focus:outline-none focus:border-gray-900 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.08)] cursor-pointer shadow-sm hover:border-gray-400 transition-all"
                        >
                          <option value="" disabled>Select an option</option>
                          {colors.map((colorName) => (
                            <option key={colorName} value={colorName}>{colorName}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                          <FiChevronDown className="text-gray-500 text-base" />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Artwork Config UI */}
                {product?.artworkConfig && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Size</label>
                      <div className="relative">
                        <select
                          value={selectedArtSize?.label || ""}
                          onChange={(e) => {
                            const sz = product.artworkConfig.sizes.find(s => s.label === e.target.value);
                            setSelectedArtSize(sz);
                          }}
                          className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 appearance-none focus:outline-none focus:border-gray-900 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.08)] cursor-pointer shadow-sm hover:border-gray-400 transition-all"
                        >
                          <option value="" disabled>Select an option</option>
                          {product.artworkConfig.sizes.map((s, idx) => (
                            <option key={idx} value={s.label}>{s.label}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                          <FiChevronDown className="text-gray-500 text-base" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Stretched or Unstretched</label>
                      <div className="relative">
                        <select
                          value={selectedArtMaterial?.label || ""}
                          onChange={(e) => {
                            const mat = product.artworkConfig.materials.find(m => m.label === e.target.value);
                            setSelectedArtMaterial(mat);
                          }}
                          className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 appearance-none focus:outline-none focus:border-gray-900 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.08)] cursor-pointer shadow-sm hover:border-gray-400 transition-all"
                        >
                          <option value="" disabled>Select an option</option>
                          {product.artworkConfig.materials.map((m, idx) => (
                            <option key={idx} value={m.label}>
                              {m.label} ({formatPrice((selectedArtSize?.basePrice || 0) * m.priceMultiplier)})
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                          <FiChevronDown className="text-gray-500 text-base" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* General Variants Selector for Non-Turban Products */}
                {!isTurbanProduct && product.variants && (
                  <div className="mb-2">
                    <VariantSelector
                      variants={product.variants}
                      onVariantChange={setSelectedVariant}
                      currentPrice={product.price}
                      isKada={isKada}
                      useDropdowns={true}
                    />
                  </div>
                )}

                {/* Quantity Selector Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Quantity</label>
                  <div className="relative">
                    <select
                      value={quantity}
                      onChange={handleQuantityInput}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white appearance-none focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-pointer"
                    >
                      {Array.from({ length: Math.min(10, selectedAvailableStock || 10) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <FiChevronDown className="text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Total Price breakdown */}
                {finalCalculatedPrice > 0 && (
                  <div className="py-2 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      Total: {formatPrice(finalCalculatedPrice)}
                    </p>
                  </div>
                )}

                {/* Add-ons Configuration */}
                {isTurbanProduct && (product?.turbanConfig?.embroidery?.enabled || product?.turbanConfig?.giftWrap?.enabled) && (
                  <div className="space-y-2.5 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Add-ons</p>
                    <div className="space-y-3">
                      {product.turbanConfig.embroidery?.enabled && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-normal text-gray-700">
                            <input
                              type="checkbox"
                              checked={embroideryEnabled}
                              onChange={(e) => setEmbroideryEnabled(e.target.checked)}
                              className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                            />
                            <span>Embroidery (+{formatPrice(product.turbanConfig.embroidery.price)})</span>
                          </label>
                          {embroideryEnabled && (
                            <input
                              type="text"
                              value={embroideryDemand}
                              onChange={(e) => setEmbroideryDemand(e.target.value)}
                              placeholder="Enter custom embroidery demand"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
                            />
                          )}
                        </div>
                      )}
                      {product.turbanConfig.giftWrap?.enabled && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-normal text-gray-700">
                            <input
                              type="checkbox"
                              checked={giftWrapEnabled}
                              onChange={(e) => setGiftWrapEnabled(e.target.checked)}
                              className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                            />
                            <span>Gift Packaging (+{formatPrice(product.turbanConfig.giftWrap.price)})</span>
                          </label>
                          {giftWrapEnabled && (
                            <input
                              type="text"
                              value={giftWrapDemand}
                              onChange={(e) => setGiftWrapDemand(e.target.value)}
                              placeholder="Enter gift note or packaging demand"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}



                {/* Bundle Recommendations (Etsy Style) */}
                {isBookProduct && product.bookConfig?.recommendsBundle && (
                  <div className="border border-stone-200/80 bg-white rounded-xl p-4 space-y-4 font-sans mt-2 shadow-sm">
                    <h4 className="text-sm font-bold text-stone-900">{product.bookConfig.recommendsBundle.title}</h4>
                    <div className="space-y-3">
                      {product.bookConfig.recommendsBundle.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <div className="w-12 h-14 bg-stone-50 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate">{item.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-bold text-stone-900">{formatPrice(item.price)}</span>
                              <span className="text-[10px] text-stone-400 line-through">{formatPrice(item.originalPrice)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-stone-500 font-medium">Bundle Price</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-extrabold text-stone-900">
                            {formatPrice(product.bookConfig.recommendsBundle.bundlePrice)}
                          </span>
                          <span className="text-xs text-stone-400 line-through">
                            {formatPrice(product.bookConfig.recommendsBundle.originalBundlePrice)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const bundle = product.bookConfig.recommendsBundle;
                          handleAddToCart(false);
                          addItem({
                            id: `bundle_item_${product.id}`,
                            name: bundle.items[1].name,
                            price: bundle.items[1].price,
                            image: bundle.items[1].image,
                            quantity: 1,
                            variant: { type: "Companion Bundle Addon" },
                            stockQuantity: 99,
                            vendorId: product.vendorId,
                            vendorName: product.vendorName,
                            unit: "Piece"
                          }, true);
                          toast.success("Added bundle to basket!");
                        }}
                        className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-sm active:scale-95"
                      >
                        Add bundle to basket
                      </button>
                    </div>
                  </div>
                )}

                {/* Buy Buttons */}
                <div className="flex flex-col gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(true)}
                    disabled={selectedAvailableStock <= 0}
                    className="w-full py-3.5 rounded-full font-bold text-black bg-white border-2 border-black hover:bg-[#F5A623] hover:text-black hover:border-[#F5A623] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Buy it now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(false)}
                    disabled={selectedAvailableStock <= 0}
                    className="w-full py-3.5 rounded-full font-bold text-white bg-black hover:bg-[#F5A623] hover:text-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to basket
                  </button>
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-black hover:bg-[#F5A623] hover:text-black rounded-full transition-colors mt-2"
                  >
                    <FiHeart className={`text-lg ${isFavorite ? "fill-[#F5A623] text-[#F5A623]" : ""}`} />
                    {isFavorite ? "Remove from collection" : "Add to collection"}
                  </button>

                  {/* Star Seller Card (Etsy Style) */}
                  {isBookProduct && (
                    <div className="flex gap-3.5 font-sans mt-3 items-start border-t border-b border-gray-200 py-3">
                      <div className="w-10 h-10 rounded-full bg-[#FAF0F8] flex items-center justify-center text-[#A24B91] flex-shrink-0">
                        <FiStar className="fill-[#A24B91] text-base animate-pulse" />
                      </div>
                      <div className="text-xs text-gray-600 leading-relaxed mt-0.5 text-left">
                        <span className="font-bold text-gray-900">Star Seller.</span> This seller consistently earned 5-star reviews, dispatched on time, and replied quickly to any messages they received.
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordions */}
                <div className="border-t border-gray-200 mt-6 pt-2 divide-y divide-gray-200">
                  <details className="group" open>
                    <summary className="flex items-center justify-between py-4 cursor-pointer list-none font-bold text-gray-900 outline-none">
                      Item details
                      <span className="transition group-open:rotate-180">
                        <FiChevronDown className="text-xl" />
                      </span>
                    </summary>
                    <div className="pb-4 space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900">Highlights</p>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {vendor && (
                            <li>Made by <strong>{vendor.storeName || vendor.name}</strong></li>
                          )}
                          {(() => {
                            const specs = product.specifications;
                            // Normalize: handle array, plain object {key: val}, or null/undefined
                            const specsArray = Array.isArray(specs)
                              ? specs
                              : specs && typeof specs === 'object'
                                ? Object.entries(specs).map(([k, v]) => ({ name: k, value: v }))
                                : [];

                            // Safely convert a value to a renderable string
                            const toDisplayValue = (val) => {
                              if (val === null || val === undefined) return '';
                              if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                                return String(val);
                              }
                              if (Array.isArray(val)) {
                                // Render simple scalar arrays as comma list; skip complex object arrays
                                const simple = val.filter(v => typeof v !== 'object');
                                return simple.length ? simple.join(', ') : null;
                              }
                              if (typeof val === 'object') {
                                // Skip complex nested objects (e.g. bundle configs) — not user-facing
                                return null;
                              }
                              return String(val);
                            };

                            return specsArray
                              .map((spec, idx) => {
                                const displayVal = toDisplayValue(spec.value);
                                if (displayVal === null) return null; // skip non-displayable entries
                                return (
                                  <li key={idx}><strong>{spec.name}</strong>: {displayVal}</li>
                                );
                              })
                              .filter(Boolean);
                          })()}
                        </ul>
                      </div>

                      {isBookProduct ? (
                        <div className="mt-6 border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm font-sans">
                          {/* Synopsis Header */}
                          <div className="border-b border-stone-200 bg-stone-50 px-5 py-3 flex items-center justify-between">
                            <h3 className="text-stone-800 font-extrabold tracking-wide uppercase text-xs">Synopsis & Details</h3>
                          </div>
                          <div className="p-6 flex flex-col gap-6">
                            {/* Synopsis Text */}
                            <div className="space-y-4 text-stone-700 text-sm font-serif leading-relaxed">
                              <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-stone-900 first-letter:float-left first-letter:mr-2">
                                {product.bookConfig?.synopsis || product.description}
                              </p>
                            </div>

                            {/* Publisher Info / Metadata Grid */}
                            <div className="border-t border-stone-150 pt-5 space-y-3 font-sans">
                              <h4 className="text-stone-900 font-bold text-xs uppercase tracking-wider">Book Information</h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-stone-600 mt-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-stone-500 w-20 flex-shrink-0">Publisher:</span>
                                  <span className="truncate">{product.bookConfig?.publisher || "John Murray Press"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-stone-500 w-20 flex-shrink-0">ISBN:</span>
                                  <span className="truncate">{product.bookConfig?.isbn || "9781444105100"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-stone-500 w-20 flex-shrink-0">Pages:</span>
                                  <span>{product.bookConfig?.pages || "272"} pages</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-stone-500 w-20 flex-shrink-0">Dimensions:</span>
                                  <span className="truncate">{product.bookConfig?.dimensions || "196 x 128 x 18 mm"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-stone-500 w-20 flex-shrink-0">Weight:</span>
                                  <span>{product.bookConfig?.weight || "220 g"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-stone-500 w-20 flex-shrink-0">Language:</span>
                                  <span>{product.bookConfig?.language || "English"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {product.description}
                        </p>
                      )}

                    </div>
                  </details>

                  {vendor && (vendor.storePolicies || vendor.shippingPolicy || vendor.refundPolicy) && (
                    <details className="group">
                      <summary className="flex items-center justify-between py-4 cursor-pointer list-none font-bold text-gray-900 outline-none">
                        Delivery and return policies
                        <span className="transition group-open:rotate-180">
                          <FiChevronDown className="text-xl" />
                        </span>
                      </summary>
                      <div className="pb-4 space-y-4">
                        {vendor.shippingPolicy && (
                          <div className="text-sm text-gray-700">
                            <p className="font-semibold mb-1">Shipping Information</p>
                            <p className="whitespace-pre-line text-xs text-gray-600">{vendor.shippingPolicy}</p>
                          </div>
                        )}
                        {vendor.refundPolicy && (
                          <div className="text-sm text-gray-700">
                            <p className="font-semibold mb-1">Returns & Exchanges</p>
                            <p className="whitespace-pre-line text-xs text-gray-600">{vendor.refundPolicy}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>

                {/* Reviews & QA (Mobile Only) */}
                <div className="block lg:hidden mt-8 space-y-8">
                  {reviewsSection}
                  <SellerShopCard product={product} />
                  <div className="border-t border-gray-200 pt-8">
                    <ProductQA productId={product.id} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Products (Outside the grid to span full-width) */}
          {similarProducts.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6 px-4 lg:px-8">
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">
                {isBookProduct ? "Other books you might like" : "You May Also Like"}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {similarProducts.map((similarProduct) => (
                  isBookProduct ? (
                    <BookProductCard
                      key={similarProduct.id}
                      product={similarProduct}
                    />
                  ) : (
                    <ProductCard
                      key={similarProduct.id}
                      product={similarProduct}
                    />
                  )
                ))}
              </div>
            </div>
          )}
        </div>

      </MobileLayout>

      {/* Look Inside Preview Modal */}
      <AnimatePresence>
        {isLookInsideOpen && isBookProduct && product.bookConfig?.previewPages?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 lg:p-10"
            onClick={() => setIsLookInsideOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FAF8F6] border border-stone-200 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col font-serif"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">Look Inside: {product.name}</h3>
                  <p className="text-xs text-stone-500 font-sans mt-0.5">
                    Page {lookInsideIndex + 1} of {product.bookConfig.previewPages.length} — {product.bookConfig.previewPages[lookInsideIndex].title}
                  </p>
                </div>
                <button
                  onClick={() => setIsLookInsideOpen(false)}
                  className="p-2 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Page Display Area */}
              <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-stone-100/50">
                <div className="relative max-w-lg w-full bg-white shadow-lg rounded-lg border border-stone-200/60 overflow-hidden flex flex-col">
                  {/* Parchment effect overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-yellow-50/5 via-transparent to-stone-500/5 mix-blend-multiply" />

                  <img
                    src={product.bookConfig.previewPages[lookInsideIndex].url}
                    alt={`Preview Page ${lookInsideIndex + 1}`}
                    className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                  />
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="px-6 py-4 border-t border-stone-200/80 flex items-center justify-between bg-stone-50 font-sans">
                <button
                  disabled={lookInsideIndex === 0}
                  onClick={() => setLookInsideIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-lg border border-stone-200 hover:border-stone-400 bg-white font-medium text-sm text-stone-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-all flex items-center gap-1.5"
                >
                  <FiChevronLeft className="text-base" /> Previous Page
                </button>
                <span className="text-sm font-semibold text-stone-600">
                  {lookInsideIndex + 1} / {product.bookConfig.previewPages.length}
                </span>
                <button
                  disabled={lookInsideIndex === product.bookConfig.previewPages.length - 1}
                  onClick={() => setLookInsideIndex(prev => Math.min(product.bookConfig.previewPages.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-lg border border-stone-200 hover:border-stone-400 bg-white font-medium text-sm text-stone-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-all flex items-center gap-1.5"
                >
                  Next Page <FiChevronRight className="text-base" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default MobileProductDetail;

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiFilter, FiArrowLeft, FiGrid, FiList, FiX, FiCheckCircle, FiStar, FiShoppingBag, FiHeart, FiMessageSquare, FiChevronDown, FiMail, FiSliders, FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import MobileLayout from "../components/Layout/MobileLayout";
import ProductListItem from "../components/Mobile/ProductListItem";
import { getProductsByVendor, getVendorById } from "../data/catalogData";
import PageTransition from "../../../shared/components/PageTransition";
import useInfiniteScroll from "../../../shared/hooks/useInfiniteScroll";
import LazyImage from "../../../shared/components/LazyImage";
import { getPlaceholderImage, formatPrice } from "../../../shared/utils/helpers";
import api from "../../../shared/utils/api";
import toast from "react-hot-toast";

const normalizeVendor = (raw) => ({
    ...raw,
    id: String(raw?.id || raw?._id || ""),
    _id: String(raw?.id || raw?._id || ""),
    rating: Number(raw?.rating) || 0,
    reviewCount: Number(raw?.reviewCount) || 0,
    isVerified: !!raw?.isVerified,
});

const normalizeProduct = (raw) => ({
    ...raw,
    id: String(raw?.id || raw?._id || ""),
    _id: String(raw?.id || raw?._id || ""),
    vendorId: String(raw?.vendorId?._id || raw?.vendorId || ""),
    brandId: String(raw?.brandId?._id || raw?.brandId || ""),
    image: raw?.image || raw?.images?.[0] || "",
    images: Array.isArray(raw?.images) ? raw.images : raw?.image ? [raw.image] : [],
    price: Number(raw?.price) || 0,
    rating: Number(raw?.rating) || 0,
    reviewCount: Number(raw?.reviewCount) || 0,
});

const mockVendorsMap = {
    "heritage-forge": {
        id: "heritage-forge",
        name: "Heritage Forge",
        storeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqMDXl2T65jyXSB9qeTJbnhG6G63aSMxrS9MUh0AbYVUdIDbGb1C9q5zVZDceaN7_Pwv058Lj-KsSgRwEzCJFUMAbtCByAMBt9t7qPEnVu8OX9GKowcLmKAy2DvI40dzo_tFZ-gk8-G2CdQgVtTQ64920GdgIjQGlqIp1wp_iUPpoTgquKdxgTjN9WLcy5cFXNMKqcU8uaA07icHP82RYxtFURIju60gx7_rTdvMXYc1NrM643G5Q7z1Bz2xHFltW_geS4P_MmP9Ow",
        storeName: "Heritage Forge",
        storeDescription: "Authentic damascened steel and gold traditional Sikh Karas, Kirpans, and artifacts handcrafted by Gurcharan Singh.",
        rating: 4.9,
        reviewCount: 290,
        totalSales: "3.8k",
        joinDate: "2024-01-15",
        address: {
            city: "Mohali",
            country: "India"
        },
        isVerified: true,
        storeBanner: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRcrJXYq55TYTCtcpBAfokwfJVCLHa0pJxpg_qF9GozEgjSj2v6vlltBzQqMIvjkb8eUhzhDwwbcU94q7s8xhlIZy7Rg03Dj9ovs0_tSLW-efBV24zNqQvpgk1ThlcSUhJzzJn0NHYcEifleVZn-C0_Fb-2mvUAVb5B68Y2hBWzLp-g9N-BObQmeLFaP68M-CpJ5dr0ys6SoxDOBzDYgLOtgxn9bgiGCZgKHavOhYfs8aFjyx2BPjCvHHbauGCoHyd7pPfcRgmJdOP"
    },
    "heritage-woodcarvers": {
        id: "heritage-woodcarvers",
        name: "Heritage Woodcarvers",
        storeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqMDXl2T65jyXSB9qeTJbnhG6G63aSMxrS9MUh0AbYVUdIDbGb1C9q5zVZDceaN7_Pwv058Lj-KsSgRwEzCJFUMAbtCByAMBt9t7qPEnVu8OX9GKowcLmKAy2DvI40dzo_tFZ-gk8-G2CdQgVtTQ64920GdgIjQGlqIp1wp_iUPpoTgquKdxgTjN9WLcy5cFXNMKqcU8uaA07icHP82RYxtFURIju60gx7_rTdvMXYc1NrM643G5Q7z1Bz2xHFltW_geS4P_MmP9Ow",
        storeName: "Heritage Woodcarvers",
        storeDescription: "Finest quality hand-carved wooden items, portraits, frames, and heritage artifacts.",
        rating: 4.9,
        reviewCount: 124,
        totalSales: "2.1k",
        joinDate: "2024-03-10",
        address: {
            city: "Amritsar",
            country: "India"
        },
        isVerified: true,
        storeBanner: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRcrJXYq55TYTCtcpBAfokwfJVCLHa0pJxpg_qF9GozEgjSj2v6vlltBzQqMIvjkb8eUhzhDwwbcU94q7s8xhlIZy7Rg03Dj9ovs0_tSLW-efBV24zNqQvpgk1ThlcSUhJzzJn0NHYcEifleVZn-C0_Fb-2mvUAVb5B68Y2hBWzLp-g9N-BObQmeLFaP68M-CpJ5dr0ys6SoxDOBzDYgLOtgxn9bgiGCZgKHavOhYfs8aFjyx2BPjCvHHbauGCoHyd7pPfcRgmJdOP"
    },
    "amritsar-fine-arts": {
        id: "amritsar-fine-arts",
        name: "Amritsar Fine Arts",
        storeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBz5f9HJGrpM3vRTXYIkoQzQQj8mQTww137XULJlzzvaaCPjDnIE5H7LW1-d_OzICNM5pkzOOTMKrujfK3x6NnNc6q8QBnsyirTlvUfDlk6YETwPK-_NONEUDHIBlB-RIoRGzuVK37X8lCtlHfHo6eFC7nFVk78-2FN8SPYt0YJI5VnVZ2_puk8eEQFcByZFE86bMiYbbBgCVytKaKz3JNEsDyntF3aT1VWbbVUuugoJJ-4N5U3e7Ggwdxfgb7cRWFc59Dc_Ah1A4Y",
        storeName: "Amritsar Fine Arts",
        storeDescription: "Stunning hand-painted canvases, murals, and religious fine arts capturing divine themes.",
        rating: 5.0,
        reviewCount: 82,
        totalSales: "1.4k",
        joinDate: "2024-05-20",
        address: {
            city: "Amritsar",
            country: "India"
        },
        isVerified: true,
        storeBanner: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBz5f9HJGrpM3vRTXYIkoQzQQj8mQTww137XULJlzzvaaCPjDnIE5H7LW1-d_OzICNM5pkzOOTMKrujfK3x6NnNc6q8QBnsyirTlvUfDlk6YETwPK-_NONEUDHIBlB-RIoRGzuVK37X8lCtlHfHo6eFC7nFVk78-2FN8SPYt0YJI5VnVZ2_puk8eEQFcByZFE86bMiYbbBgCVytKaKz3JNEsDyntF3aT1VWbbVUuugoJJ-4N5U3e7Ggwdxfgb7cRWFc59Dc_Ah1A4Y"
    },
    "sikh-heritage-weaves": {
        id: "sikh-heritage-weaves",
        name: "Sikh Heritage Weaves",
        storeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBz5f9HJGrpM3vRTXYIkoQzQQj8mQTww137XULJlzzvaaCPjDnIE5H7LW1-d_OzICNM5pkzOOTMKrujfK3x6NnNc6q8QBnsyirTlvUfDlk6YETwPK-_NONEUDHIBlB-RIoRGzuVK37X8lCtlHfHo6eFC7nFVk78-2FN8SPYt0YJI5VnVZ2_puk8eEQFcByZFE86bMiYbbBgCVytKaKz3JNEsDyntF3aT1VWbbVUuugoJJ-4N5U3e7Ggwdxfgb7cRWFc59Dc_Ah1A4Y",
        storeName: "Sikh Heritage Weaves",
        storeDescription: "Premium hand-woven turbans, shawls, and traditional wear crafted by generational weavers.",
        rating: 4.8,
        reviewCount: 95,
        totalSales: "3.2k",
        joinDate: "2023-11-12",
        address: {
            city: "Jalandhar",
            country: "India"
        },
        isVerified: true,
        storeBanner: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRcrJXYq55TYTCtcpBAfokwfJVCLHa0pJxpg_qF9GozEgjSj2v6vlltBzQqMIvjkb8eUhzhDwwbcU94q7s8xhlIZy7Rg03Dj9ovs0_tSLW-efBV24zNqQvpgk1ThlcSUhJzzJn0NHYcEifleVZn-C0_Fb-2mvUAVb5B68Y2hBWzLp-g9N-BObQmeLFaP68M-CpJ5dr0ys6SoxDOBzDYgLOtgxn9bgiGCZgKHavOhYfs8aFjyx2BPjCvHHbauGCoHyd7pPfcRgmJdOP"
    }
};

// Etsy Style Product Card for Shop Page
const EtsyProductCard = ({ product }) => {
    const navigate = useNavigate();
    const isFreeShipping = product.price > 50;
    const isDiscount = product.originalPrice > 0;
    const discountPct = isDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    return (
        <div
            onClick={() => navigate(`/product/${product.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer border border-gray-150 group"
        >
            <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        e.target.src = getPlaceholderImage(300, 300, product.name?.charAt(0) || "P");
                    }}
                />

                {/* Media Play Button Overlay (representing interactive/video content) */}
                <div className="absolute bottom-2.5 right-2.5 bg-white/90 p-2 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-800">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                </div>

                {isDiscount && (
                    <div className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        {discountPct}% OFF
                    </div>
                )}
            </div>

            <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <h4 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 leading-snug transition-colors font-sans">
                        {product.name}
                    </h4>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center text-yellow-500">
                            <FiStar className="fill-current text-[11px]" />
                        </div>
                        <span className="text-[11px] text-gray-500 font-semibold">
                            {product.rating || "4.8"} ({product.reviewCount || "12"})
                        </span>
                    </div>
                </div>

                <div className="mt-2">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm md:text-base font-bold text-gray-900">
                            {formatPrice(product.price)}
                        </span>
                        {isDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                                {formatPrice(product.originalPrice)}
                            </span>
                        )}
                    </div>

                    <div className="text-[10px] text-green-700 font-semibold mt-1">
                        {isFreeShipping ? "Free shipping eligible" : "Eligible orders get 10% off"}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Seller = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const vendorId = String(id ?? "").trim();
    const [catalogVersion, setCatalogVersion] = useState(0);
    const [remoteVendor, setRemoteVendor] = useState(null);
    const [remoteProducts, setRemoteProducts] = useState([]);
    const [isResolvingVendor, setIsResolvingVendor] = useState(true);

    const [activeTab, setActiveTab] = useState("items"); // items, reviews, about, policies
    const [isFavoriteShop, setIsFavoriteShop] = useState(() => {
        try {
            const saved = localStorage.getItem("favorite_shops");
            const favs = saved ? JSON.parse(saved) : {};
            return !!favs[vendorId];
        } catch {
            return false;
        }
    });
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const isScrollingRef = useRef(false);

    // Get vendor information
    const vendor = useMemo(() => {
        if (mockVendorsMap[vendorId]) {
            return mockVendorsMap[vendorId];
        }
        return getVendorById(vendorId) || remoteVendor;
    }, [vendorId, catalogVersion, remoteVendor]);

    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
    const [sortBy, setSortBy] = useState("newest");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [filters, setFilters] = useState({
        minPrice: "",
        maxPrice: "",
        minRating: "",
    });

    // Get products for this vendor
    const rawVendorProducts = useMemo(() => {
        if (!vendorId) return [];

        let local = [];
        if (vendorId === "heritage-forge") {
            local = getCatalogProducts().filter(p =>
                String(p.categoryId).toLowerCase().includes("turban") ||
                String(p.categoryId).toLowerCase().includes("kara") ||
                String(p.categoryId).toLowerCase().includes("art") ||
                String(p.categoryId).toLowerCase().includes("book") ||
                p.name?.toLowerCase().includes("kada") ||
                p.name?.toLowerCase().includes("turban") ||
                p.name?.toLowerCase().includes("silver") ||
                p.name?.toLowerCase().includes("book")
            );
        } else if (vendorId === "heritage-woodcarvers") {
            local = getCatalogProducts().filter(p =>
                p.name?.toLowerCase().includes("kada") ||
                p.name?.toLowerCase().includes("silver") ||
                p.name?.toLowerCase().includes("frame") ||
                p.name?.toLowerCase().includes("carv") ||
                p.name?.toLowerCase().includes("wood")
            );
        } else if (vendorId === "amritsar-fine-arts") {
            local = getCatalogProducts().filter(p =>
                p.name?.toLowerCase().includes("art") ||
                p.name?.toLowerCase().includes("fish") ||
                p.name?.toLowerCase().includes("paint") ||
                p.name?.toLowerCase().includes("book")
            );
        } else if (vendorId === "sikh-heritage-weaves") {
            local = getCatalogProducts().filter(p =>
                p.name?.toLowerCase().includes("turban") ||
                p.name?.toLowerCase().includes("scarf") ||
                p.name?.toLowerCase().includes("kurta") ||
                p.name?.toLowerCase().includes("jeans")
            );
        } else {
            local = getProductsByVendor(vendorId);
        }

        if (!remoteProducts.length) return local;

        const merged = [...remoteProducts];
        local.forEach((item) => {
            const exists = merged.some(
                (p) => String(p.id) === String(item.id)
            );
            if (!exists) merged.push(item);
        });

        return merged;
    }, [vendorId, remoteProducts, catalogVersion]);

    const vendorProducts = useMemo(() => {
        let result = rawVendorProducts;

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

        return result;
    }, [rawVendorProducts, filters]);

    // Categories list for shop categories filter
    const categories = useMemo(() => {
        const list = new Set();
        rawVendorProducts.forEach(p => {
            if (p.categoryName) {
                list.add(p.categoryName);
            }
        });
        return ["All", ...Array.from(list)];
    }, [rawVendorProducts]);

    const getCategoryCount = (catName) => {
        if (catName === "All") return vendorProducts.length;
        return vendorProducts.filter(p => p.categoryName === catName).length;
    };

    // Filter by Category
    const categoryFilteredProducts = useMemo(() => {
        let result = vendorProducts;
        if (selectedCategory !== "All") {
            result = result.filter(
                (product) => product.categoryName?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }
        return result;
    }, [vendorProducts, selectedCategory]);

    // Sort products
    const sortedProducts = useMemo(() => {
        const list = [...categoryFilteredProducts];
        switch (sortBy) {
            case "price-asc":
                return list.sort((a, b) => a.price - b.price);
            case "price-desc":
                return list.sort((a, b) => b.price - a.price);
            case "rating":
                return list.sort((a, b) => b.rating - a.rating);
            case "newest":
            default:
                return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
    }, [categoryFilteredProducts, sortBy]);

    const { displayedItems, hasMore, isLoading, loadMore, loadMoreRef } =
        useInfiniteScroll(sortedProducts, 10, 10);

    const filterButtonRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const sortDropdownRef = useRef(null);

    const handleFilterChange = (name, value) => {
        setFilters({ ...filters, [name]: value });
    };

    const clearFilters = () => {
        setFilters({
            minPrice: "",
            maxPrice: "",
            minRating: "",
        });
    };

    // Check if any filter is active
    const hasActiveFilters =
        filters.minPrice ||
        filters.maxPrice ||
        filters.minRating;

    // Toggle favorite shop
    const handleFavoriteShop = () => {
        const newValue = !isFavoriteShop;
        setIsFavoriteShop(newValue);
        try {
            const saved = localStorage.getItem("favorite_shops");
            const favs = saved ? JSON.parse(saved) : {};
            if (newValue) {
                favs[vendorId] = true;
            } else {
                delete favs[vendorId];
            }
            localStorage.setItem("favorite_shops", JSON.stringify(favs));
        } catch (e) {
            console.error(e);
        }
        toast.success(newValue ? "Shop added to favorites!" : "Shop removed from favorites");
    };

    // Close dropdowns when clicking outside
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
            if (
                showCategoryDropdown &&
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(event.target)
            ) {
                setShowCategoryDropdown(false);
            }
            if (
                showSortDropdown &&
                sortDropdownRef.current &&
                !sortDropdownRef.current.contains(event.target)
            ) {
                setShowSortDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showFilters, showCategoryDropdown, showSortDropdown]);

    useEffect(() => {
        const handleCatalogUpdate = () => setCatalogVersion((prev) => prev + 1);
        window.addEventListener("catalog-cache-updated", handleCatalogUpdate);
        return () => {
            window.removeEventListener("catalog-cache-updated", handleCatalogUpdate);
        };
    }, []);

    useEffect(() => {
        const sections = ["items", "reviews", "about", "policies"];
        const observerOptions = {
            root: null,
            rootMargin: "-180px 0px -60% 0px",
            threshold: 0
        };

        const observerCallback = (entries) => {
            if (isScrollingRef.current) return;
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id.replace("-section", "");
                    setActiveTab(sectionId);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((sec) => {
            const el = document.getElementById(`${sec}-section`);
            if (el) {
                observer.observe(el);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [isResolvingVendor]);

    useEffect(() => {
        let active = true;
        const fetchVendorData = async () => {
            if (!vendorId) {
                if (active) {
                    setRemoteVendor(null);
                    setRemoteProducts([]);
                    setIsResolvingVendor(false);
                }
                return;
            }

            setIsResolvingVendor(true);
            try {
                const [vendorRes, productsRes] = await Promise.all([
                    api.get(`/vendors/${vendorId}`),
                    api.get(`/vendors/${vendorId}/products`, { params: { page: 1, limit: 100 } }),
                ]);

                if (!active) return;

                const vendorPayload = vendorRes?.data ?? vendorRes;
                const productsPayload = productsRes?.data ?? productsRes;
                const vendorDoc = vendorPayload ? normalizeVendor(vendorPayload) : null;
                const allProducts = Array.isArray(productsPayload?.products)
                    ? [...productsPayload.products]
                    : [];
                const totalPages = Math.max(1, Number(productsPayload?.pages || 1));
                for (let page = 2; page <= totalPages; page += 1) {
                    const nextRes = await api.get(`/vendors/${vendorId}/products`, {
                        params: { page, limit: 100 },
                    });
                    const nextPayload = nextRes?.data ?? nextRes;
                    if (Array.isArray(nextPayload?.products) && nextPayload.products.length) {
                        allProducts.push(...nextPayload.products);
                    }
                }

                const productList = allProducts.map(normalizeProduct);

                setRemoteVendor(vendorDoc);
                setRemoteProducts(productList);
            } catch {
                if (!active) return;
                setRemoteVendor(null);
                setRemoteProducts([]);
            } finally {
                if (active) setIsResolvingVendor(false);
            }
        };

        fetchVendorData();
        return () => {
            active = false;
        };
    }, [vendorId]);

    // Mock Review Data for Reviews Tab
    const mockReviews = [
        { id: 1, user: "Amanpreet S.", rating: 5, comment: "Absolutely gorgeous craftsmanship! The Kada is thick, solid, and has a brilliant gloss. Will definitely purchase again.", date: "12 Jul, 2026", product: "Premium Sterling Silver Kada" },
        { id: 2, user: "Harpreet K.", rating: 5, comment: "Very fast shipping and the Turban fabric is of extremely rich and high quality. Colors match the picture perfectly.", date: "08 Jul, 2026", product: "Premium Sikh Turban" },
        { id: 3, user: "Jaswinder S.", rating: 5, comment: "Beautifully made. The kada measurement tool on the detail page was super helpful. Fits perfectly.", date: "24 Jun, 2026", product: "Premium Sterling Silver Kada" },
        { id: 4, user: "Drew S.", rating: 5, comment: "Exactly what I was looking for! The seller was super helpful and friendly, answered all of my questions. It came fast.", date: "15 Jun, 2026", product: "Introduction to Sikhism" }
    ];

    if (isResolvingVendor) {
        return (
            <PageTransition>
                <MobileLayout showBottomNav={false} showCartBar={false}>
                    <div className="flex items-center justify-center min-h-[60vh] px-4">
                        <p className="text-gray-600">Loading shop...</p>
                    </div>
                </MobileLayout>
            </PageTransition>
        );
    }

    if (!vendor) {
        return (
            <PageTransition>
                <MobileLayout showBottomNav={false} showCartBar={false}>
                    <div className="flex items-center justify-center min-h-[60vh] px-4">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                Seller Not Found
                            </h2>
                            <button
                                onClick={() => navigate("/home")}
                                className="gradient-green text-white px-6 py-3 rounded-xl font-semibold">
                                Go Back Home
                            </button>
                        </div>
                    </div>
                </MobileLayout>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <MobileLayout showBottomNav={true} showCartBar={true}>
                <div className="w-full max-w-[1400px] mx-auto px-0 md:px-12 py-0 md:py-6 bg-white min-h-screen text-left">
                    {/* Shop Banner Header */}
                    <div className="relative w-full h-36 md:h-[280px] md:rounded-2xl overflow-hidden bg-gradient-to-r from-[#ece4db] to-[#dfd3c3]">
                        {vendor.storeBanner ? (
                            <img
                                src={vendor.storeBanner}
                                alt={`${vendor.storeName || vendor.name} Banner`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif italic text-lg opacity-40">
                                Established in Heritage
                            </div>
                        )}

                        {/* Floating Action Buttons on Banner (Mobile Only) */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-2.5 z-10 md:hidden">
                            <button
                                onClick={() => navigate("/chat")}
                                className="p-2.5 bg-white/95 text-gray-700 hover:text-[#F5A623] rounded-full shadow-md transition-all duration-300 hover:scale-105 flex items-center justify-center"
                            >
                                <FiMessageSquare className="text-base" />
                            </button>
                            <button
                                onClick={handleFavoriteShop}
                                className="p-2.5 bg-white/95 text-gray-700 hover:text-[#F5A623] rounded-full shadow-md transition-all duration-300 hover:scale-105 flex items-center justify-center"
                            >
                                <FiHeart className={`text-base transition-colors ${isFavoriteShop ? "text-[#F5A623] fill-[#F5A623]" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* Shop Logo & Basic Info Section */}
                    <div className="bg-white px-4 md:px-0 py-4 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 relative">
                        <div className="flex flex-row items-center gap-4 md:gap-6">
                            {/* Square logo overlapping the banner */}
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white flex-shrink-0 p-1 -mt-10 md:-mt-16 z-10">
                                <LazyImage
                                    src={vendor.storeLogo}
                                    alt={vendor.storeName || vendor.name}
                                    className="w-full h-full object-contain rounded-xl"
                                    onError={(e) => {
                                        e.target.src = getPlaceholderImage(96, 96, (vendor.storeName || vendor.name).charAt(0));
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight font-sans tracking-tight">
                                        {vendor.storeName || vendor.name}
                                    </h2>
                                    <span className="text-[#a855f7] inline-flex items-center" title="Star Seller">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                                            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
                                        </svg>
                                    </span>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 mt-1.5">
                                    <p className="text-xs text-gray-500 font-medium font-sans">
                                        {vendor.address?.city || "Mohali"}, {vendor.address?.country || "India"}
                                    </p>

                                    {/* Desktop Inline Stats Box */}
                                    <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 font-semibold before:content-['|'] before:text-gray-300 before:hidden md:before:inline">
                                        <span className="flex items-center gap-1 text-gray-900 font-bold">
                                            <FiStar className="text-yellow-500 fill-yellow-500 text-xs" />
                                            {vendor.rating || "4.9"} ({vendor.reviewCount || "290"})
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span>{vendor.totalSales || "3.8k"} sales</span>
                                        <span className="text-gray-300">|</span>
                                        <span>{vendor.joinDate ? `${2026 - new Date(vendor.joinDate).getFullYear() || 1} year` : "1 year"} on Etsy</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => navigate("/chat")}
                                className="px-5 py-2 border border-gray-300 hover:bg-gray-50 rounded-full font-bold text-sm text-gray-800 flex items-center gap-1.5 shadow-sm transition-all"
                            >
                                <FiMessageSquare className="text-sm" />
                                Contact
                            </button>
                            <button
                                onClick={handleFavoriteShop}
                                className="px-5 py-2 border border-gray-300 hover:bg-gray-50 rounded-full font-bold text-sm text-gray-800 flex items-center gap-1.5 shadow-sm transition-all"
                            >
                                <FiHeart className={`text-sm ${isFavoriteShop ? "text-[#F5A623] fill-[#F5A623]" : ""}`} />
                                {isFavoriteShop ? "Following" : "Follow"}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Stats Box (Hidden on Desktop) */}
                    <div className="md:hidden mx-4 my-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 grid grid-cols-3 text-center divide-x divide-gray-100">
                        <div>
                            <p className="text-lg font-bold text-gray-900 font-sans">{vendor.totalSales || "3.8k"}</p>
                            <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-0.5 font-sans">Sales</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1 font-sans">
                                <FiStar className="text-yellow-500 fill-yellow-500 text-sm" />
                                {vendor.rating || "4.9"}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-0.5 font-sans">({vendor.reviewCount || "290"})</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 font-sans">
                                {vendor.joinDate ? `${2026 - new Date(vendor.joinDate).getFullYear() || 1} Year` : "1 year"}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-0.5 font-sans">on Etsy</p>
                        </div>
                    </div>

                    {/* Navigation Tabs and Search Bar Container */}
                    <div className="bg-white border-b border-gray-200 md:py-2 flex flex-col md:flex-row md:items-center md:justify-between sticky top-[108px] z-20 px-4 md:px-0">
                        {/* Scrollable Tabs */}
                        <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide gap-6">
                            {[
                                { id: "items", label: "Items" },
                                { id: "reviews", label: "Reviews" },
                                { id: "about", label: "About" },
                                { id: "policies", label: "Shop Policies" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        const el = document.getElementById(`${tab.id}-section`);
                                        if (el) {
                                            isScrollingRef.current = true;
                                            const yOffset = -180;
                                            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                            window.scrollTo({ top: y, behavior: "smooth" });
                                            setTimeout(() => {
                                                isScrollingRef.current = false;
                                            }, 800);
                                        }
                                    }}
                                    className={`py-3.5 px-1 border-b-2 text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === tab.id
                                            ? "border-gray-900 text-gray-900 font-bold"
                                            : "border-transparent text-gray-400 hover:text-gray-600 font-semibold"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Desktop Search Inside Shop */}
                        <div className="hidden md:block relative w-72">
                            <input
                                type="text"
                                placeholder={`Search all ${sortedProducts.length} items`}
                                className="w-full pl-4 pr-10 py-2 bg-gray-100 hover:bg-gray-200/80 rounded-full text-xs font-semibold placeholder:text-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 border-0 transition-all font-sans"
                            />
                            <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                        </div>
                    </div>

                    {/* Tab Contents */}
                    <div className="px-4 md:px-0 py-6 space-y-16">

                        {/* Items Section */}
                        <div id="items-section" className="scroll-mt-48">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Desktop Left Sidebar Categories (Hidden on Mobile) */}
                                <div className="hidden md:block w-52 flex-shrink-0 text-left">
                                    <h4 className="font-bold text-gray-800 text-sm mb-4 font-sans tracking-wide">Shop Categories</h4>
                                    <div className="space-y-1.5">
                                        {categories.map((cat) => {
                                            const isActive = selectedCategory === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`w-full text-left py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-colors flex items-center justify-between ${isActive
                                                            ? "bg-black font-bold text-white"
                                                            : "text-gray-600 hover:bg-black hover:text-white transition-colors"
                                                        }`}
                                                >
                                                    <span>{cat === "All" ? "All" : cat}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                                                        {getCategoryCount(cat)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Main Products List Area */}
                                <div className="flex-1">
                                    {/* Categories Filter & Sort Bar */}
                                    <div className="flex flex-col gap-4 mb-5">

                                        {/* Category Filter Selector Dropdown - Wide Pill (Mobile Only) */}
                                        <div ref={categoryDropdownRef} className="relative w-full md:hidden">
                                            <button
                                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-full flex items-center justify-between text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-sans text-gray-900 font-bold">
                                                    {selectedCategory === "All" ? `All (${sortedProducts.length})` : `${selectedCategory} (${getCategoryCount(selectedCategory)})`}
                                                </span>
                                                <FiChevronDown className="text-gray-600 text-lg" />
                                            </button>

                                            <AnimatePresence>
                                                {showCategoryDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-30 py-1 overflow-hidden"
                                                    >
                                                        {categories.map((cat) => (
                                                            <button
                                                                key={cat}
                                                                onClick={() => {
                                                                    setSelectedCategory(cat);
                                                                    setShowCategoryDropdown(false);
                                                                }}
                                                                className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${selectedCategory === cat
                                                                        ? "bg-black font-bold text-white"
                                                                        : "text-gray-700 hover:bg-black hover:text-white transition-colors"
                                                                    }`}
                                                            >
                                                                <span>{cat === "All" ? "All" : cat}</span>
                                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${selectedCategory === cat ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                                                    {getCategoryCount(cat)}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Section title & sort */}
                                        <div className="flex items-center justify-between w-full mt-2 border-b border-gray-100 pb-3">
                                            <h3 className="text-lg md:text-xl font-bold text-gray-950 font-serif tracking-tight">Featured items</h3>

                                            <div className="flex items-center gap-2">
                                                {/* Sorting button (two arrows or Custom label) */}
                                                <div ref={sortDropdownRef} className="relative">
                                                    <button
                                                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                                                        className="px-3 py-1.5 hover:bg-gray-55 rounded-lg border border-gray-200 transition-colors text-xs font-bold text-gray-700 flex items-center gap-1.5"
                                                    >
                                                        <span>Sort: {sortBy === "newest" ? "Custom" : sortBy === "rating" ? "Top Rated" : sortBy === "price-asc" ? "Price Low-High" : "Price High-Low"}</span>
                                                        <FiChevronDown />
                                                    </button>

                                                    <AnimatePresence>
                                                        {showSortDropdown && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 5 }}
                                                                className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-30 py-1 overflow-hidden"
                                                            >
                                                                {[
                                                                    { id: "newest", label: "Newest Arrivals" },
                                                                    { id: "price-asc", label: "Price: Low to High" },
                                                                    { id: "price-desc", label: "Price: High to Low" },
                                                                    { id: "rating", label: "Top Rated" }
                                                                ].map((item) => (
                                                                    <button
                                                                        key={item.id}
                                                                        onClick={() => {
                                                                            setSortBy(item.id);
                                                                            setShowSortDropdown(false);
                                                                        }}
                                                                        className={`w-full px-4 py-2 text-left text-xs md:text-sm transition-colors ${sortBy === item.id
                                                                                ? "bg-black font-bold text-white"
                                                                                : "text-gray-700 hover:bg-black hover:text-white transition-colors"
                                                                            }`}
                                                                    >
                                                                        {item.label}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Filter Button */}
                                                <div ref={filterButtonRef} className="relative">
                                                    <button
                                                        onClick={() => setShowFilters(!showFilters)}
                                                        className={`p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center ${showFilters ? "text-[#F5A623]" : "text-gray-700"}`}
                                                        title="Filter Products"
                                                    >
                                                        <FiFilter className="text-lg" />
                                                    </button>

                                                    <AnimatePresence>
                                                        {showFilters && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 5 }}
                                                                className="filter-dropdown absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 z-30 overflow-hidden"
                                                            >
                                                                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-150 bg-gray-50">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <FiFilter className="text-xs text-gray-700" />
                                                                        <h3 className="text-xs font-bold text-gray-800">Filters</h3>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setShowFilters(false)}
                                                                        className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                                                                    >
                                                                        <FiX className="text-xs text-gray-600" />
                                                                    </button>
                                                                </div>
                                                                <div className="p-3 space-y-3">
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-700 mb-1 text-[11px] tracking-wide uppercase">Price Range</h4>
                                                                        <div className="space-y-1.5">
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Min Price"
                                                                                value={filters.minPrice}
                                                                                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                                                                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#F5A623] text-xs bg-gray-50"
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Max Price"
                                                                                value={filters.maxPrice}
                                                                                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                                                                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#F5A623] text-xs bg-gray-50"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="border-t border-gray-150 p-2.5 bg-gray-50 flex gap-2">
                                                                    <button
                                                                        onClick={clearFilters}
                                                                        className="flex-1 py-1.5 bg-gray-200 text-gray-750 rounded-lg font-bold text-[11px] hover:bg-gray-300 transition-colors"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setShowFilters(false)}
                                                                        className="flex-1 py-1.5 bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white rounded-lg font-bold text-[11px] hover:bg-[#F5A623] transition-colors shadow"
                                                                    >
                                                                        Apply
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Products Grid/List */}
                                    {sortedProducts.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-150">
                                            <div className="text-5xl mb-3">🏪</div>
                                            <h3 className="text-lg font-bold text-gray-800">No products found</h3>
                                            <p className="text-sm text-gray-505 mt-1 max-w-sm mx-auto px-4">
                                                No products match your selected filters. Try broadening your criteria.
                                            </p>
                                        </div>
                                    ) : viewMode === "grid" ? (
                                        <>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                                                {displayedItems.map((product, index) => (
                                                    <motion.div
                                                        key={product.id}
                                                        initial={{ opacity: 0, y: 15 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.03 }}
                                                    >
                                                        <EtsyProductCard product={product} />
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {hasMore && (
                                                <div ref={loadMoreRef} className="mt-8 flex justify-center">
                                                    <button
                                                        onClick={loadMore}
                                                        disabled={isLoading}
                                                        className="px-6 py-2.5 bg-white border border-gray-250 text-gray-800 rounded-full font-semibold text-xs md:text-sm hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                                                    >
                                                        {isLoading ? "Loading..." : "Load More Items"}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-3.5">
                                                {displayedItems.map((product, index) => (
                                                    <ProductListItem
                                                        key={product.id}
                                                        product={product}
                                                        index={index}
                                                    />
                                                ))}
                                            </div>

                                            {hasMore && (
                                                <div ref={loadMoreRef} className="mt-8 flex justify-center">
                                                    <button
                                                        onClick={loadMore}
                                                        disabled={isLoading}
                                                        className="px-6 py-2.5 bg-white border border-gray-250 text-gray-800 rounded-full font-semibold text-xs md:text-sm hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                                                    >
                                                        {isLoading ? "Loading..." : "Load More Items"}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div id="reviews-section" className="scroll-mt-48 border-t border-gray-150 pt-12">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 text-left font-sans">Reviews</h3>
                            <div className="bg-white rounded-2xl border border-gray-150 p-5 md:p-6 shadow-sm max-w-3xl mx-auto">
                                <div className="flex flex-col md:flex-row items-center gap-8 pb-6 border-b border-gray-100 mb-6">
                                    <div className="text-center">
                                        <p className="text-4xl font-extrabold text-gray-900">{vendor.rating || "4.8"}</p>
                                        <div className="flex justify-center text-yellow-500 my-1.5">
                                            {[...Array(5)].map((_, i) => (
                                                <FiStar key={i} className={`text-base ${i < Math.floor(vendor.rating || 4.8) ? "fill-current text-yellow-500" : "text-gray-200"}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 font-semibold">Shop rating ({vendor.reviewCount || "150"} reviews)</p>
                                    </div>
                                    <div className="flex-1 w-full space-y-2">
                                        {[5, 4, 3, 2, 1].map((stars) => {
                                            const pct = stars === 5 ? 85 : stars === 4 ? 10 : 5; // mock percentages
                                            return (
                                                <div key={stars} className="flex items-center gap-3">
                                                    <span className="text-xs font-semibold text-gray-600 w-3">{stars}</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-8 text-right font-medium">{pct}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {mockReviews.map((rev) => (
                                        <div key={rev.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0 text-left">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-xs text-black">
                                                        {rev.user.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800">{rev.user}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{rev.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex text-yellow-500 text-xs">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FiStar key={i} className={`fill-current ${i < rev.rating ? "text-yellow-500" : "text-gray-200"}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed font-sans">{rev.comment}</p>
                                            <p className="text-[11px] text-black font-semibold mt-1.5">Product: {rev.product}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <div id="about-section" className="scroll-mt-48 border-t border-gray-150 pt-12">
                            <div className="bg-white rounded-2xl border border-gray-150 p-5 md:p-6 shadow-sm max-w-3xl mx-auto space-y-6 text-left">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">About the Store</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed font-sans">
                                        {vendor.storeDescription || "Welcome to our shop! We craft premium heritage Sikh products including sterling silver Kada, traditional turbans, and authentic Sikh accessories. Every piece is made with dedication, preserving age-old craftsmanship traditions while maintaining top-notch modern quality standards."}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex-shrink-0">
                                        <img
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqMDXl2T65jyXSB9qeTJbnhG6G63aSMxrS9MUh0AbYVUdIDbGb1C9q5zVZDceaN7_Pwv058Lj-KsSgRwEzCJFUMAbtCByAMBt9t7qPEnVu8OX9GKowcLmKAy2DvI40dzo_tFZ-gk8-G2CdQgVtTQ64920GdgIjQGlqIp1wp_iUPpoTgquKdxgTjN9WLcy5cFXNMKqcU8uaA07icHP82RYxtFURIju60gx7_rTdvMXYc1NrM643G5Q7z1Bz2xHFltW_geS4P_MmP9Ow"
                                            alt="Store Owner"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <span className="text-[10px] font-extrabold text-black tracking-wider uppercase">Shop Owner & Maker</span>
                                        <h4 className="text-base font-bold text-gray-900 mt-0.5">Master Gurcharan Singh</h4>
                                        <p className="text-xs text-gray-500 font-medium">Mohali, India</p>
                                        <p className="text-sm text-gray-600 mt-2 leading-relaxed font-sans italic">
                                            "Every piece is handcrafted with love and represents our rich heritage and history. We focus on the tiny details that bring soul into the craft."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Policies Section */}
                        <div id="policies-section" className="scroll-mt-48 border-t border-gray-150 pt-12">
                            <div className="bg-white rounded-2xl border border-gray-150 p-5 md:p-6 shadow-sm max-w-3xl mx-auto space-y-6 text-left">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Shipping & Processing</h3>
                                    <div className="space-y-1.5 text-sm text-gray-600 font-sans">
                                        <p><span className="font-semibold text-gray-800">Processing Time:</span> Items are dispatched within 1-2 business days.</p>
                                        <p><span className="font-semibold text-gray-800">Estimated Delivery:</span> 3-5 business days across India; 7-14 business days internationally.</p>
                                        <p><span className="font-semibold text-gray-800">Tracking:</span> Provided via email/SMS immediately after dispatch.</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Returns & Exchanges</h3>
                                    <div className="space-y-1.5 text-sm text-gray-600 font-sans">
                                        <p>✓ Returns are accepted within 14 days of delivery.</p>
                                        <p>✓ Buyers are responsible for return shipping postage costs.</p>
                                        <p>✓ Custom or personalized items cannot be returned or exchanged.</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-150">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Methods</h3>
                                    <p className="text-sm text-gray-600 font-sans">
                                        All transactions are securely processed. We support Visa, Mastercard, RuPay, UPI, Netbanking, and Cash on Delivery.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MobileLayout>
        </PageTransition>
    );
};

export default Seller;

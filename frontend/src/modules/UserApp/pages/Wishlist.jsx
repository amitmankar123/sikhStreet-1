import { useEffect, useState } from "react";
import { FiHeart, FiArrowLeft, FiGrid, FiList } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MobileLayout from "../components/Layout/MobileLayout";
import SwipeableWishlistItem from "../components/Mobile/SwipeableWishlistItem";
import WishlistGridItem from "../components/Mobile/WishlistGridItem";
import { useWishlistStore } from "../../../shared/store/wishlistStore";
import { useCartStore } from "../../../shared/store/useStore";
import { useAuthStore } from "../../../shared/store/authStore";
import toast from "react-hot-toast";
import PageTransition from '../../../shared/components/PageTransition';

const brandsMap = {
  "heritage-forge": {
    id: "heritage-forge",
    name: "Heritage Forge",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqMDXl2T65jyXSB9qeTJbnhG6G63aSMxrS9MUh0AbYVUdIDbGb1C9q5zVZDceaN7_Pwv058Lj-KsSgRwEzCJFUMAbtCByAMBt9t7qPEnVu8OX9GKowcLmKAy2DvI40dzo_tFZ-gk8-G2CdQgVtTQ64920GdgIjQGlqIp1wp_iUPpoTgquKdxgTjN9WLcy5cFXNMKqcU8uaA07icHP82RYxtFURIju60gx7_rTdvMXYc1NrM643G5Q7z1Bz2xHFltW_geS4P_MmP9Ow",
    description: "Authentic damascened steel and gold traditional Sikh Karas, Kirpans, and artifacts.",
    rating: 4.9,
    reviewCount: 290
  },
  "heritage-woodcarvers": {
    id: "heritage-woodcarvers",
    name: "Heritage Woodcarvers",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqMDXl2T65jyXSB9qeTJbnhG6G63aSMxrS9MUh0AbYVUdIDbGb1C9q5zVZDceaN7_Pwv058Lj-KsSgRwEzCJFUMAbtCByAMBt9t7qPEnVu8OX9GKowcLmKAy2DvI40dzo_tFZ-gk8-G2CdQgVtTQ64920GdgIjQGlqIp1wp_iUPpoTgquKdxgTjN9WLcy5cFXNMKqcU8uaA07icHP82RYxtFURIju60gx7_rTdvMXYc1NrM643G5Q7z1Bz2xHFltW_geS4P_MmP9Ow",
    description: "Finest quality hand-carved wooden items, portraits, frames, and heritage artifacts.",
    rating: 4.9,
    reviewCount: 124
  },
  "amritsar-fine-arts": {
    id: "amritsar-fine-arts",
    name: "Amritsar Fine Arts",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBz5f9HJGrpM3vRTXYIkoQzQQj8mQTww137XULJlzzvaaCPjDnIE5H7LW1-d_OzICNM5pkzOOTMKrujfK3x6NnNc6q8QBnsyirTlvUfDlk6YETwPK-_NONEUDHIBlB-RIoRGzuVK37X8lCtlHfHo6eFC7nFVk78-2FN8SPYt0YJI5VnVZ2_puk8eEQFcByZFE86bMiYbbBgCVytKaKz3JNEsDyntF3aT1VWbbVUuugoJJ-4N5U3e7Ggwdxfgb7cRWFc59Dc_Ah1A4Y",
    description: "Stunning hand-painted canvases, murals, and religious fine arts.",
    rating: 5.0,
    reviewCount: 82
  },
  "sikh-heritage-weaves": {
    id: "sikh-heritage-weaves",
    name: "Sikh Heritage Weaves",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBz5f9HJGrpM3vRTXYIkoQzQQj8mQTww137XULJlzzvaaCPjDnIE5H7LW1-d_OzICNM5pkzOOTMKrujfK3x6NnNc6q8QBnsyirTlvUfDlk6YETwPK-_NONEUDHIBlB-RIoRGzuVK37X8lCtlHfHo6eFC7nFVk78-2FN8SPYt0YJI5VnVZ2_puk8eEQFcByZFE86bMiYbbBgCVytKaKz3JNEsDyntF3aT1VWbbVUuugoJJ-4N5U3e7Ggwdxfgb7cRWFc59Dc_Ah1A4Y",
    description: "Premium hand-woven turbans, shawls, and traditional wear.",
    rating: 4.8,
    reviewCount: 95
  }
};

const MobileWishlist = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem, moveToCart, clearWishlist, fetchWishlist, isLoading } = useWishlistStore();
  const { addItem } = useCartStore();
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
  const [activeTab, setActiveTab] = useState("items"); // 'items' or 'shops'
  
  const [favShops, setFavShops] = useState(() => {
    try {
      const saved = localStorage.getItem("favorite_shops");
      const parsed = saved ? JSON.parse(saved) : {};
      return Object.keys(parsed).filter(k => !!parsed[k]);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchWishlist().catch(() => null);
  }, [fetchWishlist]);

  const handleMoveToCart = (item) => {
    const wishlistItem = moveToCart(item.id);
    if (wishlistItem) {
      addItem({
        ...wishlistItem,
        quantity: 1,
      });
      toast.success("Moved to cart!");
    }
  };

  const handleRemove = (id) => {
    removeItem(id);
    toast.success("Removed from wishlist");
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your wishlist?")) {
      clearWishlist();
      toast.success("Wishlist cleared");
    }
  };

  const handleRemoveShop = (shopId) => {
    const updated = favShops.filter(id => id !== shopId);
    setFavShops(updated);
    try {
      const saved = localStorage.getItem("favorite_shops");
      const parsed = saved ? JSON.parse(saved) : {};
      delete parsed[shopId];
      localStorage.setItem("favorite_shops", JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }
    toast.success("Shop removed from favorites");
  };

  const resolvedShops = favShops.map(id => {
    if (brandsMap[id]) return brandsMap[id];
    return {
      id,
      name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      logo: "https://placehold.co/100x100?text=Shop",
      description: "Local creation vendor and artisan shop on sikhSTREET.",
      rating: 4.8,
      reviewCount: 15
    };
  });

  return (
    <PageTransition>
      <MobileLayout showBottomNav={true} showCartBar={true}>
        <div className="w-full relative overflow-hidden font-sans bg-white min-h-screen">

          {/* Header */}
          <div className="px-4 py-4 bg-white border-b border-black/10 sticky top-0 z-40 shadow-sm relative">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-white/40 rounded-full transition-colors flex-shrink-0">
                  <FiArrowLeft className="text-xl text-gray-700" />
                </button>
                <div className="flex-1 min-w-0 text-left">
                  <h1 className="text-lg font-black text-gray-900 truncate font-serif" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                    My Favorites
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    {activeTab === "items" 
                      ? `${items.length} ${items.length === 1 ? "item" : "items"} saved`
                      : `${favShops.length} ${favShops.length === 1 ? "shop" : "shops"} followed`
                    }
                  </p>
                </div>
                {activeTab === "items" && items.length > 0 && (
                  <div className="flex items-center gap-2">
                    {/* View Toggle Buttons */}
                    <div className="flex items-center bg-black/5 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded transition-colors ${viewMode === "list"
                          ? "bg-white text-black shadow-sm font-bold"
                          : "text-gray-500"
                          }`}>
                        <FiList className="text-lg" />
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded transition-colors ${viewMode === "grid"
                          ? "bg-white text-black shadow-sm font-bold"
                          : "text-gray-500"
                          }`}>
                        <FiGrid className="text-lg" />
                      </button>
                    </div>
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-red-600 font-bold px-3 py-1.5 hover:bg-red-50/50 rounded-lg transition-colors flex-shrink-0">
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-stone-200/60 mt-2">
                <button
                  onClick={() => setActiveTab("items")}
                  className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition-all ${
                    activeTab === "items"
                      ? "border-[#F5A623] text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Favorite Items ({items.length})
                </button>
                <button
                  onClick={() => setActiveTab("shops")}
                  className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition-all ${
                    activeTab === "shops"
                      ? "border-[#F5A623] text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Favorite Shops ({favShops.length})
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4 relative z-10">
            {activeTab === "items" ? (
              isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading wishlist...</p>
                </div>
              ) : items.length === 0 ? (
                <EmptyWishlistState />
              ) : (
                <WishlistItems
                  items={items}
                  viewMode={viewMode}
                  onMoveToCart={handleMoveToCart}
                  onRemove={handleRemove}
                />
              )
            ) : resolvedShops.length === 0 ? (
              <EmptyShopsState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolvedShops.map((shop) => (
                  <div
                    key={shop.id}
                    className="bg-white rounded-2xl border border-black/10 p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4"
                  >
                    <div 
                      onClick={() => navigate(`/brand/${shop.id}`)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <img
                        src={shop.logo}
                        alt={shop.name}
                        className="w-12 h-12 rounded-full object-cover border border-stone-200 flex-shrink-0"
                        onError={(e) => {
                          e.target.src = "https://placehold.co/100x100?text=Shop";
                        }}
                      />
                      <div className="text-left min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 truncate font-serif text-sm" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                          {shop.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-black font-bold">★ {shop.rating}</span>
                          <span className="text-[10px] text-gray-400">({shop.reviewCount} reviews)</span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-1">
                          {shop.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                       <button
                         onClick={() => navigate(`/brand/${shop.id}`)}
                         className="px-3 py-1.5 bg-black/5 hover:bg-[#F5A623] hover:text-black text-black text-xs font-bold rounded-lg transition-colors"
                       >
                         Visit
                       </button>
                       <button
                         onClick={() => handleRemoveShop(shop.id)}
                         className="w-8 h-8 rounded-full bg-black/5 hover:bg-[#F5A623] hover:text-black flex items-center justify-center text-black transition-colors"
                       >
                         <FiHeart className="fill-black hover:fill-black text-xs" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </MobileLayout>
    </PageTransition>
  );
};

// Empty State Component
const EmptyWishlistState = () => (
  <div className="bg-white border border-black/10 rounded-3xl p-10 shadow-sm max-w-md mx-auto text-center mt-12 relative z-10">
    <div className="w-16 h-16 rounded-full bg-black/10 text-[#F5A623] flex items-center justify-center mx-auto mb-5">
      <FiHeart className="text-3xl" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      Your wishlist is empty
    </h3>
    <p className="text-sm text-black/80 mb-6">Start adding items you love!</p>
    <Link
      to="/home"
      className="px-8 py-3.5 bg-black text-white hover:bg-[#F5A623] hover:text-black transition-colors text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all inline-block">
      Continue Shopping
    </Link>
  </div>
);

// Empty Shops Component
const EmptyShopsState = () => (
  <div className="bg-white border border-black/10 rounded-3xl p-10 shadow-sm max-w-md mx-auto text-center mt-12 relative z-10">
    <div className="w-16 h-16 rounded-full bg-black/10 text-[#F5A623] flex items-center justify-center mx-auto mb-5">
      <FiHeart className="text-3xl" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      No favorite shops yet
    </h3>
    <p className="text-sm text-black/80 mb-6">Explore small shops and follow them to see them here!</p>
    <Link
      to="/home"
      className="px-8 py-3.5 bg-black text-white hover:bg-[#F5A623] hover:text-black transition-colors text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all inline-block">
      Discover Shops
    </Link>
  </div>
);

// Wishlist Items Component
const WishlistItems = ({ items, viewMode, onMoveToCart, onRemove }) => {
  if (viewMode === "grid") {
    return (
      <AnimatePresence>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {items.map((item, index) => (
            <WishlistGridItem
              key={item.id}
              item={item}
              index={index}
              onMoveToCart={onMoveToCart}
              onRemove={onRemove}
            />
          ))}
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {items.map((item, index) => (
          <SwipeableWishlistItem
            key={item.id}
            item={item}
            index={index}
            onMoveToCart={onMoveToCart}
            onRemove={onRemove}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default MobileWishlist;

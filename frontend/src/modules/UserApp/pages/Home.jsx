import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore, useUIStore } from "../../../shared/store/useStore";
import { useCategoryStore } from "../../../shared/store/categoryStore";
import { useWishlistStore } from "../../../shared/store/wishlistStore";
import { formatPrice } from "../../../shared/utils/helpers";
import MobileLayout from "../components/Layout/MobileLayout";
import PageTransition from "../../../shared/components/PageTransition";
import toast from "react-hot-toast";
import { FiHeart, FiStar } from "react-icons/fi";
import { products as allProducts } from "../../../data/products";
import { categories as initialCategories } from "../../../data/categories";

const MobileHome = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [favoriteShops, setFavoriteShops] = useState(() => {
    try {
      const saved = localStorage.getItem("favorite_shops");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const { addItem } = useCartStore();
  const { categories: backendCategories, initialize: initCategories } = useCategoryStore();

  const wishlistStore = useWishlistStore();
  const toggleWishlist = (product) => {
    if (wishlistStore.isInWishlist(product.id)) {
      wishlistStore.removeItem(product.id);
      toast.success("Removed from wishlist");
    } else {
      wishlistStore.addItem(product);
      toast.success("Added to wishlist!");
    }
  };

  const trendingCarouselRef = useRef(null);
  const scrollTrendingRight = () => {
    if (trendingCarouselRef.current) {
      trendingCarouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };
  const scrollTrendingLeft = () => {
    if (trendingCarouselRef.current) {
      trendingCarouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const smallShopsCarouselRef = useRef(null);
  const scrollSmallShopsRight = () => {
    if (smallShopsCarouselRef.current) {
      smallShopsCarouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };
  const scrollSmallShopsLeft = () => {
    if (smallShopsCarouselRef.current) {
      smallShopsCarouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const trendingProductsList = useMemo(() => {
    const ids = [306, 307, 302, 460, 1, 2, 4, 5, 6, 7];
    return ids.map(id => {
      const found = allProducts.find(p => Number(p.id) === Number(id));
      if (found) return found;
      return {
        id,
        name: "Premium Sikh Artifact",
        price: 45.00,
        image: "/images/redesign/premium_kada.png",
        rating: 4.8,
        reviewCount: 42,
      };
    });
  }, [allProducts]);



  useEffect(() => {
    try {
      localStorage.setItem("favorite_shops", JSON.stringify(favoriteShops));
    } catch (e) {
      console.error(e);
    }
  }, [favoriteShops]);

  useEffect(() => {
    initCategories();
  }, [initCategories]);

  const rootCategories = (backendCategories.length > 0 ? backendCategories : initialCategories).filter((cat) => {
    const parent = typeof cat.parentId === 'object' ? (cat.parentId?._id || cat.parentId?.id) : cat.parentId;
    return !parent;
  });

  const realTurbanCategory = backendCategories.find(c => c.name?.toLowerCase().includes('turban'));

  // Find our specific mock products for the redesign
  const kirpan = allProducts.find((p) => p.id === 306) || {
    id: 306,
    name: "Premium Sterling Silver Kada",
    price: 95.00,
    image: "/images/redesign/silver_kada.png",
    description: "Elegant and premium Sikh Kada crafted from high-grade sterling silver, offering a brilliant, long-lasting glossy shine.",
    vendorId: 1,
    vendorName: "Sikh Heritage Store"
  };

  const journal = allProducts.find((p) => p.id === 307) || {
    id: 307,
    name: "Introduction to Sikhism",
    price: 15.00,
    image: "/images/redesign/media__1783408531361.png",
    description: "A comprehensive guide to understanding Sikhism, its history, and its practices.",
    vendorId: 1,
    vendorName: "Sikh Heritage Store"
  };

  const juttis = allProducts.find((p) => p.id === 302) || {
    id: 302,
    name: "Swirling Fish Artwork",
    price: 150.00,
    image: "/images/redesign/fish_artwork.png",
    description: "A beautiful painting of fishes swimming in a circular motion. A perfect piece of artwork for your home or office.",
    vendorId: 1,
    vendorName: "Sikh Heritage Store"
  };

  const voile = allProducts.find((p) => p.id === 460) || {
    id: 460,
    name: "Premium Sikh Turban",
    price: 40.00,
    image: "/images/turbans/media__1783759342309.jpg",
    description: "High quality premium voile turban fabric with rich colors.",
    vendorId: 3,
    vendorName: "Heritage Weaves"
  };

  const smallShopProducts = useMemo(() => {
    const targetIds = [303, 302, 460, 307];
    return targetIds.map(id => {
      const found = allProducts.find(p => Number(p.id) === Number(id));
      if (found) return found;
      // Fallback
      return {
        id,
        name: id === 303 ? "Classic Stainless Steel Kadda" : id === 302 ? "Swirling Fish Artwork" : id === 460 ? "Premium Sikh Turban" : "Introduction to Sikhism",
        price: id === 303 ? 35.00 : id === 302 ? 150.00 : id === 460 ? 40.00 : 15.00,
        image: id === 303 ? "/images/redesign/premium_kada.png" : id === 302 ? "/images/redesign/fish_artwork.png" : id === 460 ? "/images/turbans/media__1783759342309.jpg" : "/images/redesign/media__1783408531361.png",
        vendorName: id === 303 ? "Heritage Woodcarvers" : id === 302 ? "Amritsar Fine Arts" : id === 460 ? "Sikh Heritage Weaves" : "Amritsar Fine Arts"
      };
    });
  }, []);

  const handleAddToCart = (product) => {
    const success = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      vendorId: product.vendorId || 1,
      vendorName: product.vendorName || "Unknown Vendor",
    });
    if (success !== false) {
      toast.success(`${product.name} added to cart!`);
      useUIStore.setState({ isCartOpen: true });
    }
  };

  // Set home page background color
  useEffect(() => {
    document.body.style.background = "#ffffff";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  return (
    <PageTransition>
      <MobileLayout fullWidth={true}>
        <div className="w-full relative overflow-hidden bg-background text-on-background font-body-md">

          {/* Hero Section */}
          <section className="pt-4 pb-6 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 lg:h-[300px]">
              {/* Main Feature Block */}
              <div className="lg:col-span-8 bg-white border border-black/10 rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-sm h-full">
                <div className="w-full md:w-[55%] p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                  <span className="text-xs font-bold text-black tracking-widest mb-2 uppercase block">
                    Established in Heritage
                  </span>
                  <h2 className="text-3xl md:text-4xl lg:text-[2.25rem] font-bold font-serif mb-4 text-black leading-[1.1]">
                    Artisanship<br />Rooted in<br />Heritage
                  </h2>
                  <button
                    onClick={() => navigate("/categories")}
                    className="self-start bg-black hover:bg-[#F5A623] hover:text-black text-white px-6 py-2.5 rounded-full font-semibold text-xs transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                  >
                    Shop the collection
                  </button>
                </div>
                <div className="w-full md:w-[45%] h-48 md:h-full">
                  <img
                    className="w-full h-full object-cover"
                    alt="A craftsman's workshop"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRcrJXYq55TYTCtcpBAfokwfJVCLHa0pJxpg_qF9GozEgjSj2v6vlltBzQqMIvjkb8eUhzhDwwbcU94q7s8xhlIZy7Rg03Dj9ovs0_tSLW-efBV24zNqQvpgk1ThlcSUhJzzJn0NHYcEifleVZn-C0_Fb-2mvUAVb5B68Y2hBWzLp-g9N-BObQmeLFaP68M-CpJ5dr0ys6SoxDOBzDYgLOtgxn9bgiGCZgKHavOhYfs8aFjyx2BPjCvHHbauGCoHyd7pPfcRgmJdOP"
                  />
                </div>
              </div>

              {/* Secondary Feature Block */}
              <div className="hidden lg:block lg:col-span-4 relative rounded-[2rem] overflow-hidden shadow-sm h-[250px] lg:h-full cursor-pointer group" onClick={() => navigate("/category/3")}>
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Sculptural Kara"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBz5f9HJGrpM3vRTXYIkoQzQQj8mQTww137XULJlzzvaaCPjDnIE5H7LW1-d_OzICNM5pkzOOTMKrujfK3x6NnNc6q8QBnsyirTlvUfDlk6YETwPK-_NONEUDHIBlB-RIoRGzuVK37X8lCtlHfHo6eFC7nFVk78-2FN8SPYt0YJI5VnVZ2_puk8eEQFcByZFE86bMiYbbBgCVytKaKz3JNEsDyntF3aT1VWbbVUuugoJJ-4N5U3e7Ggwdxfgb7cRWFc59Dc_Ah1A4Y"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full text-left">
                  <h3 className="text-white text-xl lg:text-2xl font-bold mb-2 leading-tight font-serif drop-shadow-md">
                    Timeless pieces that demand attention
                  </h3>
                  <span className="text-white font-semibold text-xs underline underline-offset-4 decoration-2 drop-shadow-md group-hover:text-gray-200">
                    Shop Karas
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Categories */}
          <section className="py-6 md:py-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto text-left">
            <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
              <div className="text-left">
                <h3 className="text-2xl md:text-3xl font-bold font-serif tracking-tight text-neutral-900 leading-tight">
                  Curated Categories
                </h3>
                <p className="text-neutral-500 text-sm md:text-base mt-1 leading-relaxed">
                  Exceptional pieces across our cultural landscape.
                </p>
              </div>
              <Link to="/categories" className="text-xs font-semibold text-black border-b border-[#F5A623] hover:text-[#F5A623] hover:border-[#F5A623] transition-colors pb-1 self-start md:self-end mb-1">
                View All Categories
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rootCategories.slice(0, 4).map((cat) => (
                <div
                  key={cat.id || cat._id}
                  onClick={() => navigate(`/category/${cat.id || cat._id}`)}
                  className="group cursor-pointer w-full max-w-[180px] md:max-w-[260px] lg:max-w-[280px] mx-auto text-center"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-2 transition-transform duration-500 group-hover:scale-[1.02] shadow-sm hover:shadow bg-[#f2dfd3]">
                    <img
                      className="w-full h-full object-cover"
                      alt={cat.name}
                      src={cat.image}
                    />
                  </div>
                  <span className="text-sm md:text-base font-semibold text-black group-hover:text-[#F5A623] transition-colors block">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Discover Small Shops Section */}
          <section className="py-12 bg-white text-left">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold font-serif tracking-tight text-neutral-900 leading-tight">
                    Discover small shops
                  </h3>
                  <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
                    Unique items from independent Sikh creators and heritage artisans.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    id: "heritage-woodcarvers",
                    name: "Heritage Woodcarvers",
                    rating: "4.9",
                    reviews: "124",
                    images: [
                      "/images/artwork/media__1783761276765.jpg",
                      "/images/redesign/premium_kada.png",
                      "/images/redesign/media__1783408531361.png"
                    ]
                  },
                  {
                    id: "amritsar-fine-arts",
                    name: "Amritsar Fine Arts",
                    rating: "5.0",
                    reviews: "82",
                    images: [
                      "/images/redesign/fish_artwork.png",
                      "/images/artwork/media__1783761276765.jpg",
                      "/images/redesign/media__1783408531361.png"
                    ]
                  },
                  {
                    id: "sikh-heritage-weaves",
                    name: "Sikh Heritage Weaves",
                    rating: "4.8",
                    reviews: "95",
                    images: [
                      "/images/turbans/media__1783759342309.jpg",
                      "/images/turbans/media__1783759510824.jpg",
                      "/images/turbans/media__1783759513166.jpg"
                    ]
                  }
                ].map((shop) => {
                  const isFav = !!favoriteShops[shop.id];
                  return (
                    <div
                      key={shop.id}
                      onClick={() => navigate(`/brand/${shop.id}`)}
                      className="bg-white rounded-2xl border border-neutral-205/60 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                    >
                      {/* Collage Header */}
                      <div className="p-3 pb-0 relative">
                        {/* Heart Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavoriteShops(prev => ({ ...prev, [shop.id]: !prev[shop.id] }));
                            toast.success(isFav ? "Removed from favorites" : "Added to favorites", {
                              icon: isFav ? "💔" : "❤️"
                            });
                          }}
                          className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center text-neutral-600 hover:text-red-500 transition-all active:scale-90"
                        >
                          <FiHeart className={`text-base transition-colors ${isFav ? "text-[#F5A623] fill-[#F5A623]" : ""}`} />
                        </button>

                        <div className="grid grid-cols-3 gap-1.5 h-36 md:h-44 rounded-xl overflow-hidden">
                          {/* Large Image */}
                          <div className="col-span-2 h-full overflow-hidden bg-stone-100">
                            <img
                              src={shop.images[0]}
                              alt={`${shop.name} main`}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                            />
                          </div>
                          {/* Stacked Images */}
                          <div className="col-span-1 grid grid-rows-2 gap-1.5 h-full">
                            <div className="h-full overflow-hidden bg-stone-100">
                              <img
                                src={shop.images[1]}
                                alt={`${shop.name} detail 1`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="h-full overflow-hidden bg-stone-100">
                              <img
                                src={shop.images[2]}
                                alt={`${shop.name} detail 2`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Shop Info Footer */}
                      <div className="p-4 pt-3 flex flex-row items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-neutral-900 group-hover:text-[#F5A623] transition-colors truncate">
                            {shop.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="flex items-center gap-0.5 text-xs text-neutral-900 font-bold">
                              <FiStar className="text-yellow-500 fill-yellow-500 text-xs" />
                              {shop.rating}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              ({shop.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        {/* Go to shop arrow */}
                        <div className="w-8 h-8 rounded-full bg-stone-50 group-hover:bg-[#F5A623]/10 group-hover:text-[#F5A623] flex items-center justify-center text-neutral-450 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Featured Items from Small Shops Section */}
          <section className="py-12 bg-white text-left border-t border-[#ebdcd0]/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold font-serif tracking-tight text-neutral-900 leading-tight">
                    Featured Items from Small Shops
                  </h3>
                  <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
                    Handpicked local creations available today.
                  </p>
                </div>
              </div>

              {/* Carousel container with overlapping left/right hover arrows */}
              <div className="relative group">
                {/* Left Arrow */}
                <button
                  onClick={scrollSmallShopsLeft}
                  className="absolute left-[-18px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Right Arrow */}
                <button
                  onClick={scrollSmallShopsRight}
                  className="absolute right-[-18px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                {/* Horizontal Scroll list */}
                <div
                  ref={smallShopsCarouselRef}
                  className="flex gap-5 overflow-x-auto hide-scrollbar scroll-smooth pb-4"
                >
                  {smallShopProducts.map((product) => {
                    const isFav = wishlistStore.isInWishlist(product.id);
                    const originalPrice = product.originalPrice || Math.round(product.price * 1.25);
                    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
                    return (
                      <div
                        key={product.id}
                        className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] lg:w-[calc((100%-60px)/4)] bg-transparent group/card relative flex flex-col justify-between cursor-pointer"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {/* Image area */}
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                          />
                          {/* Heart icon button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-neutral-600 hover:text-red-500"
                          >
                            <FiHeart className={`w-3.5 h-3.5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                          </button>
                        </div>

                        {/* Text / Price area */}
                        <div className="pt-2 text-left flex flex-col justify-between flex-1">
                          <div>
                            <span className="text-[11px] sm:text-xs md:text-sm font-normal text-neutral-800 hover:underline line-clamp-2 block leading-snug">
                              {product.name}
                            </span>
                          </div>

                          <div className="mt-1">
                            {/* Price */}
                            <div className="flex items-baseline gap-1 flex-wrap">
                              <span className="text-xs sm:text-sm md:text-base font-bold text-neutral-900">
                                {formatPrice ? formatPrice(product.price) : `$${product.price}`}
                              </span>
                              {originalPrice > product.price && (
                                <>
                                  <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                                    {formatPrice ? formatPrice(originalPrice) : `$${originalPrice}`}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] font-bold text-red-600">
                                    ({discount}% OFF)
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>


          {/* Etsy-Style Dual Banner Section */}
          <section className="py-12 bg-white text-left">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
              <div className="">
                {/* Wedding Trends Banner */}
                <div
                  onClick={() => navigate("/category/fashion")}
                  className="bg-[#f4ece1] rounded-[2rem] overflow-hidden flex flex-col md:flex-row items-center justify-between cursor-pointer group hover:shadow-md transition-shadow duration-300 h-[280px]"
                >
                  <div className="p-8 md:p-12 flex flex-col justify-center items-start flex-1 text-left">
                    <h3 className="text-3xl md:text-4xl font-serif text-neutral-900 font-bold mb-6 leading-tight max-w-xs">
                      Our top wedding trends
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/category/fashion");
                      }}
                      className="px-6 py-3 bg-neutral-900 text-white font-semibold text-sm rounded-full hover:bg-neutral-800 transition-colors shadow-sm hover:shadow"
                    >
                      Shop the edit
                    </button>
                  </div>
                  <div className="w-full md:w-[55%] h-full overflow-hidden relative">
                    <img
                      src="/images/home/wedding_trends_banner.png"
                      alt="Top wedding trends"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trending Products (Etsy-Style Carousel) */}
          <section className="py-12 bg-white text-left border-t border-[#ebdcd0]/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-8 text-left">
                <div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 leading-tight">
                    Trending Pieces
                  </h3>
                  <p className="text-neutral-600 text-sm mt-1 leading-relaxed">
                    The most sought-after crafts this season.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast.success("Marked as not interested")}
                    className="bg-[#eaeaea] hover:bg-gray-200 text-gray-800 text-xs font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
                  >
                    Not interested
                  </button>
                  <button
                    onClick={() => navigate("/category/fashion")}
                    className="bg-[#eaeaea] hover:bg-gray-200 text-gray-800 text-xs font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
                  >
                    View all
                  </button>
                </div>
              </div>

              {/* Carousel container with overlapping left/right hover arrows */}
              <div className="relative group">
                {/* Left Arrow */}
                <button
                  onClick={scrollTrendingLeft}
                  className="absolute left-[-18px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Right Arrow */}
                <button
                  onClick={scrollTrendingRight}
                  className="absolute right-[-18px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                {/* Horizontal Scroll list */}
                <div
                  ref={trendingCarouselRef}
                  className="flex gap-5 overflow-x-auto hide-scrollbar scroll-smooth pb-4"
                >
                  {trendingProductsList.map((product) => {
                    const isFav = wishlistStore.isInWishlist(product.id);
                    const originalPrice = product.originalPrice || Math.round(product.price * 1.25);
                    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
                    return (
                      <div
                        key={product.id}
                        className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] lg:w-[calc((100%-60px)/4)] bg-transparent group/card relative flex flex-col justify-between cursor-pointer"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {/* Image area */}
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                          />
                          {/* Heart icon button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-neutral-600 hover:text-red-500"
                          >
                            <FiHeart className={`w-3.5 h-3.5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                          </button>
                        </div>

                        {/* Text / Price area */}
                        <div className="pt-2 text-left flex flex-col justify-between flex-1">
                          <div>
                            <span className="text-[11px] sm:text-xs md:text-sm font-normal text-neutral-800 hover:underline line-clamp-2 block leading-snug">
                              {product.name}
                            </span>
                          </div>

                          <div className="mt-1">
                            {/* Price */}
                            <div className="flex items-baseline gap-1 flex-wrap">
                              <span className="text-xs sm:text-sm md:text-base font-bold text-neutral-900">
                                {formatPrice ? formatPrice(product.price) : `$${product.price}`}
                              </span>
                              {originalPrice > product.price && (
                                <>
                                  <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                                    {formatPrice ? formatPrice(originalPrice) : `$${originalPrice}`}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] font-bold text-red-600">
                                    ({discount}% OFF)
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* More Than Commerce Section */}
          <section className="w-full bg-black py-20 md:py-28 px-4 sm:px-8 lg:px-12">
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white mb-6 leading-tight tracking-wide">
                More Than Commerce
              </h3>
              <p className="text-base md:text-lg text-gray-300 mb-10 leading-relaxed max-w-3xl">
                SikhStreet was created to bring together Sikh creators, artists, brands, and culture into one modern global marketplace — designed with storytelling, creativity, and identity at its core.
              </p>
              <button
                onClick={() => navigate("/our-story")}
                className="bg-transparent border border-white text-white hover:bg-white hover:text-black px-10 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95"
              >
                Our Story
              </button>
            </div>
          </section>

          {/* Join SikhStreet Section */}
          <section className="w-full pt-4 md:pt-8 pb-16 md:pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
            <div className="bg-white border border-[#ebdcd0]/60 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center p-12 md:p-24 relative overflow-hidden">
              <h4 className="text-4xl md:text-5xl mb-5 font-bold font-serif text-black leading-tight">
                Join SikhStreet
              </h4>
              <p className="text-base md:text-lg mb-8 max-w-lg mx-auto text-black leading-relaxed">
                Build your brand, showcase your creativity, and connect with a global Sikh audience.
              </p>
              <button
                onClick={() => navigate("/register")}
                className="bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white px-10 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
              >
                Become a Seller
              </button>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 md:py-24 bg-white/40">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-12 h-12 text-black/30 mx-auto mb-8">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              <div className="overflow-hidden relative">
                <div
                  className="flex transition-transform duration-500"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {/* Testimonial Slide 1 */}
                  <div className="w-full flex-shrink-0 px-4">
                    <p className="text-lg md:text-2xl font-serif italic mb-8 text-black max-w-2xl mx-auto leading-relaxed">
                      "The quality of the full-voile fabric is unmatched. You can feel the heritage in every thread. Sikh Street isn't just a store; it's a bridge to our identity."
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-[#F5A623]">
                        <img
                          className="w-full h-full object-cover"
                          alt="Customer Amandeep S."
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkUopceKbhLbYLKYKgyiR_-x09JHnybRdjwso8r9VEslGNssgSmFX6Rc7e4WWrAc74jIpIEIH3p-iFI8c5sEo7IGYlyQQ5CRLTiBikdzf9lJ7CWCOurgT9klPxDhd-A8Yqnz0GlIOdKpmmojhNnBYLur3G8FCCpfi969J1pWQwwoc58xxpeZoYyZJIsw4vdRwODlS2_h41gs66Dc8tiFPo_TUxu2vxmj5VEPdpN408Z1V9rzae-RYe0pZJIx91SZivR2CjW40ok0iq"
                        />
                      </div>
                      <span className="text-sm font-semibold text-black">Amandeep S.</span>
                      <span className="text-xs text-black">London, UK</span>
                    </div>
                  </div>

                  {/* Testimonial Slide 2 */}
                  <div className="w-full flex-shrink-0 px-4">
                    <p className="text-lg md:text-2xl font-serif italic mb-8 text-black max-w-2xl mx-auto leading-relaxed">
                      "Purchasing the Koftgari Kirpan was a spiritual experience. The craftsmanship is pristine, and you can see the artisan's lifetime devotion in every engraving."
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-[#F5A623] bg-black hover:bg-[#F5A623] hover:text-black transition-colors flex items-center justify-center text-white font-bold font-sans">
                        JS
                      </div>
                      <span className="text-sm font-semibold text-black">Jaspreet S.</span>
                      <span className="text-xs text-black">Toronto, Canada</span>
                    </div>
                  </div>

                  {/* Testimonial Slide 3 */}
                  <div className="w-full flex-shrink-0 px-4">
                    <p className="text-lg md:text-2xl font-serif italic mb-8 text-black max-w-2xl mx-auto leading-relaxed">
                      "Extremely fast shipping to the US. The Dilruba has a beautiful resonant sound and was set up perfectly. Truly authentic artisan heritage."
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-[#F5A623] bg-black hover:bg-[#F5A623] hover:text-black transition-colors flex items-center justify-center text-white font-bold font-sans">
                        HK
                      </div>
                      <span className="text-sm font-semibold text-black">Harpreet K.</span>
                      <span className="text-xs text-black">California, USA</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Dots */}
              <div className="flex justify-center gap-3 mt-8">
                {[0, 1, 2].map((slideIdx) => (
                  <button
                    key={slideIdx}
                    onClick={() => setCurrentSlide(slideIdx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === slideIdx ? "bg-black hover:bg-[#F5A623] hover:text-black transition-colors w-6" : "bg-black/20"
                      }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full bg-[#111111] text-left">
            <div className="flex flex-col md:flex-row justify-between items-start gap-10 px-4 sm:px-8 lg:px-12 py-12 w-full max-w-7xl mx-auto">
              <div className="max-w-xs">
                <h2 className="text-xl font-bold font-serif text-white mb-4">Sikh Street</h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Celebrating the soul of Sikh craftsmanship. Every piece tells a story of devotion, history, and unmatched skill.
                </p>
                <div className="flex gap-4">
                  <a className="text-gray-400 hover:text-[#F5A623] transition-colors" href="#">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                    </svg>
                  </a>
                  <a className="text-gray-400 hover:text-[#F5A623] transition-colors" href="#">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </a>
                  <a className="text-gray-400 hover:text-[#F5A623] transition-colors" href="#">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l5.57 3.285m-5.57-3.285l5.57-3.284m0 0a2.25 2.25 0 113.564-1.804 2.25 2.25 0 01-3.564 1.804z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h5 className="text-sm font-bold text-white mb-4">Shop</h5>
                  <ul className="space-y-3">
                    <li>
                      <Link className="text-sm text-gray-400 hover:text-[#F5A623] hover:underline transition-all" to="/search">
                        All Products
                      </Link>
                    </li>
                    <li>
                      <Link className="text-sm text-gray-400 hover:text-[#F5A623] hover:underline transition-all" to="/category/turbans">
                        Turbans
                      </Link>
                    </li>
                    <li>
                      <Link className="text-sm text-gray-400 hover:text-[#F5A623] hover:underline transition-all" to="/category/6">
                        Artwork
                      </Link>
                    </li>
                    <li>
                      <Link className="text-sm text-gray-400 hover:text-[#F5A623] hover:underline transition-all" to="/search?q=bespoke">
                        Bespoke
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white mb-4">Experience</h5>
                  <ul className="space-y-3">
                    <li>
                      <Link className="text-sm text-gray-400 hover:text-[#F5A623] hover:underline transition-all" to="/our-story">
                        Our Story
                      </Link>
                    </li>
                    <li>
                      <Link className="text-sm text-gray-400 hover:text-[#F5A623] hover:underline transition-all" to="/brand/heritage-forge">
                        Artisan Directory
                      </Link>
                    </li>
                    <li>
                      <Link className="text-sm text-gray-400 hover:text-[#F5A623] hover:underline transition-all" to="/brand/heritage-forge">
                        Sustainability
                      </Link>
                    </li>
                    <li>
                      <Link className="text-sm text-gray-400 hover:text-[#F5A623] hover:underline transition-all" to="/brand/heritage-forge">
                        Shipping
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-bold text-white mb-4">Newsletter</h5>
                <p className="text-sm text-gray-400 mb-4">
                  Join us for exclusive artisan stories.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success("Thank you for subscribing!");
                    e.target.reset();
                  }}
                  className="flex border-b border-[#F5A623]/30 py-1"
                >
                  <input
                    className="bg-transparent border-none focus:ring-0 w-full text-sm outline-none px-1 text-white placeholder-gray-500"
                    placeholder="Email address"
                    type="email"
                    required
                  />
                  <button type="submit" className="text-white hover:text-[#F5A623] p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>

            <div className="px-6 py-6 border-t border-white/10 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                © 2026 Sikh Street. Heritage Crafted.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <Link to="/privacy-policy" className="hover:text-[#F5A623] transition-colors">Privacy Policy</Link>
                <span>•</span>
                <Link to="/terms-conditions" className="hover:text-[#F5A623] transition-colors">Terms & Conditions</Link>
                <span>•</span>
                <Link to="/refund-policy" className="hover:text-[#F5A623] transition-colors">Refund Policy</Link>
              </div>
            </div>
          </footer>

        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default MobileHome;

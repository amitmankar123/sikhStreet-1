import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { matchPath, useNavigate } from "react-router-dom";
import { FiArrowRight, FiZap, FiTag } from "react-icons/fi";

// Hero images for the parallax effect
import sneakersImg from "../../../../../data/products/sneakers.png";
import watchImg from "../../../../../data/products/stylish kara.png";
import sunglassImg from "../../../../../data/products/sunglass.png";

const defaultBanners = [
  {
    id: 1,
    title: "Seasonal Sale",
    subtitle: "Limited Time Offer",
    discount: "Shop Now",
    description: "",
    gradient: "from-amber-600 via-orange-500 to-red-500",
    link: "/flash-sale",
    icon: FiZap,
    heroImage: sneakersImg,
  },
  {
    id: 2,
    title: "New Arrivals",
    subtitle: "Fresh Collections",
    discount: "Explore",
    description: "",
    gradient: "from-slate-800 via-brand-navy to-blue-900",
    link: "/daily-deals",
    icon: FiTag,
    heroImage: sunglassImg,
  },
  {
    id: 3,
    title: "Featured Items",
    subtitle: "Premium Selection",
    discount: "View Collection",
    description: "",
    gradient: "from-emerald-700 via-teal-700 to-cyan-800",
    link: "/offers",
    icon: FiTag,
    heroImage: watchImg,
  },
];

const gradientPalette = [
  "from-amber-600 via-orange-500 to-red-500",
  "from-slate-800 via-brand-navy to-blue-900",
  "from-emerald-700 via-teal-700 to-cyan-800",
];

const KNOWN_USER_ROUTE_PATTERNS = [
  "/",
  "/home",
  "/search",
  "/offers",
  "/daily-deals",
  "/flash-sale",
  "/new-arrivals",
  "/categories",
  "/category/:id",
  "/brand/:id",
  "/seller/:id",
  "/product/:id",
  "/sale/:slug",
  "/track-order/:orderId",
];

const getPathnameFromTarget = (target) =>
  String(target || "").trim().split("?")[0].split("#")[0];

const isKnownInternalRoute = (target) => {
  const pathname = getPathnameFromTarget(target);
  if (!pathname) return false;
  return KNOWN_USER_ROUTE_PATTERNS.some((pattern) =>
    !!matchPath({ path: pattern, end: true }, pathname)
  );
};

const resolveBannerLink = (banner) => {
  const candidate = String(
    banner?.linkUrl || banner?.link || banner?.url || ""
  ).trim();
  if (!candidate) return "";
  if (isExternalLink(candidate)) return candidate;
  if (isSafeInternalPath(candidate) && isKnownInternalRoute(candidate))
    return candidate;
  return "";
};

const isExternalLink = (target) => /^https?:\/\//i.test(String(target || "").trim());
const isSafeInternalPath = (target) => String(target || "").startsWith("/");

const AnimatedBanner = ({ banners = null }) => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);

  const resolvedBanners =
    Array.isArray(banners) && banners.length > 0
      ? banners.map((banner, index) => ({
        id: banner.id || `banner-${index}`,
        title: banner.title || "Special Offer",
        subtitle: banner.subtitle || "Limited Time",
        discount: banner.discount || "Shop Now",
        description: banner.description || "",
        gradient:
          banner.gradient || gradientPalette[index % gradientPalette.length],
        link: resolveBannerLink(banner),
        icon: banner.icon || FiTag,
        heroImage: banner.image || banner.heroImage || watchImg,
      }))
      : defaultBanners;

  const handleBannerClick = (target) => {
    const normalizedTarget = String(target || "").trim();
    if (!normalizedTarget) return;
    if (isExternalLink(normalizedTarget)) {
      window.open(normalizedTarget, "_blank", "noopener,noreferrer");
      return;
    }
    if (isSafeInternalPath(normalizedTarget) && isKnownInternalRoute(normalizedTarget)) {
      navigate(normalizedTarget);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % resolvedBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [resolvedBanners.length]);

  return (
    <div className="px-4 py-3 md:py-6">
      <div className="relative w-full h-40 md:h-64 lg:h-[400px] rounded-2xl overflow-hidden shadow-xl bg-gray-900">
        <AnimatePresence>
          {resolvedBanners.map((banner, index) => {
            if (index !== currentBanner) return null;
            const Icon = banner.icon;

            return (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, scale: 1.05, x: "100%" }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: "-100%" }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{ willChange: "transform, opacity" }}
                className={`absolute inset-0 w-full h-full bg-gradient-to-br ${banner.gradient} p-3`}>
                {/* 3D Depth Parallax Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  {/* Layer 1: Background (Blurred Product) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 1.5, rotate: -5, x: 50 }}
                    animate={{ opacity: 0.3, scale: 2.5, rotate: 0, x: 0 }}
                    transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute right-[-10%] top-[-20%] w-[120%] h-[150%]"
                  >
                    <img
                      src={banner.heroImage}
                      className="w-full h-full object-contain blur-3xl opacity-50 brightness-150 mix-blend-screen"
                      alt=""
                    />
                  </motion.div>

                  {/* Layer 2: Midground (Bokeh Particles) */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        opacity: 0,
                        x: Math.random() * 200,
                        y: Math.random() * 100
                      }}
                      animate={{
                        opacity: [0, 0.4, 0],
                        x: [null, Math.random() * -100],
                        y: [null, Math.random() * -50],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 4,
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                      className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                      style={{
                        right: `${10 + (i * 15)}%`,
                        top: `${20 + (i * 10)}%`,
                      }}
                    />
                  ))}

                  {/* Layer 3: Foreground (Sharp Hero Product) */}
                  <div className={`absolute right-[-2%] md:right-[5%] top-1/2 -translate-y-1/2 w-48 h-48 md:w-80 md:h-80 lg:w-[500px] lg:h-[500px] flex items-center justify-center ${banner.id === 2 ? 'pb-6 md:pb-12' : ''}`}>
                    <motion.div
                      initial={{ opacity: 0, x: 100, scale: 0.5, rotate: 10 }}
                      animate={{ opacity: 1, x: 0, scale: 1.1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 80,
                        damping: 12,
                        delay: 0.2
                      }}
                    >
                      <motion.img
                        src={banner.heroImage}
                        alt="Hero Product"
                        className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
                        animate={{
                          y: [0, -5, 0],
                          rotate: [0, 2, -2, 0]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Content */}
                <button
                  type="button"
                  onClick={() => handleBannerClick(banner.link)}
                  disabled={!banner.link}
                  className="relative z-10 h-full w-full flex flex-col justify-center items-start text-left px-6 md:px-12 lg:px-20 group">
                  <div className="flex flex-col items-start max-w-[70%] lg:max-w-[50%]">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2 mb-1">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}>
                        <Icon className="text-white text-xl md:text-2xl drop-shadow-lg" />
                      </motion.div>
                      <motion.span
                        className="text-white/90 text-sm md:text-base lg:text-lg font-semibold tracking-wider uppercase"
                        animate={{
                          opacity: [0.9, 1, 0.9],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}>
                        {banner.subtitle}
                      </motion.span>
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-white text-3xl md:text-5xl lg:text-7xl font-extrabold mb-2 md:mb-4 drop-shadow-lg relative inline-block tracking-tight leading-tight">
                      {banner.title}
                    </motion.h3>

                    {banner.description && (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/90 text-sm md:text-lg lg:text-xl mb-4 md:mb-6 leading-relaxed max-w-2xl">
                        {banner.description}
                      </motion.p>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      style={{
                        willChange: "transform",
                        transform: "translateZ(0)",
                      }}
                      className="inline-flex items-center gap-2 bg-brand-saffron hover:bg-orange-600 px-6 py-3 md:px-8 md:py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all relative overflow-hidden mt-2 md:mt-4 group-hover:scale-105"
                      whileTap={{ scale: 0.95 }}>
                      <span className="text-white font-bold text-sm md:text-lg relative z-10">
                        {banner.discount}
                      </span>
                      <FiArrowRight className="text-white text-sm md:text-lg relative z-10 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Indicator Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {resolvedBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className="focus:outline-none">
              <motion.div
                animate={{
                  width: index === currentBanner ? 24 : 6,
                  opacity: index === currentBanner ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
                className={`h-1.5 rounded-full bg-white ${index === currentBanner ? "w-6" : "w-1.5"
                  }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div >
  );
};

export default AnimatedBanner;

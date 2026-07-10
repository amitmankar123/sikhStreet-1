import { FiHeart, FiShoppingBag, FiStar, FiTrash2 } from "react-icons/fi";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore, useUIStore } from "../store/useStore";
import { useWishlistStore } from "../store/wishlistStore";
import { formatPrice, getPlaceholderImage } from "../utils/helpers";
import toast from "react-hot-toast";
import LazyImage from "./LazyImage";
import { useState, useRef } from "react";
import useLongPress from "../../modules/UserApp/hooks/useLongPress";
import LongPressMenu from "../../modules/UserApp/components/Mobile/LongPressMenu";
import FlyingItem from "../../modules/UserApp/components/Mobile/FlyingItem";
import { getVariantSignature } from "../utils/variant";


const ProductCard = ({ product, hideRating = false, isFlashSale = false }) => {
  const navigate = useNavigate();
  const productLink = `/product/${product.id}`;
  const { items, addItem, removeItem } = useCartStore();
  const triggerCartAnimation = useUIStore(
    (state) => state.triggerCartAnimation
  );
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();
  const hasNoVariant = (cartItem) => !getVariantSignature(cartItem?.variant || {});
  const isFavorite = isInWishlist(product.id);
  const isInCart = items.some(
    (item) => item.id === product.id && hasNoVariant(item)
  );
  const [isAdding, setIsAdding] = useState(false);
  const [showLongPressMenu, setShowLongPressMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showFlyingItem, setShowFlyingItem] = useState(false);
  const [flyingItemPos, setFlyingItemPos] = useState({
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
  });
  const buttonRef = useRef(null);
  const cartIconRef = useRef(null);

  const handleAddToCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const hasDynamicAxes =
      Array.isArray(product?.variants?.attributes) &&
      product.variants.attributes.some((attr) => Array.isArray(attr?.values) && attr.values.length > 0);
    const hasSizeVariants = Array.isArray(product?.variants?.sizes) && product.variants.sizes.length > 0;
    const hasColorVariants = Array.isArray(product?.variants?.colors) && product.variants.colors.length > 0;
    if (hasDynamicAxes || hasSizeVariants || hasColorVariants) {
      toast.error("Please select variant on product page");
      navigate(productLink);
      return;
    }

    const isLargeScreen = window.innerWidth >= 1024;

    if (!isLargeScreen) {
      setIsAdding(true);

      // Get button position
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      const startX = buttonRect ? buttonRect.left + buttonRect.width / 2 : 0;
      const startY = buttonRect ? buttonRect.top + buttonRect.height / 2 : 0;

      // Get cart bar position (prefer cart bar over header icon)
      setTimeout(() => {
        const cartBar = document.querySelector("[data-cart-bar]");
        let endX = window.innerWidth / 2;
        let endY = window.innerHeight - 100;

        if (cartBar) {
          const cartRect = cartBar.getBoundingClientRect();
          endX = cartRect.left + cartRect.width / 2;
          endY = cartRect.top + cartRect.height / 2;
        } else {
          // Fallback to cart icon in header
          const cartIcon = document.querySelector("[data-cart-icon]");
          if (cartIcon) {
            const cartRect = cartIcon.getBoundingClientRect();
            endX = cartRect.left + cartRect.width / 2;
            endY = cartRect.top + cartRect.height / 2;
          }
        }

        setFlyingItemPos({
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
        });
        setShowFlyingItem(true);
      }, 50);

      setTimeout(() => setIsAdding(false), 600);
    }

    const addedToCart = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      stockQuantity: product.stockQuantity,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
    });
    if (!addedToCart) return;
    triggerCartAnimation();
    toast.success("Added to cart!");
  };

  const handleRemoveFromCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    removeItem(product.id, {});
    toast.success("Removed from cart!");
  };

  const handleLongPress = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setShowLongPressMenu(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name}`,
        url: window.location.origin + productLink,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + productLink);
      toast.success("Link copied to clipboard");
    }
  };

  const longPressHandlers = useLongPress(handleLongPress, 500);

  const handleFavorite = (e) => {
    e.stopPropagation();
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

  // Calculate sold percentage for flash sale (mock logic)
  const soldPercentage = product.stockQuantity ? Math.min(95, Math.floor(100 - (product.stockQuantity / 2))) : 75;

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -4 }}
        style={{ willChange: "transform", transform: "translateZ(0)" }}
        className={`bg-brand-surface rounded-2xl overflow-hidden group cursor-pointer h-full flex flex-col border transition-all duration-300 ${
          isFlashSale
            ? "border-orange-200 hover:shadow-saffron"
            : "border-brand-border hover:shadow-card-hover"
        } shadow-card glass-animated-pulse`}
        {...longPressHandlers}>
        <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl">
          {/* Favorite Icon */}
          <div className={`absolute top-2 right-2 z-10 transition-opacity duration-300 ${isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <button
              onClick={handleFavorite}
              className="p-2 bg-white/95 rounded-full shadow-md transition-all duration-300 hover:scale-110 flex items-center justify-center">
              <FiHeart
                className={`text-sm md:text-base transition-all duration-300 ${
                  isFavorite
                    ? "text-brand-saffron fill-brand-saffron scale-110"
                    : "text-brand-muted hover:text-brand-saffron"
                }`}
              />
            </button>
          </div>

          {/* Discount Badge */}
          {product.originalPrice > 0 && (
            <div className={`absolute top-2 left-2 text-white text-[8px] md:text-[10px] font-extrabold px-2 py-0.5 rounded-full z-10 shadow-sm ${
              isFlashSale
                ? "bg-gradient-to-r from-red-600 to-orange-500"
                : "bg-brand-sale"
            }`}>
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </div>
          )}

          {/* New Badge */}
          {product.isNew && !product.originalPrice && (
            <div className="absolute top-2 left-2 text-white text-[8px] md:text-[10px] font-extrabold px-2 py-0.5 rounded-full z-10 shadow-sm bg-brand-gold">
              NEW
            </div>
          )}

          {/* Product Image */}
          <Link to={productLink} className="block w-full h-full">
            <LazyImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
              style={{ willChange: "transform", transform: "translateZ(0)" }}
              onError={(e) => {
                e.target.src = getPlaceholderImage(300, 300, "Product Image");
              }}
            />
          </Link>
        </div>

        {/* Product Info */}
        <div className="p-2.5 md:p-3 flex-1 flex flex-col bg-brand-surface">
          <Link to={productLink} className="block mb-1.5">
            <h3 className="font-semibold text-brand-navy line-clamp-2 text-sm md:text-sm leading-snug transition-colors group-hover:text-brand-saffron" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              {product.name}
            </h3>
          </Link>

          {/* Price */}
          <div className="flex items-center gap-1.5 mt-auto flex-wrap">
            <span className="text-sm md:text-base font-bold text-brand-saffron">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > 0 && (
              <span className="text-xs text-brand-subtle line-through font-medium">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <LongPressMenu
        isOpen={showLongPressMenu}
        onClose={() => setShowLongPressMenu(false)}
        position={menuPosition}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleFavorite}
        onShare={handleShare}
        isInWishlist={isFavorite}
      />

      {showFlyingItem && (
        <FlyingItem
          image={product.image}
          startPosition={flyingItemPos.start}
          endPosition={flyingItemPos.end}
          onComplete={() => setShowFlyingItem(false)}
        />
      )}
    </>
  );
};

export default ProductCard;

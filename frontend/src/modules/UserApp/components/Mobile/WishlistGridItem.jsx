import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiTrash2, FiStar, FiHeart } from 'react-icons/fi';
import { formatPrice } from '../../../../shared/utils/helpers';
import LazyImage from '../../../../shared/components/LazyImage';
import { useCartStore } from '../../../../shared/store/useStore';
import toast from 'react-hot-toast';

const WishlistGridItem = ({ item, index, onMoveToCart, onRemove }) => {
  const { items: cartItems, removeItem } = useCartStore();
  const isInCart = cartItems.some((i) => i.id === item.id);

  const handleRemoveFromCart = (e) => {
    if (e) {
      e.stopPropagation();
    }
    removeItem(item.id);
    toast.success("Removed from cart!");
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileTap={{ scale: 0.98 }}
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer h-full flex flex-col"
    >
      <div className="relative">
        {/* Favorite Icon - Always filled since it's in wishlist */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            className="p-1.5 bg-white/95 rounded-full shadow-md transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <FiHeart className="text-xs transition-all duration-300 text-red-500 fill-red-500 scale-110" />
          </button>
        </div>

        {/* Product Image */}
        <Link to={`/product/${item.id}`}>
          <div className="w-full h-40 md:h-48 bg-stone-50 flex items-center justify-center overflow-hidden relative">
            <LazyImage
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              onError={(e) => {
                e.target.src = 'https://placehold.co/300x300?text=Product+Image';
              }}
            />
          </div>
        </Link>
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col">
        <Link to={`/product/${item.id}`} className="mb-1">
          <h3 className="font-bold text-gray-800 line-clamp-2 text-xs md:text-sm transition-colors leading-snug" style={{ fontFamily: "\"Times New Roman\", Times, serif" }}>
            {item.name}
          </h3>
        </Link>
        {item.unit && item.unit !== "0" && (
          <p className="text-[10px] text-gray-400 mb-1 font-medium">{item.unit}</p>
        )}

        {/* Rating */}
        {item.rating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`text-[9px] ${i < Math.floor(item.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 font-semibold">
              {item.rating}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-1.5 mt-auto mb-2 pt-2 border-t border-stone-50">
          <span className="text-xs md:text-sm font-extrabold text-gray-900">
            {formatPrice(item.price)}
          </span>
          {item.originalPrice > 0 && (
            <span className="text-[10px] text-gray-450 line-through font-medium">
              {formatPrice(item.originalPrice)}
            </span>
          )}
        </div>

        {/* Add/Remove Button */}
        {isInCart ? (
          <motion.button
            onClick={handleRemoveFromCart}
            whileTap={{ scale: 0.95 }}
            style={{ willChange: "transform", transform: "translateZ(0)" }}
            className="w-full py-1.5 rounded-xl font-semibold text-[10px] md:text-xs transition-all duration-300 flex items-center justify-center gap-1 bg-red-50 text-red-600 border border-red-100 shadow-sm active:scale-95">
            <FiTrash2 className="text-xs" />
            <span>Remove</span>
          </motion.button>
        ) : (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onMoveToCart(item);
            }}
            whileTap={{ scale: 0.95 }}
            style={{ willChange: "transform", transform: "translateZ(0)" }}
            className="w-full py-1.5 rounded-xl font-bold text-[10px] md:text-xs transition-all duration-300 flex items-center justify-center gap-1.5 bg-black text-white hover:bg-[#F5A623] hover:text-black transition-colors text-white shadow-sm hover:shadow active:scale-95 group/btn">
            <FiShoppingBag className="text-xs transition-transform" />
            <span>Add</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default WishlistGridItem;


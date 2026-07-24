import { Link } from 'react-router-dom';
import { FiStar, FiShoppingBag, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import LazyImage from '../../../../shared/components/LazyImage';

const VendorShowcaseCard = ({ vendor, index = 0 }) => {
  if (!vendor) return null;
  const vendorLink = `/seller/${vendor.id}`;

  return (
    <Link to={vendorLink}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileTap={{ scale: 0.98 }}
        className="bg-brand-card shadow-sm hover:shadow-md rounded-xl p-4 md:p-6 flex flex-col items-center text-center w-[160px] min-w-[160px] md:w-[220px] md:min-w-[220px] lg:w-[260px] lg:min-w-[260px] h-full transition-all group"
      >
        {/* Vendor Logo/Avatar */}
        <div className="relative mb-3 md:mb-5">
          <div className="w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-brand-navy to-slate-800 flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-lg transition-all">
            {vendor.storeLogo ? (
              <LazyImage
                src={vendor.storeLogo}
                alt={vendor.storeName || vendor.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.storeName || vendor.name)}&background=7C3AED&color=fff&size=128`;
                }}
              />
            ) : (
              <span className="text-2xl md:text-4xl font-bold text-white">
                {(vendor.storeName || vendor.name).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {vendor.isVerified && (
            <div className="absolute -bottom-1 -right-1 md:bottom-0 md:right-0 bg-accent-500 rounded-full p-1 md:p-1.5 border-2 border-white shadow-sm">
              <FiCheckCircle className="text-white text-xs md:text-base" />
            </div>
          )}
        </div>

        {/* Vendor Name */}
        <h3 className="font-bold font-heading text-brand-text text-sm md:text-lg mb-1 md:mb-2 line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem]">
          {vendor.storeName || vendor.name}
        </h3>

        {/* Rating */}
        {vendor.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`text-[10px] md:text-sm ${i < Math.floor(vendor.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
            <span className="text-xs md:text-sm text-gray-600 font-medium">
              {vendor.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Product Count */}
        <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600 mb-3 md:mb-5">
          <FiShoppingBag className="text-primary-500 md:text-base" />
          <span>{vendor.totalProducts || 0} products</span>
        </div>

        {/* Visit Store Button */}
        <div className="mt-auto w-full">
          <div className="flex items-center justify-center gap-1 md:gap-2 text-[#F5A623] text-xs md:text-sm font-bold group-hover:text-orange-600 transition-colors">
            <span>Visit Store</span>
            <FiArrowRight className="text-xs md:text-sm group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default VendorShowcaseCard;


import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight, FiCalendar, FiDollarSign, FiShoppingBag, FiMapPin } from 'react-icons/fi';
import { formatPrice } from '../../../../shared/utils/helpers';
import { motion } from 'framer-motion';
import { formatVariantLabel } from '../../../../shared/utils/variant';

const MobileOrderCard = ({ order }) => {
  const variantLabels = Array.isArray(order?.items)
    ? order.items
      .map((item) => formatVariantLabel(item?.variant))
      .filter(Boolean)
    : [];
  const variantSummary = variantLabels.length === 1
    ? variantLabels[0]
    : variantLabels.length > 1
      ? `${variantLabels.length} variant selections`
      : '';

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'text-green-700 bg-green-50 border border-green-200/50';
      case 'shipped':
        return 'text-blue-700 bg-blue-50 border border-blue-200/50';
      case 'processing':
        return 'text-amber-700 bg-amber-50 border border-amber-200/50';
      case 'cancelled':
        return 'text-red-700 bg-red-50 border border-red-200/50';
      default:
        return 'text-black bg-white border border-black/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-black/10 hover:border-[#F5A623]/30 rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      <Link to={`/orders/${order.id}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <FiPackage className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base group-hover:text-[#F5A623] transition-colors">
                Order #{order.id}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                <FiCalendar className="text-xs text-gray-400" />
                {new Date(order.date || order.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <FiChevronRight className="text-gray-400 group-hover:text-[#F5A623] group-hover:translate-x-1 transition-all text-xl" />
        </div>

        <div className="space-y-2.5 mb-4">
          {/* Vendor Count */}
          {order.vendorItems && order.vendorItems.length > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-black/10 rounded-xl mb-3">
              <FiShoppingBag className="text-black text-xs" />
              <span className="text-xs font-bold text-black">
                {order.vendorItems.length} {order.vendorItems.length === 1 ? 'Vendor' : 'Vendors'}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">Items</span>
            <span className="font-semibold text-gray-800">
              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          
          {variantSummary && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Variant</span>
              <span className="text-xs font-semibold text-gray-600 text-right max-w-[62%] truncate">
                {variantSummary}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm pt-0.5">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <FiDollarSign className="text-xs text-gray-400" />
              Total Amount
            </span>
            <span className="text-base font-bold text-black">
              {formatPrice(order.total || order.amount || 0)}
            </span>
          </div>
        </div>

        {/* Shipping Address Section inside the card */}
        {order.shippingAddress && (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-white rounded-xl border border-black/10 mb-4 text-xs">
            <FiMapPin className="text-black text-sm mt-0.5 flex-shrink-0" />
            <div className="text-black leading-relaxed">
              <p className="font-bold text-gray-700 mb-0.5">Ship To</p>
              <p className="font-semibold text-black">{order.shippingAddress.fullName}</p>
              <p className="text-gray-500 font-medium">
                {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(
              order.status
            )}`}
          >
            {order.status || 'Pending'}
          </span>
          <span className="text-xs font-bold text-black group-hover:underline flex items-center gap-0.5">
            View Details
            <FiChevronRight className="text-xs" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default MobileOrderCard;

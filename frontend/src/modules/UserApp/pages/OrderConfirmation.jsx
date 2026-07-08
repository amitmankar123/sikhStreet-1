import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiTruck, FiEye } from 'react-icons/fi';
import { motion } from 'framer-motion';
import MobileLayout from "../components/Layout/MobileLayout";
import { useOrderStore } from '../../../shared/store/orderStore';
import { formatPrice } from '../../../shared/utils/helpers';
import { formatVariantLabel } from '../../../shared/utils/variant';
import PageTransition from '../../../shared/components/PageTransition';
import LazyImage from '../../../shared/components/LazyImage';

const MobileOrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getOrder, fetchOrderById, lastError } = useOrderStore();
  const [isResolving, setIsResolving] = useState(true);
  const order = getOrder(orderId);
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const displayOrderId = order?.id || order?.orderId || orderId;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!order && orderId) {
        await fetchOrderById(orderId);
      }
      if (mounted) setIsResolving(false);
    })();
    return () => {
      mounted = false;
    };
  }, [order, orderId, fetchOrderById]);

  useEffect(() => {
    if (!isResolving && !order) {
      navigate('/home');
    }
  }, [isResolving, order, navigate]);

  if (isResolving) {
    return (
      <PageTransition>
        <MobileLayout showBottomNav={false} showCartBar={false}>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <p className="text-[#554336]">Loading order...</p>
          </div>
        </MobileLayout>
      </PageTransition>
    );
  }

  if (!order) {
    return (
      <PageTransition>
        <MobileLayout showBottomNav={false} showCartBar={false}>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#231a13] mb-4">Order Not Found</h2>
              {lastError ? (
                <p className="text-sm text-[#554336]/80 mb-4">{lastError}</p>
              ) : null}
              <button
                onClick={() => navigate('/home')}
                className="bg-[#8d4b00] text-white px-6 py-3 rounded-xl font-semibold"
              >
                Go Home
              </button>
            </div>
          </div>
        </MobileLayout>
      </PageTransition>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <PageTransition>
      <MobileLayout showBottomNav={false} showCartBar={false}>
        <div className="w-full min-h-screen flex items-center justify-center px-4 py-8 bg-[#fff8f5]">
          <div className="w-full max-w-md lg:max-w-lg">
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex flex-col items-center justify-center mb-8"
            >
              <div className="w-24 h-24 bg-[#8d4b00] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#8d4b00]/20">
                <FiCheckCircle className="text-white text-5xl" />
              </div>
              <h1 className="text-2xl font-bold text-[#231a13] mb-2">Order Confirmed!</h1>
              <p className="text-[#554336] text-center text-sm">
                Thank you for your purchase. Your order has been received and is being processed.
              </p>
            </motion.div>

            {/* Order Details */}
            <div className="bg-[#fff8f5] border border-[#e9d7cb] shadow-sm rounded-2xl p-6 mb-4">
              <div className="text-center mb-6">
                <p className="text-sm text-[#554336] mb-1">Order Number</p>
                <p className="text-xl font-bold text-[#231a13]">{displayOrderId}</p>
                {order.trackingNumber && (
                  <>
                    <p className="text-sm text-[#554336] mt-3 mb-1">Tracking Number</p>
                    <p className="text-lg font-bold text-[#8d4b00]">{order.trackingNumber}</p>
                  </>
                )}
              </div>

              <div className="border-t border-[#e9d7cb] pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#554336]">Order Date</span>
                  <span className="font-semibold text-[#231a13]">{formatDate(order.date || order.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#554336]">Total Amount</span>
                  <span className="font-bold text-[#8d4b00] text-lg">{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#554336]">Payment Method</span>
                  <span className="font-semibold text-[#231a13] capitalize">{order.paymentMethod || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="bg-[#fff8f5] border border-[#e9d7cb] shadow-sm rounded-2xl p-6 mb-4">
              <h2 className="text-base font-bold text-[#231a13] mb-4">Order Items</h2>
              <div className="space-y-3">
                {orderItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#e9d7cb]/30 flex-shrink-0">
                      <LazyImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#231a13] text-sm mb-1">{item.name}</h3>
                      <p className="text-xs text-[#554336]">
                        {formatPrice(item.price)} x {item.quantity}
                      </p>
                      {formatVariantLabel(item?.variant) && (
                        <p className="text-[11px] text-[#554336]/80">
                          {formatVariantLabel(item?.variant)}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-[#231a13] text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
                {orderItems.length > 3 && (
                  <p className="text-sm text-[#554336] text-center pt-2">
                    +{orderItems.length - 3} more item{orderItems.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
                {orderItems.length === 0 && (
                  <p className="text-sm text-[#554336] text-center pt-2">No item details available for this order.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to={`/orders/${displayOrderId}`}
                className="block w-full py-3 bg-[#8d4b00] text-white rounded-xl font-semibold text-center hover:shadow-lg shadow-[#8d4b00]/20 transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <FiEye className="text-lg" />
                  View Order Details
                </div>
              </Link>
              <Link
                to={`/track-order/${displayOrderId}`}
                className="block w-full py-3 bg-[#e9d7cb]/30 text-[#231a13] rounded-xl font-semibold text-center hover:bg-[#e9d7cb] transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <FiTruck className="text-lg" />
                  Track Order
                </div>
              </Link>
              <button
                onClick={() => navigate('/home')}
                className="w-full py-3 bg-transparent border-2 border-[#e9d7cb] text-[#231a13] rounded-xl font-semibold hover:bg-[#fff8f5] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default MobileOrderConfirmation;


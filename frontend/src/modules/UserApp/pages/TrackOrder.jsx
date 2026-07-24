import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiPackage, FiTruck, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import MobileLayout from "../components/Layout/MobileLayout";
import { useOrderStore } from '../../../shared/store/orderStore';
import { formatPrice } from '../../../shared/utils/helpers';
import { formatVariantLabel } from '../../../shared/utils/variant';
import PageTransition from '../../../shared/components/PageTransition';
import Badge from '../../../shared/components/Badge';
import LazyImage from '../../../shared/components/LazyImage';
import { useAuthStore } from '../../../shared/store/authStore';

const MobileTrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { fetchOrderById, fetchPublicTrackingOrder, lastError } = useOrderStore();
  const { user } = useAuthStore();
  const order = useOrderStore((state) =>
    state.orders.find((o) => String(o.id) === String(orderId))
  );
  const [isResolving, setIsResolving] = useState(!order);
  const shippingAddress = order?.shippingAddress || {};
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const normalizedStatus = String(order?.status || 'pending').toLowerCase();
  const displayOrderId = order?.id || order?.orderId || orderId;
  const hasShippingAddress = Boolean(
    shippingAddress?.name ||
    shippingAddress?.address ||
    shippingAddress?.city ||
    shippingAddress?.state ||
    shippingAddress?.zipCode
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (orderId) {
        const privateOrder = await fetchOrderById(orderId, true);
        if (!privateOrder) {
          await fetchPublicTrackingOrder(orderId, true);
        }
      }
      if (mounted) setIsResolving(false);
    })();
    return () => {
      mounted = false;
    };
  }, [orderId, fetchOrderById, fetchPublicTrackingOrder]);

  useEffect(() => {
    if (!isResolving && !order) {
      navigate(user?.id ? '/orders' : '/home');
    }
  }, [isResolving, order, navigate, user?.id]);

  if (isResolving) {
    return (
      <PageTransition>
        <MobileLayout showBottomNav={false} showCartBar={false}>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <p className="text-gray-600">Loading order...</p>
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Not Found</h2>
              {lastError ? (
                <p className="text-sm text-gray-500 mb-4">{lastError}</p>
              ) : null}
              <button
                onClick={() => navigate(user?.id ? '/orders' : '/home')}
                className="gradient-green text-white px-6 py-3 rounded-xl font-semibold"
              >
                {user?.id ? 'Back to Orders' : 'Go Home'}
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getTrackingSteps = () => {
    const isCancelled = normalizedStatus === 'cancelled';
    const isReturned = normalizedStatus === 'returned';
    const isProcessingOrLater = ['processing', 'shipped', 'delivered', 'returned'].includes(normalizedStatus);
    const isShippedOrLater = ['shipped', 'delivered', 'returned'].includes(normalizedStatus);
    const isDelivered = normalizedStatus === 'delivered';

    const steps = [
      {
        label: 'Order Placed',
        completed: true,
        date: order?.date || order?.createdAt,
        icon: FiCheckCircle,
      },
      {
        label: 'Processing',
        completed: !isCancelled && isProcessingOrLater,
        date: order?.processingAt || null,
        icon: FiPackage,
      },
      {
        label: 'Shipped',
        completed: !isCancelled && isShippedOrLater,
        date: order?.shippedAt || null,
        icon: FiTruck,
      },
      {
        label: 'Delivered',
        completed: isDelivered,
        date: isDelivered ? (order?.deliveredAt || order?.estimatedDelivery) : null,
        icon: FiCheckCircle,
      },
    ];

    if (isCancelled || isReturned) {
      steps.push({
        label: isCancelled ? 'Cancelled' : 'Returned',
        completed: true,
        date: order?.cancelledAt || order?.returnedAt || order?.updatedAt || order?.date || order?.createdAt,
        icon: FiClock,
      });
    }
    return steps;
  };

  const steps = getTrackingSteps();

  return (
    <PageTransition>
      <MobileLayout showBottomNav={false} showCartBar={false}>
          <div className="w-full pb-6 bg-white">
            {/* Header */}
            <div className="px-4 py-4 bg-white border-b border-black/10 sticky top-0 z-30" style={{ boxShadow: '0 1px 8px rgba(44,26,14,0.06)' }}>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                >
                  <FiArrowLeft className="text-xl text-black" />
                </button>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Track Order</h1>
                  <p className="text-sm text-black">Order #{displayOrderId}</p>
                </div>
                <Badge variant={normalizedStatus}>{normalizedStatus.toUpperCase()}</Badge>
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Tracking Timeline */}
              <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-sm">
                <h2 className="text-base font-bold text-black mb-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Order Status</h2>
                <div className="space-y-4">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${step.completed
                          ? 'bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white'
                          : 'bg-[#e9d7cb]/40 text-black/60 border border-black/10'
                          }`}>
                          <Icon className="text-lg" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-sm mb-1 ${step.completed ? 'text-black' : 'text-black/60'
                            }`}>
                            {step.label}
                          </h3>
                          <p className="text-xs text-black/70">{formatDate(step.date)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Number */}
              {order.trackingNumber && (
                <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-sm">
                  <h2 className="text-base font-bold text-black mb-2" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Tracking Number</h2>
                  <p className="text-lg font-bold text-black">{order.trackingNumber}</p>
                </div>
              )}

              {/* Shipping Address */}
              {hasShippingAddress ? (
                <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-sm">
                  <h2 className="text-base font-bold text-black mb-3 flex items-center gap-2" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                    <FiMapPin className="text-black" />
                    Shipping Address
                  </h2>
                  <div className="text-sm text-black space-y-1">
                    <p className="font-semibold text-black">{shippingAddress.name || 'N/A'}</p>
                    <p>{shippingAddress.address || 'N/A'}</p>
                    <p>
                      {shippingAddress.city || 'N/A'}, {shippingAddress.state || 'N/A'}{' '}
                      {shippingAddress.zipCode || 'N/A'}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Order Items */}
              <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-sm">
                <h2 className="text-base font-bold text-black mb-3" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Order Items</h2>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-black/10 flex-shrink-0">
                        <LazyImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-black text-sm mb-1">{item.name}</h3>
                        <p className="text-xs text-black/80">
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
                        {formatVariantLabel(item?.variant) && (
                          <p className="text-[11px] text-black/60">
                            {formatVariantLabel(item?.variant)}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-black text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                  {orderItems.length === 0 && (
                    <p className="text-sm text-black/80">Item details are not available for this tracking view.</p>
                  )}
                </div>
              </div>

              {/* Estimated Delivery */}
              {order.estimatedDelivery && (
                <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-sm">
                  <h2 className="text-base font-bold text-black mb-2" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Estimated Delivery</h2>
                  <p className="text-lg font-semibold text-black">
                    {formatDate(order.estimatedDelivery)}
                  </p>
                </div>
              )}

              {/* Actions */}
              {user?.id ? (
                <button
                  onClick={() => navigate(`/orders/${displayOrderId}`)}
                  className="w-full py-3.5 bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white rounded-xl font-bold text-base hover:bg-[#F5A623] hover:text-black transition-colors shadow-md"
                >
                  View Order Details
                </button>
              ) : (
                <button
                  onClick={() => navigate('/home')}
                  className="w-full py-3.5 bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white rounded-xl font-bold text-base hover:bg-[#F5A623] hover:text-black transition-colors shadow-md"
                >
                  Continue Shopping
                </button>
              )}
            </div>
          </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default MobileTrackOrder;


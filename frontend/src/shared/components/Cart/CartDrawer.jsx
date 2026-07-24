import { useEffect, useState, useRef, useMemo } from "react";
import {
  FiX,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiShoppingBag,
  FiHeart,
  FiAlertCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, useUIStore } from "../../store/useStore";
import { useAuthStore } from "../../store/authStore";
import { formatPrice } from "../../utils/helpers";
import { Link, useNavigate } from "react-router-dom";
import SwipeableCartItem from "./SwipeableCartItem";
import toast from "react-hot-toast";
import api from "../../utils/api";

const CartDrawer = () => {
  const navigate = useNavigate();
  const { isCartOpen, toggleCart } = useUIStore();
  const {
    items,
    getTotal,
    clearCart,
    getItemsByVendor,
  } = useCartStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const total = getTotal();
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const hasOutOfStockItems = false;

  const handleProceedToCheckout = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to proceed to checkout");
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    // Close cart and navigate to checkout
    toggleCart();
    navigate('/checkout');
  };

  // Group items by vendor
  const itemsByVendor = useMemo(
    () => getItemsByVendor(),
    [items, getItemsByVendor]
  );

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (!isAuthenticated && items.length > 0) {
      clearCart();
    }
  }, [isAuthenticated, items.length, clearCart]);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "";
    }
    return () => {
      document.body.style.overflowY = "";
    };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/50 z-[10000]"
          />

          {/* Cart Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => {
              if (info.offset.x > 200) {
                toggleCart();
              }
            }}
            style={{ willChange: "transform", transform: "translateZ(0)" }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[10000] flex flex-col border-l border-black/10">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-black/10 bg-gradient-to-b from-[#fdeade]/30 to-transparent">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-extrabold text-black">Your Shopping Bag</h2>
                <button
                  onClick={toggleCart}
                  className="p-1.5 hover:bg-[#F5A623] hover:text-black rounded-full transition-colors">
                  <FiX className="text-xl text-black" />
                </button>
              </div>
              <p className="text-xs text-black font-medium leading-relaxed max-w-[90%]">
                Review items from global artisans and proceed to secure checkout.
              </p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-white">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                    <FiShoppingBag className="text-4xl text-black" />
                  </div>
                  <p className="text-black font-bold text-lg mb-2">
                    Your bag is empty
                  </p>
                  <p className="text-sm text-black">
                    Discover unique handcrafted items to fill it!
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-8">
                    {itemsByVendor.map((vendorGroup, vendorIndex) => (
                      <div key={vendorGroup.vendorId} className="space-y-4">
                        {/* Vendor Header */}
                        <div className="flex items-center gap-2 pb-2 border-b border-black/10">
                          <FiShoppingBag className="text-black text-sm" />
                          <span className="text-xs font-bold text-black uppercase tracking-wider flex-1">
                            {vendorGroup.vendorName}
                          </span>
                          <span className="text-xs font-bold text-black">
                            {formatPrice(vendorGroup.subtotal)}
                          </span>
                        </div>
                        {/* Vendor Items */}
                        <div className="space-y-4">
                          {vendorGroup.items.map((item, index) => (
                            <SwipeableCartItem
                              key={item.cartLineKey || `${item.id}-${index}`}
                              item={item}
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/10 p-4 sm:p-6 bg-white/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-bold text-black">
                    Total
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-black">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={isValidatingStock || hasOutOfStockItems}
                    className={`w-full bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white py-3 rounded-xl font-bold text-base text-center transition-all ${(isValidatingStock || hasOutOfStockItems) ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F5A623] hover:shadow-lg hover:shadow-black/10"}`}>
                    {hasOutOfStockItems ? "Out of Stock Items in Cart" : isValidatingStock ? "Validating Stock..." : "Checkout ->"}
                  </button>
                  <button
                    onClick={clearCart}
                    disabled={isValidatingStock}
                    className="w-full py-2 text-sm text-black hover:text-red-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

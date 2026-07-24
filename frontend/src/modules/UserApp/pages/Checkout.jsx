import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiCheck,
  FiX,
  FiPlus,
  FiArrowLeft,
  FiShoppingBag,
  FiTag,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { FiLock } from "react-icons/fi";
import { useCartStore } from "../../../shared/store/useStore";
import { useAuthStore } from "../../../shared/store/authStore";
import { useAddressStore } from "../../../shared/store/addressStore";
import { useOrderStore } from "../../../shared/store/orderStore";
import { formatPrice } from "../../../shared/utils/helpers";
import api from "../../../shared/utils/api";
import toast from "react-hot-toast";
import MobileLayout from "../components/Layout/MobileLayout";
import MobileCheckoutSteps from "../components/Mobile/MobileCheckoutSteps";
import PageTransition from "../../../shared/components/PageTransition";
import OrderSummary from "../components/Mobile/CheckoutOrderSummary";


const MobileCheckout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, getItemsByVendor } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addresses, getDefaultAddress, addAddress, fetchAddresses } = useAddressStore();
  const { createOrder } = useOrderStore();

  // Group items by vendor
  const itemsByVendor = useMemo(
    () => getItemsByVendor(),
    [items, getItemsByVendor]
  );

  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [shippingOption, setShippingOption] = useState("standard");
  const [estimatedShipping, setEstimatedShipping] = useState(null);
  const [isEstimatingShipping, setIsEstimatingShipping] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    state: "",
    country: "",
    paymentMethod: "card",
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses().catch(() => null);
    }
  }, [isAuthenticated, fetchAddresses]);

  useEffect(() => {
    let cancelled = false;
    const fetchCoupons = async () => {
      try {
        const response = await api.get("/coupons/available");
        const payload = response?.data ?? response;
        if (!cancelled) {
          setAvailableCoupons(Array.isArray(payload) ? payload : []);
        }
      } catch {
        if (!cancelled) {
          setAvailableCoupons([]);
        }
      }
    };

    fetchCoupons();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));

      const defaultAddress = getDefaultAddress();
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setFormData((prev) => ({
          ...prev,
          name: defaultAddress.fullName || user.name || "",
          email: user.email || "",
          phone: defaultAddress.phone || user.phone || "",
          address: defaultAddress.address || "",
          city: defaultAddress.city || "",
          zipCode: defaultAddress.zipCode || "",
          state: defaultAddress.state || "",
          country: defaultAddress.country || "",
        }));
      }
    }
  }, [isAuthenticated, user, getDefaultAddress, addresses]);

  const calculateShippingFallback = () => {
    const total = getTotal();
    if (appliedCoupon?.type === "freeship") {
      return 0;
    }
    if (total >= 100) {
      return 0;
    }
    if (shippingOption === "express") {
      return 100;
    }
    return 50;
  };

  const total = getTotal();
  const shipping =
    typeof estimatedShipping === "number"
      ? estimatedShipping
      : calculateShippingFallback();
  const discount = appliedCoupon ? appliedDiscount : 0;
  const taxableAmount = Math.max(0, total - discount);
  const tax = taxableAmount * 0.18;
  const finalTotal = Math.max(0, total + shipping + tax - discount);

  const [prevTotal, setPrevTotal] = useState(total);
  useEffect(() => {
    if (total !== prevTotal) {
      setAppliedCoupon(null);
      setAppliedDiscount(0);
      setPrevTotal(total);
    }
  }, [total, prevTotal]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const validItems = items
        .map((item) => ({
          productId: item?.id,
          quantity: Number(item?.quantity || 1),
          variant: item?.variant || undefined,
        }))
        .filter((item) => item.productId);

      if (!validItems.length) {
        if (active) setEstimatedShipping(0);
        return;
      }

      setIsEstimatingShipping(true);
      try {
        const response = await api.post("/shipping/estimate", {
          items: validItems,
          shippingAddress: {
            country: String(formData.country || "").trim(),
          },
          shippingOption,
          couponType: appliedCoupon?.type || null,
        });

        const payload = response?.data ?? response;
        const nextShipping = Number(payload?.shipping);
        if (active) {
          setEstimatedShipping(Number.isFinite(nextShipping) ? nextShipping : null);
        }
      } catch {
        if (active) {
          setEstimatedShipping(null);
        }
      } finally {
        if (active) {
          setIsEstimatingShipping(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [items, formData.country, shippingOption, appliedCoupon?.type]);

  const handleApplyCoupon = async (codeOverride = "") => {
    const normalizedCode = String(codeOverride || couponCode).trim().toUpperCase();
    if (!normalizedCode) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const response = await api.post("/coupons/validate", {
        code: normalizedCode,
        cartTotal: total,
      });
      const payload = response?.data ?? response;
      const coupon = payload?.coupon;
      const discountAmount = Number(payload?.discount || 0);

      if (!coupon) {
        throw new Error("Invalid coupon response");
      }

      setCouponCode(coupon.code || normalizedCode);
      setAppliedCoupon(coupon);
      setAppliedDiscount(discountAmount);
      toast.success(`Coupon "${coupon.code}" applied!`);
    } catch {
      setAppliedCoupon(null);
      setAppliedDiscount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id);
    setFormData({
      ...formData,
      name: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      zipCode: address.zipCode,
      state: address.state,
      country: address.country,
    });
  };

  const handleNewAddress = async (addressData) => {
    try {
      const newAddress = await addAddress(addressData);
      handleSelectAddress(newAddress);
      setShowAddressForm(false);
      toast.success("Address added and selected!");
    } catch (error) {
      toast.error(error?.message || "Failed to add address");
    }
  };

  if (items.length === 0) {
    return (
      <PageTransition>
        <MobileLayout showBottomNav={false} showCartBar={false}>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-black mb-4">
                Your cart is empty
              </h2>
              <button
                onClick={() => navigate("/home")}
                className="bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white px-6 py-3 rounded-xl font-semibold">
                Continue Shopping
              </button>
            </div>
          </div>
        </MobileLayout>
      </PageTransition>
    );
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedShipping = {
      name: String(formData.name || "").trim(),
      email: String(formData.email || "").trim().toLowerCase(),
      phone: String(formData.phone || "").replace(/\D/g, "").slice(-10),
      address: String(formData.address || "").trim(),
      city: String(formData.city || "").trim(),
      zipCode: String(formData.zipCode || "").trim(),
      state: String(formData.state || "").trim(),
      country: String(formData.country || "").trim(),
    };

    const missingRequired = Object.values(normalizedShipping).some((v) => !v);
    if (missingRequired) {
      toast.error("Please fill all shipping details correctly.");
      return;
    }

    if (normalizedShipping.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    if (step === 2 && isApplyingCoupon) {
      toast.error("Please wait for coupon validation to complete.");
      return;
    }
    if (step === 2 && isPlacingOrder) {
      return;
    }

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setIsPlacingOrder(true);
      try {
        const order = await createOrder({
          userId: isAuthenticated ? user?.id : null,
          items: items,
          shippingAddress: normalizedShipping,
          paymentMethod: formData.paymentMethod,
          subtotal: total,
          shipping: shipping,
          tax: tax,
          discount: discount,
          total: finalTotal,
          couponCode: appliedCoupon ? (appliedCoupon.code || couponCode.trim().toUpperCase()) : null,
          shippingOption,
        });

        clearCart();
        toast.success("Order placed successfully!");
        navigate(`/order-confirmation/${order.id}`);
      } catch (error) {
        toast.error(error?.message || "Failed to place order");
      } finally {
        setIsPlacingOrder(false);
      }
    }
  };

  return (
    <PageTransition>
      <MobileLayout showBottomNav={false} showCartBar={false}>
        <div className="w-full pb-32 min-h-screen bg-white">
          {/* Header */}
          <div className="bg-white border-b border-black/10 sticky top-0 z-30" style={{ boxShadow: '0 1px 8px rgba(44,26,14,0.06)' }}>
            {/* Title Bar */}
            <div className="px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white rounded-full transition-colors">
                <FiArrowLeft className="text-xl text-black" />
              </button>
              <h1 className="text-xl font-bold text-black" style={{ fontFamily: "\"Times New Roman\", Times, serif" }}>Checkout</h1>
            </div>
            {/* Steps Bar */}
            <div className="px-4 pb-3">
              <MobileCheckoutSteps currentStep={step} totalSteps={2} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="lg:px-4 lg:py-6">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Left Column - Steps */}
              <div className="lg:col-span-8 space-y-6">
                {/* Step 1: Shipping Information */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-4 lg:p-0">
                    <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2" style={{ fontFamily: "\"Times New Roman\", Times, serif" }}>
                      <FiTruck className="text-black" />
                      Shipping Information
                    </h2>

                    {/* Saved Addresses */}
                    {isAuthenticated && addresses.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-black mb-3">
                          Saved Addresses
                        </h3>
                        <div className="space-y-2 mb-3">
                          {addresses.map((address) => (
                            <div
                              key={address.id}
                              onClick={() => handleSelectAddress(address)}
                              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === address.id
                                ? "border-[#F5A623] bg-white"
                                : "border-black/10 bg-white hover:border-[#F5A623]/50"
                                }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <FiMapPin className="text-black mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h4 className="font-bold text-black text-sm">
                                      {address.name}
                                    </h4>
                                    <p className="text-xs text-black">
                                      {address.fullName}
                                    </p>
                                    <p className="text-xs text-black">
                                      {address.address}
                                    </p>
                                    <p className="text-xs text-black">
                                      {address.city}, {address.state}{" "}
                                      {address.zipCode}
                                    </p>
                                  </div>
                                </div>
                                {selectedAddressId === address.id && (
                                  <FiCheck className="text-black text-xl flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(true)}
                          className="flex items-center gap-2 text-black hover:text-[#7a4000] font-semibold text-sm">
                          <FiPlus />
                          Add New Address
                        </button>
                      </div>
                    )}

                    {/* Address Form */}
                    <div className="space-y-4 bg-white p-4 rounded-2xl border border-black/10 shadow-sm lg:p-6">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] text-base text-black bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] text-base text-black bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] text-base text-black bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Address
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] text-base text-black bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] text-base text-black bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] text-base text-black bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] text-base text-black bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] text-base text-black bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-4 lg:p-0">
                    <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2" style={{ fontFamily: "\"Times New Roman\", Times, serif" }}>
                      <FiCreditCard className="text-black" />
                      Payment Method
                    </h2>
                    <div className="space-y-3 mb-6">
                      {["card", "cash", "bank"].map((method) => (
                        <label
                          key={method}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.paymentMethod === method
                              ? "border-[#F5A623] bg-white"
                              : "border-black/10 bg-white hover:border-[#F5A623]/40"
                          }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={formData.paymentMethod === method}
                            onChange={handleInputChange}
                            className="w-5 h-5 accent-brand-saffron"
                          />
                          <span className="font-semibold text-black capitalize text-base">
                            {method === "card"
                              ? "Credit/Debit Card"
                              : method === "cash"
                                ? "Cash on Delivery"
                                : "Bank Transfer"}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Shipping Options */}
                    {total < 100 && (
                      <div className="mb-6">
                        <h3 className="text-base font-semibold text-black mb-3">
                          Shipping Options
                        </h3>
                        <div className="space-y-3">
                          <label
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              shippingOption === "standard"
                                ? "border-[#F5A623] bg-white"
                                : "border-black/10 bg-white hover:border-[#F5A623]/40"
                            }`}>
                            <div>
                              <input
                                type="radio"
                                name="shippingOption"
                                value="standard"
                                checked={shippingOption === "standard"}
                                onChange={(e) => setShippingOption(e.target.value)}
                                className="w-5 h-5 accent-brand-saffron mr-3"
                              />
                              <span className="font-semibold text-black text-base">
                                Standard Shipping
                              </span>
                              <p className="text-xs text-black">
                                5-7 business days
                              </p>
                            </div>
                            <span className="font-bold text-black">
                              {formatPrice(50)}
                            </span>
                          </label>
                          <label
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              shippingOption === "express"
                                ? "border-[#F5A623] bg-white"
                                : "border-black/10 bg-white hover:border-[#F5A623]/40"
                            }`}>
                            <div>
                              <input
                                type="radio"
                                name="shippingOption"
                                value="express"
                                checked={shippingOption === "express"}
                                onChange={(e) => setShippingOption(e.target.value)}
                                className="w-5 h-5 accent-brand-saffron mr-3"
                              />
                              <span className="font-semibold text-black text-base">
                                Express Shipping
                              </span>
                              <p className="text-xs text-black">
                                2-3 business days
                              </p>
                            </div>
                            <span className="font-bold text-black">
                              {formatPrice(100)}
                            </span>
                          </label>
                        </div>
                        <p className="text-xs text-black/80 mt-2">
                          {isEstimatingShipping
                            ? "Updating shipping estimate..."
                            : `Estimated shipping: ${formatPrice(shipping)}`}
                        </p>
                      </div>
                    )}

                    {/* Coupon Code */}
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-black mb-3">
                        Coupon Code
                      </h3>
                      {!appliedCoupon ? (
                        <>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              placeholder="Enter code"
                              className="flex-1 px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                            />
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon()}
                              disabled={isApplyingCoupon}
                              className="px-4 py-3 bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white rounded-xl font-semibold hover:shadow-glow-green transition-all">
                              {isApplyingCoupon ? "Applying..." : "Apply"}
                            </button>
                          </div>
                          {availableCoupons.length > 0 && (
                            <div className="mt-3 bg-white rounded-xl p-3 border border-black/10">
                              <h4 className="text-sm font-semibold text-black mb-2 flex items-center gap-2">
                                <FiTag className="text-primary-600" />
                                Available coupons
                              </h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {availableCoupons.slice(0, 8).map((coupon) => (
                                  <button
                                    key={coupon._id || coupon.code}
                                    type="button"
                                    onClick={() => handleApplyCoupon(coupon.code)}
                                    disabled={isApplyingCoupon}
                                    className="w-full text-left p-2 bg-white rounded-lg border border-black/10 hover:border-primary-300 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold text-black">{coupon.code}</p>
                                      <p className="text-xs font-semibold text-primary-700">
                                        {coupon.type === "percentage"
                                          ? `${coupon.value}% OFF`
                                          : coupon.type === "fixed"
                                            ? `${formatPrice(coupon.value)} OFF`
                                            : "Free Shipping"}
                                      </p>
                                    </div>
                                    <p className="text-xs text-black">
                                      Min order: {formatPrice(coupon.minOrderValue || 0)}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-green-800">
                              {appliedCoupon.code || "Coupon"} Applied
                            </p>
                            <p className="text-xs text-green-600">
                              Code: {couponCode}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedCoupon(null);
                              setAppliedDiscount(0);
                              setCouponCode("");
                            }}
                            className="text-red-600 hover:text-red-700">
                            <FiX className="text-lg" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Order Summary (Mobile Only) */}
                    <div className="glass-card rounded-xl p-4 lg:hidden">
                      <OrderSummary
                        itemsByVendor={itemsByVendor}
                        total={total}
                        discount={discount}
                        shipping={shipping}
                        tax={tax}
                        finalTotal={finalTotal}
                        formatPrice={formatPrice}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column - Desktop Order Summary */}
              <div className="hidden lg:block lg:col-span-4">
                <div className="sticky top-24 space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <OrderSummary
                      itemsByVendor={itemsByVendor}
                      total={total}
                      discount={discount}
                      shipping={shipping}
                      tax={tax}
                      finalTotal={finalTotal}
                      formatPrice={formatPrice}
                    />
                    <div className="p-4 border-t border-gray-100 bg-white">
                      <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={step === 2 && isPlacingOrder}
                        className="w-full gradient-saffron text-white py-3.5 rounded-xl font-bold text-lg hover:shadow-glow-saffron transition-all duration-300 transform hover:-translate-y-0.5">
                        {step === 2 ? (isPlacingOrder ? "Placing Order..." : "Place Order") : "Continue to Payment"}
                      </button>
                      {step === 2 && (
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="w-full mt-3 py-2 text-black/80 font-semibold hover:text-gray-700 transition-colors text-sm">
                          Back to Shipping
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trust Badges or Info */}
                  <div className="flex justify-center gap-4 text-black/60 text-2xl pt-2 opacity-70">
                    <FiLock className="w-6 h-6" />
                    <span className="text-xs text-black/80">Secure Checkout</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons (Mobile Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 z-40 safe-area-bottom lg:hidden" style={{ boxShadow: '0 -2px 16px rgba(44,26,14,0.07)' }}>
              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-brand-border transition-colors border border-black/10">
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={step === 2 && isPlacingOrder}
                  className="flex-1 gradient-saffron text-white py-3 rounded-xl font-semibold hover:shadow-glow-saffron transition-all duration-300">
                  {step === 2 ? (isPlacingOrder ? "Placing..." : "Place Order") : "Continue to Payment"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Address Form Modal */}
        <AnimatePresence>
          {showAddressForm && (
            <AddressFormModal
              onSubmit={handleNewAddress}
              onCancel={() => setShowAddressForm(false)}
            />
          )}
        </AnimatePresence>
      </MobileLayout>
    </PageTransition>
  );
};

// Address Form Modal Component
const AddressFormModal = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onCancel}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black">Add New Address</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/50 rounded-full">
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address Label
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
              placeholder="Home, Work, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 gradient-saffron text-white py-3 rounded-xl font-semibold hover:shadow-glow-saffron transition-all">
              Add Address
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-white/50 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default MobileCheckout;

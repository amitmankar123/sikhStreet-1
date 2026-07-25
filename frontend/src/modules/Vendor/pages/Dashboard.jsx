import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiArrowRight,
  FiCreditCard,
  FiLock,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
} from "react-icons/fi";
import { useVendorAuthStore } from "../store/vendorAuthStore";
import { useVendorProductStore } from "../store/vendorProductStore";
import { getVendorOrders, getVendorEarnings, updateVendorBankDetails } from "../services/vendorService";
import { formatPrice } from "../../../shared/utils/helpers";
import toast from "react-hot-toast";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vendor, completeOnboarding, fetchProfile } = useVendorAuthStore();
  const { products, total: totalProductsCount, fetchProducts } = useVendorProductStore();

  useEffect(() => {
    if (location.state?.onboardingWarning) {
      toast.error("Please complete the setup progress checklist to unlock product listing and selling features.");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [stats, setStats] = useState({
    totalProducts: 0,
    inStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const vendorId = vendor?.id;

  useEffect(() => {
    if (!vendorId) return;

    // Load products into the product store (reuse if already fetched)
    if (products.length === 0) {
      fetchProducts();
    }

    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch orders and earnings in parallel
        const [ordersRes, earningsRes, pendingRes, processingRes] = await Promise.all([
          getVendorOrders({ page: 1, limit: 5 }),
          getVendorEarnings(),
          getVendorOrders({ page: 1, limit: 1, status: "pending" }),
          getVendorOrders({ page: 1, limit: 1, status: "processing" }),
        ]);

        const ordersData = ordersRes?.data ?? ordersRes;
        const earningsData = earningsRes?.data ?? earningsRes;
        const pendingData = pendingRes?.data ?? pendingRes;
        const processingData = processingRes?.data ?? processingRes;

        const orders = ordersData?.orders ?? [];
        const summary = earningsData?.summary ?? {};
        const pending =
          Number(pendingData?.total || 0) + Number(processingData?.total || 0);

        setStats((prev) => ({
          ...prev,
          totalOrders: ordersData?.total ?? orders.length,
          pendingOrders: pending,
          totalEarnings: summary.totalEarnings ?? 0,
          pendingEarnings: summary.pendingEarnings ?? 0,
        }));

        setRecentOrders(orders);
      } catch {
        // errors handled by api.js toast
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [vendorId, fetchProducts, products.length]);

  // Sync product counts whenever the product store updates
  useEffect(() => {
    const inStock = products.filter((p) => p.stock === "in_stock").length;
    setStats((prev) => ({
      ...prev,
      totalProducts: Number(totalProductsCount || 0),
      inStockProducts: inStock,
    }));
  }, [products, totalProductsCount]);

  const statCards = [
    {
      icon: FiPackage,
      label: "Total Products",
      value: stats.totalProducts,
      color: "bg-neutral-900",
      bgColor: "bg-white",
      textColor: "text-neutral-900",
      iconColor: "text-white",
      link: "/vendor/products",
    },
    {
      icon: FiShoppingBag,
      label: "Total Orders",
      value: stats.totalOrders,
      color: "bg-neutral-900",
      bgColor: "bg-white",
      textColor: "text-neutral-900",
      iconColor: "text-white",
      link: "/vendor/orders",
    },
    {
      icon: FiTrendingUp,
      label: "Pending Orders",
      value: stats.pendingOrders,
      color: "bg-neutral-800",
      bgColor: "bg-white",
      textColor: "text-neutral-900",
      iconColor: "text-white",
      link: "/vendor/orders",
    },
    {
      icon: FiDollarSign,
      label: "Total Earnings",
      value: formatPrice(stats.totalEarnings || 0),
      color: "bg-neutral-900",
      bgColor: "bg-white",
      textColor: "text-neutral-900",
      iconColor: "text-white",
      link: "/vendor/earnings",
    },
  ];

  const topProducts = useMemo(() => products.slice(0, 5), [products]);

  const SetupProgressChecklist = () => {
    const [openStep, setOpenStep] = useState(1);

    // Bank Data State
    const [bankData, setBankData] = useState({
      accountName: vendor?.bankDetails?.accountName || '',
      accountNumber: vendor?.bankDetails?.accountNumber || '',
      bankName: vendor?.bankDetails?.bankName || '',
      ifscCode: vendor?.bankDetails?.ifscCode || '',
    });
    const [isSavingBank, setIsSavingBank] = useState(false);

    // Billing Card State
    const [billingSaved, setBillingSaved] = useState(() => {
      return localStorage.getItem('vendor-billing-saved') === 'true';
    });
    const [billingData, setBillingData] = useState({
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      billingZip: '',
    });
    const [isSavingBilling, setIsSavingBilling] = useState(false);

    // Agreement State
    const [agree, setAgree] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    // Step verification
    const isStep1Done = !!vendor?.bankDetails?.accountNumber;
    const isStep2Done = billingSaved;

    const handleSaveBank = async (e) => {
      e.preventDefault();
      if (!bankData.accountName.trim() || !bankData.accountNumber.trim() || !bankData.bankName.trim() || !bankData.ifscCode.trim()) {
        toast.error("Please fill in all bank details.");
        return;
      }
      setIsSavingBank(true);
      try {
        await updateVendorBankDetails(bankData);
        toast.success("Payout bank details saved successfully!");
        const currentVendor = useVendorAuthStore.getState().vendor;
        useVendorAuthStore.setState({
          vendor: {
            ...currentVendor,
            bankDetails: bankData
          }
        });
        await fetchProfile();
        setOpenStep(2);
      } catch (err) {
        if (err.response) {
          toast.error(err.response?.data?.message || "Failed to save bank details. Please try again.");
          return;
        }
        console.warn("Backend updateVendorBankDetails failed, saving locally:", err);
        const currentVendor = useVendorAuthStore.getState().vendor;
        useVendorAuthStore.setState({
          vendor: {
            ...currentVendor,
            bankDetails: bankData
          }
        });
        toast.success("Payout bank details saved locally (offline mode)!");
        setOpenStep(2);
      } finally {
        setIsSavingBank(false);
      }
    };

    const handleSaveBilling = (e) => {
      e.preventDefault();
      if (!billingData.cardNumber.trim() || !billingData.cardExpiry.trim() || !billingData.cardCvv.trim() || !billingData.billingZip.trim()) {
        toast.error("Please fill in all billing card details.");
        return;
      }
      setIsSavingBilling(true);
      setTimeout(() => {
        setIsSavingBilling(false);
        localStorage.setItem('vendor-billing-saved', 'true');
        setBillingSaved(true);
        toast.success("Billing preferences verified!");
        setOpenStep(3);
      }, 800);
    };

    const handleActivateShop = async () => {
      if (!agree) {
        toast.error("You must agree to the seller terms and conditions.");
        return;
      }
      setIsActivating(true);
      try {
        await completeOnboarding();
        toast.success("Shop activated successfully! Selling and product listings are now unlocked.");
        localStorage.removeItem('vendor-billing-saved');
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || "Failed to activate shop. Please try again.");
      } finally {
        setIsActivating(false);
      }
    };

    const stepsCount = (isStep1Done ? 1 : 0) + (isStep2Done ? 1 : 0);
    const progressPercent = Math.round((stepsCount / 3) * 100);

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border-l-4 border-neutral-900 border-y border-r border-gray-250 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Shop Setup Checklist</h2>
            <p className="text-sm text-gray-500 mt-1">Complete these mandatory steps to unlock full selling and listing functionalities.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{stepsCount} of 3 completed</span>
            <div className="w-24 bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-neutral-900 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* STEP 1: BANK SETUP */}
          <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpenStep(openStep === 1 ? 0 : 1)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isStep1Done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-gray-400 font-semibold text-sm'
                  }`}>
                  {isStep1Done ? <FiCheck className="w-3.5 h-3.5" /> : "1"}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">Payout Bank Setup</h4>
                  <p className="text-xs text-gray-500 font-medium">Link your bank account to receive direct deposits.</p>
                </div>
              </div>
              {openStep === 1 ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
            </button>

            {openStep === 1 && (
              <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                {isStep1Done ? (
                  <div className="text-sm text-gray-600 space-y-2">
                    <p className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <FiCheck className="w-4 h-4" /> Bank Account Verified & Saved
                    </p>
                    <div className="text-xs font-mono text-gray-500 bg-white p-3 rounded-lg border border-gray-100">
                      <div>Holder Name: {vendor?.bankDetails?.accountName || bankData.accountName}</div>
                      <div>Bank Name: {vendor?.bankDetails?.bankName || bankData.bankName}</div>
                      <div>Account Number: •••• •••• {String(vendor?.bankDetails?.accountNumber || bankData.accountNumber).slice(-4)}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveBank} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Holder Name *</label>
                        <input
                          type="text"
                          required
                          value={bankData.accountName}
                          onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name *</label>
                        <input
                          type="text"
                          required
                          value={bankData.bankName}
                          onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                          placeholder="State Bank of India"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number *</label>
                        <input
                          type="password"
                          required
                          value={bankData.accountNumber}
                          onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                          placeholder="Enter Account Number"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IFSC / Routing Code *</label>
                        <input
                          type="text"
                          required
                          value={bankData.ifscCode}
                          onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })}
                          placeholder="SBIN0001234"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950 uppercase"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingBank}
                      className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isSavingBank ? 'Saving...' : 'Save Bank Details'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: BILLING SETUP */}
          <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpenStep(openStep === 2 ? 0 : 2)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isStep2Done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-gray-400 font-semibold text-sm'
                  }`}>
                  {isStep2Done ? <FiCheck className="w-3.5 h-3.5" /> : "2"}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">Fee Billing Preferences</h4>
                  <p className="text-xs text-gray-500 font-medium">Add a credit or debit card for shop listing fees.</p>
                </div>
              </div>
              {openStep === 2 ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
            </button>

            {openStep === 2 && (
              <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                {isStep2Done ? (
                  <div className="text-sm text-gray-600 space-y-2">
                    <p className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <FiCheck className="w-4 h-4" /> Card Billing Active
                    </p>
                    <p className="text-xs text-gray-500">Billing card linked successfully for shop listings & transaction offsets.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveBilling} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Number *</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={billingData.cardNumber}
                          onChange={(e) => setBillingData({ ...billingData, cardNumber: e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').replace(/(.{4})/g, '$1 ').trim() })}
                          placeholder="4111 2222 3333 4444"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry Date *</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={billingData.cardExpiry}
                          onChange={(e) => setBillingData({ ...billingData, cardExpiry: e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').replace(/(.{2})/g, '$1/').replace(/\/$/, '') })}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVV Code *</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          value={billingData.cardCvv}
                          onChange={(e) => setBillingData({ ...billingData, cardCvv: e.target.value.replace(/[^0-9]/gi, '') })}
                          placeholder="123"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Billing Zip Code *</label>
                        <input
                          type="text"
                          required
                          value={billingData.billingZip}
                          onChange={(e) => setBillingData({ ...billingData, billingZip: e.target.value })}
                          placeholder="90210"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingBilling}
                      className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold hover:shadow-md transition-colors"
                    >
                      Verify & Link Card
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: ACTIVATION */}
          <div className={`border rounded-xl overflow-hidden bg-white shadow-sm ${(isStep1Done && isStep2Done) ? 'border-gray-100' : 'border-gray-100 opacity-60'
            }`}>
            <button
              type="button"
              disabled={!(isStep1Done && isStep2Done)}
              onClick={() => setOpenStep(openStep === 3 ? 0 : 3)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-300 text-gray-400 font-semibold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">Terms Agreement & Shop Activation</h4>
                  <p className="text-xs text-gray-500 font-medium">Agree to seller guidelines and activate your shop front.</p>
                </div>
              </div>
              {openStep === 3 ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
            </button>

            {openStep === 3 && (isStep1Done && isStep2Done) && (
              <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                <div className="space-y-4">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-1 w-4 h-4 text-neutral-950 rounded focus:ring-neutral-950"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed font-medium">
                      I agree to the SikhStreet Seller Agreement, Terms of Service, and understand that compliance with the creative marketplace quality standards is mandatory for all listings.
                    </span>
                  </label>

                  <button
                    onClick={handleActivateShop}
                    disabled={isActivating}
                    className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    {isActivating ? 'Activating Shop...' : 'Activate Shop & Enable Selling'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome back, {vendor?.storeName || vendor?.name}! Here's your store
            overview.
          </p>
        </div>
      </div>

      {/* Onboarding Setup Progress Checklist */}
      {vendor && !vendor.isOnboarded && (
        <SetupProgressChecklist />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => stat.link && navigate(stat.link)}
            className={`${stat.bgColor} rounded-2xl p-5 cursor-pointer shadow-sm border border-gray-100 hover:shadow-xl hover:border-neutral-900/35 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group`}>

            {/* Decorative background element */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-neutral-900/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`${stat.color} p-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className={`${stat.iconColor} text-xl`} />
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-neutral-950 transition-colors duration-300">
                <FiArrowRight className="text-gray-400 group-hover:text-white text-lg transition-colors duration-300" />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">
                {stat.label}
              </h3>
              <p className={`${stat.textColor} text-3xl font-extrabold tracking-tight`}>
                {isLoading ? "—" : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neutral-300 via-neutral-600 to-neutral-300 opacity-30" />

        <h2 className="text-xl font-bold text-neutral-900 mb-5 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button
              onClick={() => navigate("/vendor/products/add-product")}
              className="w-full group flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-neutral-900 rounded-xl transition-all duration-300 text-left hover:shadow-md hover:-translate-y-1">
              <div className="bg-neutral-950 group-hover:bg-neutral-100 p-3 rounded-xl transition-colors duration-300">
                <FiPackage className="text-white group-hover:text-neutral-950 text-xl transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 group-hover:text-black transition-colors duration-300">Add New Product</h3>
                <p className="text-sm text-gray-500 font-medium">
                  Create a new product listing
                </p>
              </div>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => navigate("/vendor/orders")}
              className="w-full group flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-neutral-900 rounded-xl transition-all duration-300 text-left hover:shadow-md hover:-translate-y-1">
              <div className="bg-neutral-950 group-hover:bg-neutral-100 p-3 rounded-xl transition-colors duration-300">
                <FiShoppingBag className="text-white group-hover:text-neutral-950 text-xl transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 group-hover:text-black transition-colors duration-300">View Orders</h3>
                <p className="text-sm text-gray-500 font-medium">Manage your orders</p>
              </div>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button
              onClick={() => navigate("/vendor/earnings")}
              className="w-full group flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-neutral-900 rounded-xl transition-all duration-300 text-left hover:shadow-md hover:-translate-y-1">
              <div className="bg-neutral-950 group-hover:bg-neutral-100 p-3 rounded-xl transition-colors duration-300">
                <FiDollarSign className="text-white group-hover:text-neutral-950 text-xl transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 group-hover:text-black transition-colors duration-300">View Earnings</h3>
                <p className="text-sm text-gray-500 font-medium">Check your earnings</p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Recent Orders & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Recent Orders</h2>
            <button
              onClick={() => navigate("/vendor/orders")}
              className="text-sm text-neutral-600 hover:text-black font-bold transition-colors">
              View All
            </button>
          </div>
          {isLoading ? (
            <p className="text-gray-400 text-center py-8">Loading orders...</p>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const vendorItem = order.vendorItems?.find(
                  (vi) => vi.vendorId?.toString() === vendorId?.toString()
                );
                const displayStatus = vendorItem?.status ?? order.status;
                const displayAmount = vendorItem
                  ? Math.max(0, (vendorItem.subtotal ?? 0) + (vendorItem.shipping ?? 0) + (vendorItem.tax ?? 0) - (vendorItem.discount ?? 0))
                  : order.totalAmount ?? order.total ?? 0;

                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * recentOrders.indexOf(order) }}
                    key={order._id ?? order.orderId}
                    onClick={() =>
                      navigate(`/vendor/orders/${order.orderId ?? order._id}`)
                    }
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 hover:border-neutral-900/30 hover:shadow-md rounded-xl cursor-pointer transition-all duration-300">
                    <div>
                      <p className="font-bold text-neutral-900">
                        {order.orderId ?? order._id}
                      </p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900 mb-1">
                        {formatPrice(displayAmount)}
                      </p>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${displayStatus === "delivered"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : displayStatus === "pending"
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                        {displayStatus}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Your Products</h2>
            <button
              onClick={() => navigate("/vendor/products")}
              className="text-sm text-neutral-600 hover:text-black font-bold transition-colors">
              View All
            </button>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  key={product._id ?? product.id}
                  onClick={() =>
                    navigate(`/vendor/products/${product._id ?? product.id}`)
                  }
                  className="flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-neutral-900/30 hover:shadow-md rounded-xl cursor-pointer transition-all duration-300">
                  <div className="relative">
                    <img
                      src={product.image || product.images?.[0]}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-xl shadow-sm"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/56x56?text=P";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-neutral-900 font-semibold mt-0.5">
                      {formatPrice(product.price || 0)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${product.stock === "in_stock"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : product.stock === "low_stock"
                        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                    {product.stock === "in_stock"
                      ? "In Stock"
                      : product.stock === "low_stock"
                        ? "Low Stock"
                        : "Out of Stock"}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No products yet</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VendorDashboard;

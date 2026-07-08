import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiArrowRight,
} from "react-icons/fi";
import { useVendorAuthStore } from "../store/vendorAuthStore";
import { useVendorProductStore } from "../store/vendorProductStore";
import { getVendorOrders, getVendorEarnings } from "../services/vendorService";
import { formatPrice } from "../../../shared/utils/helpers";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { vendor } = useVendorAuthStore();
  const { products, total: totalProductsCount, fetchProducts } = useVendorProductStore();

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
      color: "bg-vendor-primary",
      bgColor: "bg-white",
      textColor: "text-vendor-primary",
      iconColor: "text-vendor-accent",
      link: "/vendor/products",
    },
    {
      icon: FiShoppingBag,
      label: "Total Orders",
      value: stats.totalOrders,
      color: "bg-vendor-primary",
      bgColor: "bg-white",
      textColor: "text-vendor-primary",
      iconColor: "text-vendor-accent",
      link: "/vendor/orders",
    },
    {
      icon: FiTrendingUp,
      label: "Pending Orders",
      value: stats.pendingOrders,
      color: "bg-gradient-to-br from-vendor-accent to-vendor-accentHover",
      bgColor: "bg-white",
      textColor: "text-vendor-accent",
      iconColor: "text-vendor-primary",
      link: "/vendor/orders",
    },
    {
      icon: FiDollarSign,
      label: "Total Earnings",
      value: formatPrice(stats.totalEarnings || 0),
      color: "bg-vendor-primary",
      bgColor: "bg-white",
      textColor: "text-vendor-primary",
      iconColor: "text-vendor-accent",
      link: "/vendor/earnings",
    },
  ];

  const topProducts = useMemo(() => products.slice(0, 5), [products]);

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => stat.link && navigate(stat.link)}
            className={`${stat.bgColor} rounded-2xl p-5 cursor-pointer shadow-sm border border-gray-100 hover:shadow-xl hover:border-vendor-accent/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group`}>

            {/* Decorative background element */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-vendor-accent/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`${stat.color} p-3.5 rounded-xl shadow-[0_4px_12px_rgba(10,25,47,0.1)] transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className={`${stat.iconColor} text-xl`} />
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-vendor-primary transition-colors duration-300">
                <FiArrowRight className="text-gray-400 group-hover:text-vendor-accent text-lg transition-colors duration-300" />
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
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vendor-accent via-vendor-primary to-vendor-accent opacity-20" />

        <h2 className="text-xl font-bold text-vendor-primary mb-5 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button
              onClick={() => navigate("/vendor/products/add-product")}
              className="w-full group flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-vendor-accent/50 rounded-xl transition-all duration-300 text-left hover:shadow-[0_8px_24px_rgba(10,25,47,0.08)] hover:-translate-y-1">
              <div className="bg-vendor-primary group-hover:bg-vendor-accent p-3 rounded-xl transition-colors duration-300">
                <FiPackage className="text-vendor-accent group-hover:text-vendor-primary text-xl transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-vendor-primary group-hover:text-vendor-accent transition-colors duration-300">Add New Product</h3>
                <p className="text-sm text-gray-500 font-medium">
                  Create a new product listing
                </p>
              </div>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => navigate("/vendor/orders")}
              className="w-full group flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-vendor-accent/50 rounded-xl transition-all duration-300 text-left hover:shadow-[0_8px_24px_rgba(10,25,47,0.08)] hover:-translate-y-1">
              <div className="bg-vendor-primary group-hover:bg-vendor-accent p-3 rounded-xl transition-colors duration-300">
                <FiShoppingBag className="text-vendor-accent group-hover:text-vendor-primary text-xl transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-vendor-primary group-hover:text-vendor-accent transition-colors duration-300">View Orders</h3>
                <p className="text-sm text-gray-500 font-medium">Manage your orders</p>
              </div>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button
              onClick={() => navigate("/vendor/earnings")}
              className="w-full group flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-vendor-accent/50 rounded-xl transition-all duration-300 text-left hover:shadow-[0_8px_24px_rgba(10,25,47,0.08)] hover:-translate-y-1">
              <div className="bg-vendor-primary group-hover:bg-vendor-accent p-3 rounded-xl transition-colors duration-300">
                <FiDollarSign className="text-vendor-accent group-hover:text-vendor-primary text-xl transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-vendor-primary group-hover:text-vendor-accent transition-colors duration-300">View Earnings</h3>
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
            <h2 className="text-xl font-bold text-vendor-primary tracking-tight">Recent Orders</h2>
            <button
              onClick={() => navigate("/vendor/orders")}
              className="text-sm text-vendor-accent hover:text-vendor-accentHover font-bold transition-colors">
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
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 hover:border-vendor-accent/30 hover:shadow-md rounded-xl cursor-pointer transition-all duration-300">
                    <div>
                      <p className="font-bold text-vendor-primary">
                        {order.orderId ?? order._id}
                      </p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-vendor-primary mb-1">
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
            <h2 className="text-xl font-bold text-vendor-primary tracking-tight">Your Products</h2>
            <button
              onClick={() => navigate("/vendor/products")}
              className="text-sm text-vendor-accent hover:text-vendor-accentHover font-bold transition-colors">
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
                  className="flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-vendor-accent/30 hover:shadow-md rounded-xl cursor-pointer transition-all duration-300">
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
                    <p className="font-bold text-vendor-primary truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-vendor-accent font-semibold mt-0.5">
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

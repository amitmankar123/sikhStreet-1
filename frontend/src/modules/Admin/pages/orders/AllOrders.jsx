import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCheckCircle,
  FiPackage,
  FiTruck,
  FiXCircle,
  FiRotateCw,
  FiShoppingBag,
  FiFileText,
  FiTrash2,
  FiMoreVertical,
  FiCalendar,
  FiX,
  FiRefreshCw,
  FiDollarSign,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import DataTable from "../../components/DataTable";
import ExportButton from "../../components/ExportButton";
import Badge from "../../../../shared/components/Badge";
import { formatVariantLabel } from "../../../../shared/utils/variant";
import ConfirmModal from "../../components/ConfirmModal";
import AnimatedSelect from "../../components/AnimatedSelect";
import { formatPrice } from "../../../../shared/utils/helpers";
import { formatCurrency, formatDateTime } from "../../utils/adminHelpers";
import { getAllOrders, deleteOrder } from "../../services/adminService";
import toast from "react-hot-toast";

// OrderItemsDropdown component
const OrderItemsDropdown = ({ items, orderTotal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Normalize items - handle both array and number formats
  const normalizedItems = useMemo(() => {
    if (Array.isArray(items)) {
      return items;
    }
    // If items is a number, generate mock items
    if (typeof items === "number" && items > 0) {
      const itemCount = items;
      const avgPrice = orderTotal / itemCount;
      return Array.from({ length: itemCount }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        quantity: 1,
        price: avgPrice,
      }));
    }
    return [];
  }, [items, orderTotal]);

  // Check available space and determine dropdown direction
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 400; // max-h-[400px]

      // Open upward if not enough space below but enough space above
      setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  if (normalizedItems.length === 0) {
    return <span className="text-gray-500">No items</span>;
  }

  const itemCount = normalizedItems.length;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
        <span>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        {isOpen ? (
          <FiChevronUp className="text-xs" />
        ) : (
          <FiChevronDown className="text-xs" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{
              opacity: 0,
              y: openUpward ? 10 : -10,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: openUpward ? 10 : -10,
              scale: 0.95,
            }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1],
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className={`absolute left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-[85vw] sm:w-[500px] max-w-[600px] max-h-[400px] overflow-hidden ${openUpward ? "bottom-full mb-2" : "top-full mt-2"
              }`}
            style={{
              transformOrigin: openUpward ? "bottom left" : "top left",
            }}>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-sm">
                Order Items
              </h3>
            </div>
            <div className="overflow-y-auto overflow-x-auto max-h-[320px] scrollbar-admin">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                      Item ID
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                      Item Name
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                      Quantity
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                      Unit Price
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {normalizedItems.map((item, index) => {
                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                    const itemId =
                      item.id || item.itemId || `ITEM-${index + 1}`;
                    return (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 text-sm text-gray-800 font-medium whitespace-nowrap">
                          {itemId}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-sm text-gray-800 whitespace-nowrap">
                          <p className="font-medium">{item.name || `Item ${index + 1}`}</p>
                          {formatVariantLabel(item?.variant) && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                  {formatVariantLabel(item?.variant)}
                              </p>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
                          {item.quantity || 1}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
                          {formatPrice(item.price || 0)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-sm font-semibold text-gray-800 text-right whitespace-nowrap">
                          {formatPrice(itemTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AllOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    orderId: null,
  });
  const [summaryModal, setSummaryModal] = useState({
    isOpen: false,
    order: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        status: selectedStatus === "all" ? undefined : selectedStatus,
        search: searchQuery,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 100 // Fetch a larger set for the DataTable's internal pagination
      };

      const response = await getAllOrders(params);

      // Normalize data to match existing UI structure
      const normalizedOrders = response.data.orders.map(order => ({
        ...order,
        id: order.orderId || order._id,
        customer: {
          name: order.userId?.name || 'Unknown',
          email: order.userId?.email || ''
        },
        date: order.createdAt,
        finalTotal: order.total
      }));

      setOrders(normalizedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      // adminService interceptor already handles error toasts
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, searchQuery, dateRange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Calculate order status counts
  const orderStats = useMemo(() => {
    const stats = {
      awaiting: 0,
      received: 0,
      processed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
      total: orders.length,
    };

    orders.forEach((order) => {
      const status = order.status?.toLowerCase() || "";

      // Map statuses to our categories
      if (status === "pending" || status === "awaiting") {
        stats.awaiting++;
      } else if (status === "received") {
        stats.received++;
      } else if (status === "processing" || status === "processed") {
        stats.processed++;
      } else if (status === "shipped") {
        stats.shipped++;
      } else if (status === "delivered") {
        stats.delivered++;
      } else if (status === "cancelled" || status === "canceled") {
        stats.cancelled++;
      } else if (status === "returned") {
        stats.returned++;
      }
    });

    return stats;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order.id || "").toLowerCase().includes(q) ||
          (order.customer?.name || "").toLowerCase().includes(q) ||
          (order.customer?.email || "").toLowerCase().includes(q)
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (order) => (order.status || "").toLowerCase() === selectedStatus
      );
    }

    // Filter by date range
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.date);
        orderDate.setHours(0, 0, 0, 0);

        if (dateRange.startDate && dateRange.endDate) {
          const startDate = new Date(dateRange.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          return orderDate >= startDate && orderDate <= endDate;
        } else if (dateRange.startDate) {
          const startDate = new Date(dateRange.startDate);
          startDate.setHours(0, 0, 0, 0);
          return orderDate >= startDate;
        } else if (dateRange.endDate) {
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          return orderDate <= endDate;
        }
        return true;
      });
    }

    return filtered;
  }, [orders, searchQuery, selectedStatus, dateRange]);

  // Helper function to format payment method
  const formatPaymentMethod = (method) => {
    if (!method) return "N/A";
    const methodMap = {
      card: "Credit Card",
      cod: "Cash on Delivery",
      wallet: "Wallet",
      creditCard: "Credit Card",
      cash: "Cash on Delivery",
    };
    return (
      methodMap[method.toLowerCase()] ||
      method.charAt(0).toUpperCase() + method.slice(1)
    );
  };

  // Helper function to calculate final total
  const calculateFinalTotal = (order) => {
    if (order.finalTotal !== undefined) {
      return order.finalTotal;
    }
    const total = order.total || 0;
    const tax = order.tax || 0;
    const discount = order.discount || 0;
    return total + tax - discount;
  };

  // Handler functions for order actions
  const handleOrderDetails = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleGenerateInvoice = (order) => {
    navigate(`/admin/orders/${order.id}/invoice`);
  };

  const handleOrderTracking = (orderId) => {
    navigate(`/admin/orders/order-tracking?orderId=${orderId}`);
  };

  const handleDeleteOrder = (orderId) => {
    setDeleteModal({ isOpen: true, orderId });
  };

  const confirmDeleteOrder = async () => {
    try {
      await deleteOrder(deleteModal.orderId);
      const updatedOrders = orders.filter((o) => o.id !== deleteModal.orderId);
      setOrders(updatedOrders);
      setDeleteModal({ isOpen: false, orderId: null });
      toast.success("Order deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const columns = [
    {
      key: "id",
      label: "Order ID",
      sortable: true,
      render: (value) => <span className="font-semibold">{value}</span>,
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-medium text-gray-800">{value.name}</p>
          <p className="text-xs text-gray-500">{value.email}</p>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      sortable: false,
      render: (value, row) => (
        <OrderItemsDropdown items={value} orderTotal={row.total || 0} />
      ),
    },
    {
      key: "subtotal",
      label: "Subtotal ($)",
      sortable: true,
      render: (value) => (
        <span className="font-bold text-gray-800">{formatCurrency(value)}</span>
      ),
    },
    {
      key: "finalTotal",
      label: "Final Total ($)",
      sortable: true,
      render: (value, row) => {
        const finalTotal = calculateFinalTotal(row);
        return (
          <span className="font-bold text-gray-800">
            {formatCurrency(finalTotal)}
          </span>
        );
      },
    },
    {
      key: "paymentMethod",
      label: "Payment",
      sortable: true,
      render: (value) => (
        <span className="text-gray-700 capitalize">
          {formatPaymentMethod(value)}
        </span>
      ),
    },
    {
      key: "date",
      label: "Order Date",
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => setSummaryModal({ isOpen: true, order: row })}
          className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center justify-center mx-auto"
          title="View Summary & Actions"
        >
          <FiMoreVertical className="text-lg" />
        </button>
      ),
    },
  ];

  // Order status cards configuration
  const statusCards = [
    {
      title: "Awaiting",
      value: orderStats.awaiting,
      icon: FiClock,
      bgColor: "bg-gradient-to-br from-yellow-500 to-amber-600",
      cardBg: "bg-gradient-to-br from-yellow-50 to-amber-50",
    },
    {
      title: "Received",
      value: orderStats.received,
      icon: FiCheckCircle,
      bgColor: "bg-gradient-to-br from-blue-500 to-cyan-600",
      cardBg: "bg-gradient-to-br from-blue-50 to-cyan-50",
    },
    {
      title: "Processed",
      value: orderStats.processed,
      icon: FiPackage,
      bgColor: "bg-gradient-to-br from-indigo-500 to-purple-600",
      cardBg: "bg-gradient-to-br from-indigo-50 to-purple-50",
    },
    {
      title: "Shipped",
      value: orderStats.shipped,
      icon: FiTruck,
      bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
      cardBg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    },
    {
      title: "Delivered",
      value: orderStats.delivered,
      icon: FiCheckCircle,
      bgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
      cardBg: "bg-gradient-to-br from-green-50 to-emerald-50",
    },
    {
      title: "Cancelled",
      value: orderStats.cancelled,
      icon: FiXCircle,
      bgColor: "bg-gradient-to-br from-red-500 to-rose-600",
      cardBg: "bg-gradient-to-br from-red-50 to-rose-50",
    },
    {
      title: "Returned",
      value: orderStats.returned,
      icon: FiRotateCw,
      bgColor: "bg-gradient-to-br from-orange-500 to-amber-600",
      cardBg: "bg-gradient-to-br from-orange-50 to-amber-50",
    },
    {
      title: "Total Orders",
      value: orderStats.total,
      icon: FiShoppingBag,
      bgColor: "bg-gradient-to-br from-gray-600 to-gray-800",
      cardBg: "bg-gradient-to-br from-gray-50 to-gray-100",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            All Orders
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and manage all customer orders
          </p>
        </div>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${card.cardBg} rounded-xl p-3 sm:p-4 shadow-md border-2 border-transparent hover:shadow-lg transition-all duration-300 relative overflow-hidden`}>
              {/* Decorative gradient overlay */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 ${card.bgColor} opacity-10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16`}></div>

              <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
                <div
                  className={`${card.bgColor} bg-white/20 p-2 sm:p-2.5 rounded-lg shadow-md`}>
                  <Icon className="text-white text-base sm:text-lg" />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">
                  {card.title}
                </h3>
                <p className="text-gray-800 text-lg sm:text-xl font-bold">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 w-full sm:min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            />
          </div>

          <AnimatedSelect
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
              { value: "returned", label: "Returned" },
            ]}
            className="w-full sm:w-auto min-w-[140px]"
          />

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:flex-initial">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  max={dateRange.endDate || undefined}
                  className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base min-w-[140px]"
                  placeholder="Start Date"
                />
              </div>
              <span className="text-gray-500 hidden sm:inline">to</span>
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  min={dateRange.startDate || undefined}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base min-w-[140px]"
                  placeholder="End Date"
                />
              </div>
              {(dateRange.startDate || dateRange.endDate) && (
                <button
                  onClick={() => setDateRange({ startDate: "", endDate: "" })}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Clear Date Range">
                  <FiX className="text-lg" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <ExportButton
              data={filteredOrders}
              headers={[
                { label: "Order ID", accessor: (row) => row.id },
                { label: "Customer", accessor: (row) => row.customer.name },
                { label: "Email", accessor: (row) => row.customer.email },
                {
                  label: "Items",
                  accessor: (row) => {
                    if (Array.isArray(row.items)) {
                      return row.items
                        .map((item) => `${item.name} (Qty: ${item.quantity})`)
                        .join(", ");
                    }
                    return `${row.items} items`;
                  },
                },
                {
                  label: "Total ($)",
                  accessor: (row) => formatCurrency(row.total || 0),
                },
                {
                  label: "Final Total ($)",
                  accessor: (row) => formatCurrency(calculateFinalTotal(row)),
                },
                {
                  label: "Payment",
                  accessor: (row) => formatPaymentMethod(row.paymentMethod),
                },
                {
                  label: "Order Date",
                  accessor: (row) => formatDateTime(row.date),
                },
                { label: "Status", accessor: (row) => row.status },
              ]}
              filename="all-orders"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center text-gray-500">
          Loading orders...
        </div>
      ) : (
        <DataTable
          data={filteredOrders}
          columns={columns}
          pagination={true}
          itemsPerPage={10}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, orderId: null })}
        onConfirm={confirmDeleteOrder}
        title="Delete Order?"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <AnimatePresence>
        {summaryModal.isOpen && summaryModal.order && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSummaryModal({ isOpen: false, order: null })}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-150 bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <FiShoppingBag className="text-blue-600" />
                    Order Summary & Actions
                  </h3>
                  <p className="text-xs font-mono text-gray-500 mt-1">
                    ID: {summaryModal.order.orderId || summaryModal.order.id}
                  </p>
                </div>
                <button
                  onClick={() => setSummaryModal({ isOpen: false, order: null })}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Status and Customer Info Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</h4>
                    <p className="font-semibold text-gray-800">{summaryModal.order.customer?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{summaryModal.order.customer?.email}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs mt-0.5">
                      <span className="text-gray-600 font-medium">{new Date(summaryModal.order.date).toLocaleDateString()}</span>
                      <span className="text-gray-300">•</span>
                      <span className="capitalize px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-full">
                        {summaryModal.order.paymentMethod ? formatPaymentMethod(summaryModal.order.paymentMethod) : 'N/A'}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        summaryModal.order.status?.toLowerCase() === 'delivered' ? 'bg-green-50 text-green-700' :
                        summaryModal.order.status?.toLowerCase() === 'cancelled' || summaryModal.order.status?.toLowerCase() === 'canceled' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-800'
                      }`}>
                        {summaryModal.order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main section: Left = Price Breakdown, Right = Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Price Breakdown */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <FiDollarSign className="text-amber-500" />
                      Price Breakdown
                    </h4>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(summaryModal.order.subtotal || 0)}
                        </span>
                      </div>

                      {Number(summaryModal.order.discount || 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center gap-1.5">
                            Coupon Discount {summaryModal.order.couponCode && `(${summaryModal.order.couponCode})`}
                          </span>
                          <span className="font-bold">
                            -{formatCurrency(summaryModal.order.discount || 0)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-600">
                        <span>Shipping Charges</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(summaryModal.order.shipping || 0)}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-600">
                        <span>Taxes (18% GST)</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(summaryModal.order.tax || 0)}
                        </span>
                      </div>

                      <div className="border-t border-gray-150 pt-3 mt-3 flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-800">Net Total</span>
                        <span className="font-extrabold text-xl text-blue-600">
                          {formatCurrency(summaryModal.order.total || 0)}
                        </span>
                      </div>
                    </div>

                    {Number(summaryModal.order.discount || 0) > 0 && (
                      <div className="bg-green-50 text-green-800 text-xs p-3 rounded-xl border border-green-150 leading-relaxed font-medium">
                        🎉 Coupon code <strong>{summaryModal.order.couponCode || 'SAVE'}</strong> saved <strong>{formatCurrency(summaryModal.order.discount || 0)}</strong> on this order.
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <FiPackage className="text-blue-500" />
                      Quick Actions
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Action 1: View Details */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <FiEye className="text-base" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">Full Details</p>
                            <p className="text-[10px] text-gray-400">View items, customer address, etc.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleOrderDetails(summaryModal.order.id);
                            setSummaryModal({ isOpen: false, order: null });
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors whitespace-nowrap"
                        >
                          View Page
                        </button>
                      </div>

                      {/* Action 2: Generate Invoice */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50/20 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                            <FiFileText className="text-base" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">Invoice Details</p>
                            <p className="text-[10px] text-gray-400">Generate or print receipt.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleGenerateInvoice(summaryModal.order);
                            setSummaryModal({ isOpen: false, order: null });
                          }}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors whitespace-nowrap"
                        >
                          Invoice
                        </button>
                      </div>

                      {/* Action 3: Order Tracking */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <FiTruck className="text-base" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">Tracking Info</p>
                            <p className="text-[10px] text-gray-450 truncate max-w-[150px]">
                              {summaryModal.order.trackingNumber ? `ID: ${summaryModal.order.trackingNumber}` : 'Assign delivery boy.'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleOrderTracking(summaryModal.order.id);
                            setSummaryModal({ isOpen: false, order: null });
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors whitespace-nowrap"
                        >
                          Track Status
                        </button>
                      </div>

                      {/* Action 4: Delete Order */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-red-150 hover:bg-red-50/20 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-105 transition-colors">
                            <FiTrash2 className="text-base" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-red-705">Delete Order</p>
                            <p className="text-[10px] text-gray-400">Permanently delete order.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleDeleteOrder(summaryModal.order.id);
                            setSummaryModal({ isOpen: false, order: null });
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end">
                <button
                  onClick={() => setSummaryModal({ isOpen: false, order: null })}
                  className="px-4 py-2 bg-gray-250 hover:bg-gray-300 text-gray-700 font-semibold text-sm rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AllOrders;

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiCheck, FiX, FiEye, FiClock, FiCheckCircle, FiSlash } from "react-icons/fi";
import { motion } from "framer-motion";
import DataTable from "../../components/DataTable";
import Badge from "../../../../shared/components/Badge";
import ConfirmModal from "../../components/ConfirmModal";
import { formatPrice } from "../../../../shared/utils/helpers";
import { getAllProducts, updateProduct } from "../../services/adminService";
import toast from "react-hot-toast";

const ProductVerification = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "active" | "blocked"
  const [searchQuery, setSearchQuery] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    product: null,
    actionType: null, // "approve" | "block"
  });

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    product: null,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      let currentPage = 1;
      let totalPages = 1;
      const allFetched = [];

      do {
        const response = await getAllProducts({ page: currentPage, limit: 100, includeInactive: "true" });
        const pageProducts = Array.isArray(response.data)
          ? response.data
          : (response.data?.products || []);
        allFetched.push(...pageProducts);

        totalPages = Number(response.data?.pages || 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const normalized = allFetched.map((p) => {
        const status = p.approvalStatus || (p.isActive ? "active" : "pending");
        return {
          ...p,
          id: p.id || p._id,
          approvalStatus: status,
          image: p.image || p.images?.[0] || "https://placehold.co/50x50?text=Product",
        };
      });

      setProducts(normalized);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (product, newStatus) => {
    try {
      const isApproved = newStatus === "active";
      await updateProduct(product.id, {
        approvalStatus: newStatus,
        isActive: isApproved,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, approvalStatus: newStatus, isActive: isApproved }
            : p
        )
      );

      toast.success(
        `Product "${product.name}" is now ${newStatus.toUpperCase()}`
      );
      setConfirmModal({ isOpen: false, product: null, actionType: null });
    } catch (error) {
      toast.error("Failed to update product approval status");
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesTab = (product.approvalStatus || "pending") === activeTab;
      const matchesSearch = searchQuery
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(product.vendorId?.storeName || "").toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesTab && matchesSearch;
    });
  }, [products, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      pending: products.filter((p) => (p.approvalStatus || "pending") === "pending").length,
      active: products.filter((p) => p.approvalStatus === "active").length,
      blocked: products.filter((p) => p.approvalStatus === "blocked").length,
    };
  }, [products]);

  const columns = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      render: (value, row) => String(value || row._id || "").slice(-6).toUpperCase(),
    },
    {
      key: "name",
      label: "Product Name",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.image}
            alt={value}
            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              e.target.src = "https://placehold.co/50x50?text=Product";
            }}
          />
          <div>
            <span className="font-semibold text-gray-900 block">{value}</span>
            <span className="text-xs text-gray-500">
              Vendor: {row.vendorId?.storeName || row.vendorName || "Platform"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (value) => formatPrice(value),
    },
    {
      key: "stockQuantity",
      label: "Stock",
      sortable: true,
      render: (value) => Number(value || 0).toLocaleString(),
    },
    {
      key: "approvalStatus",
      label: "Status",
      sortable: true,
      render: (value) => (
        <Badge
          variant={
            value === "active"
              ? "success"
              : value === "pending"
                ? "warning"
                : "error"
          }
        >
          {value ? value.toUpperCase() : "PENDING"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewModal({ isOpen: true, product: row });
            }}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View Product Details"
          >
            <FiEye className="text-base" />
          </button>

          {row.approvalStatus !== "active" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModal({
                  isOpen: true,
                  product: row,
                  actionType: "approve",
                });
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-semibold rounded-lg text-xs transition-colors"
              title="Approve & Publish"
            >
              <FiCheck className="text-xs" /> Approve
            </button>
          )}

          {row.approvalStatus !== "blocked" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModal({
                  isOpen: true,
                  product: row,
                  actionType: "block",
                });
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded-lg text-xs transition-colors"
              title="Block Product"
            >
              <FiSlash className="text-xs" /> Block
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Product Verification & Approval
        </h1>
        <p className="text-sm text-gray-500">
          Review vendor product submissions, approve active listings, or block unverified items.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiClock className="text-base" />
          Pending Approvals
          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-bold">
            {counts.pending}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "active"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiCheckCircle className="text-base" />
          Active Products
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 font-bold">
            {counts.active}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("blocked")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "blocked"
              ? "border-red-600 text-red-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiSlash className="text-base" />
          Blocked Products
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 font-bold">
            {counts.blocked}
          </span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product or vendor name..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Table */}
        <DataTable
          data={filteredProducts}
          columns={columns}
          pagination={true}
          itemsPerPage={10}
          onRowClick={(row) => setViewModal({ isOpen: true, product: row })}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, product: null, actionType: null })}
        onConfirm={() =>
          handleUpdateStatus(
            confirmModal.product,
            confirmModal.actionType === "approve" ? "active" : "blocked"
          )
        }
        title={confirmModal.actionType === "approve" ? "Approve & Publish Product?" : "Block Product?"}
        message={
          confirmModal.actionType === "approve"
            ? `Are you sure you want to approve "${confirmModal.product?.name}"? It will become visible on the marketplace.`
            : `Are you sure you want to block "${confirmModal.product?.name}"? It will be hidden from the marketplace.`
        }
        confirmText={confirmModal.actionType === "approve" ? "Approve Product" : "Block Product"}
        cancelText="Cancel"
        type={confirmModal.actionType === "approve" ? "primary" : "danger"}
      />

      {/* Product Detail Modal */}
      {viewModal.isOpen && viewModal.product && (
        <div
          className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4"
          onClick={() => setViewModal({ isOpen: false, product: null })}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Product Verification Review</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Product ID: {String(viewModal.product.id || viewModal.product._id || "").slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setViewModal({ isOpen: false, product: null })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-xl text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="flex gap-4 items-start">
                <img
                  src={viewModal.product.image}
                  alt={viewModal.product.name}
                  className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/100x100?text=Product";
                  }}
                />
                <div className="space-y-1.5">
                  <h5 className="text-lg font-bold text-gray-950">{viewModal.product.name}</h5>
                  <p className="text-sm text-gray-500">{viewModal.product.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                <div>
                  <span className="text-xs font-semibold text-gray-500">Price</span>
                  <p className="font-bold text-primary-600 mt-0.5">{formatPrice(viewModal.product.price)}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500">Stock Quantity</span>
                  <p className="font-bold text-gray-800 mt-0.5">{viewModal.product.stockQuantity}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500">Vendor</span>
                  <p className="font-semibold text-indigo-700 mt-0.5">{viewModal.product.vendorId?.storeName || viewModal.product.vendorName || "Platform"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500">Approval Status</span>
                  <div className="mt-0.5">
                    <Badge
                      variant={
                        viewModal.product.approvalStatus === "active"
                          ? "success"
                          : viewModal.product.approvalStatus === "pending"
                            ? "warning"
                            : "error"
                      }
                    >
                      {viewModal.product.approvalStatus ? viewModal.product.approvalStatus.toUpperCase() : "PENDING"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                {viewModal.product.approvalStatus !== "active" && (
                  <button
                    onClick={() => {
                      const prod = viewModal.product;
                      setViewModal({ isOpen: false, product: null });
                      handleUpdateStatus(prod, "active");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
                  >
                    <FiCheck /> Approve & Publish
                  </button>
                )}
                {viewModal.product.approvalStatus !== "blocked" && (
                  <button
                    onClick={() => {
                      const prod = viewModal.product;
                      setViewModal({ isOpen: false, product: null });
                      handleUpdateStatus(prod, "blocked");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
                  >
                    <FiSlash /> Block Product
                  </button>
                )}
              </div>
              <button
                onClick={() => setViewModal({ isOpen: false, product: null })}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductVerification;

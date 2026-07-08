import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiEye, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import DataTable from "../../components/DataTable";
import ExportButton from "../../components/ExportButton";
import Badge from "../../../../shared/components/Badge";
import ConfirmModal from "../../components/ConfirmModal";
import ProductFormModal from "../../components/ProductFormModal";
import AnimatedSelect from "../../components/AnimatedSelect";
import { formatPrice } from "../../../../shared/utils/helpers";

import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { useBrandStore } from "../../../../shared/store/brandStore";
import { getAllProducts, deleteProduct } from "../../services/adminService";
import toast from "react-hot-toast";

const ManageProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const { categories, initialize: initCategories } = useCategoryStore();
  const { brands, initialize: initBrands } = useBrandStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
  });
  const [productFormModal, setProductFormModal] = useState({
    isOpen: false,
    productId: null,
  });
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    product: null,
  });

  useEffect(() => {
    initCategories();
    initBrands();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      let currentPage = 1;
      let totalPages = 1;
      const products = [];

      do {
        const response = await getAllProducts({ page: currentPage, limit: 100 });
        const pageProducts = Array.isArray(response.data)
          ? response.data
          : (response.data?.products || []);
        products.push(...pageProducts);

        totalPages = Number(response.data?.pages || 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const normalizedProducts = products.map(p => ({
        ...p,
        id: p.id || p._id, // Map backend id or _id to frontend id
        image: p.image || p.images?.[0] || "https://placehold.co/50x50?text=Product",
        stock: p.stock || (p.stockQuantity > 5 ? "in_stock" : p.stockQuantity > 0 ? "low_stock" : "out_of_stock"),
      }));
      setProducts(normalizedProducts);
    } catch (error) {
      // Error is handled in interceptor
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((product) => product.stock === selectedStatus);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => String(product.categoryId?._id || product.categoryId) === String(selectedCategory)
      );
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter(
        (product) => String(product.brandId?._id || product.brandId) === String(selectedBrand)
      );
    }

    return filtered;
  }, [products, searchQuery, selectedStatus, selectedCategory, selectedBrand]);

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
            className="w-10 h-10 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = "https://placehold.co/50x50?text=Product";
            }}
          />
          <span className="font-medium">{value}</span>
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
      key: "stock",
      label: "Status",
      sortable: true,
      render: (value) => (
        <Badge
          variant={
            value === "in_stock"
              ? "success"
              : value === "low_stock"
                ? "warning"
                : "error"
          }>
          {value ? value.replace("_", " ").toUpperCase() : "N/A"}
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
            title="View Details"
          >
            <FiEye />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProductFormModal({ isOpen: true, productId: row.id });
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Product"
          >
            <FiEdit />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ isOpen: true, productId: row.id });
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Product"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteModal.productId);
      setProducts(products.filter((p) => p.id !== deleteModal.productId));
      setDeleteModal({ isOpen: false, productId: null });
      toast.success("Product deleted successfully");
    } catch (error) {
      setDeleteModal({ isOpen: false, productId: null });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Manage Products
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View, edit, and manage your product catalog
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        {/* Filters Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 w-full sm:min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
              />
            </div>

            <AnimatedSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "in_stock", label: "In Stock" },
                { value: "low_stock", label: "Low Stock" },
                { value: "out_of_stock", label: "Out of Stock" },
              ]}
              className="w-full sm:w-auto min-w-[140px]"
            />

            <AnimatedSelect
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: "all", label: "All Categories" },
                ...categories
                  .filter((cat) => cat.isActive !== false && !cat.parentId)
                  .map((cat) => ({ value: String(cat.id), label: cat.name })),
              ]}
              className="w-full sm:w-auto min-w-[160px]"
            />

            <AnimatedSelect
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              options={[
                { value: "all", label: "All Brands" },
                ...brands
                  .filter((brand) => brand.isActive !== false)
                  .map((brand) => ({ value: String(brand.id), label: brand.name })),
              ]}
              className="w-full sm:w-auto min-w-[160px]"
            />

            <div className="w-full sm:w-auto">
              <ExportButton
                data={filteredProducts}
                headers={[
                  { label: "ID", accessor: (row) => row.id },
                  { label: "Name", accessor: (row) => row.name },
                  {
                    label: "Price",
                    accessor: (row) => formatPrice(row.price),
                  },
                  { label: "Stock", accessor: (row) => row.stockQuantity },
                  { label: "Status", accessor: (row) => row.stock },
                ]}
                filename="products"
              />
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          data={filteredProducts}
          columns={columns}
          pagination={true}
          itemsPerPage={10}
          onRowClick={(row) =>
            setViewModal({ isOpen: true, product: row })
          }
        />
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null })}
        onConfirm={confirmDelete}
        title="Delete Product?"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ProductFormModal
        isOpen={productFormModal.isOpen}
        onClose={() => setProductFormModal({ isOpen: false, productId: null })}
        productId={productFormModal.productId}
        onSuccess={() => {
          loadProducts();
        }}
      />

      {/* Product & Vendor Detail Modal */}
      {viewModal.isOpen && viewModal.product && (
        <div
          className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4 pointer-events-auto"
          onClick={() => setViewModal({ isOpen: false, product: null })}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Product & Vendor Details</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Comprehensive details for Product ID: {String(viewModal.product.id || viewModal.product._id || "").slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setViewModal({ isOpen: false, product: null })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-xl text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Product Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Product Information</h4>
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
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-700">Full Database ID:</span> {viewModal.product.id || viewModal.product._id}
                    </p>
                    {viewModal.product.sku && (
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">SKU:</span> {viewModal.product.sku}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-xs font-semibold text-gray-500">Price</span>
                    <p className="text-sm font-bold text-primary-600 mt-0.5">{formatPrice(viewModal.product.price)}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500">Stock Quantity</span>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{viewModal.product.stockQuantity}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 font-semibold text-gray-700">Category</span>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{viewModal.product.categoryId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 font-semibold text-gray-700">Status</span>
                    <div className="mt-0.5">
                      <Badge
                        variant={
                          viewModal.product.stock === "in_stock"
                            ? "success"
                            : viewModal.product.stock === "low_stock"
                              ? "warning"
                              : "error"
                        }
                      >
                        {viewModal.product.stock ? viewModal.product.stock.replace("_", " ").toUpperCase() : "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Info Section */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vendor Details</h4>
                {viewModal.product.vendorId ? (
                  <div className="bg-gradient-to-br from-indigo-50/50 via-indigo-50/10 to-transparent p-4 rounded-xl border border-indigo-100/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-indigo-950">{viewModal.product.vendorId.storeName || 'N/A'}</p>
                        <p className="text-xs text-indigo-500 mt-0.5">Vendor ID: {viewModal.product.vendorId.id || viewModal.product.vendorId._id}</p>
                      </div>
                      <button
                        onClick={() => {
                          setViewModal({ isOpen: false, product: null });
                          navigate(`/admin/vendors/${viewModal.product.vendorId.id || viewModal.product.vendorId._id}`);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
                      >
                        Go to Vendor Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No vendor assigned to this product.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const id = viewModal.product.id;
                    setViewModal({ isOpen: false, product: null });
                    setProductFormModal({ isOpen: true, productId: id });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
                >
                  <FiEdit className="text-xs" /> Edit Product
                </button>
                <button
                  onClick={() => {
                    const id = viewModal.product.id;
                    setViewModal({ isOpen: false, product: null });
                    setDeleteModal({ isOpen: true, productId: id });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition-colors"
                >
                  <FiTrash2 className="text-xs" /> Delete
                </button>
              </div>
              <button
                onClick={() => setViewModal({ isOpen: false, product: null })}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors shadow-sm"
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

export default ManageProducts;

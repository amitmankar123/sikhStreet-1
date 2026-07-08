import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTag,
  FiCalendar,
  FiEdit,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiMinus,
  FiChevronRight,
  FiSearch
} from "react-icons/fi";
import api from "../../../shared/utils/api";
import toast from "react-hot-toast";
import { formatPrice } from "../../../shared/utils/helpers";

const VendorPromotions = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Modal State
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Campaigns
  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/vendor/campaigns");
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setCampaigns(list);
    } catch (error) {
      toast.error(error.message || "Failed to load promotions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Open participation modal
  const handleParticipateClick = async (campaign) => {
    setSelectedCampaign(campaign);
    setModalOpen(true);
    setModalLoading(true);
    setSearchQuery("");
    try {
      const response = await api.get(`/vendor/campaigns/${campaign.id}/products`);
      const data = response.data || {};
      setAvailableProducts(Array.isArray(data.availableProducts) ? data.availableProducts : []);
      setSelectedProductIds(Array.isArray(data.selectedProductIds) ? data.selectedProductIds.map(String) : []);
    } catch (error) {
      toast.error(error.message || "Failed to load eligible products");
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle single product selection
  const handleProductToggle = (productId) => {
    const idStr = String(productId);
    setSelectedProductIds(prev => 
      prev.includes(idStr) 
        ? prev.filter(id => id !== idStr) 
        : [...prev, idStr]
    );
  };

  // Select all eligible products
  const handleSelectAll = (filteredProducts) => {
    const filteredIds = filteredProducts.map(p => String(p.id));
    const allSelected = filteredIds.every(id => selectedProductIds.includes(id));

    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedProductIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  // Submit selections
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await api.post(`/vendor/campaigns/${selectedCampaign.id}/products`, {
        productIds: selectedProductIds
      });
      toast.success("Promotion products updated successfully");
      setModalOpen(false);
      fetchCampaigns();
    } catch (error) {
      toast.error(error.message || "Failed to update campaign participation");
    } finally {
      setIsSaving(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Calculate discounted price helper
  const getDiscountedPrice = (price, discountType, discountValue) => {
    const basePrice = Number(price) || 0;
    if (discountType === "percentage") {
      return Math.round(basePrice * (1 - discountValue / 100));
    } else if (discountType === "fixed") {
      return Math.max(0, basePrice - discountValue);
    }
    return basePrice;
  };

  // Filter available products by search query
  const filteredProducts = availableProducts.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="px-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-vendor-primary mb-1.5 tracking-tight">
            Promotions & Campaigns
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium">
            Participate in admin campaigns and boost your store's sales
          </p>
        </div>
      </div>

      {/* Campaigns list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map(n => (
            <div key={n} className="bg-white border border-gray-100 h-56 rounded-2xl"></div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
          <FiTag className="text-5xl text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Active Campaigns</h3>
          <p className="text-gray-500 text-sm">
            Check back later for seasonal promotions, festival sales, and daily deals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => {
            const addedCount = Array.isArray(campaign.productIds) 
              ? campaign.productIds.filter(id => {
                  // We don't have availableProducts yet here, but let's count them later or display action
                  return true; 
                }).length 
              : 0;

            return (
              <motion.div
                key={campaign.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider mb-2 ${
                        campaign.type === 'festival' 
                          ? 'bg-orange-50 text-orange-600 border border-orange-100'
                          : campaign.type === 'flash_sale'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {campaign.type?.replace('_', ' ')}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800 tracking-tight">{campaign.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-black text-green-600 leading-none">
                        {campaign.discountValue}
                        {campaign.discountType === "percentage" ? "%" : " ₹"}
                      </span>
                      <span className="text-xs text-gray-400 font-bold uppercase mt-1 block">OFF</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">{campaign.description || "No description provided."}</p>

                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-50 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-medium block">Category Eligibility</span>
                      <span className="font-semibold text-gray-700">{campaign.categoryName}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-medium block">Campaign Period</span>
                      <div className="flex items-center gap-1.5 text-gray-600 font-medium text-xs">
                        <FiCalendar className="text-gray-400" />
                        <span>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-400 font-medium">
                    * Banners will show once you add your products.
                  </span>
                  <button
                    onClick={() => handleParticipateClick(campaign)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-vendor-primary text-white text-sm font-semibold rounded-xl hover:bg-[#0c1a30] hover:shadow-lg transition-all"
                  >
                    <FiPlus className="text-base" />
                    <span>Manage Products</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Participation Modal */}
      <AnimatePresence>
        {modalOpen && selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Participate: {selectedCampaign.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select products from category <strong className="text-gray-700">{selectedCampaign.categoryName}</strong>. 
                    Campaign discount is <strong className="text-green-600">{selectedCampaign.discountValue}{selectedCampaign.discountType === "percentage" ? "%" : " ₹"} OFF</strong>.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 hover:bg-gray-200/60 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {modalLoading ? (
                  <div className="text-center py-12 text-gray-500 font-medium">
                    Loading products...
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl max-w-md mx-auto">
                    <FiAlertCircle className="text-4xl text-yellow-500 mx-auto mb-2" />
                    <h3 className="font-bold text-gray-800 text-base">No matching products found</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      You don't have any active products in the <strong className="text-gray-700">{selectedCampaign.categoryName}</strong> category.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Search and select all */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                      <div className="relative flex-1">
                        <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search product by name or SKU..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vendor-accent/50 focus:border-vendor-accent text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(filteredProducts)}
                        className="px-4 py-2 text-sm font-semibold text-vendor-accent bg-vendor-accent/5 rounded-xl border border-vendor-accent/15 hover:bg-vendor-accent/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        {filteredProducts.every(p => selectedProductIds.includes(String(p.id))) 
                          ? "Deselect All Filtered"
                          : "Select All Filtered"
                        }
                      </button>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredProducts.map((product) => {
                        const isSelected = selectedProductIds.includes(String(product.id));
                        const discountPrice = getDiscountedPrice(
                          product.price, 
                          selectedCampaign.discountType, 
                          selectedCampaign.discountValue
                        );

                        return (
                          <div
                            key={product.id}
                            onClick={() => handleProductToggle(product.id)}
                            className={`p-4 border rounded-2xl flex items-center gap-4 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                              isSelected
                                ? "border-vendor-accent bg-vendor-accent/5"
                                : "border-gray-100 bg-white hover:border-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handle via parent onClick
                              className="w-4.5 h-4.5 text-vendor-accent border-gray-300 rounded focus:ring-vendor-accent flex-shrink-0"
                            />
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-14 h-14 object-cover rounded-xl flex-shrink-0 bg-gray-50"
                              onError={(e) => {
                                e.target.src = "https://placehold.co/60x60?text=Product";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm truncate leading-tight mb-1">{product.name}</h4>
                              <p className="text-xs text-gray-400 font-medium mb-1.5">SKU: {product.sku}</p>
                              
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-black text-green-700">
                                  {formatPrice(discountPrice)}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-sm font-semibold text-gray-500">
                  {selectedProductIds.length} product(s) selected for campaign
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-200/70 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving || availableProducts.length === 0}
                    className="px-5 py-2.5 bg-vendor-accent hover:bg-vendor-accentHover text-vendor-primary text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Selection"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VendorPromotions;

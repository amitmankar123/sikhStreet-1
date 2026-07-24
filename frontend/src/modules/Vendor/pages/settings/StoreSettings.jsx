import { useState, useEffect } from "react";
import { FiSave, FiImage, FiGlobe, FiShoppingBag, FiUpload, FiShield, FiFileText } from "react-icons/fi";
import { motion } from "framer-motion";
import { useVendorAuthStore } from "../../store/vendorAuthStore";
import { uploadVendorImage } from "../../services/vendorService";
import AnimatedSelect from "../../../Admin/components/AnimatedSelect";
import toast from "react-hot-toast";
import SearchablePhoneInput from "../../../../shared/components/SearchablePhoneInput";
import Badge from "../../../../shared/components/Badge";

const StoreSettings = () => {
  const { vendor, updateProfile } = useVendorAuthStore();
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState("identity");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (vendor) {
      setFormData({
        storeName: vendor.storeName || "",
        storeLogo: vendor.storeLogo || "",
        storeBanner: vendor.storeBanner || "",
        storeDescription: vendor.storeDescription || "",
        storePolicies: vendor.storePolicies || "",
        refundPolicy: vendor.refundPolicy || "",
        shippingPolicy: vendor.shippingPolicy || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address
          ? `${vendor.address.street || ""}, ${vendor.address.city || ""}, ${vendor.address.state || ""
          } ${vendor.address.zipCode || ""}`
          : "",
        businessHours: vendor.businessHours || "Mon-Fri 9AM-6PM",
        timezone: vendor.timezone || "UTC",
        currency: vendor.currency || "INR",
        socialMedia: vendor.socialMedia || {
          facebook: "",
          instagram: "",
          twitter: "",
          linkedin: "",
        },
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSocialMediaChange = (platform, value) => {
    setFormData({
      ...formData,
      socialMedia: {
        ...formData.socialMedia,
        [platform]: value,
      },
    });
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (field === "storeLogo") setIsUploadingLogo(true);
    if (field === "storeBanner") setIsUploadingBanner(true);

    try {
      const res = await uploadVendorImage(file, "vendors/settings");
      const uploaded = res?.data ?? res;
      setFormData((prev) => ({
        ...prev,
        [field]: uploaded?.url || "",
      }));
      toast.success(`${field === "storeLogo" ? "Logo" : "Banner"} uploaded successfully`);
    } catch {
      // Error handled by interceptor
    } finally {
      if (field === "storeLogo") setIsUploadingLogo(false);
      if (field === "storeBanner") setIsUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      // Parse address string into the object shape the backend expects
      let addressData = vendor.address || {};
      if (formData.address) {
        const addressParts = formData.address.split(",");
        if (addressParts.length >= 3) {
          addressData = {
            street: addressParts[0].trim(),
            city: addressParts[1].trim(),
            state: addressParts[2].trim().split(" ")[0],
            zipCode: addressParts[2].trim().split(" ")[1] || "",
            country: vendor.address?.country || "India",
          };
        }
      }

      // Only send fields accepted by PUT /vendor/auth/profile
      await updateProfile({
        storeName: formData.storeName,
        storeLogo: formData.storeLogo,
        storeBanner: formData.storeBanner,
        storeDescription: formData.storeDescription,
        storePolicies: formData.storePolicies,
        refundPolicy: formData.refundPolicy,
        shippingPolicy: formData.shippingPolicy,
        currency: formData.currency,
        phone: formData.phone,
        address: addressData,
      });
      toast.success("Store settings saved successfully");
    } catch {
      // api.js shows toast
    }
  };

  const sections = [
    { id: "identity", label: "Store Identity", icon: FiShoppingBag },
    { id: "contact", label: "Contact Info", icon: FiGlobe },
    { id: "verification", label: "Verification (KYC)", icon: FiShield },
    { id: "policies", label: "Store Policies", icon: FiGlobe },
    { id: "social", label: "Social Media", icon: FiImage },
  ];

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading vendor information...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-full overflow-x-hidden">
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Store Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Configure your store identity and information
        </p>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-full overflow-x-hidden">
        <div className="border-b border-gray-200 overflow-x-hidden">
          <div className="flex overflow-x-auto scrollbar-hide -mx-1 px-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b-2 transition-colors whitespace-nowrap text-xs sm:text-sm ${activeSection === section.id
                    ? "border-purple-600 text-purple-600 font-semibold"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}>
                  <Icon className="text-base sm:text-lg" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6">
          {/* Store Identity Section */}
          {activeSection === "identity" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Store Logo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*, image/avif, .avif"
                      onChange={(e) => handleImageUpload(e, "storeLogo")}
                      className="hidden"
                      id="store-logo-upload"
                      disabled={isUploadingLogo}
                    />
                    <label
                      htmlFor="store-logo-upload"
                      className={`flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed ${isUploadingLogo ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-primary-300 hover:border-primary-500 hover:bg-primary-50 cursor-pointer'} rounded-lg transition-colors bg-white`}
                    >
                      <FiUpload className={`text-base ${isUploadingLogo ? 'text-gray-400' : 'text-primary-600'}`} />
                      <span className={`text-sm font-medium ${isUploadingLogo ? 'text-gray-400' : 'text-gray-700'}`}>
                        {isUploadingLogo ? "Uploading..." : formData.storeLogo ? "Change Logo" : "Upload Logo"}
                      </span>
                    </label>
                  </div>
                  {formData.storeLogo && (
                    <div className="mt-3 flex items-start gap-3">
                      <img src={formData.storeLogo} alt="Logo" className="w-16 h-16 object-contain border rounded shadow-sm bg-gray-50" />
                      <button type="button" onClick={() => setFormData(prev => ({...prev, storeLogo: ""}))} className="text-xs text-red-500 hover:underline mt-1">Remove</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Store Banner
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*, image/avif, .avif"
                      onChange={(e) => handleImageUpload(e, "storeBanner")}
                      className="hidden"
                      id="store-banner-upload"
                      disabled={isUploadingBanner}
                    />
                    <label
                      htmlFor="store-banner-upload"
                      className={`flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed ${isUploadingBanner ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-primary-300 hover:border-primary-500 hover:bg-primary-50 cursor-pointer'} rounded-lg transition-colors bg-white`}
                    >
                      <FiUpload className={`text-base ${isUploadingBanner ? 'text-gray-400' : 'text-primary-600'}`} />
                      <span className={`text-sm font-medium ${isUploadingBanner ? 'text-gray-400' : 'text-gray-700'}`}>
                        {isUploadingBanner ? "Uploading..." : formData.storeBanner ? "Change Banner" : "Upload Banner"}
                      </span>
                    </label>
                  </div>
                  {formData.storeBanner && (
                    <div className="mt-3 flex flex-col items-start gap-2">
                      <img src={formData.storeBanner} alt="Banner" className="w-full h-24 object-cover border rounded shadow-sm bg-gray-50" />
                      <button type="button" onClick={() => setFormData(prev => ({...prev, storeBanner: ""}))} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Store Description
                  </label>
                  <textarea
                    name="storeDescription"
                    value={formData.storeDescription || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief description of your store"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Timezone
                  </label>
                  <AnimatedSelect
                    name="timezone"
                    value={formData.timezone || "UTC"}
                    onChange={handleChange}
                    options={[
                      { value: "UTC", label: "UTC" },
                      { value: "America/New_York", label: "Eastern Time" },
                      { value: "America/Chicago", label: "Central Time" },
                      { value: "America/Denver", label: "Mountain Time" },
                      { value: "America/Los_Angeles", label: "Pacific Time" },
                      { value: "Asia/Kolkata", label: "IST (India)" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Currency
                  </label>
                  <AnimatedSelect
                    name="currency"
                    value={formData.currency || "INR"}
                    onChange={handleChange}
                    options={[
                      { value: "INR", label: "INR (₹) - Indian Rupee" },
                      { value: "USD", label: "USD ($) - US Dollar" },
                      { value: "EUR", label: "EUR (€) - Euro" },
                      { value: "GBP", label: "GBP (£) - British Pound" },
                      { value: "CAD", label: "CAD ($) - Canadian Dollar" },
                      { value: "AUD", label: "AUD ($) - Australian Dollar" },
                      { value: "SGD", label: "SGD ($) - Singapore Dollar" },
                      { value: "AED", label: "AED (د.إ) - UAE Dirham" },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Info Section */}
          {activeSection === "contact" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <SearchablePhoneInput
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Street, City, State ZIP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Hours
                  </label>
                  <input
                    type="text"
                    name="businessHours"
                    value={formData.businessHours || ""}
                    onChange={handleChange}
                    placeholder="Mon-Fri 9AM-6PM"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Verification KYC Section */}
          {activeSection === "verification" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1.5">Verification (KYC) Details</h3>
                <p className="text-xs text-gray-500">Your registration and business documents approved by the administrator.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 font-medium">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-400 block font-normal">Vendor Type</span>
                    <div className="mt-1 flex">
                      <Badge variant={String(vendor.vendorType || "Individual").toLowerCase()}>
                        {vendor.vendorType || "Individual"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block font-normal">Registered Country</span>
                    <span className="text-sm text-gray-800">{vendor.vendorCountry || "N/A"}</span>
                  </div>
                  {String(vendor.vendorType || '').toLowerCase() === 'business' && (
                    <>
                      <div>
                        <span className="text-xs text-gray-400 block font-normal">Legal Business Name</span>
                        <span className="text-sm text-gray-800">{vendor.businessName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-normal">Business Type</span>
                        <span className="text-sm text-gray-800">{vendor.businessType || "N/A"}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  {String(vendor.vendorType || '').toLowerCase() === 'business' && (
                    <>
                      <div>
                        <span className="text-xs text-gray-400 block font-normal">Business Address</span>
                        <span className="text-sm text-gray-800">{vendor.businessAddress || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-normal">Document Type</span>
                        <span className="text-sm text-gray-800">{vendor.kycDocumentType || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-normal">Business Document</span>
                        {vendor.kycDocumentUrl ? (
                          <a 
                            href={vendor.kycDocumentUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-semibold"
                          >
                            <FiFileText />
                            View Business Doc
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No document uploaded</span>
                        )}
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-xs text-gray-400 block font-normal">Government Issued ID</span>
                    {vendor.governmentIdDocumentUrl ? (
                      <a 
                        href={vendor.governmentIdDocumentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-semibold"
                      >
                        <FiFileText />
                        View Gov ID
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-normal">No ID uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Store Policies Section */}
          {activeSection === "policies" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    General Store Policies
                  </label>
                  <textarea
                    name="storePolicies"
                    value={formData.storePolicies || ""}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe your store's general rules and operations"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Refund & Return Policy
                  </label>
                  <textarea
                    name="refundPolicy"
                    value={formData.refundPolicy || ""}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Outline your conditions for returns and refunds"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shipping Policy
                  </label>
                  <textarea
                    name="shippingPolicy"
                    value={formData.shippingPolicy || ""}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Outline shipping times, methods, and processing"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Social Media Section */}
          {activeSection === "social" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia?.facebook || ""}
                    onChange={(e) =>
                      handleSocialMediaChange("facebook", e.target.value)
                    }
                    placeholder="https://facebook.com/yourpage"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia?.instagram || ""}
                    onChange={(e) =>
                      handleSocialMediaChange("instagram", e.target.value)
                    }
                    placeholder="https://instagram.com/yourpage"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia?.twitter || ""}
                    onChange={(e) =>
                      handleSocialMediaChange("twitter", e.target.value)
                    }
                    placeholder="https://twitter.com/yourpage"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia?.linkedin || ""}
                    onChange={(e) =>
                      handleSocialMediaChange("linkedin", e.target.value)
                    }
                    placeholder="https://linkedin.com/company/yourpage"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection !== "verification" && (
            <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold text-sm sm:text-base w-full sm:w-auto">
                <FiSave />
                Save Settings
              </button>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
};

export default StoreSettings;

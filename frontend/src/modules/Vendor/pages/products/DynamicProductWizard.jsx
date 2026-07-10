import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiSave, FiUpload, FiX, FiCheckCircle } from "react-icons/fi";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { useBrandStore } from "../../../../shared/store/brandStore";
import { useVendorProductStore } from "../../store/vendorProductStore";
import { uploadVendorImage, uploadVendorImages, uploadVendorVideo } from "../../services/vendorService";
import toast from "react-hot-toast";

// Import step components
import StepProductType from "./StepProductType";
import StepCategorySelect from "./StepCategorySelect";
import StepArtMatrix from "./StepArtMatrix";
import StepDigitalUpload from "./StepDigitalUpload";

const FABRIC_TYPES = ["Voil", "Ruby", "Mix (Rub & Voil)"];

const TurbanFabricSection = ({ fabrics = [], onChange }) => {
  const [otherName, setOtherName] = useState("");
  const [otherPrice, setOtherPrice] = useState("");

  const toggleFabric = (type) => {
    const existing = fabrics.find((f) => f.type === type);
    if (existing) {
      onChange(fabrics.filter((f) => f.type !== type));
    } else {
      onChange([...fabrics, { type, price: "" }]);
    }
  };

  const updateFabricPrice = (type, price) => {
    onChange(fabrics.map((f) => f.type === type ? { ...f, price: price === "" ? "" : Number(price) } : f));
  };

  const addOtherFabric = () => {
    const trimmed = otherName.trim();
    if (!trimmed) { toast.error("Enter a fabric name"); return; }
    if (!otherPrice) { toast.error("Enter price for this fabric"); return; }
    if (fabrics.find((f) => f.type.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This fabric already exists"); return;
    }
    onChange([...fabrics, { type: trimmed, price: Number(otherPrice), isCustom: true }]);
    setOtherName(""); setOtherPrice("");
  };

  const removeFabric = (type) => {
    onChange(fabrics.filter((f) => f.type !== type));
  };

  return (
    <div className="border border-amber-250 rounded-xl p-4 bg-amber-50/60 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
        <h3 className="text-sm font-bold text-amber-805">Fabric Options Setup</h3>
        <span className="text-xs text-amber-600">(Select available fabrics and set price/meter)</span>
      </div>

      <div className="space-y-2">
        {FABRIC_TYPES.map((type) => {
          const selected = fabrics.find((f) => f.type === type);
          return (
            <div key={type} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-amber-100">
              <input
                type="checkbox"
                id={`fabric-${type}`}
                checked={!!selected}
                onChange={() => toggleFabric(type)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <label htmlFor={`fabric-${type}`} className="text-xs font-semibold text-gray-700 flex-1 cursor-pointer">{type}</label>
              {selected && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selected.price}
                    onChange={(e) => updateFabricPrice(type, e.target.value)}
                    placeholder="Price/meter *"
                    className="w-28 px-2 py-1 border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Custom fabric rows */}
        {fabrics.filter((f) => f.isCustom).map((f) => (
          <div key={f.type} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-amber-200">
            <span className="text-xs font-semibold text-gray-700 flex-1">{f.type} <span className="text-amber-600 text-[10px]">(Custom)</span></span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={f.price}
                onChange={(e) => updateFabricPrice(f.type, e.target.value)}
                placeholder="Price/meter *"
                className="w-28 px-2 py-1 border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white"
              />
            </div>
            <button type="button" onClick={() => removeFabric(f.type)} className="p-1 text-red-450 hover:text-red-650 hover:bg-red-50 rounded transition-colors text-xs font-bold">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add Other Fabric */}
      <div className="border-t border-amber-200 pt-3">
        <p className="text-xs font-semibold text-amber-700 mb-2">+ Add Other Fabric Type</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
            placeholder="Fabric name (e.g. Silk)"
            className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs bg-white"
          />
          <input
            type="number"
            value={otherPrice}
            onChange={(e) => setOtherPrice(e.target.value)}
            placeholder="₹ Price/meter *"
            className="w-32 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs bg-white"
          />
          <button type="button" onClick={addOtherFabric} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-750 transition-colors shadow-sm whitespace-nowrap">
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const TurbanAdvancedConfig = ({ config = {}, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const update = (key, val) => onChange({ ...config, [key]: { ...config[key], ...val } });

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors border-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-sm font-bold text-indigo-805">Services Add-Ons</span>
          {(config.embroidery?.enabled || config.giftWrap?.enabled) && (
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              {[config.embroidery?.enabled && 'Embroidery', config.giftWrap?.enabled && 'Gift Wrap'].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        <span className="text-xs text-indigo-600 font-bold">{isOpen ? "Hide Options" : "Show Options"}</span>
      </button>

      {isOpen && (
        <div className="bg-white p-4 space-y-4 border-t border-indigo-100">
          {/* Embroidery */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.embroidery?.enabled || false}
                onChange={(e) => update('embroidery', { enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-800">Embroidery Service</span>
                <p className="text-[11px] text-gray-500">Enable custom embroidery on this turban</p>
              </div>
            </label>
            {config.embroidery?.enabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">Embroidery Service Surcharge (₹) *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.embroidery?.price || ""}
                  onChange={(e) => update('embroidery', { price: e.target.value === "" ? "" : Number(e.target.value) })}
                  placeholder="e.g. 250"
                  className="w-36 px-2.5 py-1.5 border border-red-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white"
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Gift Wrapper */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.giftWrap?.enabled || false}
                onChange={(e) => update('giftWrap', { enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-800">Premium Gift Wrapping</span>
                <p className="text-[11px] text-gray-500">Offer gift packaging option for checkout</p>
              </div>
            </label>
            {config.giftWrap?.enabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">Gift Wrapping Surcharge (₹) *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.giftWrap?.price || ""}
                  onChange={(e) => update('giftWrap', { price: e.target.value === "" ? "" : Number(e.target.value) })}
                  placeholder="e.g. 50"
                  className="w-36 px-2.5 py-1.5 border border-red-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TurbanColorPanel = ({ colors = [], colorHexMap = {}, imageMap = {}, onChange }) => {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [photo, setPhoto] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const response = await uploadVendorImage(file);
      const data = response.data || response;
      if (data?.url) {
        setPhoto(data.url);
        toast.success("Color photo uploaded");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddColor = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Color name is required");
      return;
    }
    if (!photo) {
      toast.error("Color photo is required");
      return;
    }

    const nextColors = [...colors, trimmedName];
    const nextHex = { ...colorHexMap, [trimmedName]: hex };
    const nextImages = { ...imageMap, [trimmedName]: photo };

    onChange(nextColors, nextHex, nextImages, photo);
    setName("");
    setHex("#000000");
    setPhoto("");
  };

  const handleRemoveColor = (c) => {
    const nextColors = colors.filter(x => x !== c);
    const nextHex = { ...colorHexMap };
    delete nextHex[c];
    const nextImages = { ...imageMap };
    delete nextImages[c];
    onChange(nextColors, nextHex, nextImages);
  };

  return (
    <div className="border border-indigo-150 rounded-xl p-4 bg-indigo-50/10 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Turban Colors & Showcase Photos</h3>
        <p className="text-xs text-gray-400">Configure catalog colors. Every color option requires a custom photo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border items-center">
        <input
          type="text"
          placeholder="Color Name (e.g. Royal Blue)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 outline-none"
        />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0 bg-white"
          />
          <span className="text-xs font-mono font-bold text-gray-650">{hex}</span>
        </div>
        <div className="flex items-center gap-2">
          {photo ? (
            <div className="relative w-8 h-8 rounded overflow-hidden border">
              <img src={photo} alt="color-preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <label className="flex-1 flex items-center justify-center border border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 text-[10px] font-bold py-2 px-1 bg-white text-indigo-750">
              {isUploading ? "Uploading..." : "Upload Photo"}
              <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </label>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddColor}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          Add Color
        </button>
      </div>

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-2">
          {colors.map((c) => (
            <div key={c} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-150 rounded-xl text-xs font-semibold shadow-sm">
              <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: colorHexMap[c] }} />
              <span className="text-gray-700 font-bold">{c}</span>
              {imageMap[c] && (
                <img src={imageMap[c]} alt="color" className="w-6 h-6 rounded object-cover border" />
              )}
              <button
                type="button"
                onClick={() => handleRemoveColor(c)}
                className="text-red-500 hover:text-red-750 font-bold ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function DynamicProductWizard({ isEdit = false, productId = null }) {
  const navigate = useNavigate();
  const { categories, initialize: initCategories } = useCategoryStore();
  const { brands, initialize: initBrands } = useBrandStore();
  const { addProduct, editProduct, fetchProductById } = useVendorProductStore();

  const [activeStepIndex, setActiveStepIndex] = useState(isEdit ? 2 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);

  // Unified Form State
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    price: "",
    originalPrice: "",
    image: "",
    images: [],
    video: "",
    categoryId: null,
    subcategoryId: null,
    brandId: null,
    stock: "in_stock",
    stockQuantity: "",
    totalAllowedQuantity: "",
    minimumOrderQuantity: "",
    warrantyPeriod: "",
    guaranteePeriod: "",
    hsnCode: "",
    flashSale: false,
    isNewArrival: false,
    isFeatured: false,
    isVisible: true,
    codAllowed: true,
    returnable: true,
    cancelable: true,
    taxIncluded: false,
    description: "",
    tags: [],
    variants: {
      sizes: [],
      colors: [],
      materials: [],
      attributes: [],
      prices: {},
      stockMap: {},
      imageMap: {},
      skuMap: {},
      defaultVariant: {},
      defaultSelection: {},
    },
    seoTitle: "",
    seoDescription: "",
    relatedProducts: [],
    faqs: [],
    turbanConfig: {
      fabric: [],
      embroidery: { enabled: false, price: "" },
      giftWrap: { enabled: false, price: "" },
    },
    productType: "physical",
    digitalConfig: {
      digitalFile: "",
      previewFile: "",
      license: "personal",
      fileSize: "",
      fileType: "",
      downloadLimit: "",
      version: "1.0.0"
    }
  });

  // Load Categories and Brands
  useEffect(() => {
    initCategories();
    initBrands();
  }, []);

  // If in edit mode, fetch product details
  useEffect(() => {
    if (isEdit && productId) {
      setLoadingProduct(true);
      fetchProductById(productId)
        .then((res) => {
          const product = res?.data || res;
          if (product) {
            setFormData({
              name: product.name || "",
              unit: product.unit || "",
              price: product.price || "",
              originalPrice: product.originalPrice || "",
              image: product.image || "",
              images: product.images || [],
              video: product.video || "",
              categoryId: product.categoryId?.id || product.categoryId?._id || product.categoryId || null,
              subcategoryId: product.subcategoryId?.id || product.subcategoryId?._id || product.subcategoryId || null,
              brandId: product.brandId?.id || product.brandId?._id || product.brandId || null,
              stock: product.stock || "in_stock",
              stockQuantity: product.stockQuantity || "",
              totalAllowedQuantity: product.totalAllowedQuantity || "",
              minimumOrderQuantity: product.minimumOrderQuantity || "",
              warrantyPeriod: product.warrantyPeriod || "",
              guaranteePeriod: product.guaranteePeriod || "",
              hsnCode: product.hsnCode || "",
              flashSale: !!product.flashSale,
              isNewArrival: !!product.isNewArrival,
              isFeatured: !!product.isFeatured,
              isVisible: product.isVisible !== false,
              codAllowed: product.codAllowed !== false,
              returnable: product.returnable !== false,
              cancelable: product.cancelable !== false,
              taxIncluded: !!product.taxIncluded,
              description: product.description || "",
              tags: product.tags || [],
              variants: product.variants || {
                sizes: [],
                colors: [],
                materials: [],
                attributes: [],
                prices: {},
                stockMap: {},
                imageMap: {},
                skuMap: {},
                defaultVariant: {},
                defaultSelection: {},
              },
              seoTitle: product.seoTitle || "",
              seoDescription: product.seoDescription || "",
              relatedProducts: product.relatedProducts || [],
              faqs: product.faqs || [],
              turbanConfig: product.turbanConfig || {
                fabric: [],
                embroidery: { enabled: false, price: "" },
                giftWrap: { enabled: false, price: "" },
              },
              productType: product.productType || "physical",
              digitalConfig: product.digitalConfig || {
                digitalFile: "",
                previewFile: "",
                license: "personal",
                fileSize: "",
                fileType: "",
                downloadLimit: "",
                version: "1.0.0"
              }
            });
          }
        })
        .catch((err) => {
          toast.error("Failed to load product details");
          console.error(err);
        })
        .finally(() => {
          setLoadingProduct(false);
        });
    }
  }, [isEdit, productId]);

  // Resolve parent and subcategory from DB categoryId once categories load
  useEffect(() => {
    if (categories && categories.length > 0 && formData.categoryId && !formData.subcategoryId) {
      const matchedCat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));
      if (matchedCat && matchedCat.parentId) {
        const parentId = typeof matchedCat.parentId === 'object'
          ? (matchedCat.parentId.id || matchedCat.parentId._id)
          : matchedCat.parentId;
        setFormData(prev => ({
          ...prev,
          categoryId: parentId,
          subcategoryId: prev.categoryId
        }));
      }
    }
  }, [categories, formData.categoryId, formData.subcategoryId]);

  // Industry detection helpers
  const isTurban = useMemo(() => {
    if (!categories || categories.length === 0) return false;
    const cat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));
    const sub = categories.find(c => String(c.id || c._id) === String(formData.subcategoryId));
    return (
      (cat && cat.name.toLowerCase().includes("turban")) ||
      (sub && sub.name.toLowerCase().includes("turban"))
    );
  }, [categories, formData.categoryId, formData.subcategoryId]);

  const isKada = useMemo(() => {
    if (!categories || categories.length === 0) return false;
    const cat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));
    const sub = categories.find(c => String(c.id || c._id) === String(formData.subcategoryId));
    return (
      (cat && (cat.name.toLowerCase().includes("kada") || cat.name.toLowerCase().includes("bangle"))) ||
      (sub && (sub.name.toLowerCase().includes("kada") || sub.name.toLowerCase().includes("bangle"))) ||
      formData.name.toLowerCase().includes("kada")
    );
  }, [categories, formData.categoryId, formData.subcategoryId, formData.name]);

  useEffect(() => {
    if (isTurban) {
      setFormData((prev) => ({ ...prev, unit: "Meter" }));
    } else if (isKada) {
      setFormData((prev) => ({ ...prev, unit: "Diameter" }));
    }
  }, [isTurban, isKada]);

  // Dynamic step list assembly
  const steps = useMemo(() => {
    const defaultSteps = ["product_type", "category_select"];
    if (!formData.categoryId || !categories) return defaultSteps;

    const targetCategoryId = formData.subcategoryId || formData.categoryId;
    const targetCat = categories.find(c => String(c.id || c._id) === String(targetCategoryId));
    const parentCat = categories.find(c => String(c.id || c._id) === String(formData.categoryId));

    const isArtCategory = (targetCat && String(targetCat.name || "").toLowerCase().includes("art")) || 
                          (parentCat && String(parentCat.name || "").toLowerCase().includes("art"));

    let resolvedSteps = [];

    // Assemble steps according to the category/subcategory config
    if (targetCat && Array.isArray(targetCat.workflowSteps) && targetCat.workflowSteps.length > 0) {
      const customSteps = [];
      let hasArtMatrix = false;
      let hasDigitalUpload = false;

      targetCat.workflowSteps.forEach(step => {
        if (["art_dimensions", "art_canvas_types", "art_frame_types", "pricing_matrix"].includes(step)) {
          if (!hasArtMatrix) {
            customSteps.push("art_matrix");
            hasArtMatrix = true;
          }
        } else if (["upload_files", "license"].includes(step)) {
          if (!hasDigitalUpload) {
            customSteps.push("digital_upload");
            hasDigitalUpload = true;
          }
        } else {
          customSteps.push(step);
        }
      });
      resolvedSteps = [...defaultSteps, ...customSteps];
    } else {
      // Default Fallback flow if no config is declared
      if (isArtCategory) {
        resolvedSteps = [...defaultSteps, "basic_info", "art_matrix", "shipping", "seo", "preview", "publish"];
      } else if (formData.productType === "digital") {
        resolvedSteps = [...defaultSteps, "basic_info", "digital_upload", "pricing", "seo", "preview", "publish"];
      } else {
        resolvedSteps = [...defaultSteps, "basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"];
      }
    }

    if (isTurban) {
      resolvedSteps = resolvedSteps.filter(s => s !== "shipping");
    }

    return resolvedSteps;
  }, [formData.productType, formData.categoryId, formData.subcategoryId, categories, isTurban]);

  const activeStep = steps[activeStepIndex] || "product_type";

  // Form State Mutator helper
  const updateForm = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    // Basic validations
    if (activeStep === "product_type" && !formData.productType) {
      toast.error("Please select product type");
      return;
    }
    if (activeStep === "category_select") {
      if (!formData.categoryId) {
        toast.error("Please select category");
        return;
      }
      // Check if this category has subcategories
      const hasSubs = categories.some(cat => String(cat.parentId || "") === String(formData.categoryId));
      if (hasSubs && !formData.subcategoryId) {
        toast.error("Please select subcategory");
        return;
      }
    }
    if (activeStep === "basic_info") {
      if (!formData.name.trim()) { toast.error("Product name is required"); return; }
      if (!formData.image) { toast.error("Main product image is required"); return; }
    }
    if (activeStep === "digital_upload") {
      if (!formData.digitalConfig.digitalFile) { toast.error("Please upload the digital file asset"); return; }
    }
    if (activeStep === "pricing") {
      if (!formData.price || Number(formData.price) <= 0) { toast.error("Please enter a valid price"); return; }
    }

    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    const minIndex = isEdit ? 2 : 0;
    if (activeStepIndex > minIndex) {
      setActiveStepIndex(prev => prev - 1);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const response = await uploadVendorImage(file);
      const data = response.data || response;
      if (data?.url) {
        updateForm({ image: data.url });
        toast.success("Main image uploaded");
      }
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingMedia(true);
    try {
      const response = await uploadVendorImages(files);
      const data = response.data || response;
      const urls = Array.isArray(data) ? data.map(u => u.url) : [data.url];
      updateForm({ images: [...formData.images, ...urls] });
      toast.success("Gallery images added");
    } catch {
      toast.error("Gallery upload failed");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Build sanitized payload matching Joi validation expectations on the backend
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        unit: formData.unit || "Piece",
        categoryId: typeof formData.categoryId === 'object' && formData.categoryId !== null
          ? (formData.categoryId.id || formData.categoryId._id)
          : formData.categoryId,
        subcategoryId: (typeof formData.subcategoryId === 'object' && formData.subcategoryId !== null
          ? (formData.subcategoryId.id || formData.subcategoryId._id)
          : formData.subcategoryId) || undefined,
        brandId: (typeof formData.brandId === 'object' && formData.brandId !== null
          ? (formData.brandId.id || formData.brandId._id)
          : formData.brandId) || undefined,
        stock: formData.stock,
        stockQuantity: formData.stockQuantity !== "" ? Number(formData.stockQuantity) : undefined,
        totalAllowedQuantity: formData.totalAllowedQuantity !== "" ? Number(formData.totalAllowedQuantity) : undefined,
        minimumOrderQuantity: formData.minimumOrderQuantity !== "" ? Number(formData.minimumOrderQuantity) : undefined,
        warrantyPeriod: formData.warrantyPeriod || undefined,
        guaranteePeriod: formData.guaranteePeriod || undefined,
        hsnCode: formData.hsnCode || undefined,
        flashSale: !!formData.flashSale,
        isNewArrival: !!formData.isNewArrival,
        isFeatured: !!formData.isFeatured,
        isVisible: !!formData.isVisible,
        codAllowed: !!formData.codAllowed,
        returnable: !!formData.returnable,
        cancelable: !!formData.cancelable,
        taxIncluded: !!formData.taxIncluded,
        image: formData.image || undefined,
        images: formData.images || [],
        video: formData.video || undefined,
        tags: formData.tags || [],
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        faqs: formData.faqs || [],
        productType: formData.productType || "physical",
      };

      if (formData.productType === "physical") {
        payload.variants = formData.variants;
        if (isTurban) {
          payload.turbanConfig = formData.turbanConfig;
        }
      } else {
        payload.digitalConfig = formData.digitalConfig;
      }

      payload.isActive = !isDraft;
      payload.isVisible = !isDraft;

      if (isEdit) {
        await editProduct(productId, payload);
        toast.success(isDraft ? "Draft saved successfully" : "Product updated successfully");
      } else {
        await addProduct(payload);
        toast.success(isDraft ? "Draft created successfully" : "Product published successfully");
      }
      navigate("/vendor/products");
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.message || "Submission failed";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Step Tracker Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-serif">
            {isEdit ? "Edit Product Listing" : "Create New Product Listing"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Dynamic Listing Wizard Engine</p>
        </div>

        {/* Steps Progress Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isActive = idx === activeStepIndex;
            return (
              <div
                key={step}
                className={`h-2.5 rounded-full transition-all duration-300 ${isActive
                    ? "w-8 bg-primary-600"
                    : isCompleted
                      ? "w-4 bg-green-500"
                      : "w-2.5 bg-gray-200"
                  }`}
                title={`Step ${idx + 1}: ${step}`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Step Render Container */}
      <div className="min-h-[350px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeStep === "product_type" && (
              <StepProductType
                value={formData.productType}
                onChange={(val) => updateForm({ productType: val })}
                isEdit={isEdit}
              />
            )}

            {activeStep === "category_select" && (
              <StepCategorySelect
                formData={formData}
                onChange={updateForm}
                isEdit={isEdit}
              />
            )}

            {activeStep === "art_matrix" && (
              <StepArtMatrix
                formData={formData}
                onChange={updateForm}
              />
            )}

            {activeStep === "digital_upload" && (
              <StepDigitalUpload
                formData={formData}
                onChange={updateForm}
              />
            )}

            {activeStep === "basic_info" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Basic Product Details</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Enter product title, tags, and display media assets.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => updateForm({ name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="e.g. Printed Silk Turban"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Brand / Manufacturer
                    </label>
                    <select
                      value={formData.brandId || ""}
                      onChange={e => updateForm({ brandId: e.target.value || null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="">No Brand Selected</option>
                      {brands.map(b => (
                        <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Main Media Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Main Showcase Image *
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.image ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                          <img src={formData.image} alt="main" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateForm({ image: "" })}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <FiUpload className="w-6 h-6 text-gray-400" />
                          <span className="text-[10px] text-gray-500 mt-1 font-bold">Upload</span>
                          <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                        </label>
                      )}
                      <p className="text-xs text-gray-400 leading-relaxed">
                        This is the primary display image that users will see first in lists and cards. Max file size: 5MB.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Gallery Images
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                          <img src={img} alt="gallery" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateForm({ images: formData.images.filter((_, i) => i !== index) })}
                            className="absolute top-0.5 right-0.5 bg-red-650 text-white rounded-full p-0.5 hover:bg-red-750 transition-colors"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <FiUpload className="w-4 h-4 text-gray-400" />
                        <span className="text-[9px] text-gray-500 font-bold">Add</span>
                        <input type="file" multiple onChange={handleGalleryUpload} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => updateForm({ description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    placeholder="Enter detailed description..."
                  />
                </div>

                {isTurban && (
                  <div className="space-y-5 border-t border-gray-100 pt-5 mt-5">
                    <TurbanFabricSection
                      fabrics={formData.turbanConfig?.fabric || []}
                      onChange={(fabric) => updateForm({ turbanConfig: { ...formData.turbanConfig, fabric } })}
                    />
                    <TurbanColorPanel
                      colors={formData.variants?.colors || []}
                      colorHexMap={formData.variants?.colorHexMap || {}}
                      imageMap={formData.variants?.imageMap || {}}
                      onChange={(colors, colorHexMap, imageMap, newPhoto) => {
                        const updates = {
                          variants: {
                            ...formData.variants,
                            colors,
                            colorHexMap,
                            imageMap
                          }
                        };
                        if (newPhoto && !formData.images.includes(newPhoto)) {
                          updates.images = [...formData.images, newPhoto];
                        }
                        updateForm(updates);
                      }}
                    />
                    <TurbanAdvancedConfig
                      config={formData.turbanConfig}
                      onChange={(updates) => updateForm({ turbanConfig: updates })}
                    />
                  </div>
                )}
              </div>
            )}

            {activeStep === "pricing" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pricing Setup</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Configure base pricing, taxes, and discounts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => updateForm({ price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="e.g. 1500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Original Price (M.R.P) (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={e => updateForm({ originalPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="Leave empty if no discount"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStep === "inventory" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Stock & Inventory</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Manage stock levels, purchase limits, and thresholds.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Stock Status
                    </label>
                    <select
                      value={formData.stock}
                      onChange={e => updateForm({ stock: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={e => updateForm({ stockQuantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="e.g. 50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Minimum Order Qty
                    </label>
                    <input
                      type="number"
                      value={formData.minimumOrderQuantity}
                      onChange={e => updateForm({ minimumOrderQuantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStep === "shipping" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Shipping Settings</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Determine product weight & delivery properties.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Warranty Period
                    </label>
                    <input
                      type="text"
                      value={formData.warrantyPeriod}
                      onChange={e => updateForm({ warrantyPeriod: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="e.g. 6 Months"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Guarantee Period
                    </label>
                    <input
                      type="text"
                      value={formData.guaranteePeriod}
                      onChange={e => updateForm({ guaranteePeriod: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="e.g. 1 Year"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStep === "seo" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">SEO optimization</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Improve search ranking configurations for Google.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      SEO Title Tag
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={e => updateForm({ seoTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="Search engine optimized title"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      SEO Description Tag
                    </label>
                    <textarea
                      value={formData.seoDescription}
                      onChange={e => updateForm({ seoDescription: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      placeholder="Search engine optimized description"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStep === "preview" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Listing Preview</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Verify your details before final launch submission.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl">
                  <div className="w-full h-48 rounded-xl overflow-hidden border bg-white">
                    <img src={formData.image || "/placeholder.png"} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="text-lg font-black text-gray-800">{formData.name || "Untitled Product"}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      Type: <span className="text-primary-600 font-bold capitalize">{formData.productType}</span>
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed max-h-24 overflow-y-auto">
                      {formData.description || "No description provided."}
                    </p>
                    <div className="flex gap-4 items-center">
                      <span className="text-xl font-black text-gray-900">₹{formData.price || "0.00"}</span>
                      {formData.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">₹{formData.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === "publish" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 text-center space-y-6">
                <div className="flex justify-center">
                  <FiCheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ready to Publish!</h2>
                  <p className="text-sm text-gray-500 mt-1.5">
                    Your listing is complete and ready. Select below to save as draft or publish to marketplace.
                  </p>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-gray-350 hover:bg-gray-100 rounded-xl font-bold text-sm text-gray-700 transition-colors shadow-sm"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm hover:bg-primary-700 transition-all shadow-md"
                  >
                    {isSubmitting ? "Submitting..." : "Publish Product"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons Footer */}
      {activeStep !== "publish" && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeStepIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl font-semibold text-xs text-gray-700 transition-colors ${activeStepIndex === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
              }`}
          >
            <FiArrowLeft className="w-4 h-4" /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl text-xs hover:bg-primary-700 transition-colors shadow-sm"
          >
            Next <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

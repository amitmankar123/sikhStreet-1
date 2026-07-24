import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSave, FiArrowRight, FiArrowLeft, FiCheck, FiUpload, FiTrash2, FiCopy } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useVendorProductStore } from "../../store/vendorProductStore";
import { uploadVendorImage, uploadVendorImages, uploadVendorVideo } from "../../services/vendorService";
import { buildVariantPayload, createDynamicVariantKey } from "../../utils/variantHelpers";

// The overall state defaults
const initialArtState = {
  // Step 2: Basic Info
  name: "",
  artistName: "",
  collectionName: "",
  shortDescription: "",
  description: "",
  image: null,
  images: [], // other images
  video: "",
  sku: "",
  medium: "",
  style: "",
  orientation: "Portrait",
  yearCreated: new Date().getFullYear().toString(),
  isSigned: false,
  hasCertificate: false,
  readyToHang: false,
  isOneOfAKind: false,

  // Step 3: Configuration (Checked values)
  selectedDimensions: [],
  selectedCanvasTypes: [],
  selectedFrames: [],

  // Step 4: Pricing Matrix & Global Inventory
  totalInventory: "",
  // key: "Dimension|Canvas|Frame" => { price, costPrice, sku }
  pricingMatrix: {}, 

  // Step 6: Shipping
  packageWeight: "",
  packageDimensions: { length: "", width: "", height: "" },
  processingTime: "1-3 Business Days",
  isFreeShipping: false,
  madeToOrder: true,

  // Step 7: SEO
  seoTitle: "",
  seoDescription: "",
  tags: []
};

const DIMENSION_OPTIONS = ["8x10", "12x16", "16x20", "20x30", "24x36", "30x40"];
const CANVAS_OPTIONS = ["Rolled Canvas", "Stretched Canvas", "Canvas Print", "Fine Art Paper"];
const FRAME_OPTIONS = ["Frameless", "Wooden Frame", "Black Frame", "White Frame", "Oak Frame", "Gold Metal Frame"];
const MEDIUM_OPTIONS = ["Oil", "Acrylic", "Watercolor", "Mixed Media", "Charcoal", "Ink", "Digital"];
const STYLE_OPTIONS = ["Abstract", "Modern", "Landscape", "Portrait", "Minimal", "Pop Art", "Contemporary"];

export default function ArtListingWizard({ vendor, categoryId, subcategoryId, categoryName, subcategoryName, isEdit, productToEdit }) {
  const navigate = useNavigate();
  const { addProduct, editProduct } = useVendorProductStore();
  const [currentStep, setCurrentStep] = useState(2); // Start at 2 since 1 was Category Selection
  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("draft_art_listing");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return initialArtState; }
    }
    return initialArtState;
  });

  // Auto-save draft (only if not editing)
  useEffect(() => {
    if (!isEdit) {
      localStorage.setItem("draft_art_listing", JSON.stringify(formData));
    }
  }, [formData, isEdit]);

  // Load existing product if editing
  useEffect(() => {
    if (isEdit && productToEdit && (productToEdit.id || productToEdit._id)) {
      const dimSet = new Set();
      const canvasSet = new Set();
      const frameSet = new Set();
      if (productToEdit.variants?.attributes) {
        productToEdit.variants.attributes.forEach(attr => {
          if (attr.name === "Dimension") attr.values.forEach(v => dimSet.add(v));
          if (attr.name === "Canvas") attr.values.forEach(v => canvasSet.add(v));
          if (attr.name === "Frame") attr.values.forEach(v => frameSet.add(v));
        });
      }

      const dims = Array.from(dimSet);
      const canvases = Array.from(canvasSet);
      const frames = Array.from(frameSet);

      const pricingMatrix = {};
      
      const iterDims = dims.length > 0 ? dims : ["Default"];
      const iterCanvas = canvases.length > 0 ? canvases : ["Default"];
      const iterFrames = frames.length > 0 ? frames : ["Default"];

      iterDims.forEach(dim => {
        iterCanvas.forEach(canvas => {
          iterFrames.forEach(frame => {
            const wizardKey = `${dim}|${canvas}|${frame}`;
            const selection = {};
            if (dim !== "Default") selection.Dimension = dim;
            if (canvas !== "Default") selection.Canvas = canvas;
            if (frame !== "Default") selection.Frame = frame;
            
            const backendKey = createDynamicVariantKey(selection);
            const price = productToEdit.variants?.prices?.[backendKey];
            if (price !== undefined) {
              pricingMatrix[wizardKey] = { price: String(price), costPrice: "", sku: "" };
            }
          });
        });
      });

      // Specifications
      let medium = "", style = "", orientation = "Portrait", yearCreated = "", artistName = "", isSigned = false, hasCertificate = false;
      if (productToEdit.specifications) {
         const specObj = Array.isArray(productToEdit.specifications) 
           ? productToEdit.specifications.reduce((acc, s) => ({ ...acc, [s.key || s.name]: s.value }), {}) 
           : productToEdit.specifications || {};
           
         medium = specObj.medium || specObj.Medium || "";
         style = specObj.style || specObj.Style || "";
         orientation = specObj.orientation || specObj.Orientation || "Portrait";
         yearCreated = specObj.yearCreated || specObj.Year || "";
         artistName = specObj.artistName || specObj.Artist || "";
         isSigned = Boolean(specObj.isSigned || specObj["Signed by Artist"]);
         hasCertificate = Boolean(specObj.hasCertificate || specObj["Certificate of Authenticity"]);
      }

      setFormData(prev => ({
        ...prev,
        name: productToEdit.name || "",
        // strip out the 'Details' section from description to avoid duplicates on re-save
        description: (productToEdit.description || "").split("**Details:**")[0].trim(),
        image: productToEdit.images?.[0] || null,
        images: productToEdit.images?.slice(1) || [],
        video: productToEdit.video || null,
        totalInventory: String(productToEdit.stockQuantity || ""),
        seoTitle: productToEdit.seoTitle || "",
        seoDescription: productToEdit.seoDescription || "",
        tags: productToEdit.tags || [],
        packageWeight: productToEdit.packageWeight || "",
        sku: productToEdit.sku || "",
        
        selectedDimensions: dims,
        selectedCanvasTypes: canvases,
        selectedFrames: frames,
        pricingMatrix,
        
        medium,
        style,
        orientation,
        yearCreated,
        artistName,
        isSigned,
        hasCertificate,
      }));
    }
  }, [isEdit, productToEdit]);

  const updateForm = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const STEPS = [
    { id: 2, label: "Basic Info" },
    { id: 3, label: "Configuration" },
    { id: 4, label: "Pricing & Stock" },
    { id: 5, label: "Shipping" },
    { id: 6, label: "SEO" },
    { id: 7, label: "Preview & Publish" }
  ];

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 7));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 2));

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      
      // Specific validations
      if (!formData.name) { toast.error("Please enter the Artwork Title in Basic Info."); setIsPublishing(false); return; }
      if (!formData.description) { toast.error("Please enter a Detailed Description in Basic Info."); setIsPublishing(false); return; }
      if (!formData.image) { toast.error("Please upload a Primary Artwork Image in Basic Info."); setIsPublishing(false); return; }
      if (formData.totalInventory === "" || formData.totalInventory === null) { toast.error("Please enter the Total Artwork Inventory in Pricing & Stock."); setIsPublishing(false); return; }

      // 1. Upload Images
      let primaryImageUrl = formData.image;
      if (formData.image instanceof File) {
        const res = await uploadVendorImage(formData.image, "vendors/products");
        const uploaded = res?.data ?? res;
        if (uploaded?.url) primaryImageUrl = uploaded.url;
      }

      let additionalImageUrls = [];
      const newImages = formData.images.filter(img => img instanceof File);
      const existingImages = formData.images.filter(img => typeof img === 'string');
      
      if (newImages.length > 0) {
        const res = await uploadVendorImages(newImages, "vendors/products");
        const uploaded = res?.data ?? res;
        if (Array.isArray(uploaded)) {
          const urls = uploaded.map(u => u.url).filter(Boolean);
          additionalImageUrls = [...existingImages, ...urls];
        }
      } else {
        additionalImageUrls = existingImages;
      }
      
      let videoUrl = formData.video;
      if (formData.video instanceof File) {
        const res = await uploadVendorVideo(formData.video, "vendors/products/videos");
        const uploaded = res?.data ?? res;
        if (uploaded?.url) videoUrl = uploaded.url;
      }

      // 2. Format Variants for Backend
      const attributes = [];
      if (formData.selectedDimensions.length > 0) attributes.push({ name: "Dimension", values: formData.selectedDimensions });
      if (formData.selectedCanvasTypes.length > 0) attributes.push({ name: "Canvas", values: formData.selectedCanvasTypes });
      if (formData.selectedFrames.length > 0) attributes.push({ name: "Frame", values: formData.selectedFrames });

      // Transform our matrix to the format expected by the backend
      const mappedPrices = {};
      Object.keys(formData.pricingMatrix).forEach(key => {
        // key is "Dim|Canvas|Frame"
        const [dim, canvas, frame] = key.split("|");
        const selection = {};
        if (dim && dim !== "Default") selection.Dimension = dim;
        if (canvas && canvas !== "Default") selection.Canvas = canvas;
        if (frame && frame !== "Default") selection.Frame = frame;
        
        const backendKey = createDynamicVariantKey(selection);
        
        if (formData.pricingMatrix[key]?.price) {
          mappedPrices[backendKey] = Number(formData.pricingMatrix[key].price);
        }
      });

      const variantsPayload = buildVariantPayload({
        attributes,
        prices: mappedPrices,
      });

      // Compute min price for base product price
      const priceValues = Object.values(mappedPrices);
      const basePrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;

      // Combine description with specific fields for richness
      const richDescription = `
${formData.shortDescription ? formData.shortDescription + '\n\n' : ''}
${formData.description}

**Details:**
- Medium: ${formData.medium || 'N/A'}
- Style: ${formData.style || 'N/A'}
- Orientation: ${formData.orientation || 'N/A'}
- Year: ${formData.yearCreated || 'N/A'}
${formData.artistName ? `- Artist: ${formData.artistName}` : ''}
${formData.isSigned ? '- Signed by Artist' : ''}
${formData.hasCertificate ? '- Includes Certificate of Authenticity' : ''}
${formData.readyToHang ? '- Ready to Hang' : ''}
      `.trim();

      // 3. Construct Final Payload
      const payload = {
        name: formData.name,
        description: richDescription,
        price: basePrice,
        stockQuantity: Number(formData.totalInventory),
        categoryId: categoryId,
        subcategoryId: subcategoryId || null,
        images: [primaryImageUrl, ...additionalImageUrls],
        video: videoUrl || "",
        brandId: null,
        sku: formData.sku || undefined,
        variants: variantsPayload,
        isActive: true,
        isVisible: true,
        specifications: {
          medium: formData.medium,
          style: formData.style,
          orientation: formData.orientation,
          yearCreated: formData.yearCreated,
          artistName: formData.artistName,
          isSigned: formData.isSigned,
          hasCertificate: formData.hasCertificate
        },
        // Optional Fields
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        packageWeight: formData.packageWeight || undefined,
        isFreeShipping: formData.isFreeShipping,
      };

      // 4. Save to Backend
      let result;
      if (isEdit && productToEdit && (productToEdit.id || productToEdit._id)) {
        const productId = productToEdit.id || productToEdit._id;
        result = await editProduct(productId, payload);
      } else {
        result = await addProduct(payload);
      }
      
      if (result) {
        if (!isEdit) localStorage.removeItem("draft_art_listing");
        toast.success(isEdit ? "Artwork updated successfully!" : "Artwork published successfully!");
        navigate("/vendor/products/manage-products");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish artwork.");
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 2: return <StepBasicInfo formData={formData} updateForm={updateForm} />;
      case 3: return <StepConfig formData={formData} updateForm={updateForm} />;
      case 4: return <StepPricingMatrix formData={formData} updateForm={updateForm} />;
      case 5: return <StepShipping formData={formData} updateForm={updateForm} />;
      case 6: return <StepSEO formData={formData} updateForm={updateForm} />;
      case 7: return <StepPreview formData={formData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-800">
      {/* Sticky Header with Stepper */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {isEdit ? "Edit Artwork" : "Add New Artwork"}
            </h1>
            <div className="flex items-center gap-3">
              {!isEdit && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  Auto-saved
                </span>
              )}
              <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                {isEdit ? "Cancel" : "Save Draft"}
              </button>
            </div>
          </div>
          
          {/* Horizontal Stepper */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {STEPS.map((step, idx) => {
              const isPast = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${isCurrent ? 'bg-indigo-600 text-white shadow-md' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isPast ? <FiCheck className="w-4 h-4" /> : step.id - 1}
                  </div>
                  <span className={`ml-2 text-sm font-bold whitespace-nowrap ${isCurrent ? 'text-indigo-900' : isPast ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <div className="w-8 h-px bg-gray-300 mx-3"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button 
            onClick={handlePrev}
            disabled={currentStep === 2}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FiArrowLeft /> Back
          </button>
          
          <button 
            onClick={currentStep === 7 ? handlePublish : handleNext}
            disabled={isPublishing}
            className="flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isPublishing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : currentStep === 7 ? "Publish Artwork" : "Continue"}
            {!isPublishing && <FiArrowRight />}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- STEPS COMPONENTS ---

const StepBasicInfo = ({ formData, updateForm }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-900 mb-6">Basic Artwork Information</h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Artwork Title *</label>
            <input type="text" value={formData.name} onChange={e => updateForm({ name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-medium" placeholder="e.g. Golden Sunset Canvas" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Artist Name</label>
              <input type="text" value={formData.artistName} onChange={e => updateForm({ artistName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Collection (Optional)</label>
              <input type="text" value={formData.collectionName} onChange={e => updateForm({ collectionName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Short Description</label>
            <input type="text" value={formData.shortDescription} onChange={e => updateForm({ shortDescription: e.target.value })} maxLength={150} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium" placeholder="A brief 1-2 sentence overview..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Detailed Description *</label>
            <textarea value={formData.description} onChange={e => updateForm({ description: e.target.value })} rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium" placeholder="Describe the inspiration, materials used, etc..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">SKU (Optional)</label>
            <input type="text" value={formData.sku} onChange={e => updateForm({ sku: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium" placeholder="Auto-generated if left blank" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-900 mb-6">Media (Images & Video)</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Primary Artwork Image *</label>
            <div className="flex items-center gap-4">
              {formData.image && (
                <img src={formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image} alt="Primary" className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm" />
              )}
              <div className="flex-1 relative">
                <input type="file" accept="image/*, image/avif, .avif" onChange={(e) => {
                  if (e.target.files[0]) updateForm({ image: e.target.files[0] });
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white">
                  <FiUpload className="w-6 h-6 text-indigo-500 mb-2" />
                  <span className="text-sm font-bold text-gray-600">Click or drag primary image</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Additional Angles / Detail Shots</label>
            <div className="relative">
              <input type="file" accept="image/*, image/avif, .avif" multiple onChange={(e) => {
                if (e.target.files.length) {
                  const currentCount = formData.images.length;
                  if (currentCount >= 10) {
                    toast.error("You can upload a maximum of 10 additional images.");
                    return;
                  }
                  let newFiles = Array.from(e.target.files);
                  const availableSlots = 10 - currentCount;
                  if (newFiles.length > availableSlots) {
                    toast.error(`You can only add ${availableSlots} more image(s). Extra images were discarded.`);
                    newFiles = newFiles.slice(0, availableSlots);
                  }
                  updateForm({ images: [...formData.images, ...newFiles] });
                }
              }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white">
                <FiUpload className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-sm font-bold text-gray-600">Click or drag additional images</span>
              </div>
            </div>
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img instanceof File ? URL.createObjectURL(img) : img} alt={`Gallery ${idx}`} className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm" />
                    <button type="button" onClick={() => updateForm({ images: formData.images.filter((_, i) => i !== idx) })} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">{formData.images.length} / 10 additional images</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Product Video (Optional)</label>
            <div className="flex items-center gap-4">
              {formData.video && (
                <div className="relative group w-32 h-20">
                  <video src={formData.video instanceof File ? URL.createObjectURL(formData.video) : formData.video} className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm bg-black" controls />
                  <button type="button" onClick={() => updateForm({ video: null })} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex-1 relative">
                <input type="file" accept="video/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 50 * 1024 * 1024) {
                      toast.error("Video size should be less than 50MB");
                      return;
                    }
                    updateForm({ video: file });
                  }
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white">
                  <FiUpload className="w-6 h-6 text-indigo-500 mb-2" />
                  <span className="text-sm font-bold text-gray-600">Click or drag video (Max 50MB)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-900 mb-6">Artwork Characteristics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Medium</label>
            <select value={formData.medium} onChange={e => updateForm({ medium: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 font-medium">
              <option value="">Select Medium</option>
              {MEDIUM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Style</label>
            <select value={formData.style} onChange={e => updateForm({ style: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 font-medium">
              <option value="">Select Style</option>
              {STYLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Orientation</label>
            <select value={formData.orientation} onChange={e => updateForm({ orientation: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 font-medium">
              <option value="Portrait">Portrait</option>
              <option value="Landscape">Landscape</option>
              <option value="Square">Square</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Year Created</label>
            <input type="text" value={formData.yearCreated} onChange={e => updateForm({ yearCreated: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.isSigned} onChange={e => updateForm({ isSigned: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
            <span className="text-sm font-bold text-gray-700">Signed by Artist</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.hasCertificate} onChange={e => updateForm({ hasCertificate: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
            <span className="text-sm font-bold text-gray-700">Certificate of Authenticity</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.readyToHang} onChange={e => updateForm({ readyToHang: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
            <span className="text-sm font-bold text-gray-700">Ready to Hang</span>
          </label>
        </div>
      </div>
    </div>
  );
};

const StepConfig = ({ formData, updateForm }) => {
  const toggleArray = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const combinationsCount = Math.max(1, formData.selectedDimensions.length) * 
                            Math.max(1, formData.selectedCanvasTypes.length) * 
                            Math.max(1, formData.selectedFrames.length);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 space-y-6">
        
        {/* Dimensions Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-1">Artwork Dimensions</h3>
          <p className="text-xs text-gray-500 mb-4">Select all sizes you offer for this piece.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DIMENSION_OPTIONS.map(dim => (
              <label key={dim} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.selectedDimensions.includes(dim) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="checkbox" className="hidden" checked={formData.selectedDimensions.includes(dim)} onChange={() => updateForm({ selectedDimensions: toggleArray(formData.selectedDimensions, dim) })} />
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.selectedDimensions.includes(dim) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                  {formData.selectedDimensions.includes(dim) && <FiCheck className="w-3 h-3" />}
                </div>
                <span className="font-bold text-sm text-gray-800">{dim}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Canvas Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-1">Canvas & Product Type</h3>
          <p className="text-xs text-gray-500 mb-4">Select the materials available.</p>
          {formData.selectedFrames.length > 0 && (
            <p className="text-xs text-amber-600 font-bold mb-3">⚠️ Disabled: Frame option is already selected</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CANVAS_OPTIONS.map(can => {
              const isChecked = formData.selectedCanvasTypes.includes(can);
              const isDisabled = formData.selectedFrames.length > 0 && !isChecked;
              return (
                <label 
                  key={can} 
                  className={`flex items-center gap-2 p-3 border rounded-xl transition-all ${
                    isChecked 
                      ? 'border-indigo-600 bg-indigo-50 cursor-pointer' 
                      : isDisabled
                        ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    disabled={isDisabled}
                    checked={isChecked} 
                    onChange={() => {
                      if (!isDisabled) {
                        updateForm({ selectedCanvasTypes: toggleArray(formData.selectedCanvasTypes, can) });
                      }
                    }} 
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    isChecked 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : isDisabled
                        ? 'border-gray-200 bg-gray-100'
                        : 'border-gray-300'
                  }`}>
                    {isChecked && <FiCheck className="w-3 h-3" />}
                  </div>
                  <span className="font-bold text-sm text-gray-800">{can}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Frames Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-1">Frame Types</h3>
          <p className="text-xs text-gray-500 mb-4">Select the framing options.</p>
          {formData.selectedCanvasTypes.length > 0 && (
            <p className="text-xs text-amber-600 font-bold mb-3">⚠️ Disabled: Canvas option is already selected</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {FRAME_OPTIONS.map(frame => {
              const isChecked = formData.selectedFrames.includes(frame);
              const isDisabled = formData.selectedCanvasTypes.length > 0 && !isChecked;
              return (
                <label 
                  key={frame} 
                  className={`flex items-center gap-2 p-3 border rounded-xl transition-all ${
                    isChecked 
                      ? 'border-indigo-600 bg-indigo-50 cursor-pointer' 
                      : isDisabled
                        ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    disabled={isDisabled}
                    checked={isChecked} 
                    onChange={() => {
                      if (!isDisabled) {
                        updateForm({ selectedFrames: toggleArray(formData.selectedFrames, frame) });
                      }
                    }} 
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    isChecked 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : isDisabled
                        ? 'border-gray-200 bg-gray-100'
                        : 'border-gray-300'
                  }`}>
                    {isChecked && <FiCheck className="w-3 h-3" />}
                  </div>
                  <span className="font-bold text-sm text-gray-800">{frame}</span>
                </label>
              );
            })}
          </div>
        </div>

      </div>

      {/* Right Side Live Summary Panel */}
      <div className="w-full lg:w-80 lg:sticky lg:top-24 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-base font-black text-gray-900 mb-4 pb-4 border-b border-gray-100">Live Summary</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dimensions ({formData.selectedDimensions.length})</p>
            <div className="flex flex-wrap gap-1">
              {formData.selectedDimensions.length ? formData.selectedDimensions.map(d => <span key={d} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md font-medium">{d}</span>) : <span className="text-xs text-red-500 italic">None selected</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Canvas ({formData.selectedCanvasTypes.length})</p>
            <div className="flex flex-wrap gap-1">
              {formData.selectedCanvasTypes.length ? formData.selectedCanvasTypes.map(c => <span key={c} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md font-medium">{c}</span>) : <span className="text-xs text-red-500 italic">None selected</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Frames ({formData.selectedFrames.length})</p>
            <div className="flex flex-wrap gap-1">
              {formData.selectedFrames.length ? formData.selectedFrames.map(f => <span key={f} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md font-medium">{f}</span>) : <span className="text-xs text-red-500 italic">None selected</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">Estimated Variants</p>
          <p className="text-3xl font-black text-indigo-600">{combinationsCount}</p>
          <p className="text-xs text-gray-500 mt-1">Combinations to price in the next step.</p>
        </div>
      </div>
    </div>
  );
};

const StepPricingMatrix = ({ formData, updateForm }) => {
  // Generate combinations
  const dims = formData.selectedDimensions.length ? formData.selectedDimensions : ["Default"];
  const canvases = formData.selectedCanvasTypes.length ? formData.selectedCanvasTypes : ["Default"];
  const frames = formData.selectedFrames.length ? formData.selectedFrames : ["Default"];

  const combinations = useMemo(() => {
    let combos = [];
    dims.forEach(d => {
      canvases.forEach(c => {
        frames.forEach(f => {
          combos.push({ dim: d, canvas: c, frame: f, key: `${d}|${c}|${f}` });
        });
      });
    });
    return combos;
  }, [dims, canvases, frames]);

  const updatePrice = (key, field, value) => {
    const current = formData.pricingMatrix[key] || {};
    updateForm({
      pricingMatrix: {
        ...formData.pricingMatrix,
        [key]: { ...current, [field]: value }
      }
    });
  };

  const handleBulkSetColumnPrice = (optionName, price) => {
    const newMatrix = { ...formData.pricingMatrix };
    combinations.forEach(c => {
      if (c.frame === optionName || c.canvas === optionName) {
        newMatrix[c.key] = { ...(newMatrix[c.key] || {}), price };
      }
    });
    updateForm({ pricingMatrix: newMatrix });
  };

  const hasCanvas = formData.selectedCanvasTypes.length > 0;
  const hasFrame = formData.selectedFrames.length > 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">Pricing Matrix & Global Inventory</h2>
          <p className="text-sm text-gray-500 mb-4">Set the exact selling price for each combination and define total inventory.</p>
          
          <div className="max-w-xs mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">Total Artwork Inventory (Global Stock) *</label>
            <input 
              type="number" min="0" 
              value={formData.totalInventory} 
              onChange={e => updateForm({ totalInventory: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium" 
              placeholder="e.g. 50"
            />
          </div>
        </div>
        
        {/* Bulk Actions */}
        <div className="flex gap-2">
          {hasFrame ? (
            formData.selectedFrames.map(f => (
              <button key={f} onClick={() => {
                const val = prompt(`Set price for ALL ${f} combinations:`);
                if (val && !isNaN(val)) handleBulkSetColumnPrice(f, val);
              }} className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100">
                Set {f} Price
              </button>
            ))
          ) : hasCanvas ? (
            formData.selectedCanvasTypes.map(c => (
              <button key={c} onClick={() => {
                const val = prompt(`Set price for ALL ${c} combinations:`);
                if (val && !isNaN(val)) handleBulkSetColumnPrice(c, val);
              }} className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100">
                Set {c} Price
              </button>
            ))
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="py-3 px-4 border-b font-bold w-1/4">Dimension</th>
              {hasCanvas && <th className="py-3 px-4 border-b font-bold w-1/4">Canvas</th>}
              {hasFrame && <th className="py-3 px-4 border-b font-bold w-1/4">Frame</th>}
              <th className="py-3 px-4 border-b font-bold w-1/4">Price (₹) *</th>
            </tr>
          </thead>
          <tbody>
            {combinations.map(c => {
              const data = formData.pricingMatrix[c.key] || {};
              return (
                <tr key={c.key} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                  <td className="py-2 px-4 font-semibold text-gray-800">{c.dim !== "Default" ? c.dim : "-"}</td>
                  {hasCanvas && <td className="py-2 px-4 font-medium text-gray-600">{c.canvas !== "Default" ? c.canvas : "-"}</td>}
                  {hasFrame && <td className="py-2 px-4 font-medium text-gray-600">{c.frame !== "Default" ? c.frame : "-"}</td>}
                  <td className="py-2 px-4">
                    <input 
                      type="number" min="0" 
                      value={data.price || ""} 
                      onChange={e => updatePrice(c.key, 'price', e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!data.price ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
                      placeholder="Req"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StepShipping = ({ formData, updateForm }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h2 className="text-xl font-black text-gray-900 mb-6">Shipping & Logistics</h2>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Package Weight (kg)</label>
          <input type="number" step="0.1" value={formData.packageWeight} onChange={e => updateForm({ packageWeight: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Processing Time</label>
          <select value={formData.processingTime} onChange={e => updateForm({ processingTime: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50">
            <option value="1-3 Business Days">1-3 Business Days</option>
            <option value="3-5 Business Days">3-5 Business Days</option>
            <option value="1-2 Weeks">1-2 Weeks</option>
            <option value="Custom Made (3+ Weeks)">Custom Made (3+ Weeks)</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.isFreeShipping} onChange={e => updateForm({ isFreeShipping: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
          <span className="text-sm font-bold text-gray-700">Offer Free Shipping</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.madeToOrder} onChange={e => updateForm({ madeToOrder: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
          <span className="text-sm font-bold text-gray-700">Made To Order Item</span>
        </label>
      </div>
    </div>
  </div>
);

const StepSEO = ({ formData, updateForm }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h2 className="text-xl font-black text-gray-900 mb-6">Search Engine Optimization</h2>
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">SEO Title</label>
        <input type="text" value={formData.seoTitle} onChange={e => updateForm({ seoTitle: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="e.g. Original Abstract Oil Painting - Golden Sunset" />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">SEO Description</label>
        <textarea value={formData.seoDescription} onChange={e => updateForm({ seoDescription: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="A short, catchy description for Google search results..."></textarea>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Keywords / Tags</label>
        <input type="text" value={formData.tags.join(", ")} onChange={e => updateForm({ tags: e.target.value.split(',').map(t=>t.trim()).filter(Boolean) })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="abstract, oil painting, canvas print (comma separated)" />
      </div>
    </div>
  </div>
);

const StepPreview = ({ formData }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <FiCheck className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Ready to Publish!</h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">Your artwork configuration is complete. The system has automatically generated your pricing matrix and product variants.</p>
      
      <div className="bg-gray-50 rounded-xl p-4 text-left max-w-lg mx-auto border border-gray-200">
        <h4 className="font-bold text-sm text-gray-800 mb-2">Validation Checklist:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2"><FiCheck className="text-green-500" /> Title & Description provided</li>
          <li className="flex items-center gap-2"><FiCheck className="text-green-500" /> {formData.selectedDimensions.length} Dimensions, {formData.selectedFrames.length} Frames</li>
          <li className="flex items-center gap-2"><FiCheck className="text-green-500" /> Pricing Matrix initialized</li>
        </ul>
      </div>
    </div>
  );
};

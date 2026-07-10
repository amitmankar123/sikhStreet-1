import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiStar,
  FiHeart,
  FiShoppingBag,
  FiMinus,
  FiPlus,
  FiArrowLeft,
  FiShare2,
  FiCheckCircle,
  FiTrash2,
  FiTag,
  FiCompass,
  FiInfo,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useCartStore, useUIStore } from "../../../shared/store/useStore";
import { useWishlistStore } from "../../../shared/store/wishlistStore";
import { useReviewsStore } from "../../../shared/store/reviewsStore";
import { useOrderStore } from "../../../shared/store/orderStore";
import { useAuthStore } from "../../../shared/store/authStore";
import { useCategoryStore } from "../../../shared/store/categoryStore";
import {
  getProductById,
  getSimilarProducts,
  getVendorById,
  getBrandById,
} from "../data/catalogData";
import api from "../../../shared/utils/api";
import { formatPrice } from "../../../shared/utils/helpers";
import toast from "react-hot-toast";
import MobileLayout from "../components/Layout/MobileLayout";
import ImageGallery from "../../../shared/components/Product/ImageGallery";
import VariantSelector from "../../../shared/components/Product/VariantSelector";
import ReviewForm from "../../../shared/components/Product/ReviewForm";
import ProductQA from "../components/ProductQA";
import MobileProductCard from "../components/Mobile/MobileProductCard";
import PageTransition from "../../../shared/components/PageTransition";
import Badge from "../../../shared/components/Badge";
import ProductCard from "../../../shared/components/ProductCard";
import { getVariantSignature, resolveVariantPrice } from "../../../shared/utils/variant";



const isMongoId = (value) => {
  const str = String(value || "").trim();
  return /^[a-fA-F0-9]{24}$/.test(str) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(str);
};
const normalizeProduct = (raw) => {
  if (!raw) return null;

  const vendorObj =
    raw?.vendor && typeof raw.vendor === "object"
      ? raw.vendor
      : raw?.vendorId && typeof raw.vendorId === "object"
        ? raw.vendorId
        : null;
  const brandObj =
    raw?.brand && typeof raw.brand === "object"
      ? raw.brand
      : raw?.brandId && typeof raw.brandId === "object"
        ? raw.brandId
        : null;
  const categoryObj =
    raw?.category && typeof raw.category === "object"
      ? raw.category
      : raw?.categoryId && typeof raw.categoryId === "object"
        ? raw.categoryId
        : null;

  const id = String(raw?.id || raw?._id || "").trim();
  if (!id) return null;

  const vendorId = String(vendorObj?._id || vendorObj?.id || raw?.vendorId || "").trim();
  const brandId = String(brandObj?._id || brandObj?.id || raw?.brandId || "").trim();
  const categoryId = String(categoryObj?._id || categoryObj?.id || raw?.categoryId || "").trim();
  const image = raw?.image || raw?.images?.[0] || "";
  const images = Array.isArray(raw?.images) ? raw.images.filter(Boolean) : image ? [image] : [];

  return {
    ...raw,
    id,
    _id: id,
    vendorId,
    brandId,
    categoryId,
    image,
    images,
    price: Number(raw?.price) || 0,
    originalPrice:
      raw?.originalPrice !== undefined && raw?.originalPrice !== null
        ? Number(raw.originalPrice)
        : undefined,
    rating: Number(raw?.rating) || 0,
    reviewCount: Number(raw?.reviewCount) || 0,
    stockQuantity: Number(raw?.stockQuantity) || 0,
    vendorName: raw?.vendorName || vendorObj?.storeName || vendorObj?.name || "",
    brandName: raw?.brandName || brandObj?.name || "",
    categoryName: raw?.categoryName || categoryObj?.name || "",
    vendor: vendorObj
      ? {
        ...vendorObj,
        id: String(vendorObj?.id || vendorObj?._id || vendorId),
      }
      : null,
    brand: brandObj
      ? {
        ...brandObj,
        id: String(brandObj?.id || brandObj?._id || brandId),
      }
      : null,
    stock:
      raw?.stock ||
      (Number(raw?.stockQuantity) > 0 ? "in_stock" : "out_of_stock"),
    description: String(raw?.description || "").trim(),
    unit: String(raw?.unit || "Piece").trim(),
  };
};

const MobileProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const localFallbackProduct = useMemo(() => normalizeProduct(getProductById(id)), [id]);
  const [product, setProduct] = useState(localFallbackProduct);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [embroideryEnabled, setEmbroideryEnabled] = useState(false);
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(false); // Turban only
  const [embroideryDemand, setEmbroideryDemand] = useState("");
  const [giftWrapDemand, setGiftWrapDemand] = useState("");
  const [artGiftWrapEnabled, setArtGiftWrapEnabled] = useState(false); // Art only — separate from turban
  const [personalMessage, setPersonalMessage] = useState("");
  const [isPersonalMessageOpen, setIsPersonalMessageOpen] = useState(false);

  useEffect(() => {
    if (product?.turbanConfig?.fabric?.length > 0) {
      setSelectedFabric(product.turbanConfig.fabric[0]);
    }
  }, [product]);

  const { categories, initialize: initializeCategories } = useCategoryStore();

  useEffect(() => {
    if (!categories || categories.length === 0) {
      initializeCategories();
    }
  }, [categories, initializeCategories]);

  const breadcrumbs = useMemo(() => {
    if (!product || !categories || categories.length === 0) return [];

    const path = [];
    let currentId = product.categoryId;
    const visited = new Set();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const cat = categories.find(
        (c) => String(c.id || c._id) === String(currentId)
      );
      if (!cat) break;
      path.unshift(cat);

      const parent = cat.parentId;
      const parentId =
        parent && typeof parent === "object"
          ? parent._id || parent.id
          : parent;
      currentId = parentId;
    }

    return path;
  }, [product, categories]);


  const isKada = useMemo(() => {
    if (!product) return false;
    const nameMatch = (product.name || "").toLowerCase().includes("kada") || (product.name || "").toLowerCase().includes("bangle");
    const catMatch = (product.categoryName || "").toLowerCase().includes("kada") || (product.categoryName || "").toLowerCase().includes("bangle");
    return nameMatch || catMatch;
  }, [product]);

  const isTurbanProduct = useMemo(() => {
    if (!product) return false;
    const catMatch = (product.categoryName || "").toLowerCase().includes("turban");
    const hasTurbanConfig = product.turbanConfig && (
      Array.isArray(product.turbanConfig.fabric) && product.turbanConfig.fabric.length > 0 ||
      product.turbanConfig.embroidery?.enabled ||
      product.turbanConfig.giftWrap?.enabled
    );
    return catMatch || hasTurbanConfig;
  }, [product]);

  // isArtProduct: completely separate from isTurbanProduct — artConfig never mixes with turbanConfig
  const isArtProduct = useMemo(() => {
    if (!product) return false;
    const catMatch = (product.categoryName || "").toLowerCase().includes("art");
    const hasArtConfig = !!product.artConfig;
    const hasFrameVariant = Array.isArray(product.variants?.attributes) &&
      product.variants.attributes.some((a) => String(a.name || "").toLowerCase() === "frame");
    return catMatch || hasArtConfig || hasFrameVariant;
  }, [product]);

  const isFractionalUnit = useMemo(() => {
    if (isTurbanProduct) return false;
    if (!product?.unit) return false;
    const unitStr = product.unit.toLowerCase();
    return ['meter', 'meters', 'm', 'kg', 'kilogram', 'kilograms', 'gram', 'grams', 'g', 'litre', 'litres', 'l'].includes(unitStr);
  }, [product?.unit, isTurbanProduct]);

  const quantityStep = isFractionalUnit ? 0.5 : 1;
  const minQuantity = isFractionalUnit ? 0.5 : 1;

  const { items, addItem, removeItem } = useCartStore();
  const triggerCartAnimation = useUIStore(
    (state) => state.triggerCartAnimation
  );
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();
  const { fetchReviews, sortReviews, addReview } = useReviewsStore();
  const { getAllOrders, fetchUserOrders, orders } = useOrderStore();
  const { user, isAuthenticated } = useAuthStore();
  const vendor = useMemo(() => {
    if (!product) return null;
    if (product.vendor?.id) return product.vendor;
    return getVendorById(product.vendorId);
  }, [product]);
  const brand = useMemo(() => {
    if (!product) return null;
    if (product.brand?.id) return product.brand;
    return getBrandById(product.brandId);
  }, [product]);

  const isFavorite = product ? isInWishlist(product.id) : false;
  const selectedVariantSignature = getVariantSignature(selectedVariant || {});
  const isInCart = product
    ? items.some(
      (item) =>
        String(item.id) === String(product.id) &&
        getVariantSignature(item.variant || {}) === selectedVariantSignature
    )
    : false;
  const productReviews = product ? sortReviews(product.id, "newest") : [];

  useEffect(() => {
    let active = true;
    setIsLoadingProduct(true);

    const loadProductDetail = async () => {
      try {
        const [detailRes, similarRes] = await Promise.allSettled([
          api.get(`/products/${id}`),
          api.get(`/similar/${id}`),
        ]);

        const detailPayload =
          detailRes.status === "fulfilled"
            ? detailRes.value?.data ?? detailRes.value
            : null;
        const resolvedProduct = normalizeProduct(detailPayload) || localFallbackProduct;

        const similarPayload =
          similarRes.status === "fulfilled"
            ? similarRes.value?.data ?? similarRes.value
            : null;
        const resolvedSimilar = Array.isArray(similarPayload)
          ? similarPayload
            .map(normalizeProduct)
            .filter(
              (item) => item?.id && String(item.id) !== String(resolvedProduct?.id || "")
            )
            .slice(0, 5)
          : [];

        if (!active) return;

        setProduct(resolvedProduct);
        if (resolvedSimilar.length > 0) {
          setSimilarProducts(resolvedSimilar);
        } else if (resolvedProduct?.id) {
          setSimilarProducts(getSimilarProducts(resolvedProduct.id, 5));
        } else {
          setSimilarProducts([]);
        }
      } catch {
        if (!active) return;
        setProduct(localFallbackProduct);
        setSimilarProducts(
          localFallbackProduct?.id ? getSimilarProducts(localFallbackProduct.id, 5) : []
        );
      } finally {
        if (active) setIsLoadingProduct(false);
      }
    };

    loadProductDetail();
    return () => {
      active = false;
    };
  }, [id, localFallbackProduct]);

  useEffect(() => {
    if (product?.variants?.defaultSelection && typeof product.variants.defaultSelection === "object") {
      setSelectedVariant(product.variants.defaultSelection);
      return;
    }
    if (product?.variants?.defaultVariant) {
      setSelectedVariant(product.variants.defaultVariant);
      return;
    }
    setSelectedVariant({});
  }, [product]);

  useEffect(() => {
    if (product?.id) {
      fetchReviews(product.id, { sort: "newest", limit: 50 });
    }
  }, [product?.id, fetchReviews]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserOrders(1, 50).catch(() => null);
    }
  }, [isAuthenticated, fetchUserOrders]);

  useEffect(() => {
    if (product?.id && (window.location.hash === "#reviews" || window.location.search.includes("write-review=true"))) {
      // Small timeout to allow DOM to render and layout to settle
      const timer = setTimeout(() => {
        const el = document.getElementById("reviews-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [product, isAuthenticated]);

  const handleAddToCart = (redirectToCheckout = false) => {
    if (!product) return;
    const attributeAxes = Array.isArray(product?.variants?.attributes)
      ? product.variants.attributes.filter((attr) => Array.isArray(attr?.values) && attr.values.length > 0)
      : [];
    const hasDynamicAxes = attributeAxes.length > 0;
    const hasSizeVariants = Array.isArray(product?.variants?.sizes) && product.variants.sizes.length > 0;
    const hasColorVariants = Array.isArray(product?.variants?.colors) && product.variants.colors.length > 0;
    const isMissingDynamicAxis = hasDynamicAxes
      ? attributeAxes.some((attr) => !String(selectedVariant?.[attr.name] || selectedVariant?.[String(attr.name || "").toLowerCase().replace(/\s+/g, "_")] || "").trim())
      : false;
    const selectedSize = String(selectedVariant?.size || "").trim();
    const selectedColor = String(selectedVariant?.color || "").trim();
    if (isMissingDynamicAxis || ((hasSizeVariants && !selectedSize) || (hasColorVariants && !selectedColor))) {
      toast.error("Please select required variant options");
      return;
    }

    const baseRate = resolveVariantPrice(product, selectedVariant || {});
    const fabricRate = selectedFabric ? Number(selectedFabric.price) : 0;
    const ratePerMeter = isTurbanProduct && fabricRate > 0 ? fabricRate : baseRate;

    // Turban-specific fees
    const embroideryFee = (isTurbanProduct && embroideryEnabled && product?.turbanConfig?.embroidery?.price) ? Number(product.turbanConfig.embroidery.price) : 0;
    const giftWrapFee = (isTurbanProduct && giftWrapEnabled && product?.turbanConfig?.giftWrap?.price) ? Number(product.turbanConfig.giftWrap.price) : 0;

    // Art-specific gift wrap fee (separate from turban)
    const artGiftWrapFeeLocal = (isArtProduct && artGiftWrapEnabled && product?.artConfig?.giftWrap?.price) ? Number(product.artConfig.giftWrap.price) : 0;

    const turbanLength = isTurbanProduct ? (parseFloat(selectedVariant?.size) || 1) : 1;
    // baseRate for art already includes frame add-on price
    const finalPrice = ratePerMeter * turbanLength + embroideryFee + giftWrapFee + artGiftWrapFeeLocal;

    const cartVariant = {
      ...(selectedVariant || {}),
      ...(selectedFabric ? { fabric: selectedFabric.type } : {}),
      ...(embroideryEnabled ? { embroidery: "Yes", embroidery_demand: embroideryDemand } : {}),
      ...(giftWrapEnabled ? { gift_wrap: "Yes", gift_wrap_demand: giftWrapDemand } : {}),
      ...(artGiftWrapEnabled ? { art_gift_wrap: "Yes" } : {}),
      ...(personalMessage ? { personal_message: personalMessage } : {}),
    };

    const variantKey = getVariantSignature(selectedVariant || {});
    const variantStockValue = Number(
      product?.variants?.stockMap?.[variantKey] ??
      product?.variants?.stockMap?.get?.(variantKey)
    );
    const effectiveStock = Number.isFinite(variantStockValue)
      ? variantStockValue
      : Number(product.stockQuantity || 0);

    if (redirectToCheckout) {
      if (effectiveStock <= 0) {
        toast.error("Selected variant is out of stock");
        return;
      }
      if (quantity > effectiveStock) {
        toast.error(`Only ${effectiveStock} item(s) available for selected variant`);
        return;
      }
    }

    const addedToCart = addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image,
      quantity: quantity,
      variant: cartVariant,
      stockQuantity: effectiveStock,
      vendorId: product.vendorId,
      vendorName: vendor?.storeName || vendor?.name || product.vendorName,
      unit: isTurbanProduct ? 'Piece' : product.unit,
    });
    if (!addedToCart) return;
    if (redirectToCheckout === true) {
      navigate('/checkout');
    } else {
      triggerCartAnimation();
      toast.success("Added to cart!");
    }
  };

  const handleRemoveFromCart = () => {
    if (!product) return;
    removeItem(product.id, selectedVariant || {});
    toast.success("Removed from cart!");
  };

  const handleFavorite = () => {
    if (!product) return;
    if (isFavorite) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      const addedToWishlist = addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      if (addedToWishlist) {
        toast.success("Added to wishlist");
      }
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = parseFloat((Number(quantity) + Number(change)).toFixed(2));
    const variantKey = getVariantSignature(selectedVariant || {});
    const variantStockValue = Number(
      product?.variants?.stockMap?.[variantKey] ??
      product?.variants?.stockMap?.get?.(variantKey)
    );
    const maxStock = Number.isFinite(variantStockValue)
      ? Math.max(0, variantStockValue)
      : Number(product?.stockQuantity || 0);

    const effectiveMax = maxStock > 0 ? maxStock : 10;

    if (newQuantity >= minQuantity && newQuantity <= effectiveMax) {
      setQuantity(newQuantity);
    }
  };

  const handleQuantityInput = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= minQuantity) {
      setQuantity(val);
    }
  };

  const productImages = useMemo(() => {
    if (!product) return [];

    const selectedVariantKey = getVariantSignature(selectedVariant || {});
    const colorKey = selectedVariant?.color ? `color=${String(selectedVariant.color).trim().toLowerCase()}` : "";
    const selectedVariantImg = String(
      product?.variants?.imageMap?.[selectedVariantKey] ||
      product?.variants?.imageMap?.get?.(selectedVariantKey) ||
      product?.variants?.imageMap?.[colorKey] ||
      product?.variants?.imageMap?.get?.(colorKey) ||
      ""
    ).trim();

    const baseImages =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images.filter(Boolean)
        : product.image
          ? [product.image]
          : [];

    const allVariantImages = [];
    if (product?.variants?.imageMap) {
      const mapValues = product.variants.imageMap instanceof Map
        ? Array.from(product.variants.imageMap.values())
        : Object.values(product.variants.imageMap);
      mapValues.forEach(val => {
        if (typeof val === "string" && val.trim() && !allVariantImages.includes(val.trim())) {
          allVariantImages.push(val.trim());
        }
      });
    }

    const combined = [];
    if (selectedVariantImg) {
      combined.push(selectedVariantImg);
    }

    baseImages.forEach(img => {
      if (!combined.includes(img)) {
        combined.push(img);
      }
    });

    allVariantImages.forEach(img => {
      if (!combined.includes(img)) {
        combined.push(img);
      }
    });

    return combined;
  }, [product, selectedVariant]);

  const currentPrice = useMemo(() => {
    return resolveVariantPrice(product, selectedVariant);
  }, [product, selectedVariant]);

  const selectedAvailableStock = useMemo(() => {
    const variantKey = getVariantSignature(selectedVariant || {});
    const variantStockValue = Number(
      product?.variants?.stockMap?.[variantKey] ??
      product?.variants?.stockMap?.get?.(variantKey)
    );
    if (Number.isFinite(variantStockValue)) {
      return Math.max(0, variantStockValue);
    }
    return Number(product?.stockQuantity || 0);
  }, [product, selectedVariant]);

  const productFaqs = useMemo(() => {
    if (!Array.isArray(product?.faqs)) return [];
    return product.faqs
      .map((faq) => ({
        question: String(faq?.question || "").trim(),
        answer: String(faq?.answer || "").trim(),
      }))
      .filter((faq) => faq.question && faq.answer);
  }, [product?.faqs]);

  const eligibleDeliveredOrderId = useMemo(() => {
    if (!isAuthenticated || !user?.id || !isMongoId(product?.id)) return null;
    const userOrders = getAllOrders(user.id) || [];
    const eligibleOrder = userOrders.find((order) => {
      if (String(order?.status || "").toLowerCase() !== "delivered") return false;
      const items = Array.isArray(order?.items) ? order.items : [];
      return items.some(
        (item) => String(item?.productId || item?.id || "") === String(product.id)
      );
    });
    return eligibleOrder?.id || eligibleOrder?._id || null;
  }, [isAuthenticated, user?.id, product?.id, orders]);

  const handleSubmitReview = async (reviewData) => {
    if (!eligibleDeliveredOrderId) {
      toast.error("You can review only after this product is delivered");
      return false;
    }

    const ok = await addReview(product.id, {
      ...reviewData,
      orderId: eligibleDeliveredOrderId,
    });
    if (!ok) {
      toast.error("Unable to submit review");
      return false;
    }

    await fetchReviews(product.id, { sort: "newest", limit: 50 });
    return true;
  };

  const baseRate = product ? resolveVariantPrice(product, selectedVariant || {}) : 0;
  const fabricRate = selectedFabric ? Number(selectedFabric.price) : 0;
  const ratePerMeter = isTurbanProduct && fabricRate > 0 ? fabricRate : baseRate;

  // Turban-specific fees
  const embroideryFee = (isTurbanProduct && embroideryEnabled && product?.turbanConfig?.embroidery?.price) ? Number(product.turbanConfig.embroidery.price) : 0;
  const giftWrapFee = (isTurbanProduct && giftWrapEnabled && product?.turbanConfig?.giftWrap?.price) ? Number(product.turbanConfig.giftWrap.price) : 0;

  // Art-specific gift wrap fee — completely separate from turban fees
  const artGiftWrapFee = (isArtProduct && artGiftWrapEnabled && product?.artConfig?.giftWrap?.price) ? Number(product.artConfig.giftWrap.price) : 0;

  const turbanLength = isTurbanProduct ? (parseFloat(selectedVariant?.size) || 1) : 1;
  const unitPrice = ratePerMeter * turbanLength + embroideryFee + giftWrapFee + artGiftWrapFee;
  const finalCalculatedPrice = unitPrice * quantity;

  if (!product) {
    return (
      <PageTransition>
        <MobileLayout showBottomNav={false} showCartBar={false}>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center">
              {isLoadingProduct ? (
                <h2 className="text-xl font-bold text-gray-800 mb-4">Loading product...</h2>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Product Not Found
                  </h2>
                  <button
                    onClick={() => navigate("/home")}
                    className="gradient-green text-white px-6 py-3 rounded-xl font-semibold">
                    Go Back Home
                  </button>
                </>
              )}
            </div>
          </div>
        </MobileLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <MobileLayout showBottomNav={false} showCartBar={true}>
        <div className="w-full pb-24 lg:pb-12 max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="px-6 pt-4 lg:pt-6 lg:px-8 flex items-center justify-center flex-wrap gap-1.5 text-sm md:text-base text-brand-muted font-sans">
            <Link to="/home" className="hover:text-brand-saffron hover:underline transition-colors font-medium">
              Homepage
            </Link>
            {breadcrumbs.map((cat) => (
              <div key={cat.id || cat._id} className="flex items-center gap-1.5">
                <span className="text-brand-subtle font-light">›</span>
                <Link to={`/category/${cat.id || cat._id}`} className="hover:text-brand-saffron hover:underline transition-colors font-medium">
                  {cat.name}
                </Link>
              </div>
            ))}
            <span className="text-brand-subtle font-light">›</span>
            <span className="text-brand-navy font-semibold truncate max-w-[150px] md:max-w-xs">
              {product.name}
            </span>
          </div>

          {/* Back Button */}
          <div className="px-4 pt-2 lg:pt-4 lg:px-8 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                <FiArrowLeft className="text-xl" />
              </div>
              <span className="font-medium">Back</span>
            </button>
          </div>
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:px-8 lg:items-start">
            {/* Column 1: Product Image (Spans 4 columns) */}
            <div className="lg:col-span-4 px-4 py-4 lg:p-0 sticky top-24">
              <div className="bg-brand-surface rounded-3xl p-2 lg:p-4 shadow-card border border-brand-border">
                <ImageGallery images={productImages} productName={product.name} />
              </div>
              {product.flashSale && (
                <div className="mt-4 flex justify-center lg:justify-start">
                  <Badge variant="flash" size="lg">Flash Sale - Limited Time Offer</Badge>
                </div>
              )}
            </div>

            {/* Column 2: Product Info (Spans 4 columns) */}
            <div className="lg:col-span-4 px-4 py-4 lg:p-0 flex flex-col gap-6">
              <div>
                {vendor && (
                  <Link
                    to={`/seller/${vendor.id}`}
                    className="text-xs font-bold text-[#8d4b00] tracking-widest uppercase hover:underline flex items-center gap-1 group mb-1.5"
                  >
                    <span>{vendor.storeName || vendor.name}</span>
                    {vendor.isVerified && (
                      <FiCheckCircle className="text-[#8d4b00] text-xs" title="Verified Vendor" />
                    )}
                  </Link>
                )}
                <h1 className="text-xl lg:text-3xl font-bold text-brand-navy leading-snug mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  {product.name}
                </h1>
                {product.rating > 0 && (
                  <div className="flex items-center gap-1 cursor-pointer">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`text-xs ${i < Math.floor(product.rating) ? "text-brand-saffron fill-brand-saffron" : "text-brand-subtle"}`}
                      />
                    ))}
                    <span className="text-xs font-semibold text-brand-muted ml-1">({product.reviewCount} reviews)</span>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description || `High-quality ${product.name.toLowerCase()} available in ${product.unit?.toLowerCase() || 'units'}.`}
              </div>

              {/* Badges/Highlights */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-start gap-3 bg-[#fdeade]/10 p-3.5 rounded-2xl border border-[#e9d7cb]/40">
                  <div className="mt-0.5 text-green-600 bg-white p-1.5 rounded-full border border-green-100 shadow-sm flex-shrink-0">
                    <FiCheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#231a13]">Authenticity Guaranteed</p>
                    <p className="text-[11px] text-[#554336]">Sourced directly from certified artisans.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#fdeade]/10 p-3.5 rounded-2xl border border-[#e9d7cb]/40">
                  <div className="mt-0.5 text-amber-600 bg-white p-1.5 rounded-full border border-amber-100 shadow-sm flex-shrink-0">
                    <FiCheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#231a13]">Sustainable Process</p>
                    <p className="text-[11px] text-[#554336]">Zero-waste production and organic dyes.</p>
                  </div>
                </div>
              </div>

              {/* Accordions for Details, Highlights, Policies */}
              <div className="border-t border-brand-border divide-y divide-brand-border mt-2">
                {product.specifications && product.specifications.length > 0 && (
                  <details className="group" open>
                    <summary className="flex items-center justify-between py-4 cursor-pointer list-none font-bold text-brand-navy outline-none">
                      Specifications
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <div className="pb-4 space-y-2">
                      {product.specifications.map((spec, idx) => (
                        <div key={idx} className="flex justify-between text-xs py-1.5 border-b border-gray-50">
                          <span className="text-gray-500 font-medium">{spec.name}</span>
                          <span className="text-gray-900 font-bold">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {vendor && (vendor.storePolicies || vendor.shippingPolicy || vendor.refundPolicy) && (
                  <details className="group">
                    <summary className="flex items-center justify-between py-4 cursor-pointer list-none font-bold text-gray-900 outline-none">
                      Delivery and return policies
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <div className="pb-4 space-y-4">
                      {vendor.shippingPolicy && (
                        <div className="text-sm text-gray-700">
                          <p className="font-semibold mb-1 flex items-center gap-2">Shipping Information</p>
                          <p className="whitespace-pre-line ml-1 text-xs text-gray-600">{vendor.shippingPolicy}</p>
                        </div>
                      )}
                      {vendor.refundPolicy && (
                        <div className="text-sm text-gray-700">
                          <p className="font-semibold mb-1 flex items-center gap-2">Returns & Exchanges</p>
                          <p className="whitespace-pre-line ml-1 text-xs text-gray-600">{vendor.refundPolicy}</p>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Column 3: Order configuration sidebar card (Spans 4 columns) */}
            <div className="lg:col-span-4 px-4 py-4 lg:p-0 sticky top-24">
              <div className="bg-[#FFFDFB] rounded-3xl p-5 border border-[#e9d7cb] shadow-md flex flex-col gap-5">
                {/* Price block */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Price</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-brand-saffron">
                      {formatPrice(ratePerMeter)}
                    </span>
                    {isTurbanProduct && <span className="text-xs text-gray-500 font-normal">/ meter</span>}
                  </div>
                  {product.originalPrice && (
                    <span className="text-xs text-brand-subtle line-through font-medium">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Color Selector (Turbans Only) */}
                {isTurbanProduct && (() => {
                  let colors = product?.variants?.colors || [];
                  if (colors.length === 0 && Array.isArray(product?.variants?.attributes)) {
                    const colorAttr = product.variants.attributes.find(
                      (a) => String(a.name || "").toLowerCase() === "color"
                    );
                    if (colorAttr && Array.isArray(colorAttr.values)) {
                      colors = colorAttr.values;
                    }
                  }
                  const colorHexMap = product?.variants?.colorHexMap || {};
                  if (colors.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-700">
                        Color: <span className="font-normal text-gray-600">{selectedVariant?.color || "Select color"}</span>
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {colors.map((colorName) => {
                          const colorHex = colorHexMap[colorName] || colorHexMap[colorName.toLowerCase()] || colorName;
                          const isSelected = selectedVariant?.color === colorName;
                          return (
                            <button
                              key={colorName}
                              type="button"
                              onClick={() => setSelectedVariant(prev => ({ ...prev, color: colorName }))}
                              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0 flex items-center justify-center ${isSelected ? "border-[#8d4b00] ring-2 ring-[#8d4b00]/25" : "border-gray-200"
                                }`}
                              title={colorName}
                            >
                              <span
                                className="w-5 h-5 rounded-full inline-block shadow-sm"
                                style={{ backgroundColor: colorHex }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Fabric Selector */}
                {isTurbanProduct && product?.turbanConfig?.fabric?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700">
                      Fabric: <span className="font-normal text-gray-600">{selectedFabric?.type || "Select fabric"}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.turbanConfig.fabric.map((fabric) => {
                        const isSelected = selectedFabric?.type === fabric.type;
                        return (
                          <button
                            key={fabric.type}
                            type="button"
                            onClick={() => setSelectedFabric(fabric)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${isSelected
                                ? "border-[#8d4b00] bg-[#fdeade]/30 text-[#8d4b00]"
                                : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                              }`}
                          >
                            {fabric.type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Other Custom Variant Axes for Turban Products */}
                {isTurbanProduct && Array.isArray(product.variants?.attributes) && product.variants.attributes
                  .filter(a => a.name !== "Color" && a.name !== "Size" && a.name !== "Dimension")
                  .map((axis) => {
                    const axisKey = String(axis.name || "").trim().toLowerCase().replace(/\s+/g, "_");
                    return (
                      <div key={axis.name} className="space-y-2">
                        <p className="text-xs font-bold text-gray-700">
                          {axis.name}: <span className="font-normal text-gray-600">{selectedVariant?.[axisKey] || `Select ${axis.name}`}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {axis.values.map((val) => {
                            const isSelected = selectedVariant?.[axisKey] === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setSelectedVariant(prev => ({ ...prev, [axisKey]: val }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${isSelected
                                    ? "border-[#8d4b00] bg-[#fdeade]/30 text-[#8d4b00]"
                                    : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                                  }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                {/* Length / Sizes Selector (Turbans Only) */}
                {isTurbanProduct && (() => {
                  let sizes = product?.variants?.sizes || [];
                  if (sizes.length === 0 && Array.isArray(product?.variants?.attributes)) {
                    const sizeAttr = product.variants.attributes.find(
                      (a) => ["size", "length", "dimension"].includes(String(a.name || "").toLowerCase())
                    );
                    if (sizeAttr && Array.isArray(sizeAttr.values)) {
                      sizes = sizeAttr.values;
                    }
                  }
                  if (sizes.length === 0 && isTurbanProduct) {
                    sizes = ["5m", "5.5m", "6m", "6.5m", "7m", "7.5m", "8m"];
                  }
                  if (sizes.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span>Length</span>
                        <button type="button" className="text-[#8d4b00] hover:underline text-[11px] font-bold">Size Guide</button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {sizes.map((sizeVal) => {
                          const isSelected = selectedVariant?.size === sizeVal;
                          return (
                            <button
                              key={sizeVal}
                              type="button"
                              onClick={() => {
                                setSelectedVariant(prev => ({ ...prev, size: sizeVal }));
                              }}
                              className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${isSelected
                                  ? "border-[#8d4b00] bg-[#fdeade]/30 text-[#8d4b00]"
                                  : "border-gray-200 hover:border-[#8d4b00]/50 bg-white text-gray-700"
                                }`}
                            >
                              {sizeVal}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Length Input Option */}
                      {isTurbanProduct && (
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Or Custom Length:</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0.5"
                              max="30"
                              step="0.1"
                              value={(() => {
                                const sizeStr = selectedVariant?.size || "";
                                const match = sizeStr.match(/^([\d.]+)/);
                                return match ? match[1] : "";
                              })()}
                              onChange={(e) => {
                                const valStr = e.target.value;
                                if (valStr === "") {
                                  setSelectedVariant(prev => ({ ...prev, size: "" }));
                                } else {
                                  setSelectedVariant(prev => ({ ...prev, size: `${valStr}m` }));
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#8d4b00] bg-white font-bold"
                            />
                            <span className="text-xs text-gray-500 font-semibold">meters</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* General Variants Selector for Non-Turban Products */}
                {!isTurbanProduct && product.variants && (
                  <div className="mb-2">
                    <VariantSelector
                      variants={product.variants}
                      onVariantChange={setSelectedVariant}
                      currentPrice={product.price}
                      isKada={isKada}
                    />
                  </div>
                )}

                {/* Personal Message collapsible text field */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsPersonalMessageOpen(!isPersonalMessageOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-700"
                  >
                    <span>Personal Message</span>
                    <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isPersonalMessageOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isPersonalMessageOpen && (
                    <textarea
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder="Add a custom note (optional)"
                      rows={2}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#8d4b00]"
                    />
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-700">Quantity</p>
                  <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-quantityStep)}
                      disabled={quantity <= minQuantity}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm hover:shadow-md disabled:shadow-none disabled:bg-transparent disabled:opacity-50 transition-all text-brand-navy"
                    >
                      <FiMinus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      step={quantityStep}
                      min={minQuantity}
                      max={selectedAvailableStock || 10}
                      value={quantity}
                      onChange={handleQuantityInput}
                      className="w-full text-center font-bold text-brand-navy text-sm bg-transparent focus:outline-none appearance-none"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantityStep)}
                      disabled={quantity >= (selectedAvailableStock || 10)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm hover:shadow-md disabled:shadow-none disabled:bg-transparent disabled:opacity-50 transition-all text-brand-navy"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add-ons Configuration (Moved Below Quantity) */}
                {isTurbanProduct && (product?.turbanConfig?.embroidery?.enabled || product?.turbanConfig?.giftWrap?.enabled) && (
                  <div className="space-y-2.5 pt-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-700">Add-ons</p>
                    <div className="space-y-3">
                      {product.turbanConfig.embroidery?.enabled && (
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={embroideryEnabled}
                              onChange={(e) => setEmbroideryEnabled(e.target.checked)}
                              className="w-4 h-4 text-[#8d4b00] rounded border-gray-300 focus:ring-[#8d4b00]"
                            />
                            <span>Embroidery (+{formatPrice(product.turbanConfig.embroidery.price)})</span>
                          </label>
                          {embroideryEnabled && (
                            <input
                              type="text"
                              value={embroideryDemand}
                              onChange={(e) => setEmbroideryDemand(e.target.value)}
                              placeholder="Enter custom embroidery demand"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8d4b00] bg-white shadow-sm transition-all"
                            />
                          )}
                        </div>
                      )}
                      {product.turbanConfig.giftWrap?.enabled && (
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={giftWrapEnabled}
                              onChange={(e) => setGiftWrapEnabled(e.target.checked)}
                              className="w-4 h-4 text-[#8d4b00] rounded border-gray-300 focus:ring-[#8d4b00]"
                            />
                            <span>Gift Packaging (+{formatPrice(product.turbanConfig.giftWrap.price)})</span>
                          </label>
                          {giftWrapEnabled && (
                            <input
                              type="text"
                              value={giftWrapDemand}
                              onChange={(e) => setGiftWrapDemand(e.target.value)}
                              placeholder="Enter gift note or packaging demand"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8d4b00] bg-white shadow-sm transition-all"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Art-Specific Add-ons — separate from turban add-ons */}
                {isArtProduct && product?.artConfig?.giftWrap?.enabled && (
                  <div className="space-y-2.5 pt-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-700">Art Add-ons</p>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={artGiftWrapEnabled}
                          onChange={(e) => setArtGiftWrapEnabled(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                        />
                        <span>🎁 Gift Wrapping (+{formatPrice(product.artConfig.giftWrap.price)})</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Total Price breakdown */}
                <div className="bg-[#fdeade]/20 border border-[#e9d7cb]/40 p-3 rounded-2xl flex justify-between items-center mt-1">
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Subtotal</p>
                    <p className="text-[10px] text-gray-400">
                      {quantity} {isTurbanProduct ? "item" : product.unit}(s) × {formatPrice(ratePerMeter * (isTurbanProduct ? (parseFloat(selectedVariant?.size) || 1) : 1))}
                      {embroideryFee > 0 && ` + ${formatPrice(embroideryFee)} emb.`}
                      {giftWrapFee > 0 && ` + ${formatPrice(giftWrapFee)} gift`}
                      {artGiftWrapFee > 0 && ` + ${formatPrice(artGiftWrapFee)} gift wrap`}
                    </p>
                  </div>
                  <p className="text-xl font-extrabold text-[#8d4b00]">
                    {formatPrice(finalCalculatedPrice)}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(false)}
                    disabled={selectedAvailableStock <= 0}
                    className="w-full py-3 rounded-full font-bold text-[#8d4b00] bg-white border-2 border-[#8d4b00] hover:bg-[#fdeade]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(true)}
                    disabled={selectedAvailableStock <= 0}
                    className="w-full py-3 rounded-full font-bold text-white bg-[#8d4b00] hover:bg-[#6c3900] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    Buy Now
                  </button>
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className="w-full py-2 rounded-full font-semibold text-xs text-brand-muted hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FiHeart className={`text-sm ${isFavorite ? "fill-brand-saffron text-brand-saffron" : ""}`} />
                    <span>{isFavorite ? "Remove from collection" : "Add to collection"}</span>
                  </button>
                </div>

                {/* Footer text */}
                <p className="text-[10px] text-gray-500 text-center font-semibold">
                  Free express shipping on orders over ₹1,500
                </p>
              </div>
            </div>
          </div>

          {/* Full Width Sections Below Main Content */}
          <div className="px-4 lg:px-8 mt-12 lg:mt-16 border-t border-gray-200 pt-12">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Left side: Reviews */}
              <div id="reviews-section">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">
                  Reviews for this item
                </h3>

                {productReviews.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-4xl font-bold text-gray-900">
                        {product.rating ? product.rating.toFixed(1) : "5.0"}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`text-lg ${i < Math.floor(product.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        ({productReviews.length} reviews)
                      </span>
                    </div>

                    <div className="space-y-6">
                      {productReviews.slice(0, 5).map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={`text-sm ${i < Math.floor(review.rating) ? "text-gray-900 fill-gray-900" : "text-gray-300"}`}
                              />
                            ))}
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(review.createdAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed mb-3">{review.comment}</p>

                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                              {review.user.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              {review.user}
                            </span>
                          </div>

                          {review.vendorResponse && (
                            <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-200">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white">
                                  {vendor?.storeName?.charAt(0) || "V"}
                                </div>
                                <span className="text-xs font-bold text-gray-900">
                                  {vendor?.storeName || "Vendor"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{review.vendorResponse}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No reviews yet.</p>
                )}

                {/* Write Review */}
                {isAuthenticated && isMongoId(product?.id) && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    {eligibleDeliveredOrderId ? (
                      <ReviewForm
                        productId={product.id}
                        onSubmit={handleSubmitReview}
                      />
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-600">
                        Reviews are available after product delivery.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right side: Empty or extra content (Etsy has sticky right sidebar so it's usually empty here below the sticky area) */}
              <div className="hidden lg:block"></div>
            </div>

            {/* Community Q&A */}
            <div className="mt-16 lg:mt-24 max-w-4xl">

              {/* Community Q&A */}
              <ProductQA productId={product.id} />
            </div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="px-4 py-8 lg:px-8 mt-8 lg:mt-16 border-t border-gray-200">
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">
                You May Also Like
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {similarProducts.map((similarProduct) => (
                  <ProductCard
                    key={similarProduct.id}
                    product={similarProduct}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar (Mobile Only) */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleFavorite}
              className={`p-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${isFavorite
                ? "bg-red-50 text-red-600 border-2 border-red-200"
                : "bg-gray-100 text-gray-700"
                }`}>
              <FiHeart
                className={`text-xl ${isFavorite ? "fill-red-600" : ""}`}
              />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.name,
                    text: `Check out ${product.name}`,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied to clipboard");
                }
              }}
              className="p-3 bg-gray-100 text-gray-700 rounded-xl font-semibold transition-all duration-300">
              <FiShare2 className="text-xl" />
            </button>
            {isInCart ? (
              <button
                onClick={handleRemoveFromCart}
                className="flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100">
                <FiTrash2 className="text-xl" />
                <span>Remove</span>
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={selectedAvailableStock <= 0}
                className={`flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 ${selectedAvailableStock <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "gradient-green text-white hover:shadow-glow-green"
                  }`}>
                <FiShoppingBag className="text-xl" />
                <span>
                  {selectedAvailableStock <= 0
                    ? "Out of Stock"
                    : "Add to Cart"}
                </span>
              </button>
            )}
          </div>
        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default MobileProductDetail;

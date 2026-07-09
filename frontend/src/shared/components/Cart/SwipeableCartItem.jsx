import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiTrash2, FiMinus, FiPlus, FiHeart, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCartStore } from "../../store/useStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { formatPrice } from "../../utils/helpers";
import { formatVariantLabel } from "../../utils/variant";
import useSwipeGesture from "../../../modules/UserApp/hooks/useSwipeGesture";

const SwipeableCartItem = ({ item, index }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDeleted, setIsDeleted] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const deletedItemRef = useRef(null);

    const { removeItem, updateQuantity } = useCartStore();
    const { addItem: addToWishlist } = useWishlistStore();

    // Only animate on mount
    useEffect(() => {
        setHasAnimated(true);
    }, []);

    const getProductStock = () => Number(item?.stockQuantity);
    
    const unitStr = String(item?.unit || '').toLowerCase();
    const isTurbanItem = item?.variant?.fabric !== undefined || (item?.name || '').toLowerCase().includes('turban');
    const isFractionalUnit = !isTurbanItem && ['meter', 'meters', 'm', 'kg', 'kilogram', 'kilograms', 'gram', 'grams', 'g', 'litre', 'litres', 'l'].includes(unitStr);
    const quantityStep = isFractionalUnit ? 0.5 : 1;
    const minQuantity = isFractionalUnit ? 0.5 : 1;

    const isMaxQuantity = (quantity) => {
        return false;
    };

    const isLowStock = () => String(item?.stock || "") === "low_stock";

    const handleQuantityChange = (id, currentQuantity, change, variant) => {
        let newQuantity = currentQuantity + change;
        if (!isFractionalUnit) {
            newQuantity = Math.round(newQuantity);
        }

        if (newQuantity < minQuantity) {
            removeItem(id, variant);
            return;
        }

        updateQuantity(id, newQuantity, variant);
    };

    const handleSaveForLater = (item) => {
        const addedToWishlist = addToWishlist({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
        });
        if (!addedToWishlist) return;
        removeItem(item.id, item.variant);
        toast.success("Saved for later!");
    };

    const handleSwipeRight = () => {
        setIsDeleted(true);
        deletedItemRef.current = { ...item };
        removeItem(item.id, item.variant);
        toast.success("Item removed", {
            duration: 3000,
            action: {
                label: "Undo",
                onClick: () => {
                    if (deletedItemRef.current) {
                        const { addItem: addToCart } = useCartStore.getState();
                        addToCart(deletedItemRef.current);
                        setIsDeleted(false);
                        deletedItemRef.current = null;
                    }
                },
            },
        });
    };

    const swipeHandlers = useSwipeGesture({
        onSwipeRight: handleSwipeRight,
        threshold: 100,
    });

    // Update offset based on swipe state
    useEffect(() => {
        if (swipeHandlers.swipeState.isSwiping) {
            setSwipeOffset(Math.max(0, swipeHandlers.swipeState.offset));
        } else if (!swipeHandlers.swipeState.isSwiping && swipeOffset < 100) {
            setSwipeOffset(0);
        }
    }, [swipeHandlers.swipeState.isSwiping, swipeHandlers.swipeState.offset]);

    if (isDeleted) return null;

    return (
        <motion.div
            initial={hasAnimated ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, x: swipeOffset }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
            }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="relative"
            onTouchStart={swipeHandlers.onTouchStart}
            onTouchMove={swipeHandlers.onTouchMove}
            onTouchEnd={swipeHandlers.onTouchEnd}>
            <div className="flex gap-4 p-4 bg-white border border-[#e9d7cb] rounded-xl relative">
                {/* Delete Background */}
                {swipeOffset > 0 && (
                    <div className="absolute inset-0 bg-red-500 rounded-xl flex items-center justify-end pr-4">
                        <FiTrash2 className="text-white text-xl" />
                    </div>
                )}

                {/* Product Image */}
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#fff8f5] relative z-10 border border-[#e9d7cb]/50">
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 relative z-10 flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-[#231a13] text-sm line-clamp-2">
                            {item.name}
                        </h3>
                        <p className="text-sm font-extrabold text-[#8d4b00] whitespace-nowrap">
                            {formatPrice(item.price)}
                        </p>
                    </div>

                    {formatVariantLabel(item?.variant) && (
                        <p className="text-xs text-[#554336] mb-2 font-medium">
                            {formatVariantLabel(item?.variant)}
                        </p>
                    )}

                    {/* Stock Warning */}
                    {isLowStock() && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mb-2">
                            <FiAlertCircle className="text-xs" />
                            <span>Only {getProductStock()} left!</span>
                        </div>
                    )}

                    <div className="mt-auto"></div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#e9d7cb]/50 mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleQuantityChange(item.id, item.quantity, -quantityStep, item.variant);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md border border-[#e9d7cb] text-[#554336] hover:bg-[#fff8f5] transition-colors">
                                <FiMinus className="text-xs" />
                            </button>
                            <motion.span
                                key={item.quantity}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                                style={{ willChange: "transform", transform: "translateZ(0)" }}
                                className="text-sm font-bold text-[#231a13] min-w-[1.5rem] text-center">
                                {item.quantity}
                            </motion.span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleQuantityChange(item.id, item.quantity, quantityStep, item.variant);
                                }}
                                disabled={isMaxQuantity(item.quantity)}
                                className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${isMaxQuantity(item.quantity)
                                    ? "bg-gray-100 border-[#e9d7cb]/50 text-gray-400 cursor-not-allowed"
                                    : "border-[#e9d7cb] text-[#554336] hover:bg-[#fff8f5]"
                                    }`}>
                                <FiPlus className="text-xs" />
                            </button>
                        </div>

                        {/* Text Actions */}
                        <div className="flex items-center gap-1 sm:gap-3">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSaveForLater(item);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-[#554336] hover:text-[#8d4b00] hover:bg-[#fdeade]/50 rounded-md transition-colors">
                                <FiHeart className="text-[13px]" />
                                <span className="hidden sm:inline">Wishlist</span>
                            </button>
                            
                            <div className="w-[1px] h-3 bg-[#e9d7cb] hidden sm:block"></div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeItem(item.id, item.variant);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                <FiTrash2 className="text-[13px]" />
                                <span className="hidden sm:inline">Remove</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SwipeableCartItem;

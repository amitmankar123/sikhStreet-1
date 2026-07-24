import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiChevronLeft, FiChevronRight, FiPlayCircle, FiHeart, FiStar, FiCompass } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LazyImage from "../LazyImage";
import useSwipeGesture from "../../../modules/UserApp/hooks/useSwipeGesture";

const ImageGallery = ({
  images,
  video,
  productName = "Product",
  showFavorite = false,
  isFavorite = false,
  onFavoriteClick = () => {},
  isBestseller = false,
  onLookInsideClick = null,
  children
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const videoRef = useRef(null);

  // Ensure images is an array
  const imageArray =
    Array.isArray(images) && images.length > 0
      ? images
      : [images].filter(Boolean);

  const mediaArray = [
    ...imageArray.map((url) => ({ type: "image", url })),
    ...(video ? [{ type: "video", url: video }] : []),
  ];

  const displayIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;

  useEffect(() => {
    if (mediaArray[displayIndex]?.type === "video" && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.log("Autoplay blocked or failed:", err);
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [displayIndex, mediaArray]);

  if (mediaArray.length === 0) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400">No media available</p>
      </div>
    );
  }

  const handleThumbnailClick = (index) => {
    setSelectedIndex(index);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % mediaArray.length);
  };

  const handlePrevious = () => {
    setSelectedIndex(
      (prev) => (prev - 1 + mediaArray.length) % mediaArray.length
    );
  };

  const handleImageClick = () => {
    if (mediaArray[displayIndex]?.type === "image") {
      setIsLightboxOpen(true);
    }
  };

  // Swipe gestures for image navigation
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
    threshold: 50,
  });

  return (
    <>      <div className="w-full flex flex-row gap-4">
        {/* Thumbnails (Always Left Side) */}
        {mediaArray.length > 1 && (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] lg:max-h-[600px] w-12 sm:w-16 md:w-20 xl:w-24 flex-shrink-0 hide-scrollbar">
            {mediaArray.map((media, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                onMouseEnter={() => {
                  if (media.type === "video") {
                    setHoveredIndex(index);
                  }
                }}
                onMouseLeave={() => {
                  if (media.type === "video") {
                    setHoveredIndex(null);
                  }
                }}
                className={`w-full aspect-square flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 relative bg-gray-100 ${selectedIndex === index
                  ? "border-gray-900"
                  : "border-transparent hover:border-gray-300"
                  }`}>
                {media.type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <FiPlayCircle className="text-xl text-gray-500" />
                  </div>
                ) : (
                  <LazyImage
                    src={media.url}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/100x100?text=Thumbnail";
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div
            className="relative w-full aspect-[4/5] lg:aspect-square bg-[#F9F9F9] rounded-2xl p-0 overflow-visible group"
            data-gallery>
            {/* Floating Back Button (Mobile Only) */}
            <button
              onClick={() => window.history.back()}
              className="absolute left-4 top-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all active:scale-95 lg:hidden"
            >
              <FiChevronLeft className="text-gray-800 text-2xl" />
            </button>

            {/* Floating Bestseller Badge */}
            {isBestseller && (
              <div className="absolute left-4 top-4 lg:top-4 max-lg:top-16 z-10 bg-[#FFB500] text-black font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/50 font-sans">
                <FiStar className="fill-black text-[10px]" />
                Bestseller
              </div>
            )}

            {/* Floating Look Inside Preview Button */}
            {onLookInsideClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLookInsideClick();
                }}
                className="absolute left-4 bottom-4 z-10 bg-white/95 text-stone-800 text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm border border-stone-200 hover:bg-stone-50 transition-colors font-sans font-semibold"
              >
                <FiCompass className="text-sm" />
                Look Inside (Preview)
              </button>
            )}

            {/* Floating Favorite Heart Button */}
            {showFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteClick();
                }}
                className="absolute right-4 top-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all"
              >
                <FiHeart className={`text-xl transition-colors ${isFavorite ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-600 hover:text-gray-800"}`} />
              </button>
            )}

            <motion.div
              key={displayIndex}
              className="w-full h-full flex items-center justify-center cursor-zoom-in rounded-2xl overflow-hidden"
              onClick={handleImageClick}
              onTouchStart={swipeHandlers.onTouchStart}
              onTouchMove={swipeHandlers.onTouchMove}
              onTouchEnd={swipeHandlers.onTouchEnd}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}>
              {mediaArray[displayIndex]?.type === "video" ? (
                <video
                  ref={videoRef}
                  src={mediaArray[displayIndex].url}
                  controls
                  muted
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
              ) : (
                <LazyImage
                  src={mediaArray[displayIndex]?.url}
                  alt={`${productName} - Image ${displayIndex + 1}`}
                  className="w-full h-full object-cover mix-blend-multiply"
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/500x500?text=Product+Image";
                  }}
                />
              )}
            </motion.div>


          </div>
          {children}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white transition-colors z-10">
              <FiX className="text-2xl" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center">
              <img
                src={mediaArray[selectedIndex]?.url}
                alt={`${productName} - Full view`}
                className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg"
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/800x800?text=Product+Image";
                }}
              />

              {/* Navigation in Lightbox */}
              {mediaArray.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white transition-colors">
                      <FiChevronLeft className="text-2xl" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white transition-colors">
                    <FiChevronRight className="text-2xl" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {mediaArray.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                  {selectedIndex + 1} / {mediaArray.length}
                </div>
              )}
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;

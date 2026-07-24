import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiChevronRight } from "react-icons/fi";
import { createPortal } from "react-dom";

const getMmForSize = (sizeStr) => {
  if (!sizeStr) return null;
  const s = String(sizeStr).toLowerCase().trim();
  if (s === "2.2" || s === "xs") return 54;
  if (s === "2.4" || s === "s" || s === "small") return 57;
  if (s === "2.6" || s === "m" || s === "medium") return 62;
  if (s === "2.8" || s === "l" || s === "large") return 66;
  if (s === "2.10" || s === "xl") return 70;
  if (s === "2.12" || s === "xxl") return 73;
  
  const num = parseFloat(sizeStr);
  if (!isNaN(num)) {
    if (num >= 2 && num <= 3) {
      const whole = Math.floor(num);
      const fraction = Math.round((num - whole) * 10);
      const inches = whole + (fraction / 16);
      return Math.round(inches * 25.4);
    }
    if (num > 3 && num < 10) return Math.round(num * 25.4);
    if (num >= 40 && num <= 110) return Math.round(num);
  }
  return null;
};

const KadaMeasurementTool = ({ isOpen, onClose, onConfirm, selectedSize, availableSizes = [] }) => {
  const getInitialDiameter = () => {
    if (selectedSize) {
      const mm = getMmForSize(selectedSize);
      if (mm) return mm;
    }
    return 64; // Default to standard Medium (64mm)
  };

  const [diameter, setDiameter] = useState(getInitialDiameter());

  useEffect(() => {
    if (isOpen) {
      setDiameter(getInitialDiameter());
    }
  }, [isOpen, selectedSize]);

  // Adjust standard scale for screen display to match physical millimeters (1mm = 3.65px on average device densities)
  const MM_TO_PX = 3.65; 

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


  const handleSliderChange = (e) => {
    setDiameter(Number(e.target.value));
  };

  const handleIncrement = () => setDiameter((prev) => Math.min(prev + 1, 100));
  const handleDecrement = () => setDiameter((prev) => Math.max(prev - 1, 50));

  const getDynamicRecommendedSize = (mm) => {
    // If availableSizes are provided, check if we have an exact match first
    if (availableSizes && availableSizes.length > 0) {
      const exactMatch = availableSizes.find(size => {
        const sizeMm = getMmForSize(size);
        return sizeMm === mm;
      });

      if (exactMatch) {
        return {
          size: String(exactMatch).replace(" mm", ""),
          inner: String(exactMatch),
          note: "Perfect Fit",
          label: String(exactMatch)
        };
      }

      // If no exact match, return as a custom size option so it reflects correctly
      return {
        size: `${mm} mm`,
        inner: `${mm} mm`,
        note: "Custom Measured Size",
        label: `${mm} mm (Custom)`
      };
    }

    // Fallback standard mapping
    const mapping = [
      { max: 59, size: "XS", inner: "58 mm", label: "Extra Small", note: "Tight Fit" },
      { max: 62, size: "Small", inner: "60 mm", label: "Small", note: "Comfortable Fit" },
      { max: 66, size: "Medium", inner: "64 mm", label: "Medium", note: "Perfect Fit" },
      { max: 70, size: "Large", inner: "68 mm", label: "Large", note: "Traditional Fit" },
      { max: 74, size: "XL", inner: "72 mm", label: "Extra Large", note: "Loose Fit" },
      { max: 110, size: "XXL", inner: "76 mm", label: "Double Extra Large", note: "Oversized Fit" }
    ];
    return mapping.find(m => mm <= m.max) || mapping[mapping.length - 1];
  };

  const recommended = getDynamicRecommendedSize(diameter);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Measuring Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between z-10 max-h-[90vh]"
          >
            {/* Close button top right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-25 p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50/80 hover:bg-gray-100 rounded-full transition-all duration-300 shadow-sm border border-gray-100/50"
            >
              <FiX className="w-4 h-4" />
            </button>

            {/* Sizing Tool Body */}
            <div className="flex-1 w-full flex flex-col justify-start items-center text-center px-5 pt-8 pb-4 relative overflow-y-auto custom-scrollbar gap-4">
              {/* Title & Instructions */}
              <div className="w-full">
                <span className="text-[9px] uppercase tracking-widest text-black font-bold bg-black/10 px-2.5 py-0.5 rounded-full">
                  Sikh Street Jewelry Guide
                </span>
                <h2 className="text-lg font-black text-gray-900 mt-2 mb-1">Find Your Perfect Kadda Size</h2>
                <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-tight">
                  Place your existing Kadda flat on your screen. Adjust the slider until the golden circle perfectly matches the <strong>inner diameter</strong>.
                </p>
              </div>

              {/* Interactive Measuring Circle Area */}
              <div className="relative w-full h-[380px] bg-gradient-to-b from-gray-50/50 to-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 my-1">
                {/* Radial guides */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[85%] h-[85%] rounded-full border border-dashed border-gray-200/60" />
                  <div className="w-[60%] h-[60%] rounded-full border border-dashed border-gray-200/60" />
                  <div className="w-full h-px bg-gray-100" />
                  <div className="absolute h-full w-px bg-gray-100" />
                </div>

                {/* Dynamic Kadda Ring (Luxury Gold Styling) */}
                <motion.div
                  animate={{
                    width: diameter * MM_TO_PX,
                    height: diameter * MM_TO_PX,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="relative rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    boxSizing: "content-box",
                    boxShadow: "0 8px 20px -5px rgba(184, 134, 11, 0.25), inset 0 2px 4px rgba(255,255,255,0.6)",
                    border: "18px solid #F5A623", // Polished bold Metallic gold Kada
                    background: "radial-gradient(circle, rgba(253,251,247,0.3) 0%, rgba(212,175,55,0.05) 100%)",
                  }}
                >
                  {/* Center Measurement Display */}
                  <div className="text-center font-serif text-gray-800">
                    <span className="block text-2xl font-black tracking-tighter text-gray-900">{diameter}</span>
                    <span className="text-[9px] font-sans font-bold tracking-widest text-black uppercase">mm</span>
                  </div>
                </motion.div>
              </div>

              {/* Sizing Slider Panel */}
              <div className="w-full space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold px-1">
                  <span>50 mm</span>
                  <span className="text-gray-800 font-bold">Inner Diameter</span>
                  <span>100 mm</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Minus Button */}
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-700 font-bold transition-all shadow-sm"
                  >
                    −
                  </button>

                  {/* Slider Input */}
                  <div className="flex-1 relative py-1">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={diameter}
                      onChange={handleSliderChange}
                      className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#F5A623]"
                      style={{
                        background: `linear-gradient(to right, #F5A623 0%, #B8860B ${((diameter - 50) / 50) * 100}%, #F3F4F6 ${((diameter - 50) / 50) * 100}%, #F3F4F6 100%)`
                      }}
                    />
                  </div>

                  {/* Plus Button */}
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-700 font-bold transition-all shadow-sm"
                  >
                    +
                  </button>
                </div>

                {/* Sizing Results Panel */}
                <div className="bg-white border border-black/10 rounded-xl p-3 flex items-center justify-between shadow-sm">
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-black uppercase tracking-wider block mb-0.5">
                      Recommended Size
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-gray-900 tracking-tight">
                        {recommended.label}
                      </span>
                      <span className="text-[10px] text-black font-bold">
                        ({recommended.inner})
                      </span>
                    </div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-emerald-100/50">
                    <FiCheck className="stroke-[3] w-3 h-3" />
                    <span>{recommended.note || "Perfect Fit"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Footer Panel */}
            <div className="p-4 bg-gray-50/60 border-t border-gray-100 w-full">
              <div className="w-full flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onConfirm(recommended)}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-black hover:bg-[#F5A623] hover:text-black transition-colors hover:bg-[#F5A623] transition-all duration-300 shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <span>Continue with this Size</span>
                  <FiChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
                <p className="text-[8px] text-gray-400 mt-1 text-center">
                  *Disclaimer: Set screen zoom to 100% for maximum accuracy. Device densities may cause minor variances.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default KadaMeasurementTool;

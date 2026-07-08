import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck } from "react-icons/fi";

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
    if (num > 3 && num < 10) return Math.round(num * 25.4); // inches to mm
    if (num >= 40 && num <= 110) return Math.round(num); // raw mm
  }
  return null;
};

const KadaMeasurementTool = ({ isOpen, onClose, onConfirm, selectedSize, availableSizes = [] }) => {
  const getInitialDiameter = () => {
    if (selectedSize) {
      const mm = getMmForSize(selectedSize);
      if (mm) return mm;
    }
    return 62;
  };

  const [diameter, setDiameter] = useState(getInitialDiameter());

  useEffect(() => {
    if (isOpen) {
      setDiameter(getInitialDiameter());
    }
  }, [isOpen, selectedSize]);

  const MM_TO_PX = 3.78; 

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

  if (!isOpen) return null;

  const handleSliderChange = (e) => {
    setDiameter(Number(e.target.value));
  };

  const handleIncrement = () => setDiameter((prev) => Math.min(prev + 1, 110));
  const handleDecrement = () => setDiameter((prev) => Math.max(prev - 1, 40));

  const getDynamicRecommendedSize = (mm) => {
    if (availableSizes && availableSizes.length > 0) {
      let closestSize = availableSizes[0];
      let minDiff = Infinity;
      
      availableSizes.forEach(size => {
        const sizeMm = getMmForSize(size) || 62;
        const diff = Math.abs(sizeMm - mm);
        if (diff < minDiff) {
          minDiff = diff;
          closestSize = size;
        }
      });
      return { size: String(closestSize), inner: "Best Fit" };
    }
    
    if (mm < 55) return { size: "XS", inner: "2.2" };
    if (mm >= 55 && mm < 60) return { size: "Small", inner: "2.4" };
    if (mm >= 60 && mm < 65) return { size: "Medium", inner: "2.6" };
    if (mm >= 65 && mm < 70) return { size: "Large", inner: "2.8" };
    return { size: "XL", inner: "2.10" };
  };

  const recommended = getDynamicRecommendedSize(diameter);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Measure Your Kada</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 overflow-y-auto custom-scrollbar">
            <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
              Place your existing Kada flat against the screen. Adjust the slider until the blue circle perfectly matches the <strong>inner edge</strong> of your Kada.
            </p>

            {/* Visualization Area */}
            <div className="relative w-full h-[450px] bg-gray-50/50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 mb-6">
              {/* Guidelines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-full h-px bg-primary-500" />
                <div className="absolute h-full w-px bg-primary-500" />
              </div>

              {/* Dynamic Circle */}
              <div
                className="rounded-full border-4 border-primary-500 bg-primary-50/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(var(--color-primary-500),0.2)] transition-all duration-100 ease-out"
                style={{
                  width: `${diameter * MM_TO_PX}px`,
                  height: `${diameter * MM_TO_PX}px`,
                }}
              >
                {/* Diameter Label */}
                <div className="absolute -top-3 bg-white px-3 py-1 rounded-full text-xs font-bold text-primary-700 border border-primary-200 shadow-sm">
                  {diameter} mm
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleDecrement}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
              >
                −
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="40"
                  max="110"
                  value={diameter}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[10px] font-medium text-gray-400 mt-2 px-1">
                  <span>40mm</span>
                  <span>75mm</span>
                  <span>110mm</span>
                </div>
              </div>

              <button
                onClick={handleIncrement}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
              >
                +
              </button>
            </div>

            {/* Recommendation Result */}
            <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
                  Recommended Size
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">
                    {recommended.size}
                  </span>
                  <span className="text-sm font-semibold text-primary-700">
                    ({recommended.inner})
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
                <FiCheck className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center mt-4 px-4 leading-relaxed">
              *Disclaimer: For best accuracy, set your screen zoom to default 100%. Due to varying device pixel densities, slight variations may occur.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(recommended)}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-[0_4px_14px_0_rgba(var(--color-primary-600),0.39)]"
            >
              Select Size
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KadaMeasurementTool;
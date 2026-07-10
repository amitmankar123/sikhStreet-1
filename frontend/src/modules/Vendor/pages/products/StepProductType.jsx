import React from "react";
import { FiBox, FiDownloadCloud, FiLock } from "react-icons/fi";
import { motion } from "framer-motion";

export default function StepProductType({ value, onChange, isEdit }) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          Product Type Selection
          {isEdit && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <FiLock className="w-3 h-3" /> Locked in Edit Mode
            </span>
          )}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit 
            ? "Product type cannot be converted between physical and digital once the listing is created." 
            : "Choose whether you are listing a physical item requiring shipping or a downloadable digital item."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Physical Product Card */}
        <motion.div
          whileHover={isEdit ? {} : { y: -4, scale: 1.01 }}
          onClick={() => !isEdit && onChange("physical")}
          className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
            isEdit ? "opacity-75" : "cursor-pointer"
          } ${
            value === "physical"
              ? "border-primary-600 bg-primary-50/50 shadow-md ring-2 ring-primary-500/20"
              : "border-gray-200 hover:border-primary-400 bg-white"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            value === "physical" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-600"
          }`}>
            <FiBox className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Physical Product</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Sell physical items such as Apparel, Turbans, Kada/Bangles, Instruments, and Wall Decor that require physical inventory tracking and package shipping.
          </p>
          {value === "physical" && (
            <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
              ✓
            </div>
          )}
        </motion.div>

        {/* Digital Product Card */}
        <motion.div
          whileHover={isEdit ? {} : { y: -4, scale: 1.01 }}
          onClick={() => !isEdit && onChange("digital")}
          className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
            isEdit ? "opacity-75" : "cursor-pointer"
          } ${
            value === "digital"
              ? "border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20"
              : "border-gray-200 hover:border-purple-400 bg-white"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            value === "digital" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600"
          }`}>
            <FiDownloadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-purple-950">Digital Product</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Sell downloadable digital files such as Printable Wall Art, E-Books, Digital Paintings, Vector Assets, and Templates with zero inventory and zero shipping logistics.
          </p>
          {value === "digital" && (
            <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
              ✓
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

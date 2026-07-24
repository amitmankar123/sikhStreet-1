import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiCheck } from 'react-icons/fi';
import { useLocationStore } from '../../../../shared/store/locationStore';

const LocationSelectorModal = ({ isOpen, onClose }) => {
  const { userLocation, setLocation } = useLocationStore();
  
  const [tempLocation, setTempLocation] = useState(userLocation);

  // Sync temp location with store when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempLocation(userLocation);
    }
  }, [isOpen, userLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempLocation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApply = () => {
    setLocation(tempLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100000] flex flex-col justify-end bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-t-2xl w-full flex flex-col max-h-[90vh]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FiMapPin className="text-[#F5A623] text-xl" />
              <h2 className="text-lg font-bold text-brand-navy">Choose Location</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            <p className="text-sm text-gray-500">
              Select your location to discover vendors near you. Vendors closer to you will appear first.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={tempLocation.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-saffron"
                  placeholder="e.g., India"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={tempLocation.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-saffron"
                  placeholder="e.g., Punjab"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={tempLocation.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-saffron"
                  placeholder="e.g., Mohali"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sector / Locality / Area</label>
                <input
                  type="text"
                  name="sector"
                  value={tempLocation.sector}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-saffron"
                  placeholder="e.g., Sector 70"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleApply}
              className="w-full py-3 bg-brand-navy text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-navy/90 transition-colors"
            >
              <FiCheck />
              <span>Apply Location</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationSelectorModal;

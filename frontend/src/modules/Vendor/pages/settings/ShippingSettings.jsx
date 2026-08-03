import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiTruck, FiMapPin, FiGlobe, FiDollarSign } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useVendorAuthStore } from "../../store/vendorAuthStore";
import toast from 'react-hot-toast';

const renderLogo = (id) => {
  switch (id) {
    case 'fedex':
      return (
        <div className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 flex items-center justify-center h-12 w-28 shadow-sm flex-shrink-0 select-none">
          <div className="font-sans font-black text-[22px] tracking-tight">
            <span className="text-[#4D148C]">Fed</span>
            <span className="text-[#FF6600]">Ex</span>
          </div>
        </div>
      );
    case 'delhivery':
      return (
        <div className="bg-white border border-gray-200 rounded-xl px-2 py-1 flex items-center justify-center h-12 w-28 shadow-sm flex-shrink-0 select-none">
          <div className="flex items-center font-sans font-black tracking-widest text-[10px]">
            <span className="text-gray-900">DELHIVERY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E51B24] ml-0.5 mt-1.5 flex-shrink-0"></span>
          </div>
        </div>
      );
    case 'bluedart':
      return (
        <div className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 flex items-center justify-center h-12 w-28 shadow-sm flex-shrink-0 select-none">
          <div className="flex flex-col font-sans italic font-black text-[10px] tracking-tight text-blue-900 leading-none">
            <span>BLUE DART</span>
            <span className="h-0.5 bg-[#FFCC00] mt-0.5 w-full"></span>
          </div>
        </div>
      );
    case 'dhl':
      return (
        <div className="bg-[#FFCC00] rounded-xl px-3 py-2 flex items-center justify-center h-12 w-28 shadow-sm flex-shrink-0 select-none border border-[#E6B800]">
          <div className="font-sans font-black italic tracking-tighter text-base text-[#D4001A] transform -skew-x-6">
            DHL
          </div>
        </div>
      );
    default:
      return (
        <div className="bg-gray-100 border rounded-xl h-12 w-28 flex items-center justify-center font-bold text-gray-400">
          LOGISTICS
        </div>
      );
  }
};

const ShippingSettings = () => {
  const { vendor, updateProfile } = useVendorAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shippingEnabled: true,
    freeShippingThreshold: 100,
    defaultShippingRate: 5,
    shippingMethods: ['standard'],
    shippingZones: [],
    handlingTime: 1, // days
    processingTime: 1, // days
  });
  const [activeSection, setActiveSection] = useState('general');

  const [carrierSettings, setCarrierSettings] = useState([
    {
      id: 'fedex',
      name: 'FedEx Express',
      shortName: 'FedEx',
      bgColor: 'bg-purple-100 text-purple-700 border-purple-200',
      domesticEnabled: true,
      domesticRate: 12.00,
      internationalEnabled: true,
      internationalRate: 45.00,
      supportedServices: ['Priority Overnight', 'Standard Overnight', 'Economy Ground']
    },
    {
      id: 'delhivery',
      name: 'Delhivery Logistics',
      shortName: 'Delhivery',
      bgColor: 'bg-amber-100 text-amber-805 border-amber-200',
      domesticEnabled: true,
      domesticRate: 5.00,
      internationalEnabled: false,
      internationalRate: 25.00,
      supportedServices: ['Express Cargo', 'Same Day Delivery', 'Cash on Delivery (COD)']
    },
    {
      id: 'bluedart',
      name: 'Blue Dart Express',
      shortName: 'BlueDart',
      bgColor: 'bg-blue-100 text-blue-700 border-blue-200',
      domesticEnabled: false,
      domesticRate: 8.00,
      internationalEnabled: false,
      internationalRate: 35.00,
      supportedServices: ['Domestic Priority', 'Dart Apex', 'Dart Ground']
    },
    {
      id: 'dhl',
      name: 'DHL Worldwide Express',
      shortName: 'DHL',
      bgColor: 'bg-red-100 text-red-650 border-red-200',
      domesticEnabled: false,
      domesticRate: 15.00,
      internationalEnabled: true,
      internationalRate: 50.00,
      supportedServices: ['Express Worldwide', 'Express Envelope', 'DHL Import Express']
    }
  ]);

  useEffect(() => {
    if (vendor) {
      setFormData({
        shippingEnabled: vendor.shippingEnabled !== false,
        freeShippingThreshold: vendor.freeShippingThreshold || 100,
        defaultShippingRate: vendor.defaultShippingRate || 5,
        shippingMethods: vendor.shippingMethods || ['standard'],
        shippingZones: vendor.shippingZones || [],
        handlingTime: vendor.handlingTime || 1,
        processingTime: vendor.processingTime || 1,
      });

      const saved = localStorage.getItem(`vendor_carriers_${vendor.id || 'default'}`);
      if (saved) {
        try {
          setCarrierSettings(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load saved vendor carriers:", e);
        }
      }
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleCarrierToggle = (id, field) => {
    setCarrierSettings(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          [field]: !c[field]
        };
      }
      return c;
    }));
  };

  const handleCarrierRateChange = (id, field, value) => {
    setCarrierSettings(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          [field]: parseFloat(value) || 0
        };
      }
      return c;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      localStorage.setItem(`vendor_carriers_${vendor.id}`, JSON.stringify(carrierSettings));

      await updateProfile({
        shippingEnabled: formData.shippingEnabled,
        freeShippingThreshold: parseFloat(formData.freeShippingThreshold) || 0,
        defaultShippingRate: parseFloat(formData.defaultShippingRate) || 0,
        handlingTime: parseInt(formData.handlingTime) || 1,
        processingTime: parseInt(formData.processingTime) || 1,
        shippingMethods: carrierSettings.filter(c => c.domesticEnabled || c.internationalEnabled).map(c => c.id)
      });
      toast.success('Shipping settings and carrier selections saved successfully');
    } catch {
      // api.js shows toast
    }
  };

  const sections = [
    { id: 'general', label: 'General Settings', icon: FiTruck },
    { id: 'zones', label: 'Shipping Zones', icon: FiMapPin },
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
      className="space-y-6 max-w-full overflow-x-hidden"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Shipping Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Configure your shipping options and rates</p>
      </div>

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
                    ? 'border-purple-600 text-purple-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Icon className="text-base sm:text-lg" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6">
          {/* General Settings Section */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  name="shippingEnabled"
                  checked={formData.shippingEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-700">Enable Shipping</span>
                  <p className="text-xs text-gray-500 mt-1">Allow customers to purchase products with shipping</p>
                </div>
              </div>

              {formData.shippingEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Free Shipping Threshold
                      </label>
                      <input
                        type="number"
                        name="freeShippingThreshold"
                        value={formData.freeShippingThreshold}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Free shipping for orders above this amount</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Default Shipping Rate
                      </label>
                      <input
                        type="number"
                        name="defaultShippingRate"
                        value={formData.defaultShippingRate}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default shipping cost per order</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Processing Time (Days)
                      </label>
                      <input
                        type="number"
                        name="processingTime"
                        value={formData.processingTime}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Time to process orders before shipping</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Handling Time (Days)
                      </label>
                      <input
                        type="number"
                        name="handlingTime"
                        value={formData.handlingTime}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Time to prepare items for shipping</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Active Third-Party Carriers</h3>
                    <p className="text-xs text-gray-500 mb-6">Select the shipping services you want to offer to your customers and set their base rates.</p>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {carrierSettings.map((carrier) => (
                        <div key={carrier.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                          <div>
                            {/* Card Header: Logo & Title */}
                            <div className="flex items-center gap-4 mb-5 border-b border-gray-100 pb-4">
                              {renderLogo(carrier.id)}
                              <div>
                                <h4 className="font-bold text-gray-800 text-sm">{carrier.name}</h4>
                                <span className="text-[10px] bg-purple-55 bg-opacity-10 text-purple-650 border border-purple-100 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                                  Admin Configured
                                </span>
                              </div>
                            </div>

                            {/* Service Toggles and Rates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              {/* Domestic (Inside Country) */}
                              <div className={`p-3 rounded-xl border transition-all ${
                                carrier.domesticEnabled 
                                  ? 'border-purple-200 bg-purple-50/20' 
                                  : 'border-gray-150 bg-gray-50/50'
                              }`}>
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                  <input
                                    type="checkbox"
                                    checked={carrier.domesticEnabled}
                                    onChange={() => handleCarrierToggle(carrier.id, 'domesticEnabled')}
                                    className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
                                  />
                                  <span className="text-xs font-bold text-gray-700 select-none">Domestic Shipping</span>
                                </label>
                                <p className="text-[10px] text-gray-400 mb-2.5">Inside the country</p>
                                
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    disabled={!carrier.domesticEnabled}
                                    value={carrier.domesticRate}
                                    onChange={(e) => handleCarrierRateChange(carrier.id, 'domesticRate', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-6 pr-3 py-1.5 border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100/50 disabled:text-gray-400"
                                  />
                                </div>
                              </div>

                              {/* International (Outside Country) */}
                              <div className={`p-3 rounded-xl border transition-all ${
                                carrier.internationalEnabled 
                                  ? 'border-purple-200 bg-purple-50/20' 
                                  : 'border-gray-150 bg-gray-50/50'
                              }`}>
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                  <input
                                    type="checkbox"
                                    checked={carrier.internationalEnabled}
                                    onChange={() => handleCarrierToggle(carrier.id, 'internationalEnabled')}
                                    className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
                                  />
                                  <span className="text-xs font-bold text-gray-700 select-none">International Shipping</span>
                                </label>
                                <p className="text-[10px] text-gray-400 mb-2.5">Outside the country</p>
                                
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    disabled={!carrier.internationalEnabled}
                                    value={carrier.internationalRate}
                                    onChange={(e) => handleCarrierRateChange(carrier.id, 'internationalRate', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-6 pr-3 py-1.5 border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100/50 disabled:text-gray-400"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap border-t border-gray-100 pt-3.5 mt-2">
                            {carrier.supportedServices.map((service, index) => (
                              <span key={index} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-semibold text-slate-500">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Shipping Zones Section */}
          {activeSection === 'zones' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Shipping zones and per-zone rates are managed from Shipping Management.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/vendor/shipping-management')}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  Open Shipping Management
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
            >
              <FiSave />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ShippingSettings;


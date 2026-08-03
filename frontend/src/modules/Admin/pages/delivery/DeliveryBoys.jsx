import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

const DeliveryBoys = () => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const [configuringPartner, setConfiguringPartner] = useState(null);
  const [partners, setPartners] = useState([
    {
      id: 'fedex',
      name: 'FedEx Express',
      shortName: 'FedEx',
      bgColor: 'bg-purple-100 text-purple-700 border-purple-200',
      description: 'Global industry leader in courier services. Fully integrated for domestic & international express delivery.',
      status: 'configured',
      isActive: true,
      supportedServices: ['Priority Overnight', 'Standard Overnight', 'Economy Ground'],
    },
    {
      id: 'delhivery',
      name: 'Delhivery Logistics',
      shortName: 'Delhivery',
      bgColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: "India's largest logistics and supply chain services network. Highly integrated for e-commerce shipment & COD collections.",
      status: 'configured',
      isActive: true,
      supportedServices: ['Express Cargo', 'Same Day Delivery', 'Cash on Delivery (COD)'],
    },
    {
      id: 'bluedart',
      name: 'Blue Dart Express',
      shortName: 'BlueDart',
      bgColor: 'bg-blue-100 text-blue-700 border-blue-200',
      description: 'Premier air express shipping and integrated logistics in South Asia. Offering domestic express deliveries.',
      status: 'configure',
      isActive: false,
      supportedServices: ['Domestic Priority', 'Dart Apex', 'Dart Ground'],
    },
    {
      id: 'dhl',
      name: 'DHL Worldwide Express',
      shortName: 'DHL',
      bgColor: 'bg-red-100 text-red-600 border-red-200',
      description: 'Global standard in international shipping and logistics. Connects business across 220+ countries.',
      status: 'configure',
      isActive: false,
      supportedServices: ['Express Worldwide', 'Express Envelope', 'DHL Import Express'],
    }
  ]);

  const handleTogglePartner = (id) => {
    setPartners(prev => prev.map(p => {
      if (p.id === id) {
        const nextActive = !p.isActive;
        return {
          ...p,
          isActive: nextActive,
          status: nextActive ? 'configured' : 'configure'
        };
      }
      return p;
    }));
    const partner = partners.find(p => p.id === id);
    toast.success(`${partner.name} status updated`);
  };

  const handleSavePartnerConfig = (e) => {
    e.preventDefault();
    setPartners(prev => prev.map(p => {
      if (p.id === configuringPartner.id) {
        return {
          ...p,
          isActive: true,
          status: 'configured'
        };
      }
      return p;
    }));
    toast.success(`${configuringPartner.name} integration details updated!`);
    setConfiguringPartner(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Delivery Partners</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage third-party delivery integrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {renderLogo(partner.id)}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-800 text-base truncate">{partner.name}</h3>
                    <span className="text-xs text-gray-500">API Integration</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {partner.status === 'configured' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                      Configured
                    </span>
                  )}
                  {partner.status === 'configure' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{partner.description}</p>
              
              <div className="mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Supported Services</span>
                <div className="flex flex-wrap gap-1.5">
                  {partner.supportedServices.map((service, index) => (
                    <span key={index} className="px-2 py-0.5 bg-slate-50 text-slate-655 border border-slate-200 rounded text-[10px] font-semibold">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`toggle-${partner.id}`}
                  checked={partner.isActive}
                  onChange={() => handleTogglePartner(partner.id)}
                  className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor={`toggle-${partner.id}`} className="text-xs font-bold text-gray-600 cursor-pointer select-none">
                  {partner.isActive ? 'Active' : 'Inactive'}
                </label>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringPartner(partner)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  partner.isActive
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                }`}
              >
                {partner.status === 'configured' ? 'Edit Credentials' : 'Configure'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {configuringPartner !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfiguringPartner(null)}
              className="fixed inset-0 bg-black/50 z-[10000]"
            />

            {/* Modal Content */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black border text-base tracking-wider ${configuringPartner.bgColor}`}>
                    {configuringPartner.shortName}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">
                      Configure {configuringPartner.name}
                    </h3>
                    <p className="text-[10px] text-gray-400">Settings Sandbox & Live API Keys</p>
                  </div>
                </div>

                <form onSubmit={handleSavePartnerConfig} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Environment</label>
                    <select className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="sandbox">Sandbox (Testing / Mock)</option>
                      <option value="production">Production (Live)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">API Key / Client ID</label>
                    <input
                      type="text"
                      placeholder="e.g. fd_live_9a7s6d7a8d9a"
                      required
                      defaultValue={configuringPartner.id === 'fedex' ? 'fx_account_302194812' : configuringPartner.id === 'delhivery' ? 'dl_client_9471928' : ''}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">API Secret / Private Token</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      required
                      defaultValue="my_secret_token_123"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Sandbox Webhook Key</label>
                    <input
                      type="text"
                      placeholder="whsec_..."
                      defaultValue="whsec_mockkey12345"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pb-2">
                    <input
                      type="checkbox"
                      id="enable-tracking"
                      defaultChecked
                      className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="enable-tracking" className="text-xs font-bold text-gray-650">
                      Enable real-time tracking webhooks
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-xs"
                    >
                      Save Configuration
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfiguringPartner(null)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DeliveryBoys;

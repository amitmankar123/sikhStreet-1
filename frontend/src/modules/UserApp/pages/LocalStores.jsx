import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiMapPin } from 'react-icons/fi';
import PageTransition from '../../../shared/components/PageTransition';
import MobileLayout from '../components/Layout/MobileLayout';
import VendorShowcaseCard from '../components/Mobile/VendorShowcaseCard';
import { useLocationStore } from '../../../shared/store/locationStore';
import { usePublicVendorStore } from '../../../shared/store/publicVendorStore';
import { sortVendorsByProximity } from '../../../shared/utils/locationProximity';

const LocalStores = () => {
  const navigate = useNavigate();
  const { userLocation } = useLocationStore();
  const { fetchVendors, getApprovedVendors, isLoading } = usePublicVendorStore();

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Group vendors by proximity score
  const groupedVendors = useMemo(() => {
    const approvedVendors = getApprovedVendors().filter(v => v.isVerified);
    const scored = sortVendorsByProximity(approvedVendors, userLocation);
    
    return {
      sector: scored.filter(v => v.proximityScore === 5),
      city: scored.filter(v => v.proximityScore === 4),
      state: scored.filter(v => v.proximityScore === 3),
      country: scored.filter(v => v.proximityScore === 2),
      international: scored.filter(v => v.proximityScore === 1),
    };
  }, [userLocation]);
  
  const totalVendors = useMemo(() => {
    return Object.values(groupedVendors).reduce((acc, arr) => acc + arr.length, 0);
  }, [groupedVendors]);

  // Construct the display heading dynamically based on location
  const locationHeading = useMemo(() => {
    const parts = [];
    if (userLocation?.sector) parts.push(userLocation.sector);
    if (userLocation?.city) parts.push(userLocation.city);
    else if (userLocation?.state) parts.push(userLocation.state);
    
    return parts.length > 0 ? parts.join(', ') : 'Your Area';
  }, [userLocation]);

  return (
    <PageTransition>
      <MobileLayout showBottomNav={true} showCartBar={true}>
        <div className="w-full min-h-screen bg-gray-50 pb-24">
          
          {/* Custom Header */}
          <div className="bg-brand-navy px-4 pt-6 pb-6 rounded-b-3xl shadow-sm text-white sticky top-0 z-50">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <FiArrowLeft className="text-xl" />
              </button>
              <h1 className="text-lg font-bold">Local Stores</h1>
            </div>

            <div className="flex flex-col px-2">
              <span className="text-xs text-white/70 uppercase tracking-wider font-semibold mb-1">
                Showing allocated shops for
              </span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-saffron/20 flex items-center justify-center">
                  <FiMapPin className="text-brand-saffron" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-white truncate">
                  {locationHeading}
                </h2>
              </div>
            </div>
          </div>

          {/* Vendors Sections */}
          <div className="px-4 py-6 space-y-8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-500">
                {totalVendors} {totalVendors === 1 ? 'store' : 'stores'} found
              </p>
            </div>

            {totalVendors > 0 ? (
              <>
                {/* Sector Level */}
                {groupedVendors.sector.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      In {userLocation?.sector || "Your Area"}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:mx-0">
                      {groupedVendors.sector.map((vendor, index) => (
                        <div key={vendor.id} className="w-[160px] min-w-[160px] sm:w-full sm:min-w-0 flex justify-center">
                          <VendorShowcaseCard vendor={vendor} index={index} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* City / District Level */}
                {groupedVendors.city.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      Nearby in {userLocation?.city || "Your City"}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:mx-0">
                      {groupedVendors.city.map((vendor, index) => (
                        <div key={vendor.id} className="w-[160px] min-w-[160px] sm:w-full sm:min-w-0 flex justify-center">
                          <VendorShowcaseCard vendor={vendor} index={index} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* State Level */}
                {groupedVendors.state.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      Across {userLocation?.state || "Your State"}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:mx-0">
                      {groupedVendors.state.map((vendor, index) => (
                        <div key={vendor.id} className="w-[160px] min-w-[160px] sm:w-full sm:min-w-0 flex justify-center">
                          <VendorShowcaseCard vendor={vendor} index={index} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Country Level */}
                {groupedVendors.country.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      Top in {userLocation?.country || "Your Country"}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:mx-0">
                      {groupedVendors.country.map((vendor, index) => (
                        <div key={vendor.id} className="w-[160px] min-w-[160px] sm:w-full sm:min-w-0 flex justify-center">
                          <VendorShowcaseCard vendor={vendor} index={index} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* International Level */}
                {groupedVendors.international.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-800">International</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:mx-0">
                      {groupedVendors.international.map((vendor, index) => (
                        <div key={vendor.id} className="w-[160px] min-w-[160px] sm:w-full sm:min-w-0 flex justify-center">
                          <VendorShowcaseCard vendor={vendor} index={index} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiMapPin className="text-3xl text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No local stores found</h3>
                <p className="text-sm text-gray-500 max-w-[250px]">
                  We couldn't find any stores allocated to {locationHeading}. Try changing your location or check back later!
                </p>
              </div>
            )}
          </div>

        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default LocalStores;

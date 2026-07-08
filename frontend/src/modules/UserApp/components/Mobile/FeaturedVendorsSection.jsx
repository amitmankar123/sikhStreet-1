import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import VendorShowcaseCard from './VendorShowcaseCard';
import { usePublicVendorStore } from '../../../../shared/store/publicVendorStore';
import { useLocationStore } from '../../../../shared/store/locationStore';
import { sortVendorsByProximity } from '../../../../shared/utils/locationProximity';

const FeaturedVendorsSection = ({ vendors = null }) => {
  const { userLocation } = useLocationStore();
  const { getApprovedVendors } = usePublicVendorStore();
  
  const approvedVendors = Array.isArray(vendors) && vendors.length > 0
    ? vendors
    : getApprovedVendors();
    
  const verifiedVendors = approvedVendors.filter(v => v.isVerified);
  const featuredVendors = sortVendorsByProximity(verifiedVendors, userLocation).slice(0, 10);

  if (featuredVendors.length === 0) return null;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black font-heading text-brand-navy tracking-tight">Stores Near You</h2>
          <p className="text-sm md:text-base text-gray-500 mt-1 font-medium">Discover local vendors</p>
        </div>
        <Link
          to="/local-stores"
          className="flex items-center gap-1 text-sm text-brand-saffron font-bold hover:text-orange-600 transition-colors"
        >
          <span>See All</span>
          <FiArrowRight className="text-sm" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:gap-6 md:mx-0 md:px-0">
        {featuredVendors.map((vendor, index) => (
          <VendorShowcaseCard key={vendor.id} vendor={vendor} index={index} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedVendorsSection;


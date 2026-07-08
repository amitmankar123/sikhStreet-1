import { create } from "zustand";
import api from "../utils/api";
import { getCatalogVendors } from "../../modules/UserApp/data/catalogData";

export const usePublicVendorStore = create((set, get) => ({
  vendors: [],
  isLoading: false,
  error: null,
  isFetched: false,

  fetchVendors: async () => {
    // Prevent multiple fetches if already fetched successfully (can be forced by setting isFetched false)
    if (get().isFetched && get().vendors.length > 0) return;

    set({ isLoading: true, error: null });
    try {
      // The API endpoint for public vendors is /api/vendors/all
      const response = await api.get('/vendors/all?limit=100');
      
      const fetchedVendors = response.data?.data?.vendors || [];
      
      // Merge with static vendors as fallback or keep only fetched
      // For a robust system while migrating, we can merge or just use fetched
      // We will only use fetched if we want "real" real-time. But let's fallback if empty
      let finalVendors = fetchedVendors;
      
      if (finalVendors.length === 0) {
        // Fallback to static vendors if API returned nothing (for development)
        finalVendors = getCatalogVendors();
      }

      set({ 
        vendors: finalVendors, 
        isLoading: false, 
        isFetched: true 
      });
    } catch (error) {
      console.error("Failed to fetch public vendors:", error);
      // Fallback to static data on error
      set({ 
        vendors: getCatalogVendors(), 
        error: error.response?.data?.message || error.message, 
        isLoading: false,
        isFetched: true
      });
    }
  },

  getApprovedVendors: () => {
    return get().vendors.filter((v) => v.status === "approved");
  },
}));

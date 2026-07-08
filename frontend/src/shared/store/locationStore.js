import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useLocationStore = create(
  persist(
    (set) => ({
      userLocation: {
        country: 'India',
        state: 'Punjab',
        city: 'Mohali',
        sector: 'Sector 70', // Area / Locality
        street: '',
      },
      setLocation: (locationUpdates) => 
        set((state) => ({ 
          userLocation: { ...state.userLocation, ...locationUpdates } 
        })),
    }),
    {
      name: 'user-location-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

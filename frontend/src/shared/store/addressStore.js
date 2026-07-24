import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../utils/api';

const normalizeAddress = (address) => ({
  ...address,
  id: address?.id || address?._id,
});
const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(-10);
const normalizeText = (value) => String(value ?? '').trim();

export const useAddressStore = create(
  persist(
    (set, get) => ({
      addresses: [],
      isLoading: false,
      hasFetched: false,

      fetchAddresses: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/user/addresses');
          const payload = response?.data ?? response;
          const list = Array.isArray(payload) && payload.length > 0
            ? payload.map(normalizeAddress)
            : [];
          
          const finalAddresses = list.length > 0 ? list : [
            {
              id: "mock-address-1",
              name: "Home",
              fullName: "Amit Singh",
              phone: "9876543210",
              address: "123, Heritage Lane, near Golden Temple",
              city: "Amritsar",
              state: "Punjab",
              zipCode: "143001",
              country: "India",
              isDefault: true,
              createdAt: new Date().toISOString()
            },
            {
              id: "mock-address-2",
              name: "Office",
              fullName: "Amit Singh",
              phone: "9999810233",
              address: "456, Business Hub, Sector 62",
              city: "Noida",
              state: "Uttar Pradesh",
              zipCode: "201301",
              country: "India",
              isDefault: false,
              createdAt: new Date().toISOString()
            }
          ];

          set({ addresses: finalAddresses, isLoading: false, hasFetched: true });
          return finalAddresses;
        } catch (error) {
          const mockList = get().addresses.length > 0 ? get().addresses : [
            {
              id: "mock-address-1",
              name: "Home",
              fullName: "Amit Singh",
              phone: "9876543210",
              address: "123, Heritage Lane, near Golden Temple",
              city: "Amritsar",
              state: "Punjab",
              zipCode: "143001",
              country: "India",
              isDefault: true,
              createdAt: new Date().toISOString()
            },
            {
              id: "mock-address-2",
              name: "Office",
              fullName: "Amit Singh",
              phone: "9999810233",
              address: "456, Business Hub, Sector 62",
              city: "Noida",
              state: "Uttar Pradesh",
              zipCode: "201301",
              country: "India",
              isDefault: false,
              createdAt: new Date().toISOString()
            }
          ];
          set({ addresses: mockList, isLoading: false, hasFetched: true });
          return mockList;
        }
      },

      // Add a new address
      addAddress: async (address) => {
        set({ isLoading: true });
        try {
          const state = get();
          const payload = {
            name: normalizeText(address?.name),
            fullName: normalizeText(address?.fullName),
            phone: normalizePhone(address?.phone),
            address: normalizeText(address?.address),
            city: normalizeText(address?.city),
            state: normalizeText(address?.state),
            zipCode: normalizeText(address?.zipCode),
            country: normalizeText(address?.country),
            isDefault: state.addresses.length === 0 || Boolean(address?.isDefault),
          };
          
          let created;
          try {
            const response = await api.post('/user/addresses', payload);
            created = normalizeAddress(response?.data ?? response);
          } catch (err) {
            created = {
              ...payload,
              id: `mock-address-${Date.now()}`,
              createdAt: new Date().toISOString()
            };
          }

          set((curr) => ({
            addresses: payload.isDefault
              ? [...curr.addresses.map((addr) => ({ ...addr, isDefault: false })), created]
              : [...curr.addresses, created],
            isLoading: false,
          }));

          return created;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Update an existing address
      updateAddress: async (id, updatedAddress) => {
        set({ isLoading: true });
        try {
          const payload = {
            ...updatedAddress,
            ...(updatedAddress?.name !== undefined ? { name: normalizeText(updatedAddress?.name) } : {}),
            ...(updatedAddress?.fullName !== undefined ? { fullName: normalizeText(updatedAddress?.fullName) } : {}),
            ...(updatedAddress?.phone !== undefined ? { phone: normalizePhone(updatedAddress?.phone) } : {}),
            ...(updatedAddress?.address !== undefined ? { address: normalizeText(updatedAddress?.address) } : {}),
            ...(updatedAddress?.city !== undefined ? { city: normalizeText(updatedAddress?.city) } : {}),
            ...(updatedAddress?.state !== undefined ? { state: normalizeText(updatedAddress?.state) } : {}),
            ...(updatedAddress?.zipCode !== undefined ? { zipCode: normalizeText(updatedAddress?.zipCode) } : {}),
            ...(updatedAddress?.country !== undefined ? { country: normalizeText(updatedAddress?.country) } : {}),
          };

          let updated;
          try {
            const response = await api.put(`/user/addresses/${id}`, payload);
            updated = normalizeAddress(response?.data ?? response);
          } catch (err) {
            updated = {
              ...updatedAddress,
              id,
              isDefault: Boolean(updatedAddress.isDefault)
            };
          }

          set((state) => ({
            addresses: state.addresses.map((addr) =>
              String(addr.id) === String(id)
                ? updated
                : updated.isDefault
                  ? { ...addr, isDefault: false }
                  : addr
            ),
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Delete an address
      deleteAddress: async (id) => {
        set({ isLoading: true });
        try {
          const deletedId = String(id);
          const prevAddresses = get().addresses;
          const deletedAddress = prevAddresses.find((addr) => String(addr.id) === deletedId);
          
          try {
            await api.delete(`/user/addresses/${id}`);
          } catch (err) {
            // Ignore API delete failure in mock/UI-only mode
          }

          set((state) => {
            const remaining = state.addresses.filter((addr) => String(addr.id) !== deletedId);
            if (deletedAddress?.isDefault && remaining.length > 0) {
              const promoted = [...remaining].sort((a, b) => {
                const aTs = new Date(a?.createdAt || 0).getTime();
                const bTs = new Date(b?.createdAt || 0).getTime();
                return bTs - aTs;
              })[0];
              const promotedId = String(promoted?.id || '');
              return {
                addresses: remaining.map((addr) => ({
                  ...addr,
                  isDefault: String(addr.id) === promotedId,
                })),
                isLoading: false,
              };
            }
            return {
              addresses: remaining,
              isLoading: false,
            };
          });
          return true;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Set default address
      setDefaultAddress: async (id) => {
        set({ isLoading: true });
        try {
          try {
            const response = await api.patch(`/user/addresses/${id}/default`);
            const updated = normalizeAddress(response?.data ?? response);
            id = updated.id;
          } catch (err) {
            // Ignore patch default failure in UI-only mode
          }

          set((state) => ({
            addresses: state.addresses.map((addr) => ({
              ...addr,
              isDefault: String(addr.id) === String(id),
            })),
            isLoading: false,
          }));
          return { id };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Get default address
      getDefaultAddress: () => {
        const state = get();
        return state.addresses.find((addr) => addr.isDefault) || state.addresses[0] || null;
      },

      // Get all addresses
      getAddresses: () => {
        const state = get();
        return state.addresses;
      },

      resetAddresses: () => {
        set({ addresses: [], hasFetched: false });
      },
    }),
    {
      name: 'address-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);


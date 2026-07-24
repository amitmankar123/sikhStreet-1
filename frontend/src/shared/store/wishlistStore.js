import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../utils/api';
import { useAuthStore } from './authStore';
import { setPostLoginAction, setPostLoginRedirect } from '../utils/postLoginAction';

const isMongoId = (value) => {
  const str = String(value || '').trim();
  return /^[a-fA-F0-9]{24}$/.test(str) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(str);
};
const normalizeId = (value) => String(value ?? '').trim();
const getCurrentAuthUserId = () => {
  const authState = useAuthStore.getState();
  return normalizeId(authState?.user?.id || authState?.user?._id);
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname || '/home';
  if (currentPath === '/login') return;

  const fromPath = `${window.location.pathname || ''}${window.location.search || ''}${window.location.hash || ''}`;
  setPostLoginRedirect(fromPath || '/home');

  // SPA-friendly redirect without full page reload.
  const nextState = { from: { pathname: fromPath || '/home' } };
  window.history.pushState(nextState, '', '/login');
  window.dispatchEvent(new PopStateEvent('popstate', { state: nextState }));
};

const normalizeWishlistItem = (item) => {
  const product = item?.productId || item;
  const id = normalizeId(product?.id || product?._id || item?.id);
  return {
    id,
    name: product?.name || item?.name || 'Product',
    price: Number(product?.price ?? item?.price ?? 0),
    image: product?.image || item?.image || '',
    stock: product?.stock || item?.stock,
    unit: product?.unit || item?.unit,
    rating: Number(product?.rating ?? item?.rating ?? 0),
    originalPrice:
      product?.originalPrice !== undefined
        ? Number(product.originalPrice)
        : item?.originalPrice !== undefined
          ? Number(item.originalPrice)
          : undefined,
    productId: normalizeId(product?._id || item?.productId || item?.id),
  };
};

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      hasFetched: true,
      ownerUserId: null,

      fetchWishlist: async () => {
        set({ isLoading: false, hasFetched: true });
        return get().items;
      },

      ensureHydrated: () => {
        set({ hasFetched: true });
      },

      // Add item to wishlist
      addItem: (item) => {
        const normalizedItem = normalizeWishlistItem(item);
        if (!normalizedItem.id) {
          return false;
        }
        let added = false;
        set((state) => {
          const existingItem = state.items.find(
            (i) => normalizeId(i.id) === normalizeId(normalizedItem.id)
          );
          if (existingItem) {
            return state; // Item already in wishlist
          }
          added = true;
          return {
            items: [...state.items, normalizedItem],
          };
        });

        return added;
      },

      // Remove item from wishlist
      removeItem: (id) => {
        const normalizedId = normalizeId(id);
        set((state) => ({
          items: state.items.filter((item) => normalizeId(item.id) !== normalizedId),
        }));
      },

      // Check if item is in wishlist
      isInWishlist: (id) => {
        const state = get();
        const normalizedId = normalizeId(id);
        return state.items.some((item) => normalizeId(item.id) === normalizedId);
      },

      // Clear wishlist
      clearWishlist: () => {
        set({ items: [] });
      },

      // Get wishlist count
      getItemCount: () => {
        const state = get();
        return state.items.length;
      },

      // Move item from wishlist to cart (returns item for cart)
      moveToCart: (id) => {
        const normalizedId = normalizeId(id);
        const state = get();
        const item = state.items.find((i) => normalizeId(i.id) === normalizedId);
        if (item) {
          set({
            items: state.items.filter((i) => normalizeId(i.id) !== normalizedId),
          });
          return item;
        }
        return null;
      },

      resetWishlist: () => {
        set({ items: [], hasFetched: true, ownerUserId: null, isLoading: false });
      },
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        ownerUserId: state.ownerUserId,
      }),
    }
  )
);


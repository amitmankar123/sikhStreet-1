import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import toast from "react-hot-toast";
import { useAuthStore } from "./authStore";
import { setPostLoginAction, setPostLoginRedirect } from "../utils/postLoginAction";
import { getVariantSignature } from "../utils/variant";

const getCartLineKey = (id, variant = {}) =>
  `${String(id)}::${getVariantSignature(variant)}`;
const getCurrentAuthUserId = () => {
  const authState = useAuthStore.getState();
  return String(authState?.user?.id || authState?.user?._id || "").trim();
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  const currentPath = window.location.pathname || "/home";
  if (currentPath === "/login") return;

  const fromPath = `${window.location.pathname || ""}${window.location.search || ""}${window.location.hash || ""}`;
  setPostLoginRedirect(fromPath || "/home");

  // SPA-friendly redirect without full page reload.
  const nextState = { from: { pathname: fromPath || "/home" } };
  window.history.pushState(nextState, "", "/login");
  window.dispatchEvent(new PopStateEvent("popstate", { state: nextState }));
};

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      ownerUserId: null,
      addItem: (item) => {
        const authState = useAuthStore.getState();
        if (!authState?.isAuthenticated) {
          setPostLoginAction({
            type: "cart:add",
            payload: {
              ...item,
              quantity: Number(item?.quantity) > 0 ? Number(item.quantity) : 1,
            },
          });
          toast.error("Please login to add products to cart");
          redirectToLogin();
          return false;
        }
        const currentUserId = getCurrentAuthUserId();
        if (!currentUserId) {
          toast.error("Please login to add products to cart");
          redirectToLogin();
          return false;
        }

        const ownerUserId = String(get().ownerUserId || "").trim();
        if (ownerUserId && ownerUserId !== currentUserId) {
          set({ items: [], ownerUserId: currentUserId });
        }

        const lineKey = getCartLineKey(item.id, item.variant);
        const existingItem = get().items.find(
          (i) => String(i.cartLineKey || getCartLineKey(i.id, i.variant)) === lineKey
        );
        const quantityToAdd = Number(item.quantity) || 1;
        const newQuantity = existingItem
          ? Number(existingItem.quantity) + quantityToAdd
          : quantityToAdd;

        if (newQuantity <= 0) {
          return false;
        }

        // Extract vendorId and vendorName safely if vendorId is an object
        let finalVendorId = 1;
        let finalVendorName = "Unknown Vendor";
        if (item.vendorId) {
          if (typeof item.vendorId === "object") {
            finalVendorId = item.vendorId.id || item.vendorId._id || 1;
            finalVendorName = item.vendorId.storeName || item.vendorId.name || item.vendorName || "Unknown Vendor";
          } else {
            finalVendorId = item.vendorId;
            finalVendorName = item.vendorName || "Unknown Vendor";
          }
        }
        if (String(finalVendorId) === "[object Object]") {
          finalVendorId = 1;
        }

        // Include vendor information from product
        const itemWithVendor = {
          ...item,
          cartLineKey: lineKey,
          vendorId: finalVendorId,
          vendorName: finalVendorName,
        };

        set((state) => {
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                String(i.id) === String(item.id)
                && String(i.cartLineKey || getCartLineKey(i.id, i.variant)) === lineKey
                  ? {
                    ...i,
                    ...itemWithVendor,
                    quantity: newQuantity,
                  }
                  : i
              ),
              ownerUserId: currentUserId,
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...itemWithVendor,
                quantity: quantityToAdd,
                unit: item.unit || existingItem?.unit || null,
              },
            ],
            ownerUserId: currentUserId,
          };
        });

        // Trigger cart animation
        const { triggerCartAnimation } = useUIStore.getState();
        triggerCartAnimation();
        return true;
      },
      removeItem: (id, variant = null) =>
        set((state) => ({
          items: state.items.filter((item) => {
            if (String(item.id) !== String(id)) return true;
            if (!variant) return false; // backwards-compatible: remove all variants for this product
            const candidate = String(item.cartLineKey || getCartLineKey(item.id, item.variant));
            return candidate !== getCartLineKey(id, variant);
          }),
          ownerUserId: state.ownerUserId,
        })),
      updateQuantity: (id, quantity, variant = null) => {
        quantity = Number(quantity);
        if (quantity <= 0) {
          get().removeItem(id, variant);
          return;
        }

        const targetItem = get().items.find((item) => {
          if (String(item.id) !== String(id)) return false;
          if (!variant) return true;
          const candidate = String(item.cartLineKey || getCartLineKey(item.id, item.variant));
          return candidate === getCartLineKey(id, variant);
        });

        set((state) => ({
          items: state.items.map((item) =>
            (() => {
              if (String(item.id) !== String(id)) return item;
              if (!variant) return { ...item, quantity };
              const candidate = String(item.cartLineKey || getCartLineKey(item.id, item.variant));
              return candidate === getCartLineKey(id, variant)
                ? { ...item, quantity }
                : item;
            })()
          ),
          ownerUserId: state.ownerUserId,
        }));
      },
      clearCart: () => set((state) => ({ items: [], ownerUserId: state.ownerUserId })),
      getTotal: () => {
        const authState = useAuthStore.getState();
        if (!authState?.isAuthenticated) {
          if (get().items.length > 0 || get().ownerUserId) {
            set({ items: [], ownerUserId: null });
          }
          return 0;
        }
        const currentUserId = getCurrentAuthUserId();
        const ownerUserId = String(get().ownerUserId || "").trim();
        if (ownerUserId && currentUserId && ownerUserId !== currentUserId) {
          set({ items: [], ownerUserId: currentUserId });
          return 0;
        }
        const state = useCartStore.getState();
        return state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
      getItemCount: () => {
        const authState = useAuthStore.getState();
        if (!authState?.isAuthenticated) {
          if (get().items.length > 0 || get().ownerUserId) {
            set({ items: [], ownerUserId: null });
          }
          return 0;
        }
        const currentUserId = getCurrentAuthUserId();
        const ownerUserId = String(get().ownerUserId || "").trim();
        if (ownerUserId && currentUserId && ownerUserId !== currentUserId) {
          set({ items: [], ownerUserId: currentUserId });
          return 0;
        }
        const state = useCartStore.getState();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },
      // Group items by vendor
      getItemsByVendor: () => {
        const authState = useAuthStore.getState();
        if (!authState?.isAuthenticated) {
          if (get().items.length > 0 || get().ownerUserId) {
            set({ items: [], ownerUserId: null });
          }
          return [];
        }
        const currentUserId = getCurrentAuthUserId();
        const ownerUserId = String(get().ownerUserId || "").trim();
        if (ownerUserId && currentUserId && ownerUserId !== currentUserId) {
          set({ items: [], ownerUserId: currentUserId });
          return [];
        }
        const state = useCartStore.getState();
        const vendorGroups = {};

        state.items.forEach((item) => {
          let vendorId = 1;
          let vendorName = "Unknown Vendor";
          if (item.vendorId) {
            if (typeof item.vendorId === "object") {
              vendorId = item.vendorId.id || item.vendorId._id || 1;
              vendorName = item.vendorId.storeName || item.vendorId.name || item.vendorName || "Unknown Vendor";
            } else {
              vendorId = item.vendorId;
              vendorName = item.vendorName || "Unknown Vendor";
            }
          }
          if (String(vendorId) === "[object Object]") {
            vendorId = 1;
          }
          const vendorIdStr = String(vendorId);

          if (!vendorGroups[vendorIdStr]) {
            vendorGroups[vendorIdStr] = {
              vendorId: vendorIdStr,
              vendorName,
              items: [],
              subtotal: 0,
            };
          }

          const itemSubtotal = item.price * item.quantity;
          vendorGroups[vendorId].items.push(item);
          vendorGroups[vendorId].subtotal += itemSubtotal;
        });

        return Object.values(vendorGroups);
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        ownerUserId: state.ownerUserId,
      }),
    }
  )
);

// UI Store (for modals, loading states, etc.)
export const useUIStore = create((set) => ({
  isMenuOpen: false,
  isCartOpen: false,
  isLoading: false,
  cartAnimationTrigger: 0,
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setLoading: (loading) => set({ isLoading: loading }),
  triggerCartAnimation: () =>
    set((state) => ({ cartAnimationTrigger: state.cartAnimationTrigger + 1 })),
}));

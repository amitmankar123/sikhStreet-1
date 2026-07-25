import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../../../shared/utils/api";
import {
  registerVendor,
  updateVendorProfile,
  forgotVendorPassword,
  verifyVendorResetOTP,
  resetVendorPassword,
  verifyVendorOTP,
  resendVendorOTP,
  completeVendorOnboarding,
  getVendorProfile,
} from "../services/vendorService";

export const useVendorAuthStore = create(
  persist(
    (set, get) => ({
      vendor: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Vendor login action
      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        const normalizedEmail = String(email || '').trim().toLowerCase();
        try {
          const response = await api.post('/vendor/auth/login', { email: normalizedEmail, password });
          const { vendor, accessToken, refreshToken } = response.data;

          set({
            vendor,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem("vendor-token", accessToken);
          localStorage.setItem("vendor-refresh-token", refreshToken);

          return { success: true, vendor };
        } catch (error) {
          set({ isLoading: false });

          // If the backend responded with a real error (401/403/4xx/5xx),
          // do NOT bypass — propagate the error so the UI can show the correct message.
          if (error?.response) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message || 'Login failed';
            // Return structured failure so Login page can display proper messages
            return { success: false, status, message };
          }

          // Backend is truly unreachable (network error) — use offline mock fallback
          console.warn('Vendor login: backend offline, using mock fallback');
          const mockVendor = {
            id: "v1",
            _id: "v1",
            name: email.split('@')[0] || "Vendor",
            email: normalizedEmail,
            storeName: "Fashion Hub Store",
            isVerified: true,
            isOnboarded: true,
            status: "approved",
            rating: 4.8,
            reviewCount: 150
          };

          set({
            vendor: mockVendor,
            token: "mock-vendor-token",
            refreshToken: "mock-vendor-refresh-token",
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem("vendor-token", "mock-vendor-token");
          localStorage.setItem("vendor-refresh-token", "mock-vendor-refresh-token");

          return { success: true, vendor: mockVendor };
        }
      },

      // Vendor registration action
      register: async (vendorData) => {
        set({ isLoading: true });
        try {
          const response = await registerVendor(vendorData);
          const data = response?.data ?? response;

          set({ isLoading: false });

          return {
            success: true,
            message:
              data?.message ||
              "Registration successful! Please check your email for the OTP.",
          };
        } catch (error) {
          set({ isLoading: false });

          // If backend responded with a real error (e.g. 409 email already exists),
          // propagate it — do NOT bypass with a mock
          if (error?.response) {
            const message = error.response?.data?.message || error.message || 'Registration failed';
            return { success: false, message };
          }

          // Backend truly unreachable — use offline mock fallback
          console.warn('Vendor register: backend offline, using mock fallback');
          set({ isLoading: false });
          return {
            success: true,
            message: "Registration submitted (offline mode). Please verify email once the server is available."
          };
        }
      },

      verifyOtp: async (email, otp) => {
        set({ isLoading: true });
        try {
          const response = await verifyVendorOTP(email, otp);
          const data = response?.data ?? response;
          set({ isLoading: false });
          return { success: true, message: data?.message };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      resendOtp: async (email) => {
        set({ isLoading: true });
        try {
          const response = await resendVendorOTP(email);
          const data = response?.data ?? response;
          set({ isLoading: false });
          return { success: true, message: data?.message };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          const response = await forgotVendorPassword(email);
          const data = response?.data ?? response;
          set({ isLoading: false });
          return { success: true, message: data?.message };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      verifyResetOtp: async (email, otp) => {
        set({ isLoading: true });
        try {
          const response = await verifyVendorResetOTP(email, otp);
          const data = response?.data ?? response;
          set({ isLoading: false });
          return { success: true, message: data?.message };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      resetPassword: async (email, password, confirmPassword) => {
        set({ isLoading: true });
        try {
          const response = await resetVendorPassword(email, password, confirmPassword);
          const data = response?.data ?? response;
          set({ isLoading: false });
          return { success: true, message: data?.message };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Vendor logout action
      logout: () => {
        const refreshToken = localStorage.getItem("vendor-refresh-token");
        if (refreshToken) {
          api.post("/vendor/auth/logout", { refreshToken }).catch(() => {});
        }

        // Reset the product store to prevent data leaking between vendor accounts
        import("./vendorProductStore").then(({ useVendorProductStore }) => {
            useVendorProductStore.getState().reset();
        });

        set({
          vendor: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("vendor-token");
        localStorage.removeItem("vendor-refresh-token");
      },

      // Update vendor profile — calls real PUT /vendor/auth/profile
      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const response = await updateVendorProfile(profileData);
          const data = response?.data ?? response;
          // Merge returned vendor data back into state so UI stays in sync
          const updatedVendor =
            data && (data._id || data.id)
              ? data
              : (data?.vendor ?? { ...get().vendor, ...profileData });

          set({
            vendor: updatedVendor,
            isLoading: false,
          });

          return { success: true, vendor: updatedVendor };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Complete vendor onboarding
      completeOnboarding: async () => {
        set({ isLoading: true });
        try {
          const response = await completeVendorOnboarding();
          const data = response?.data ?? response;
          const updatedVendor =
            data && (data._id || data.id)
              ? data
              : (data?.vendor ?? { ...get().vendor, isOnboarded: true });

          set({
            vendor: updatedVendor,
            isLoading: false,
          });

          return { success: true, vendor: updatedVendor };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Fetch fresh profile from backend
      fetchProfile: async () => {
        set({ isLoading: true });
        try {
          const response = await getVendorProfile();
          const data = response?.data ?? response;
          const updatedVendor = data && (data._id || data.id) ? data : get().vendor;
          set({
            vendor: updatedVendor,
            isLoading: false,
          });
          return { success: true, vendor: updatedVendor };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Initialize vendor auth state from localStorage
      initialize: () => {
        const token = localStorage.getItem("vendor-token");
        if (token) {
          const storedState = JSON.parse(
            localStorage.getItem("vendor-auth-storage") || "{}"
          );
          const refreshToken = localStorage.getItem("vendor-refresh-token");
          const persistedVendor = storedState.state?.vendor || null;
          if (persistedVendor) {
            set({
              vendor: persistedVendor,
              token,
              refreshToken: refreshToken || null,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        }
      },
    }),
    {
      name: "vendor-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

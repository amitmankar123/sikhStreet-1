
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      pendingEmail: null,

      // Login action
      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        const normalizedEmail = String(email || '').trim().toLowerCase();
        
        // UI-only mode: Bypassing backend completely and logging in instantly with any credentials!
        const mockUser = {
          id: "mock-customer-1",
          _id: "mock-customer-1",
          name: email.split('@')[0] || "Customer",
          email: normalizedEmail,
          phone: "9876543210",
          role: "customer",
          isVerified: true
        };

        set({
          user: mockUser,
          token: "mock-access-token",
          refreshToken: "mock-refresh-token",
          isAuthenticated: true,
          pendingEmail: null,
          isLoading: false,
        });

        localStorage.setItem('token', "mock-access-token");
        localStorage.setItem('refresh-token', "mock-refresh-token");

        return { success: true, user: mockUser };
      },

      // Register action
      register: async (name, email, password, phone) => {
        set({ isLoading: true });
        const normalizedEmail = String(email || '').trim().toLowerCase();
        
        // UI-only mode: Bypassing backend completely and registering/logging in instantly
        const mockUser = {
          id: "mock-customer-1",
          _id: "mock-customer-1",
          name: name || email.split('@')[0] || "Customer",
          email: normalizedEmail,
          phone: phone || "9876543210",
          role: "customer",
          isVerified: true
        };

        set({
          user: mockUser,
          token: "mock-access-token",
          refreshToken: "mock-refresh-token",
          isAuthenticated: true,
          pendingEmail: null,
          isLoading: false,
        });

        localStorage.setItem('token', "mock-access-token");
        localStorage.setItem('refresh-token', "mock-refresh-token");

        return { success: true, email: normalizedEmail };
      },

      // Verify OTP and complete login
      verifyOTP: async (email, otp) => {
        set({ isLoading: true });
        const normalizedEmail = String(email || '').trim().toLowerCase();
        try {
          const response = await api.post('/user/auth/verify-otp', { email: normalizedEmail, otp });
          const { user, accessToken, refreshToken } = response.data;

          set({
            user,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            pendingEmail: null,
            isLoading: false,
          });

          localStorage.setItem('token', accessToken);
          localStorage.setItem('refresh-token', refreshToken);
          return { success: true, user };
        } catch (error) {
          const mockUser = {
            id: "mock-customer-1",
            _id: "mock-customer-1",
            name: email.split('@')[0] || "Customer",
            email: normalizedEmail,
            phone: "9876543210",
            role: "customer",
            isVerified: true
          };

          set({
            user: mockUser,
            token: "mock-access-token",
            refreshToken: "mock-refresh-token",
            isAuthenticated: true,
            pendingEmail: null,
            isLoading: false,
          });

          localStorage.setItem('token', "mock-access-token");
          localStorage.setItem('refresh-token', "mock-refresh-token");
          return { success: true, user: mockUser };
        }
      },

      // Resend OTP
      resendOTP: async (email) => {
        set({ isLoading: true });
        try {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          await api.post('/user/auth/resend-otp', { email: normalizedEmail });
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          await api.post('/user/auth/forgot-password', { email: normalizedEmail });
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      verifyResetOtp: async (email, otp) => {
        set({ isLoading: true });
        try {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          await api.post('/user/auth/verify-reset-otp', { email: normalizedEmail, otp });
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      resetPassword: async (email, password, confirmPassword) => {
        set({ isLoading: true });
        try {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          await api.post('/user/auth/reset-password', { email: normalizedEmail, password, confirmPassword });
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        const refreshToken = localStorage.getItem('refresh-token');
        if (refreshToken) {
          api.post('/user/auth/logout', { refreshToken }).catch(() => { });
        }

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingEmail: null,
        });
        localStorage.removeItem('token');
        localStorage.removeItem('refresh-token');
        localStorage.removeItem('cart-storage');
        localStorage.removeItem('wishlist-storage');
        localStorage.removeItem('address-storage');
      },

      // Update user profile
      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const response = await api.put('/user/auth/profile', {
            name: profileData?.name,
            phone: profileData?.phone,
          });
          const payload = response?.data ?? response;
          const currentUser = get().user || {};
          const updatedUser = {
            ...currentUser,
            ...payload,
            email: currentUser.email || payload.email,
          };

          set({
            user: updatedUser,
            isLoading: false,
          });

          return { success: true, user: updatedUser };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true });
        try {
          await api.post('/user/auth/change-password', {
            currentPassword,
            newPassword,
          });
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Upload profile avatar
      uploadProfileAvatar: async (file) => {
        if (!file) {
          throw new Error('Avatar file is required.');
        }

        set({ isLoading: true });
        try {
          const formData = new FormData();
          formData.append('avatar', file);

          const response = await api.post('/user/auth/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const payload = response?.data ?? response;
          const currentUser = get().user || {};
          const nextUser = {
            ...currentUser,
            ...(payload?.user || {}),
            avatar: payload?.avatar || payload?.user?.avatar || currentUser.avatar,
            email: currentUser.email || payload?.user?.email,
          };

          set({
            user: nextUser,
            isLoading: false,
          });

          return { success: true, user: nextUser };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Initialize auth state from localStorage
      initialize: () => {
        const token = localStorage.getItem('token');
        if (token) {
          const decodeJwtPayload = (t) => {
            try {
              const parts = String(t || '').split('.');
              if (parts.length < 2) return null;
              const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
              const json = window.atob(base64);
              return JSON.parse(json);
            } catch {
              return null;
            }
          };
          const payload = decodeJwtPayload(token);
          const expiryMs = typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
          const isExpired = expiryMs ? Date.now() >= expiryMs : false;

          if (isExpired) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh-token');
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            return;
          }

          const storedState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          const refreshToken = localStorage.getItem('refresh-token');
          if (storedState.state?.user) {
            set({
              user: storedState.state.user,
              token,
              refreshToken: refreshToken || null,
              isAuthenticated: true,
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.pendingEmail = null;

          const token = localStorage.getItem('token');
          if (token) {
            const decodeJwtPayload = (t) => {
              try {
                const parts = String(t || '').split('.');
                if (parts.length < 2) return null;
                const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const json = window.atob(base64);
                return JSON.parse(json);
              } catch {
                return null;
              }
            };
            const payload = decodeJwtPayload(token);
            const expiryMs = typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
            const isExpired = expiryMs ? Date.now() >= expiryMs : false;

            if (isExpired) {
              localStorage.removeItem('token');
              localStorage.removeItem('refresh-token');
              state.user = null;
              state.token = null;
              state.refreshToken = null;
              state.isAuthenticated = false;
            }
          } else {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);


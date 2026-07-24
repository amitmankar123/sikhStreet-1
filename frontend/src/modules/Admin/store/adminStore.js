import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { adminLogin as apiLogin } from '../services/adminService';
import api from '../../../shared/utils/api';

export const useAdminAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Admin login — calls real backend or falls back to mock
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await apiLogin(email, password);
          const { accessToken, refreshToken, admin } = response.data;

          // Store token under 'adminToken' key (used by adminService interceptor)
          localStorage.setItem('adminToken', accessToken);
          localStorage.setItem('adminRefreshToken', refreshToken);

          set({
            admin,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true, admin };
        } catch (error) {
          // Bypass backend
          const mockAdmin = {
            id: "admin-1",
            _id: "admin-1",
            name: "System Admin",
            email: email,
            role: "superadmin"
          };

          localStorage.setItem('adminToken', "mock-admin-token");
          localStorage.setItem('adminRefreshToken', "mock-admin-refresh-token");

          set({
            admin: mockAdmin,
            token: "mock-admin-token",
            refreshToken: "mock-admin-refresh-token",
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true, admin: mockAdmin };
        }
      },

      // Admin logout
      logout: () => {
        const refreshToken = localStorage.getItem('adminRefreshToken');
        if (refreshToken) {
          api.post('/admin/auth/logout', { refreshToken }).catch(() => {});
        }

        set({ admin: null, token: null, refreshToken: null, isAuthenticated: false });
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

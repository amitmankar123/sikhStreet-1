import { create } from "zustand";
import toast from "react-hot-toast";
import api from "../../../shared/utils/api";
import { useAuthStore } from "../../../shared/store/authStore";

const getAuthUserId = (authState) =>
  String(authState?.user?._id || authState?.user?.id || "");

const normalizePayload = (response) => {
  const root = response?.data ?? response ?? {};
  if (Array.isArray(root)) {
    return {
      notifications: root,
      unreadCount: root.filter((n) => !n?.isRead).length,
      pages: 1,
    };
  }

  return {
    notifications: Array.isArray(root?.notifications) ? root.notifications : [],
    unreadCount: Number(root?.unreadCount || 0),
    pages: Number(root?.pages || 1),
  };
};

export const useUserNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  page: 1,
  hasMore: true,
  hasFetched: false,
  hydratedForUserId: "",

  fetchNotifications: async (page = 1) => {
    const authState = useAuthStore.getState();
    const authUserId = getAuthUserId(authState);
    if (!authState?.isAuthenticated) {
      set({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        page: 1,
        hasMore: false,
        hasFetched: false,
        hydratedForUserId: "",
      });
      return;
    }

    set({ isLoading: true });

    const mockNotifications = [
      {
        _id: "mock-notif-1",
        title: "Order Shipped 📦",
        message: "Good news! Your order #ORD-987654321 containing Classic Stainless Steel Kadda has been shipped. Track your shipment now.",
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        _id: "mock-notif-2",
        title: "New Message from Seller 💬",
        message: "Fashion Hub Store sent you a message: 'Your order has been shipped and is on the way!'",
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: "mock-notif-3",
        title: "Welcome to SikhStreet! 🎉",
        message: "Thank you for signing up. Enjoy our curated collections of traditional Kada, turbans, and authentic Sikh heritage products.",
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    try {
      const response = await api.get("/user/notifications", {
        params: { page, limit: 10 },
      });
      const payload = normalizePayload(response);
      const list = Array.isArray(payload.notifications) && payload.notifications.length > 0
        ? payload.notifications
        : mockNotifications;

      set((state) => ({
        notifications:
          Number(page) === 1
            ? list
            : [...state.notifications, ...list],
        unreadCount: Number(Number(page) === 1 ? list.filter(n => !n.isRead).length : payload.unreadCount || 0),
        page: Number(page),
        hasMore: Number(page) < Number(payload.pages || 1),
        hasFetched: true,
        hydratedForUserId: authUserId,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch user notifications, falling back to mock:", error);
      const existing = get().notifications;
      const list = existing.length > 0 ? existing : mockNotifications;
      set({
        notifications: list,
        unreadCount: list.filter(n => !n.isRead).length,
        page: 1,
        hasMore: false,
        hasFetched: true,
        hydratedForUserId: authUserId,
        isLoading: false,
      });
    }
  },

  ensureHydrated: async () => {
    const authState = useAuthStore.getState();
    if (!authState?.isAuthenticated) return;
    const authUserId = getAuthUserId(authState);
    const state = get();
    const isDifferentUser = state.hydratedForUserId !== authUserId;
    if ((!state.hasFetched || isDifferentUser) && !state.isLoading) {
      await get().fetchNotifications(1);
    }
  },

  markAsRead: async (id) => {
    const isMock = String(id).startsWith("mock-");
    if (!isMock) {
      try {
        await api.put(`/user/notifications/${id}/read`);
      } catch (error) {
        console.error("Failed to mark notification as read on backend:", error);
      }
    }
    set((state) => {
      const changed = state.notifications.some(
        (n) => String(n?._id) === String(id) && !n?.isRead
      );
      return {
        notifications: state.notifications.map((n) =>
          String(n?._id) === String(id) ? { ...n, isRead: true } : n
        ),
        unreadCount: changed
          ? Math.max(0, Number(state.unreadCount || 0) - 1)
          : state.unreadCount,
      };
    });
  },

  markAllAsRead: async () => {
    try {
      const hasNonMock = get().notifications.some(n => !String(n._id).startsWith("mock-"));
      if (hasNonMock) {
        await api.put("/user/notifications/read-all");
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read on backend:", error);
    }
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    toast.success("All notifications marked as read");
  },

  removeNotification: async (id) => {
    const isMock = String(id).startsWith("mock-");
    if (!isMock) {
      try {
        await api.delete(`/user/notifications/${id}`);
      } catch (error) {
        console.error("Failed to delete notification on backend:", error);
      }
    }
    set((state) => {
      const existing = state.notifications.find(
        (n) => String(n?._id) === String(id)
      );
      return {
        notifications: state.notifications.filter(
          (n) => String(n?._id) !== String(id)
        ),
        unreadCount:
          existing && !existing?.isRead
            ? Math.max(0, Number(state.unreadCount || 0) - 1)
            : state.unreadCount,
      };
    });
    toast.success("Notification deleted");
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      page: 1,
      hasMore: true,
      hasFetched: false,
      hydratedForUserId: "",
    });
  },
}));

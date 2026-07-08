import { create } from 'zustand';
import api from '../utils/api';

export const useChatStore = create((set, get) => ({
  threads: [],
  messages: [],
  activeThread: null,
  isLoading: false,
  lastError: null,

  fetchThreads: async () => {
    set({ isLoading: true, lastError: null });
    try {
      const response = await api.get('/user/chat/threads');
      const payload = response?.data ?? response;
      set({
        threads: Array.isArray(payload) ? payload : [],
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        lastError: error?.message || 'Failed to fetch chat threads',
      });
    }
  },

  fetchMessages: async (threadId) => {
    set({ isLoading: true, lastError: null });
    try {
      const response = await api.get(`/user/chat/threads/${threadId}/messages`);
      const payload = response?.data ?? response;
      set({
        messages: Array.isArray(payload) ? payload : [],
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        lastError: error?.message || 'Failed to fetch messages',
      });
    }
  },

  sendMessage: async (threadId, messageText) => {
    try {
      const response = await api.post(`/user/chat/threads/${threadId}/messages`, {
        message: messageText,
      });
      const createdMessage = response?.data ?? response;

      // Update local messages array
      set((state) => ({
        messages: [...state.messages, createdMessage],
      }));

      // Update the thread in the list with the last message
      const nowIso = new Date().toISOString();
      set((state) => ({
        threads: state.threads.map((t) =>
          String(t.id || t._id) === String(threadId)
            ? {
                ...t,
                lastMessage: messageText,
                lastActivity: createdMessage?.time || nowIso,
                customerUnreadCount: 0,
              }
            : t
        ),
      }));

      return createdMessage;
    } catch (error) {
      set({ lastError: error?.message || 'Failed to send message' });
      throw error;
    }
  },

  getOrCreateThread: async (orderId, vendorId) => {
    set({ isLoading: true, lastError: null });
    try {
      const response = await api.get(`/user/chat/threads/order/${orderId}/vendor/${vendorId}`);
      const thread = response?.data ?? response;
      set({
        activeThread: thread,
        isLoading: false,
      });
      return thread;
    } catch (error) {
      set({
        isLoading: false,
        lastError: error?.message || 'Failed to open or create chat thread',
      });
      throw error;
    }
  },

  markAsRead: async (threadId) => {
    try {
      await api.patch(`/user/chat/threads/${threadId}/read`);
      set((state) => ({
        threads: state.threads.map((t) =>
          String(t.id || t._id) === String(threadId) ? { ...t, customerUnreadCount: 0 } : t
        ),
      }));
    } catch (error) {
      // Keep silent on read marker failures
    }
  },

  setActiveThread: (thread) => {
    set({ activeThread: thread });
  },

  resetChat: () => {
    set({
      threads: [],
      messages: [],
      activeThread: null,
      isLoading: false,
      lastError: null,
    });
  },
}));

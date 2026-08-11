import { create } from 'zustand';
import api from '../utils/api';
import socket from '../utils/socket';

export const useChatStore = create((set, get) => ({
  // ── Order chat state ──────────────────────────────────────────────────
  threads: [],
  messages: [],
  activeThread: null,
  isLoading: false,
  lastError: null,

  // ── General (direct vendor) chat state ───────────────────────────────
  generalActiveThread: null,
  generalMessages: [],
  isGeneralLoading: false,

  fetchThreads: async () => {
    set({ isLoading: true, lastError: null });
    const mockThreads = [
      {
        id: "mock-thread-1",
        _id: "mock-thread-1",
        orderDisplayId: "ORD-987654321",
        customerName: "Fashion Hub Store",
        lastMessage: "Your order has been shipped and is on the way!",
        lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        customerUnreadCount: 1,
        status: "active"
      },
      {
        id: "mock-thread-2",
        _id: "mock-thread-2",
        orderDisplayId: "ORD-123456789",
        customerName: "Appzeto Store",
        lastMessage: "Thank you for shopping with us! Let us know if you need anything.",
        lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        customerUnreadCount: 0,
        status: "active"
      }
    ];
    try {
      const response = await api.get('/user/chat/threads');
      const payload = response?.data ?? response;
      const list = Array.isArray(payload) && payload.length > 0 ? payload : mockThreads;
      set({
        threads: list,
        isLoading: false,
      });
    } catch (error) {
      set({
        threads: get().threads.length > 0 ? get().threads : mockThreads,
        isLoading: false,
      });
    }
  },

  fetchMessages: async (threadId) => {
    set({ isLoading: true, lastError: null });
    const mockMessages = {
      "mock-thread-1": [
        {
          id: "msg-1",
          sender: "customer",
          message: "Hello, when will my Kada order be shipped?",
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "msg-2",
          sender: "vendor",
          message: "Hi! It is scheduled to be shipped today via standard courier.",
          time: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "msg-3",
          sender: "vendor",
          message: "Your order has been shipped and is on the way!",
          time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ],
      "mock-thread-2": [
        {
          id: "msg-4",
          sender: "customer",
          message: "Excellent quality turbans! Thank you.",
          time: new Date(Date.now() - 3.1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "msg-5",
          sender: "vendor",
          message: "Thank you for shopping with us! Let us know if you need anything.",
          time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    // Skip API call for mock/local thread IDs — they only exist on the frontend
    const isMockId = String(threadId || '').startsWith('mock-') || String(threadId || '').startsWith('general-');
    if (isMockId) {
      set({ messages: mockMessages[threadId] || [], isLoading: false });
      return;
    }

    try {
      const response = await api.get(`/user/chat/threads/${threadId}/messages`);
      const payload = response?.data ?? response;
      const list = Array.isArray(payload) && payload.length > 0 ? payload : (mockMessages[threadId] || []);
      set({
        messages: list,
        isLoading: false,
      });
    } catch (error) {
      set({
        messages: mockMessages[threadId] || [],
        isLoading: false,
      });
    }
  },

  sendMessage: async (threadId, messageText) => {
    // Optimistic update
    const optimisticMsg = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      message: messageText,
      time: new Date().toISOString()
    };
    
    set((state) => ({
      messages: [...state.messages, optimisticMsg]
    }));

    const isMockId = String(threadId).startsWith('mock-') || String(threadId).startsWith('general-');
    if (isMockId) {
      return optimisticMsg;
    }

    if (socket.connected) {
      // If socket is connected, the socket emit is sufficient
      return optimisticMsg;
    }

    try {
      const response = await api.post(`/user/chat/threads/${threadId}/messages`, {
        message: messageText,
      });
      const createdMessage = response?.data ?? response;

      // Replace optimistic message
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === optimisticMsg.id ? { ...createdMessage } : m
        ),
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
      return optimisticMsg;
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
      const thread = {
        id: `mock-thread-custom-${orderId}`,
        _id: `mock-thread-custom-${orderId}`,
        orderDisplayId: orderId,
        customerName: "Seller Support",
        lastMessage: "Hello! How can we assist you with order #" + orderId + "?",
        lastActivity: new Date().toISOString(),
        customerUnreadCount: 0,
        status: "active"
      };
      set((state) => {
        const hasThread = state.threads.some((t) => String(t.id || t._id) === String(thread.id));
        return {
          threads: hasThread ? state.threads : [thread, ...state.threads],
          activeThread: thread,
          isLoading: false,
        };
      });
      return thread;
    }
  },

  markAsRead: async (threadId) => {
    // Skip API for mock/local thread IDs
    const isMockId = String(threadId || '').startsWith('mock-') || String(threadId || '').startsWith('general-');
    if (isMockId) {
      set((state) => ({
        threads: state.threads.map((t) =>
          String(t.id || t._id) === String(threadId) ? { ...t, customerUnreadCount: 0 } : t
        ),
      }));
      return;
    }
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

  // ── General (direct vendor) chat actions ───────────────────────────

  getOrCreateGeneralThread: async (vendorId, vendorName) => {
    set({ isGeneralLoading: true });
    const mockThread = {
      id: `general-${vendorId}`,
      _id: `general-${vendorId}`,
      vendorId,
      threadType: 'general',
      customerName: 'You',
      lastMessage: '',
      lastActivity: new Date().toISOString(),
      customerUnreadCount: 0,
      status: 'active',
      storeName: vendorName || 'Seller',
    };
    try {
      const response = await api.get(`/user/chat/threads/vendor/${vendorId}/general`);
      const thread = response?.data ?? response;
      const normalized = { ...mockThread, ...thread };
      set({ generalActiveThread: normalized, isGeneralLoading: false });
      // Also load messages for this thread
      await get().fetchGeneralMessages(normalized._id || normalized.id);
      return normalized;
    } catch {
      set({ generalActiveThread: mockThread, generalMessages: [], isGeneralLoading: false });
      return mockThread;
    }
  },

  fetchGeneralMessages: async (threadId) => {
    try {
      const response = await api.get(`/user/chat/threads/${threadId}/messages`);
      const payload = response?.data ?? response;
      const list = Array.isArray(payload) ? payload : [];
      set({ generalMessages: list });
    } catch {
      set({ generalMessages: [] });
    }
  },

  sendGeneralMessage: async (threadId, messageText) => {
    // Optimistic update
    const optimistic = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      message: messageText,
      time: new Date().toISOString(),
    };
    set((state) => ({ generalMessages: [...state.generalMessages, optimistic] }));

    const isMockId = String(threadId).startsWith('mock-') || String(threadId).startsWith('general-');
    if (isMockId) {
      return optimistic;
    }

    if (socket.connected) {
      // If socket is connected, the socket emit is sufficient
      return optimistic;
    }

    try {
      const response = await api.post(`/user/chat/threads/${threadId}/messages`, {
        message: messageText,
      });
      const created = response?.data ?? response;
      // Replace optimistic with real message
      set((state) => ({
        generalMessages: state.generalMessages.map((m) =>
          m.id === optimistic.id ? { ...created } : m
        ),
        generalActiveThread: state.generalActiveThread
          ? { ...state.generalActiveThread, lastMessage: messageText }
          : state.generalActiveThread,
      }));
      return created;
    } catch {
      return optimistic;
    }
  },

  appendGeneralMessage: (msg) => {
    set((state) => {
      // Check if there is an optimistic message with the same message text from the same sender
      const isCustomer = msg.sender === "customer" || msg.senderType === "customer";
      let matchedOptimistic = false;
      const updatedMessages = state.generalMessages.map((m) => {
        if (!matchedOptimistic && String(m.id || '').startsWith("msg-") && m.message === msg.message) {
          matchedOptimistic = true;
          return msg; // replace with real message
        }
        return m;
      });

      if (matchedOptimistic) {
        return { generalMessages: updatedMessages };
      }

      const exists = state.generalMessages.some((m) => String(m._id || m.id) === String(msg._id || msg.id));
      return exists ? {} : { generalMessages: [...state.generalMessages, msg] };
    });
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

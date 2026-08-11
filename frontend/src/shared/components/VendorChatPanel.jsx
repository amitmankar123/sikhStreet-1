import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiSend,
  FiMessageSquare,
  FiClock,
  FiLock,
} from "react-icons/fi";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import socket from "../utils/socket";
import LazyImage from "./LazyImage";

/**
 * VendorChatPanel — Etsy-style slide-in general chat panel.
 *
 * Props:
 *   isOpen   — boolean
 *   onClose  — () => void
 *   vendor   — { id, _id, storeName, name, storeLogo, address }
 */
const VendorChatPanel = ({ isOpen, onClose, vendor }) => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    generalActiveThread,
    generalMessages,
    isGeneralLoading,
    getOrCreateGeneralThread,
    sendGeneralMessage,
    appendGeneralMessage,
  } = useChatStore();

  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [vendorTyping, setVendorTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  // Track whether THIS panel instance owns the socket connection
  const socketOwnedRef = useRef(false);

  const vendorId = vendor?.id || vendor?._id;
  const vendorName = vendor?.storeName || vendor?.name || "Seller";
  const vendorStoreLogo = vendor?.storeLogo || vendor?.logo || vendor?.avatar;
  const threadId = generalActiveThread?._id || generalActiveThread?.id;
  const isMockThread = threadId
    ? String(threadId).startsWith("mock-") || String(threadId).startsWith("general-")
    : false;

  // ── Initialize thread when panel opens ──────────────────────────────
  useEffect(() => {
    if (!isOpen || !vendorId || !isAuthenticated) return;

    setIsInitializing(true);
    getOrCreateGeneralThread(vendorId, vendorName).finally(() => {
      setIsInitializing(false);
    });

    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [isOpen, vendorId, isAuthenticated]);

  // ── Lock Background Scroll when open ─────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Socket: connect, join room, attach listeners ─────────────────────
  useEffect(() => {
    if (!isOpen || !threadId || isMockThread) return;

    // Only connect if not already connected
    if (!socket.connected) {
      socket.connect();
      socketOwnedRef.current = true;
    } else {
      socketOwnedRef.current = false;
    }

    socket.emit("join_thread", threadId);
    socket.emit("mark_read", { threadId, readerType: "user" });

    const handleNewMessage = (msg) => {
      if (!msg || String(msg.threadId) !== String(threadId)) return;
      appendGeneralMessage({
        id: msg._id,
        _id: msg._id,
        sender: msg.senderType,
        message: msg.message,
        time: msg.createdAt,
        threadId: msg.threadId,
      });
    };

    const handleTyping = ({ role }) => {
      if (role !== "user") {
        setVendorTyping(true);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setVendorTyping(false), 2500);
      }
    };

    const handleStopTyping = () => setVendorTyping(false);

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.emit("leave_thread", threadId);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);

      // Only disconnect if this panel instance opened the socket
      if (socketOwnedRef.current) {
        socket.disconnect();
        socketOwnedRef.current = false;
      }
    };
  }, [isOpen, threadId, isMockThread]);

  // ── Auto-scroll to bottom ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [generalMessages, vendorTyping]);

  // ── Send message ─────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || isSending || !threadId) return;

    setIsSending(true);
    setNewMessage("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    if (!isMockThread) {
      socket.emit("send_message", {
        threadId,
        message: text,
        senderType: "customer",
        senderId: user?.id || user?._id,
      });
    }

    try {
      await sendGeneralMessage(threadId, text);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isSending, threadId, isMockThread, user]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (threadId && !isMockThread) {
      socket.emit("typing", { threadId, role: "user" });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit("stop_typing", { threadId });
      }, 1500);
    }
  };

  // ── Format helpers ───────────────────────────────────────────────────
  const formatTime = (time) => {
    if (!time) return "";
    return new Date(time).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (time) => {
    if (!time) return "Today";
    const d = new Date(time);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Group messages by date
  const groupedMessages = generalMessages.reduce((groups, msg) => {
    const date = formatDate(msg.time || msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const hasMessages = generalMessages.length > 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ──────────────────────────────────────────── */}
          <motion.div
            key="vendor-chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-40"
            aria-hidden="true"
          />

          {/* ── Slide-in Panel ────────────────────────────────────── */}
          <motion.div
            key="vendor-chat-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
            className="fixed inset-y-0 right-0 w-full z-50 flex flex-col bg-white shadow-2xl"
            style={{ maxWidth: "420px", borderLeft: "1px solid #e5e7eb", height: "100dvh" }}
            aria-label="Vendor chat panel"
          >
            {/* ── Header ────────────────────────────────────────────── */}
            <div 
              className="flex-shrink-0 flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white"
              style={{
                paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))"
              }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-100 flex items-center justify-center">
                  {vendorStoreLogo ? (
                    <LazyImage
                      src={vendorStoreLogo}
                      alt={vendorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-500">
                      {vendorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>

              {/* Vendor info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">
                  {vendorName}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <FiClock className="text-[10px] text-gray-400 flex-shrink-0" />
                  <p className="text-[11px] text-gray-500 font-medium">
                    Typically responds within a few hours
                  </p>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200"
                aria-label="Close chat"
              >
                <FiX className="text-base" />
              </button>
            </div>

            {/* ── Messages Area ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f9f9f7]">
              {/* Loading */}
              {(isInitializing || isGeneralLoading) && (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  <p className="text-xs text-gray-400 font-medium">Loading conversation...</p>
                </div>
              )}

              {/* Not authenticated */}
              {!isAuthenticated && !isInitializing && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FiLock className="text-2xl text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Sign in to chat</p>
                  <p className="text-xs text-gray-400 max-w-[220px] leading-relaxed">
                    Please sign in to send a message to this seller.
                  </p>
                  <a
                    href="/login"
                    className="mt-1 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-[#F5A623] transition-colors"
                  >
                    Sign In
                  </a>
                </div>
              )}

              {/* Empty state */}
              {isAuthenticated && !isInitializing && !isGeneralLoading && !hasMessages && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center shadow-sm">
                    <FiMessageSquare className="text-2xl text-stone-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Start a conversation</p>
                  <p className="text-xs text-gray-400 max-w-[220px] leading-relaxed">
                    Ask {vendorName} about products, shipping, or custom orders.
                  </p>
                </div>
              )}

              {/* Date-grouped messages */}
              {!isInitializing &&
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date} className="space-y-0.5 mb-2">
                    {/* Date divider */}
                    <div className="flex items-center gap-2 py-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide px-1">
                        {date}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {msgs.map((msg, idx) => {
                      const isCustomer =
                        msg.sender === "customer" || msg.senderType === "customer";
                      const prevMsg = idx > 0 ? msgs[idx - 1] : null;
                      const isSameAsPrev =
                        prevMsg &&
                        (prevMsg.sender || prevMsg.senderType) ===
                          (msg.sender || msg.senderType);
                      const nextMsg = idx < msgs.length - 1 ? msgs[idx + 1] : null;
                      const isLastOfRun =
                        !nextMsg ||
                        (nextMsg.sender || nextMsg.senderType) !==
                          (msg.sender || msg.senderType);

                      return (
                        <motion.div
                          key={msg.id || msg._id || idx}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`flex ${isCustomer ? "justify-end" : "justify-start"} ${
                            isSameAsPrev ? "mt-0.5" : "mt-3"
                          }`}
                        >
                          {/* Vendor avatar */}
                          {!isCustomer && (
                            <div className="w-6 mr-2 mt-auto flex-shrink-0">
                              {!isSameAsPrev ? (
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                  {vendorStoreLogo ? (
                                    <img
                                      src={vendorStoreLogo}
                                      alt={vendorName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-500">
                                      {vendorName.charAt(0)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-6 h-6" />
                              )}
                            </div>
                          )}

                          <div className="max-w-[72%]">
                            <div
                              className={`px-3.5 py-2.5 text-sm leading-relaxed break-words shadow-sm ${
                                isCustomer
                                  ? "bg-gray-900 text-white rounded-2xl rounded-br-sm"
                                  : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm"
                              }`}
                            >
                              {msg.message}
                            </div>
                            {isLastOfRun && (
                              <p
                                className={`text-[10px] font-medium mt-0.5 ${
                                  isCustomer ? "text-right text-gray-400" : "text-left text-gray-400"
                                }`}
                              >
                                {formatTime(msg.time || msg.createdAt)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {vendorTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="flex items-end gap-2 mt-3"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                      {vendorStoreLogo ? (
                        <img src={vendorStoreLogo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-500">
                          {vendorName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Bar ─────────────────────────────────────────── */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3 bg-white">
              {!isAuthenticated ? (
                <div className="text-center py-1">
                  <p className="text-xs text-gray-400 font-medium">
                    <a
                      href="/login"
                      className="text-gray-800 font-bold underline underline-offset-2"
                    >
                      Sign in
                    </a>{" "}
                    to send a message
                  </p>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask ${vendorName} a question...`}
                    disabled={isInitializing || isGeneralLoading}
                    className="flex-1 resize-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all overflow-y-auto leading-relaxed disabled:opacity-50"
                    style={{ minHeight: "42px", maxHeight: "112px" }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 112) + "px";
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending || isInitializing}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 hover:bg-[#F5A623] text-white flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    aria-label="Send message"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FiSend className="text-sm translate-x-px" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default VendorChatPanel;

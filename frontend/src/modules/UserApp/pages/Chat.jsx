import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FiMessageSquare, FiSend, FiUser, FiSearch, FiArrowLeft, FiShoppingBag, FiInfo } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Badge from "../../../shared/components/Badge";
import { useAuthStore } from "../../../shared/store/authStore";
import { useChatStore } from "../../../shared/store/chatStore";
import MobileLayout from "../components/Layout/MobileLayout";
import PageTransition from "../../../shared/components/PageTransition";

const Chat = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const {
    threads,
    messages,
    activeThread,
    isLoading,
    fetchThreads,
    fetchMessages,
    sendMessage,
    markAsRead,
    setActiveThread,
  } = useChatStore();

  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mobileView, setMobileView] = useState("list"); // "list" or "chat"
  
  const messagesEndRef = useRef(null);

  // Poll for thread listing updates
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchThreads();
    const interval = setInterval(() => {
      fetchThreads();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchThreads, isAuthenticated]);

  // Poll active thread messages
  useEffect(() => {
    if (!activeThread?._id && !activeThread?.id) {
      return;
    }
    const threadId = activeThread._id || activeThread.id;
    fetchMessages(threadId);
    markAsRead(threadId);

    const interval = setInterval(() => {
      fetchMessages(threadId);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeThread?._id, activeThread?.id, fetchMessages, markAsRead]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectThread = (thread) => {
    setActiveThread(thread);
    const threadId = thread._id || thread.id;
    markAsRead(threadId);
    setMobileView("chat");
  };

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    const threadId = activeThread?._id || activeThread?.id;
    if (!text || !threadId || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(threadId, text);
      setNewMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToList = () => {
    setMobileView("list");
    setActiveThread(null);
  };

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const displayId = String(thread.orderDisplayId || "").toLowerCase();
      const name = String(thread.customerName || "Vendor").toLowerCase();
      // Since it's user side, the other side is the vendor/store. We can check if we have vendorName.
      // Wait, thread might show vendor name. Let's see: we can match searchQuery.
      const query = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        displayId.includes(query) ||
        name.includes(query)
      );
    });
  }, [threads, searchQuery]);

  const totalUnreadCount = useMemo(() => {
    return threads.reduce((sum, t) => sum + Number(t.customerUnreadCount || 0), 0);
  }, [threads]);

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <MobileLayout showBottomNav={true} showCartBar={false}>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <FiMessageSquare className="text-6xl text-slate-300 mb-4" />
            <h2 className="text-2xl font-black text-slate-800 mb-2">Please Sign In</h2>
            <p className="text-slate-500 mb-6 max-w-sm">Sign in to your account to chat with vendors about your orders.</p>
            <button
              onClick={() => navigate("/login")}
              className="gradient-green text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
            >
              Sign In
            </button>
          </div>
        </MobileLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <MobileLayout showBottomNav={mobileView === "list"} showCartBar={false}>
        <div className="w-full max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[500px] flex flex-col bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm mt-4">
          
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mobileView === "chat" && (
                <button
                  onClick={handleBackToList}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors md:hidden text-slate-600"
                >
                  <FiArrowLeft className="text-xl" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span>Seller Messages</span>
                  {totalUnreadCount > 0 && (
                    <Badge variant="warning" className="text-[10px] px-2 py-0.5 font-black rounded-full">
                      {totalUnreadCount} New
                    </Badge>
                  )}
                </h1>
                <p className="text-xs text-slate-500 font-medium">Interact with sellers regarding your purchases</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Side: Threads List */}
            <div className={`w-full md:w-[350px] lg:w-[400px] border-r border-slate-200 bg-white flex flex-col ${
              mobileView === "chat" ? "hidden md:flex" : "flex"
            }`}>
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search order or shop..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623] text-sm font-medium"
                  />
                </div>
              </div>

              {/* Threads Scroll List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {isLoading && threads.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-slate-500">Loading chats...</div>
                ) : filteredThreads.length > 0 ? (
                  filteredThreads.map((thread) => {
                    const threadId = thread._id || thread.id;
                    const isActive = (activeThread?._id || activeThread?.id) === threadId;
                    const hasUnread = Number(thread.customerUnreadCount || 0) > 0;

                    return (
                      <div
                        key={threadId}
                        onClick={() => handleSelectThread(thread)}
                        className={`p-4 cursor-pointer hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 ${
                          isActive ? "bg-white/60 border-l-4 border-[#F5A623]" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <FiShoppingBag className="text-lg" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className={`text-sm truncate ${hasUnread ? "font-bold text-slate-800" : "font-semibold text-slate-700"}`}>
                                Order #{thread.orderDisplayId || 'Detail'}
                              </h3>
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                {thread.lastActivity
                                  ? new Date(thread.lastActivity).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : ""}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mb-0.5">
                              Shop Chat Thread
                            </p>
                            <p className={`text-xs truncate ${hasUnread ? "font-bold text-slate-800" : "text-slate-500"}`}>
                              {thread.lastMessage || "No messages yet"}
                            </p>
                          </div>
                        </div>

                        {hasUnread && (
                          <Badge variant="warning" className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {thread.customerUnreadCount}
                          </Badge>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                    <FiMessageSquare className="text-4xl text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-600">No chats found</p>
                    <p className="text-xs text-slate-400 max-w-[200px] mt-1">Start a conversation from your Order Details page.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Message Room */}
            <div className={`flex-1 bg-white flex flex-col ${
              mobileView === "list" ? "hidden md:flex" : "flex"
            }`}>
              {activeThread ? (
                <>
                  {/* Thread Detail Bar */}
                  <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-300">
                        <FiUser />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Order Support Chat
                        </h4>
                        <p className="text-xs font-medium text-slate-500">
                          Order ID: {activeThread.orderDisplayId}
                        </p>
                      </div>
                    </div>
                    <Badge variant={activeThread.status === "active" ? "success" : "info"} className="text-[10px] capitalize font-bold">
                      {activeThread.status}
                    </Badge>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[calc(100vh-320px)] bg-slate-50/30">
                    {messages.map((msg) => {
                      const isUser = msg.sender === "customer";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm border ${
                              isUser
                                ? "bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white border-[#F5A623] rounded-br-none"
                                : "bg-white text-slate-800 border-slate-200 rounded-bl-none"
                            }`}
                          >
                            <p className="text-sm font-medium leading-relaxed break-words">{msg.message}</p>
                            <span className={`block text-[10px] text-right mt-1 font-semibold ${
                              isUser ? "text-[#fdeade]" : "text-slate-400"
                            }`}>
                              {new Date(msg.time).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Panel */}
                  <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask the seller a question..."
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623] text-sm font-medium"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                        className="p-3 bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white rounded-full hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                      >
                        <FiSend className="text-sm" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
                    <FiMessageSquare className="text-3xl" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Select a Conversation</h3>
                  <p className="text-sm text-slate-400 max-w-xs">
                    Choose a chat thread from the list, or open one directly from your Order Details page.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default Chat;

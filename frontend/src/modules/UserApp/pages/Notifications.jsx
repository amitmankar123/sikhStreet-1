import { useEffect } from "react";
import { motion } from "framer-motion";
import { FiBell, FiCheck, FiTrash2, FiInbox, FiRefreshCw, FiPackage, FiMessageSquare, FiGift, FiInfo } from "react-icons/fi";
import MobileLayout from "../components/Layout/MobileLayout";
import PageTransition from "../../../shared/components/PageTransition";
import { useUserNotificationStore } from "../store/userNotificationStore";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const getNotificationIcon = (title, isRead) => {
  const t = String(title || "").toLowerCase();
  let IconComponent = FiBell;
  let colorClass = "";

  if (t.includes("order") || t.includes("shipped") || t.includes("package") || t.includes("delivered")) {
    IconComponent = FiPackage;
    colorClass = isRead 
      ? "bg-gray-100 text-gray-400 border border-gray-200/50" 
      : "bg-white text-black border border-black/10";
  } else if (t.includes("message") || t.includes("chat") || t.includes("seller") || t.includes("reply")) {
    IconComponent = FiMessageSquare;
    colorClass = isRead 
      ? "bg-gray-100 text-gray-400 border border-gray-200/50" 
      : "bg-white text-[#F5A623] border border-[#fdeade]/40";
  } else if (t.includes("welcome") || t.includes("signup") || t.includes("gift") || t.includes("celebrate")) {
    IconComponent = FiGift;
    colorClass = isRead 
      ? "bg-gray-100 text-gray-400 border border-gray-200/50" 
      : "bg-[#fdf3dc] text-[#c9922a] border border-[#fdf3dc]/50";
  } else {
    IconComponent = FiInfo;
    colorClass = isRead 
      ? "bg-gray-100 text-gray-400 border border-gray-200/50" 
      : "bg-[#f5f3ff] text-black border border-[#EDE9FE]/50";
  }

  return (
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${colorClass}`}>
      <IconComponent className="text-lg" />
    </div>
  );
};

const UserNotifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    page,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useUserNotificationStore();

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  return (
    <PageTransition>
      <MobileLayout showBottomNav={true} showCartBar={true}>
        <div className="px-4 py-4 sm:py-6 space-y-4 max-w-md mx-auto md:max-w-xl lg:max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 mb-2"
          >
            <div>
              <h1 className="text-2xl font-black text-gray-800">Notifications</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{unreadCount} unread updates</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNotifications(1)}
                className="px-4 py-2 rounded-xl border border-black/10 text-gray-700 text-xs font-bold hover:bg-white active:scale-95 transition-all"
                type="button"
              >
                <span className="inline-flex items-center gap-1.5">
                  <FiRefreshCw className="text-xs" />
                  Refresh
                </span>
              </button>
              <button
                onClick={markAllAsRead}
                disabled={!notifications.length || unreadCount === 0}
                className="px-4 py-2 rounded-xl bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95 transition-all"
                type="button"
              >
                Mark all read
              </button>
            </div>
          </motion.div>

          {isLoading && notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-black/10 text-gray-600 font-semibold text-sm">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-black/10">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-black/30 mx-auto mb-4 border border-black/10">
                <FiBell className="text-3xl" />
              </div>
              <p className="text-gray-800 font-bold text-lg">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-1.5 max-w-xs mx-auto">
                Order status and chat updates will appear here as soon as they arrive.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, idx) => (
                <motion.div
                  key={notification?._id || `${idx}-${notification?.createdAt || ""}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`group rounded-2xl p-5 shadow-sm border transition-all duration-300 bg-white border-black/10 hover:shadow-md ${
                    !notification?.isRead && "bg-black/5 border-black/10 border-l-4 border-l-[#F5A623]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {getNotificationIcon(notification?.title, notification?.isRead)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-base leading-snug ${
                            notification?.isRead ? "text-gray-800" : "text-black"
                          }`}>
                            {notification?.title || "Notification"}
                          </h3>
                          {!notification?.isRead && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black hover:bg-[#F5A623] hover:text-black transition-colors opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-black hover:bg-[#F5A623] hover:text-black transition-colors"></span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1.5 font-medium leading-relaxed break-words">
                          {notification?.message || "-"}
                        </p>
                        <p className="text-[11px] text-gray-400 font-semibold mt-2.5 flex items-center gap-1">
                          {formatDateTime(notification?.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mt-1">
                      {!notification?.isRead && (
                        <button
                          onClick={() => markAsRead(notification?._id)}
                          className="p-2.5 rounded-xl border border-black/10 text-gray-600 hover:bg-white hover:text-[#F5A623] hover:border-[#ebd3c5] active:scale-95 transition-all"
                          title="Mark as read"
                          type="button"
                        >
                          <FiCheck className="text-sm" />
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notification?._id)}
                        className="p-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all"
                        title="Delete notification"
                        type="button"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {hasMore && notifications.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => fetchNotifications(Number(page || 1) + 1)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isLoading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default UserNotifications;

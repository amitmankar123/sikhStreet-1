import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiShoppingBag,
  FiRotateCcw,
  FiPackage,
  FiGrid,
  FiTag,
  FiUsers,
  FiTruck,
  FiImage,
  FiPercent,
  FiBell,
  FiMessageCircle,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiGlobe,
  FiShield,
  FiDatabase,
  FiChevronDown,
  FiX,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useAdminAuthStore } from "../../store/adminStore";
import adminMenu from "../../config/adminMenu.json";

// Icon mapping for menu items
const iconMap = {
  Dashboard: FiHome,
  Orders: FiShoppingBag,
  "Return Requests": FiRotateCcw,
  Products: FiPackage,
  Categories: FiGrid,
  Brands: FiTag,
  Customers: FiUsers,
  "Delivery Management": FiTruck,
  "Offers & Sliders": FiImage,
  Banners: FiImage,
  "Promo Codes": FiPercent,
  Notifications: FiBell,
  "Support Desk": FiMessageCircle,
  Reports: FiFileText,
  "Analytics & Finance": FiBarChart2,
  Settings: FiSettings,
  Policies: FiShield,
  Firebase: FiDatabase,
};

// Helper function to convert child name to route path
const getChildRoute = (parentRoute, childName) => {
  const routeMap = {
    "/admin/orders": {
      "All Orders": "/admin/orders/all-orders",
      "Order Tracking": "/admin/orders/order-tracking",
    },
    "/admin/products": {
      "Manage Products": "/admin/products/manage-products",
      "Manage Categories": "/admin/categories?tab=manage",
      "Tax & Pricing": "/admin/products/tax-pricing",
      "Product Ratings": "/admin/products/product-ratings",
    },
    "/admin/brands": {
      "Manage Brands": "/admin/brands/manage-brands",
    },
    "/admin/customers": {
      "View Customers": "/admin/customers/view-customers",
      Addresses: "/admin/customers/addresses",
      Transactions: "/admin/customers/transactions",
    },
    "/admin/delivery": {
      "Delivery Boys": "/admin/delivery/delivery-boys",
      "Cash Collection": "/admin/delivery/cash-collection",
      "Assign Delivery": "/admin/delivery/assign-delivery",
    },
    "/admin/offers": {
      "Home Sliders": "/admin/offers/home-sliders",
      "Festival Offers": "/admin/offers/festival-offers",
    },
    "/admin/notifications": {
      "All Notifications": "/admin/notifications",
      "Push Notifications": "/admin/notifications/push-notifications",
      "Custom Messages": "/admin/notifications/custom-messages",
    },
    "/admin/support": {
      "Live Chat": "/admin/support/live-chat",
      "Ticket Types": "/admin/support/ticket-types",
      Tickets: "/admin/support/tickets",
    },
    "/admin/reports": {
      "Sales Report": "/admin/reports/sales-report",
      "Inventory Report": "/admin/reports/inventory-report",
    },
    "/admin/finance": {
      "Revenue Overview": "/admin/finance/revenue-overview",
      "Profit & Loss": "/admin/finance/profit-loss",
      "Order Trends": "/admin/finance/order-trends",
      "Payment Breakdown": "/admin/finance/payment-breakdown",
      "Tax Reports": "/admin/finance/tax-reports",
      "Refund Reports": "/admin/finance/refund-reports",
    },
    "/admin/settings": {
      General: "/admin/settings/general",
      "Payment & Shipping": "/admin/settings/payment-shipping",
      "Orders & Customers": "/admin/settings/orders-customers",
      "Products & Inventory": "/admin/settings/products-inventory",
      "Content & Features": "/admin/settings/content-features",
      "Notifications & SEO": "/admin/settings/notifications-seo",
    },
    "/admin/policies": {
      "Privacy Policy": "/admin/policies/privacy-policy",
      "Refund Policy": "/admin/policies/refund-policy",
      "Terms & Conditions": "/admin/policies/terms-conditions",
    },
    "/admin/firebase": {
      "Push Config": "/admin/firebase/push-config",
      Authentication: "/admin/firebase/authentication",
    },
  };

  return routeMap[parentRoute]?.[childName] || parentRoute;
};

const AdminSidebar = ({ 
  isOpen, 
  onClose, 
  width, 
  onResize, 
  isCollapsed = false, 
  onToggleCollapse,
  isDragging,
  setIsDragging 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin } = useAdminAuthStore();
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname, onClose]);

  // Auto-expand menu items when their route is active
  useEffect(() => {
    const activeItem = adminMenu.find((item) => {
      if (item.route === "/admin/dashboard") {
        return location.pathname === "/admin/dashboard";
      }
      return location.pathname.startsWith(item.route) && location.pathname !== item.route;
    });
    if (activeItem && activeItem.children && activeItem.children.length > 0) {
      setExpandedItems((prev) => {
        if (prev[activeItem.title]) return prev;
        return { [activeItem.title]: true };
      });
    } else {
      const currentParent = adminMenu.find((item) => {
        if (item.route === "/admin/dashboard") {
          return location.pathname === "/admin/dashboard";
        }
        return location.pathname.startsWith(item.route);
      });
      if (currentParent && (!currentParent.children || currentParent.children.length === 0)) {
        setExpandedItems({});
      }
    }
  }, [location.pathname]);

  const isActive = (route) => {
    if (route === "/admin/dashboard") {
      return location.pathname === "/admin/dashboard";
    }
    return location.pathname.startsWith(route);
  };

  const toggleExpand = (title, closeOthers = true) => {
    setExpandedItems((prev) => {
      if (closeOthers) {
        return { [title]: !prev[title] };
      } else {
        return { ...prev, [title]: !prev[title] };
      }
    });
  };

  const closeAllExpanded = () => {
    setExpandedItems({});
  };

  const handleMenuItemClick = (route, parentTitle = null) => {
    if (parentTitle) {
      setExpandedItems({ [parentTitle]: true });
    } else {
      closeAllExpanded();
    }
    navigate(route);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Resize Drag Handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    if (setIsDragging) setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const newWidth = Math.max(72, Math.min(450, e.clientX));
    if (onResize) onResize(newWidth);
  };

  const handleMouseUp = () => {
    if (setIsDragging) setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Render menu item
  const renderMenuItem = (item) => {
    const Icon = iconMap[item.title] || FiPackage;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.title];
    const active = isActive(item.route);

    return (
      <div key={item.route} className="mb-1">
        {/* Main Menu Item */}
        <div
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
            ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"}
            ${active
              ? "bg-primary-600 text-white shadow-sm"
              : "text-gray-300 hover:bg-slate-700"
            }
          `}
          onClick={() => {
            if (hasChildren) {
              if (isCollapsed) {
                if (onToggleCollapse) onToggleCollapse();
                toggleExpand(item.title, true);
              } else {
                toggleExpand(item.title, true);
              }
            } else {
              handleMenuItemClick(item.route);
            }
          }}
          title={isCollapsed ? item.title : ""}
        >
          <Icon
            className={`text-xl flex-shrink-0 ${active ? "text-white" : "text-gray-400"}`}
          />
          {!isCollapsed && <span className="font-medium flex-1 text-sm truncate">{item.title}</span>}
          {!isCollapsed && hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}>
              <FiChevronDown className="text-gray-400 text-sm" />
            </motion.div>
          )}
        </div>

        {/* Children Items */}
        <AnimatePresence>
          {!isCollapsed && hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">
              <div className="ml-4 mt-1 pl-4 border-l-2 border-slate-600 space-y-1">
                {item.children.map((child, index) => {
                  const childRoute = getChildRoute(item.route, child);
                  const isChildActive =
                    location.pathname === childRoute ||
                    (childRoute !== item.route &&
                      location.pathname.startsWith(childRoute));

                  return (
                    <div
                      key={index}
                      onClick={() =>
                        handleMenuItemClick(childRoute, item.title)
                      }
                      className={`
                        px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer truncate
                        ${isChildActive
                          ? "bg-primary-500/20 text-white font-medium"
                          : "text-gray-400 hover:bg-slate-700"
                        }
                      `}>
                      {child}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Sidebar content
  const sidebarContent = (
    <div className="h-full w-full flex flex-col bg-slate-800 shadow-xl overflow-hidden select-none">
      {/* Header Section */}
      <div className="p-4 border-b border-slate-700 bg-slate-900 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Admin User Info */}
          <div className={`flex items-center gap-3 flex-1 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <FiUser className="text-white text-xl" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white text-sm truncate">
                  {admin?.name || "Admin User"}
                </h2>
                <p className="text-xs text-gray-400 truncate">
                  {admin?.email || "admin@admin.com"}
                </p>
              </div>
            )}
          </div>

          {/* Close Button - Mobile Only */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 lg:hidden"
            aria-label="Close sidebar">
            <FiX className="text-xl text-gray-300" />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-admin">
        {adminMenu.map((item) => renderMenuItem(item))}
      </nav>

      {/* Bottom Toggle Button - Desktop Only */}
      <div className="hidden lg:block p-3 border-t border-slate-700 bg-slate-900/50 flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-slate-700 hover:text-white ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          {isCollapsed ? (
            <FiChevronRight className="text-xl" />
          ) : (
            <>
              <FiChevronLeft className="text-xl" />
              <span className="font-medium text-sm truncate">Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-64 z-[10000] lg:hidden">
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop Fixed */}
      <div 
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 bg-slate-800 border-r border-slate-700 select-none group ${
          isDragging ? "" : "transition-all duration-300"
        }`}
        style={{ width: `${width}px` }}
      >
        {sidebarContent}
        
        {/* Resize Handle Overlay */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-500/30 active:bg-primary-600 transition-colors z-50"
          title="Drag to resize sidebar"
        />
      </div>
    </>
  );
};

export default AdminSidebar;

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import VendorBottomNav from './VendorBottomNav';
import useAdminHeaderHeight from '../../../Admin/hooks/useAdminHeaderHeight';

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerHeight = useAdminHeaderHeight();
  const location = useLocation();

  // Bottom nav height is 64px (h-16)
  const bottomNavHeight = 64;

  // Add small buffer to prevent content overlap (8px)
  const topPadding = headerHeight + 8;
  const bottomPadding = bottomNavHeight + 8;

  return (
    <div className="min-h-screen bg-vendor-bg flex">
      {/* Sidebar */}
      <VendorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0 max-w-full overflow-x-hidden">
        {/* Header */}
        <VendorHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content - with dynamic padding to account for fixed header and bottom nav */}
        <main
          className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden lg:pb-6 scrollbar-admin w-full min-w-0"
          style={{
            // Mobile: Use calculated heights with safe area support
            // Desktop: use the same computed top spacing for consistency
            paddingTop: `${Math.max(topPadding, 80)}px`, // Use calculated height or 80px, whichever is larger
            paddingBottom: `calc(${Math.max(bottomPadding, 80)}px + env(safe-area-inset-bottom, 0px))`, // Use calculated height + safe area or 80px + safe area, whichever is larger
          }}
        >
          <div className="w-full max-w-full overflow-x-hidden min-w-0 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <VendorBottomNav />
    </div>
  );
};

export default VendorLayout;


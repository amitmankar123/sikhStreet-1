import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminBottomNav from './AdminBottomNav';
import useAdminHeaderHeight from '../../hooks/useAdminHeaderHeight';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('admin_sidebar_width');
    const savedCollapsed = localStorage.getItem('admin_sidebar_collapsed') === 'true';
    if (savedCollapsed) return 72;
    return savedWidth ? parseInt(savedWidth, 10) : 256;
  });

  const [lastWidth, setLastWidth] = useState(() => {
    const savedWidth = localStorage.getItem('admin_sidebar_width');
    return savedWidth ? parseInt(savedWidth, 10) : 256;
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebarCollapse = () => {
    if (isCollapsed) {
      // Expand
      setIsCollapsed(false);
      setSidebarWidth(lastWidth);
      localStorage.setItem('admin_sidebar_collapsed', 'false');
    } else {
      // Collapse
      setIsCollapsed(true);
      setSidebarWidth(72);
      localStorage.setItem('admin_sidebar_collapsed', 'true');
    }
  };

  const handleSidebarResize = (newWidth) => {
    if (newWidth < 120) {
      setIsCollapsed(true);
      setSidebarWidth(72);
      localStorage.setItem('admin_sidebar_collapsed', 'true');
    } else {
      setIsCollapsed(false);
      setSidebarWidth(newWidth);
      setLastWidth(newWidth);
      localStorage.setItem('admin_sidebar_collapsed', 'false');
      localStorage.setItem('admin_sidebar_width', String(newWidth));
    }
  };

  const headerHeight = useAdminHeaderHeight();
  
  // Bottom nav height is 64px (h-16)
  const bottomNavHeight = 64;
  
  // Add small buffer to prevent content overlap (8px)
  const topPadding = headerHeight + 8;
  const bottomPadding = bottomNavHeight + 8;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        width={sidebarWidth}
        onResize={handleSidebarResize}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
      />

      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden ${isDragging ? '' : 'transition-all duration-300'}`}
        style={{ marginLeft: isDesktop ? `${sidebarWidth}px` : '0px' }}
      >
        {/* Header */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          sidebarWidth={sidebarWidth} 
          isDesktop={isDesktop} 
          isDragging={isDragging}
        />

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
          <div className="w-full max-w-full overflow-x-hidden min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <AdminBottomNav />
    </div>
  );
};

export default AdminLayout;

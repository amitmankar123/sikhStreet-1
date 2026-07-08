import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/user.css';
import MobileHeader from './MobileHeader';
import DesktopHeader from './DesktopHeader';
import MobileBottomNav from './MobileBottomNav';
import MobileCartBar from './MobileCartBar';
import CartDrawer from '../../../../shared/components/Cart/CartDrawer';
import useMobileHeaderHeight from '../../hooks/useMobileHeaderHeight';

const MobileLayout = ({ children, showBottomNav = true, showCartBar = true, fullWidth = false }) => {
  const location = useLocation();
  const headerHeight = useMobileHeaderHeight();
  // Hide header and bottom nav on login, register, and verification pages
  const isAuthPage = location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/verification';

  const isCheckoutPage = location.pathname === '/checkout';

  // Respect the showBottomNav prop and hide on auth pages
  const shouldShowBottomNav = showBottomNav && !isAuthPage;
  // Hide header on categories, search, wishlist, profile, and auth pages
  const shouldShowHeader = !isAuthPage &&
    location.pathname !== '/wishlist' &&
    location.pathname !== '/profile' &&
    location.pathname !== '/orders' &&
    !isCheckoutPage;

  // Ensure body scroll is restored when component mounts
  useEffect(() => {
    document.body.style.overflowY = '';
    return () => {
      document.body.style.overflowY = '';
    };
  }, []);

  return (
    <>
      {shouldShowHeader && <MobileHeader />}
      <main
        className={`min-h-screen w-full overflow-x-hidden ${fullWidth ? 'max-w-none px-0' : 'max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12'} ${shouldShowBottomNav ? 'pb-[calc(5rem+env(safe-area-inset-bottom))]' : ''} ${showCartBar ? 'pb-[calc(6rem+env(safe-area-inset-bottom))]' : ''}`}
        style={{ paddingTop: shouldShowHeader ? `${headerHeight}px` : '0px' }}
      >
        {children}
      </main>
      {showCartBar && <MobileCartBar />}
      {shouldShowBottomNav && <MobileBottomNav />}
      <CartDrawer />
    </>
  );
};

export default MobileLayout;


import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useAuthStore } from "../../../../shared/store/authStore";
import { useUIStore } from "../../../../shared/store/useStore";

const MobileBottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const toggleCart = useUIStore((state) => state.toggleCart);

  const profilePath = isAuthenticated ? "/profile" : "/login";

  const isActive = (path) => {
    if (path === "/home") {
      return location.pathname === "/home" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const navContent = (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container rounded-t-xl shadow-[0_-4px_20px_rgba(35,26,19,0.05)] border-t border-outline-variant/20 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center w-full px-4 py-2">
        {/* Home */}
        <Link
          to="/home"
          className={`${
            isActive("/home")
              ? "bg-primary-container text-on-primary-container rounded-full px-4 py-1"
              : "text-on-surface-variant hover:bg-surface-container-high"
          } flex flex-col items-center justify-center active:scale-90 transition-all duration-200`}
        >
          <Home size={22} />
          <span className="font-label-md text-[11px] font-semibold mt-0.5">Home</span>
        </Link>

        {/* Search */}
        <Link
          to="/search"
          className={`${
            isActive("/search")
              ? "bg-primary-container text-on-primary-container rounded-full px-4 py-1"
              : "text-on-surface-variant hover:bg-surface-container-high"
          } flex flex-col items-center justify-center active:scale-90 transition-all duration-200`}
        >
          <Search size={22} />
          <span className="font-label-md text-[11px] font-semibold mt-0.5">Search</span>
        </Link>

        {/* Cart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleCart();
          }}
          className="text-on-surface-variant hover:bg-surface-container-high flex flex-col items-center justify-center active:scale-90 transition-all duration-200"
        >
          <ShoppingBag size={22} />
          <span className="font-label-md text-[11px] font-semibold mt-0.5">Cart</span>
        </button>

        {/* Profile */}
        <Link
          to={profilePath}
          className={`${
            isActive("/profile") || isActive("/login")
              ? "bg-primary-container text-on-primary-container rounded-full px-4 py-1"
              : "text-on-surface-variant hover:bg-surface-container-high"
          } flex flex-col items-center justify-center active:scale-90 transition-all duration-200`}
        >
          <User size={22} />
          <span className="font-label-md text-[11px] font-semibold mt-0.5">Profile</span>
        </Link>
      </div>
    </nav>
  );

  return createPortal(navContent, document.body);
};

export default MobileBottomNav;

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCartStore, useUIStore } from "../../../../shared/store/useStore";
import { useWishlistStore } from "../../../../shared/store/wishlistStore";
import { useAuthStore } from "../../../../shared/store/authStore";
import { appLogo } from "../../../../data/logos";
import SearchBar from "../../../../shared/components/SearchBar";
import { Heart, ShoppingBag, User, LogOut, Grid, Bell, MapPin, ChevronDown, Menu, ChevronRight, MessageSquare } from "lucide-react";
import { HiOutlineUserCircle } from "react-icons/hi";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useUserNotificationStore } from "../../store/userNotificationStore";
import { useChatStore } from "../../../../shared/store/chatStore";
import DesktopCategoryBar from "./DesktopCategoryBar";
import { useCategoryStore } from "../../../../shared/store/categoryStore";

const DesktopHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuthStore();
    const itemCount = useCartStore((state) => state.getItemCount());
    const wishlistCount = useWishlistStore((state) => state.getItemCount());
    const unreadCount = useUserNotificationStore((state) => state.unreadCount);
    const ensureHydrated = useUserNotificationStore((state) => state.ensureHydrated);
    const toggleCart = useUIStore((state) => state.toggleCart);

    const { categories, initialize, getRootCategories } = useCategoryStore();
    const { threads, fetchThreads } = useChatStore();
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState(null);

    const unreadChatCount = threads.reduce((sum, t) => sum + Number(t.customerUnreadCount || 0), 0);

    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    const { scrollY } = useScroll();
    const headerHeight = useTransform(scrollY, [0, 100], ["5rem", "4.6rem"]);
    const logoScale = useTransform(scrollY, [0, 100], [1.05, 0.85]);
    const bgOpacity = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)"]);
    const backdropBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(12px)"]);

    useEffect(() => {
        ensureHydrated();
        initialize();
        if (isAuthenticated) {
            fetchThreads();
        }
    }, [isAuthenticated, fetchThreads, ensureHydrated, initialize]);

    const rootCategories = getRootCategories().filter((cat) => cat.isActive !== false);

    useEffect(() => {
        if (rootCategories.length > 0 && !selectedParentId) {
            setSelectedParentId(rootCategories[0].id);
        }
    }, [rootCategories, selectedParentId]);

    useEffect(() => {
        setIsCategoriesOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getSubcategories = (parentId) => {
        return categories.filter((cat) => {
            const catParentId = cat.parentId && typeof cat.parentId === 'object'
                ? (cat.parentId.id || cat.parentId._id)
                : cat.parentId;
            return String(catParentId || '') === String(parentId || '');
        });
    };

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        navigate("/home");
    };

    return (
        <div className="hidden md:block sticky top-0 z-[999] shadow-sm">
            <motion.header
                className="border-b border-slate-200 relative z-[999]"
                style={{
                    height: headerHeight,
                    backgroundColor: bgOpacity,
                    backdropFilter: backdropBlur,
                    WebkitBackdropFilter: backdropBlur
                }}
            >
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center pb-3 gap-1.9 lg:gap-8 transition-all">
                    {/* Logo & Categories */}
                    <div className="flex items-center gap-5 lg:gap-8 flex-shrink-0">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2.5">
                            {appLogo.src ? (
                                <motion.div style={{ scale: logoScale }} className="origin-left flex items-center">
                                    <img
                                        src={appLogo.src}
                                        alt={appLogo.alt}
                                        className="w-[180px] lg:w-[220px] h-auto object-contain mix-blend-multiply"
                                    />
                                </motion.div>
                            ) : (
                                <motion.span style={{ scale: logoScale }} className="text-4xl font-black text-[#F5A623] tracking-tight font-serif origin-left">SikhStreet</motion.span>
                            )}
                        </Link>

                        <button
                            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                            className="hidden lg:flex items-center gap-2.5 text-slate-700 hover:text-[#F5A623] transition-colors font-extrabold text-[22px] tracking-wide group outline-none"
                        >
                            <Menu size={28} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" /> Categories
                        </button>
                    </div>

                    {/* Massive Search Container */}
                    <div className="flex-1 min-w-0">
                        <SearchBar size="large" />
                    </div>

                    {/* Actions & Location */}
                    <div className="flex items-center gap-5 lg:gap-6 flex-shrink-0">
                        {/* Compact Location Dropdown */}
                        <div className="relative group z-50 hidden xl:block">
                            <button className="flex items-center text-slate-700 hover:text-slate-900 transition-all font-extrabold text-lg gap-1.5 hover:bg-slate-100 px-4 py-2.5 rounded-lg">
                                <MapPin size={24} strokeWidth={2.5} className="text-[#F5A623] flex-shrink-0" />
                                Deliver to Location
                                <ChevronDown size={18} strokeWidth={2.5} className="opacity-70 flex-shrink-0" />
                            </button>

                            {/* Mock Dropdown Menu */}
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-5 origin-top-right">
                                <h4 className="text-sm font-semibold text-brand-navy mb-4 flex items-center gap-2">
                                    <MapPin size={16} className="text-[#F5A623]" />
                                    Choose Location
                                </h4>
                                <div className="space-y-3 text-left">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Country</label>
                                        <select className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-navy focus:border-brand-navy text-slate-700 bg-slate-50 outline-none transition-all">
                                            <option>United States</option>
                                            <option>Canada</option>
                                            <option>UK</option>
                                            <option>India</option>
                                        </select>
                                    </div>
                                </div>
                                <button className="w-full mt-4 bg-brand-navy text-white font-medium text-sm py-2.5 rounded-lg hover:bg-opacity-90 transition-colors shadow-md">
                                    Apply Location
                                </button>
                            </div>
                        </div>
                        {/* Wishlist */}
                        <Link to="/wishlist" className="relative p-2.5 text-slate-700 hover:text-[#F5A623] transition-colors">
                            <Heart size={30} strokeWidth={2.5} />
                            {wishlistCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 w-[22px] h-[22px] rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center border-2 border-white">
                                    {wishlistCount > 9 ? "9+" : wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart */}
                        <button
                            onClick={toggleCart}
                            className="relative p-2.5 text-slate-700 hover:text-[#F5A623] transition-colors"
                        >
                            <ShoppingBag size={30} strokeWidth={2.5} />
                            {itemCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 w-[22px] h-[22px] rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center border-2 border-white">
                                    {itemCount > 9 ? "9+" : itemCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications */}
                        <Link
                            to={isAuthenticated ? "/notifications" : "/login"}
                            className="relative p-2.5 text-slate-700 hover:text-[#F5A623] transition-colors"
                        >
                            <Bell size={30} strokeWidth={2.5} />
                            {isAuthenticated && unreadCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 w-[22px] h-[22px] rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center border-2 border-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </Link>

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <div ref={userMenuRef} className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-full transition-all border border-transparent hover:border-slate-200"
                                >
                                    {user?.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-11 h-11 rounded-full object-cover border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center text-white font-black text-base">
                                            {user?.name?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <span className="hidden lg:block text-lg font-extrabold text-slate-700 max-w-[140px] truncate">{user?.name || "User"}</span>
                                </button>

                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-3 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-[60] min-w-[220px]"
                                        >
                                            <div className="px-3 py-3 border-b border-slate-100 mb-2 bg-slate-50 rounded-t-lg">
                                                <p className="font-semibold text-brand-navy text-sm">
                                                    {user?.name || "User"}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                                    {user?.email || ""}
                                                </p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors text-left w-full group"
                                            >
                                                <User size={16} className="text-slate-400 group-hover:text-brand-navy" />
                                                <span className="text-slate-700 text-sm font-medium">Profile</span>
                                            </Link>
                                            <Link
                                                to="/orders"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors text-left w-full group"
                                            >
                                                <ShoppingBag size={16} className="text-slate-400 group-hover:text-brand-navy" />
                                                <span className="text-slate-700 text-sm font-medium">Orders</span>
                                            </Link>
                                            <Link
                                                to="/chat"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors text-left w-full group"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <MessageSquare size={16} className="text-slate-400 group-hover:text-brand-navy" />
                                                    <span className="text-slate-700 text-sm font-medium">Messages</span>
                                                </div>
                                                {unreadChatCount > 0 && (
                                                    <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center">
                                                        {unreadChatCount > 9 ? "9+" : unreadChatCount}
                                                    </span>
                                                )}
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors text-left w-full text-red-600 mt-1 group"
                                            >
                                                <LogOut size={16} className="text-red-400 group-hover:text-red-600" />
                                                <span className="text-sm font-medium">Logout</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login" className="px-5 py-2.5 border border-slate-900 rounded-full hover:bg-slate-50 text-slate-900 font-extrabold transition-colors text-base flex items-center gap-2 shadow-sm">
                                <User size={18} />
                                <span>Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </motion.header>

            <AnimatePresence>
                {isCategoriesOpen && (
                    <>
                        {/* Backdrop Mask */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ top: headerHeight }}
                            onClick={() => setIsCategoriesOpen(false)}
                            className="fixed inset-x-0 bottom-0 bg-black/40 z-[998]"
                        />

                        {/* Mega Menu Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ top: headerHeight }}
                            className="fixed left-4 lg:left-12 w-[850px] max-w-[calc(100vw-6rem)] h-[500px] bg-white rounded-2xl shadow-2xl z-[999] border border-slate-200/80 flex overflow-hidden origin-top-left"
                        >
                            {/* Left Panel: Parent Categories */}
                            <div className="w-[280px] bg-slate-50 border-r border-slate-100 overflow-y-auto py-3 scrollbar-hide">
                                {rootCategories.map((cat) => {
                                    const isSelected = String(cat.id) === String(selectedParentId);
                                    return (
                                        <div
                                            key={cat.id}
                                            onMouseEnter={() => setSelectedParentId(cat.id)}
                                            className={`px-6 py-3 flex items-center justify-between cursor-pointer transition-all ${
                                                isSelected
                                                    ? "bg-white text-[#F5A623] font-bold border-l-4 border-brand-saffron"
                                                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                            }`}
                                        >
                                            <span className="text-sm tracking-wide font-sans">{cat.name}</span>
                                            <ChevronRight size={16} className={`transition-transform opacity-60 ${isSelected ? "text-[#F5A623] translate-x-1" : ""}`} />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Panel: Subcategories */}
                            <div className="flex-1 bg-white overflow-y-auto p-8 scrollbar-admin">
                                {selectedParentId && (
                                    <>
                                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                                            <Link
                                                to={`/category/${selectedParentId}`}
                                                onClick={() => setIsCategoriesOpen(false)}
                                                className="inline-flex items-center gap-1.5 text-base font-serif font-black text-slate-800 hover:text-[#F5A623] hover:underline transition-colors"
                                            >
                                                All {rootCategories.find(c => String(c.id) === String(selectedParentId))?.name} &rarr;
                                            </Link>
                                        </div>

                                        {getSubcategories(selectedParentId).length > 0 ? (
                                            <div className="grid grid-cols-3 gap-6">
                                                {getSubcategories(selectedParentId).map((sub) => (
                                                    <Link
                                                        key={sub.id}
                                                        to={`/category/${sub.id}`}
                                                        onClick={() => setIsCategoriesOpen(false)}
                                                        className="flex flex-col items-center group text-center"
                                                    >
                                                        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center p-1 relative mb-2.5 transition-all duration-300 group-hover:scale-103 group-hover:shadow-md">
                                                            {sub.image ? (
                                                                <img
                                                                    src={sub.image}
                                                                    alt={sub.name}
                                                                    className="w-full h-full object-cover rounded-xl"
                                                                    onError={(e) => {
                                                                        e.target.style.display = "none";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-100 flex items-center justify-center">
                                                                    <span className="text-slate-400 text-xs font-bold font-serif">
                                                                        {sub.name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 group-hover:text-[#F5A623] group-hover:underline line-clamp-2 leading-tight">
                                                            {sub.name}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
                                                <span className="text-4xl mb-2">📦</span>
                                                <p className="text-sm font-serif">No subcategories found</p>
                                                <Link 
                                                    to={`/category/${selectedParentId}`}
                                                    onClick={() => setIsCategoriesOpen(false)}
                                                    className="mt-4 px-4 py-2 bg-brand-navy text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                                                >
                                                    View Products Directly
                                                </Link>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {(location.pathname === '/' || location.pathname === '/home' || location.pathname.startsWith('/product/')) && (
                <DesktopCategoryBar />
            )}
        </div>
    );
};

export default DesktopHeader;

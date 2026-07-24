import { useEffect, useRef, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiSave, FiCamera, FiArrowLeft, FiPackage, FiMapPin, FiLogOut, FiChevronRight, FiBell, FiMessageCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useChatStore } from '../../../shared/store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MobileLayout from "../components/Layout/MobileLayout";
import { useAuthStore } from '../../../shared/store/authStore';
import { isValidEmail, isValidPhone } from '../../../shared/utils/helpers';
import toast from 'react-hot-toast';
import PageTransition from '../../../shared/components/PageTransition';
import PasswordStrengthMeter from '../components/Mobile/PasswordStrengthMeter';
import { useUserNotificationStore } from '../store/userNotificationStore';

const MobileProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, uploadProfileAvatar, changePassword, logout, isLoading } = useAuthStore();
  const avatarInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'personal', 'password'
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const unreadNotificationCount = useUserNotificationStore((state) => state.unreadCount);
  const ensureNotificationHydrated = useUserNotificationStore((state) => state.ensureHydrated);
  const { threads, fetchThreads } = useChatStore();
  
  const unreadChatCount = useMemo(() => {
    return threads.reduce((sum, t) => sum + Number(t.customerUnreadCount || 0), 0);
  }, [threads]);

  const {
    register: registerPersonal,
    handleSubmit: handleSubmitPersonal,
    reset: resetPersonal,
    formState: { errors: personalErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm();

  const newPassword = watch('newPassword');

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop && activeTab === 'menu') {
      setActiveTab('personal');
    }
  }, [isDesktop, activeTab]);

  useEffect(() => {
    resetPersonal({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user, resetPersonal]);

  useEffect(() => {
    ensureNotificationHydrated();
  }, [ensureNotificationHydrated]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const onPersonalSubmit = async (data) => {
    try {
      await updateProfile({
        name: data?.name,
        phone: data?.phone,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/home');
    toast.success('Logged out successfully');
  };

  const handleAvatarPick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type);
    if (!isValidType) {
      toast.error('Only JPEG, PNG, WEBP and GIF images are allowed.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5MB or less.');
      event.target.value = '';
      return;
    }

    try {
      await uploadProfileAvatar(file);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error(error?.message || 'Failed to upload profile picture');
    } finally {
      event.target.value = '';
    }
  };

  const menuOptions = [
    { id: 'personal', label: 'Personal Information', icon: FiUser, color: 'text-black', bg: 'bg-white' },
    { id: 'orders', label: 'My Orders', icon: FiPackage, color: 'text-black', bg: 'bg-white', link: '/orders' },
    { id: 'addresses', label: 'My Addresses', icon: FiMapPin, color: 'text-black', bg: 'bg-white', link: '/addresses' },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: FiBell,
      color: 'text-black',
      bg: 'bg-white',
      link: '/notifications',
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : null,
    },
    {
      id: 'chats',
      label: 'Seller Messages',
      icon: FiMessageCircle,
      color: 'text-black',
      bg: 'bg-white',
      link: '/chat',
      badge: unreadChatCount > 0 ? unreadChatCount : null,
    },
    { id: 'password', label: 'Change Password', icon: FiLock, color: 'text-black', bg: 'bg-white' },
  ];

  return (
    <PageTransition>
      <MobileLayout showBottomNav={true} showCartBar={true}>
          <div className="w-full pb-24 lg:pb-12 max-w-7xl mx-auto min-h-screen bg-white">
            {/* Desktop Header */}
            <div className="hidden lg:block px-4 py-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-[#F5A623] hover:text-black rounded-full transition-colors bg-white shadow-sm border border-black/10"
                >
                  <FiArrowLeft className="text-xl text-black" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-black">My Profile</h1>
                  <p className="text-black/70 mt-1">Manage your personal information and security settings</p>
                </div>
              </div>
            </div>

            <div className="lg:hidden px-4 py-4 bg-white border-b border-black/10 sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => activeTab === 'menu' ? navigate(-1) : setActiveTab('menu')}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                >
                  <FiArrowLeft className="text-xl text-black" />
                </button>
                <h1 className="text-xl font-bold text-black">
                  {activeTab === 'menu' ? 'My Account' : activeTab === 'personal' ? 'Personal Info' : 'Security'}
                </h1>
              </div>
            </div>

            <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:px-4">
              {/* Desktop Sidebar */}
              <div className="hidden lg:block lg:col-span-3">
                <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm sticky top-24">
                  <div className="p-3 space-y-1">
                    <p className="px-3 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Account Settings</p>
                    {menuOptions.map((option) => {
                      const isActive = activeTab === option.id;
                      const Icon = option.icon;
                      
                      if (option.link) {
                        return (
                          <Link
                            key={option.id}
                            to={option.link}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left font-medium text-gray-600 hover:bg-white hover:text-[#F5A623] group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full ${option.bg} ${option.color} flex items-center justify-center`}>
                                <Icon className="text-base" />
                              </div>
                              <span className="text-sm font-semibold text-gray-700 group-hover:text-[#F5A623]">{option.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {option.badge ? (
                                <span className="min-w-[18px] h-4.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                  {option.badge > 99 ? '99+' : option.badge}
                                </span>
                              ) : null}
                              <FiChevronRight className="text-gray-400 text-xs" />
                            </div>
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={option.id}
                          onClick={() => setActiveTab(option.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left font-medium group ${
                            isActive
                              ? 'bg-white text-black'
                              : 'text-gray-600 hover:bg-white hover:text-[#F5A623]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${option.bg} ${isActive ? 'text-black' : option.color} flex items-center justify-center`}>
                              <Icon className="text-base" />
                            </div>
                            <span className={`text-sm font-semibold ${isActive ? 'text-black' : 'text-gray-700 group-hover:text-[#F5A623]'}`}>{option.label}</span>
                          </div>
                          <FiChevronRight className={`text-xs ${isActive ? 'text-black' : 'text-gray-400'}`} />
                        </button>
                      );
                    })}
                    
                    {/* Divider */}
                    <div className="border-t border-black/10 my-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left font-medium text-black hover:bg-[#F5A623] hover:text-black group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-black/5 text-black flex items-center justify-center group-hover:bg-black/10">
                            <FiLogOut className="text-base" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-black">Sign Out</span>
                        </div>
                        <FiChevronRight className="text-gray-400 text-xs group-hover:text-black" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="px-4 py-4 lg:p-0 lg:col-span-9 overflow-hidden">
                <AnimatePresence mode="wait">
                {/* Dashboard Menu (Mobile Only) */}
                {!isDesktop && activeTab === 'menu' && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="lg:hidden space-y-6"
                  >
                    {/* User Profile Summary Card */}
                    <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                      <div className="w-20 h-20 rounded-full bg-[#f2dfd3] flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user?.name || 'User'}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          user?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <h2 className="text-xl font-extrabold text-black mb-1">{user?.name}</h2>
                      <p className="text-black/70 text-sm mb-4 font-medium">{user?.email}</p>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => setActiveTab('personal')}
                          className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm border border-black/10"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="space-y-3">
                      <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Account Settings</p>
                      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-sm border border-black/10">
                        {menuOptions.map((option) => (
                          option.link ? (
                            <Link
                              key={option.id}
                              to={option.link}
                              className="w-full flex items-center justify-between p-4 hover:bg-white transition-colors bg-white"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${option.bg} ${option.color} flex items-center justify-center`}>
                                  <option.icon className="text-lg" />
                                </div>
                                <span className="font-bold text-black text-sm">{option.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {option.badge ? (
                                  <span className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {option.badge > 99 ? '99+' : option.badge}
                                  </span>
                                ) : null}
                                <FiChevronRight className="text-gray-400" />
                              </div>
                            </Link>
                          ) : (
                            <button
                              key={option.id}
                              onClick={() => setActiveTab(option.id)}
                              className="w-full flex items-center justify-between p-4 hover:bg-white transition-colors bg-white"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${option.bg} ${option.color} flex items-center justify-center`}>
                                  <option.icon className="text-lg" />
                                </div>
                                <span className="font-bold text-black text-sm">{option.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {option.badge ? (
                                  <span className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {option.badge > 99 ? '99+' : option.badge}
                                  </span>
                                ) : null}
                                <FiChevronRight className="text-gray-400" />
                              </div>
                            </button>
                          )
                        ))}
                      </div>
                    </div>

                    {/* Logout Option */}
                    <div className="pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 p-4 glass-card rounded-2xl text-black font-bold text-sm shadow-sm border border-black/10 hover:bg-[#F5A623] hover:text-black transition-colors bg-white"
                      >
                        <FiLogOut className="text-lg" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Personal Information Tab */}
                {activeTab === 'personal' && (
                  <motion.div
                    key="personal"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card rounded-2xl p-4 lg:p-8"
                  >
                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-[#f2dfd3] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user?.name || 'User'}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            user?.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.avif"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={handleAvatarPick}
                          disabled={isLoading}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white hover:bg-[#F5A623] hover:text-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <FiCamera className="text-sm" />
                        </button>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Profile Picture</p>
                        <p className="text-xs text-black/70">JPG, PNG or GIF. Max size 5MB</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitPersonal(onPersonalSubmit)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            {...registerPersonal('name', {
                              required: 'Name is required',
                              minLength: {
                                value: 2,
                                message: 'Name must be at least 2 characters',
                              },
                            })}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${personalErrors.name
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-black/10 focus:border-[#F5A623]'
                              } focus:outline-none transition-colors text-base`}
                            placeholder="Your full name"
                          />
                        </div>
                        <AnimatePresence>
                          {personalErrors.name && (
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="mt-1 text-sm text-red-600"
                            >
                              {personalErrors.name.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            {...registerPersonal('email', {
                              required: 'Email is required',
                              validate: (value) =>
                                isValidEmail(value) || 'Please enter a valid email',
                            })}
                            readOnly
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${personalErrors.email
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-black/10 focus:border-[#F5A623]'
                              } focus:outline-none transition-colors text-base bg-white text-black/70 cursor-not-allowed`}
                            placeholder="your.email@example.com"
                          />
                        </div>
                        <p className="mt-1 text-xs text-black/70">
                          Email cannot be changed from profile settings.
                        </p>
                        <AnimatePresence>
                          {personalErrors.email && (
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="mt-1 text-sm text-red-600"
                            >
                              {personalErrors.email.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            {...registerPersonal('phone', {
                              validate: (value) =>
                                !value || isValidPhone(value) || 'Please enter a valid phone number',
                            })}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${personalErrors.phone
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-black/10 focus:border-[#F5A623]'
                              } focus:outline-none transition-colors text-base`}
                            placeholder="1234567890"
                          />
                        </div>
                        <AnimatePresence>
                          {personalErrors.phone && (
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="mt-1 text-sm text-red-600"
                            >
                              {personalErrors.phone.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                      >
                        <FiSave />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Change Password Tab */}
                {activeTab === 'password' && (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card rounded-2xl p-4 lg:p-8"
                  >
                    <h2 className="text-lg font-bold text-black mb-4">Change Password</h2>

                    <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            {...registerPassword('currentPassword', {
                              required: 'Current password is required',
                            })}
                            className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${passwordErrors.currentPassword
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-black/10 focus:border-[#F5A623]'
                              } focus:outline-none transition-colors text-sm sm:text-base`}
                            placeholder="Current Password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {passwordErrors.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            {...registerPassword('newPassword', {
                              required: 'New password is required',
                              minLength: {
                                value: 6,
                                message: 'Password must be at least 6 characters',
                              },
                            })}
                            className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${passwordErrors.newPassword
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-black/10 focus:border-[#F5A623]'
                              } focus:outline-none transition-colors text-sm sm:text-base`}
                            placeholder="New Password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mt-1 text-sm text-red-600"
                          >
                            {passwordErrors.newPassword.message}
                          </motion.p>
                        )}
                        <PasswordStrengthMeter password={newPassword} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...registerPassword('confirmPassword', {
                              required: 'Please confirm your password',
                              validate: (value) =>
                                value === newPassword || 'Passwords do not match',
                            })}
                            className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${passwordErrors.confirmPassword
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-black/10 focus:border-[#F5A623]'
                              } focus:outline-none transition-colors text-sm sm:text-base`}
                            placeholder="Confirm Password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {passwordErrors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                      >
                        <FiSave />
                        {isLoading ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </form>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
          </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default MobileProfile;


import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiKey, FiClock, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useVendorAuthStore } from "../store/vendorAuthStore";
import toast from 'react-hot-toast';

const VendorLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyOtp, resendOtp, isAuthenticated, isLoading } = useVendorAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP State
  const [isOTPMode, setIsOTPMode] = useState(false);
  const [otp, setOtp] = useState('');

  // Pending Approval State
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/vendor/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password, rememberMe);
      toast.success('Login successful!');
      const from = location.state?.from?.pathname || '/vendor/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || '';
      // Check if the error indicates unverified email or pending approval
      if (errMsg.includes('verify your email')) {
        toast.error('Your email is not verified. Please enter the OTP sent to your email.');
        setIsOTPMode(true);
      } else if (errMsg.includes('pending admin approval')) {
        setIsPendingApproval(true);
      } else {
        toast.error(errMsg || 'Invalid credentials');
      }
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    
    try {
      await verifyOtp(formData.email, otp);
      toast.success('Email verified successfully! Logging you in...');
      setIsOTPMode(false);
      setOtp('');
      
      // Auto login after successful verification
      try {
        await login(formData.email, formData.password, rememberMe);
        const from = location.state?.from?.pathname || '/vendor/dashboard';
        navigate(from, { replace: true });
      } catch (loginError) {
         const errMsg = loginError?.response?.data?.message || loginError?.message || '';
         if (errMsg.includes('pending admin approval')) {
           toast.success('Email verified! Your account is now pending admin approval.');
           setIsPendingApproval(true);
         } else {
           toast.error(errMsg || 'Login failed after verification');
         }
      }
      
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'OTP verification failed');
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOtp(formData.email);
      toast.success('A new OTP has been sent to your email.');
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {isPendingApproval ? (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-yellow-50">
                <FiClock className="text-yellow-500 text-4xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Approval Pending</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                The Admin has not approved your shop yet. Please wait while our team reviews your application. We will notify you once your store is approved and ready to go!
              </p>
              <button
                onClick={() => setIsPendingApproval(false)}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <FiArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-400" />
                Back to Login
              </button>
            </motion.div>
          ) : !isOTPMode ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Logo/Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-green">
                  <FiLock className="text-white text-2xl" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Vendor Login</h1>
                <p className="text-gray-600">Enter your credentials to access your vendor dashboard</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="vendor@example.com"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remember me</span>
                  </label>
                  <Link
                    to="/vendor/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gradient-green text-white py-3 rounded-xl font-semibold hover:shadow-glow-green transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>

                {/* Register Link */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link
                      to="/vendor/register"
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Register as Vendor
                    </Link>
                  </p>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Logo/Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiKey className="text-white text-2xl" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Verify Email</h1>
                <p className="text-gray-600">Enter the 6-digit OTP sent to {formData.email}</p>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleOTPSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 placeholder:text-gray-400 placeholder:tracking-normal"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>

                {/* Resend Link */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-blue-600 hover:text-blue-700 font-semibold focus:outline-none"
                    >
                      Resend
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOTPMode(false)}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VendorLogin;


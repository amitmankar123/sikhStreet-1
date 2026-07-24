import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../shared/store/authStore';
import { isValidEmail, isValidPhone } from '../../../shared/utils/helpers';
import toast from 'react-hot-toast';
import MobileLayout from "../components/Layout/MobileLayout";
import PageTransition from '../../../shared/components/PageTransition';
import api from '../../../shared/utils/api';

const MobileRegister = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formMode, setFormMode] = useState('signup'); // 'signup' or 'login'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const handleModeChange = (mode) => {
    setFormMode(mode);
    if (mode === 'login') {
      navigate('/login');
    }
  };

  const onSubmit = async (data) => {
    try {
      // Combine first name and last name
      const fullName = `${data.firstName} ${data.lastName}`;
      // Backend stores a normalized 10-digit phone value.
      const phone = data.phone;

      // Check availability first
      await api.post('/user/auth/check-availability', {
        email: data.email.trim().toLowerCase(),
        phone: phone,
      });

      await registerUser(fullName, data.email, data.password, phone);
      toast.success('Registration successful!');
      // Navigate to verification page
      navigate('/verification', { state: { email: data.email } });
    } catch (error) {
      if (!error.response) {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
      console.warn("Registration error:", error);
    }
  };

  return (
    <PageTransition>
      <MobileLayout showBottomNav={false} showCartBar={false}>
        <div className="w-full min-h-screen bg-white flex items-start justify-center px-4 pt-8 pb-12 relative overflow-hidden font-sans">
          {/* Decorative Saffron Blurs */}
          <div className="hidden" />
          <div className="hidden" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="bg-white border border-black/10 rounded-3xl p-6 shadow-sm">
              {/* Logo & Header */}
              <div className="text-center mb-6 flex flex-col items-center">
                <div className="w-48 flex items-center justify-center mb-4">
                  <img
                    className="w-full h-auto object-contain mix-blend-multiply"
                    alt="sikhSTREET logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_QtluDyTyyTERMfRfd830u3RcIkF7aJHRbM37FYnRFNCY01_N74tx3WAK0zGIr3PEXlqhIdcITnhHLXC5x87LHZKdO0BvuQbZI88UlL9d0hYbgyyGowhWYN-gBgtlmM2Rr0o6e4YSkF9e4x6vS7jZY4SqZ65AXuXlAHqSnNDUs613UTccW7ylV1CyRVm_9MFrt9ceJxGerEQ2cFT2rZUFNVaq3a900_TuKdoUrotAgb_cjLr3F4-CNsxx4qut7UFp75j3KGaXtxvHxG8"
                  />
                </div>
                <h1 className="text-2xl font-black text-gray-900 font-serif tracking-wide" style={{ fontFamily: "\"Times New Roman\", Times, serif" }}>Get Started Now</h1>
                <p className="text-xs text-black/80 mt-1">Create an account to join sikhSTREET</p>
              </div>

              {/* Sign Up / Log In Toggle */}
              <div className="mb-6">
                <div className="flex bg-black/5 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${formMode === 'signup'
                        ? 'bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${formMode === 'login'
                        ? 'bg-black hover:bg-[#F5A623] hover:text-black transition-colors text-white shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Log In
                  </button>
                </div>
              </div>

              {/* Register Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      {...register('firstName', {
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters',
                        },
                      })}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white/50 backdrop-blur-sm ${errors.firstName
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200/80 focus:border-[#F5A623]'
                        } focus:outline-none transition-colors text-base`}
                      placeholder="Raj"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      {...register('lastName', {
                        required: 'Last name is required',
                        minLength: {
                          value: 2,
                          message: 'Last name must be at least 2 characters',
                        },
                      })}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white/50 backdrop-blur-sm ${errors.lastName
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200/80 focus:border-[#F5A623]'
                        } focus:outline-none transition-colors text-base`}
                      placeholder="Sarkar"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        validate: (value) =>
                          isValidEmail(value) || 'Please enter a valid email',
                      })}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white/50 backdrop-blur-sm ${errors.email
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200/80 focus:border-[#F5A623]'
                        } focus:outline-none transition-colors text-base`}
                      placeholder="sarkarraj0766@gmail.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      {...register('countryCode', { required: true })}
                      className="w-24 px-3 py-3 rounded-xl border-2 bg-white/50 border-gray-200/80 focus:border-[#F5A623] focus:outline-none text-sm font-semibold text-gray-700"
                    >
                      <option value="+880">+880</option>
                      <option value="+1">+1</option>
                      <option value="+91">+91</option>
                      <option value="+44">+44</option>
                    </select>
                    <div className="relative flex-1">
                      <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        {...register('phone', {
                          required: 'Phone number is required',
                          validate: (value) =>
                            isValidPhone(value) || 'Please enter a valid phone number',
                        })}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white/50 backdrop-blur-sm ${errors.phone
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200/80 focus:border-[#F5A623]'
                          } focus:outline-none transition-colors text-base`}
                        placeholder="4547260592"
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Set Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 bg-white/50 backdrop-blur-sm ${errors.password
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200/80 focus:border-[#F5A623]'
                        } focus:outline-none transition-colors text-base`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white hover:bg-[#F5A623] hover:text-black transition-colors text-white py-3.5 rounded-xl font-bold text-base transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              {/* Sign In Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-black hover:text-[#F5A623] font-semibold"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default MobileRegister;

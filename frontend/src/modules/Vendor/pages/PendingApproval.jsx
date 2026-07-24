import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiMail, FiLogOut, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import { useVendorAuthStore } from '../store/vendorAuthStore';
import toast from 'react-hot-toast';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { vendor, logout, fetchProfile } = useVendorAuthStore();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Auto-check every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchProfile();
        const profile = result?.vendor ?? result;
        if (profile?.status === 'approved') {
          toast.success('🎉 Your account has been approved! Welcome aboard.');
          navigate('/vendor/dashboard', { replace: true });
        }
      } catch {
        // silently ignore
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchProfile, navigate]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const result = await fetchProfile();
      const profile = result?.vendor ?? result;
      setLastChecked(new Date());
      if (profile?.status === 'approved') {
        toast.success('🎉 Your account has been approved! Redirecting to dashboard...');
        navigate('/vendor/dashboard', { replace: true });
      } else {
        toast('Your application is still under review. We\'ll notify you by email.', {
          icon: '📋',
          duration: 4000,
        });
      }
    } catch {
      toast.error('Could not check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/vendor/login', { replace: true });
  };

  const steps = [
    { icon: FiCheckCircle, label: 'Registration Submitted', done: true, color: 'text-green-500' },
    { icon: FiCheckCircle, label: 'Email Verified', done: true, color: 'text-green-500' },
    { icon: FiClock, label: 'Admin Review', done: false, active: true, color: 'text-amber-500' },
    { icon: FiCheckCircle, label: 'Account Activated', done: false, color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative max-w-lg w-full"
      >
        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/30"
            >
              <FiClock className="text-white text-4xl" />
            </motion.div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Application Under Review
          </h1>
          <p className="text-white/60 text-center text-sm mb-8 leading-relaxed">
            Your vendor registration has been received. Our team is reviewing your application and documents. 
            You will receive an email notification once your account is approved.
          </p>

          {/* Vendor Info */}
          {vendor && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-white/40 text-xs mb-1">Registered As</p>
              <p className="text-white font-semibold">{vendor.storeName || vendor.name}</p>
              <p className="text-white/60 text-sm flex items-center gap-2 mt-1">
                <FiMail className="text-white/40" />
                {vendor.email}
              </p>
            </div>
          )}

          {/* Progress Steps */}
          <div className="space-y-3 mb-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                    ${step.done ? 'bg-green-500/20' : step.active ? 'bg-amber-500/20' : 'bg-white/5'}`}
                  >
                    {step.active ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Icon className={`text-sm ${step.color}`} />
                      </motion.div>
                    ) : (
                      <Icon className={`text-sm ${step.color}`} />
                    )}
                  </div>
                  <span className={`text-sm ${step.active ? 'text-amber-300 font-medium' : step.done ? 'text-white/70' : 'text-white/30'}`}>
                    {step.label}
                  </span>
                  {step.active && (
                    <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                      In Progress
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Last checked */}
          {lastChecked && (
            <p className="text-center text-white/30 text-xs mb-4">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold
                flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
            >
              {checking ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <FiRefreshCw className="text-lg" />
                  </motion.div>
                  Checking Status…
                </>
              ) : (
                <>
                  <FiRefreshCw className="text-lg" />
                  Check Approval Status
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-medium
                flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <FiLogOut />
              Sign Out
            </motion.button>
          </div>

          {/* Auto-check notice */}
          <p className="text-center text-white/20 text-xs mt-5">
            Status is checked automatically every 30 seconds
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingApproval;

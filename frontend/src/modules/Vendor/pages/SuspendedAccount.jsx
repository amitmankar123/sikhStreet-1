import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSlash, FiLogOut, FiMail, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { useVendorAuthStore } from '../store/vendorAuthStore';

const SuspendedAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vendor, logout } = useVendorAuthStore();

  const isRejected = location.state?.rejected === true;
  const reason = location.state?.reason || vendor?.suspensionReason || null;

  const handleLogout = async () => {
    await logout();
    navigate('/vendor/login', { replace: true });
  };

  const Icon = isRejected ? FiXCircle : FiSlash;
  const color = isRejected ? 'from-red-600 to-rose-700' : 'from-orange-600 to-red-700';
  const shadowColor = isRejected ? 'shadow-red-600/30' : 'shadow-orange-600/30';
  const title = isRejected ? 'Application Rejected' : 'Account Suspended';
  const description = isRejected
    ? "Unfortunately, your vendor application did not meet our requirements at this time."
    : "Your vendor account has been suspended. You are not able to access the seller dashboard.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-red-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-orange-700/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full"
      >
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-xl ${shadowColor}`}>
              <Icon className="text-white text-4xl" />
            </div>
          </div>

          {/* Alert banner */}
          <div className={`flex items-center gap-2 justify-center mb-4 px-4 py-2 rounded-xl 
            ${isRejected ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}
          >
            <FiAlertTriangle className={isRejected ? 'text-red-400' : 'text-orange-400'} />
            <span className={`text-sm font-medium ${isRejected ? 'text-red-300' : 'text-orange-300'}`}>
              {isRejected ? 'Application Declined' : 'Access Restricted'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
          <p className="text-white/60 text-sm leading-relaxed mb-6">{description}</p>

          {/* Reason */}
          {reason && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
              <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Reason</p>
              <p className="text-white/80 text-sm">{reason}</p>
            </div>
          )}

          {/* Vendor info */}
          {vendor && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-white font-semibold">{vendor.storeName || vendor.name}</p>
              <p className="text-white/50 text-sm flex items-center justify-center gap-2 mt-1">
                <FiMail className="text-white/30" />
                {vendor.email}
              </p>
            </div>
          )}

          {/* Contact support */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
            <p className="text-purple-300 text-sm">
              If you believe this is an error or would like to appeal, please contact our support team at{' '}
              <a
                href="mailto:support@sikhstreet.com"
                className="underline text-purple-200 font-medium hover:text-white transition-colors"
              >
                support@sikhstreet.com
              </a>
            </p>
          </div>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium
              flex items-center justify-center gap-2 hover:bg-white/20 transition-all cursor-pointer"
          >
            <FiLogOut />
            Return to Login
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SuspendedAccount;

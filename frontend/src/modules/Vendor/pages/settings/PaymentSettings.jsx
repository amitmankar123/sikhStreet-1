import { useState, useEffect } from 'react';
import { FiSave, FiCreditCard, FiLock, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useVendorAuthStore } from "../../store/vendorAuthStore";
import toast from 'react-hot-toast';

const PaymentSettings = () => {
  const { vendor } = useVendorAuthStore();
  const [formData, setFormData] = useState({
    paymentMethods: {
      bankTransfer: true,
      upi: false,
      paypal: false,
    },
    upiId: '',
    paypalEmail: '',
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        paymentMethods: vendor.paymentMethods || {
          bankTransfer: true,
          upi: false,
          paypal: false,
        },
        upiId: vendor.upiId || '',
        paypalEmail: vendor.paypalEmail || '',
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentMethodToggle = (method) => {
    setFormData({
      ...formData,
      paymentMethods: {
        ...formData.paymentMethods,
        [method]: !formData.paymentMethods[method],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendor) return;

    // Simulate saving payout methods settings
    toast.success('Payment preferences saved successfully');
  };

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading vendor information...</p>
      </div>
    );
  }

  // Mask bank account number for security display
  const bankAccNum = vendor.bankDetails?.accountNumber || '';
  const maskedAccNumber = bankAccNum.length > 4 
    ? '•'.repeat(bankAccNum.length - 4) + bankAccNum.slice(-4) 
    : bankAccNum;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-full overflow-x-hidden"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Payment Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Configure your payment preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Read-Only Verified Payout Bank Account */}
        <div className="lg:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-fit space-y-4">
          <div className="flex items-center gap-2 text-purple-600">
            <FiCreditCard className="text-xl" />
            <h2 className="text-lg font-bold text-gray-800">Payout Account</h2>
          </div>
          
          <p className="text-xs text-gray-500">
            Your earnings are automatically transferred to this verified bank account.
          </p>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 font-medium">
            <div>
              <span className="text-xs text-gray-400 block font-normal">Account Holder</span>
              <span className="text-sm text-gray-800">{vendor.bankDetails?.accountName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-normal">Bank Name</span>
              <span className="text-sm text-gray-800">{vendor.bankDetails?.bankName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-normal">Account Number</span>
              <span className="text-sm text-gray-800 font-mono">{maskedAccNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-normal">IFSC / Routing Code</span>
              <span className="text-sm text-gray-800 font-mono">{vendor.bankDetails?.ifscCode || 'N/A'}</span>
            </div>
          </div>

          <div className="flex gap-2 items-start p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-800 text-xs">
            <FiAlertCircle className="shrink-0 mt-0.5" />
            <p>
              Your bank details were verified during onboarding. To update these details, please contact SikhStreet Seller Support.
            </p>
          </div>
        </div>

        {/* Right Side: Preferred Payment Methods Options */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-purple-600 mb-4">
            <FiLock className="text-xl" />
            <h2 className="text-lg font-bold text-gray-800">Payment Preferences</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.bankTransfer || false}
                  onChange={() => handlePaymentMethodToggle('bankTransfer')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-700">Bank Transfer</span>
                  <p className="text-xs text-gray-500 mt-1">Receive payouts directly via bank wire transfers</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.upi || false}
                  onChange={() => handlePaymentMethodToggle('upi')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-700">UPI Payments</span>
                  <p className="text-xs text-gray-500 mt-1">Accept payouts to your registered UPI ID address</p>
                </div>
              </label>

              {formData.paymentMethods.upi && (
                <div className="ml-7 mb-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId || ''}
                    onChange={handleChange}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.paypal || false}
                  onChange={() => handlePaymentMethodToggle('paypal')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-700">PayPal Express</span>
                  <p className="text-xs text-gray-500 mt-1">Link your PayPal account for instant wallet payouts</p>
                </div>
              </label>

              {formData.paymentMethods.paypal && (
                <div className="ml-7 mb-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    name="paypalEmail"
                    value={formData.paypalEmail || ''}
                    onChange={handleChange}
                    placeholder="your@paypal.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold text-sm w-full sm:w-auto justify-center"
              >
                <FiSave />
                Save Preferences
              </button>
            </div>
          </form>
        </div>

      </div>
    </motion.div>
  );
};

export default PaymentSettings;

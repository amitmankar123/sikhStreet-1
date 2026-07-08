import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCreditCard, FiLock, FiCheck, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { useVendorAuthStore } from '../store/vendorAuthStore';
import { updateVendorBankDetails } from '../services/vendorService';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Payout Setup', desc: 'How you\'ll get paid', icon: FiDollarSign },
  { id: 2, title: 'Billing Details', desc: 'Set up fee billing', icon: FiCreditCard },
  { id: 3, title: 'Store Security', desc: 'Secure your account', icon: FiLock },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { vendor, completeOnboarding } = useVendorAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [bankData, setBankData] = useState({
    accountName: vendor?.bankDetails?.accountName || '',
    accountNumber: vendor?.bankDetails?.accountNumber || '',
    bankName: vendor?.bankDetails?.bankName || '',
    ifscCode: vendor?.bankDetails?.ifscCode || '',
  });

  const [billingData, setBillingData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    billingZip: '',
  });

  const [securityData, setSecurityData] = useState({
    enable2FA: false,
    agreeToTerms: false,
  });

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const matches = v.match(/\d{4,16}/g);
      const match = (matches && matches[0]) || '';
      const parts = [];

      for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
      }

      if (parts.length > 0) {
        setBillingData((prev) => ({ ...prev, cardNumber: parts.join(' ') }));
      } else {
        setBillingData((prev) => ({ ...prev, cardNumber: v }));
      }
      return;
    }

    // Format expiry MM/YY
    if (name === 'cardExpiry') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (v.length >= 2) {
        setBillingData((prev) => ({ ...prev, cardExpiry: `${v.substring(0, 2)}/${v.substring(2, 4)}` }));
      } else {
        setBillingData((prev) => ({ ...prev, cardExpiry: v }));
      }
      return;
    }

    setBillingData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    const { accountName, accountNumber, bankName, ifscCode } = bankData;
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim() || !ifscCode.trim()) {
      toast.error('Please fill in all bank payout details');
      return false;
    }
    if (ifscCode.trim().length < 5) {
      toast.error('Please enter a valid IFSC code');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { cardNumber, cardExpiry, cardCvv, billingZip } = billingData;
    if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim() || !billingZip.trim()) {
      toast.error('Please enter complete billing details');
      return false;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid 16-digit card number');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setIsSubmitting(true);
      try {
        await updateVendorBankDetails(bankData);
        toast.success('Payout details saved!');
        setCurrentStep(2);
      } catch {
        // Handled by API interceptor
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      // Mock validation/saving of billing card info
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success('Billing information updated!');
        setCurrentStep(3);
      }, 1000);
    }
  };

  const handleFinish = async () => {
    if (!securityData.agreeToTerms) {
      toast.error('You must agree to the seller terms and conditions');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding();
      toast.success('Onboarding completed! Welcome to SikhStreet.');
      navigate('/vendor/dashboard');
    } catch {
      // Handled by API interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-3xl glass-card rounded-3xl shadow-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-white/20">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight font-serif">Shop Setup Wizard</h1>
          <p className="mt-2 text-primary-100">
            Welcome to SikhStreet, <span className="font-bold">{vendor?.name || 'Seller'}</span>! Set up your shop financials and safety to start selling.
          </p>
        </div>

        <div className="p-8">
          {/* Progress Stepper */}
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary-600 -translate-y-1/2 transition-all duration-300 z-0" 
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              ></div>

              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep >= step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <button
                      disabled={currentStep < step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                        isCurrent
                          ? 'bg-primary-600 text-white border-primary-600 shadow-glow-green scale-110'
                          : isActive
                          ? 'bg-primary-50 text-primary-600 border-primary-600'
                          : 'bg-white text-gray-400 border-gray-200'
                      }`}
                    >
                      {isActive && currentStep > step.id ? <FiCheck className="text-lg" /> : <StepIcon className="text-lg" />}
                    </button>
                    <span className={`mt-2.5 text-xs font-semibold whitespace-nowrap ${isCurrent ? 'text-primary-700 font-bold' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">1. Setup Your Payout Bank Account</h2>
                    <p className="text-sm text-gray-500 mt-1">Provide the bank account where your shop earnings will be directly transferred.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Holder Name *</label>
                      <input
                        type="text"
                        name="accountName"
                        value={bankData.accountName}
                        onChange={handleBankChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Number *</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={bankData.accountNumber}
                        onChange={handleBankChange}
                        placeholder="1234567890"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Name *</label>
                      <input
                        type="text"
                        name="bankName"
                        value={bankData.bankName}
                        onChange={handleBankChange}
                        placeholder="State Bank of India"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">IFSC / Routing Code *</label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={bankData.ifscCode}
                        onChange={handleBankChange}
                        placeholder="SBIN0001234"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 items-start p-4 bg-primary-50 border border-primary-100 rounded-2xl text-primary-800">
                    <FiAlertCircle className="text-xl shrink-0 mt-0.5" />
                    <p className="text-xs">
                      Please double-check your banking details. Inaccurate details can delay your store payouts. These bank credentials are encrypted securely.
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">2. Configure Billing Card</h2>
                    <p className="text-sm text-gray-500 mt-1">Etsy-style payment methods require a card to cover marketplace listing fees and premium subscriptions.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Number *</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={billingData.cardNumber}
                        onChange={handleBillingChange}
                        placeholder="4111 2222 3333 4444"
                        maxLength="19"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date *</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={billingData.cardExpiry}
                        onChange={handleBillingChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">CVV *</label>
                      <input
                        type="password"
                        name="cardCvv"
                        value={billingData.cardCvv}
                        onChange={handleBillingChange}
                        placeholder="***"
                        maxLength="3"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Billing Zip Code *</label>
                      <input
                        type="text"
                        name="billingZip"
                        value={billingData.billingZip}
                        onChange={handleBillingChange}
                        placeholder="10001"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">3. Store Security & Completion</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure security preferences to protect your seller profile.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div>
                        <span className="text-sm font-bold text-gray-800">Enable Two-Factor Authentication (2FA)</span>
                        <p className="text-xs text-gray-500 mt-0.5">We will send verification codes to your phone on new logins.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityData.enable2FA}
                          onChange={(e) => setSecurityData((prev) => ({ ...prev, enable2FA: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securityData.agreeToTerms}
                        onChange={(e) => setSecurityData((prev) => ({ ...prev, agreeToTerms: e.target.checked }))}
                        className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <div className="text-xs text-gray-600">
                        I agree to the <span className="text-primary-600 font-bold hover:underline">SikhStreet Marketplace Policies</span>, seller code of conduct, and fee structures. I confirm that all documents submitted are authentic.
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stepper Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Back
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/10 hover:shadow-primary-600/20 transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? 'Saving...' : 'Next Step'}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting || !securityData.agreeToTerms}
                className="px-8 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/10 hover:shadow-primary-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Completing...' : 'Finish Setup'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;

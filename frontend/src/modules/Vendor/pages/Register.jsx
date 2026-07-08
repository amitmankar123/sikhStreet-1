import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiShoppingBag, FiMapPin, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useVendorAuthStore } from "../store/vendorAuthStore";
import toast from 'react-hot-toast';
import SearchablePhoneInput, { COUNTRIES } from "../../../shared/components/SearchablePhoneInput";
import { checkVendorAvailability } from '../services/vendorService';

const getGovernmentIdLabel = (country) => {
  switch (country) {
    case 'India': return 'Aadhaar Card';
    case 'United States': return 'State ID Card';
    case 'United Kingdom': return 'Driving Licence';
    case 'Canada': return 'Provincial Photo ID Card';
    case 'Australia': return "Driver's License";
    case 'Singapore': return 'NRIC (National Registration Identity Card)';
    default: return 'Government Issued Photo ID';
  }
};

const getBusinessDocumentLabel = (country) => {
  switch (country) {
    case 'United States': return 'IRS EIN Confirmation Letter (CP 575)';
    case 'United Kingdom': return 'Certificate of Incorporation';
    case 'Canada': return 'CRA Business Number (BN) Document';
    case 'Australia': return 'ASIC Certificate of Registration';
    case 'Singapore': return 'ACRA BizFile Printout';
    default: return 'Business Registration Certificate';
  }
};

const VendorRegister = () => {
  const navigate = useNavigate();
  const { register: registerVendor, isLoading } = useVendorAuthStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vendorType: 'Individual',
    vendorCountry: '',
    storeName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    businessName: '',
    businessType: '',
    businessCountry: '',
    businessAddress: '',
  });
  const [kycDocument, setKycDocument] = useState(null);
  const [governmentIdDocument, setGovernmentIdDocument] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCountryChange = (e) => {
    const selectedName = e.target.value;
    const countryObj = COUNTRIES.find(c => c.name === selectedName);

    let currentPhoneNum = formData.phone || '';
    for (const c of COUNTRIES) {
      if (currentPhoneNum.startsWith(c.code)) {
        currentPhoneNum = currentPhoneNum.substring(c.code.length).trim();
        break;
      }
    }

    setFormData({
      ...formData,
      vendorCountry: selectedName,
      phone: countryObj ? `${countryObj.code} ${currentPhoneNum}`.trim() : currentPhoneNum
    });
  };

  const nextStep = async () => {
    // Validate Step 1
    if (!formData.vendorCountry) {
      toast.error('Please select a country');
      return;
    }
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all general information fields');
      return;
    }
    
    setIsValidating(true);
    try {
      await checkVendorAvailability({
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim()
      });
      setStep(2);
    } catch (err) {
      console.warn("Validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate Step 2
    if (!formData.storeName) {
      toast.error('Please enter your shop name');
      return;
    }

    if (formData.vendorType === 'Business' && (!formData.businessName || !formData.businessType || !formData.businessCountry || !formData.businessAddress)) {
      toast.error('Please fill in all business verification fields');
      return;
    }

    if (formData.vendorType === 'Business' && !kycDocument) {
      toast.error(`Please upload ${getBusinessDocumentLabel(formData.vendorCountry)}`);
      return;
    }

    if (!governmentIdDocument) {
      toast.error(`Please upload ${getGovernmentIdLabel(formData.vendorCountry)}`);
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in password fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('email', formData.email.trim().toLowerCase());
      submitData.append('password', formData.password);
      submitData.append('phone', formData.phone.trim());
      submitData.append('vendorType', formData.vendorType);
      submitData.append('vendorCountry', formData.vendorCountry);
      submitData.append('storeName', formData.storeName.trim());
      submitData.append('address', JSON.stringify(formData.address));
      
      if (formData.vendorType === 'Business') {
        submitData.append('businessName', formData.businessName.trim());
        submitData.append('businessType', formData.businessType.trim());
        submitData.append('kycDocumentType', getBusinessDocumentLabel(formData.vendorCountry));
        submitData.append('kycDocument', kycDocument);
      }
      submitData.append('governmentIdDocument', governmentIdDocument);

      const result = await registerVendor(submitData);
      toast.success(result.message || 'Registration successful!');
      navigate('/vendor/login');
    } catch (apiError) {
      console.warn("Backend error:", apiError);
      toast.error(apiError.response?.data?.message || apiError.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-green">
            <FiShoppingBag className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Become a Vendor</h1>
          <p className="text-gray-600">Step {step} of 2: {step === 1 ? 'General Information' : 'Business & Documents'}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }}></div>
        </div>

        <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Vendor Country */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Country</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                    <select
                      name="vendorCountry"
                      value={formData.vendorCountry}
                      onChange={handleCountryChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                      required
                    >
                      <option value="" disabled>Select Country</option>
                      {COUNTRIES.map((country, idx) => (
                        <option key={idx} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <SearchablePhoneInput
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="1234567890"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isValidating}
                    className="flex items-center gap-2 gradient-green text-white px-8 py-3 rounded-xl font-semibold hover:shadow-glow-green transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidating ? 'Checking...' : 'Next Step'} <FiArrowRight />
                  </button>
                </div>
                
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/vendor/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                      Login
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Vendor Type */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendor Type</h3>
                  <div className="flex gap-6 h-[52px] items-center px-4 bg-white border-2 border-gray-200 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vendorType"
                        value="Individual"
                        checked={formData.vendorType === 'Individual'}
                        onChange={handleChange}
                        className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="text-gray-700 font-medium">Individual</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vendorType"
                        value="Business"
                        checked={formData.vendorType === 'Business'}
                        onChange={handleChange}
                        className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="text-gray-700 font-medium">Business</span>
                    </label>
                  </div>
                </div>

                {/* Shop Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Shop Details</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Shop Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiShoppingBag className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleChange}
                        placeholder="My Awesome Shop"
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Shop Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Street Address
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleChange}
                          placeholder="123 Main Street"
                          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                        placeholder="New York"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleChange}
                        placeholder="NY"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        placeholder="10001"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleChange}
                        placeholder="USA"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Specific Verification Details */}
                {formData.vendorType === 'Business' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Legal Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          placeholder="Business Name"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                          required={formData.vendorType === 'Business'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                          required={formData.vendorType === 'Business'}
                        >
                          <option value="" disabled>Select Type</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Corporation">Corporation</option>
                          <option value="LLC">LLC</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Country <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="businessCountry"
                          value={formData.businessCountry}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                          required={formData.vendorType === 'Business'}
                        >
                          <option value="" disabled>Select Country</option>
                          <option value="USA">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="UK">United Kingdom</option>
                          <option value="India">India</option>
                          <option value="Australia">Australia</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="businessAddress"
                          value={formData.businessAddress}
                          onChange={handleChange}
                          placeholder="Registered Address"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                          required={formData.vendorType === 'Business'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Verification Documents</h3>
                  <div className="space-y-4">
                    {/* Primary Government ID (For both Individual and Business) */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {getGovernmentIdLabel(formData.vendorCountry)} <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-3">Please upload a clear copy of your primary government photo ID for {formData.vendorCountry}.</p>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setGovernmentIdDocument(e.target.files[0])}
                        className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        required
                      />
                    </div>

                    {/* Business Document (For Business Only) */}
                    {formData.vendorType === 'Business' && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {getBusinessDocumentLabel(formData.vendorCountry)} <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-3">Please upload the official business document required for {formData.vendorCountry}.</p>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => setKycDocument(e.target.files[0])}
                          className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                          required={formData.vendorType === 'Business'}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Minimum 6 characters"
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

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter password"
                          className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 placeholder:text-gray-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    <FiArrowLeft /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] gradient-green text-white py-3 rounded-xl font-semibold hover:shadow-glow-green transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Registering...' : 'Register as Vendor'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
};

export default VendorRegister;

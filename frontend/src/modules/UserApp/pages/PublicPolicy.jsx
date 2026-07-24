import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiFileText, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

const policyData = {
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your personal data',
    icon: FiShield,
    lastUpdated: 'July 2026',
    sections: [
      {
        heading: '1. Information We Collect',
        content:
          'We collect information that you provide directly to us when you create an account, place an order, subscribe to our newsletter, or communicate with customer support. This includes your name, email address, phone number, shipping address, and payment details.'
      },
      {
        heading: '2. How We Use Your Information',
        content:
          'We use your information to fulfill your orders, process payments, provide customer service, send order updates and promotional communications, improve our website services, and maintain platform security.'
      },
      {
        heading: '3. Information Sharing & Security',
        content:
          'We do not sell, trade, or rent your personal information to third parties. We share data only with trusted service providers (e.g. payment processors, delivery partners) required to fulfill your orders under strict confidentiality standard.'
      },
      {
        heading: '4. Cookies & Tracking',
        content:
          'We use essential cookies to keep track of your shopping cart, remember your preferences, and analyze site traffic to deliver a seamless shopping experience.'
      },
      {
        heading: '5. Your Rights & Choices',
        content:
          'You have full right to access, update, or request deletion of your personal data at any time through your account settings or by contacting our support team.'
      }
    ]
  },
  refund: {
    title: 'Refund & Return Policy',
    subtitle: 'Clear and simple guidelines for returns and refunds',
    icon: FiRefreshCw,
    lastUpdated: 'July 2026',
    sections: [
      {
        heading: '1. Return Eligibility',
        content:
          'Items are eligible for return within 30 days of delivery. To be eligible, the item must be unused, in its original packaging, and with all tags attached.'
      },
      {
        heading: '2. How to Request a Return',
        content:
          'Initiate a return directly from your Order History page or contact our customer care. Once approved, you will receive instructions and a return shipping label.'
      },
      {
        heading: '3. Non-Refundable Items',
        content:
          'Perishable goods, personalized items, hygiene-sensitive items (unless unopened), and digital downloadable products cannot be returned unless defective upon arrival.'
      },
      {
        heading: '4. Processing & Refunds',
        content:
          'Once we receive and inspect your returned item, your refund will be processed within 5-7 business days back to your original payment method.'
      }
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Rules and terms governing the use of SikhStreet platform',
    icon: FiFileText,
    lastUpdated: 'July 2026',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        content:
          'By accessing or using SikhStreet website or mobile services, you agree to comply with and be bound by these Terms & Conditions.'
      },
      {
        heading: '2. User Accounts',
        content:
          'You are responsible for maintaining the confidentiality of your account password and for all activities conducted under your account.'
      },
      {
        heading: '3. Orders & Pricing',
        content:
          'All orders placed are subject to acceptance and product availability. We reserve the right to modify prices or cancel orders in case of typographical errors.'
      },
      {
        heading: '4. Intellectual Property',
        content:
          'All trademarks, logos, content, and design elements displayed on SikhStreet are the property of SikhStreet or its licensors and protected by applicable copyright laws.'
      },
      {
        heading: '5. Limitation of Liability',
        content:
          'SikhStreet shall not be liable for indirect, incidental, or consequential damages resulting from the use or inability to use our services.'
      }
    ]
  }
};

const PublicPolicy = ({ type = 'privacy' }) => {
  const location = useLocation();

  // Determine policy type based on prop or current pathname
  let activeType = type;
  const path = location.pathname.toLowerCase();
  if (path.includes('refund')) {
    activeType = 'refund';
  } else if (path.includes('terms')) {
    activeType = 'terms';
  } else if (path.includes('privacy')) {
    activeType = 'privacy';
  }

  const policy = policyData[activeType] || policyData.privacy;
  const Icon = policy.icon;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 mb-6 transition-colors"
        >
          <FiArrowLeft /> Back to Home
        </Link>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-2xl font-bold">
              <Icon />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{policy.title}</h1>
              <p className="text-sm text-slate-500 mt-1">Last updated: {policy.lastUpdated}</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{policy.subtitle}</p>

          {/* Quick tab switch between policies */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
            <Link
              to="/privacy-policy"
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                activeType === 'privacy'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Privacy Policy
            </Link>
            <Link
              to="/refund-policy"
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                activeType === 'refund'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Refund Policy
            </Link>
            <Link
              to="/terms-conditions"
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                activeType === 'terms'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Terms & Conditions
            </Link>
          </div>
        </motion.div>

        {/* Content Sections */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {policy.sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-3">{section.heading}</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{section.content}</p>
            </div>
          ))}
        </motion.div>

        {/* Contact Footer */}
        <div className="mt-10 p-6 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-center">
          <p className="text-xs text-slate-600">
            Have questions about our policies? Contact our support team at{' '}
            <a href="mailto:support@sikhstreet.com" className="font-bold text-amber-700 underline">
              support@sikhstreet.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicPolicy;

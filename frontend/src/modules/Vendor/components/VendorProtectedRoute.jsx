import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useVendorAuthStore } from '../store/vendorAuthStore';

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = window.atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const VendorProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, vendor, fetchProfile } = useVendorAuthStore();
  const location = useLocation();
  const accessToken = token || localStorage.getItem('vendor-token');
  const payload = decodeJwtPayload(accessToken);
  const role = String(payload?.role || '').toLowerCase();
  const tokenExpiryMs =
    typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  const isExpired = tokenExpiryMs ? Date.now() >= tokenExpiryMs : false;

  useEffect(() => {
    if (isAuthenticated && accessToken && !isExpired && role === 'vendor') {
      fetchProfile().catch((err) => {
        console.error('Failed to fetch vendor profile on route change:', err);
      });
    }
  }, [isAuthenticated, accessToken, isExpired, role, fetchProfile]);

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/vendor/login" state={{ from: location }} replace />;
  }

  if (isExpired) {
    localStorage.removeItem('vendor-token');
    localStorage.removeItem('vendor-refresh-token');
    localStorage.removeItem('vendor-auth-storage');
    return <Navigate to="/vendor/login" state={{ from: location }} replace />;
  }

  if (role && role !== 'vendor') {
    localStorage.removeItem('vendor-token');
    localStorage.removeItem('vendor-refresh-token');
    localStorage.removeItem('vendor-auth-storage');
    return <Navigate to="/vendor/login" state={{ from: location }} replace />;
  }

  // ─── Admin Approval Gate ───────────────────────────────────────────────────
  // Check vendor.status from store (populated after login or fetchProfile)
  if (vendor) {
    const vendorStatus = String(vendor.status || '').toLowerCase();

    // Pending: blocked from dashboard; show waiting page
    if (vendorStatus === 'pending') {
      // Allow access to the pending-approval info page itself to avoid a redirect loop
      if (location.pathname !== '/vendor/pending-approval') {
        return <Navigate to="/vendor/pending-approval" replace />;
      }
    }

    // Suspended: redirect to suspended page
    if (vendorStatus === 'suspended') {
      if (location.pathname !== '/vendor/suspended') {
        return <Navigate to="/vendor/suspended" replace />;
      }
    }

    // Rejected: redirect to rejected page (reuse suspended page with state)
    if (vendorStatus === 'rejected') {
      if (location.pathname !== '/vendor/suspended') {
        return <Navigate to="/vendor/suspended" state={{ rejected: true, reason: vendor.suspensionReason }} replace />;
      }
    }
  }

  // Onboarding enforcement
  const isOnboardingPath = location.pathname === '/vendor/onboarding';
  if (isOnboardingPath) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  // Prevent accessing selling functionality routes if not onboarded
  if (vendor && !vendor.isOnboarded) {
    const isSellingRoute = 
      location.pathname.startsWith('/vendor/products') || 
      location.pathname === '/vendor/stock-management' ||
      location.pathname === '/vendor/promotions';

    if (isSellingRoute) {
      return <Navigate to="/vendor/dashboard" state={{ onboardingWarning: true }} replace />;
    }
  }

  return children;
};

export default VendorProtectedRoute;


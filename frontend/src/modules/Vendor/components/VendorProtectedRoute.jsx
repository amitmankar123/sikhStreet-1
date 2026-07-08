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

  // Onboarding enforcement
  const isOnboardingPath = location.pathname === '/vendor/onboarding';
  if (!vendor?.isOnboarded) {
    if (!isOnboardingPath) {
      return <Navigate to="/vendor/onboarding" replace />;
    }
  } else {
    if (isOnboardingPath) {
      return <Navigate to="/vendor/dashboard" replace />;
    }
  }

  return children;
};

export default VendorProtectedRoute;

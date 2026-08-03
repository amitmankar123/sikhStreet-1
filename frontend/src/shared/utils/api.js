import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from './constants';
import { categories as mockCategories } from '../../data/categories';
import { products as mockProducts } from '../../data/products';
import { brands as mockBrands } from '../../data/brands';
import { vendors as mockVendors } from '../../data/vendors';

const AUTH_SCOPES = {
  admin: {
    prefix: '/admin',
    accessKey: 'adminToken',
    refreshKey: 'adminRefreshToken',
    persistKey: 'admin-auth-storage',
    loginPath: '/admin/login',
    areaPrefix: '/admin',
  },
  vendor: {
    prefix: '/vendor',
    accessKey: 'vendor-token',
    refreshKey: 'vendor-refresh-token',
    persistKey: 'vendor-auth-storage',
    loginPath: '/vendor/login',
    areaPrefix: '/vendor',
  },
  delivery: {
    prefix: '/delivery',
    accessKey: 'delivery-token',
    refreshKey: 'delivery-refresh-token',
    persistKey: 'delivery-auth-storage',
    loginPath: '/delivery/login',
    areaPrefix: '/delivery',
  },
  user: {
    prefix: '/user',
    accessKey: 'token',
    refreshKey: 'refresh-token',
    persistKey: 'auth-storage',
    loginPath: '/login',
    areaPrefix: '/',
  },
};

const EXCLUDED_AUTH_SUFFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/verify-reset-otp',
  '/auth/reset-password',
  '/auth/refresh',
  '/auth/logout',
];

const refreshInFlight = {
  admin: null,
  vendor: null,
  delivery: null,
  user: null,
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
// Interceptor to serve mock data locally and prevent ERR_CONNECTION_REFUSED in console
api.interceptors.request.use((config) => {
  const url = config.url || '';

  if (url.includes('/categories')) {
    return Promise.reject({
      config,
      isMockResponse: true,
      mockData: { data: mockCategories }
    });
  }
  if (url.includes('/brands')) {
    return Promise.reject({
      config,
      isMockResponse: true,
      mockData: { data: mockBrands }
    });
  }
  if (url.includes('/products')) {
    let filteredProducts = mockProducts;
    try {
      const urlObj = new URL(url, 'http://localhost');
      const brandParam = urlObj.searchParams.get('brand');
      if (brandParam) {
        filteredProducts = mockProducts.filter(p =>
          String(p.brandId).toLowerCase() === brandParam.toLowerCase() ||
          String(p.brandName).toLowerCase() === brandParam.toLowerCase()
        );
      }
    } catch (e) {
      if (url.includes('brand=')) {
        const match = url.match(/brand=([^&]+)/);
        if (match && match[1]) {
          const brandVal = decodeURIComponent(match[1]).toLowerCase();
          filteredProducts = mockProducts.filter(p =>
            String(p.brandId).toLowerCase() === brandVal ||
            String(p.brandName).toLowerCase() === brandVal
          );
        }
      }
    }
    return Promise.reject({
      config,
      isMockResponse: true,
      mockData: { data: filteredProducts }
    });
  }
  if (url.includes('/vendors')) {
    return Promise.reject({
      config,
      isMockResponse: true,
      mockData: { data: mockVendors }
    });
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});
*/

const AUTH_REDIRECT_LOCK_KEY = 'auth-redirect-lock';
const AUTH_REDIRECT_LOCK_MS = 1500;

const redirectTo = (path) => {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const currentPath = window.location.pathname;
  const lockUntil = Number(sessionStorage.getItem(AUTH_REDIRECT_LOCK_KEY) || 0);

  if (currentPath === path) return;
  if (now < lockUntil) return;

  sessionStorage.setItem(AUTH_REDIRECT_LOCK_KEY, String(now + AUTH_REDIRECT_LOCK_MS));
  window.location.href = path;
};

const getScopeFromUrl = (url = '') => {
  if (url.startsWith('/admin')) return 'admin';
  if (url.startsWith('/vendor')) return 'vendor';
  if (url.startsWith('/delivery')) return 'delivery';
  return 'user';
};

const getScopeFromPath = (path = window.location.pathname) => {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/vendor')) return 'vendor';
  if (path.startsWith('/delivery')) return 'delivery';
  return 'user';
};

const isExcludedAuthRequest = (scope, url = '') => {
  const { prefix } = AUTH_SCOPES[scope];
  return EXCLUDED_AUTH_SUFFIXES.some((suffix) => url.startsWith(`${prefix}${suffix}`));
};

const clearScopeAuth = (scope) => {
  const config = AUTH_SCOPES[scope];
  localStorage.removeItem(config.accessKey);
  localStorage.removeItem(config.refreshKey);
  localStorage.removeItem(config.persistKey);
};

const shouldAttemptRefresh = (error, scope) => {
  if (error?.response?.status !== 401) return false;
  if (!scope || !AUTH_SCOPES[scope]) return false;

  const refreshToken = localStorage.getItem(AUTH_SCOPES[scope].refreshKey);
  if (!refreshToken) return false;

  const originalRequest = error.config || {};
  if (originalRequest._retry) return false;

  const url = originalRequest.url || '';
  if (isExcludedAuthRequest(scope, url)) return false;

  return true;
};

const runRefresh = async (scope) => {
  if (refreshInFlight[scope]) {
    return refreshInFlight[scope];
  }

  const config = AUTH_SCOPES[scope];
  const currentRefreshToken = localStorage.getItem(config.refreshKey);
  if (!currentRefreshToken) {
    throw new Error('No refresh token available.');
  }

  refreshInFlight[scope] = axios
    .post(`${API_BASE_URL}${config.prefix}/auth/refresh`, {
      refreshToken: currentRefreshToken,
    })
    .then((response) => {
      const payload = response?.data?.data || response?.data || {};
      const nextAccessToken = payload?.accessToken;
      const nextRefreshToken = payload?.refreshToken;
      if (!nextAccessToken || !nextRefreshToken) {
        throw new Error('Invalid refresh response from server.');
      }

      localStorage.setItem(config.accessKey, nextAccessToken);
      localStorage.setItem(config.refreshKey, nextRefreshToken);

      return nextAccessToken;
    })
    .finally(() => {
      refreshInFlight[scope] = null;
    });

  return refreshInFlight[scope];
};

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const scope = getScopeFromUrl(config.url || '');
    const token = localStorage.getItem(AUTH_SCOPES[scope].accessKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // Return the mock data if it was rejected with isMockResponse
    if (error && error.isMockResponse) {
      return Promise.resolve(error.mockData);
    }
    // If the backend is unreachable (no response),
    // return simulated e-commerce data so the application functions dynamically in client-only/static mode.
    if (error && !error.response) {
      const url = error?.config?.url || '';
      const method = String(error?.config?.method || '').toLowerCase();
      console.warn(`Backend connection failed or was unreachable for ${url}. Generating static fallback...`);

      let fallbackData = {};

      if (url.includes('/coupons/available')) {
        fallbackData = [
          { code: "WELCOME50", discount: 50, type: "flat", minPurchase: 200, description: "Flat $50 off on purchases above $200" },
          { code: "FREESHIP", discount: 100, type: "freeship", minPurchase: 500, description: "Free standard shipping on orders above $500" }
        ];
      } else if (url.includes('/coupons/validate')) {
        fallbackData = { success: true, discount: 50 };
      } else if (url.includes('/shipping/estimate')) {
        fallbackData = { success: true, shipping: 50 };
      } else if (url.includes('/user/orders/validate-stock')) {
        fallbackData = { success: true };
      } else if (url.includes('/user/orders')) {
        if (method === 'post') {
          let postData = {};
          try {
            postData = error.config.data ? JSON.parse(error.config.data) : {};
          } catch (e) {
            console.error("Failed to parse order POST data:", e);
          }

          const orderId = `ORD-${Date.now()}`;

          // Construct a full order object to persist locally
          const newOrder = {
            id: orderId,
            orderId: orderId,
            userId: postData.userId || 'mock-customer-1',
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            status: "pending",
            paymentMethod: postData.paymentMethod || "Cash on Delivery",
            shippingOption: postData.shippingOption || "standard",
            shippingAddress: postData.shippingAddress || {
              fullName: "Amit Singh",
              phone: "9876543210",
              address: "123, Heritage Lane, near Golden Temple",
              city: "Amritsar",
              state: "Punjab",
              zipCode: "143001",
              country: "India"
            },
            items: (postData.items || []).map(item => {
              const prod = mockProducts.find(p => String(p.id) === String(item.productId));
              return {
                id: item.productId,
                name: prod ? prod.name : "Product Item",
                price: Number(item.price || (prod ? prod.price : 100)),
                quantity: Number(item.quantity || 1),
                image: prod ? prod.image : "",
                variant: item.variant
              };
            }),
            // Calculate totals
            subtotal: (postData.items || []).reduce((sum, item) => {
              const prod = mockProducts.find(p => String(p.id) === String(item.productId));
              return sum + (Number(item.price || (prod ? prod.price : 100)) * Number(item.quantity || 1));
            }, 0),
            discount: postData.couponCode ? 50 : 0,
            shipping: postData.shippingOption === 'express' ? 150 : 50,
            tax: 15,
            vendorItems: []
          };
          newOrder.total = Math.max(0, newOrder.subtotal + newOrder.shipping + newOrder.tax - newOrder.discount);

          // Build vendorGroups from items
          const vendorMap = {};
          newOrder.items.forEach(item => {
            const prod = mockProducts.find(p => String(p.id) === String(item.id));
            const vId = prod ? String(prod.vendorId || prod.brandId || "turban-king") : "turban-king";
            const vName = prod ? (prod.vendorName || prod.brandName || "Turban King") : "Turban King";
            if (!vendorMap[vId]) {
              vendorMap[vId] = {
                vendorId: vId,
                vendorName: vName,
                items: []
              };
            }
            vendorMap[vId].items.push(item);
          });
          newOrder.vendorItems = Object.values(vendorMap);

          // Save to localStorage so GET /user/orders/:id can retrieve it
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`mock_order_${orderId}`, JSON.stringify(newOrder));
              // Also add to mock orders list
              const existingList = JSON.parse(localStorage.getItem('mock_orders_list') || '[]');
              localStorage.setItem('mock_orders_list', JSON.stringify([newOrder, ...existingList]));
            } catch (storageErr) {
              console.error("Failed to save mock order:", storageErr);
            }
          }

          fallbackData = { success: true, orderId };
        } else {
          // GET requests
          const pathParts = url.split('?')[0].split('/');
          const lastPart = pathParts[pathParts.length - 1];

          if (lastPart && lastPart !== 'orders') {
            // GET single order by ID
            let foundOrder = null;
            if (typeof window !== 'undefined') {
              try {
                const saved = localStorage.getItem(`mock_order_${lastPart}`);
                if (saved) {
                  foundOrder = JSON.parse(saved);
                }
              } catch (storageErr) {
                console.error("Failed to read mock order:", storageErr);
              }
            }

            if (!foundOrder) {
              // Fallback to a generic mock order if not found in localStorage
              foundOrder = {
                id: lastPart,
                orderId: lastPart,
                userId: 'mock-customer-1',
                date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                status: "pending",
                paymentMethod: "Cash on Delivery",
                shippingOption: "standard",
                shippingAddress: {
                  fullName: "Amit Singh",
                  phone: "9876543210",
                  address: "123, Heritage Lane, near Golden Temple",
                  city: "Amritsar",
                  state: "Punjab",
                  zipCode: "143001",
                  country: "India"
                },
                items: [
                  {
                    id: "302",
                    name: "Premium Royal Blue Turban",
                    price: 45,
                    quantity: 1,
                    image: "/images/products/turban1.jpg"
                  }
                ],
                subtotal: 45,
                discount: 0,
                shipping: 50,
                tax: 5,
                total: 100,
                vendorItems: [
                  {
                    vendorId: "turban-king",
                    vendorName: "Turban King",
                    items: [
                      {
                        id: "302",
                        name: "Premium Royal Blue Turban",
                        price: 45,
                        quantity: 1,
                        image: "/images/products/turban1.jpg"
                      }
                    ]
                  }
                ]
              };
            }
            fallbackData = foundOrder;
          } else {
            // GET list of all orders
            let list = [];
            if (typeof window !== 'undefined') {
              try {
                list = JSON.parse(localStorage.getItem('mock_orders_list') || '[]');
              } catch (storageErr) {
                console.error("Failed to read mock orders list:", storageErr);
              }
            }
            if (list.length === 0) {
              list = [
                {
                  id: "ORD-987654321",
                  userId: "mock-customer-1",
                  date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                  status: "Delivered",
                  total: 75.0,
                  paymentMethod: "Card Payment",
                  shippingAddress: {
                    fullName: "Amit Singh",
                    phone: "9876543210",
                    address: "123, Heritage Lane, near Golden Temple",
                    city: "Amritsar",
                    state: "Punjab",
                    zipCode: "143001",
                    country: "India"
                  },
                  items: [
                    {
                      id: "302",
                      name: "Premium Royal Blue Turban",
                      price: 45,
                      quantity: 1,
                    }
                  ],
                  vendorItems: []
                }
              ];
            }
            fallbackData = { orders: list, total: list.length, page: 1, pages: 1 };
          }
        }
      } else if (url.includes('/user/addresses')) {
        if (method === 'post') {
          try {
            fallbackData = { success: true, address: error?.config?.data ? JSON.parse(error.config.data) : {} };
          } catch {
            fallbackData = { success: true, address: {} };
          }
        } else {
          fallbackData = [
            {
              id: "mock-address-1",
              name: "Home",
              fullName: "Amit Singh",
              phone: "9876543210",
              address: "123, Heritage Lane, near Golden Temple",
              city: "Amritsar",
              state: "Punjab",
              zipCode: "143001",
              country: "India",
              isDefault: true,
              createdAt: new Date().toISOString()
            }
          ];
        }
      } else if (url.includes('/uploads/images')) {
        fallbackData = [
          { url: 'https://placehold.co/600x400?text=Mock+Uploaded+Image+1', publicId: 'mock-id-1' },
          { url: 'https://placehold.co/600x400?text=Mock+Uploaded+Image+2', publicId: 'mock-id-2' }
        ];
      } else if (url.includes('/uploads/image') || url.includes('/uploads/variants')) {
        fallbackData = { url: 'https://placehold.co/600x400?text=Mock+Uploaded+Image', publicId: 'mock-id' };
      } else if (url.includes('/uploads/video')) {
        fallbackData = { url: 'https://www.w3schools.com/html/mov_bbb.mp4', publicId: 'mock-video-id' };
      } else if (url.includes('/uploads/digital-file') || url.includes('/uploads/file')) {
        fallbackData = { url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', publicId: 'mock-file-id' };
      } else {
        return Promise.reject(error);
      }

      return Promise.resolve(fallbackData);
    }

    const originalRequest = error.config || {};
    const scope = getScopeFromUrl(originalRequest.url || '');
    const currentPath = window.location.pathname;
    const pathScope = getScopeFromPath(currentPath);

    if (shouldAttemptRefresh(error, scope)) {
      try {
        const nextAccessToken = await runRefresh(scope);
        originalRequest._retry = true;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      } catch {
        // fallback to existing session-expired handling below
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    const url = originalRequest.url || '';
    const isAuthRequest = EXCLUDED_AUTH_SUFFIXES.some((suffix) => url.includes(suffix));

    const isOrdersSection = typeof window !== 'undefined' && window.location.pathname.includes('/orders');

    if (message && typeof message === 'string' && message.includes('Route not found')) {
      console.error(message);
    } else if (!isAuthRequest && !originalRequest.skipToast && !isOrdersSection) {
      toast.error(message);
    }

    if (error.response?.status === 401) {
      const activeScope = pathScope;
      clearScopeAuth(scope);
      if (scope !== activeScope) {
        return Promise.reject(error);
      }

      const routeConfig = AUTH_SCOPES[scope];
      if (scope === 'user') {
        const isAuthPage =
          currentPath === '/login' ||
          currentPath === '/register' ||
          currentPath === '/verification' ||
          currentPath === '/forgot-password' ||
          currentPath === '/reset-password';
        if (!isAuthPage) {
          redirectTo(routeConfig.loginPath);
        }
      } else if (currentPath.startsWith(routeConfig.areaPrefix) && currentPath !== routeConfig.loginPath) {
        toast.error('Session expired. Please login again.');
        redirectTo(routeConfig.loginPath);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

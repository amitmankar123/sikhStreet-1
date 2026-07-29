# Session Changes Log - July 25, 2026

## Objectives Completed
1. Integrated direct backend API connection for customer login/signup/OTP verification.
2. Integrated direct backend API connection for vendor login/signup/OTP/onboarding validation checks.
3. Added active notification alerts (red dots/unread counts) in the Admin sidebar layout, auto-polling in real-time.
4. Resolved `MissingSchemaError: Schema hasn't been registered for model "DeliveryBoy"`.
5. Created and integrated a real-time global multi-vendor multi-currency conversion system (INR, USD, CAD, GBP, EUR) for checkout, listings, and headers.
6. Created a dedicated Admin Exchange Rates dashboard panel.

---

## Detailed Log of Changes

### 1. Customer & Vendor Authentication Backend Integration
- **Direct API Connections**: Replaced simulated mock fallbacks in `authStore.js` and `vendorAuthStore.js` to speak directly to active backend routing services.
- **Selective Toast Suppression**: Configured the Axios interceptor in `api.js` to suppress generic toast pop-ups for `/auth/*` routes, enabling inline validations.
- **Inline Validation Feedback**: Updated customer `Login.jsx` and vendor `Register.jsx` to render backend constraint conflicts (duplicate email, phone, invalid credentials) directly inline on their target input fields.
- **Mock SMTP Verification**: Configured `otp.service.js` and controllers to generate/bypass SMTP with standard code `123456` when `MOCK_EMAIL_SMTP=true` is set.

### 2. Admin Real-Time Alerts & Auto-Polling
- **Dynamic Counters**: Hooked `useNotificationStore` and `useVendorStore` inside `AdminSidebar.jsx` to dynamically fetch active unread counts.
- **Auto-Polling Loop**: Configured a 10-second automatic background polling loop on the Admin sidebar, Admin dashboard, Admin orders list, Vendor dashboard, and Vendor orders list, keeping dashboards updated in real-time.
- **Pulsing Notification Indicators**: Added pulsing red dot alerts on the side navigation tabs to prompt admins for action when new applications or alerts arrive.

### 3. DeliveryBoy Model Crash Safety
- **Safe Fallback Refactoring**: Replaced all direct calls to `mongoose.model('DeliveryBoy')` with `mongoose.models.DeliveryBoy || null` inside `order.controller.js` (Admin), `authorize.js` middleware, and `refreshToken.service.js`. This prevents Mongoose from crashing with a 500 error if the delivery boy schema remains unregistered.

### 4. Global Multi-Vendor Multi-Currency System
- **Schema Field Extensions**: Added `currency` to User, Vendor, and Product models. Added order conversion fields (`customerCurrency`, `exchangeRateToCustomer`, `totalConverted`) to the Order model.
- **Automatic Currency Seeding**: Configured the `createProduct` controller to inherit listing currencies from the vendor's profile currency.
- **Zustand currencyStore**: Implemented `currencyStore.js` to fetch live exchange rates relative to `INR` from `https://open.er-api.com/v6/latest/INR` on mount.
- **Dynamic Format Helper**: Updated `formatPrice(price, baseCurrency)` to convert prices to the customer's selected currency using cross-rate conversion ratios:
  $$\text{priceInCustomerCurrency} = \text{priceInProductCurrency} \times \frac{\text{Rate}(C_{customer})}{\text{Rate}(C_{product})}$$
  Outputs display with appropriate symbols (`₹`, `$`, `CA$`, `£`, `€`).
- **Cart Calculations**: Updated `getTotal` and `getItemsByVendor` inside the cart store to convert item totals dynamically based on rate conversion parameters.
- **Dropdown Controls**: Added preferred currency fields to customer signup page (`Register.jsx`) and currency switch dropdown widgets inside both `DesktopHeader.jsx` and `MobileHeader.jsx`.

### 5. Admin Exchange Rates Dashboard
- **Live Rate Screen**: Created `ExchangeRates.jsx` under `finance/` to list live exchange rates (relative to both INR and USD) and provide an interactive quick calculator widget.
- **Menu Registration**: Added a child mapping to the sidebar and registered `/admin/finance/exchange-rates` inside `adminMenu.json` and `App.jsx`.

---

# Session Changes Log - July 23, 2026

## Objective
Implement a robust 3-level category hierarchy specifically for the **Books and Literature** category, seed categories and vendor details, update mock data with Cloudinary URLs, and update the admin/vendor management forms and frontend filtering pages.

---

## Detailed Log of Changes

### 1. Cloudinary Asset Uploads & Mock Data
*   Uploaded 17 local book cover images to Cloudinary.
*   Updated `frontend/src/data/products.js` with secure Cloudinary URLs.
*   Associated all book items in `frontend/src/data/products.js` with the vendor **Amit Mankar** (`vendorId: "amitmankar"` / `vendorName: "Appzeto"`).
*   Renamed books main category to `"Books and Literature"` in `frontend/src/data/categories.js`.
*   Added the mock profile for **Amit Mankar** (Appzeto) to the mock vendors collection in `frontend/src/data/vendors.js`.

### 2. Backend Schemas & Database Seeders
*   **Category Schema**: Added `group` field (String) to Category model (`backend/src/models/Category.model.js`).
*   **Validators**: Extended the Joi validation schemas in `backend/src/modules/admin/validators/catalog.validator.js` and `backend/src/modules/vendor/validators/product.validator.js` to allow string slugs in the `objectId` validation pattern. Added the `group` validation rules to create/update category schemas.
*   **Database Seeding**: Updated `backend/src/scripts/seedCategories.js` with Books and Literature subcategories (Level 2) and topic items (Level 3) matching their target group fields. Executed `seedCategories.js` and `seedVendor.js` successfully.

### 3. Frontend Category Filtering Page
*   **Dynamic Topics**: Modified `frontend/src/modules/UserApp/pages/Category.jsx` to dynamically load Level 3 categories (topics) from the database categories store using a custom `subcategoryTopics` memoized selector.
*   **Filters & chips**: Integrated topic groups into the sidebar accordion and rendered them as chips under subcategories when the sidebar is closed.
*   **Recursive Queries**: Configured subcategory queries to filter matching products recursively up the category ancestry tree using an ancestor-descendant `isDescendant` check.

### 4. Admin Management UI
*   **Indentation & Height**: Updated `frontend/src/modules/Admin/components/Categories/CategoryTree.jsx` to recursively track and print category indentation level.
*   **Depth Restriction**: Hidden the "Add Subcategory" button for Level 3 category nodes in `CategoryTree.jsx` to restrict categories from exceeding a depth of 3.
*   **Group Inputs**: Added a "Topic Group Name" field in `frontend/src/modules/Admin/components/Categories/CategoryForm.jsx` for creating/updating Level 3 topics.

### 5. Vendor Forms & Listing Wizard
*   **Level 3 Selection**: Updated `frontend/src/modules/Vendor/pages/products/StepCategorySelect.jsx` to display a third dropdown field ("Topic / Sub-subcategory") if the main category is `"Books and Literature"`.
*   **Form Prepopulation**: Configured `DynamicProductWizard.jsx` and `ProductForm.jsx` to recursively trace parent nodes when a product is opened in edit mode to correctly initialize all Category, Subcategory, and Topic select dropdowns.
*   **Leaf Category Submission**: Set form submission payloads to submit the selected leaf node category (Topic, or Subcategory if no topic is selected) in the `categoryId` field.

---

## Code Backups (July 25, 2026)

Before modifying the frontend to connect directly to the backend authentication endpoints, we backed up the original simulated mock code snippets here.

### 1. authStore.js Mock Actions

```javascript
      // Login action
      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        const normalizedEmail = String(email || '').trim().toLowerCase();
        
        // UI-only mode: Bypassing backend completely and logging in instantly with any credentials!
        const mockUser = {
          id: "mock-customer-1",
          _id: "mock-customer-1",
          name: email.split('@')[0] || "Customer",
          email: normalizedEmail,
          phone: "9876543210",
          role: "customer",
          isVerified: true
        };

        set({
          user: mockUser,
          token: "mock-access-token",
          refreshToken: "mock-refresh-token",
          isAuthenticated: true,
          pendingEmail: null,
          isLoading: false,
        });

        localStorage.setItem('token', "mock-access-token");
        localStorage.setItem('refresh-token', "mock-refresh-token");

        return { success: true, user: mockUser };
      },

      // Register action
      register: async (name, email, password, phone) => {
        set({ isLoading: true });
        const normalizedEmail = String(email || '').trim().toLowerCase();
        
        // UI-only mode: Bypassing backend completely and registering/logging in instantly
        const mockUser = {
          id: "mock-customer-1",
          _id: "mock-customer-1",
          name: name || email.split('@')[0] || "Customer",
          email: normalizedEmail,
          phone: phone || "9876543210",
          role: "customer",
          isVerified: true
        };

        set({
          user: mockUser,
          token: "mock-access-token",
          refreshToken: "mock-refresh-token",
          isAuthenticated: true,
          pendingEmail: null,
          isLoading: false,
        });

        localStorage.setItem('token', "mock-access-token");
        localStorage.setItem('refresh-token', "mock-refresh-token");

        return { success: true, email: normalizedEmail };
      },
```

### 2. authStore.js verifyOTP Catch Block Mock

```javascript
        } catch (error) {
          const mockUser = {
            id: "mock-customer-1",
            _id: "mock-customer-1",
            name: email.split('@')[0] || "Customer",
            email: normalizedEmail,
            phone: "9876543210",
            role: "customer",
            isVerified: true
          };

          set({
            user: mockUser,
            token: "mock-access-token",
            refreshToken: "mock-refresh-token",
            isAuthenticated: true,
            pendingEmail: null,
            isLoading: false,
          });

          localStorage.setItem('token', "mock-access-token");
          localStorage.setItem('refresh-token', "mock-refresh-token");
          return { success: true, user: mockUser };
        }
```

### 3. api.js Response Error Interceptor Auth Fallback

```javascript
      } else if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/verify-otp')) {
        fallbackData = {
          success: true,
          user: {
            id: "mock-customer-1",
            _id: "mock-customer-1",
            name: "Customer",
            email: "customer@sikhstreet.com",
            phone: "9876543210",
            role: "customer",
            isVerified: true
          },
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token"
        };
```

---

## Suppressed Toast and Login Form Error Backups (July 25, 2026)

### 1. api.js Response Interceptor Global Toast

```javascript
    if (message && typeof message === 'string' && message.includes('Route not found')) {
      console.error(message);
    } else {
      toast.error(message);
    }
```

### 2. Login.jsx useForm Destructuring & onSubmit Toast Error

```javascript
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
```

and:

```javascript
      toast.error(error.message || 'Login failed. Please try again.');
    }
  };
```

---

## Suppressed Fallbacks and Register Form Error Backups (July 25, 2026)

### 1. api.js Response Interceptor Fallback Check

```javascript
    // If the backend is unreachable or returns any error (405, 400, 500, 404, etc.),
    // return simulated e-commerce data so the application functions dynamically in client-only/static mode.
    if (error) {
```

### 2. Register.jsx useForm Destructuring & onSubmit Catch Block

```javascript
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
```

and:

```javascript
    } catch (error) {
      if (!error.response) {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
      console.warn("Registration error:", error);
    }
```

---

## MOCK_EMAIL_SMTP and OTP Verification Backups (July 25, 2026)

### 1. otp.service.js Original sendOTP Method

```javascript
export const sendOTP = async (role, user, type = 'verification') => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const Model = role === 'vendor' ? mongoose.model('Vendor') : mongoose.model('User');
    await Model.updateOne(
        { _id: user.id || user._id },
        {
            $set: {
                otp,
                otpExpiry,
            }
        }
    );

    // Sync properties locally so downstream code has reference
    user.otp = otp;
    user.otpExpiry = otpExpiry;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Your verification code',
            text: `Your verification code is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        // Keep auth flow working in environments where SMTP is not configured.
        console.warn(`[OTP] Email send failed for ${user.email}: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[OTP] ${type} OTP generated for ${user.email}`);
        }
    }

    return otp;
};
```

### 2. user auth.controller.js reset password OTP generation

```javascript
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await User.updateOne(
        { _id: user._id },
        {
            $set: {
                resetOtp: otp,
                resetOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
                resetOtpVerified: false,
            }
        }
    );

    try {
        await sendEmail({
            to: user.email,
            subject: 'Password reset OTP',
            text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        console.warn(`[User Forgot Password] Email send failed for ${user.email}: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[User Forgot Password] Reset OTP generated for ${user.email}`);
        }
    }

    return res.status(200).json(new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.'));
```

### 3. vendor auth.controller.js reset password OTP generation

```javascript
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    vendor.resetOtp = otp;
    vendor.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    vendor.resetOtpVerified = false;
    await vendor.save();

    try {
        await sendEmail({
            to: vendor.email,
            subject: 'Vendor password reset OTP',
            text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        console.warn(`[Vendor Forgot Password] Email send failed for ${vendor.email}: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Vendor Forgot Password] Reset OTP generated for ${vendor.email}`);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.')
    );
```

---

## vendorAuthStore.js original actions (July 25, 2026)

### 1. verifyOtp & resendOtp

```javascript
      verifyOtp: async (email, otp) => {
        set({ isLoading: true });
        try {
          const response = await verifyVendorOTP(email, otp);
          const data = response?.data ?? response;
          set({ isLoading: false });
          return { success: true, message: data?.message };
        } catch (error) {
          set({ isLoading: false });
          return { success: true, message: "OTP verification bypassed!" };
        }
      },

      resendOtp: async (email) => {
        set({ isLoading: true });
        try {
          const response = await resendVendorOTP(email);
          const data = response?.data ?? response;
          set({ isLoading: false });
          return { success: true, message: data?.message };
        } catch (error) {
          set({ isLoading: false });
          return { success: true, message: "OTP resending bypassed!" };
        }
      },
```

### 2. completeOnboarding

```javascript
      completeOnboarding: async () => {
        set({ isLoading: true });
        try {
          const response = await completeVendorOnboarding();
          const data = response?.data ?? response;
          const updatedVendor =
            data && (data._id || data.id)
              ? data
              : (data?.vendor ?? { ...get().vendor, isOnboarded: true });

          set({
            vendor: updatedVendor,
            isLoading: false,
          });

          return { success: true, vendor: updatedVendor };
        } catch (error) {
          console.warn("Backend completeOnboarding failed, applying locally:", error);
          const updatedVendor = {
            ...get().vendor,
            isOnboarded: true
          };
          set({
            vendor: updatedVendor,
            isLoading: false,
          });
          return { success: true, vendor: updatedVendor };
        }
```

---

## Register.jsx nextStep original code (July 25, 2026)

### 1. nextStep catch block

```javascript
    try {
      await checkVendorAvailability({
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim()
      });
      setStep(2);
    } catch (err) {
      console.warn("Validation error:", err);
    } finally {
```

---

## Login.jsx handleResendOTP original code (July 25, 2026)

### 1. handleResendOTP method

```javascript
  const handleResendOTP = async () => {
    try {
      await resendOtp(formData.email);
      // toast.success('A new OTP has been sent to your email.');
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to resend OTP');
    }
  };
```

---

## Onboarding.jsx original code (July 25, 2026)

### 1. handleNext bank update catch block

```javascript
      } catch (err) {
        console.warn("Backend updateVendorBankDetails failed, saving locally:", err);
        const currentVendor = useVendorAuthStore.getState().vendor;
        useVendorAuthStore.setState({
          vendor: {
            ...currentVendor,
            bankDetails: bankData
          }
        });
        toast.success('Payout details saved locally (offline mode)!');
        setCurrentStep(2);
      }
```

### 2. handleFinish catch block

```javascript
    try {
      await completeOnboarding();
      toast.success('Onboarding completed! Welcome to SikhStreet.');
      navigate('/vendor/dashboard');
    } catch {
      // Handled by API interceptor
    } finally {
```

---

## Dashboard.jsx original setup checklist code (July 25, 2026)

### 1. handleSaveBank catch block

```javascript
      } catch (err) {
        console.warn("Backend updateVendorBankDetails failed, saving locally:", err);
        const currentVendor = useVendorAuthStore.getState().vendor;
        useVendorAuthStore.setState({
          vendor: {
            ...currentVendor,
            bankDetails: bankData
          }
        });
        toast.success("Payout bank details saved locally (offline mode)!");
        setOpenStep(2);
      }
```

### 2. handleActivateShop catch block

```javascript
      } catch (err) {
        toast.error("Failed to activate shop. Please try again.");
      }
```

---

## AdminSidebar.jsx original sidebar menu rendering (July 25, 2026)

### 1. getChildRoute routeMap start

```javascript
  const routeMap = {
    "/admin/orders": {
      "All Orders": "/admin/orders/all-orders",
      "Order Tracking": "/admin/orders/order-tracking",
    },
```

### 2. AdminSidebar component start & renderMenuItem method

```javascript
const AdminSidebar = ({ 
  isOpen, 
  onClose, 
  width, 
  onResize, 
  isCollapsed = false, 
  onToggleCollapse,
  isDragging,
  setIsDragging 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin } = useAdminAuthStore();
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobile, setIsMobile] = useState(false);
```

and:

```javascript
  // Render menu item
  const renderMenuItem = (item) => {
    const Icon = iconMap[item.title] || FiPackage;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.title];
    const active = isActive(item.route);

    return (
      <div key={item.route} className="mb-1">
        {/* Main Menu Item */}
        <div
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
            ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"}
            ${active
              ? "bg-primary-600 text-white shadow-sm"
              : "text-gray-300 hover:bg-slate-700"
            }
          `}
          onClick={() => {
            if (hasChildren) {
              if (isCollapsed) {
                if (onToggleCollapse) onToggleCollapse();
                toggleExpand(item.title, true);
              } else {
                toggleExpand(item.title, true);
              }
            } else {
              handleMenuItemClick(item.route);
            }
          }}
          title={isCollapsed ? item.title : ""}
        >
          <Icon
            className={`text-xl flex-shrink-0 ${active ? "text-white" : "text-gray-400"}`}
          />
          {!isCollapsed && <span className="font-medium flex-1 text-sm truncate">{item.title}</span>}
          {!isCollapsed && hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}>
              <FiChevronDown className="text-gray-400 text-sm" />
            </motion.div>
          )}
        </div>

        {/* Children Items */}
        <AnimatePresence>
          {!isCollapsed && hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">
              <div className="ml-4 mt-1 pl-4 border-l-2 border-slate-600 space-y-1">
                {item.children.map((child, index) => {
                  const childRoute = getChildRoute(item.route, child);
                  const isChildActive =
                    location.pathname === childRoute ||
                    (childRoute !== item.route &&
                      location.pathname.startsWith(childRoute));

                  return (
                    <div
                      key={index}
                      onClick={() =>
                        handleMenuItemClick(childRoute, item.title)
                      }
                      className={`
                        px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer truncate
                        ${isChildActive
                          ? "bg-primary-500/20 text-white font-medium"
                          : "text-gray-400 hover:bg-slate-700"
                        }
                      `}>
                      {child}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
```

---

## Vendor.model.js original _id generator (July 25, 2026)

### 1. _id field definition

```javascript
  _id: { type: String, default: () => crypto.randomUUID() },
```


```









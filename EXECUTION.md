# SikhStreet — Execution Plan
> **Focus:** Pure code tasks only — no third-party integrations required
> **Reference:** PROJECT_ROADMAP.md for full project context
> **Updated:** August 2026

---

## LEGEND
- [DONE]     — Fully complete, wired, tested
- [PARTIAL]  — Code exists but not fully connected
- [TODO]     — Not built yet
- [BLOCKED]  — Waiting on a third-party API key/service

---

## ALL TASKS — CODE ONLY (No 3rd Party)

### P0 — DO NOW (Unblocks everything downstream)
| # | Task | Status | Why It Matters |
|---|------|--------|----------------|
| 1 | Marketplace Config — wire frontend service functions | PARTIAL | Vendors cannot use dynamic product types |
| 2 | Socket.io Chat — wire real-time events | PARTIAL | Chat UI exists, no live connection |

### P1 — THIS WEEK
| # | Task | Status | Why It Matters |
|---|------|--------|----------------|
| 3 | Geo-Commerce Hierarchy — data model + admin UI | TODO | Core BRD differentiator |
| 4 | Proximity ranking algorithm (no map needed) | TODO | Powers local discovery |
| 5 | Buyer geolocation detection | TODO | Browser native, no API key needed |
| 6 | Delivery App — complete missing pages | PARTIAL | Operations cannot function |

### P2 — NEXT WEEK
| # | Task | Status | Why It Matters |
|---|------|--------|----------------|
| 7 | Vendor Bulk Product Upload (CSV) | TODO | Vendor productivity |
| 8 | PWA Setup (manifest + service worker) | TODO | Mobile install, offline |
| 9 | SEO — meta tags, sitemap, OG tags | TODO | Discoverability |
| 10 | Admin Analytics — date filters + CSV export | TODO | Business reporting |

---

## P0 TASK #1 — MARKETPLACE CONFIG FULL IMPLEMENTATION PLAN

### Background — What Exists vs What Is Missing

#### Backend — FULLY BUILT
The backend is 100% done. Routes are mounted at:
  GET    /api/admin/marketplace-config/additional-fields
  POST   /api/admin/marketplace-config/additional-fields
  PUT    /api/admin/marketplace-config/additional-fields/:id
  DELETE /api/admin/marketplace-config/additional-fields/:id
  GET    /api/admin/marketplace-config/templates
  POST   /api/admin/marketplace-config/templates
  PUT    /api/admin/marketplace-config/templates/:id
  DELETE /api/admin/marketplace-config/templates/:id
  GET    /api/admin/marketplace-config/product-types
  POST   /api/admin/marketplace-config/product-types
  PUT    /api/admin/marketplace-config/product-types/:id
  DELETE /api/admin/marketplace-config/product-types/:id
  GET    /api/admin/marketplace-config/resolve/:categoryId

All 5 frontend page files exist:
  - frontend/.../Admin/pages/marketplace/ProductTypes.jsx   — imports getProductTypes, createProductType, etc.
  - frontend/.../Admin/pages/marketplace/Templates.jsx      — imports getProductTemplates, getAdditionalFields, etc.
  - frontend/.../Admin/pages/marketplace/FieldsLibrary.jsx  — imports getAdditionalFields, createAdditionalField, etc.
  - frontend/.../Admin/pages/marketplace/TemplateAssignment.jsx — imports getProductTemplates, updateCategory
  - frontend/.../Admin/pages/marketplace/CategoryPreview.jsx

#### THE ROOT PROBLEM
adminService.js has ZERO marketplace config functions.
The pages import function names like:
  getProductTypes, createProductType, updateProductType, deleteProductType
  getProductTemplates, createProductTemplate, updateProductTemplate, deleteProductTemplate
  getAdditionalFields, createAdditionalField, updateAdditionalField, deleteAdditionalField

But none of these exist in adminService.js.
This means every marketplace config page will crash on load.

---

### Implementation Steps

#### STEP 1 — Add API service functions to adminService.js
FILE: frontend/src/modules/Admin/services/adminService.js

Add the following block at the bottom of the file
(after the last existing export):

------- CODE TO ADD -------

// -- Marketplace Config — Fields Library --
export const getAdditionalFields = () =>
    api.get('/admin/marketplace-config/additional-fields');

export const createAdditionalField = (data) =>
    api.post('/admin/marketplace-config/additional-fields', data);

export const updateAdditionalField = (id, data) =>
    api.put(`/admin/marketplace-config/additional-fields/${id}`, data);

export const deleteAdditionalField = (id) =>
    api.delete(`/admin/marketplace-config/additional-fields/${id}`);

// -- Marketplace Config — Product Templates --
export const getProductTemplates = () =>
    api.get('/admin/marketplace-config/templates');

export const createProductTemplate = (data) =>
    api.post('/admin/marketplace-config/templates', data);

export const updateProductTemplate = (id, data) =>
    api.put(`/admin/marketplace-config/templates/${id}`, data);

export const deleteProductTemplate = (id) =>
    api.delete(`/admin/marketplace-config/templates/${id}`);

// -- Marketplace Config — Product Types --
export const getProductTypes = () =>
    api.get('/admin/marketplace-config/product-types');

export const createProductType = (data) =>
    api.post('/admin/marketplace-config/product-types', data);

export const updateProductType = (id, data) =>
    api.put(`/admin/marketplace-config/product-types/${id}`, data);

export const deleteProductType = (id) =>
    api.delete(`/admin/marketplace-config/product-types/${id}`);

// -- Marketplace Config — Schema Resolution --
export const resolveCategorySchema = (categoryId) =>
    api.get(`/admin/marketplace-config/resolve/${categoryId}`);

------- END CODE -------

#### STEP 2 — Verify page response shape handling

Each page destructures the API response. The backend returns:
  { success: true, data: [...], message: "..." }

Axios wraps this in response.data, so the actual array is at:
  response.data.data   (first .data = Axios, second .data = API payload)

Check each page currently does:
  setTypes(response.data || [])    — WRONG, will set { data: [...], message: "" }
  
Should be:
  setTypes(response.data?.data || response.data || [])

Pages to check and fix if needed:
  - ProductTypes.jsx     line ~36   setTypes(response.data || [])
  - Templates.jsx        line ~39   setTemplates(resTemplates.data || [])
  - FieldsLibrary.jsx    line ~68   setFields(response.data || [])
  - TemplateAssignment.jsx line ~33 setTemplates(resTemplates.data || [])

After adding the service functions, open each page and trace the
response.data path — fix to use response.data?.data if needed.

#### STEP 3 — Register marketplace pages in the Admin router

FILE: frontend/src/App.jsx (or wherever admin routes are defined)

Check if these routes are registered:
  /admin/marketplace/product-types       -> ProductTypes
  /admin/marketplace/templates           -> Templates
  /admin/marketplace/fields-library      -> FieldsLibrary
  /admin/marketplace/template-assignment -> TemplateAssignment
  /admin/marketplace/category-preview    -> CategoryPreview

If any are missing, add them. Also check the Admin sidebar menu
file (adminMenu.json or equivalent) to ensure these pages are
accessible from the navigation.

#### STEP 4 — Test TemplateAssignment save flow

TemplateAssignment.jsx calls updateCategory to save the template
assignment to a category. Verify the updateCategory function in
adminService.js sends both:
  - assignedTemplateId (the template linked to this category)
  - additionalFields   (the extra fields attached to this category)

The backend Category model must have these fields. Check:
  backend/src/models/Category.model.js
  -> should have: assignedTemplateId (ObjectId ref ProductTemplate)
  -> should have: additionalFields (Array)

If missing, add them to the model.

#### STEP 5 — Verify CategoryPreview resolution

CategoryPreview.jsx should call resolveCategorySchema(categoryId)
and render the merged template (template steps + category additional fields).

The backend endpoint GET /api/admin/marketplace-config/resolve/:categoryId
already handles the full merge logic including ancestor-field inheritance.

Make sure CategoryPreview.jsx:
  1. Lets admin pick a category (dropdown from categoryStore)
  2. Calls resolveCategorySchema with selected categoryId
  3. Renders the resolved steps/fields in a read-only preview

#### STEP 6 — Connect Vendor DynamicProductWizard to resolved schema

FILE: frontend/src/modules/Vendor/pages/products/DynamicProductWizard.jsx

When a vendor selects a category, the wizard should call:
  GET /api/admin/marketplace-config/resolve/:categoryId
  (This is accessible to authenticated vendors too — route has: authenticate only)

This gives the vendor the exact fields to fill for that category.
Currently the wizard may be using a local hardcoded schema.
Replace the hardcoded schema with the live API call.

---

### Acceptance Criteria — P0 Task #1 is DONE when:

1. Admin can open /admin/marketplace/product-types and see, create, edit, delete product types
2. Admin can open /admin/marketplace/fields-library and manage reusable fields
3. Admin can open /admin/marketplace/templates and build multi-step templates using library fields
4. Admin can open /admin/marketplace/template-assignment and assign a template + extra fields to any category
5. Admin can open /admin/marketplace/category-preview, select a category, and see the resolved field schema
6. Vendor opens DynamicProductWizard, selects a category, and sees the correct dynamic fields from the assigned template
7. No console errors or crashes on any of the 5 marketplace config pages

---

## P0 TASK #2 — SOCKET.IO REAL-TIME CHAT IMPLEMENTATION PLAN

### Background — What Exists vs What Is Missing

#### What exists:
  backend/src/models/VendorChatThread.model.js   — thread between buyer and vendor
  backend/src/models/VendorChatMessage.model.js  — individual messages
  backend/src/modules/vendor/controllers/chat.controller.js  — HTTP REST handlers
  backend/src/modules/user/controllers/chat.controller.js    — HTTP REST handlers
  frontend/src/modules/Vendor/pages/Chat.jsx     — vendor chat UI
  frontend/src/modules/UserApp/pages/Chat.jsx    — buyer chat UI

#### What is missing:
  - Socket.io server setup in backend (app.js / server.js)
  - Socket event handlers (join_room, send_message, typing, read_receipt)
  - Socket.io client in frontend Chat pages
  - Real-time message push (currently only REST polling works)

---

### Implementation Steps

#### STEP 1 — Install Socket.io on backend

  npm install socket.io    (in backend folder)

#### STEP 2 — Initialize Socket.io in server.js

FILE: backend/src/server.js

Change from:
  app.listen(PORT, ...)

To:
  import { createServer } from 'http';
  import { Server } from 'socket.io';
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*', credentials: true } });
  httpServer.listen(PORT, ...)

Then set up socket event handlers:
  io.on('connection', (socket) => {
    // User joins their chat thread room
    socket.on('join_thread', (threadId) => {
      socket.join(threadId);
    });

    // User sends a message — save to DB and broadcast to room
    socket.on('send_message', async ({ threadId, senderId, senderRole, content }) => {
      // 1. Save message to VendorChatMessage collection
      // 2. Update thread.lastMessage and thread.updatedAt
      // 3. Emit 'new_message' to all sockets in the thread room
      io.to(threadId).emit('new_message', { threadId, senderId, senderRole, content, createdAt: new Date() });
    });

    // Typing indicator
    socket.on('typing', ({ threadId, userId }) => {
      socket.to(threadId).emit('user_typing', { userId });
    });

    // Mark messages as read
    socket.on('mark_read', ({ threadId, userId }) => {
      // Update unread count in DB
      socket.to(threadId).emit('messages_read', { userId });
    });
  });

#### STEP 3 — Install Socket.io client on frontend

  npm install socket.io-client   (in frontend folder)

#### STEP 4 — Create shared socket utility

FILE: frontend/src/shared/utils/socket.js

  import { io } from 'socket.io-client';
  const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    autoConnect: false,
    withCredentials: true,
  });
  export default socket;

#### STEP 5 — Update Vendor/pages/Chat.jsx and UserApp/pages/Chat.jsx

In both Chat pages:
  1. Import socket from shared utils
  2. On mount: socket.connect(), socket.emit('join_thread', threadId)
  3. On unmount: socket.disconnect()
  4. Listen for 'new_message' -> append to messages state
  5. Listen for 'user_typing' -> show typing indicator
  6. On send: socket.emit('send_message', payload) AND save via REST API as backup
  7. On read: socket.emit('mark_read', { threadId, userId })

### Acceptance Criteria — P0 Task #2 is DONE when:
1. Vendor sends a message — buyer receives it instantly without page refresh
2. Typing indicator appears on the other side within 1 second
3. Messages persist in DB (REST save still works as source of truth)
4. Read receipts update in real-time

---

## P1 TASK #3 — GEO-COMMERCE HIERARCHY (No Map Required)

### What to Build (Pure Code, No Google Maps)

#### STEP 1 — Create Location Model

FILE: backend/src/models/Location.model.js (NEW)

Fields:
  name        String, required
  slug        String, unique
  type        String, enum: ['country', 'state', 'city', 'area', 'sector', 'street']
  parentId    ObjectId ref Location (null for country-level)
  countryCode String (ISO 3166)
  isActive    Boolean, default true
  sortOrder   Number

Add index: { parentId: 1 } and { type: 1 }

#### STEP 2 — Create Location API

FILE: backend/src/modules/admin/controllers/location.controller.js (NEW)
Routes: GET /admin/locations, POST, PUT/:id, DELETE/:id
        GET /admin/locations/children/:parentId  (get children of a node)
        GET /admin/locations/tree                (full nested tree)

#### STEP 3 — Vendor Model — Add Location Field

FILE: backend/src/models/Vendor.model.js

Add:
  locationId  ObjectId ref Location   (the specific sector/street the vendor is in)
  coordinates { lat: Number, lng: Number }  (optional, for future map)

#### STEP 4 — Admin UI — Location Manager

FILE: frontend/src/modules/Admin/pages/locations/LocationManager.jsx (NEW)

Features:
  - Tree view of Country > State > City > Area > Sector
  - Add / Edit / Delete nodes at any level
  - Breadcrumb path display
  - Search by name

#### STEP 5 — Vendor Onboarding — Location Selection

FILE: frontend/src/modules/Vendor/pages/Onboarding.jsx

Add a step where vendor selects their location:
  - Dropdown 1: Country
  - Dropdown 2: State (filtered by country)
  - Dropdown 3: City (filtered by state)
  - Dropdown 4: Area/Sector (filtered by city)
Each dropdown loads dynamically via GET /admin/locations/children/:parentId

#### STEP 6 — Proximity Ranking Algorithm

FILE: backend/src/modules/user/controllers/order.controller.js or new vendor discovery controller

Logic (pure JS, no maps needed):
  Given buyer's locationId:
  1. Find buyer's location node
  2. Find its parent (area), grandparent (city), great-grandparent (state), etc.
  3. Return vendors sorted by:
     - Score 100: same sector/street as buyer
     - Score 80: same area as buyer
     - Score 60: same city
     - Score 40: same state
     - Score 20: same country
     - Score 0: international

### Acceptance Criteria — P1 Task #3 is DONE when:
1. Admin can build a location tree (Country > State > City > Area > Sector)
2. Vendor picks their location during onboarding
3. Buyer app requests vendors sorted by proximity score
4. LocalStores page shows vendors ranked by the proximity algorithm

---

## P1 TASK #4 — DELIVERY APP COMPLETION

### Audit Steps First
Before writing code, check:
  frontend/src/modules/Delivery/pages/
  frontend/src/modules/Delivery/components/

List what pages exist and which are missing from the expected set:
  Expected pages:
  - Login.jsx          — delivery agent login
  - Dashboard.jsx      — active deliveries overview
  - OrderDetail.jsx    — order info + navigation link
  - Pickup.jsx         — confirm pickup from vendor
  - Delivered.jsx      — confirm delivery to customer
  - CashCollection.jsx — COD amount entry
  - History.jsx        — past deliveries

Then build any missing pages connecting to admin backend delivery APIs.

---

## P2 TASK #5 — VENDOR CSV BULK UPLOAD

### What to Build

#### STEP 1 — CSV Template Generator (frontend)

Create a downloadable CSV template with columns:
  name, description, price, originalPrice, category, brand,
  stock, sku, weight, images (comma-separated URLs)

#### STEP 2 — Frontend Upload UI

FILE: frontend/src/modules/Vendor/pages/products/BulkUpload.jsx (NEW)
  - Download template button
  - File input (accepts .csv)
  - Parse with Papa Parse (open source, no API needed)
  - Show preview table before submit
  - Show per-row validation errors
  - Submit valid rows only

#### STEP 3 — Backend Batch Endpoint

FILE: backend/src/modules/vendor/controllers/product.controller.js

Add endpoint: POST /vendor/products/bulk
  - Accept array of product objects
  - Validate each product
  - Insert valid ones, return error report for invalid ones
  - Max 500 rows per request

---

## P2 TASK #6 — PWA SETUP

### What to Build (Pure Code, No API Keys)

#### STEP 1 — manifest.json

FILE: frontend/public/manifest.json
  {
    "name": "SikhStreet",
    "short_name": "SikhStreet",
    "description": "Global Sikh Marketplace",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0f172a",
    "theme_color": "#f97316",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }

#### STEP 2 — Service Worker (Vite PWA plugin)

  npm install -D vite-plugin-pwa

In vite.config.js add VitePWA plugin with:
  - Cache: static assets, API GET responses
  - Offline fallback page
  - Background sync for cart (when back online, replay cart actions)

#### STEP 3 — Install Prompt

FILE: frontend/src/shared/components/InstallPrompt.jsx (NEW)
  Listen for beforeinstallprompt event
  Show a banner: "Install SikhStreet App" with Install button

---

## P2 TASK #7 — SEO OPTIMIZATION

### What to Build

#### STEP 1 — Install react-helmet-async
  npm install react-helmet-async

#### STEP 2 — Add HelmetProvider to main.jsx

#### STEP 3 — Add <Helmet> to each major page

Pages that need unique meta tags:
  - Home.jsx           — generic marketplace description
  - Category.jsx       — "{Category Name} - Shop on SikhStreet"
  - ProductDetail.jsx  — "{Product Name} by {Vendor} | SikhStreet"
  - Seller.jsx         — "{Store Name} - Verified Seller on SikhStreet"
  - Search.jsx         — "Search results for {query} | SikhStreet"

Each page needs:
  <title>...</title>
  <meta name="description" content="..." />
  <meta property="og:title" content="..." />
  <meta property="og:description" content="..." />
  <meta property="og:image" content="{product or vendor image}" />

#### STEP 4 — Sitemap Generator

FILE: backend/src/scripts/generateSitemap.js (NEW)
  - Fetch all active products, categories, vendors from DB
  - Generate sitemap.xml with their URLs
  - Save to frontend/public/sitemap.xml
  - Run as a cron job (weekly) or on-demand

---

## P2 TASK #8 — ADMIN ANALYTICS UPGRADE

### Current State
Pages exist: Analytics.jsx, reports/SalesReport.jsx, reports/InventoryReport.jsx
finance/ pages: RevenueOverview, OrderTrends, ProfitLoss, TaxReports, RefundReports

### What to Add (Pure Code)

#### STEP 1 — Date Range Filter Component

FILE: frontend/src/modules/Admin/components/DateRangePicker.jsx (NEW)
  - Start date + End date inputs
  - Presets: Today, Last 7 days, Last 30 days, This Month, This Quarter, This Year
  - Pass startDate + endDate as query params to all analytics APIs

#### STEP 2 — CSV Export Function

Add to every report table:
  function downloadCSV(data, filename) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.csv';
    a.click();
  }

#### STEP 3 — Vendor Performance Comparison

FILE: frontend/src/modules/Admin/pages/vendors/VendorAnalytics.jsx
Add a comparison table showing top N vendors side-by-side:
  Columns: Vendor Name | Revenue | Orders | Avg Rating | Return Rate | Commission

---

## EXECUTION ORDER — Summary

```
TODAY — COMPLETED ✅
  [x] P0.1 - Add 13 missing functions to adminService.js          ✅ DONE
  [x] P0.1 - Response.data path verified — already correct        ✅ DONE
  [x] P0.1 - Marketplace routes verified in App.jsx               ✅ DONE
  [x] P0.1 - Category model has assignedTemplateId field          ✅ DONE (already existed)
  [x] P0.1 - DynamicProductWizard already calls resolve API       ✅ DONE (already existed)
  [x] P0.2 - Install socket.io on backend + frontend              ✅ DONE
  [x] P0.2 - Initialize Socket.io in server.js                    ✅ DONE
  [x] P0.2 - Create socket.js utility file                        ✅ DONE
  [x] P0.2 - Update Vendor/Chat.jsx with socket events            ✅ DONE
  [x] P0.2 - Update UserApp/Chat.jsx with socket events           ✅ DONE

THIS WEEK — NEXT
  [ ] P1.3 - Create Location model                                (1 hr)
  [ ] P1.3 - Create location API (CRUD + tree)                    (2 hrs)
  [ ] P1.3 - Add locationId to Vendor model                       (30 min)
  [ ] P1.3 - Build LocationManager admin UI                       (3 hrs)
  [ ] P1.3 - Add location step to vendor onboarding               (2 hrs)
  [ ] P1.3 - Build proximity ranking algorithm                    (2 hrs)
  [ ] P1.4 - Audit Delivery app pages                             (30 min)
  [ ] P1.4 - Build missing Delivery app pages                     (3-5 hrs)

NEXT WEEK
  [ ] P2.5 - CSV Bulk Upload (frontend parser + backend batch)    (4 hrs)
  [ ] P2.6 - PWA setup (manifest + VitePWA plugin)                (2 hrs)
  [ ] P2.7 - SEO meta tags on all major pages                     (3 hrs)
  [ ] P2.7 - Sitemap generator script                             (1 hr)
  [ ] P2.8 - Date range filter component                          (2 hrs)
  [ ] P2.8 - CSV export on all report tables                      (2 hrs)
```

---

> Start with the very first checkbox — it takes 30 minutes and unblocks an entire feature area.
> Use this file as your daily checklist. Tick off items as they are done.

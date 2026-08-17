# SikhStreet Codebase Directory & Review Tree

This document provides a token-efficient map of the **SikhStreet** multi-vendor geo-commerce platform. It outlines the responsibilities of each module, folder, and key files across the backend and frontend to enable rapid navigation and code review.

---

## 📁 Repository Overview

```
sikhStreet/
├── .code-review-graph/          # Graph database for code relationships (via MCP tools)
├── AGENTS.md / GEMINI.md        # Agent guidelines for graph exploration
├── CLIENT_REPORT.md             # Review of issues, features, and fixes
├── DEPLOY.md                    # Deployment guidelines (Netlify, Render, DB setup)
├── EXECUTION.md                 # Detailed implementation execution log
├── PROJECT_ROADMAP.md           # Master roadmap and vision document
├── backend/                     # Node.js + Express.js + Mongoose server
└── frontend/                    # React + Vite + Zustand + Tailwind app
```

---

## 🖥️ Backend Architecture (`/backend`)

The backend is structured into domain-specific modules alongside central models, configs, and middlewares.

### Directory Structure

```
backend/
├── src/
│   ├── app.js                   # Express application setup (middlewares, route routing)
│   ├── server.js                # Server entry point, HTTP server creation, and Socket.io event listeners
│   ├── config/                  # Server configuration (DB, environment, Cloudinary, JWT)
│   ├── middlewares/             # Security, authentication, and file upload middlewares
│   ├── models/                  # 38 Mongoose schemas & index exports
│   ├── modules/                 # Modular API controllers, routes, and validators
│   │   ├── admin/               # Admin operations, analytics, approval flows
│   │   ├── user/                # Customer authentication, profile, orders, reviews
│   │   └── vendor/              # Vendor onboarding, products, earnings, chat
│   ├── routes/                  # Public routes (listings, public category query)
│   ├── scripts/                 # Migration, template inspection, and DB seed scripts
│   └── utils/                   # Shared utility helpers
├── uploads/                     # Local storage fallback for static files & documents
└── nodemon.json                 # Dev-mode file watch rules
```

### 🔑 Key Backend Components

#### 1. Core Entry Points
*   [`app.js`](file:///d:/SikhStreet/sikhStreet/backend/src/app.js): Configures Helmet security, Cors, Express body-parsers, API rate-limiting, static folder access control (including secure JWT checking on `/uploads/delivery-docs`), and mounts route groups.
*   [`server.js`](file:///d:/SikhStreet/sikhStreet/backend/src/server.js): Initializes the HTTP listener and configures **Socket.io** for real-time customer-vendor chat (includes rooms, unread counts incrementing, and typing indicators).

#### 2. Models (`/backend/src/models`)
The app utilizes MongoDB. It contains 38 models registered and grouped in [`index.js`](file:///d:/SikhStreet/sikhStreet/backend/src/models/index.js). Important models:
*   `User.model.js` / `Admin.model.js` / `Vendor.model.js` / `DeliveryBoy.model.js`: Identity schemas.
*   `Product.model.js` & `ProductTemplate.model.js`: Manage product catalog and templates.
*   `Category.model.js` / `Brand.model.js` / `Attribute.model.js`: Hierarchical taxonomy.
*   `Order.model.js` / `ReturnRequest.model.js`: Transactions and checkout tracking.
*   `VendorChatThread.model.js` / `VendorChatMessage.model.js`: Direct messaging records.
*   `Commission.model.js` / `Settlement.model.js`: Ledger details for vendor payouts.

#### 3. Middlewares (`/backend/src/middlewares`)
*   `authenticate.js`: Resolves JWT tokens from Authorization header or cookie.
*   `authorize.js`: Configures role-based access validation (User, Admin, Vendor, Delivery).
*   `upload.js`: Configures Multer storage profiles (local or Cloudinary) for images, icons, and PDFs.
*   `validate.js`: Generic middleware executing Express-validator arrays.

#### 4. Domain Modules (`/backend/src/modules`)
Each folder houses three subdirectories: `/controllers`, `/routes`, and `/validators`.
*   **User Module**: Manage user addresses, wishlist items, reviews, order placements.
*   **Vendor Module**: Manage products, orders, wallet earnings, and document uploading.
*   **Admin Module**: Platform configuration, vendor verification, settlement auditing, support ticket resolution, analytics charts.

---

## 🎨 Frontend Architecture (`/frontend`)

The frontend is a single-page React app bundled with Vite, styled with Tailwind CSS + Framer Motion. State management is handled with **Zustand**.

### Directory Structure

```
frontend/
├── src/
│   ├── App.jsx                  # Main router, route guards, and app wrap layout
│   ├── main.jsx                 # Client entry point
│   ├── index.css                # Global styles, variables, and utility classes
│   ├── assets/                  # Fonts, static logos, SVGs
│   ├── data/                    # Local mock data for catalog components
│   ├── modules/                 # Divided UI apps / client portals
│   │   ├── UserApp/             # Public Marketplace, Buyer Portal
│   │   ├── Vendor/              # Vendor Management Portal
│   │   ├── Admin/               # SuperAdmin Control Panel
│   │   └── Delivery/            # Delivery Partner Interface
│   └── shared/                  # Common, reusable files
│       ├── components/          # Common components (cards, gallery, drawers)
│       ├── hooks/               # Custom hooks (scroll, animation)
│       ├── store/               # 23 Zustand global state stores
│       └── utils/               # Axios API client, Socket.io connector, helpers
```

### 🔑 Key Frontend Components

#### 1. Page Modules (`/frontend/src/modules`)
*   **UserApp/pages**:
    *   `Home.jsx`: Dynamic homepage featuring category grids, promotions, and nearby stores.
    *   `ProductDetail.jsx`: Comprehensive item viewer with Kada sizing/measurement tool, attributes, variant selections, reviews, and related feeds.
    *   `Checkout.jsx` / `Addresses.jsx`: Multi-step checkout pipeline.
    *   `Chat.jsx`: Direct message client built on Socket.io.
*   **Vendor/pages**:
    *   `Dashboard.jsx` / `Earnings.jsx` / `InventoryReports.jsx`: Financial graphs, metrics.
    *   `Onboarding.jsx` / `Documents.jsx`: Verification file upload and status check.
    *   `Products.jsx` / `ShippingManagement.jsx`: SKU and delivery fee configuration.
*   **Admin/pages**:
    *   `Dashboard.jsx` / `Analytics.jsx`: Central operational hub and charts.
    *   `Vendors.jsx` / `Categories.jsx` / `PromoCodes.jsx`: Management grids for approval.
*   **Delivery/pages**:
    *   `Dashboard.jsx` / `OrderDetail.jsx`: Compact mobile layout for parcel pick up and GPS verification.

#### 2. State Stores (`/frontend/src/shared/store`)
The platform uses independent Zustand stores to separate concern areas:
*   `authStore.js`: Handles session states, role-based login tokens, storage keys.
*   `productStore.js` / `categoryStore.js` / `brandStore.js`: Manages loaded taxonomies.
*   `orderStore.js`: Coordinates checkout cart and orders history.
*   `chatStore.js`: Live messaging stream, reading status, socket connection state.
*   `locationStore.js`: Stores user coordinates and geo-filters.

#### 3. API & Communication Client
*   [`api.js`](file:///d:/SikhStreet/sikhStreet/frontend/src/shared/utils/api.js): Creates Axios instance. Dynamically handles requests for admin, vendor, user, and delivery scopes, intercepts authentication headers, triggers automated token refreshing on `401 Unauthorized`, and falls back gracefully to local mock JSON datasets when offline.
*   [`socket.js`](file:///d:/SikhStreet/sikhStreet/frontend/src/shared/utils/socket.js): Handles Socket.io client setup connected to the Express backend port.

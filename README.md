# ☕ Brew & Bites — Modern Full-Stack Café & Restaurant Ordering App

A modern full-stack café and fast-food web application built with **React 18**, **Vite**, **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## 🌟 Key Features

### 📱 Customer Ordering Experience
- **Quick Guest Login**: Phone number & customer name authentication.
- **Categorized Menu & Review Badges**:
  - Smooth category navigation pills & live search bar.
  - **Dynamic Rating Star Badges**: Displays rating badges (`★ 4.8 (3)`) on item cards only when an item has **2 or more reviews**.
- **Item Customizations & Add-ons**: Checkbox options for custom toppings & extras (e.g. Extra Cheese, Make it Spicy, Double Patty).
- **Fast Food Saver Combos**: Dedicated Combo Deals section with instant add-to-cart micro-animations.
- **Express Pickup Guarantee Timer**: Live countdown timer (`⚡ Ready for Pickup in 15 mins`).
- **Promo Coupon Codes**: Apply promo codes at checkout with minimum order purchase limits and max discount caps.
- **Festival & Special Sale Price Overrides**:
  - Storewide percentage (%) or flat rupee (₹) discounts.
  - **Custom Item Sale Prices**: Override specific item sale prices (e.g. ₹99 special price for Gourmet Burgers).
  - Item Eligibility (Include / Exclude specific menu items).
- **Order Fulfillment Methods**:
  - 💵 **Cash on Pickup**
  - 🏠 **Order in Café / Dine-in**
  - 💳 **Online Payment**
- **Live Order Tracking**: Real-time status tracker (`Placed` → `Accepted` → `Preparing` → `Ready` → `Completed`).

---

### 🎨 Themes & Aesthetics Engine
- **Prebuilt Designer Themes**:
  1. 🍔 **Fast Food Express** *(Red, Golden Yellow, White)*
  2. 🛍️ **Shopify Crave** *(Vibrant Foodie Coral & Sunshine Yellow)*
  3. ⚡ **Neo Brutalism** *(High-contrast pop art with solid offset shadows)*
  4. ☕ **Warm Café** *(Cozy Amber & Cream)*
  5. 🌙 **Midnight** *(Dark Mode Elegance)*
  6. 💼 **Clean Pro** *(Minimalist Corporate)*
  7. 🌿 **Forest** *(Fresh Natural Green)*
  8. 🌸 **Sweet Pink** *(Delightful Pastel)*
- **Custom Color Palette Override**: Hex color picker for Accent, Background, Card & Text.
- **Menu Card Corner Radius**: Custom corner curvature styles for menu cards.

---

### 🌐 Remote Master Theme Control REST API
Allows an external master site / super admin panel to remotely control store themes & banners in real-time.

- **`GET /api/remote/theme`**: Returns active theme & allowed presets.
- **`POST /api/remote/theme`**: Secure remote theme update endpoint.
  - Header: `X-Remote-Secret: super-secret-remote-key`
  - Body: `{ "theme": "fast-food" }`

---

### 🛠️ Admin Management & Staff Permissions (`/admin`)

1. **Dashboard Overview**: Live stats (Revenue, Total Orders, Active Orders, Menu Item Counts).
2. **Order Management & Null-Safe Tracking**:
   - Filter orders by status (`Placed`, `Accepted`, `Preparing`, `Ready`, `Completed`, `Cancelled`).
   - One-click order status workflow with printed receipt generator & direct WhatsApp invoice sender.
3. **Menu & Combo Management**:
   - Create, edit, and delete menu items & categories with image upload support.
   - Dedicated **Fast Food Combos Section** with master toggle & per-combo active/inactive switches.
4. **Coupon Codes & Discounts**:
   - Manage promo codes with flat ₹ or percentage % discounts, min purchase limits, and max discount caps.
5. **Festival Sales Engine & Custom Item Prices**:
   - Festival sale banner triggers (Diwali, Valentine's, Summer Splash, New Year).
   - Configure flat ₹ or percentage % store discounts.
   - Set custom individual item sale price overrides.
   - Include or exclude specific items from sales.
6. **Customer Feedback & Reviews**:
   - Manage custom customer reviews shown on store banner.
   - Dynamic 2-review threshold for displaying rating badges on menu items.
7. **Staff Roles & Granular Permissions**:
   - **Role Types**: `Super Admin` vs `Custom Staff Role`.
   - **Quick Presets**: `Cashier / Orders`, `Menu Manager`, `Deals & Promo`, `Store Manager`.
   - **Granular Checkboxes**: `branding`, `sales`, `menu`, `orders`, `reviews`, `coupons`, `admins`.
   - Access control enforced across Admin Navbar, Dashboard sections, and API endpoints.
8. **Super Admin Password Security**:
   - Dedicated **🔑 Change Super Admin Password** box for the active Super Admin.
   - Password changes persist to PostgreSQL database with database-first login verification.
   - Only Super Admins can alter staff passwords or access levels.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Lucide Icons, React Hot Toast, Zustand State Management.
- **Backend**: Node.js, Express.js, Prisma ORM (v7), PostgreSQL database, Multer (file uploads), JWT authentication.
- **Database**: PostgreSQL (`cafe_db`).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL running locally (`localhost:5432`)

---

### 2. Database Setup

```sql
CREATE DATABASE cafe_db;
```

---

### 3. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Edit .env and configure your DATABASE_URL, e.g.:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cafe_db?schema=public"

# Install backend dependencies
npm install

# Generate Prisma Client & Push DB schema
npx prisma generate
npx prisma db push

# Seed initial database data (Categories, Menu items, Coupons, Combos)
node scripts/seedCombos.js

# Start backend server
npm run dev
```
Backend runs on **http://localhost:5001**.

---

### 4. Frontend Setup

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend runs on **http://localhost:5173**.

---

## 🔑 Admin Login Credentials

- **URL**: `http://localhost:5173/admin/login`
- **Username**: `admin`
- **Password**: `admin123`

*(Configurable via `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env` or updated via Admin Settings)*

---

## 📁 Project Structure

```
Restro/
├── backend/
│   ├── controllers/      # Route controllers (admin, customer, menu, orders, coupons, combos, remote, review)
│   ├── data/             # Persistent JSON configurations
│   ├── middleware/       # JWT auth & error handler middlewares
│   ├── prisma/           # Prisma schema & database models
│   ├── routes/           # Express API endpoints
│   ├── scripts/          # Database seeding scripts
│   └── server.js         # Entry point Express server
└── frontend/
    ├── src/
    │   ├── api/          # Axios client instance
    │   ├── components/   # Fast food features & UI components
    │   ├── pages/        # App pages (Home, Menu, Checkout, Status, Admin Dashboard)
    │   ├── store/        # Zustand cart & customer stores
    │   └── theme/        # Theme presets & theme provider
    └── vite.config.js
```

---

## 🌐 Deployment Guidelines

- **Frontend**: Deploy to **Vercel** or **Netlify** (set `VITE_API_URL` environment variable).
- **Backend**: Deploy to **Railway**, **Render**, or **Supabase / Neon Postgres** (set `DATABASE_URL` & `.env` secrets).

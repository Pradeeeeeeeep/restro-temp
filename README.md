# ☕ Brew & Bites — Modern Full-Stack Café & Restaurant Ordering App

A modern full-stack café and fast-food web application built with **React**, **Vite**, **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## 🌟 Key Features

### 📱 Customer Ordering Experience
- **Quick Guest Login**: Phone number & name authentication.
- **Categorized Menu & Quick Badges**: Smooth category navigation pills & search bar.
- **Item Customizations & Add-ons**: Checkbox customization options (e.g. Extra Cheese, Make it Spicy, Double Patty).
- **Fast Food Saver Combos**: Dedicated Combo Deals section with instant add-to-cart spring micro-animations.
- **Express Pickup Guarantee Timer**: Live countdown timer (`⚡ Ready for Pickup in 15 mins`).
- **Promo Coupon Codes**: Apply discount promo codes at checkout with minimum purchase limits.
- **Order Fulfillment Methods**:
  - 💵 **Cash on Pickup**
  - 🏠 **Order in Café / Dine-in**
  - 💳 **Online Payment**
- **Live Order Tracking**: Instant status updates (`Placed` → `Accepted` → `Preparing` → `Ready` → `Completed`).

---

### 🎨 Themes & Aesthetics Engine
- **Prebuilt Designer Themes**:
  1. 🍔 **Fast Food Express** *(Red, Golden Yellow, White)*
  2. 🛍️ **Shopify Crave** *(Vibrant Foodie Coral & Sunshine Yellow)*
  3. ⚡ **Neo Brutalism** *(High-contrast pop art with solid black offset shadows)*
  4. ☕ **Warm Café** *(Cozy Amber & Cream)*
  5. 🌙 **Midnight** *(Dark Mode Elegance)*
  6. 💼 **Clean Pro** *(Minimalist Corporate)*
  7. 🌿 **Forest** *(Fresh Natural Green)*
  8. 🌸 **Sweet Pink** *(Delightful Pastel)*
- **Custom Color Palette Override**: Custom hex color picker for Accent, Background, Card & Text.
- **Menu Card Corner Radius**: Custom corner curvature styles for menu cards.

---

### 🌐 Remote Master Theme Control REST API
Allows an external master site / super admin panel to remotely control store themes & banners in real-time.

- **`GET /api/remote/theme`**: Public endpoint returning active theme & allowed presets.
- **`POST /api/remote/theme`**: Secure remote theme update endpoint.
  - Header: `X-Remote-Secret: super-secret-remote-key`
  - Body: `{ "theme": "fast-food" }`

---

### 🛠️ Admin Management Dashboard (`/admin`)

1. **Dashboard Overview**: Live stats (Revenue, Total Orders, Active Orders, Menu Item Counts).
2. **Orders Management**: Filter orders by status, change order status in real time.
3. **Menu & Combo Management**:
   - Add/edit/delete menu items & categories.
   - Dedicated **Fast Food Combos Section** with master toggle & per-combo active/inactive switches.
4. **Coupon Codes & Discounts**:
   - Create & manage promo codes with flat ₹ or percentage % discounts, min purchase limits, and max discount caps.
5. **Festival & Sale Banners**:
   - Preset celebration themes (Diwali, Valentine's, Summer Splash, New Year).
   - Live banner card & full-screen celebration popup modal.
6. **Categorized Store Settings**:
   - Organized category navigation pills (`Branding`, `Theme & Style`, `Coupons`, `Festival Banners`, `Reviews`).

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
Backend runs on **http://localhost:5001** (or `5000`).

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

*(Configurable via `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env`)*

---

## 📁 Project Structure

```
Restro/
├── backend/
│   ├── controllers/      # Route controllers (admin, customer, menu, orders, coupons, combos, remote)
│   ├── data/             # Persistent JSON configurations
│   ├── middleware/       # JWT auth & error handler middlewares
│   ├── prisma/           # Prisma schema & migrations
│   ├── routes/           # Express API endpoints
│   ├── scripts/          # Database seeding scripts (seedCombos.js, seedCoupons.js)
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

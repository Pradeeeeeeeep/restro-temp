# ☕ Brew & Bites — Café Pickup App

A full-stack café ordering application. Customers enter their name & phone, browse the menu, add to cart, and pick from 3 order methods. Admins manage orders and menu via a protected dashboard.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a cloud DB like Railway/Supabase)

---

### 1. Backend Setup

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run seed

# Start server
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Admin Access

- URL: http://localhost:5173/admin/login
- Username: `admin`
- Password: `admin123`

> Change these in `backend/.env` → `ADMIN_USERNAME` and `ADMIN_PASSWORD`

---

## 📱 Customer Flow

1. Open http://localhost:5173
2. Enter Name + Phone
3. Browse menu by category
4. Add items to cart
5. Choose payment method:
   - 💵 **Cash on Pickup**
   - 🏠 **Order in Café** (dine-in)
   - 💳 ~~Pay Online~~ *(coming soon)*
6. Place order → Track live status

---

## 🛠 Admin Flow

1. Login at `/admin/login`
2. **Dashboard** — Stats & recent orders
3. **Orders** — View + advance order status
4. **Menu** — Add/edit/delete items, toggle availability

---

## 🗄 Database

Default connection (edit in `backend/.env`):
```
postgresql://postgres:postgres@localhost:5432/cafe_db
```

Create the database first:
```sql
CREATE DATABASE cafe_db;
```

---

## 📁 Structure

```
Restro/
├── backend/        Node.js + Express + Prisma
└── frontend/       React + Vite + Tailwind CSS
```

---

## 🌐 Deployment

- **Frontend** → Vercel (set `VITE_API_URL` env var to your backend URL)
- **Backend** → Railway / Render (set all `.env` values)
# restro-temp

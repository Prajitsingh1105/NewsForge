# ⚡ NewsForge — Premium News Blogging Platform

A full-stack, production-ready news platform built with Next.js 14, Express.js, and MongoDB. Features a premium editorial design with smooth Framer Motion animations, glassmorphism UI, and a full admin CMS.

---

## 🏗️ Project Structure

```
newsforge/
├── backend/                     # Node.js + Express API
│   ├── server.js                # Entry point
│   ├── .env                     # Environment variables
│   ├── models/
│   │   └── Blog.js              # Mongoose Blog schema
│   ├── controllers/
│   │   ├── authController.js    # JWT login
│   │   └── blogController.js    # Blog CRUD
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── routes/
│   │   ├── auth.js              # POST /api/admin/login
│   │   └── blogs.js             # CRUD /api/blogs
│   └── uploads/                 # Uploaded images
│
└── frontend/                    # Next.js 14 App Router
    ├── app/
    │   ├── page.tsx             # Homepage (hero, grid, trending)
    │   ├── layout.tsx           # Root layout + fonts
    │   ├── globals.css          # Global styles + CSS vars
    │   ├── blog/[id]/page.tsx   # Individual blog page
    │   └── admin/
    │       ├── layout.tsx       # Auth guard wrapper
    │       ├── login/page.tsx   # Admin login
    │       ├── dashboard/page.tsx
    │       ├── create/page.tsx
    │       └── edit/[id]/page.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx       # Sticky nav + search + dark mode
    │   │   └── Footer.tsx
    │   ├── blog/
    │   │   ├── BlogCard.tsx     # 4 variants: featured/default/compact/horizontal
    │   │   └── CategoryTabs.tsx # Animated filter tabs
    │   ├── admin/
    │   │   ├── AdminSidebar.tsx
    │   │   └── BlogForm.tsx     # Shared create/edit form with Quill
    │   └── ui/
    │       └── Skeletons.tsx    # Loading states
    ├── lib/
    │   └── api.ts               # Axios instance + all API calls
    └── hooks/
        ├── useAuth.ts           # JWT verification hook
        └── useTheme.ts          # Dark mode hook
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Backend Setup

```bash
cd newsforge/backend
npm install
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/newsforge
JWT_SECRET=your_super_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:3000
```

Start the API:
```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs at: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd newsforge/frontend
npm install
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Install React Quill CSS (add to globals.css or layout):
```bash
# Already included via dynamic import — no extra step needed
```

Start the frontend:
```bash
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

---

## 🔐 Admin Access

| Field    | Default     |
|----------|-------------|
| URL      | `/admin/login` |
| Username | `admin`     |
| Password | `admin123`  |

> ⚠️ **Change credentials in `backend/.env` before deploying**

---

## 🔌 REST API Reference

### Public Endpoints

| Method | Route             | Description          |
|--------|-------------------|----------------------|
| GET    | `/api/blogs`      | Get all blogs        |
| GET    | `/api/blogs/:id`  | Get single blog      |
| GET    | `/api/health`     | Health check         |

**Query params for GET /api/blogs:**
- `category` — filter by category
- `search` — full-text search
- `featured=true` — only featured
- `page` — pagination (default: 1)
- `limit` — results per page (default: 10)

### Protected Endpoints (JWT Required)

| Method | Route             | Description          |
|--------|-------------------|----------------------|
| POST   | `/api/admin/login`| Get JWT token        |
| GET    | `/api/admin/verify` | Verify token       |
| POST   | `/api/blogs`      | Create blog          |
| PUT    | `/api/blogs/:id`  | Update blog          |
| DELETE | `/api/blogs/:id`  | Delete blog          |
| GET    | `/api/blogs/stats` | Dashboard stats     |

---

## 🎨 Design System

### Colors
| Token          | Light         | Dark          |
|----------------|---------------|---------------|
| Background     | `#fafaf9`     | `#0f0f14`     |
| Card           | `#ffffff`     | `#1c1c26`     |
| Accent (ember) | `#f97316`     | `#fb8c3d`     |
| Text Primary   | `#111118`     | `#f0f0f4`     |

### Fonts
- **Display**: Playfair Display (headlines)
- **Body**: DM Sans (reading)
- **Mono**: JetBrains Mono (code)

### Animations
- Framer Motion page transitions
- Scroll-triggered card reveals
- Staggered grid entrance
- Hero parallax effect
- Reading progress bar
- Glassmorphism search dropdown
- Spring-based sidebar indicator

---

## 🚀 Deployment

### Backend (Railway / Render / Fly.io)
```bash
# Set environment variables in dashboard
# Deploy from GitHub or Docker
```

### Frontend (Vercel)
```bash
vercel deploy
# Set NEXT_PUBLIC_API_URL in Vercel env vars
```

### MongoDB (Atlas)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/newsforge
```

---

## 📸 Pages Overview

| Route               | Description                          |
|---------------------|--------------------------------------|
| `/`                 | Homepage: hero, trending, blog grid  |
| `/blog/:id`         | Full article with reading progress   |
| `/admin/login`      | Animated admin login                 |
| `/admin/dashboard`  | Stats + blog management table        |
| `/admin/create`     | New post editor (Quill + image)      |
| `/admin/edit/:id`   | Edit existing post                   |

---

## ✨ Features Summary

- ✅ JWT-protected admin panel
- ✅ Rich text editor (React Quill)
- ✅ Image upload (Multer)
- ✅ Dark mode (class-based, persistent)
- ✅ Animated news ticker
- ✅ Category filtering with animated tabs
- ✅ Full-text search with live dropdown
- ✅ Reading progress bar
- ✅ Skeleton loaders
- ✅ Responsive (mobile-first)
- ✅ Framer Motion page transitions
- ✅ SEO meta tags
- ✅ View counter
- ✅ Read time calculator
- ✅ Featured post system
- ✅ Tag support
- ✅ Related posts
- ✅ Share buttons
- ✅ Load more pagination
- ✅ Delete confirmation modal

# Home Services Pro - Milestone 1

Professional home services and e-commerce platform with dual functionality: Project Sale (E-commerce) and Services Provider.

## 🚀 Project Overview

### Key Features

- ✅ NextJS 16+ Full-Stack Application
- ✅ Supabase Database with RLS Policies
- ✅ Role-Based Authentication (Admin, User, Worker)
- ✅ Admin Dashboard Layout
- ✅ Products CRUD with Filters & Search
- ✅ Services CRUD with Filters & Search

### Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI + Tailwind CSS
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Icons**: Lucide React
- **Animation**: Framer Motion

## 📁 Project Structure

Following **Nexjs_file_structure.txt** guide for optimal organization:

```
/src
├─ app/                      # NextJS App Router (Routes, Layouts)
│  ├─ layout.tsx            # Root layout with providers
│  ├─ page.tsx              # Home page
│  ├─ admin/                # Admin dashboard routes
│  │  ├─ layout.tsx         # Admin layout with sidebar
│  │  ├─ page.tsx           # Dashboard home
│  │  ├─ login/             # Admin login
│  │  ├─ products/          # Products management
│  │  ├─ services/          # Services management
│  │  ├─ orders/            # Orders (Phase 2)
│  │  ├─ bookings/          # Bookings (Phase 2)
│  │  ├─ users/
│  │  ├─ workers/
│  │  └─ settings/
│  └─ api/                  # API routes (if needed)
│
├─ components/              # React Components
│  ├─ common/               # Reusable components
│  ├─ ui/                   # Shadcn UI components
│  │  ├─ button.tsx
│  │  ├─ input.tsx
│  │  ├─ dialog.tsx
│  │  └─ select.tsx
│  ├─ admin/                # Admin-specific components
│  │  ├─ AdminSidebar.tsx
│  │  └─ ProtectedLayout.tsx
│  └─ pages/                # Page-level compositions
│
├─ lib/                     # Logic & Utilities
│  ├─ supabase/             # Supabase integration
│  │  ├─ client.ts          # Client-side (browser)
│  │  ├─ server.ts          # Server-side (with service key)
│  │  └─ index.ts
│  ├─ server/               # Server actions (important!)
│  │  ├─ productActions.ts  # Server-side product operations
│  │  ├─ serviceActions.ts  # Server-side service operations
│  │  └─ index.ts
│  ├─ client/
│  │  ├─ hooks/
│  │  ├─ services/
│  │  └─ utils/
│  └─ utils.ts              # Helper functions
│
├─ types/                   # TypeScript Definitions
│  ├─ index.ts              # Barrel export
│  ├─ common.ts             # Common types (BaseEntity, etc)
│  ├─ auth.ts               # Auth types (User, UserRole)
│  └─ admin.ts              # Business types (Product, Service, etc)
│
├─ validations/             # Zod Schemas (NO UI here!)
│  ├─ index.ts
│  ├─ auth/                 # Login, signup schemas
│  └─ forms/                # Product, service schemas
│
├─ context/                 # React Contexts
│  └─ AuthContext.tsx       # Authentication provider
│
├─ hooks/                   # Custom React Hooks
│
└─ supabase/               # Database
   └─ migrations/
      └─ 001_initial_schema.sql
```

## 🗄️ Database Schema

### Tables Created:

1. **users** - User profiles with role-based access
2. **products** - E-commerce products with inventory
3. **services** - Service offerings with duration
4. **orders** - Product orders
5. **order_items** - Order line items
6. **bookings** - Service bookings/appointments

### Key Features:

- ✅ Row-Level Security (RLS) enabled on all tables
- ✅ Foreign key relationships
- ✅ Performance indexes
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ Proper data types and constraints

## 🔐 Authentication & Authorization

### Roles:

- **Admin**: Full access to manage products/services
- **User**: Browse products/services, place orders
- **Worker**: Manage bookings and availability

### Security:

- Supabase Auth with email/password
- Role stored in users table
- RLS policies enforce row-level security
- Protected layout component for admin routes
- Client-side and server-side separation

##

│ │ └── page.tsx # Home page
│ ├── components/
│ │ ├── admin/ # Admin components (Sidebar, Layout)
│ │ └── ui/ # Shadcn UI components
│ ├── context/ # React Context (Auth)
│ ├── services/ # API service functions
│ ├── types/ # TypeScript interfaces
│ └── lib/ # Utilities & helpers
├── supabase-schema.sql # Complete database schema
├── .env.local # Environment variables
└── package.json

````

## 🛠 Tech Stack

- **Frontend**: Next.js 16+ (React 19)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with JWT
- **UI**: Shadcn/ui + Radix UI + Tailwind CSS
- **State**: React Context API

## 📦 Installation

### Prerequisites
- Node.js 18+
- Supabase account

### Step 1: Setup Environment
```bash
# Create .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key" > .env.local
````

### Step 2: Setup Database

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy `supabase-schema.sql` content
4. Execute it to create all tables, indexes & RLS

### Step 3: Create Admin User

```sql
-- In Supabase SQL Editor
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

### Step 4: Run Development Server

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

## ✨ Features

### Admin Dashboard (/admin)

- [x] Login page with Supabase auth
- [x] Dashboard with stats
- [x] Responsive sidebar navigation
- [x] Protected routes (admin only)

### Products Management (/admin/products)

- [x] List all products with pagination
- [x] Search & filter by category
- [x] Add new product
- [x] Edit existing product
- [x] Delete product
- [x] Stock tracking
- [x] Active/Inactive toggle

### Services Management (/admin/services)

- [x] List all services with pagination
- [x] Search & filter by category
- [x] Add new service
- [x] Edit existing service
- [x] Delete service
- [x] Duration management (minutes)
- [x] Active/Inactive toggle

### Coming Soon (Phase 2)

- [ ] Orders management & tracking
- [ ] Bookings with calendar (from plenumpro)
- [ ] Worker management
- [ ] User management
- [ ] Analytics dashboard
- [ ] Email notifications (SES)
- [ ] Payment processing (Ozow)

## 🔐 Authentication

Role-based access control:

- **admin**: Full access to dashboard
- **user**: Customer account (Phase 2)
- **worker**: Service provider (Phase 2)

## 📊 Database Schema

### Core Tables

- `users` - User profiles with roles
- `products` - E-commerce products
- `services` - Home services
- `orders` - Product orders
- `order_items` - Order line items
- `bookings` - Service appointments
- `workers` - Worker profiles
- `worker_availability` - Worker schedules

All tables include proper indexes and Row Level Security policies.

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Other Platforms

- Netlify
- AWS
- DigitalOcean
- Azure App Service

# 🗄️ Complete Data Structure Design

**Home Services & E-commerce Platform (South Africa)**  
**Final Version: February 2026**

> **Geographic Scope:** South Africa only (ZAR currency, SA provinces, Ozow payments)

---

## 📊 Entity Relationship Diagram (Text)

```
┌─────────────────┐
│    profiles     │ (Auth Identity)
├─────────────────┤
│ auth_id (PK)    │◄──┐
│ full_name       │   │
│ email           │   │
│ avatar_url      │   │
│ role            │   │  1:1
│ status          │   │
│ created_at      │   │
└─────────────────┘   │
         ▲            │
         │            │
    ┌────┴────┐       │
    │         │       │
┌───────────┐ ┌──────────────┐
│  workers  │ │ user_profile │
├───────────┤ ├──────────────┤
│ id        │ │ user_id (FK) │◄─┐
│ profile_id│─┘ │ phone       │  │
│ address   │   │ address_id  │  │ 1:1
│ rating    │   │ payment_method
│ hourly_rate   │
└───────────┘   └──────────────┘


┌──────────────────┐
│  addresses       │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │◄────┐
│ label            │     │ 1:N
│ line1, line2     │     │
│ city, state, zip │     │
│ is_default       │     │
└──────────────────┘     │
                         │
         ┌───────────────┘
         │
┌────────────────────────────────────┐
│ orders                             │
├────────────────────────────────────┤
│ id (PK)                            │
│ user_id (FK → profiles.auth_id)    │
│ address_id (FK)                    │
│ status                             │
│ subtotal, tax, shipping, total     │
│ payment_status                     │
│ created_at                         │
└────────────────────────────────────┘
         │
         │ 1:N
         │
┌────────────────────┐
│ order_items        │
├────────────────────┤
│ id (PK)            │
│ order_id (FK)      │
│ product_id (FK)    │
│ qty, unit_price    │
└────────────────────┘


┌──────────────────────┐
│ products             │
├──────────────────────┤
│ id (PK)              │
│ name, description    │
│ price, stock         │
│ category_id (FK)     │
│ is_active            │
└──────────────────────┘


┌──────────────────────────────────────┐
│ services                             │
├──────────────────────────────────────┤
│ id (PK)                              │
│ name, description                    │
│ base_price                           │
│ category_id (FK)                     │
│ duration_minutes                     │
│ is_active                            │
└──────────────────────────────────────┘
         │
         │ 1:N
         │
┌─────────────────────────┐
│ service_options         │ (Customizable add-ons)
├─────────────────────────┤
│ id (PK)                 │
│ service_id (FK)         │
│ name (e.g., "Door...")  │
│ description             │
│ price                   │
│ duration_minutes        │
│ display_order           │
│ is_active               │
└─────────────────────────┘


┌──────────────────────────────────────┐
│ bookings                             │
├──────────────────────────────────────┤
│ id (PK)                              │
│ user_id (FK → profiles.auth_id)      │
│ service_id (FK)                      │
│ address_id (FK)                      │
│ scheduled_date, start_time, end_time │
│ total_price, total_duration          │
│ status                               │
│ notes                                │
│ created_at                           │
└──────────────────────────────────────┘
         │
         ├─────────────────┐
         │                 │
    1:N  │                 │ 1:N
         │                 │
┌────────────────────┐  ┌─────────────────────────┐
│ booking_items      │  │ booking_assignments     │
├────────────────────┤  ├─────────────────────────┤
│ id (PK)            │  │ id (PK)                 │
│ booking_id (FK)    │  │ booking_id (FK)         │
│ service_option_id  │  │ worker_id (FK)          │
│ option_name        │  │ assigned_by (FK)        │◄── admin_profile_id
│ price (snapshot)   │  │ status                  │
│ quantity           │  │ assigned_at             │
└────────────────────┘  └─────────────────────────┘


┌────────────────────────────────┐
│ worker_service_capacity        │
├────────────────────────────────┤
│ id (PK)                        │
│ worker_id (FK)                 │
│ service_category_id (FK)       │
│ max_bookings_per_day           │
│ max_concurrent_bookings        │
│ is_active                      │
└────────────────────────────────┘


┌────────────────────────────────┐
│ notifications                  │
├────────────────────────────────┤
│ id (PK)                        │
│ user_id or worker_id (FK)      │
│ type (email, sms, in_app)      │
│ template (booking_confirmation)│
│ subject, body, metadata        │
│ status (pending, sent, failed) │
│ sent_at, created_at            │
└────────────────────────────────┘


┌────────────────────────────────┐
│ payments                       │
├────────────────────────────────┤
│ id (PK)                        │
│ order_id or booking_id (FK)    │
│ provider (ozow, stripe, etc)   │
│ status (initiated, paid, etc)  │
│ amount, currency               │
│ transaction_ref                │
│ created_at                     │
└────────────────────────────────┘
```

---

## 📋 Complete Tables Definition

### Enum Types

```sql
-- Profile Status Enum
CREATE TYPE profile_status AS ENUM ('active', 'inactive', 'suspended');

-- Booking Status Enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled');

-- User Role Enum
CREATE TYPE user_role AS ENUM ('admin', 'user', 'worker');

-- Payment Status Enum
CREATE TYPE payment_status AS ENUM ('initiated', 'pending', 'paid', 'failed', 'refunded');

-- Notification Status Enum
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'read');

-- Order Status Enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
```

---

### 1️⃣ **IDENTITY & AUTHENTICATION**

#### `profiles` (Primary Auth Table)

```sql
CREATE TABLE profiles (
  auth_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'worker')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Primary identity table for all users (admin, user, worker)';
COMMENT ON COLUMN profiles.role IS 'User role: admin has full access, user is customer, worker is service provider';
COMMENT ON COLUMN profiles.status IS 'Account status - suspended workers cannot accept new bookings';
```

**Indexes:**

```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_email ON profiles(email);
```

---

#### `workers` (Worker-Specific Data)

```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(auth_id) ON DELETE CASCADE,
  phone VARCHAR(20),
  address TEXT,
  service_category_id UUID REFERENCES service_categories(id),
  rating_avg DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  hourly_rate DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE workers IS 'Worker-specific details. Profile contains auth data, this table contains role-specific data';
COMMENT ON COLUMN workers.profile_id IS 'Link to profiles table (1:1 relationship)';
COMMENT ON COLUMN workers.rating_avg IS 'Average rating from completed bookings (0-5 stars)';
```

**Indexes:**

```sql
CREATE INDEX idx_workers_profile_id ON workers(profile_id);
CREATE INDEX idx_workers_service_category ON workers(service_category_id);
CREATE INDEX idx_workers_is_active ON workers(is_active);
```

---

#### `user_profile` (User-Specific Data)

```sql
CREATE TABLE user_profile (
  user_id UUID PRIMARY KEY REFERENCES profiles(auth_id) ON DELETE CASCADE,
  phone VARCHAR(20),
  default_address_id UUID REFERENCES addresses(id),
  payment_method VARCHAR(50) CHECK (payment_method IN ('card', 'wallet', 'bank_transfer')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_profile IS 'Additional customer details. Only for role=user';
COMMENT ON COLUMN user_profile.payment_method IS 'Preferred payment method for orders';
```

**Indexes:**

```sql
CREATE INDEX idx_user_profile_user_id ON user_profile(user_id);
```

---

### 2️⃣ **ADDRESSES**

```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(auth_id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL, -- e.g., 'Home', 'Office', 'Other'
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL, -- SA Provinces: Gauteng, Western Cape, KwaZulu-Natal, etc
  postal_code VARCHAR(20) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE addresses IS 'Multiple delivery/service addresses per user (South Africa only)';
COMMENT ON COLUMN addresses.province IS 'South African provinces only';
```

**Indexes:**

```sql
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(user_id, is_default);
```

**Unique Constraint:**

```sql
ALTER TABLE addresses ADD CONSTRAINT one_default_per_user
  UNIQUE (user_id, is_default) WHERE is_default = TRUE;
```

---

### 3️⃣ **E-COMMERCE: PRODUCTS & ORDERS**

#### `product_categories`

```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id UUID NOT NULL REFERENCES product_categories(id),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE products IS 'E-commerce products (not services)';
COMMENT ON COLUMN products.stock IS 'Inventory count - decremented on order';
```

**Indexes:**

```sql
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);
```

---

#### `orders`

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(auth_id) ON DELETE RESTRICT,
  address_id UUID NOT NULL REFERENCES addresses(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
  shipping_fee DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= subtotal),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'E-commerce product orders (not service bookings)';
```

**Indexes:**

```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_address_id ON orders(address_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

---

#### `order_items`

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price = quantity * unit_price),
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE order_items IS 'Line items in each order (snapshot of product + price)';
```

**Indexes:**

```sql
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

---

### 4️⃣ **HOME SERVICES: SERVICES & BOOKINGS**

#### `service_categories`

```sql
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE service_categories IS 'Service categories: House Cleaning, AC Repair, Plumbing, etc';
```

---

#### `services`

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  category_id UUID NOT NULL REFERENCES service_categories(id),
  duration_minutes INT DEFAULT 60 CHECK (duration_minutes > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Base services (House Cleaning, AC Repair). Actual price includes add-on options';
COMMENT ON COLUMN services.base_price IS 'Starting price - can be 0 if all pricing from options';
COMMENT ON COLUMN services.duration_minutes IS 'Base duration - extended by selected options';
```

**Indexes:**

```sql
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_is_active ON services(is_active);
```

---

#### `service_options` (Add-ons/Customizations)

```sql
CREATE TABLE service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  duration_minutes INT DEFAULT 0 CHECK (duration_minutes >= 0),
  is_required BOOLEAN DEFAULT FALSE,
  display_order INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE service_options IS 'Customizable options/add-ons for each service';
COMMENT ON COLUMN service_options.name IS 'E.g., Washing Machine Clean, Door Cleaning, Gas Refill';
COMMENT ON COLUMN service_options.price IS 'Additional cost beyond base_price';
COMMENT ON COLUMN service_options.duration_minutes IS 'Additional time needed for this option';
COMMENT ON COLUMN service_options.is_required IS 'Some services require at least one option';
```

**Indexes:**

```sql
CREATE INDEX idx_service_options_service_id ON service_options(service_id);
CREATE INDEX idx_service_options_is_active ON service_options(is_active);
```

---

#### `bookings` (Service Orders)

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(auth_id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id),
  address_id UUID NOT NULL REFERENCES addresses(id),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  total_duration INT NOT NULL CHECK (total_duration > 0),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE bookings IS 'Service booking requests (like orders but for services)';
COMMENT ON COLUMN bookings.total_price IS 'Calculated: base_price + SUM(selected_options.price)';
COMMENT ON COLUMN bookings.total_duration IS 'Calculated: base_duration + SUM(selected_options.duration)';
COMMENT ON COLUMN bookings.status IS 'pending=awaiting confirmation, assigned=worker assigned, in_progress=service happening';
```

**Indexes:**

```sql
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_address_id ON bookings(address_id);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
```

---

#### `booking_items` (Selected Options - Snapshot)

```sql
CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_option_id UUID NOT NULL REFERENCES service_options(id),
  option_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INT DEFAULT 0,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE booking_items IS 'Selected options for each booking (price/name snapshot at booking time)';
COMMENT ON COLUMN booking_items.option_name IS 'Copied at booking time - preserves if option name changes later';
COMMENT ON COLUMN booking_items.price IS 'Copied at booking time - preserves if option price changes later';
```

**Indexes:**

```sql
CREATE INDEX idx_booking_items_booking_id ON booking_items(booking_id);
CREATE INDEX idx_booking_items_service_option_id ON booking_items(service_option_id);
```

---

#### `worker_service_capacity` (Slot Management)

```sql
CREATE TABLE worker_service_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  service_category_id UUID NOT NULL REFERENCES service_categories(id),
  max_bookings_per_day INT DEFAULT 3 CHECK (max_bookings_per_day > 0),
  max_concurrent_bookings INT DEFAULT 1 CHECK (max_concurrent_bookings > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE worker_service_capacity IS 'Define how many bookings each worker can handle per category';
COMMENT ON COLUMN worker_service_capacity.max_bookings_per_day IS 'E.g., house cleaner can handle 3 cleanings/day';
COMMENT ON COLUMN worker_service_capacity.max_concurrent_bookings IS 'How many can be ongoing at same time (usually 1)';
```

**Indexes:**

```sql
CREATE INDEX idx_worker_capacity_worker_id ON worker_service_capacity(worker_id);
CREATE INDEX idx_worker_capacity_service_category ON worker_service_capacity(service_category_id);
CREATE UNIQUE INDEX idx_worker_capacity_unique ON worker_service_capacity(worker_id, service_category_id);
```

---

#### `booking_assignments` (Worker Assignment - WITH ADMIN LINK)

```sql
CREATE TABLE booking_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  assigned_by UUID NOT NULL REFERENCES profiles(auth_id),
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE booking_assignments IS 'Track which admin assigned which worker to which booking';
COMMENT ON COLUMN booking_assignments.assigned_by IS 'ADMIN PROFILE ID - which admin made this assignment';
COMMENT ON COLUMN booking_assignments.worker_id IS 'Which worker was assigned';
```

**Indexes:**

```sql
CREATE INDEX idx_booking_assignments_booking_id ON booking_assignments(booking_id);
CREATE INDEX idx_booking_assignments_worker_id ON booking_assignments(worker_id);
CREATE INDEX idx_booking_assignments_assigned_by ON booking_assignments(assigned_by);
CREATE INDEX idx_booking_assignments_status ON booking_assignments(status);
```

---

### 5️⃣ **NOTIFICATIONS & COMMUNICATION**

#### `notifications`

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(auth_id) ON DELETE CASCADE,
  recipient_type VARCHAR(50) CHECK (recipient_type IN ('user', 'worker', 'admin')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'in_app')),
  template VARCHAR(100) NOT NULL CHECK (template IN ('booking_confirmation', 'worker_assignment', 'booking_complete', 'payment_success', 'booking_cancelled')),
  subject VARCHAR(255),
  body TEXT NOT NULL,
  metadata JSONB,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'read')),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Email/SMS/in-app notifications. Tracks all communication';
COMMENT ON COLUMN notifications.metadata IS 'JSON: {booking_id, worker_id, order_id, etc}';
```

**Indexes:**

```sql
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

### 6️⃣ **PAYMENTS**

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  booking_id UUID REFERENCES bookings(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'ZAR', -- South African Rand
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('ozow', 'bank_transfer')),
  status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'paid', 'failed', 'refunded')),
  transaction_ref VARCHAR(255) UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE payments IS 'Payment transactions for orders and bookings (Ozow for SA)';
COMMENT ON COLUMN payments.order_id IS 'Foreign key if payment for product order';
COMMENT ON COLUMN payments.booking_id IS 'Foreign key if payment for service booking';
COMMENT ON COLUMN payments.transaction_ref IS 'Ozow reference or bank transfer reference';

ALTER TABLE payments ADD CONSTRAINT either_order_or_booking
  CHECK (
    (order_id IS NOT NULL AND booking_id IS NULL)
    OR (order_id IS NULL AND booking_id IS NOT NULL)
  );
```

**Indexes:**

```sql
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

---

### 7️⃣ **WORKER AVAILABILITY & TIME OFF**

#### `worker_availability` (Working Hours)

```sql
CREATE TABLE worker_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE worker_availability IS 'Weekly schedule: 0=Monday, 6=Sunday';
```

**Indexes:**

```sql
CREATE INDEX idx_worker_availability_worker_id ON worker_availability(worker_id);
CREATE UNIQUE INDEX idx_worker_availability_schedule ON worker_availability(worker_id, weekday);
```

---

#### `worker_timeoff` (Holidays/Vacation)

```sql
CREATE TABLE worker_timeoff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason VARCHAR(255),
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE worker_timeoff IS 'Days when worker is not available';
```

**Indexes:**

```sql
CREATE INDEX idx_worker_timeoff_worker_id ON worker_timeoff(worker_id);
CREATE INDEX idx_worker_timeoff_date ON worker_timeoff(date);
CREATE UNIQUE INDEX idx_worker_timeoff_unique ON worker_timeoff(worker_id, date);
```

---

## 🔐 Row Level Security (RLS) Policies - Outline

### profiles Table

```
- Authenticated users can READ their own profile
- Admins can READ all profiles
- Admins can UPDATE any profile
```

### bookings Table

```
- Users can READ/CREATE their own bookings
- Workers can READ bookings assigned to them
- Admins can READ/UPDATE all bookings
```

### orders Table

```
- Users can READ their own orders
- Admins can READ all orders
```

### addresses Table

```
- Users can READ/CREATE/UPDATE/DELETE their own addresses
- Admins can READ all addresses
```

### notifications Table

```
- Recipients can READ their own notifications
- System (service role) can INSERT notifications
```

---

## 📍 Key Relationships Summary

| From                | To                      | Relationship               | Purpose                      |
| ------------------- | ----------------------- | -------------------------- | ---------------------------- |
| profiles            | workers                 | 1:1 (auth_id → profile_id) | Identity to worker role      |
| profiles            | user_profile            | 1:1 (auth_id → user_id)    | Identity to customer data    |
| profiles            | addresses               | 1:N (auth_id → user_id)    | Multiple addresses per user  |
| profiles            | bookings                | 1:N (auth_id → user_id)    | Customer makes many bookings |
| profiles            | orders                  | 1:N (auth_id → user_id)    | Customer places many orders  |
| bookings            | booking_items           | 1:N                        | One booking has many options |
| bookings            | booking_assignments     | 1:N                        | Track assignment history     |
| booking_assignments | profiles                | N:1 (assigned_by)          | **ADMIN who assigned**       |
| booking_assignments | workers                 | N:1 (worker_id)            | Worker assigned              |
| services            | service_options         | 1:N                        | Service has many options     |
| orders              | order_items             | 1:N                        | Order has many line items    |
| workers             | worker_service_capacity | 1:N                        | Worker capacity per category |
| payments            | orders                  | N:1                        | Payment for order            |
| payments            | bookings                | N:1                        | Payment for booking          |

---

## ⚡ Critical Constraints & Validations

### Admin Profile

```
- admin.profile_id = profiles.auth_id where role='admin'
- Stores ONLY: auth_id, full_name, email, avatar_url, role, status
- NO extra fields needed on admin profile
- Admin identity tracked in booking_assignments.assigned_by
```

### User Profile

```
- user.user_id = profiles.auth_id where role='user'
- Extended data in user_profile table (phone, address, payment method)
- Can have multiple addresses (1:N)
```

### Worker

```
- worker.profile_id = profiles.auth_id where role='worker'
- Worker capacity defined in worker_service_capacity
- Availability defined in worker_availability
- Time off tracked in worker_timeoff
```

### Booking Totals

```
- total_price = services.base_price + SUM(booking_items.price)
- total_duration = services.duration_minutes + SUM(booking_items.duration_minutes)
- CALCULATED AT BOOKING TIME, stored as snapshot
```

### Slot Availability

```
Available Slots =
  SUM(worker_service_capacity.max_bookings_per_day)
  WHERE service_category_id = X AND date = Y AND status != 'cancelled'
  MINUS
  COUNT(bookings) WHERE service.category_id = X AND scheduled_date = Y AND status IN ('confirmed', 'in_progress', 'completed')
```

---

## 📊 Data Flow Examples

### Example 1: User Books House Cleaning

```
1. User selects: "House Cleaning" (base_price: 0)
   ├─ Option: "Washing Machine Clean" ($50, +20 mins)
   ├─ Option: "Door Cleaning" ($40, +15 mins)
   └─ Option: "Kitchen Deep Clean" ($60, +30 mins)

2. System calculates:
   total_price = 0 + 50 + 40 + 60 = $150
   total_duration = 60 + 20 + 15 + 30 = 125 mins

3. INSERT booking:
   {id, user_id, service_id, scheduled_date: '2026-02-10',
    total_price: 150, total_duration: 125, status: 'pending'}

4. INSERT booking_items (3 rows):
   {booking_id, service_option_id, option_name: 'Washing...', price: 50, ...}
   {booking_id, service_option_id, option_name: 'Door...', price: 40, ...}
   {booking_id, service_option_id, option_name: 'Kitchen...', price: 60, ...}

5. CREATE notification:
   {recipient_id: user.id, template: 'booking_confirmation', status: 'pending'}
```

---

### Example 2: Admin Assigns Worker & Email Sent

```
1. Admin sees booking #456 (pending, 2026-02-10, House Cleaning)

2. Admin checks availability:
   SELECT COUNT(*) FROM bookings
   WHERE service.category_id = 'house-clean'
   AND scheduled_date = '2026-02-10'
   AND status IN ('confirmed', 'assigned')
   -- Result: 4 bookings

   SELECT SUM(max_bookings_per_day) FROM worker_service_capacity
   WHERE service_category_id = 'house-clean'
   -- Result: 6 max slots (2 workers × 3 each)

   Available = 6 - 4 = 2 slots ✓ AVAILABLE

3. Admin assigns Worker A:
   INSERT booking_assignments:
   {id, booking_id: 456, worker_id: 'worker-A',
    assigned_by: admin_profile_id, status: 'assigned', assigned_at: NOW()}

4. UPDATE booking status:
   {id: 456, status: 'assigned'}

5. CREATE notification:
   {recipient_id: worker_A.profile_id,
    template: 'worker_assignment',
    body: 'You have been assigned House Cleaning on Feb 10...',
    metadata: {booking_id: 456, customer_name: '...', address: '...'},
    status: 'pending'}

6. Email service picks up pending notification:
   - Send email to worker
   - UPDATE notification {status: 'sent', sent_at: NOW()}
```

---

### Example 3: User Orders Products

```
1. User adds to cart:
   ├─ Product A (qty: 2, price: $50 each)
   ├─ Product B (qty: 1, price: $30)

2. User selects address & checkout:

3. INSERT order:
   {id, user_id, address_id, status: 'pending',
    subtotal: 130, tax: 13, shipping: 50, total: 193}

4. INSERT order_items (2 rows):
   {order_id, product_id: A, qty: 2, unit_price: 50, total_price: 100}
   {order_id, product_id: B, qty: 1, unit_price: 30, total_price: 30}

5. Process payment via Ozow:
   INSERT payments:
   {id, order_id, amount: 193, provider: 'ozow', status: 'initiated'}

6. After Ozow callback:
   UPDATE payments {status: 'paid', transaction_ref: '...'}
   UPDATE order {status: 'confirmed', payment_status: 'paid'}
   CREATE notification {template: 'payment_success'}
```

---

## 🎯 Summary

| Aspect            | Details                                                   |
| ----------------- | --------------------------------------------------------- |
| **Auth Table**    | `profiles` - single source of identity                    |
| **Admin**         | Just a profile with role='admin', no extra fields         |
| **User**          | Profile + user_profile (phone, address, payment)          |
| **Worker**        | Profile + workers (service_category, rating, hourly_rate) |
| **Services**      | Customizable with service_options (add-ons)               |
| **Bookings**      | booking_items snapshot selected options                   |
| **Slots**         | worker_service_capacity + daily calculation               |
| **Assignments**   | booking_assignments.assigned_by = admin profile_id        |
| **Notifications** | All email/SMS/in-app tracked in notifications table       |
| **Payments**      | One table for orders + bookings                           |

---

**This structure is:**

- ✅ Flexible (add more options, workers, categories anytime)
- ✅ Scalable (handles thousands of bookings/orders)
- ✅ Auditable (tracks who assigned what)
- ✅ Snapshot-safe (prices locked at booking time)
- ✅ Slot-managed (capacity-aware scheduling)
- ✅ Communication-tracked (all notifications logged)

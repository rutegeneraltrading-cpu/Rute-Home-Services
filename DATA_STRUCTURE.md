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
│ slug                 │
│ price, sale_price    │
│ brand, sku           │
│ attributes (JSONB)   │
│ stock                │
│ category_id (FK)     │
│ image_url (primary)  │
│ is_active            │
└──────────────────────┘

┌──────────────────────┐
│ product_images       │
├──────────────────────┤
│ id (PK)              │
│ product_id (FK)      │
│ url                  │
│ sort_order           │
│ is_primary           │
└──────────────────────┘


┌──────────────────────────────────────────────────────────────┐
│                    SERVICE HIERARCHY                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│ service_categories               │
├──────────────────────────────────┤
│ id (PK)                          │
│ name (House Cleaning, etc)       │
│ slug, description, image_url     │
│ is_active
| bookings                         │
│ charge_type (ENUM: 'hourly', 'day') │
└──────────────────────────────────┘
         ▲
         │
    1:N  │
         │
┌──────────────────────────────────────┐
│ services                             │
├──────────────────────────────────────┤
│ id (PK)                              │
│ name (Basic Clean, Deep Clean)       │
│ base_price                           │
│ category_id (FK) ◄─┘                 │
│ duration_minutes                     │
│ is_active                            │
└──────────────────────────────────────┘
         │
         │ 1:N
         │
┌─────────────────────────┐
│ service_options         │ (Add-ons: Washing Machine, Door Clean)
├─────────────────────────┤
│ id (PK)                 │
│ service_id (FK) ◄──┘    │
│ name                    │
│ price, duration         │
│ is_active               │
└─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    WORKER SERVICE LINKS                       │
└──────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   workers    │
                    │              │
                    │ (Ahmed,      │
                    │  Fatima)     │
                    └──────────────┘
                          │
                          │ 1:N
                          │
    ┌─────────────────────────────────────┐
    │ worker_services ⭐                  │ (New Design!)
    ├─────────────────────────────────────┤
    │ id (PK)                             │
    │ worker_id (FK) ◄───┘ (1:N)          │
    │ service_id (FK) ──┘ (N:1)           │
    │ is_active                           │
    └─────────────────────────────────────┘
                          │
                          │
                    ┌─────▼─────────┐
                    │   services    │ ◄─ (Can be from any category!)
                    │               │
                    │ (Basic Clean, │
                    │  Deep Clean,  │
                    │  Wall Repair, │
                    │  etc)         │
                    └───────────────┘
                          │
                    ┌─────▼────────────┐
                    │ service_categories
                    │ (House Cleaning, │
                    │  House Repair,   │
                    │  Elder Care)     │
                    └──────────────────┘
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
         ▲
         │
┌─────────────────────────────────────────────────┐ 1:N
│ worker_services ⭐                              │◄──────┐
├─────────────────────────────────────────────────┤       │
│ id (PK)                                         │       │
│ worker_id (FK)                                  │       │
│ service_id (FK)                                 │       │
│ is_active                                       │       │ 1:N
└─────────────────────────────────────────────────┘       │
         ▲                                                 │
         │                                          ┌──────────────┐
         └──────────────────────────────────────────│   workers    │
                                                    └──────────────┘
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


## 📍 Key Relationships Summary

| From                | To                      | Relationship               | Purpose                                |
| ------------------- | ----------------------- | -------------------------- | -------------------------------------- |
| profiles            | workers                 | 1:1 (auth_id → profile_id) | Identity to worker role                |
| profiles            | user_profile            | 1:1 (auth_id → user_id)    | Identity to customer data              |
| profiles            | addresses               | 1:N (auth_id → user_id)    | Multiple addresses per user            |
| profiles            | bookings                | 1:N (auth_id → user_id)    | Customer makes many bookings           |
| profiles            | orders                  | 1:N (auth_id → user_id)    | Customer places many orders            |
| bookings            | booking_items           | 1:N                        | One booking has many options           |
| bookings            | booking_assignments     | 1:N                        | Track assignment history               |
| booking_assignments | profiles                | N:1 (assigned_by)          | **ADMIN who assigned**                 |
| booking_assignments | workers                 | N:1 (worker_id)            | Worker assigned                        |
| **workers**         | **worker_services**     | **1:N** ⭐ NEW DESIGN      | **Worker provides multiple services**  |
| **worker_services** | **services**            | **N:1** ⭐ NEW DESIGN      | **Services from any category**         |
| **services**        | **service_categories**  | **N:1** ⭐ RELINKED        | **Service belongs to category**        |
| services            | service_options         | 1:N                        | Service has many customization options |
| workers             | worker_service_capacity | 1:N                        | Worker capacity per category           |
| orders              | order_items             | 1:N                        | Order has many line items              |
| payments            | orders                  | N:1                        | Payment for order                      |
| payments            | bookings                | N:1                        | Payment for booking                    |

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
- Services linked via worker_services → services (can be from multiple categories!)
- NO service_category_id on workers table anymore
- Worker capacity defined in worker_service_capacity (per category)
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

| Aspect              | Details                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| **Auth Table**      | `profiles` - single source of identity                                         |
| **Admin**           | Just a profile with role='admin', no extra fields                              |
| **User**            | Profile + user_profile (phone, address, payment)                               |
| **Worker**          | Profile + workers (phone, address, rating, hourly_rate) - **No category_id**   |
| **Services Flow**   | **service_categories → services → service_options (linked together)**          |
| **Worker-Services** | **⭐ Replaces old design: worker_services links workers to specific services** |
| **Multi-Category**  | **Worker can provide services from ANY category via worker_services**          |
| **Bookings**        | booking_items snapshot selected options                                        |
| **Slots**           | worker_service_capacity + daily calculation per category                       |
| **Assignments**     | booking_assignments.assigned_by = admin profile_id                             |
| **Notifications**   | All email/SMS/in-app tracked in notifications table                            |
| **Payments**        | One table for orders + bookings                                                |

---

**This structure is:**

- ✅ Flexible (add more options, workers, categories anytime)
- ✅ Scalable (handles thousands of bookings/orders)
- ✅ Auditable (tracks who assigned what)
- ✅ Snapshot-safe (prices locked at booking time)
- ✅ Slot-managed (capacity-aware scheduling)
- ✅ Communication-tracked (all notifications logged)
- ✅ **Multi-Category-Ready (workers can provide services from different categories)**
- ✅ **Future-Proof (workers can self-manage via worker_services)**

---

## 📋 Admin Setup Flow (Current & Future-Ready)

### **Phase 1: Define Service Catalog (Admin Only)**

```
Step 1: CREATE service_categories
   INSERT → House Cleaning
   INSERT → House Repair
   INSERT → Mom's Helper
   INSERT → Elder Care

Step 2: CREATE services (under categories)
   INSERT → House Cleaning: "Basic Clean" ($50, 2hrs)
   INSERT → House Cleaning: "Deep Clean" ($100, 4hrs)
   INSERT → House Repair: "Wall Repair" ($75, 3hrs)
   INSERT → Elder Care: "Bathing Service" ($60, 1.5hrs)

Step 3: CREATE service_options (customizations)
   INSERT → Basic Clean: "Washing Machine" (+$20, +30min)
   INSERT → Basic Clean: "Door Cleaning" (+$15, +20min)
   INSERT → Deep Clean: "Carpet Cleaning" (+$40, +45min)
   INSERT → Wall Repair: "Paint" (+$30, +1hr)
```

### **Phase 2: Register & Assign Workers (Admin Only)**

```
Step 4: CREATE workers (register new workers)
   INSERT → Ahmed (profile_id: auth_123, hourly_rate: $15)
   INSERT → Fatima (profile_id: auth_456, hourly_rate: $18)
   INSERT → Malik (profile_id: auth_789, hourly_rate: $20)

Step 5: ASSIGN SERVICES TO WORKERS ⭐ (Can be from ANY category!)
   INSERT worker_services → Ahmed + "Basic Clean" (✓ active) [House Cleaning]
   INSERT worker_services → Ahmed + "Deep Clean" (✓ active) [House Cleaning]
   INSERT worker_services → Fatima + "Wall Repair" (✓ active) [House Repair]
   INSERT worker_services → Malik + "Bathing Service" (✓ active) [Elder Care]

Step 6: SET WORKER CAPACITY (per category - they may have multiple!)
   INSERT worker_service_capacity → Ahmed (House Cleaning: 3/day, 1 concurrent)
   INSERT worker_service_capacity → Fatima (House Repair: 2/day, 1 concurrent)
   INSERT worker_service_capacity → Malik (Elder Care: 2/day, 1 concurrent)
```

### **Phase 3: User Books Service**

```
Step 7: User selects service + options
   User: "Basic Clean" + "Washing Machine" + "Door Cleaning"
   Total: $50 + $20 + $15 = $85 | Duration: 2hr + 30min + 20min = 170min

Step 8: SYSTEM FINDS AVAILABLE WORKERS ⭐ NEW LOGIC
   Query worker_services WHERE service_id = 'basic-clean'
   Results: Ahmed (House Cleaning category, 3/day available) ✓

   Check worker_service_capacity for Ahmed:
   - House Cleaning category: max 3/day
   - Check if Ahmed has available slots today
   - Yes: Ahmed available ✓

   → Only Ahmed can provide this service (and has capacity)

Step 9: Admin assigns worker
   INSERT booking_assignments → booking: 456, worker: Ahmed, assigned_by: admin
```

### **Phase 3b (Future): Worker Self-Management**

```
When workers get access to their own profile:

Worker Management:
   Ahmed can:
   ├─ View assigned services ✓
   ├─ See services from multiple categories ✓
   ├─ Enable/disable services they offer (UPDATE worker_services.is_active)
   ├─ View bookings assigned to them ✓
   └─ Cannot create/delete services (admin-controlled)

System automatically filters:
   If worker_services.is_active = FALSE
   → Service NOT shown to users
   → User cannot book this worker for that service
```

**Result:** Clean separation + Multi-Category Support:

- **Admin Control:** Categories, Services, Options, Worker Registration
- **Admin Assignment:** Which services each worker provides (any category!)
- **Multi-Category:** Worker can provide services from House Cleaning AND House Repair AND Elder Care
- **Capacity:** Per category (different limits for different services)
- **Future Worker Agency:** Can enable/disable their services (no deletions)
- **System Automation:** Auto-finds available workers based on worker_services + category capacity
- ✅ **Completely Flexible & Future-Proof**

# Entity Relationship Diagram Summary

## 📊 Visual ERD Overview

### **Core Entity Groups & Relationships**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LOOKUP TABLES │    │  CORE ENTITIES  │    │ BOOKING SYSTEM  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • user_types    │───▶│ • users         │───▶│ • enquiries     │
│ • enquiry_status│    │ • performers    │    │ • bookings      │
│ • booking_status│    │ • categories    │    │ • transactions  │
│ • transaction_  │    │ • performer_    │    │ • booking_      │
│   types         │    │   categories    │    │   status_events │
└─────────────────┘    │ • performer_    │    └─────────────────┘
                       │   media         │
                       │ • performer_    │
                       │   pricing       │
                       └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MESSAGING     │    │ REVIEWS & SOCIAL│    │ ADMIN & PLATFORM│
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • message_      │    │ • reviews       │    │ • admin_actions │
│   threads       │    │ • review_votes  │    │ • platform_     │
│ • messages      │    │ • testimonials  │    │   settings      │
└─────────────────┘    │ • saved_        │    └─────────────────┘
                       │   performers    │
                       │ • search_       │
                       │   history       │
                       └─────────────────┘
```

## 🔗 Key Relationships & Cardinality

### **Primary Relationships**

| From Entity | Relationship | To Entity | Cardinality | Description |
|-------------|--------------|-----------|-------------|-------------|
| **user_types** | defines | **users** | 1:M | Each user has one type |
| **users** | becomes | **performers** | 1:0..1 | User can be a performer |
| **performers** | belongs to | **categories** | M:N | Via performer_categories |
| **enquiries** | becomes | **bookings** | 1:0..M | Enquiry can have multiple booking attempts |
| **bookings** | has | **transactions** | 1:M | Multiple transactions per booking |
| **bookings** | tracked by | **booking_status_events** | 1:M | Complete audit trail |
| **enquiries** | reviewed in | **reviews** | 1:0..1 | One review per enquiry |

### **Stripe Integration Points**

| Entity | Stripe Fields | Purpose |
|--------|---------------|---------|
| **performers** | `stripe_account_id` | Connect account for payouts |
| **bookings** | `stripe_payment_intent_id`<br>`stripe_customer_id`<br>`stripe_account_id` | Payment processing |
| **transactions** | `stripe_transaction_id`<br>`stripe_transfer_id`<br>`stripe_charge_id` | Payment reconciliation |

### **Business Logic Constraints**

- ✅ **One Review Per Enquiry**: Each enquiry can only have one review
- ✅ **Booking Status Audit**: All status changes are logged with timestamps
- ✅ **Platform Fee Tracking**: Every booking tracks platform fees and performer payouts
- ✅ **Message Threading**: Messages linked to either enquiries or bookings
- ✅ **Performer Categories**: At least one category required (enforced in app)

## 📋 Entity Counts & Relationships

### **Lookup Tables (4)**
- `user_types` → `users` (1:M)
- `enquiry_statuses` → `enquiries` (1:M)
- `booking_statuses` → `bookings` (1:M)
- `transaction_types` → `transactions` (1:M)

### **Core Entities (8)**
- `users` (Central hub - connects to everything)
- `performers` (Extends users with business data)
- `categories` (M:N with performers)
- `performer_categories` (Junction table)
- `performer_media` (1:M from performers)
- `performer_pricing` (1:M from performers)
- `performer_availability` (1:M from performers)
- `performer_blackout_dates` (1:M from performers)

### **Booking System (4)**
- `enquiries` (Initial contact)
- `bookings` (Confirmed enquiries)
- `booking_status_events` (Audit trail)
- `transactions` (Payment tracking)

### **Communication (2)**
- `message_threads` (Conversation containers)
- `messages` (Individual messages)

### **Reviews & Social (4)**
- `reviews` (Client feedback)
- `review_votes` (Helpfulness voting)
- `testimonials` (Performer testimonials)
- `saved_performers` (Client wishlists)

### **Analytics & Admin (3)**
- `search_history` (Search analytics)
- `admin_actions` (Admin audit trail)
- `platform_settings` (Configuration)

## 🎯 Database Indexes & Performance

### **Critical Indexes**
```sql
-- Performance-critical indexes
CREATE INDEX idx_performers_location ON performers(city, county, postcode);
CREATE INDEX idx_performers_rating ON performers(average_rating DESC);
CREATE INDEX idx_performers_price ON performers(base_price);
CREATE INDEX idx_performers_active ON performers(is_active, is_verified);
CREATE INDEX idx_bookings_event_date ON bookings(event_date);
CREATE INDEX idx_bookings_status ON bookings(status_id);
CREATE INDEX idx_transactions_stripe ON transactions(stripe_transaction_id);
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
```

### **Unique Constraints**
- `performers.slug` - SEO-friendly URLs
- `bookings.booking_id` - Human-readable booking references
- `transactions.transaction_id` - Unique transaction references
- `message_threads.thread_id` - Unique thread references

This ERD represents a complete, production-ready schema for a multi-vendor performer booking platform with integrated payments, messaging, and comprehensive business logic.

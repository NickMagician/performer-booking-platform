# Entity Relationship Diagram - Performer Booking Platform

## Mermaid ERD Format

```mermaid
erDiagram
    %% =============================================
    %% LOOKUP TABLES
    %% =============================================
    
    USER_TYPES {
        int id PK
        varchar type_name UK "client, performer, admin"
        text description
        boolean is_active
        datetime created_at
    }
    
    ENQUIRY_STATUSES {
        int id PK
        varchar status_name UK "pending, responded, accepted, declined"
        text description
        int sort_order
        boolean is_active
        datetime created_at
    }
    
    BOOKING_STATUSES {
        int id PK
        varchar status_name UK "tentative, confirmed, declined, cancelled, completed"
        text description
        int sort_order
        boolean is_active
        datetime created_at
    }
    
    TRANSACTION_TYPES {
        int id PK
        varchar type_name UK "payout, platform_fee, refund, chargeback"
        text description
        boolean is_active
        datetime created_at
    }

    %% =============================================
    %% CORE ENTITIES
    %% =============================================
    
    USERS {
        int id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar phone
        int user_type_id FK
        boolean is_verified
        boolean is_active
        varchar profile_image_url
        datetime created_at
        datetime updated_at
        datetime last_login
    }
    
    CATEGORIES {
        int id PK
        varchar name UK
        varchar slug UK
        text description
        varchar icon_url
        boolean is_active
        int sort_order
        datetime created_at
        datetime updated_at
    }
    
    PERFORMERS {
        int id PK
        int user_id FK UK
        varchar stage_name
        varchar slug UK "SEO-friendly URL"
        datetime slug_updated_at
        text bio
        int years_experience
        decimal base_price
        varchar price_currency "GBP, USD, EUR"
        varchar price_type "per_event, per_hour"
        int travel_radius
        varchar address_line1
        varchar address_line2
        varchar city
        varchar county
        varchar postcode
        varchar country
        decimal latitude
        decimal longitude
        int min_performance_duration
        int max_performance_duration
        int setup_time_required
        text equipment_provided
        text space_requirements
        boolean is_professional
        boolean insurance_coverage
        boolean dbs_checked
        int total_bookings
        decimal average_rating
        int total_reviews
        decimal response_rate
        int response_time_hours
        boolean is_featured
        boolean is_verified
        boolean is_active
        int profile_completion_percentage
        datetime created_at
        datetime updated_at
    }
    
    PERFORMER_CATEGORIES {
        int id PK
        int performer_id FK
        int category_id FK
        boolean is_primary
        datetime created_at
    }
    
    PERFORMER_MEDIA {
        int id PK
        int performer_id FK
        varchar media_type "image, video, audio"
        varchar file_url
        varchar thumbnail_url
        varchar title
        text description
        boolean is_featured
        int sort_order
        int file_size
        int duration
        datetime created_at
    }
    
    PERFORMER_AVAILABILITY {
        int id PK
        int performer_id FK
        int day_of_week "0-6 (Sunday-Saturday)"
        time start_time
        time end_time
        boolean is_available
        datetime created_at
    }
    
    PERFORMER_BLACKOUT_DATES {
        int id PK
        int performer_id FK
        date start_date
        date end_date
        varchar reason
        boolean is_recurring
        datetime created_at
    }
    
    PERFORMER_PRICING {
        int id PK
        int performer_id FK
        varchar event_type "wedding, birthday, corporate"
        int duration_minutes
        varchar package_name
        decimal price
        varchar currency
        boolean is_default
        text notes
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    %% =============================================
    %% ENQUIRY & BOOKING SYSTEM
    %% =============================================
    
    ENQUIRIES {
        int id PK
        int client_id FK
        int performer_id FK
        varchar event_type
        date event_date
        time event_start_time
        int event_duration
        int guest_count
        varchar venue_name
        text venue_address
        varchar venue_city
        varchar venue_postcode
        text message
        decimal budget_min
        decimal budget_max
        text special_requirements
        int status_id FK
        text performer_response
        decimal quoted_price
        datetime created_at
        datetime responded_at
        datetime updated_at
    }
    
    BOOKINGS {
        int id PK
        varchar booking_id UK "BK-2024-001"
        int enquiry_id FK
        int client_id FK
        int performer_id FK
        int status_id FK
        datetime confirmed_at
        datetime cancelled_at
        datetime completed_at
        decimal price_agreed
        varchar currency
        decimal deposit_amount
        decimal deposit_percentage
        datetime deposit_paid_at
        datetime final_payment_due_at
        decimal payout_due_to_performer
        decimal platform_fee
        decimal platform_fee_percentage
        varchar stripe_payment_intent_id "Stripe integration"
        varchar stripe_customer_id "Stripe integration"
        varchar stripe_account_id "Stripe Connect"
        date event_date
        time event_start_time
        int event_duration
        varchar venue_name
        text venue_address
        text cancellation_reason
        text special_requirements
        text internal_notes
        int updated_by FK
        datetime created_at
        datetime updated_at
    }
    
    BOOKING_STATUS_EVENTS {
        int id PK
        int booking_id FK
        int old_status_id FK
        int new_status_id FK
        int changed_by FK
        text reason
        json metadata
        datetime created_at
    }
    
    TRANSACTIONS {
        int id PK
        varchar transaction_id UK "TXN-2024-001"
        int booking_id FK
        int performer_id FK
        int client_id FK
        int type_id FK
        decimal amount
        varchar currency
        varchar stripe_transaction_id "Stripe integration"
        varchar stripe_transfer_id "Stripe integration"
        varchar stripe_charge_id "Stripe integration"
        varchar status "pending, succeeded, failed"
        text failure_reason
        text description
        json metadata
        datetime processed_at
        datetime created_at
        datetime updated_at
    }

    %% =============================================
    %% MESSAGING SYSTEM
    %% =============================================
    
    MESSAGE_THREADS {
        int id PK
        varchar thread_id UK "THR-2024-001"
        int enquiry_id FK
        int booking_id FK
        int client_id FK
        int performer_id FK
        varchar subject
        boolean is_archived
        datetime last_message_at
        datetime created_at
        datetime updated_at
    }
    
    MESSAGES {
        int id PK
        int thread_id FK
        int sender_user_id FK
        text message_text
        json attachments
        boolean is_system_message
        datetime read_by_client_at
        datetime read_by_performer_at
        varchar message_type "text, image, file, system"
        datetime edited_at
        datetime created_at
        datetime updated_at
    }

    %% =============================================
    %% REVIEWS & TESTIMONIALS
    %% =============================================
    
    REVIEWS {
        int id PK
        int enquiry_id FK UK
        int client_id FK
        int performer_id FK
        int rating "1-5 stars"
        varchar title
        text review_text
        varchar event_type
        date event_date
        int professionalism_rating "1-5"
        int quality_rating "1-5"
        int value_rating "1-5"
        int communication_rating "1-5"
        boolean is_verified
        boolean is_featured
        boolean is_visible
        text performer_response
        datetime performer_responded_at
        datetime created_at
        datetime updated_at
    }
    
    REVIEW_VOTES {
        int id PK
        int review_id FK
        int user_id FK
        boolean is_helpful
        datetime created_at
    }
    
    TESTIMONIALS {
        int id PK
        int performer_id FK
        varchar client_name
        varchar client_title
        text testimonial_text
        varchar event_type
        boolean is_featured
        boolean is_verified
        int sort_order
        datetime created_at
    }

    %% =============================================
    %% USER INTERACTIONS
    %% =============================================
    
    SAVED_PERFORMERS {
        int id PK
        int client_id FK
        int performer_id FK
        datetime created_at
    }
    
    SEARCH_HISTORY {
        int id PK
        int user_id FK
        varchar session_id
        varchar search_query
        int category_id FK
        varchar location
        decimal price_min
        decimal price_max
        int results_count
        datetime created_at
    }

    %% =============================================
    %% ADMIN & PLATFORM
    %% =============================================
    
    ADMIN_ACTIONS {
        int id PK
        int admin_id FK
        varchar action_type "approve, reject, suspend, feature"
        varchar target_type "performer, review, booking"
        int target_id
        text reason
        text notes
        datetime created_at
    }
    
    PLATFORM_SETTINGS {
        int id PK
        varchar setting_key UK
        text setting_value
        varchar data_type "string, number, boolean, json"
        text description
        int updated_by FK
        datetime created_at
        datetime updated_at
    }

    %% =============================================
    %% RELATIONSHIPS
    %% =============================================
    
    %% User Type Relationships
    USER_TYPES ||--o{ USERS : "defines user role"
    
    %% User Relationships
    USERS ||--o| PERFORMERS : "user can be performer"
    USERS ||--o{ ENQUIRIES : "client creates enquiries"
    USERS ||--o{ ENQUIRIES : "performer receives enquiries"
    USERS ||--o{ BOOKINGS : "client makes bookings"
    USERS ||--o{ BOOKINGS : "performer receives bookings"
    USERS ||--o{ BOOKINGS : "admin updates bookings"
    USERS ||--o{ TRANSACTIONS : "user has transactions"
    USERS ||--o{ MESSAGES : "user sends messages"
    USERS ||--o{ MESSAGE_THREADS : "client in threads"
    USERS ||--o{ MESSAGE_THREADS : "performer in threads"
    USERS ||--o{ REVIEWS : "user writes reviews"
    USERS ||--o{ REVIEW_VOTES : "user votes on reviews"
    USERS ||--o{ SAVED_PERFORMERS : "client saves performers"
    USERS ||--o{ SEARCH_HISTORY : "user searches"
    USERS ||--o{ ADMIN_ACTIONS : "admin performs actions"
    USERS ||--o{ PLATFORM_SETTINGS : "admin updates settings"
    USERS ||--o{ BOOKING_STATUS_EVENTS : "user changes status"
    
    %% Category Relationships
    CATEGORIES ||--o{ PERFORMER_CATEGORIES : "category has performers"
    CATEGORIES ||--o{ SEARCH_HISTORY : "category searched"
    
    %% Performer Relationships
    PERFORMERS ||--o{ PERFORMER_CATEGORIES : "performer in categories"
    PERFORMERS ||--o{ PERFORMER_MEDIA : "performer has media"
    PERFORMERS ||--o{ PERFORMER_AVAILABILITY : "performer sets availability"
    PERFORMERS ||--o{ PERFORMER_BLACKOUT_DATES : "performer sets blackouts"
    PERFORMERS ||--o{ PERFORMER_PRICING : "performer sets pricing"
    PERFORMERS ||--o{ ENQUIRIES : "performer receives enquiries"
    PERFORMERS ||--o{ BOOKINGS : "performer gets bookings"
    PERFORMERS ||--o{ TRANSACTIONS : "performer receives payouts"
    PERFORMERS ||--o{ REVIEWS : "performer gets reviewed"
    PERFORMERS ||--o{ TESTIMONIALS : "performer has testimonials"
    PERFORMERS ||--o{ SAVED_PERFORMERS : "performer saved by clients"
    
    %% Status Relationships
    ENQUIRY_STATUSES ||--o{ ENQUIRIES : "enquiry has status"
    BOOKING_STATUSES ||--o{ BOOKINGS : "booking has status"
    BOOKING_STATUSES ||--o{ BOOKING_STATUS_EVENTS : "old status"
    BOOKING_STATUSES ||--o{ BOOKING_STATUS_EVENTS : "new status"
    TRANSACTION_TYPES ||--o{ TRANSACTIONS : "transaction has type"
    
    %% Enquiry & Booking Flow
    ENQUIRIES ||--o{ BOOKINGS : "enquiry becomes booking"
    ENQUIRIES ||--o{ MESSAGE_THREADS : "enquiry has messages"
    ENQUIRIES ||--o| REVIEWS : "enquiry gets reviewed"
    
    %% Booking Relationships
    BOOKINGS ||--o{ BOOKING_STATUS_EVENTS : "booking status changes"
    BOOKINGS ||--o{ TRANSACTIONS : "booking has transactions"
    BOOKINGS ||--o{ MESSAGE_THREADS : "booking has messages"
    
    %% Messaging Relationships
    MESSAGE_THREADS ||--o{ MESSAGES : "thread contains messages"
    
    %% Review Relationships
    REVIEWS ||--o{ REVIEW_VOTES : "review gets votes"
```

## Key Relationships Summary

### **Core Entity Relationships**
- **Users** (1) ↔ (0..1) **Performers**: One-to-optional-one
- **Performers** (M) ↔ (N) **Categories**: Many-to-many via `performer_categories`
- **Enquiries** (1) ↔ (0..M) **Bookings**: One enquiry can have multiple booking attempts
- **Bookings** (1) ↔ (M) **Transactions**: One booking has multiple transactions (deposit, payout, fees)

### **Status Tracking**
- **Booking Status Events**: Complete audit trail of all status changes
- **Lookup Tables**: Replace ENUMs for better database portability

### **Stripe Integration Points**
- **Performers**: `stripe_account_id` for Connect accounts
- **Bookings**: Payment intent and customer IDs
- **Transactions**: Transfer and charge IDs for reconciliation

### **Communication Flow**
- **Message Threads**: Linked to either enquiries or bookings
- **Messages**: Support text, files, and system-generated messages
- **Read Status**: Separate tracking for client and performer

### **Business Logic Constraints**
- Each enquiry can only have one review
- Performers must have at least one category (enforced in application)
- Booking status changes are logged with timestamps and reasons
- Platform fee percentage is configurable per booking

This ERD represents the complete data model for your performer booking platform with full booking lifecycle, payment processing, and communication features.

# Multi-Vendor Performer Booking Platform - Data Model

## Overview
This data model supports a comprehensive booking marketplace similar to Poptop.uk.com, enabling clients to browse, compare, and enquire with performers across various entertainment categories.

## Core Entities & Relationships

### 1. Users & Authentication
```
users
├── id (Primary Key)
├── email (Unique)
├── password_hash
├── first_name, last_name
├── phone
├── user_type (client|performer|admin)
├── is_verified, is_active
└── profile_image_url
```

**Purpose**: Central user management for all platform participants (clients, performers, admins).

### 2. Categories (Act Types)
```
categories
├── id (Primary Key)
├── name (e.g., "Magician", "Caricaturist")
├── slug (URL-friendly)
├── description
├── icon_url
├── is_active
└── sort_order
```

**Purpose**: Organizes performers into searchable act types.

### 3. Performer Profiles
```
performers
├── id (Primary Key)
├── user_id (Foreign Key → users)
├── stage_name, bio
├── years_experience
├── base_price, price_currency, price_type
├── travel_radius
├── location (address, city, county, postcode, coordinates)
├── performance_details (duration, setup_time, equipment)
├── business_credentials (insurance, DBS, professional status)
├── platform_metrics (ratings, bookings, response_rate)
└── status_flags (featured, verified, active)
```

**Relationships**:
- `performers.user_id` → `users.id` (One-to-One)
- Many-to-Many with `categories` via `performer_categories`

### 4. Performer Categories (Junction Table)
```
performer_categories
├── performer_id (Foreign Key → performers)
├── category_id (Foreign Key → categories)
└── is_primary (Boolean)
```

**Purpose**: Allows performers to belong to multiple categories with one primary category.

### 5. Media Gallery
```
performer_media
├── id (Primary Key)
├── performer_id (Foreign Key → performers)
├── media_type (image|video|audio)
├── file_url, thumbnail_url
├── title, description
├── is_featured, sort_order
└── file_metadata (size, duration)
```

**Purpose**: Stores performer portfolio images, videos, and audio samples.

### 6. Availability Management
```
performer_availability
├── performer_id (Foreign Key → performers)
├── day_of_week (0-6)
├── start_time, end_time
└── is_available

performer_blackout_dates
├── performer_id (Foreign Key → performers)
├── start_date, end_date
├── reason
└── is_recurring
```

**Purpose**: Manages performer availability and unavailable periods.

## Enquiry & Booking System

### 7. Enquiries
```
enquiries
├── id (Primary Key)
├── client_id (Foreign Key → users)
├── performer_id (Foreign Key → performers)
├── event_details (type, date, time, duration, guest_count)
├── venue_information (name, address, city, postcode)
├── requirements (message, budget_range, special_requirements)
├── status (pending|responded|accepted|declined|cancelled|completed)
├── performer_response, quoted_price
└── timestamps (created, responded, updated)
```

**Purpose**: Handles booking requests from clients to performers.

**Workflow**:
1. Client submits enquiry → `status: pending`
2. Performer responds → `status: responded`
3. Client accepts/declines → `status: accepted/declined`
4. Event completion → `status: completed`

## Review & Rating System

### 8. Reviews
```
reviews
├── id (Primary Key)
├── enquiry_id (Foreign Key → enquiries) [Unique]
├── client_id (Foreign Key → users)
├── performer_id (Foreign Key → performers)
├── rating (1-5), title, review_text
├── event_type, event_date
├── detailed_ratings (professionalism, quality, value, communication)
├── status_flags (verified, featured, visible)
├── performer_response, performer_responded_at
└── timestamps
```

**Purpose**: Enables client feedback and builds performer reputation.

### 9. Review Votes
```
review_votes
├── review_id (Foreign Key → reviews)
├── user_id (Foreign Key → users)
├── is_helpful (Boolean)
└── created_at
```

**Purpose**: Community-driven review helpfulness rating.

## Additional Features

### 10. Testimonials
```
testimonials
├── id (Primary Key)
├── performer_id (Foreign Key → performers)
├── client_name, client_title
├── testimonial_text, event_type
├── status_flags (featured, verified)
└── sort_order
```

**Purpose**: Curated testimonials separate from reviews for marketing purposes.

### 11. Saved Performers (Wishlist)
```
saved_performers
├── client_id (Foreign Key → users)
├── performer_id (Foreign Key → performers)
└── created_at
```

**Purpose**: Allows clients to save favorite performers.

### 12. Search Analytics
```
search_history
├── user_id (Foreign Key → users) [Nullable]
├── session_id
├── search_parameters (query, category, location, price_range)
├── results_count
└── created_at
```

**Purpose**: Analytics for improving search functionality and understanding user behavior.

## Admin & Management

### 13. Admin Actions
```
admin_actions
├── admin_id (Foreign Key → users)
├── action_type (approve_performer|suspend_performer|delete_review|etc.)
├── target_type, target_id
├── reason, notes
└── created_at
```

**Purpose**: Audit trail for administrative actions.

### 14. Platform Settings
```
platform_settings
├── setting_key (Unique)
├── setting_value, setting_type
├── description, is_public
├── updated_by (Foreign Key → users)
└── updated_at
```

**Purpose**: Configurable platform settings and feature flags.

## Search & Filter Implementation

### Supported Search Filters:
1. **Act Type**: Via `performer_categories` → `categories`
2. **Location**: Via `performers.city`, `performers.county`, `performers.postcode`
3. **Price Range**: Via `performers.base_price`
4. **Rating**: Via `performers.average_rating`
5. **Availability**: Via `performer_availability` and `performer_blackout_dates`

### Search Query Examples:
```sql
-- Find magicians in London with rating > 4.0 and price < £500
SELECT p.*, u.first_name, u.last_name, c.name as category
FROM performers p
JOIN users u ON p.user_id = u.id
JOIN performer_categories pc ON p.id = pc.performer_id
JOIN categories c ON pc.category_id = c.id
WHERE c.slug = 'magician'
  AND p.city = 'London'
  AND p.average_rating >= 4.0
  AND p.base_price <= 500
  AND p.is_active = TRUE
  AND p.is_verified = TRUE
ORDER BY p.average_rating DESC, p.total_reviews DESC;
```

## Data Relationships Summary

```
users (1) ←→ (1) performers
performers (M) ←→ (M) categories [via performer_categories]
performers (1) ←→ (M) performer_media
performers (1) ←→ (M) performer_availability
performers (1) ←→ (M) performer_blackout_dates
performers (1) ←→ (M) testimonials
users (1) ←→ (M) enquiries [as client]
performers (1) ←→ (M) enquiries [as performer]
enquiries (1) ←→ (1) reviews
reviews (1) ←→ (M) review_votes
users (M) ←→ (M) performers [via saved_performers]
```

## Implementation Notes

### Database Compatibility:
- Schema uses standard SQL with PostgreSQL-specific features (SERIAL, ENUM)
- Easily adaptable to MySQL, SQLite, or NoSQL databases
- Includes proper indexing for performance optimization

### Low-Code Platform Mapping:
- Each table can be mapped to a collection/entity in platforms like Airtable, Bubble, or Webflow
- Relationships are clearly defined for visual database builders
- Field types are specified for form generation

### Scalability Considerations:
- Proper indexing on search fields
- Separate media storage (URLs only in database)
- Audit trails for compliance
- Soft deletes via status flags rather than hard deletes

This data model provides a solid foundation for building a comprehensive performer booking marketplace with all the features found in platforms like Poptop.uk.com.

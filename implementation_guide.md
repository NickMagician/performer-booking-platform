# Implementation Guide - Performer Booking Platform

## 🏗️ Technical Architecture Overview

This guide connects the database schema, site structure, and user journeys into actionable development specifications.

### Technology Stack Recommendations

**Frontend**:
- **Framework**: Next.js 14+ (React with App Router)
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand or React Query
- **Forms**: React Hook Form + Zod validation
- **Maps**: Google Maps API or Mapbox
- **Media**: Cloudinary or AWS S3 + CloudFront

**Backend**:
- **API**: Next.js API Routes or Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js or Auth0
- **File Storage**: AWS S3 or Cloudinary
- **Email**: SendGrid or AWS SES
- **Search**: Elasticsearch or Algolia (optional)

**Infrastructure**:
- **Hosting**: Vercel, Netlify, or AWS
- **CDN**: CloudFront or Cloudflare
- **Monitoring**: Sentry + Analytics (GA4, Mixpanel)

---

## 📊 Database Schema to Page Mapping

### Homepage Data Requirements

```sql
-- Featured Performers Query
SELECT 
    p.id, p.stage_name, p.base_price, p.average_rating,
    u.first_name, u.last_name, u.profile_image_url,
    c.name as category_name,
    pm.file_url as featured_image
FROM performers p
JOIN users u ON p.user_id = u.id
JOIN performer_categories pc ON p.id = pc.performer_id AND pc.is_primary = true
JOIN categories c ON pc.category_id = c.id
LEFT JOIN performer_media pm ON p.id = pm.performer_id AND pm.is_featured = true
WHERE p.is_featured = true AND p.is_active = true
ORDER BY p.average_rating DESC, p.total_reviews DESC
LIMIT 8;

-- Category Stats Query
SELECT 
    c.id, c.name, c.slug, c.icon_url,
    COUNT(pc.performer_id) as performer_count
FROM categories c
LEFT JOIN performer_categories pc ON c.id = pc.category_id
LEFT JOIN performers p ON pc.performer_id = p.id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug, c.icon_url
ORDER BY c.sort_order, performer_count DESC;

-- Platform Stats Query
SELECT 
    COUNT(DISTINCT p.id) as total_performers,
    COUNT(DISTINCT e.id) as total_bookings,
    AVG(r.rating) as average_rating,
    COUNT(DISTINCT p.id) FILTER (WHERE p.is_verified = true) as verified_performers
FROM performers p
LEFT JOIN enquiries e ON p.id = e.performer_id AND e.status = 'completed'
LEFT JOIN reviews r ON p.id = r.performer_id AND r.is_visible = true;
```

### Search Results Data Requirements

```sql
-- Main Search Query with Filters
SELECT 
    p.id, p.stage_name, p.base_price, p.price_type, p.average_rating, p.total_reviews,
    p.city, p.county, p.latitude, p.longitude, p.is_verified, p.is_featured,
    u.first_name, u.last_name, u.profile_image_url,
    c.name as primary_category,
    pm.file_url as profile_image,
    -- Calculate distance if location provided
    CASE 
        WHEN :user_lat IS NOT NULL AND :user_lng IS NOT NULL THEN
            (6371 * acos(cos(radians(:user_lat)) * cos(radians(p.latitude)) * 
            cos(radians(p.longitude) - radians(:user_lng)) + 
            sin(radians(:user_lat)) * sin(radians(p.latitude))))
        ELSE NULL 
    END as distance_km
FROM performers p
JOIN users u ON p.user_id = u.id
JOIN performer_categories pc ON p.id = pc.performer_id AND pc.is_primary = true
JOIN categories c ON pc.category_id = c.id
LEFT JOIN performer_media pm ON p.id = pm.performer_id AND pm.is_featured = true
WHERE p.is_active = true
    AND (:category_id IS NULL OR pc.category_id = :category_id)
    AND (:min_price IS NULL OR p.base_price >= :min_price)
    AND (:max_price IS NULL OR p.base_price <= :max_price)
    AND (:min_rating IS NULL OR p.average_rating >= :min_rating)
    AND (:location IS NULL OR p.city ILIKE :location OR p.county ILIKE :location)
    AND (:radius_km IS NULL OR 
         (6371 * acos(cos(radians(:user_lat)) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(:user_lng)) + 
          sin(radians(:user_lat)) * sin(radians(p.latitude)))) <= :radius_km)
ORDER BY 
    CASE :sort_by 
        WHEN 'rating' THEN p.average_rating 
        WHEN 'price_low' THEN p.base_price
        WHEN 'distance' THEN distance_km
        ELSE p.average_rating 
    END DESC
LIMIT :limit OFFSET :offset;
```

### Performer Profile Data Requirements

```sql
-- Complete Performer Profile Query
SELECT 
    p.*, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
    STRING_AGG(c.name, ', ') as categories
FROM performers p
JOIN users u ON p.user_id = u.id
LEFT JOIN performer_categories pc ON p.id = pc.performer_id
LEFT JOIN categories c ON pc.category_id = c.id
WHERE p.id = :performer_id AND p.is_active = true
GROUP BY p.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url;

-- Performer Media Query
SELECT * FROM performer_media 
WHERE performer_id = :performer_id 
ORDER BY is_featured DESC, sort_order ASC;

-- Recent Reviews Query
SELECT 
    r.*, u.first_name, u.last_name, u.profile_image_url,
    rv_helpful.helpful_count,
    rv_not_helpful.not_helpful_count
FROM reviews r
JOIN users u ON r.client_id = u.id
LEFT JOIN (
    SELECT review_id, COUNT(*) as helpful_count 
    FROM review_votes 
    WHERE is_helpful = true 
    GROUP BY review_id
) rv_helpful ON r.id = rv_helpful.review_id
LEFT JOIN (
    SELECT review_id, COUNT(*) as not_helpful_count 
    FROM review_votes 
    WHERE is_helpful = false 
    GROUP BY review_id
) rv_not_helpful ON r.id = rv_not_helpful.review_id
WHERE r.performer_id = :performer_id AND r.is_visible = true
ORDER BY r.created_at DESC
LIMIT 10;

-- Availability Query
SELECT * FROM performer_availability 
WHERE performer_id = :performer_id AND is_available = true
ORDER BY day_of_week, start_time;

-- Blackout Dates Query
SELECT * FROM performer_blackout_dates 
WHERE performer_id = :performer_id 
    AND end_date >= CURRENT_DATE
ORDER BY start_date;
```

---

## 🔧 API Endpoint Specifications

### Core API Routes

#### **GET /api/search**
```typescript
interface SearchParams {
  query?: string;
  category?: string;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number; // km
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verified?: boolean;
  featured?: boolean;
  available?: string; // ISO date
  sortBy?: 'rating' | 'price_low' | 'price_high' | 'distance' | 'newest';
  page?: number;
  limit?: number;
}

interface SearchResponse {
  performers: PerformerCard[];
  total: number;
  page: number;
  totalPages: number;
  filters: {
    categories: Category[];
    priceRange: { min: number; max: number };
    locations: string[];
  };
}
```

#### **GET /api/performers/[id]**
```typescript
interface PerformerProfileResponse {
  performer: PerformerProfile;
  media: PerformerMedia[];
  reviews: ReviewWithClient[];
  availability: PerformerAvailability[];
  blackoutDates: PerformerBlackoutDate[];
  testimonials: Testimonial[];
  similarPerformers: PerformerCard[];
}
```

#### **POST /api/enquiries**
```typescript
interface CreateEnquiryRequest {
  performerId: number;
  eventType: string;
  eventDate: string; // ISO date
  eventStartTime?: string;
  eventDuration?: number; // minutes
  guestCount?: number;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venuePostcode?: string;
  message: string;
  budgetMin?: number;
  budgetMax?: number;
  specialRequirements?: string;
  clientDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

interface CreateEnquiryResponse {
  enquiry: Enquiry;
  enquiryId: string;
  estimatedResponse: string; // "within 24 hours"
}
```

---

## 🎨 Component Architecture

### Reusable Components

#### **PerformerCard Component**
```typescript
interface PerformerCardProps {
  performer: {
    id: number;
    stageName: string;
    firstName: string;
    lastName: string;
    profileImage: string;
    category: string;
    rating: number;
    reviewCount: number;
    basePrice: number;
    priceType: string;
    location: string;
    isVerified: boolean;
    isFeatured: boolean;
    distance?: number;
  };
  variant?: 'grid' | 'list' | 'featured';
  showQuickEnquiry?: boolean;
  onSave?: (performerId: number) => void;
  onQuickEnquiry?: (performerId: number) => void;
}

// Usage
<PerformerCard 
  performer={performer} 
  variant="grid"
  showQuickEnquiry={true}
  onSave={handleSavePerformer}
  onQuickEnquiry={handleQuickEnquiry}
/>
```

#### **SearchFilters Component**
```typescript
interface SearchFiltersProps {
  filters: {
    categories: Category[];
    location: string;
    radius: number;
    priceRange: [number, number];
    rating: number;
    verified: boolean;
    available: Date | null;
  };
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  resultCount: number;
}
```

#### **EnquiryForm Component**
```typescript
interface EnquiryFormProps {
  performer: PerformerProfile;
  initialData?: Partial<EnquiryFormData>;
  onSubmit: (data: EnquiryFormData) => Promise<void>;
  onCancel: () => void;
}
```

### Page Components Structure

```
pages/
├── index.tsx                 # Homepage
├── search.tsx               # Search results
├── [category]/
│   └── index.tsx           # Category pages
├── [location]/
│   ├── index.tsx           # Location pages
│   └── [category].tsx      # Location + category pages
├── performer/
│   └── [slug].tsx          # Performer profiles
├── enquiry/
│   ├── [performerId].tsx   # Enquiry form
│   ├── confirmation.tsx    # Enquiry confirmation
│   └── [enquiryId].tsx     # Enquiry status
└── dashboard/
    ├── client.tsx          # Client dashboard
    ├── performer.tsx       # Performer dashboard
    └── admin.tsx           # Admin panel

components/
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Navigation.tsx
├── search/
│   ├── SearchBar.tsx
│   ├── SearchFilters.tsx
│   └── SearchResults.tsx
├── performer/
│   ├── PerformerCard.tsx
│   ├── PerformerProfile.tsx
│   ├── MediaGallery.tsx
│   └── ReviewsList.tsx
├── enquiry/
│   ├── EnquiryForm.tsx
│   ├── EnquiryStatus.tsx
│   └── QuickEnquiry.tsx
└── common/
    ├── Rating.tsx
    ├── PriceDisplay.tsx
    ├── LocationDisplay.tsx
    └── AvailabilityCalendar.tsx
```

---

## 🔐 Authentication & Authorization

### User Roles & Permissions

```typescript
enum UserRole {
  CLIENT = 'client',
  PERFORMER = 'performer',
  ADMIN = 'admin'
}

interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  condition?: (user: User, resource: any) => boolean;
}

const permissions: Record<UserRole, Permission[]> = {
  [UserRole.CLIENT]: [
    { resource: 'enquiry', action: 'create' },
    { resource: 'enquiry', action: 'read', condition: (user, enquiry) => enquiry.clientId === user.id },
    { resource: 'review', action: 'create', condition: (user, review) => review.clientId === user.id },
    { resource: 'performer', action: 'read' },
  ],
  [UserRole.PERFORMER]: [
    { resource: 'performer', action: 'update', condition: (user, performer) => performer.userId === user.id },
    { resource: 'enquiry', action: 'read', condition: (user, enquiry) => enquiry.performerId === user.performerId },
    { resource: 'enquiry', action: 'update', condition: (user, enquiry) => enquiry.performerId === user.performerId },
  ],
  [UserRole.ADMIN]: [
    { resource: '*', action: 'create' },
    { resource: '*', action: 'read' },
    { resource: '*', action: 'update' },
    { resource: '*', action: 'delete' },
  ]
};
```

### Authentication Flow

```typescript
// NextAuth.js configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validate credentials against database
        const user = await validateUser(credentials.email, credentials.password);
        return user ? { 
          id: user.id, 
          email: user.email, 
          role: user.userType,
          name: `${user.firstName} ${user.lastName}`
        } : null;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    }
  }
};
```

---

## 📱 Mobile Optimization

### Responsive Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile-First Components

```typescript
// Mobile-optimized search bar
const MobileSearchBar = () => (
  <div className="sticky top-0 z-50 bg-white shadow-sm p-4 md:hidden">
    <div className="flex gap-2">
      <input 
        className="flex-1 p-3 border rounded-lg"
        placeholder="What are you looking for?"
      />
      <button className="px-4 py-3 bg-blue-600 text-white rounded-lg">
        Search
      </button>
    </div>
  </div>
);

// Mobile performer card
const MobilePerformerCard = ({ performer }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
    <div className="flex gap-3">
      <img 
        src={performer.profileImage} 
        className="w-16 h-16 rounded-lg object-cover"
      />
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{performer.stageName}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            ⭐ {performer.rating}
          </span>
          <span>•</span>
          <span>{performer.location}</span>
        </div>
        <div className="text-lg font-semibold text-blue-600 mt-1">
          From £{performer.basePrice}
        </div>
      </div>
    </div>
    <div className="flex gap-2 mt-3">
      <button className="flex-1 py-2 px-4 border border-blue-600 text-blue-600 rounded-lg text-sm">
        Quick Enquiry
      </button>
      <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm">
        View Profile
      </button>
    </div>
  </div>
);
```

---

## 🚀 Performance Optimization

### Database Optimization

```sql
-- Essential indexes for performance
CREATE INDEX CONCURRENTLY idx_performers_search ON performers 
(is_active, is_verified, average_rating DESC, total_reviews DESC);

CREATE INDEX CONCURRENTLY idx_performers_location ON performers 
USING GIST (ll_to_earth(latitude, longitude));

CREATE INDEX CONCURRENTLY idx_performer_categories_lookup ON performer_categories 
(category_id, performer_id) WHERE is_primary = true;

CREATE INDEX CONCURRENTLY idx_enquiries_status_date ON enquiries 
(status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_reviews_performer_visible ON reviews 
(performer_id, is_visible, created_at DESC);
```

### Caching Strategy

```typescript
// Redis caching for frequently accessed data
const cacheKeys = {
  featuredPerformers: 'featured_performers',
  categories: 'categories_list',
  performerProfile: (id: number) => `performer_${id}`,
  searchResults: (params: string) => `search_${params}`,
};

// Cache implementation
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  },
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};
```

### Image Optimization

```typescript
// Next.js Image component with optimization
const OptimizedImage = ({ src, alt, ...props }) => (
  <Image
    src={src}
    alt={alt}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    priority={props.priority}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    {...props}
  />
);
```

---

## 📊 Analytics & Monitoring

### Key Events to Track

```typescript
// Analytics events
const trackEvent = (event: string, properties: Record<string, any>) => {
  // Google Analytics 4
  gtag('event', event, properties);
  
  // Mixpanel (optional)
  mixpanel.track(event, properties);
};

// User journey events
trackEvent('search_performed', {
  query: searchQuery,
  category: selectedCategory,
  location: userLocation,
  results_count: resultsCount
});

trackEvent('performer_profile_viewed', {
  performer_id: performerId,
  category: performerCategory,
  source: 'search_results'
});

trackEvent('enquiry_submitted', {
  performer_id: performerId,
  event_type: eventType,
  budget_range: budgetRange
});
```

This implementation guide provides the technical foundation needed to build the complete performer booking platform, connecting all the design decisions from the site structure and user journeys to concrete development specifications.

# Performer Booking Platform - Site Structure & User Journey

## 🗺️ Navigation Map & Page Hierarchy

```
📱 MAIN SITE
├── 🏠 Homepage (/)
├── 🔍 Search Results (/search)
├── 📂 Categories
│   ├── All Categories (/categories)
│   ├── Magicians (/magicians)
│   ├── Caricaturists (/caricaturists)
│   ├── Live Music (/live-music)
│   ├── Children's Entertainment (/childrens-entertainment)
│   └── [Other Categories] (/[category-slug])
├── 📍 Location Pages
│   ├── London (/london)
│   ├── Manchester (/manchester)
│   ├── Birmingham (/birmingham)
│   ├── [City]/[Category] (/london/magicians)
│   └── [Regional Pages] (/[location-slug])
├── 👤 Performer Profiles (/performer/[performer-slug])
├── 📝 Enquiry Flow
│   ├── Enquiry Form (/enquiry/[performer-id])
│   ├── Enquiry Confirmation (/enquiry/confirmation)
│   └── Enquiry Status (/enquiry/[enquiry-id])
├── 🔐 Authentication
│   ├── Login (/login)
│   ├── Register (/register)
│   ├── Forgot Password (/forgot-password)
│   └── Email Verification (/verify-email)
├── 📊 User Dashboards
│   ├── Client Dashboard (/dashboard/client)
│   ├── Performer Dashboard (/dashboard/performer)
│   └── Admin Panel (/admin)
├── ℹ️ Static Pages
│   ├── About Us (/about)
│   ├── How It Works (/how-it-works)
│   ├── FAQ (/faq)
│   ├── Terms & Conditions (/terms)
│   ├── Privacy Policy (/privacy)
│   └── Contact (/contact)
└── 📱 Mobile App (Optional)
    ├── Native iOS/Android
    └── Progressive Web App (PWA)
```

## 🎯 Primary User Journeys

### Journey 1: Client Finding & Booking a Performer
```
Homepage → Search/Browse → Results → Performer Profile → Enquiry → Confirmation → Dashboard → Review
```

### Journey 2: Performer Registration & Profile Setup
```
Homepage → Register → Email Verification → Profile Setup → Media Upload → Go Live → Dashboard Management
```

### Journey 3: Admin Content Management
```
Admin Login → Dashboard → Performer Approval → Content Moderation → Analytics → Settings
```

---

## 📄 Detailed Page Specifications

### 🏠 Homepage (/)

**Purpose**: Convert visitors into users through search and discovery

**Key Elements**:
- **Hero Section**
  - Main headline: "Find the Perfect Performer for Your Event"
  - Search bar with location and category dropdowns
  - CTA: "Search Performers" button
  - Background: Hero video/image of performers

- **Search Bar** (Prominent)
  - What: Category dropdown (Magician, Caricaturist, etc.)
  - Where: Location input with autocomplete
  - When: Date picker (optional)
  - Search button

- **Featured Performers** (Carousel)
  - 6-8 top-rated performers
  - Photo, name, category, rating, price from
  - "View Profile" CTAs

- **Browse by Category** (Grid)
  - Visual category cards with icons
  - Performer count per category
  - Links to category pages

- **How It Works** (3-step process)
  - 1. Search & Browse
  - 2. Send Enquiry
  - 3. Book & Enjoy
  - Visual icons and brief descriptions

- **Testimonials** (Social Proof)
  - Client testimonials with photos
  - Star ratings and event types
  - "Read More Reviews" link

- **Popular Locations**
  - Quick links to major cities
  - "Performers in [City]" format

- **Trust Signals**
  - Number of performers
  - Number of successful bookings
  - Average rating
  - "Verified & Insured" badges

**SEO Focus**: Generic entertainment booking keywords

---

### 📂 Category Pages (/[category-slug])

**Purpose**: Category-specific performer discovery with filtering

**URL Examples**:
- `/magicians`
- `/caricaturists`
- `/live-music`

**Key Elements**:
- **Page Header**
  - Category name and description
  - Breadcrumbs: Home > Categories > [Category]
  - Performer count in category

- **Filter Sidebar**
  - Location (with radius slider)
  - Price range (slider)
  - Rating (4+ stars, 5 stars only)
  - Availability (date picker)
  - Special features (Verified, Insured, Featured)
  - Sort options (Rating, Price, Distance, Newest)

- **Performer Grid**
  - Card layout: Photo, name, rating, price, location
  - "Quick Enquiry" and "View Profile" buttons
  - Pagination or infinite scroll

- **Category Information**
  - What to expect from this category
  - Average pricing information
  - Popular event types
  - FAQ section specific to category

- **Featured Section**
  - Top 3 performers in category
  - Special highlighting/badges

**SEO Focus**: Category-specific keywords ("hire magician", "book caricaturist")

---

### 📍 Location Pages (/[location-slug] & /[location]/[category])

**Purpose**: Local SEO and regional performer discovery

**URL Examples**:
- `/london`
- `/london/magicians`
- `/manchester/caricaturists`

**Key Elements**:
- **Local Hero Section**
  - "Performers in [Location]" headline
  - Local landmark imagery
  - Search bar pre-filled with location

- **Local Performers**
  - Grid of performers in the area
  - Distance indicators
  - Local availability

- **Popular Categories in [Location]**
  - Category breakdown for the area
  - Local demand insights

- **Local Content**
  - Popular venues in the area
  - Local event information
  - Regional pricing guides
  - Local testimonials

- **Area Coverage Map**
  - Visual map showing performer coverage
  - Nearby areas served

**SEO Focus**: Local keywords ("magicians in London", "Manchester entertainers")

---

### 👤 Performer Profile Pages (/performer/[performer-slug])

**Purpose**: Detailed performer showcase and enquiry conversion

**Key Elements**:
- **Profile Header**
  - Main profile photo
  - Performer name and stage name
  - Category badges
  - Rating and review count
  - Location and travel radius
  - "Send Enquiry" CTA (prominent)

- **Media Gallery**
  - Photo carousel
  - Video player (if available)
  - Audio samples
  - "View All Media" expandable section

- **About Section**
  - Bio and description
  - Years of experience
  - Special skills/equipment
  - Performance duration options

- **Pricing Information**
  - Starting price display
  - Price type (per hour/event/person)
  - Additional costs information
  - "Get Custom Quote" option

- **Availability Calendar**
  - Visual calendar showing available dates
  - Booking status indicators
  - "Check Availability" feature

- **Reviews & Ratings**
  - Overall rating breakdown
  - Recent reviews with photos
  - Detailed rating categories
  - "Read All Reviews" link
  - Review filtering options

- **Testimonials**
  - Curated client testimonials
  - Event type indicators
  - Client credentials (where available)

- **Technical Details**
  - Setup requirements
  - Equipment provided
  - Space needed
  - Travel radius

- **Trust Indicators**
  - Verification badges
  - Insurance status
  - DBS check status
  - Professional memberships

- **Enquiry Form** (Sticky/Modal)
  - Event details form
  - Quick enquiry option
  - Contact preferences

- **Similar Performers**
  - Recommendations based on category/location
  - "You might also like" section

**Conversion Focus**: Multiple enquiry CTAs throughout the page

---

### 🔍 Search Results Page (/search)

**Purpose**: Filtered performer discovery with comparison features

**Key Elements**:
- **Search Summary**
  - Search query display
  - Results count
  - Applied filters summary
  - "Modify Search" option

- **Advanced Filters** (Sidebar)
  - Category multi-select
  - Location with radius
  - Price range slider
  - Rating filter
  - Availability date picker
  - Special features checkboxes
  - Sort dropdown

- **Results Grid/List**
  - Toggle between grid and list view
  - Performer cards with key info
  - Quick comparison checkboxes
  - Map view toggle

- **Map Integration**
  - Interactive map with performer pins
  - Cluster markers for dense areas
  - Sync with list results

- **Comparison Tool**
  - Side-by-side performer comparison
  - Key metrics comparison
  - "Compare Selected" feature

- **Search Suggestions**
  - Related searches
  - Popular searches in area
  - Category suggestions

- **No Results Handling**
  - Alternative suggestions
  - Expand search radius option
  - Category alternatives
  - "Get Notified" for future matches

---

### 📝 Enquiry Workflow

#### Enquiry Form (/enquiry/[performer-id])
**Key Elements**:
- **Event Details**
  - Event type dropdown
  - Date and time pickers
  - Duration selector
  - Guest count
  - Venue information

- **Requirements**
  - Message text area
  - Budget range slider
  - Special requirements
  - Preferred contact method

- **Contact Information**
  - Client details form
  - Phone number
  - Email address
  - Account creation option

- **Performer Summary**
  - Selected performer card
  - Pricing estimate
  - Availability confirmation

#### Enquiry Confirmation (/enquiry/confirmation)
**Key Elements**:
- **Success Message**
  - Confirmation of enquiry sent
  - Enquiry reference number
  - Expected response time

- **Next Steps**
  - What happens next
  - How to track enquiry
  - Contact information

- **Account Setup**
  - Create account to track enquiries
  - Dashboard access promotion

#### Enquiry Status (/enquiry/[enquiry-id])
**Key Elements**:
- **Status Timeline**
  - Visual progress indicator
  - Status updates
  - Response notifications

- **Messages**
  - Conversation thread
  - Performer responses
  - File attachments

- **Actions**
  - Accept/decline quotes
  - Request modifications
  - Cancel enquiry

---

### 📊 Client Dashboard (/dashboard/client)

**Purpose**: Enquiry management and booking history

**Navigation Tabs**:
- **Active Enquiries**
  - Pending enquiries
  - Status updates
  - Response notifications
  - Quick actions

- **Booking History**
  - Past bookings
  - Event details
  - Performer information
  - Rebooking options

- **Reviews**
  - Pending reviews
  - Review history
  - Review management

- **Saved Performers**
  - Wishlist management
  - Quick enquiry options
  - Availability notifications

- **Account Settings**
  - Profile information
  - Contact preferences
  - Notification settings
  - Password management

**Key Features**:
- Real-time notifications
- Quick enquiry shortcuts
- Booking calendar view
- Spending analytics

---

### 👨‍🎤 Performer Dashboard (/dashboard/performer)

**Purpose**: Profile management and enquiry handling

**Navigation Tabs**:
- **Enquiries**
  - New enquiries (priority)
  - Pending responses
  - Accepted bookings
  - Enquiry history
  - Response templates

- **Calendar**
  - Availability management
  - Booking calendar
  - Blackout dates
  - Recurring availability

- **Profile**
  - Profile editing
  - Media management
  - Pricing updates
  - Bio and description

- **Reviews**
  - New reviews
  - Review responses
  - Review analytics
  - Rating trends

- **Analytics**
  - Profile views
  - Enquiry conversion rates
  - Booking statistics
  - Revenue tracking
  - Performance metrics

- **Account**
  - Personal information
  - Verification status
  - Payment settings
  - Notification preferences

**Key Features**:
- Mobile-optimized for on-the-go management
- Push notifications for new enquiries
- Quick response templates
- Performance insights

---

### 🛠️ Admin Panel (/admin)

**Purpose**: Platform management and content moderation

**Main Sections**:

#### Dashboard Overview
- **Key Metrics**
  - Active performers
  - Monthly enquiries
  - Conversion rates
  - Revenue statistics
  - User growth

- **Recent Activity**
  - New registrations
  - Pending approvals
  - Flagged content
  - System alerts

#### Performer Management
- **Approval Queue**
  - New performer applications
  - Profile verification
  - Document review
  - Approval/rejection workflow

- **Active Performers**
  - Performer list with filters
  - Profile editing
  - Status management
  - Performance metrics

- **Verification**
  - Document management
  - Insurance verification
  - DBS check tracking
  - Professional credentials

#### Content Moderation
- **Reviews**
  - Flagged reviews
  - Review approval
  - Dispute resolution
  - Review analytics

- **Media**
  - Image/video approval
  - Content guidelines enforcement
  - Copyright checks
  - Quality standards

#### Category Management
- **Categories**
  - Add/edit categories
  - Category descriptions
  - Icon management
  - SEO optimization

- **Location Management**
  - Regional settings
  - Location hierarchy
  - Coverage areas

#### User Management
- **Client Accounts**
  - User profiles
  - Account status
  - Support tickets
  - Activity logs

- **Support**
  - Ticket management
  - FAQ management
  - Help documentation

#### Analytics & Reporting
- **Performance Metrics**
  - Platform usage
  - Conversion funnels
  - Revenue reports
  - User behavior

- **SEO Analytics**
  - Search rankings
  - Traffic sources
  - Keyword performance
  - Content optimization

#### System Settings
- **Platform Configuration**
  - Feature flags
  - Payment settings
  - Email templates
  - Notification settings

- **Security**
  - User permissions
  - Access logs
  - Security settings
  - Backup management

---

## 🎨 Wireframe Layouts (Text-Based)

### Homepage Layout
```
+--------------------------------------------------+
|  HEADER: Logo | Categories | Login/Register      |
+--------------------------------------------------+
|                                                  |
|  HERO: "Find Perfect Performer" + Search Bar    |
|  [What] [Where] [When] [SEARCH BUTTON]          |
|                                                  |
+--------------------------------------------------+
|  FEATURED PERFORMERS (Carousel)                 |
|  [Photo] [Photo] [Photo] [Photo] [Photo]        |
|  Name    Name    Name    Name    Name           |
|  ⭐4.9   ⭐4.8   ⭐4.9   ⭐4.7   ⭐4.8          |
+--------------------------------------------------+
|  BROWSE CATEGORIES (Grid)                       |
|  [🎩 Magic] [🎨 Art] [🎵 Music] [🎪 Kids]      |
|  [Comedy]   [Dance]  [DJ]      [More...]        |
+--------------------------------------------------+
|  HOW IT WORKS                                   |
|  1. Search → 2. Enquire → 3. Book              |
+--------------------------------------------------+
|  TESTIMONIALS                                   |
|  "Amazing magician..." - Sarah, London          |
|  ⭐⭐⭐⭐⭐                                      |
+--------------------------------------------------+
|  FOOTER: Links | Social | Contact               |
+--------------------------------------------------+
```

### Performer Profile Layout
```
+--------------------------------------------------+
|  BREADCRUMBS: Home > Magicians > John Smith     |
+--------------------------------------------------+
|  [PROFILE PHOTO] | John Smith "The Amazing"     |
|  [Media Gallery] | ⭐4.9 (127 reviews)         |
|                  | 📍 London (20 mile radius)   |
|                  | [SEND ENQUIRY - PRIMARY CTA] |
+--------------------------------------------------+
|  TABS: About | Media | Reviews | Availability   |
+--------------------------------------------------+
|  ABOUT SECTION                                  |
|  Bio text, experience, specialties...          |
|                                                 |
|  PRICING: From £300 per event                  |
|  Duration: 30-60 minutes                       |
+--------------------------------------------------+
|  RECENT REVIEWS                                 |
|  ⭐⭐⭐⭐⭐ "Fantastic performance..."          |
|  - Emma, Birthday Party, 2 days ago            |
+--------------------------------------------------+
|  AVAILABILITY CALENDAR                          |
|  [Calendar widget showing available dates]     |
+--------------------------------------------------+
|  SIMILAR PERFORMERS                             |
|  [Photo] [Photo] [Photo]                       |
+--------------------------------------------------+
```

### Search Results Layout
```
+--------------------------------------------------+
|  SEARCH BAR (Persistent)                        |
|  [Magicians] [in London] [SEARCH]              |
+--------------------------------------------------+
|  FILTERS     |  RESULTS (47 performers found)   |
|  □ Location  |  [Sort: Rating ▼] [Grid/List]   |
|  □ Price     |                                  |
|  □ Rating    |  [Performer Card] [Performer Card] |
|  □ Features  |  [Photo] Name    [Photo] Name     |
|              |  ⭐4.8 £300+     ⭐4.9 £250+      |
|              |  London          Manchester       |
|              |  [Quick Enquiry] [View Profile]   |
|              |                                  |
|              |  [Performer Card] [Performer Card] |
|              |  ...                             |
+--------------------------------------------------+
|  PAGINATION: ← 1 2 3 4 5 →                     |
+--------------------------------------------------+
```

This comprehensive site structure provides a complete user experience from discovery to booking, with clear conversion paths and administrative oversight. Each page is designed to support the database schema we created while optimizing for user engagement and business goals.

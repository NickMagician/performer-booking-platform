-- Multi-Vendor Performer Booking Platform Database Schema
-- Similar to Poptop.uk.com structure
-- Supports PostgreSQL, MySQL, and other relational databases

-- =============================================
-- CORE ENTITIES
-- =============================================

-- Categories/Act Types Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Magician', 'Caricaturist', 'Singer'
    slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly version
    description TEXT,
    icon_url VARCHAR(500), -- Category icon/image
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (Clients and Performers)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    user_type ENUM('client', 'performer', 'admin') NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Performer Profiles Table
CREATE TABLE performers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stage_name VARCHAR(150),
    bio TEXT,
    years_experience INTEGER,
    base_price DECIMAL(10,2), -- Starting price
    price_currency VARCHAR(3) DEFAULT 'GBP',
    price_type ENUM('per_hour', 'per_event', 'per_person', 'custom') DEFAULT 'per_event',
    travel_radius INTEGER, -- Miles willing to travel
    
    -- Location
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United Kingdom',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Performance details
    min_performance_duration INTEGER, -- Minutes
    max_performance_duration INTEGER, -- Minutes
    setup_time_required INTEGER, -- Minutes
    equipment_provided TEXT, -- What they bring
    space_requirements TEXT, -- What they need from venue
    
    -- Business
    is_professional BOOLEAN DEFAULT FALSE,
    insurance_coverage BOOLEAN DEFAULT FALSE,
    dbs_checked BOOLEAN DEFAULT FALSE,
    
    -- Platform metrics
    total_bookings INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    response_time_hours INTEGER DEFAULT 24,
    
    -- Status
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_completion_percentage INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performer Categories (Many-to-Many)
CREATE TABLE performer_categories (
    id SERIAL PRIMARY KEY,
    performer_id INTEGER NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE, -- One primary category per performer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(performer_id, category_id)
);

-- Media Gallery
CREATE TABLE performer_media (
    id SERIAL PRIMARY KEY,
    performer_id INTEGER NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
    media_type ENUM('image', 'video', 'audio') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    title VARCHAR(200),
    description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    file_size INTEGER, -- Bytes
    duration INTEGER, -- Seconds for video/audio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performer Availability
CREATE TABLE performer_availability (
    id SERIAL PRIMARY KEY,
    performer_id INTEGER NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(performer_id, day_of_week, start_time, end_time)
);

-- Performer Unavailable Dates (holidays, bookings, etc.)
CREATE TABLE performer_blackout_dates (
    id SERIAL PRIMARY KEY,
    performer_id INTEGER NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ENQUIRY SYSTEM
-- =============================================

-- Enquiries/Booking Requests
CREATE TABLE enquiries (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES users(id),
    performer_id INTEGER NOT NULL REFERENCES performers(id),
    
    -- Event Details
    event_type VARCHAR(100), -- Birthday, Wedding, Corporate, etc.
    event_date DATE NOT NULL,
    event_start_time TIME,
    event_duration INTEGER, -- Minutes
    guest_count INTEGER,
    
    -- Location
    venue_name VARCHAR(200),
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_postcode VARCHAR(20),
    
    -- Requirements
    message TEXT NOT NULL,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    special_requirements TEXT,
    
    -- Status
    status ENUM('pending', 'responded', 'accepted', 'declined', 'cancelled', 'completed') DEFAULT 'pending',
    performer_response TEXT,
    quoted_price DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- REVIEWS SYSTEM
-- =============================================

-- Reviews and Ratings
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER NOT NULL REFERENCES enquiries(id),
    client_id INTEGER NOT NULL REFERENCES users(id),
    performer_id INTEGER NOT NULL REFERENCES performers(id),
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT NOT NULL,
    event_type VARCHAR(100),
    event_date DATE,
    
    -- Detailed Ratings
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Performer Response
    performer_response TEXT,
    performer_responded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(enquiry_id) -- One review per enquiry
);

-- Review Helpfulness (like/dislike system)
CREATE TABLE review_votes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    is_helpful BOOLEAN NOT NULL, -- TRUE for helpful, FALSE for not helpful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id)
);

-- =============================================
-- ADMIN SYSTEM
-- =============================================

-- Admin Actions Log
CREATE TABLE admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action_type ENUM('approve_performer', 'suspend_performer', 'delete_review', 'feature_performer', 'moderate_content') NOT NULL,
    target_type ENUM('performer', 'review', 'enquiry', 'user') NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Settings
CREATE TABLE platform_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ADDITIONAL FEATURES
-- =============================================

-- Performer Testimonials (separate from reviews)
CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    performer_id INTEGER NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
    client_name VARCHAR(200) NOT NULL,
    client_title VARCHAR(200), -- e.g., "Event Manager at XYZ Corp"
    testimonial_text TEXT NOT NULL,
    event_type VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Performers (Wishlist)
CREATE TABLE saved_performers (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES users(id),
    performer_id INTEGER NOT NULL REFERENCES performers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, performer_id)
);

-- Search History (for analytics)
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id), -- NULL for anonymous users
    session_id VARCHAR(100),
    search_query VARCHAR(500),
    category_id INTEGER REFERENCES categories(id),
    location VARCHAR(200),
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    results_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- Performer indexes
CREATE INDEX idx_performers_user_id ON performers(user_id);
CREATE INDEX idx_performers_location ON performers(city, county, postcode);
CREATE INDEX idx_performers_rating ON performers(average_rating DESC);
CREATE INDEX idx_performers_price ON performers(base_price);
CREATE INDEX idx_performers_active ON performers(is_active, is_verified);
CREATE INDEX idx_performers_featured ON performers(is_featured, is_active);

-- Category indexes
CREATE INDEX idx_performer_categories_performer ON performer_categories(performer_id);
CREATE INDEX idx_performer_categories_category ON performer_categories(category_id);

-- Enquiry indexes
CREATE INDEX idx_enquiries_client ON enquiries(client_id);
CREATE INDEX idx_enquiries_performer ON enquiries(performer_id);
CREATE INDEX idx_enquiries_status ON enquiries(status);
CREATE INDEX idx_enquiries_date ON enquiries(event_date);

-- Review indexes
CREATE INDEX idx_reviews_performer ON reviews(performer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_visible ON reviews(is_visible, created_at DESC);

-- Media indexes
CREATE INDEX idx_performer_media_performer ON performer_media(performer_id);
CREATE INDEX idx_performer_media_featured ON performer_media(is_featured, sort_order);

-- =============================================
-- BOOKING SYSTEM EXTENSION - SQL MIGRATION
-- Extends the existing performer booking platform schema
-- =============================================

-- First, let's create lookup tables to replace ENUMs for better portability

-- =============================================
-- LOOKUP TABLES (Replacing ENUMs)
-- =============================================

-- User Types Lookup
CREATE TABLE user_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user_types (type_name, description) VALUES 
('client', 'Event organizers who book performers'),
('performer', 'Entertainment professionals offering services'),
('admin', 'Platform administrators with full access');

-- Enquiry Status Lookup
CREATE TABLE enquiry_statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO enquiry_statuses (status_name, description, sort_order) VALUES 
('pending', 'Enquiry sent, awaiting performer response', 1),
('responded', 'Performer has responded to enquiry', 2),
('accepted', 'Client has accepted performer quote', 3),
('declined', 'Enquiry declined by performer or client', 4),
('cancelled', 'Enquiry cancelled by either party', 5),
('completed', 'Event completed successfully', 6);

-- Booking Status Lookup
CREATE TABLE booking_statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO booking_statuses (status_name, description, sort_order) VALUES 
('tentative', 'Booking created but not yet confirmed', 1),
('confirmed', 'Booking confirmed with deposit paid', 2),
('declined', 'Booking declined by performer', 3),
('cancelled', 'Booking cancelled by either party', 4),
('completed', 'Event completed successfully', 5);

-- Transaction Types Lookup
CREATE TABLE transaction_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transaction_types (type_name, description) VALUES 
('payout', 'Payment to performer for completed booking'),
('platform_fee', 'Commission fee retained by platform'),
('refund', 'Refund to client for cancelled booking'),
('chargeback', 'Disputed payment reversal');

-- =============================================
-- PERFORMER SLUG ADDITION
-- =============================================

-- Add slug field to performers table
ALTER TABLE performers 
ADD COLUMN slug VARCHAR(255) UNIQUE,
ADD COLUMN slug_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for slug lookups
CREATE INDEX idx_performers_slug ON performers(slug);

-- Function to generate slug from stage_name or first_name + last_name
CREATE OR REPLACE FUNCTION generate_performer_slug(p_id INTEGER)
RETURNS VARCHAR(255) AS $$
DECLARE
    base_slug VARCHAR(255);
    final_slug VARCHAR(255);
    counter INTEGER := 1;
BEGIN
    -- Get base slug from stage_name or fallback to first_name + last_name
    SELECT 
        CASE 
            WHEN p.stage_name IS NOT NULL AND p.stage_name != '' THEN
                LOWER(REGEXP_REPLACE(p.stage_name, '[^a-zA-Z0-9\s]', '', 'g'))
            ELSE
                LOWER(REGEXP_REPLACE(u.first_name || '-' || u.last_name, '[^a-zA-Z0-9\s-]', '', 'g'))
        END
    INTO base_slug
    FROM performers p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = p_id;
    
    -- Replace spaces with hyphens and clean up
    base_slug := REGEXP_REPLACE(TRIM(base_slug), '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    
    -- Ensure uniqueness
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM performers WHERE slug = final_slug AND id != p_id) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing performers with slugs
UPDATE performers 
SET slug = generate_performer_slug(id),
    slug_updated_at = CURRENT_TIMESTAMP
WHERE slug IS NULL;

-- =============================================
-- PERFORMER PRICING TABLE
-- =============================================

CREATE TABLE performer_pricing (
    id SERIAL PRIMARY KEY,
    performer_id INTEGER NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- wedding, birthday, corporate, etc.
    duration_minutes INTEGER NOT NULL,
    package_name VARCHAR(150) NOT NULL, -- Standard, Deluxe, Premium
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    is_default BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one default per performer per event type
    CONSTRAINT unique_default_per_event_type 
        EXCLUDE (performer_id WITH =, event_type WITH =) 
        WHERE (is_default = TRUE)
);

-- Indexes for performer pricing
CREATE INDEX idx_performer_pricing_performer ON performer_pricing(performer_id);
CREATE INDEX idx_performer_pricing_event_type ON performer_pricing(event_type);
CREATE INDEX idx_performer_pricing_default ON performer_pricing(performer_id, event_type, is_default);

-- =============================================
-- BOOKINGS TABLE
-- =============================================

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL UNIQUE, -- BK-2024-001 format
    enquiry_id INTEGER NOT NULL REFERENCES enquiries(id),
    client_id INTEGER NOT NULL REFERENCES users(id),
    performer_id INTEGER NOT NULL REFERENCES performers(id),
    
    -- Status tracking
    status_id INTEGER NOT NULL REFERENCES booking_statuses(id),
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Pricing details
    price_agreed DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    deposit_amount DECIMAL(10,2),
    deposit_percentage DECIMAL(5,2) DEFAULT 25.00, -- 25% default deposit
    deposit_paid_at TIMESTAMP,
    final_payment_due_at TIMESTAMP,
    
    -- Platform economics
    payout_due_to_performer DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    platform_fee_percentage DECIMAL(5,2) DEFAULT 10.00, -- 10% platform fee
    
    -- Payment integration
    stripe_payment_intent_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_account_id VARCHAR(255), -- Performer's Stripe Connect account
    
    -- Event details (copied from enquiry for immutability)
    event_date DATE NOT NULL,
    event_start_time TIME,
    event_duration INTEGER, -- minutes
    venue_name VARCHAR(200),
    venue_address TEXT,
    
    -- Metadata
    cancellation_reason TEXT,
    special_requirements TEXT,
    internal_notes TEXT, -- Admin notes
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for bookings
CREATE INDEX idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX idx_bookings_enquiry ON bookings(enquiry_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_performer ON bookings(performer_id);
CREATE INDEX idx_bookings_status ON bookings(status_id);
CREATE INDEX idx_bookings_event_date ON bookings(event_date);
CREATE INDEX idx_bookings_stripe_intent ON bookings(stripe_payment_intent_id);

-- Function to generate booking ID
CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_id VARCHAR(50);
    year_part VARCHAR(4);
    counter INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get next counter for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(booking_id FROM 'BK-' || year_part || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO counter
    FROM bookings
    WHERE booking_id LIKE 'BK-' || year_part || '-%';
    
    new_id := 'BK-' || year_part || '-' || LPAD(counter::VARCHAR, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking_id
CREATE OR REPLACE FUNCTION set_booking_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_id IS NULL OR NEW.booking_id = '' THEN
        NEW.booking_id := generate_booking_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_id
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_id();

-- Trigger to calculate platform economics
CREATE OR REPLACE FUNCTION calculate_booking_economics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate platform fee
    NEW.platform_fee := NEW.price_agreed * (NEW.platform_fee_percentage / 100);
    
    -- Calculate payout to performer
    NEW.payout_due_to_performer := NEW.price_agreed - NEW.platform_fee;
    
    -- Calculate deposit amount if not set
    IF NEW.deposit_amount IS NULL THEN
        NEW.deposit_amount := NEW.price_agreed * (NEW.deposit_percentage / 100);
    END IF;
    
    -- Set final payment due date (typically event date - 7 days)
    IF NEW.final_payment_due_at IS NULL THEN
        NEW.final_payment_due_at := NEW.event_date - INTERVAL '7 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_booking_economics
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_booking_economics();

-- =============================================
-- BOOKING STATUS EVENTS TABLE
-- =============================================

CREATE TABLE booking_status_events (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    old_status_id INTEGER REFERENCES booking_statuses(id),
    new_status_id INTEGER NOT NULL REFERENCES booking_statuses(id),
    changed_by INTEGER NOT NULL REFERENCES users(id),
    reason TEXT,
    metadata JSONB, -- Additional context (e.g., payment details, cancellation fees)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for booking status events
CREATE INDEX idx_booking_status_events_booking ON booking_status_events(booking_id);
CREATE INDEX idx_booking_status_events_date ON booking_status_events(created_at DESC);

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        INSERT INTO booking_status_events (
            booking_id, 
            old_status_id, 
            new_status_id, 
            changed_by,
            reason
        ) VALUES (
            NEW.id,
            OLD.status_id,
            NEW.status_id,
            COALESCE(NEW.updated_by, NEW.client_id), -- Fallback to client_id if updated_by not set
            'Status changed via system'
        );
        
        -- Update timestamp fields based on new status
        CASE 
            WHEN NEW.status_id = (SELECT id FROM booking_statuses WHERE status_name = 'confirmed') THEN
                NEW.confirmed_at := CURRENT_TIMESTAMP;
            WHEN NEW.status_id = (SELECT id FROM booking_statuses WHERE status_name = 'cancelled') THEN
                NEW.cancelled_at := CURRENT_TIMESTAMP;
            WHEN NEW.status_id = (SELECT id FROM booking_statuses WHERE status_name = 'completed') THEN
                NEW.completed_at := CURRENT_TIMESTAMP;
            ELSE
                -- No special timestamp handling
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_by field to bookings for tracking who made changes
ALTER TABLE bookings ADD COLUMN updated_by INTEGER REFERENCES users(id);

CREATE TRIGGER trigger_log_booking_status_change
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION log_booking_status_change();

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE, -- TXN-2024-001 format
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    performer_id INTEGER NOT NULL REFERENCES performers(id),
    client_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Transaction details
    type_id INTEGER NOT NULL REFERENCES transaction_types(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    
    -- Payment processor integration
    stripe_transaction_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255), -- For payouts to performers
    stripe_charge_id VARCHAR(255),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, cancelled
    failure_reason TEXT,
    
    -- Metadata
    description TEXT,
    metadata JSONB, -- Additional payment processor data
    
    -- Timestamps
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for transactions
CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_booking ON transactions(booking_id);
CREATE INDEX idx_transactions_performer ON transactions(performer_id);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transactions_type ON transactions(type_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_stripe_transaction ON transactions(stripe_transaction_id);

-- Function to generate transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS VARCHAR(100) AS $$
DECLARE
    new_id VARCHAR(100);
    year_part VARCHAR(4);
    counter INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(transaction_id FROM 'TXN-' || year_part || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO counter
    FROM transactions
    WHERE transaction_id LIKE 'TXN-' || year_part || '-%';
    
    new_id := 'TXN-' || year_part || '-' || LPAD(counter::VARCHAR, 6, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate transaction_id
CREATE OR REPLACE FUNCTION set_transaction_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_id IS NULL OR NEW.transaction_id = '' THEN
        NEW.transaction_id := generate_transaction_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_transaction_id
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transaction_id();

-- =============================================
-- MESSAGES TABLE
-- =============================================

CREATE TABLE message_threads (
    id SERIAL PRIMARY KEY,
    thread_id VARCHAR(100) NOT NULL UNIQUE, -- THR-2024-001 format
    enquiry_id INTEGER REFERENCES enquiries(id),
    booking_id INTEGER REFERENCES bookings(id),
    
    -- Participants
    client_id INTEGER NOT NULL REFERENCES users(id),
    performer_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Thread metadata
    subject VARCHAR(255),
    is_archived BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure thread is linked to either enquiry or booking
    CONSTRAINT check_thread_link CHECK (
        (enquiry_id IS NOT NULL AND booking_id IS NULL) OR 
        (enquiry_id IS NULL AND booking_id IS NOT NULL)
    )
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_user_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Message content
    message_text TEXT NOT NULL,
    attachments JSONB, -- Array of file metadata: [{"url": "...", "filename": "...", "size": 1024}]
    
    -- Status tracking
    is_system_message BOOLEAN DEFAULT FALSE, -- Automated messages (booking confirmations, etc.)
    read_by_client_at TIMESTAMP,
    read_by_performer_at TIMESTAMP,
    
    -- Metadata
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, file, system
    edited_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for messages
CREATE INDEX idx_message_threads_thread_id ON message_threads(thread_id);
CREATE INDEX idx_message_threads_enquiry ON message_threads(enquiry_id);
CREATE INDEX idx_message_threads_booking ON message_threads(booking_id);
CREATE INDEX idx_message_threads_client ON message_threads(client_id);
CREATE INDEX idx_message_threads_performer ON message_threads(performer_id);

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_sender ON messages(sender_user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Function to generate thread ID
CREATE OR REPLACE FUNCTION generate_thread_id()
RETURNS VARCHAR(100) AS $$
DECLARE
    new_id VARCHAR(100);
    year_part VARCHAR(4);
    counter INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(thread_id FROM 'THR-' || year_part || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO counter
    FROM message_threads
    WHERE thread_id LIKE 'THR-' || year_part || '-%';
    
    new_id := 'THR-' || year_part || '-' || LPAD(counter::VARCHAR, 6, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate thread_id
CREATE OR REPLACE FUNCTION set_thread_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.thread_id IS NULL OR NEW.thread_id = '' THEN
        NEW.thread_id := generate_thread_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_thread_id
    BEFORE INSERT ON message_threads
    FOR EACH ROW
    EXECUTE FUNCTION set_thread_id();

-- Trigger to update last_message_at on new messages
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE message_threads 
    SET last_message_at = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.thread_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_last_message();

-- =============================================
-- UPDATE EXISTING TABLES
-- =============================================

-- Update enquiries table to use lookup table instead of ENUM
ALTER TABLE enquiries 
ADD COLUMN status_id INTEGER REFERENCES enquiry_statuses(id);

-- Migrate existing status values
UPDATE enquiries SET status_id = (
    SELECT id FROM enquiry_statuses WHERE status_name = 
    CASE enquiries.status
        WHEN 'pending' THEN 'pending'
        WHEN 'responded' THEN 'responded'
        WHEN 'accepted' THEN 'accepted'
        WHEN 'declined' THEN 'declined'
        WHEN 'cancelled' THEN 'cancelled'
        WHEN 'completed' THEN 'completed'
        ELSE 'pending'
    END
);

-- Make status_id NOT NULL after migration
ALTER TABLE enquiries ALTER COLUMN status_id SET NOT NULL;

-- Update users table to use lookup table instead of ENUM
ALTER TABLE users 
ADD COLUMN user_type_id INTEGER REFERENCES user_types(id);

-- Migrate existing user_type values
UPDATE users SET user_type_id = (
    SELECT id FROM user_types WHERE type_name = users.user_type
);

-- Make user_type_id NOT NULL after migration
ALTER TABLE users ALTER COLUMN user_type_id SET NOT NULL;

-- =============================================
-- VIEWS FOR EASIER QUERYING
-- =============================================

-- Booking summary view with status names
CREATE VIEW booking_summary AS
SELECT 
    b.id,
    b.booking_id,
    b.enquiry_id,
    bs.status_name as status,
    b.price_agreed,
    b.deposit_amount,
    b.payout_due_to_performer,
    b.platform_fee,
    b.event_date,
    b.confirmed_at,
    b.cancelled_at,
    b.completed_at,
    
    -- Client details
    uc.first_name as client_first_name,
    uc.last_name as client_last_name,
    uc.email as client_email,
    
    -- Performer details
    up.first_name as performer_first_name,
    up.last_name as performer_last_name,
    p.stage_name as performer_stage_name,
    p.slug as performer_slug,
    
    b.created_at,
    b.updated_at
FROM bookings b
JOIN booking_statuses bs ON b.status_id = bs.id
JOIN users uc ON b.client_id = uc.id
JOIN users up ON b.performer_id = up.id
JOIN performers p ON b.performer_id = p.id;

-- Transaction summary view
CREATE VIEW transaction_summary AS
SELECT 
    t.id,
    t.transaction_id,
    t.booking_id,
    b.booking_id as booking_reference,
    tt.type_name as transaction_type,
    t.amount,
    t.currency,
    t.status,
    t.stripe_transaction_id,
    
    -- Performer details
    up.first_name as performer_first_name,
    up.last_name as performer_last_name,
    p.stage_name as performer_stage_name,
    
    t.processed_at,
    t.created_at
FROM transactions t
JOIN transaction_types tt ON t.type_id = tt.id
JOIN bookings b ON t.booking_id = b.id
JOIN users up ON t.performer_id = up.id
JOIN performers p ON t.performer_id = p.id;

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample performer pricing
INSERT INTO performer_pricing (performer_id, event_type, duration_minutes, package_name, price, is_default, notes)
SELECT 
    p.id,
    'wedding',
    60,
    'Standard Wedding Package',
    350.00,
    true,
    'Close-up magic during cocktail hour'
FROM performers p
WHERE p.id = 1; -- Assuming performer ID 1 exists

-- Insert sample pricing variations
INSERT INTO performer_pricing (performer_id, event_type, duration_minutes, package_name, price, is_default, notes)
SELECT 
    p.id,
    'wedding',
    90,
    'Deluxe Wedding Package',
    450.00,
    false,
    'Close-up magic + stage performance'
FROM performers p
WHERE p.id = 1;

COMMIT;

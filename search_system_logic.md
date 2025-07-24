# Smart Search & Filter System - Performer Booking Platform

## 🔍 Search System Architecture

### Natural Language Query Processing

The search bar accepts natural language queries and parses them into structured filters:

```javascript
// Query parsing examples
"wedding magician in Manchester" → {
  category: "magician",
  eventType: "wedding", 
  location: "Manchester"
}

"close up magic London under £500" → {
  category: "magician",
  subcategory: "close-up",
  location: "London",
  maxPrice: 500
}

"children's entertainer Birmingham 5 star" → {
  category: "children's entertainment",
  location: "Birmingham", 
  minRating: 5
}
```

### Query Parser Implementation

```javascript
class SearchQueryParser {
  constructor() {
    this.categoryKeywords = {
      'magician': ['magic', 'magician', 'close-up', 'sleight', 'illusion'],
      'caricaturist': ['caricature', 'artist', 'drawing', 'portrait'],
      'live-music': ['band', 'singer', 'musician', 'acoustic', 'guitar'],
      'childrens-entertainment': ['children', 'kids', 'clown', 'puppet']
    };
    
    this.eventKeywords = {
      'wedding': ['wedding', 'bride', 'groom', 'reception', 'ceremony'],
      'birthday': ['birthday', 'party', 'celebration'],
      'corporate': ['corporate', 'business', 'company', 'office'],
      'anniversary': ['anniversary', 'milestone']
    };
    
    this.locationPattern = /\b(in|near|around)\s+([A-Za-z\s]+?)(?:\s|$)/i;
    this.pricePattern = /(?:under|below|less than|<)\s*£?(\d+)|(?:over|above|more than|>)\s*£?(\d+)|£?(\d+)\s*-\s*£?(\d+)/i;
    this.ratingPattern = /(\d+(?:\.\d+)?)\s*star/i;
  }
  
  parse(query) {
    const filters = {};
    const queryLower = query.toLowerCase();
    
    // Extract category
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        filters.category = category;
        break;
      }
    }
    
    // Extract event type
    for (const [event, keywords] of Object.entries(this.eventKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        filters.eventType = event;
        break;
      }
    }
    
    // Extract location
    const locationMatch = query.match(this.locationPattern);
    if (locationMatch) {
      filters.location = locationMatch[2].trim();
    }
    
    // Extract price range
    const priceMatch = query.match(this.pricePattern);
    if (priceMatch) {
      if (priceMatch[1]) filters.maxPrice = parseInt(priceMatch[1]);
      if (priceMatch[2]) filters.minPrice = parseInt(priceMatch[2]);
      if (priceMatch[3] && priceMatch[4]) {
        filters.minPrice = parseInt(priceMatch[3]);
        filters.maxPrice = parseInt(priceMatch[4]);
      }
    }
    
    // Extract rating
    const ratingMatch = query.match(this.ratingPattern);
    if (ratingMatch) {
      filters.minRating = parseFloat(ratingMatch[1]);
    }
    
    return filters;
  }
}
```

## 🎛️ Filter System Design

### Filter Categories & Data Mapping

```javascript
const filterConfig = {
  category: {
    type: 'select',
    label: 'Act Type',
    options: [
      { value: 'magician', label: 'Magicians', count: 127 },
      { value: 'caricaturist', label: 'Caricaturists', count: 89 },
      { value: 'live-music', label: 'Live Music', count: 203 },
      { value: 'childrens-entertainment', label: "Children's Entertainment", count: 156 },
      { value: 'dj', label: 'DJs', count: 178 },
      { value: 'comedian', label: 'Comedians', count: 67 }
    ],
    dbMapping: 'categories.slug'
  },
  
  location: {
    type: 'location-search',
    label: 'Location',
    placeholder: 'City, postcode, or area',
    radius: {
      type: 'slider',
      min: 5,
      max: 100,
      default: 25,
      unit: 'miles'
    },
    dbMapping: ['performers.city', 'performers.county', 'performers.postcode']
  },
  
  priceRange: {
    type: 'range-slider',
    label: 'Price Range',
    min: 0,
    max: 2000,
    step: 50,
    default: [200, 800],
    format: '£{value}',
    dbMapping: 'performers.base_price'
  },
  
  rating: {
    type: 'star-select',
    label: 'Minimum Rating',
    options: [
      { value: 4.5, label: '4.5+ stars', icon: '⭐⭐⭐⭐⭐' },
      { value: 4.0, label: '4+ stars', icon: '⭐⭐⭐⭐' },
      { value: 3.5, label: '3.5+ stars', icon: '⭐⭐⭐' },
      { value: 0, label: 'Any rating', icon: '' }
    ],
    dbMapping: 'performers.average_rating'
  },
  
  availability: {
    type: 'date-picker',
    label: 'Available On',
    placeholder: 'Select event date',
    dbMapping: ['performer_availability', 'performer_blackout_dates']
  },
  
  eventType: {
    type: 'checkbox-group',
    label: 'Event Type',
    options: [
      { value: 'wedding', label: 'Weddings' },
      { value: 'birthday', label: 'Birthday Parties' },
      { value: 'corporate', label: 'Corporate Events' },
      { value: 'anniversary', label: 'Anniversaries' },
      { value: 'children', label: "Children's Parties" }
    ],
    dbMapping: 'performer_specialties.event_type'
  },
  
  features: {
    type: 'checkbox-group',
    label: 'Features',
    options: [
      { value: 'verified', label: 'Verified Performers', icon: '✓' },
      { value: 'insured', label: 'Fully Insured', icon: '🛡️' },
      { value: 'featured', label: 'Featured Performers', icon: '⭐' },
      { value: 'instant-quote', label: 'Instant Quote', icon: '⚡' }
    ],
    dbMapping: {
      'verified': 'performers.is_verified',
      'insured': 'performers.insurance_coverage',
      'featured': 'performers.is_featured'
    }
  }
};
```

### Database Query Builder

```sql
-- Dynamic search query with all filters
WITH filtered_performers AS (
  SELECT DISTINCT
    p.id, p.stage_name, p.base_price, p.price_type, p.average_rating, p.total_reviews,
    p.city, p.county, p.latitude, p.longitude, p.is_verified, p.is_featured,
    u.first_name, u.last_name, u.profile_image_url,
    c.name as primary_category, c.slug as category_slug,
    pm.file_url as profile_image,
    -- Distance calculation
    CASE 
      WHEN :user_lat IS NOT NULL AND :user_lng IS NOT NULL THEN
        (6371 * acos(cos(radians(:user_lat)) * cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(:user_lng)) + 
        sin(radians(:user_lat)) * sin(radians(p.latitude))))
      ELSE NULL 
    END as distance_km,
    -- Availability check
    CASE 
      WHEN :event_date IS NOT NULL THEN
        NOT EXISTS (
          SELECT 1 FROM performer_blackout_dates pbd 
          WHERE pbd.performer_id = p.id 
            AND :event_date BETWEEN pbd.start_date AND pbd.end_date
        )
      ELSE TRUE
    END as is_available
  FROM performers p
  JOIN users u ON p.user_id = u.id
  JOIN performer_categories pc ON p.id = pc.performer_id AND pc.is_primary = true
  JOIN categories c ON pc.category_id = c.id
  LEFT JOIN performer_media pm ON p.id = pm.performer_id AND pm.is_featured = true
  WHERE p.is_active = true
    -- Category filter
    AND (:category IS NULL OR c.slug = :category)
    -- Price range filter
    AND (:min_price IS NULL OR p.base_price >= :min_price)
    AND (:max_price IS NULL OR p.base_price <= :max_price)
    -- Rating filter
    AND (:min_rating IS NULL OR p.average_rating >= :min_rating)
    -- Location filter (text search)
    AND (:location IS NULL OR 
         p.city ILIKE '%' || :location || '%' OR 
         p.county ILIKE '%' || :location || '%' OR
         p.postcode ILIKE '%' || :location || '%')
    -- Verification filter
    AND (:verified IS NULL OR p.is_verified = :verified)
    -- Insurance filter
    AND (:insured IS NULL OR p.insurance_coverage = :insured)
    -- Featured filter
    AND (:featured IS NULL OR p.is_featured = :featured)
),
-- Add radius filter if coordinates provided
distance_filtered AS (
  SELECT *
  FROM filtered_performers
  WHERE (:radius_km IS NULL OR distance_km IS NULL OR distance_km <= :radius_km)
    AND (:event_date IS NULL OR is_available = true)
)
SELECT *
FROM distance_filtered
ORDER BY 
  CASE :sort_by 
    WHEN 'rating' THEN average_rating 
    WHEN 'price_low' THEN base_price
    WHEN 'price_high' THEN -base_price
    WHEN 'distance' THEN distance_km
    WHEN 'newest' THEN -id
    ELSE average_rating 
  END DESC,
  total_reviews DESC
LIMIT :limit OFFSET :offset;

-- Get total count for pagination
SELECT COUNT(*) as total_count
FROM distance_filtered;

-- Get filter counts for UI
SELECT 
  c.slug,
  c.name,
  COUNT(DISTINCT p.id) as performer_count
FROM categories c
LEFT JOIN performer_categories pc ON c.id = pc.category_id
LEFT JOIN performers p ON pc.performer_id = p.id AND p.is_active = true
WHERE (:location IS NULL OR 
       p.city ILIKE '%' || :location || '%' OR 
       p.county ILIKE '%' || :location || '%')
GROUP BY c.slug, c.name
ORDER BY performer_count DESC;
```

## 🎨 Search Results UI Components

### Filter State Management

```javascript
class SearchFilters {
  constructor() {
    this.filters = {
      query: '',
      category: null,
      location: '',
      radius: 25,
      priceRange: [0, 2000],
      rating: 0,
      availability: null,
      eventType: [],
      features: []
    };
    
    this.activeFilters = new Set();
  }
  
  updateFilter(key, value) {
    this.filters[key] = value;
    
    if (this.hasValue(key, value)) {
      this.activeFilters.add(key);
    } else {
      this.activeFilters.delete(key);
    }
    
    this.updateURL();
    this.triggerSearch();
  }
  
  hasValue(key, value) {
    if (value === null || value === '' || value === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (key === 'priceRange' && value[0] === 0 && value[1] === 2000) return false;
    return true;
  }
  
  removeFilter(key) {
    const defaultValues = {
      query: '',
      category: null,
      location: '',
      radius: 25,
      priceRange: [0, 2000],
      rating: 0,
      availability: null,
      eventType: [],
      features: []
    };
    
    this.updateFilter(key, defaultValues[key]);
  }
  
  getFilterTags() {
    const tags = [];
    
    if (this.filters.category) {
      tags.push({
        key: 'category',
        label: this.getCategoryLabel(this.filters.category),
        removable: true
      });
    }
    
    if (this.filters.location) {
      tags.push({
        key: 'location',
        label: `📍 ${this.filters.location}`,
        removable: true
      });
    }
    
    if (this.filters.priceRange[0] > 0 || this.filters.priceRange[1] < 2000) {
      tags.push({
        key: 'priceRange',
        label: `£${this.filters.priceRange[0]} - £${this.filters.priceRange[1]}`,
        removable: true
      });
    }
    
    if (this.filters.rating > 0) {
      tags.push({
        key: 'rating',
        label: `${this.filters.rating}+ stars`,
        removable: true
      });
    }
    
    this.filters.features.forEach(feature => {
      tags.push({
        key: 'features',
        value: feature,
        label: this.getFeatureLabel(feature),
        removable: true
      });
    });
    
    return tags;
  }
  
  updateURL() {
    const params = new URLSearchParams();
    
    Object.entries(this.filters).forEach(([key, value]) => {
      if (this.hasValue(key, value)) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else if (key === 'priceRange') {
          params.set('min_price', value[0]);
          params.set('max_price', value[1]);
        } else {
          params.set(key, value);
        }
      }
    });
    
    const newURL = `/search?${params.toString()}`;
    window.history.pushState({}, '', newURL);
  }
}
```

## 📱 Mobile-First UI Design

### Responsive Filter Layout

```javascript
// Mobile filter toggle component
const MobileFilters = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  
  return (
    <div className="lg:hidden">
      {/* Filter Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full p-4 bg-white border-b"
      >
        <span className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5" />
          Filters
          {activeFilters.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFilters.length}
            </span>
          )}
        </span>
        <ChevronRightIcon className="w-5 h-5" />
      </button>
      
      {/* Filter Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button onClick={() => setIsOpen(false)}>
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4 space-y-6 overflow-y-auto">
            <FilterSection title="Act Type" />
            <FilterSection title="Location" />
            <FilterSection title="Price Range" />
            <FilterSection title="Rating" />
            <FilterSection title="Features" />
          </div>
          
          <div className="sticky bottom-0 p-4 bg-white border-t">
            <div className="flex gap-3">
              <button 
                onClick={clearFilters}
                className="flex-1 py-3 border border-gray-300 rounded-lg"
              >
                Clear All
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🔗 SEO-Friendly URL Structure

### URL Pattern Examples

```
/search                           # General search
/search?q=wedding+magician        # Query search
/magicians                        # Category page
/magicians/manchester             # Category + location
/magicians/manchester?price=200-500 # With filters
/search?category=magician&location=london&rating=4.5 # Full filters
```

### URL Generation Logic

```javascript
class SEOUrlGenerator {
  generateSearchURL(filters) {
    const { category, location, ...otherFilters } = filters;
    
    // Clean SEO URLs for common patterns
    if (category && location && Object.keys(otherFilters).length === 0) {
      return `/${this.slugify(category)}/${this.slugify(location)}`;
    }
    
    if (category && Object.keys(otherFilters).length === 0) {
      return `/${this.slugify(category)}`;
    }
    
    // Fallback to query parameters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== '' && value !== 0) {
        params.set(key, value);
      }
    });
    
    return `/search?${params.toString()}`;
  }
  
  parseURL(pathname, searchParams) {
    const pathParts = pathname.split('/').filter(Boolean);
    const filters = {};
    
    // Parse clean URLs
    if (pathParts.length === 1 && pathParts[0] !== 'search') {
      // Category page: /magicians
      filters.category = pathParts[0];
    } else if (pathParts.length === 2) {
      // Category + location: /magicians/manchester
      filters.category = pathParts[0];
      filters.location = pathParts[1].replace('-', ' ');
    }
    
    // Parse query parameters
    for (const [key, value] of searchParams.entries()) {
      if (key === 'min_price' || key === 'max_price') {
        if (!filters.priceRange) filters.priceRange = [0, 2000];
        if (key === 'min_price') filters.priceRange[0] = parseInt(value);
        if (key === 'max_price') filters.priceRange[1] = parseInt(value);
      } else if (value.includes(',')) {
        filters[key] = value.split(',');
      } else {
        filters[key] = value;
      }
    }
    
    return filters;
  }
  
  slugify(text) {
    return text.toLowerCase()
               .replace(/[^a-z0-9 -]/g, '')
               .replace(/\s+/g, '-')
               .replace(/-+/g, '-');
  }
}
```

This comprehensive search system provides intelligent query parsing, flexible filtering, mobile-optimized UI, and SEO-friendly URLs while maintaining high performance through optimized database queries and caching strategies.

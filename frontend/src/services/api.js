// API service layer for performer booking platform
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Base API client
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, { originalError: error });
    }
  }

  get(endpoint, params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      }
    });
    
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient();

// API endpoints
export const performersApi = {
  // Search performers with filters
  search: (filters) => {
    const params = {
      q: filters.query,
      category: filters.category,
      location: filters.location,
      price_min: filters.priceMin,
      price_max: filters.priceMax,
      rating: filters.rating,
      features: filters.features,
      sort: filters.sortBy,
      page: filters.page,
      limit: 12
    };
    
    return apiClient.get('/performers/search', params);
  },

  // Get performer by slug
  getBySlug: (slug) => apiClient.get(`/performers/slug/${slug}`),

  // Get performer details by ID
  getById: (id) => apiClient.get(`/performers/${id}`),

  // Get performer media
  getMedia: (performerId) => apiClient.get(`/performers/${performerId}/media`),

  // Get performer reviews
  getReviews: (performerId, page = 1) => 
    apiClient.get(`/performers/${performerId}/reviews`, { page, limit: 10 }),

  // Get performer availability
  getAvailability: (performerId, month) => 
    apiClient.get(`/performers/${performerId}/availability`, { month }),

  // Get performer pricing
  getPricing: (performerId) => apiClient.get(`/performers/${performerId}/pricing`),

  // Get featured performers
  getFeatured: (limit = 8) => apiClient.get('/performers/featured', { limit }),

  // Get performers by category
  getByCategory: (categorySlug, filters = {}) => {
    const params = {
      ...filters,
      category: categorySlug,
      page: filters.page || 1,
      limit: 12
    };
    return apiClient.get('/performers/search', params);
  },

  // Get performers by category and location
  getByCategoryAndLocation: (categorySlug, locationSlug, filters = {}) => {
    const params = {
      ...filters,
      category: categorySlug,
      location: locationSlug,
      page: filters.page || 1,
      limit: 12
    };
    return apiClient.get('/performers/search', params);
  }
};

export const categoriesApi = {
  // Get all categories
  getAll: () => apiClient.get('/categories'),

  // Get category by slug
  getBySlug: (slug) => apiClient.get(`/categories/slug/${slug}`),

  // Get category with performer count
  getWithCounts: () => apiClient.get('/categories/with-counts'),

  // Get featured categories
  getFeatured: () => apiClient.get('/categories/featured')
};

export const locationsApi = {
  // Get popular locations
  getPopular: () => apiClient.get('/locations/popular'),

  // Search locations
  search: (query) => apiClient.get('/locations/search', { q: query }),

  // Get location by slug
  getBySlug: (slug) => apiClient.get(`/locations/slug/${slug}`)
};

export const enquiriesApi = {
  // Create enquiry
  create: (enquiryData) => apiClient.post('/enquiries', enquiryData),

  // Get enquiry by ID
  getById: (id) => apiClient.get(`/enquiries/${id}`),

  // Update enquiry status
  updateStatus: (id, status) => apiClient.put(`/enquiries/${id}/status`, { status })
};

export const reviewsApi = {
  // Get reviews for performer
  getByPerformer: (performerId, page = 1) => 
    apiClient.get(`/reviews/performer/${performerId}`, { page, limit: 10 }),

  // Create review
  create: (reviewData) => apiClient.post('/reviews', reviewData),

  // Vote on review helpfulness
  vote: (reviewId, isHelpful) => 
    apiClient.post(`/reviews/${reviewId}/vote`, { isHelpful })
};

// Mock data for development (when backend is not available)
export const mockData = {
  performers: [
    {
      id: 1,
      slug: 'ben-williams-magician-manchester',
      stage_name: 'Ben Williams',
      user: {
        first_name: 'Ben',
        last_name: 'Williams'
      },
      bio: 'Professional close-up magician specializing in weddings and corporate events',
      years_experience: 8,
      base_price: 350.00,
      city: 'Manchester',
      county: 'Greater Manchester',
      average_rating: 4.9,
      total_reviews: 127,
      total_bookings: 245,
      is_featured: true,
      is_verified: true,
      categories: [
        { id: 1, name: 'Magicians', slug: 'magicians' }
      ],
      media: [
        {
          id: 1,
          media_type: 'image',
          file_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          is_featured: true
        }
      ]
    },
    {
      id: 2,
      slug: 'sarah-jones-caricaturist-london',
      stage_name: 'Sarah Jones',
      user: {
        first_name: 'Sarah',
        last_name: 'Jones'
      },
      bio: 'Award-winning caricaturist bringing laughter to events across London',
      years_experience: 12,
      base_price: 275.00,
      city: 'London',
      county: 'Greater London',
      average_rating: 4.8,
      total_reviews: 89,
      total_bookings: 156,
      is_featured: true,
      is_verified: true,
      categories: [
        { id: 2, name: 'Caricaturists', slug: 'caricaturists' }
      ],
      media: [
        {
          id: 2,
          media_type: 'image',
          file_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
          is_featured: true
        }
      ]
    }
  ],

  categories: [
    { id: 1, name: 'Magicians', slug: 'magicians', performer_count: 45, icon_url: '🎩' },
    { id: 2, name: 'Caricaturists', slug: 'caricaturists', performer_count: 32, icon_url: '🎨' },
    { id: 3, name: 'Singers', slug: 'singers', performer_count: 67, icon_url: '🎤' },
    { id: 4, name: 'DJs', slug: 'djs', performer_count: 89, icon_url: '🎧' },
    { id: 5, name: 'Bands', slug: 'bands', performer_count: 23, icon_url: '🎸' }
  ],

  locations: [
    { name: 'London', slug: 'london', performer_count: 156 },
    { name: 'Manchester', slug: 'manchester', performer_count: 78 },
    { name: 'Birmingham', slug: 'birmingham', performer_count: 65 },
    { name: 'Leeds', slug: 'leeds', performer_count: 43 },
    { name: 'Liverpool', slug: 'liverpool', performer_count: 38 }
  ]
};

// Mock API functions (fallback when backend is not available)
export const mockApi = {
  performers: {
    search: async (filters) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      let results = [...mockData.performers];
      
      // Filter by category
      if (filters.category) {
        results = results.filter(p => 
          p.categories.some(c => c.slug === filters.category)
        );
      }
      
      // Filter by location
      if (filters.location) {
        results = results.filter(p => 
          p.city.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      
      // Filter by query
      if (filters.query) {
        const query = filters.query.toLowerCase();
        results = results.filter(p => 
          p.stage_name.toLowerCase().includes(query) ||
          p.bio.toLowerCase().includes(query)
        );
      }
      
      // Filter by price
      if (filters.priceMin) {
        results = results.filter(p => p.base_price >= parseFloat(filters.priceMin));
      }
      if (filters.priceMax) {
        results = results.filter(p => p.base_price <= parseFloat(filters.priceMax));
      }
      
      // Filter by rating
      if (filters.rating) {
        results = results.filter(p => p.average_rating >= parseFloat(filters.rating));
      }
      
      return {
        results,
        total: results.length,
        page: filters.page || 1,
        totalPages: Math.ceil(results.length / 12)
      };
    },

    getBySlug: async (slug) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const performer = mockData.performers.find(p => p.slug === slug);
      if (!performer) {
        throw new ApiError('Performer not found', 404);
      }
      return performer;
    },

    getFeatured: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockData.performers.filter(p => p.is_featured);
    }
  },

  categories: {
    getAll: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockData.categories;
    },

    getBySlug: async (slug) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const category = mockData.categories.find(c => c.slug === slug);
      if (!category) {
        throw new ApiError('Category not found', 404);
      }
      return category;
    }
  },

  locations: {
    getPopular: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockData.locations;
    }
  }
};

// Export the appropriate API based on environment
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true' || true; // Default to mock for development

export const api = USE_MOCK_API ? mockApi : {
  performers: performersApi,
  categories: categoriesApi,
  locations: locationsApi,
  enquiries: enquiriesApi,
  reviews: reviewsApi
};

export default api;

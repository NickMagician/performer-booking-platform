import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Search context
const SearchContext = createContext();

// Initial search state
const initialState = {
  query: '',
  category: '',
  location: '',
  priceMin: '',
  priceMax: '',
  rating: '',
  features: [],
  sortBy: 'relevance',
  page: 1,
  isLoading: false,
  results: [],
  totalResults: 0,
  filters: {
    categories: [],
    locations: [],
    priceRanges: [
      { label: 'Under £100', min: 0, max: 100 },
      { label: '£100 - £250', min: 100, max: 250 },
      { label: '£250 - £500', min: 250, max: 500 },
      { label: '£500 - £1000', min: 500, max: 1000 },
      { label: 'Over £1000', min: 1000, max: null }
    ],
    ratings: [
      { label: '4.5+ stars', value: 4.5 },
      { label: '4+ stars', value: 4.0 },
      { label: '3.5+ stars', value: 3.5 },
      { label: '3+ stars', value: 3.0 }
    ],
    availableFeatures: [
      'verified',
      'insured',
      'dbs_checked',
      'professional',
      'featured',
      'instant_booking'
    ]
  }
};

// Search reducer
function searchReducer(state, action) {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload, page: 1 };
    
    case 'SET_CATEGORY':
      return { ...state, category: action.payload, page: 1 };
    
    case 'SET_LOCATION':
      return { ...state, location: action.payload, page: 1 };
    
    case 'SET_PRICE_RANGE':
      return { 
        ...state, 
        priceMin: action.payload.min, 
        priceMax: action.payload.max,
        page: 1 
      };
    
    case 'SET_RATING':
      return { ...state, rating: action.payload, page: 1 };
    
    case 'TOGGLE_FEATURE':
      const features = state.features.includes(action.payload)
        ? state.features.filter(f => f !== action.payload)
        : [...state.features, action.payload];
      return { ...state, features, page: 1 };
    
    case 'SET_SORT':
      return { ...state, sortBy: action.payload, page: 1 };
    
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_RESULTS':
      return { 
        ...state, 
        results: action.payload.results,
        totalResults: action.payload.total,
        isLoading: false 
      };
    
    case 'CLEAR_FILTERS':
      return {
        ...state,
        query: '',
        category: '',
        location: '',
        priceMin: '',
        priceMax: '',
        rating: '',
        features: [],
        page: 1
      };
    
    case 'SET_FROM_URL':
      return { ...state, ...action.payload, page: 1 };
    
    default:
      return state;
  }
}

// URL parsing utilities
function parseUrlToFilters(pathname, searchParams) {
  const filters = {};
  
  // Parse category and location from pathname
  const pathParts = pathname.split('/').filter(Boolean);
  
  if (pathParts.length >= 1 && pathParts[0] !== 'search') {
    filters.category = pathParts[0];
  }
  
  if (pathParts.length >= 2) {
    filters.location = pathParts[1];
  }
  
  // Parse query parameters
  const query = searchParams.get('q') || '';
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';
  const rating = searchParams.get('rating') || '';
  const features = searchParams.get('features')?.split(',').filter(Boolean) || [];
  const sortBy = searchParams.get('sort') || 'relevance';
  const page = parseInt(searchParams.get('page')) || 1;
  
  return {
    ...filters,
    query,
    priceMin,
    priceMax,
    rating,
    features,
    sortBy,
    page
  };
}

function filtersToUrl(filters, basePath = '/search') {
  const { category, location, query, priceMin, priceMax, rating, features, sortBy, page } = filters;
  
  // Build pathname
  let pathname = basePath;
  if (category && location) {
    pathname = `/${category}/${location}`;
  } else if (category) {
    pathname = `/${category}`;
  }
  
  // Build search params
  const params = new URLSearchParams();
  
  if (query) params.set('q', query);
  if (priceMin) params.set('price_min', priceMin);
  if (priceMax) params.set('price_max', priceMax);
  if (rating) params.set('rating', rating);
  if (features.length > 0) params.set('features', features.join(','));
  if (sortBy !== 'relevance') params.set('sort', sortBy);
  if (page > 1) params.set('page', page);
  
  const search = params.toString();
  return pathname + (search ? `?${search}` : '');
}

// Search provider component
export function SearchProvider({ children }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Update URL when filters change
  useEffect(() => {
    const url = filtersToUrl(state);
    if (location.pathname + location.search !== url) {
      navigate(url, { replace: true });
    }
  }, [state.query, state.category, state.location, state.priceMin, state.priceMax, 
      state.rating, state.features, state.sortBy, state.page]);
  
  // Parse URL on location change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlFilters = parseUrlToFilters(location.pathname, searchParams);
    
    // Only update if filters have actually changed
    const hasChanged = Object.keys(urlFilters).some(key => {
      if (key === 'features') {
        return JSON.stringify(state[key]) !== JSON.stringify(urlFilters[key]);
      }
      return state[key] !== urlFilters[key];
    });
    
    if (hasChanged) {
      dispatch({ type: 'SET_FROM_URL', payload: urlFilters });
    }
  }, [location.pathname, location.search]);
  
  // Action creators
  const actions = {
    setQuery: (query) => dispatch({ type: 'SET_QUERY', payload: query }),
    setCategory: (category) => dispatch({ type: 'SET_CATEGORY', payload: category }),
    setLocation: (location) => dispatch({ type: 'SET_LOCATION', payload: location }),
    setPriceRange: (min, max) => dispatch({ type: 'SET_PRICE_RANGE', payload: { min, max } }),
    setRating: (rating) => dispatch({ type: 'SET_RATING', payload: rating }),
    toggleFeature: (feature) => dispatch({ type: 'TOGGLE_FEATURE', payload: feature }),
    setSort: (sortBy) => dispatch({ type: 'SET_SORT', payload: sortBy }),
    setPage: (page) => dispatch({ type: 'SET_PAGE', payload: page }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setResults: (results, total) => dispatch({ type: 'SET_RESULTS', payload: { results, total } }),
    clearFilters: () => dispatch({ type: 'CLEAR_FILTERS' }),
    
    // Helper to build search URL
    getSearchUrl: (overrides = {}) => filtersToUrl({ ...state, ...overrides })
  };
  
  return (
    <SearchContext.Provider value={{ state, actions }}>
      {children}
    </SearchContext.Provider>
  );
}

// Custom hook to use search context
export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

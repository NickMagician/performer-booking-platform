import React, { useState } from 'react';
import { useSearch } from '../context/SearchContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const SearchFilters = ({ isOpen, onToggle, className = '' }) => {
  const { state, actions } = useSearch();
  const [localPriceMin, setLocalPriceMin] = useState(state.priceMin);
  const [localPriceMax, setLocalPriceMax] = useState(state.priceMax);

  // Fetch categories and locations for filter options
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.getAll
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: api.locations.getPopular
  });

  const handlePriceChange = () => {
    actions.setPriceRange(localPriceMin, localPriceMax);
  };

  const handleClearFilters = () => {
    actions.clearFilters();
    setLocalPriceMin('');
    setLocalPriceMax('');
  };

  const activeFiltersCount = [
    state.category,
    state.location,
    state.priceMin || state.priceMax,
    state.rating,
    state.features.length > 0
  ].filter(Boolean).length;

  return (
    <div className={`search-filters ${className}`}>
      {/* Mobile filter toggle */}
      <div className="filter-header md:hidden">
        <button
          onClick={onToggle}
          className="filter-toggle-btn"
          aria-expanded={isOpen}
        >
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="filter-count">{activeFiltersCount}</span>
          )}
          <svg
            className={`filter-chevron ${isOpen ? 'rotate-180' : ''}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Filter content */}
      <div className={`filter-content ${isOpen ? 'open' : 'closed'}`}>
        {/* Active filters */}
        {activeFiltersCount > 0 && (
          <div className="active-filters">
            <div className="active-filters-header">
              <span className="active-filters-title">Active Filters</span>
              <button
                onClick={handleClearFilters}
                className="clear-all-btn"
              >
                Clear All
              </button>
            </div>
            <div className="active-filters-list">
              {state.category && (
                <div className="filter-tag">
                  <span>Category: {state.category}</span>
                  <button onClick={() => actions.setCategory('')}>×</button>
                </div>
              )}
              {state.location && (
                <div className="filter-tag">
                  <span>Location: {state.location}</span>
                  <button onClick={() => actions.setLocation('')}>×</button>
                </div>
              )}
              {(state.priceMin || state.priceMax) && (
                <div className="filter-tag">
                  <span>
                    Price: £{state.priceMin || '0'} - £{state.priceMax || '∞'}
                  </span>
                  <button onClick={() => actions.setPriceRange('', '')}>×</button>
                </div>
              )}
              {state.rating && (
                <div className="filter-tag">
                  <span>{state.rating}+ stars</span>
                  <button onClick={() => actions.setRating('')}>×</button>
                </div>
              )}
              {state.features.map(feature => (
                <div key={feature} className="filter-tag">
                  <span>{feature.replace('_', ' ')}</span>
                  <button onClick={() => actions.toggleFeature(feature)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="filter-group">
          <h3 className="filter-title">Category</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="category"
                value=""
                checked={!state.category}
                onChange={(e) => actions.setCategory(e.target.value)}
              />
              <span>All Categories</span>
            </label>
            {categories.map(category => (
              <label key={category.id} className="filter-option">
                <input
                  type="radio"
                  name="category"
                  value={category.slug}
                  checked={state.category === category.slug}
                  onChange={(e) => actions.setCategory(e.target.value)}
                />
                <span>
                  {category.icon_url && <span className="category-icon">{category.icon_url}</span>}
                  {category.name}
                  {category.performer_count && (
                    <span className="count">({category.performer_count})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Location filter */}
        <div className="filter-group">
          <h3 className="filter-title">Location</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="location"
                value=""
                checked={!state.location}
                onChange={(e) => actions.setLocation(e.target.value)}
              />
              <span>All Locations</span>
            </label>
            {locations.map(location => (
              <label key={location.slug} className="filter-option">
                <input
                  type="radio"
                  name="location"
                  value={location.slug}
                  checked={state.location === location.slug}
                  onChange={(e) => actions.setLocation(e.target.value)}
                />
                <span>
                  {location.name}
                  {location.performer_count && (
                    <span className="count">({location.performer_count})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price range filter */}
        <div className="filter-group">
          <h3 className="filter-title">Price Range</h3>
          <div className="price-inputs">
            <div className="price-input-group">
              <label htmlFor="price-min">Min Price</label>
              <div className="price-input-wrapper">
                <span className="currency">£</span>
                <input
                  id="price-min"
                  type="number"
                  placeholder="0"
                  value={localPriceMin}
                  onChange={(e) => setLocalPriceMin(e.target.value)}
                  onBlur={handlePriceChange}
                  onKeyPress={(e) => e.key === 'Enter' && handlePriceChange()}
                />
              </div>
            </div>
            <div className="price-separator">to</div>
            <div className="price-input-group">
              <label htmlFor="price-max">Max Price</label>
              <div className="price-input-wrapper">
                <span className="currency">£</span>
                <input
                  id="price-max"
                  type="number"
                  placeholder="∞"
                  value={localPriceMax}
                  onChange={(e) => setLocalPriceMax(e.target.value)}
                  onBlur={handlePriceChange}
                  onKeyPress={(e) => e.key === 'Enter' && handlePriceChange()}
                />
              </div>
            </div>
          </div>
          
          {/* Quick price ranges */}
          <div className="quick-price-ranges">
            {state.filters.priceRanges.map((range, index) => (
              <button
                key={index}
                className={`price-range-btn ${
                  state.priceMin == range.min && state.priceMax == range.max ? 'active' : ''
                }`}
                onClick={() => actions.setPriceRange(range.min, range.max)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating filter */}
        <div className="filter-group">
          <h3 className="filter-title">Minimum Rating</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="rating"
                value=""
                checked={!state.rating}
                onChange={(e) => actions.setRating(e.target.value)}
              />
              <span>Any Rating</span>
            </label>
            {state.filters.ratings.map(rating => (
              <label key={rating.value} className="filter-option">
                <input
                  type="radio"
                  name="rating"
                  value={rating.value}
                  checked={state.rating == rating.value}
                  onChange={(e) => actions.setRating(e.target.value)}
                />
                <span>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`star ${i < rating.value ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {rating.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Features filter */}
        <div className="filter-group">
          <h3 className="filter-title">Features</h3>
          <div className="filter-options">
            {state.filters.availableFeatures.map(feature => (
              <label key={feature} className="filter-option checkbox">
                <input
                  type="checkbox"
                  checked={state.features.includes(feature)}
                  onChange={() => actions.toggleFeature(feature)}
                />
                <span className="checkmark"></span>
                <span className="feature-label">
                  {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort options */}
        <div className="filter-group">
          <h3 className="filter-title">Sort By</h3>
          <select
            value={state.sortBy}
            onChange={(e) => actions.setSort(e.target.value)}
            className="sort-select"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;

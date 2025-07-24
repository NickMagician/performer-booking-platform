import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '../context/SearchContext';
import api from '../services/api';

// Components
import SearchFilters from '../components/SearchFilters';
import PerformerCard from '../components/PerformerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const { state, actions } = useSearch();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Set category in search context when component mounts
  useEffect(() => {
    if (categorySlug && state.category !== categorySlug) {
      actions.setCategory(categorySlug);
    }
  }, [categorySlug, state.category, actions]);

  // Fetch category data
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError
  } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => api.categories.getBySlug(categorySlug),
    enabled: !!categorySlug
  });

  // Fetch performers in this category
  const {
    data: searchResults,
    isLoading: performersLoading,
    error: performersError
  } = useQuery({
    queryKey: ['performers', 'category', categorySlug, state],
    queryFn: () => api.performers.getByCategory(categorySlug, {
      location: state.location,
      priceMin: state.priceMin,
      priceMax: state.priceMax,
      rating: state.rating,
      features: state.features,
      sortBy: state.sortBy,
      page: state.page
    }),
    enabled: !!categorySlug
  });

  // Update results in context when data changes
  useEffect(() => {
    if (searchResults) {
      actions.setResults(searchResults.results, searchResults.total);
    }
  }, [searchResults]);

  // Handle page change
  const handlePageChange = (page) => {
    actions.setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLoading = categoryLoading || performersLoading;
  const error = categoryError || performersError;
  const results = searchResults?.results || [];
  const totalResults = searchResults?.total || 0;
  const totalPages = searchResults?.totalPages || 0;

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Loading {categorySlug} performers...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Category Not Found</h2>
          <p>Sorry, we couldn't find the category you're looking for.</p>
          <Link to="/categories" className="btn btn-primary">
            Browse All Categories
          </Link>
        </div>
      </div>
    );
  }

  const getResultsText = () => {
    if (performersLoading) return 'Loading...';
    if (totalResults === 0) return `No ${category.name.toLowerCase()} found`;
    if (totalResults === 1) return `1 ${category.name.toLowerCase().slice(0, -1)} found`;
    return `${totalResults.toLocaleString()} ${category.name.toLowerCase()} found`;
  };

  return (
    <div className="category-page">
      {/* Category header */}
      <div className="category-header">
        <div className="container">
          <div className="category-header-content">
            <div className="category-info">
              {category.icon_url && (
                <div className="category-icon">{category.icon_url}</div>
              )}
              <div className="category-text">
                <h1 className="category-title">{category.name}</h1>
                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}
                <p className="category-subtitle">{getResultsText()}</p>
              </div>
            </div>

            {/* Breadcrumbs */}
            <nav className="breadcrumbs">
              <Link to="/" className="breadcrumb-link">Home</Link>
              <span className="breadcrumb-separator">›</span>
              <Link to="/categories" className="breadcrumb-link">Categories</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">{category.name}</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="category-layout">
          {/* Sidebar filters */}
          <aside className="category-sidebar">
            <SearchFilters
              isOpen={filtersOpen}
              onToggle={() => setFiltersOpen(!filtersOpen)}
              className="desktop-filters"
            />
          </aside>

          {/* Main content */}
          <main className="category-main">
            {/* Mobile filters */}
            <div className="mobile-filters md:hidden">
              <SearchFilters
                isOpen={filtersOpen}
                onToggle={() => setFiltersOpen(!filtersOpen)}
                className="mobile-filters-content"
              />
            </div>

            {/* Results header */}
            <div className="results-header">
              <div className="results-info">
                <span className="results-count">{getResultsText()}</span>
                {state.page > 1 && (
                  <span className="page-info">
                    Page {state.page} of {totalPages}
                  </span>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="sort-controls">
                <label htmlFor="sort-select" className="sort-label">
                  Sort by:
                </label>
                <select
                  id="sort-select"
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

            {/* Loading state */}
            {performersLoading && (
              <div className="loading-container">
                <LoadingSpinner />
                <p>Finding {category.name.toLowerCase()} for you...</p>
              </div>
            )}

            {/* Error state */}
            {performersError && (
              <div className="error-container">
                <div className="error-message">
                  <h3>Oops! Something went wrong</h3>
                  <p>We couldn't load the {category.name.toLowerCase()}. Please try again.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Results grid */}
            {!performersLoading && !performersError && (
              <>
                {results.length > 0 ? (
                  <>
                    <div className="results-grid">
                      {results.map((performer) => (
                        <PerformerCard
                          key={performer.id}
                          performer={performer}
                          className="result-card"
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pagination-container">
                        <Pagination
                          currentPage={state.page}
                          totalPages={totalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  /* No results */
                  <div className="no-results">
                    <div className="no-results-content">
                      <div className="no-results-icon">
                        {category.icon_url || '🎭'}
                      </div>
                      <h3>No {category.name.toLowerCase()} found</h3>
                      <p>
                        We couldn't find any {category.name.toLowerCase()} matching your criteria.
                        Try adjusting your filters to see more results.
                      </p>
                      
                      <div className="no-results-suggestions">
                        <h4>Suggestions:</h4>
                        <ul>
                          <li>Remove location or price filters</li>
                          <li>Lower the minimum rating requirement</li>
                          <li>Try a nearby location</li>
                          <li>Browse other categories</li>
                        </ul>
                      </div>

                      <div className="no-results-actions">
                        <button
                          onClick={() => {
                            actions.setLocation('');
                            actions.setPriceRange('', '');
                            actions.setRating('');
                          }}
                          className="btn btn-primary"
                        >
                          Clear Filters
                        </button>
                        <Link to="/categories" className="btn btn-secondary">
                          Browse Categories
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;

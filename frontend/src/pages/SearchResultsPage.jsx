import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '../context/SearchContext';
import api from '../services/api';

// Components
import SearchFilters from '../components/SearchFilters';
import PerformerCard from '../components/PerformerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const SearchResultsPage = () => {
  const { state, actions } = useSearch();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch search results
  const {
    data: searchResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['performers', 'search', state],
    queryFn: () => api.performers.search(state),
    enabled: true,
    keepPreviousData: true
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

  const results = searchResults?.results || [];
  const totalResults = searchResults?.total || 0;
  const totalPages = searchResults?.totalPages || 0;

  // Build page title based on filters
  const getPageTitle = () => {
    const parts = [];
    
    if (state.category) {
      parts.push(state.category.charAt(0).toUpperCase() + state.category.slice(1));
    }
    
    if (state.location) {
      parts.push(`in ${state.location.charAt(0).toUpperCase() + state.location.slice(1)}`);
    }
    
    if (state.query) {
      parts.push(`matching "${state.query}"`);
    }
    
    if (parts.length === 0) {
      return 'All Performers';
    }
    
    return parts.join(' ');
  };

  const getResultsText = () => {
    if (isLoading) return 'Searching...';
    if (totalResults === 0) return 'No performers found';
    if (totalResults === 1) return '1 performer found';
    return `${totalResults.toLocaleString()} performers found`;
  };

  return (
    <div className="search-results-page">
      {/* Page header */}
      <div className="search-header">
        <div className="container">
          <div className="search-header-content">
            <h1 className="search-title">{getPageTitle()}</h1>
            <p className="search-subtitle">{getResultsText()}</p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="search-layout">
          {/* Sidebar filters */}
          <aside className="search-sidebar">
            <SearchFilters
              isOpen={filtersOpen}
              onToggle={() => setFiltersOpen(!filtersOpen)}
              className="desktop-filters"
            />
          </aside>

          {/* Main content */}
          <main className="search-main">
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
            {isLoading && (
              <div className="loading-container">
                <LoadingSpinner />
                <p>Finding the perfect performers for you...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="error-container">
                <div className="error-message">
                  <h3>Oops! Something went wrong</h3>
                  <p>We couldn't load the search results. Please try again.</p>
                  <button
                    onClick={() => refetch()}
                    className="btn btn-primary"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Results grid */}
            {!isLoading && !error && (
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
                      <div className="no-results-icon">🔍</div>
                      <h3>No performers found</h3>
                      <p>
                        We couldn't find any performers matching your criteria.
                        Try adjusting your filters or search terms.
                      </p>
                      
                      <div className="no-results-suggestions">
                        <h4>Suggestions:</h4>
                        <ul>
                          <li>Remove some filters to see more results</li>
                          <li>Try a different location or expand your search area</li>
                          <li>Check your spelling in the search box</li>
                          <li>Browse by category instead</li>
                        </ul>
                      </div>

                      <div className="no-results-actions">
                        <button
                          onClick={actions.clearFilters}
                          className="btn btn-primary"
                        >
                          Clear All Filters
                        </button>
                        <a href="/categories" className="btn btn-secondary">
                          Browse Categories
                        </a>
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

export default SearchResultsPage;
